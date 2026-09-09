const base='https://eodrqcucaersbpxxessa.supabase.co';
const headers={apikey:'sb_publishable_0hxg0eaxPx48OjiB3eSMMQ_DK3827FO'};
const validId=id=>typeof id==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
exports.findProfile=async id=>{
  if(!validId(id)) return null;
  // Anonymous access keeps the same published-profile RLS as a public visitor.
  const response=await fetch(`${base}/rest/v1/goodcompany_profiles?user_id=eq.${id}&published=eq.true&select=user_id,first_name,last_name,bio,avatar_path,updated_at`,{headers,signal:AbortSignal.timeout(7000)});
  if(!response.ok) throw new Error('Profile lookup unavailable');
  return (await response.json())[0] || null;
};
exports.headshot=async profile=>{
  const path=profile.avatar_path;
  if(!path || !path.startsWith(profile.user_id+'/') || path.includes('..')) return null;
  try{
    const response=await fetch(`${base}/storage/v1/object/sign/goodcompany-headshots/${path.split('/').map(encodeURIComponent).join('/')}`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:60}),signal:AbortSignal.timeout(5000)});
    if(!response.ok) return null;
    const data=await response.json();
    const signed=data.signedURL;
    if(typeof signed!=='string') return null;
    const url=new URL(signed.startsWith('/object/') ? base+'/storage/v1'+signed : signed,base+'/storage/v1/');
    if(url.origin!==base) return null;
    const image=await fetch(url,{signal:AbortSignal.timeout(5000)});
    if(!image.ok) return null;
    const bytes=Buffer.from(await image.arrayBuffer());
    if(bytes.length>5242880) return null;
    const mime=image.headers.get('content-type')?.split(';')[0];
    if(!['image/png','image/jpeg','image/webp'].includes(mime)) return null;
    const sharp=require('sharp');
    const png=await sharp(bytes,{limitInputPixels:20000000}).resize(380,380,{fit:'cover'}).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  }catch{return null;}
};
exports.escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
