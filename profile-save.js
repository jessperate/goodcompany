(function(root) {
  'use strict';
  const aboutKeys=['first_name','last_name','bio','links','work_history','published'];
  const canonical=value=>JSON.stringify(value && typeof value==='object' ? Array.isArray(value) ? value.map(v=>JSON.parse(canonical(v))) : Object.fromEntries(Object.keys(value).sort().map(k=>[k,JSON.parse(canonical(value[k]))])) : value);
  const same=(a,b)=>canonical(a)===canonical(b);
  function changes(values, original, scope='all') {
    const keys=scope==='jobs' ? ['recommended_jobs'] : scope==='creatives' ? [] : scope==='about' ? aboutKeys : [...aboutKeys,'recommended_jobs'];
    return Object.fromEntries(keys.filter(k=>!same(values[k],original?.[k])).map(k=>[k,values[k]]));
  }
  function fileError(file) {
    if (!file) return '';
    if (file.size>20*1024*1024) return 'Choose an image under 20 MB. We’ll resize it for your profile.';
    const supported=['image/jpeg','image/png','image/webp','image/heic','image/heif'];
    if (!supported.includes(file.type) && !(file.type==='' && /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name))) return 'Choose a JPG, PNG, WebP, or HEIC photo.';
    return '';
  }
  async function prepareImage(file) {
    const invalid=fileError(file); if(invalid) throw new Error(invalid);
    // Image decoding also works in browsers without createImageBitmap (including older Safari).
    const url=URL.createObjectURL(file), image=new Image();
    try {
      await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(new Error('The photo took too long to open. Try a smaller JPG or PNG.')),15000);
        image.onload=()=>{clearTimeout(timeout);resolve();};
        image.onerror=()=>{clearTimeout(timeout);reject(new Error('This browser couldn’t open that photo. Export it as JPG or PNG and try again.'));};
        image.src=url;
      });
      const ratio=Math.min(1,1024/Math.max(image.naturalWidth,image.naturalHeight)), canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio)); canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
      const context=canvas.getContext('2d'); if(!context) throw new Error('This browser couldn’t prepare the photo. Try another browser.');
      context.drawImage(image,0,0,canvas.width,canvas.height);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Couldn’t prepare that photo. Try a JPG or PNG.')),'image/webp',.9));
      if(!['image/webp','image/png','image/jpeg'].includes(blob.type) || blob.size>5242880) throw new Error('The resized photo is too large. Try a smaller JPG or PNG.');
      return blob;
    } finally { URL.revokeObjectURL(url); }
  }
  async function persist({client,userId,patch,creativeIds=null,file,removePhoto=false,prepare=prepareImage,isCurrent=()=>true}) {
    const check=()=>{if(!isCurrent()) throw new Error('Your sign-in changed. Sign in again to keep saving.');};
    async function read() {
      check();
      const {data,error}=await client.from('goodcompany_profiles').select('*').eq('user_id',userId).single();
      if(error) throw error; check(); return data;
    }
    async function write(values,ids=null) {
      check();
      const {error}=await client.rpc('goodcompany_save_profile',{profile_data:values,creative_ids:ids});
      if(error) throw error;
      const saved=await read();
      if(Object.keys(values).some(k=>!same(saved[k],values[k]))) throw new Error('We couldn’t confirm your changes were saved. Your draft is still here; please try again.');
      return saved;
    }
    // Commit text first: photo decoding, storage, or format errors must never discard a bio.
    let profile=await write(patch,creativeIds), photoError=null;
    if(file || removePhoto) {
      const oldPath=profile.avatar_path;
      try {
        let path=null;
        if(file) {
          const blob=await prepare(file); check();
          const ext={'image/webp':'webp','image/png':'png','image/jpeg':'jpg'}[blob.type];
          if(!ext) throw new Error('Please choose a JPG or PNG photo.');
          path=`${userId}/${crypto.randomUUID()}.${ext}`;
          const {error}=await client.storage.from('goodcompany-headshots').upload(path,blob,{contentType:blob.type,upsert:false});
          if(error) throw error;
        }
        profile=await write({avatar_path:path});
        if(oldPath && oldPath!==path) client.storage.from('goodcompany-headshots').remove([oldPath]).catch(()=>{});
      } catch(error) { check(); photoError=error; }
    }
    return {profile,photoError};
  }
  function errorMessage(error) {
    const code=String(error?.code || error?.statusCode || error?.status || '');
    if(code==='42501'||code==='401'||code==='403'||code==='PGRST301') return 'Please sign in again, then retry. Your draft is still here.';
    if(code==='23514') return 'One field is over its limit. Check your name, bio, links, and workplace details; your draft is still here.';
    if(code==='23503') return 'A recommended creative is no longer available. Remove them and try again; your draft is still here.';
    const message=String(error?.message || '');
    if(/^(Choose |This browser |The photo |The resized |Couldn’t prepare |Please choose |We couldn’t confirm |Your sign-in )/.test(message)) return message;
    return 'Couldn’t finish saving. Check your connection and try again. Your draft is still here.';
  }
  function drafts(storage) {
    const key=id=>'goodcompany-profile-draft:'+id;
    return {
      put(id,data) {try {storage.setItem(key(id),JSON.stringify({expires:Date.now()+7*86400000,data}));return true;}catch{return false;}},
      get(id) {try {const item=JSON.parse(storage.getItem(key(id))||'null');if(item?.expires>Date.now())return item.data;storage.removeItem(key(id));}catch{}return null;},
      clear(id) {try{storage.removeItem(key(id));}catch{}}
    };
  }
  const api={changes,fileError,prepareImage,persist,errorMessage,drafts};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.GoodCompanyProfileSave=api;
})(typeof window==='undefined'?globalThis:window);
