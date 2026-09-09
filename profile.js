(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const account = window.GoodCompanyAccount, client = account.client;
  const form = $('profile-form'), fields = form.elements;
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const networkFields = ['website','email','linkedin','x','youtube','instagram','github'];
  const names = {website:'Website',email:'Email',linkedin:'LinkedIn',x:'X',youtube:'YouTube',instagram:'Instagram',github:'GitHub'};
  const icons = {website:'global-line',email:'mail-line',linkedin:'linkedin-box-line',x:'twitter-x-line',youtube:'youtube-line',instagram:'instagram-line',github:'github-line'};
  const jobMap = new Map(JOBS.map(job=>[job.id,job]));
  const requestedId = new URLSearchParams(location.search).get('id');
  const validId = id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
  let profile = null, owner = false, initializedKey = '', generation = 0, searchGeneration = 0, timer;
  let editing = false, savedJobIds = [], savedCreativeIds = [];
  let jobIds = [], creativeIds = [], creativeMap = new Map(), dirty = false, saving = false, removePhoto = false, previewUrl = null;
  const status = message => { $('profile-status').textContent=message; };
  const fullName = p => [p.first_name,p.last_name].filter(Boolean).join(' ') || 'Creative';
  const markDirty = () => { dirty=true; $('save-hint').textContent='Unsaved changes'; };
  const linkPrefixes = {website:'https://',linkedin:'https://linkedin.com/in/',x:'https://x.com/',youtube:'https://youtube.com/@',instagram:'https://instagram.com/',github:'https://github.com/'};
  function normalizeProfileLink(value, key) {
    const text=String(value || '').trim();
    if (!text) return '';
    if (key==='email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : null;
    if (/\s/.test(text)) return null;
    let candidate=text;
    if (!/^https?:\/\//i.test(candidate)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) return null;
      const bare=candidate.replace(/^\/\//,'');
      const isDomain=/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/:?#]|$)/i.test(bare);
      const platformDomain=/^(?:www\.)?(?:linkedin\.com|x\.com|twitter\.com|youtube\.com|youtu\.be|instagram\.com|github\.com)(?:[/?#]|$)/i.test(bare);
      candidate=(key==='website' ? isDomain : platformDomain) ? 'https://'+bare : key==='website' ? 'https://'+bare : linkPrefixes[key]+bare.replace(/^@/,'');
    }
    try {
      const url=new URL(candidate);
      if (!['http:','https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) return null;
      return url.href;
    } catch { return null; }
  }
  function safeLink(value, key) {
    const link=normalizeProfileLink(value,key);
    return link ? (key==='email' ? 'mailto:'+link : link) : null;
  }
  function inputLink(value,key) {
    const prefix=linkPrefixes[key];
    return prefix && value?.startsWith(prefix) ? value.slice(prefix.length) : value || '';
  }
  function jobContent(id) {
    const job=jobMap.get(id);
    return job ? `<span class="rec-company">${esc(job.company)}</span><a class="rec-title" href="./?job=${encodeURIComponent(id)}#directory">${esc(job.title)}</a>` : '<span class="rec-title">This job is no longer listed</span>';
  }
  function creativeContent(id) {
    const person=creativeMap.get(id);
    return person ? `<a class="rec-title" href="profile.html?id=${encodeURIComponent(id)}">${esc(fullName(person))}</a>` : '<span class="rec-title">Profile is no longer public</span>';
  }
  function controls(kind,index,length) {
    return `<div class="rec-controls"><button type="button" data-kind="${kind}" data-index="${index}" data-action="up" aria-label="Move recommendation ${index+1} up" ${index===0?'disabled':''}><i class="ri-arrow-up-line" aria-hidden="true"></i></button><button type="button" data-kind="${kind}" data-index="${index}" data-action="down" aria-label="Move recommendation ${index+1} down" ${index===length-1?'disabled':''}><i class="ri-arrow-down-line" aria-hidden="true"></i></button><button type="button" data-kind="${kind}" data-index="${index}" data-action="remove" aria-label="Remove recommendation ${index+1}"><i class="ri-close-line" aria-hidden="true"></i> Remove</button></div>`;
  }
  function renderRecommendations() {
    for (const [kind,ids,content] of [['job',jobIds,jobContent],['creative',creativeIds,creativeContent]]) {
      $(`${kind}-recommendations`).innerHTML=ids.map((id,i)=>`<li><div>${content(id)}${controls(kind,i,ids.length)}</div></li>`).join('');
      $(`${kind}-count`).textContent=ids.length ? `${ids.length} / 10 selected · Use arrows to reorder. Save profile to keep changes.` : '0 / 10 selected · Your list starts here.';
      $(`${kind}-search`).disabled=ids.length>=10;
    }
  }
  function renderPins() {
    $('private-pins').hidden=!owner;
    if (!owner) return;
    const pins=account.getPins();
    $('profile-pins').innerHTML=pins.length ? pins.map(pin=>`<article><p>${esc(pin.company)}</p><h3><a href="./?job=${encodeURIComponent(pin.job_id)}#directory">${esc(pin.title)}</a></h3><button type="button" class="pin-job" data-pin="${esc(pin.job_id)}" aria-label="Unpin ${esc(pin.title)}" aria-pressed="true">Pinned</button></article>`).join('') : '<p class="no-picks">No pins yet. <a href="./#directory">Find your next thing.</a></p>';
    account.refreshButtons();
  }
  function readWork() {
    return [...document.querySelectorAll('.work-row')].map(row=>Object.fromEntries([...row.querySelectorAll('input')].map(input=>[input.dataset.field,input.value.trim()])));
  }
  function renderWork(rows) {
    $('work-editor').innerHTML=rows.map((row,i)=>`<div class="work-row"><label>Company<input data-field="company" value="${esc(row.company)}" maxlength="160" required aria-label="Workplace ${i+1} company"></label><div class="field-grid"><label>Role<input data-field="role" value="${esc(row.role)}" maxlength="160" aria-label="Workplace ${i+1} role"></label><label>Years<input data-field="years" value="${esc(row.years)}" maxlength="80" placeholder="2021–2024" aria-label="Workplace ${i+1} years"></label></div><button class="work-remove" type="button" data-work="${i}">Remove workplace ${i+1}</button></div>`).join('');
    $('add-work').disabled=rows.length>=20;
  }
  async function showHeadshot(path, imageId, placeholderId, token) {
    if (!path) return;
    const {data,error}=await client.storage.from('goodcompany-headshots').createSignedUrl(path,3600);
    if (token!==generation || error || !data || !$(imageId)) return;
    if (imageId === 'edit-headshot' && ($('headshot').files.length || removePhoto)) return;
    $(imageId).src=data.signedUrl; $(imageId).hidden=false;
    if (placeholderId) $(placeholderId).hidden=true;
  }
  function renderSavedOwner(token) {
    editing=false;
    form.hidden=true;
    $('cancel-edit').hidden=true;
    renderPublic(profile,token);
    $('edit-profile').hidden=false;
    $('copy-profile').hidden=!profile.published;
    $('profile-signout').hidden=false;
    status(profile.published ? 'Your saved profile · Public' : 'Your saved profile · Private');
    renderPins();
  }
  function renderOwner(p, token) {
    editing=true;
    $('public-profile').hidden=true;
    $('edit-profile').hidden=true;
    $('cancel-edit').hidden=!p.user_id;
    ++searchGeneration; clearTimeout(timer);
    for (const kind of ['job','creative']) { $(`${kind}-search`).value=''; $(`${kind}-matches`).innerHTML=''; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl=null;
    $('page-title').textContent='Your corner of the internet.';
    for (const key of ['first_name','last_name','bio']) fields.namedItem(key).value=p[key] || '';
    for (const key of networkFields) fields.namedItem(key).value=inputLink(p.links?.[key],key);
    fields.namedItem('published').checked=Boolean(p.published);
    renderWork(p.work_history || []); renderRecommendations();
    $('edit-headshot').hidden=true; $('headshot-placeholder').hidden=false;
    $('remove-headshot').hidden=!p.avatar_path;
    $('headshot').value=''; removePhoto=false;
    showHeadshot(p.avatar_path,'edit-headshot','headshot-placeholder',token);
    $('profile-form').hidden=false;
    $('copy-profile').hidden=!p.published;
    $('profile-signout').hidden=false;
    $('save-hint').textContent=p.published?'Your profile is public.':'Private until you publish.';
    status(p.user_id ? 'Your profile, your people, your next chapter.' : 'Make yourself at home. Fill in your details and save your profile.');
    renderPins();
  }
  function renderPublic(p, token) {
    const name=fullName(p); $('page-title').textContent=name; document.title=`${name} — Good Company`;
    const links=networkFields.map(key=>{ const href=safeLink(p.links?.[key],key); return href ? `<a href="${esc(href)}" ${key==='email'?'':'target="_blank" rel="noopener noreferrer"'}><i class="ri-${icons[key]}" aria-hidden="true"></i>${names[key]}</a>` : ''; }).join('');
    $('profile-details').innerHTML=`<div class="headshot-frame"><img id="public-headshot" alt="${esc(name)}" hidden><span id="public-placeholder" aria-hidden="true">:)</span></div><h2>Hello, I’m ${esc(p.first_name)}.</h2><p class="profile-bio">${esc(p.bio || 'Good things are taking shape here.')}</p><div class="profile-socials">${links}</div><h2>Places I’ve made things.</h2>${(p.work_history || []).map(row=>`<div class="public-work"><h3>${esc(row.company)}</h3><p>${esc(row.role)}</p><small>${esc(row.years)}</small></div>`).join('') || '<p>Work history coming soon.</p>'}`;
    showHeadshot(p.avatar_path,'public-headshot','public-placeholder',token);
    $('public-jobs').innerHTML=jobIds.map(id=>`<li><div>${jobContent(id)}</div></li>`).join('');
    $('public-creatives').innerHTML=creativeIds.filter(id=>creativeMap.has(id)).map(id=>`<li><div>${creativeContent(id)}</div></li>`).join('');
    if (!$('public-jobs').children.length) $('public-jobs').innerHTML='<p class="no-picks">Good jobs coming soon.</p>';
    if (!$('public-creatives').children.length) $('public-creatives').innerHTML='<p class="no-picks">Good people coming soon.</p>';
    $('public-profile').hidden=false; $('copy-profile').hidden=false;
    status('In good company.');
  }
  async function loadProfile(force=false) {
    const user=account.getUser(), id=requestedId || user?.id;
    const key=`${user?.id || 'guest'}:${id || ''}`;
    if (!force && initializedKey===key) { renderPins(); return; }
    initializedKey=key; const token=++generation; ++searchGeneration;
    owner=Boolean(user && (!requestedId || requestedId===user.id)); dirty=false;
    for (const id of ['profile-gate','profile-form','public-profile','private-pins','copy-profile','profile-signout','edit-profile','cancel-edit']) $(id).hidden=true;
    if (!id) { status('Sign in to make this space yours.'); $('profile-gate').hidden=false; return; }
    if (!validId(id)) { status('That profile link isn’t valid.'); return; }
    status('Loading profile…');
    try {
      const {data,error}=await client.from('goodcompany_profiles').select('*').eq('user_id',id).maybeSingle();
      if (error) throw error; if (token!==generation) return;
      if (!data && !owner) { status('This profile is private or hasn’t been published yet.'); return; }
      profile=data || {first_name:'',last_name:'',bio:'',links:{},work_history:[],recommended_jobs:[],published:false};
      jobIds=[...profile.recommended_jobs]; creativeIds=[]; creativeMap=new Map();
      if (data) {
        const recs=await client.from('goodcompany_creative_recommendations').select('creative_id,position').eq('owner_id',id).order('position');
        if (recs.error) throw recs.error;
        creativeIds=recs.data.map(r=>r.creative_id);
        if (creativeIds.length) {
          const people=await client.from('goodcompany_profiles').select('user_id,first_name,last_name').in('user_id',creativeIds);
          if (people.error) throw people.error;
          creativeMap=new Map(people.data.map(p=>[p.user_id,p]));
        }
      }
      if (token!==generation) return;
      savedJobIds=[...jobIds]; savedCreativeIds=[...creativeIds];
      if (owner && profile.user_id) renderSavedOwner(token);
      else if (owner) renderOwner(profile,token); else renderPublic(profile,token);
    } catch { if (token===generation) { initializedKey=''; status('We couldn’t load this profile. Please refresh to try again.'); } }
  }
  $('job-search').addEventListener('input',()=>{
    const query=$('job-search').value.trim().toLowerCase();
    const matches=query.length>1 ? JOBS.filter(j=>!jobIds.includes(j.id) && `${j.company} ${j.title}`.toLowerCase().includes(query)).slice(0,8) : [];
    $('job-matches').innerHTML=matches.map(j=>`<button type="button" data-add-job="${esc(j.id)}"><span>${esc(j.company)} · ${esc(j.title)}</span><i class="ri-add-line" aria-hidden="true"></i></button>`).join('');
    if (query.length>1 && !matches.length) $('job-matches').textContent='No matching jobs. Try another company or role.';
  });
  $('creative-search').addEventListener('input',()=>{
    clearTimeout(timer); const token=++searchGeneration;
    const query=$('creative-search').value.trim().replace(/[^\p{L}\p{N}\s'-]/gu,'').slice(0,80);
    if (query.length<2) { $('creative-matches').textContent=''; return; }
    $('creative-matches').textContent='Looking for good people…';
    timer=setTimeout(async()=>{
      try {
        const {data,error}=await client.rpc('goodcompany_find_creatives',{search_name:query});
        if (error) throw error; if(token!==searchGeneration) return;
        const matches=data.filter(p=>p.user_id!==account.getUser()?.id && !creativeIds.includes(p.user_id));
        matches.forEach(p=>creativeMap.set(p.user_id,p));
        $('creative-matches').innerHTML=matches.map(p=>`<button type="button" data-add-creative="${esc(p.user_id)}"><span>${esc(fullName(p))}</span><i class="ri-add-line" aria-hidden="true"></i></button>`).join('');
        if (!matches.length) $('creative-matches').textContent='No published profiles found. Invite them to create and publish a profile on Good Company.';
      } catch { if(token===searchGeneration) $('creative-matches').textContent='Search is unavailable. Please try again.'; }
    },250);
  });
  form.addEventListener('click',event=>{
    const button=event.target.closest('button'); if (!button || saving) return;
    if (button.dataset.addJob || button.dataset.addCreative) {
      const kind=button.dataset.addJob?'job':'creative',id=button.dataset.addJob || button.dataset.addCreative,ids=kind==='job'?jobIds:creativeIds;
      if (ids.length>=10 || ids.includes(id)) return;
      ids.push(id); markDirty(); renderRecommendations(); $(`${kind}-matches`).innerHTML=''; $(`${kind}-search`).value='';
      $(`${kind}-recommendations`).lastElementChild?.querySelector('button:not(:disabled)')?.focus();
    }
    if (button.dataset.action) {
      const kind=button.dataset.kind, ids=kind==='job'?jobIds:creativeIds, index=Number(button.dataset.index), action=button.dataset.action;
      let next=index;
      if(action==='remove') ids.splice(index,1);
      else { next=index+(action==='up'?-1:1); if(next<0 || next>=ids.length) return; [ids[index],ids[next]]=[ids[next],ids[index]]; }
      markDirty(); renderRecommendations();
      ($(`${kind}-recommendations`).children[Math.min(next,ids.length-1)]?.querySelector('button:not(:disabled)') || $(`${kind}-search`)).focus();
    }
    if(button.hasAttribute('data-work')) { const rows=readWork(); rows.splice(Number(button.dataset.work),1); renderWork(rows); markDirty(); $('add-work').focus(); }
  });
  $('add-work').addEventListener('click',()=>{ const rows=readWork(); if(rows.length<20) { rows.push({company:'',role:'',years:''}); renderWork(rows); markDirty(); $('work-editor').lastElementChild.querySelector('input').focus(); } });
  form.addEventListener('input',event=>{ if(!['job-search','creative-search'].includes(event.target.id)) markDirty(); });
  $('headshot').addEventListener('change',()=>{
    const file=$('headshot').files[0]; if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>5242880) { status('Choose a JPG, PNG or WebP image under 5 MB.'); $('headshot').value=''; return; }
    if(previewUrl) URL.revokeObjectURL(previewUrl); previewUrl=URL.createObjectURL(file);
    $('edit-headshot').src=previewUrl; $('edit-headshot').hidden=false; $('headshot-placeholder').hidden=true; $('remove-headshot').hidden=false; removePhoto=false; markDirty();
  });
  $('remove-headshot').addEventListener('click',()=>{ removePhoto=true; $('headshot').value=''; $('edit-headshot').hidden=true; $('headshot-placeholder').hidden=false; $('remove-headshot').hidden=true; if(previewUrl) URL.revokeObjectURL(previewUrl); previewUrl=null; markDirty(); });
  async function prepareImage(file) {
    const bitmap=await createImageBitmap(file), ratio=Math.min(1,1024/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(bitmap.width*ratio)); canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('image')),'image/webp',.9));
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault(); if(saving || !editing || !owner || !form.reportValidity()) return;
    const user=account.getUser(); if(!user) { status('Please sign in again.'); return; }
    const links={};
    for(const key of networkFields) { const value=fields.namedItem(key).value.trim(), normalized=normalizeProfileLink(value,key); if(value && !normalized) { status(`Please enter a valid ${names[key]} ${key==='email'?'address':'domain, username or full link'}.`); fields.namedItem(key).focus(); return; } links[key]=normalized || ''; }
    const unavailable=creativeIds.filter(id=>!creativeMap.has(id));
    if(unavailable.length) { status('Remove creatives whose profiles are no longer public before saving.'); return; }
    const payload={first_name:fields.namedItem('first_name').value.trim(),last_name:fields.namedItem('last_name').value.trim(),bio:fields.namedItem('bio').value.trim(),links,work_history:readWork(),published:fields.namedItem('published').checked,recommended_jobs:[...jobIds],avatar_path:removePhoto?null:profile?.avatar_path || null};
    const file=$('headshot').files[0],oldPath=profile?.avatar_path; let uploaded=null;
    saving=true; $('profile-fields').disabled=true; status('Saving your profile…');
    try {
      if(file) {
        const blob=await prepareImage(file); uploaded=`${user.id}/${crypto.randomUUID()}.webp`;
        const {error}=await client.storage.from('goodcompany-headshots').upload(uploaded,blob,{contentType:'image/webp',upsert:false}); if(error) throw error;
        payload.avatar_path=uploaded;
      }
      if(account.getUser()?.id!==user.id) throw new Error('Session changed');
      const {error}=await client.rpc('goodcompany_save_profile',{profile_data:payload,creative_ids:creativeIds}); if(error) throw error;
      dirty=false; profile={...payload,user_id:user.id}; $('headshot').value=''; removePhoto=false;
      savedJobIds=[...jobIds]; savedCreativeIds=[...creativeIds];
      renderSavedOwner(++generation);
      $('edit-profile').focus();
      status(payload.published?'Saved! Your profile is published and ready to share.':'Saved! Your profile is private until you publish it.');
      if(oldPath && oldPath!==payload.avatar_path) client.storage.from('goodcompany-headshots').remove([oldPath]).catch(()=>{});
    } catch {
      if(uploaded) await client.storage.from('goodcompany-headshots').remove([uploaded]);
      status('Your changes weren’t saved. Check your connection and try again. Recommended creatives must still have published profiles.');
    } finally { saving=false; $('profile-fields').disabled=false; renderRecommendations(); $('add-work').disabled=readWork().length>=20; }
  });
  $('edit-profile').addEventListener('click',()=>{
    if (!owner || saving) return;
    jobIds=[...savedJobIds]; creativeIds=[...savedCreativeIds];
    renderOwner(profile,++generation);
    fields.namedItem('first_name').focus();
  });
  $('cancel-edit').addEventListener('click',()=>{
    if (!owner || saving) return;
    if (dirty && !confirm('Discard your unsaved changes?')) return;
    dirty=false; jobIds=[...savedJobIds]; creativeIds=[...savedCreativeIds];
    renderSavedOwner(++generation);
    $('edit-profile').focus();
  });
  $('copy-profile').addEventListener('click',async()=>{
    const id=profile?.user_id; if(!id || !profile.published) return;
    const url=new URL('profile.html',location.href); url.searchParams.set('id',id); url.hash='';
    try { await navigator.clipboard.writeText(url.href); status('Profile link copied.'); }
    catch { status(`Your profile link: ${url.href}`); }
  });
  $('profile-signin').addEventListener('click',()=>{ sessionStorage.setItem('goodcompany-return-profile','1'); account.openAccount(); });
  $('profile-signout').addEventListener('click',async()=>{
    if(dirty && !confirm('Sign out and discard your unsaved changes?')) return;
    const {error}=await client.auth.signOut({scope:'local'}); if(error) status('Could not sign out. Please try again.'); else { dirty=false; sessionStorage.removeItem('goodcompany-return-profile'); }
  });
  window.addEventListener('beforeunload',event=>{ if(dirty || saving) { event.preventDefault(); event.returnValue=''; } });
  window.addEventListener('goodcompany-account-change',()=>loadProfile());
  loadProfile();
})();
