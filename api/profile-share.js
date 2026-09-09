const fs=require('node:fs');
const {findProfile,escape}=require('../lib/profile-data');
const template=fs.readFileSync('profile.html','utf8');
module.exports=async(req,res)=>{
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  let profile=null;
  try{profile=await findProfile(req.query.id);}catch{}
  const name=profile?[profile.first_name,profile.last_name].filter(Boolean).join(' '):null;
  const title=name?`${name} — Good Company`:'Your profile — Good Company';
  const description=profile?(profile.bio.trim().slice(0,200)||`Meet ${name} and explore their recommended jobs and creatives on Good Company.`):'Good people. Good company.';
  const url=profile?`https://in-good.company/profile.html?id=${profile.user_id}`:'https://in-good.company/profile.html';
  const image=profile?`https://in-good.company/api/profile-og?id=${profile.user_id}&v=${encodeURIComponent(profile.updated_at)}`:'https://in-good.company/og-good-company.jpg';
  const metadata={'og:type':'profile','og:title':title,'og:description':description,'og:url':url,'og:image':image,'og:image:width':'1200','og:image:height':'630','og:image:alt':title,'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':image};
  let html=template.replace(/<title>.*?<\/title>/,`<title>${escape(title)}</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(description)}">`);
  html=html.replace('</head>',Object.entries(metadata).map(([k,v])=>`<meta ${k.startsWith('twitter:')?'name':'property'}="${k}" content="${escape(v)}">`).join('\n')+`<link rel="canonical" href="${escape(url)}"></head>`);
  res.status(200).send(html);
};
