const fs=require('node:fs');
const raw=fs.readFileSync('companies.js','utf8');
const companies=JSON.parse(raw.split('const COMPANIES = ')[1].trim().replace(/;$/,''));
module.exports=async(req,res)=>{
 const q=typeof req.query.q==='string'?req.query.q.trim().slice(0,80):'';
 res.setHeader('Cache-Control','public, max-age=300, s-maxage=3600');
 if(q.length<2)return res.status(200).json({companies:[]});
 const results=Object.entries(companies).filter(([name,c])=>`${name} ${c.website}`.toLowerCase().includes(q.toLowerCase())).map(([name,c])=>({name,website:c.website,logo:c.logo,source:'Good Company'}));
 let unavailable=false;
 try{
  const r=await fetch('https://autocomplete.clearbit.com/v1/companies/suggest?query='+encodeURIComponent(q),{signal:AbortSignal.timeout(3500)});
  if(!r.ok)throw new Error();
  const rows=await r.json();
  for(const c of rows){
   if(typeof c.name!=='string'||!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(c.domain))continue;
   if(results.some(x=>new URL(x.website).hostname.replace(/^www\./,'')===c.domain.replace(/^www\./,'')))continue;
   results.push({name:c.name.slice(0,160),website:'https://'+c.domain,logo:'https://www.google.com/s2/favicons?domain='+encodeURIComponent(c.domain)+'&sz=64',source:'Clearbit'});
  }
 }catch{unavailable=true;}
 res.status(200).json({companies:results.slice(0,8),unavailable});
};
