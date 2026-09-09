const fs=require('node:fs'),vm=require('node:vm');
const {parseTrueup}=require('../lib/trueup');
const companies=vm.runInNewContext(fs.readFileSync('companies.js','utf8')+'\nCOMPANIES');
module.exports=async(req,res)=>{
 const name=typeof req.query.company==='string'?req.query.company:'';
 const company=Object.prototype.hasOwnProperty.call(companies,name)?companies[name]:null;
 if(!company) return res.status(404).json({status:'unavailable'});
 const saved=company.trueup;
 if(!saved?.url) return res.status(200).json({status:'unavailable',url:null});
 // Only allow preverified company URLs from the deployed directory.
 if(!/^https:\/\/(?:www\.)?trueup\.io\/co\/[a-z0-9-]+\/?$/.test(saved.url)) return res.status(200).json({status:'unavailable',url:null});
 try {
  const signal=AbortSignal.timeout(6500);
  let url=saved.url,response;
  for(let attempt=0;attempt<3;attempt++){
   response=await fetch(url,{signal,headers:{Accept:'text/html'},redirect:'manual'});
   if(![301,302,303,307,308].includes(response.status))break;
   const next=new URL(response.headers.get('location'),url);
   if(next.protocol!=='https:' || !['trueup.io','www.trueup.io'].includes(next.hostname) || next.pathname.replace(/\/$/,'')!==new URL(saved.url).pathname.replace(/\/$/,''))throw Error('Unexpected redirect');
   url=next.href;
  }
  if(!response.ok) throw Error('Source HTTP '+response.status);
  if(Number(response.headers.get('content-length'))>3000000) throw Error('Page too large');
  const html=await response.text();if(html.length>3000000)throw Error('Page too large');
  const stats=parseTrueup(html,name);
  res.setHeader('Cache-Control','public, max-age=300, s-maxage=3600');
  return res.status(200).json({...stats,url:saved.url,checkedAt:new Date().toISOString(),status:'refreshed'});
 } catch(error) {
  console.warn("TrueUp refresh fallback",name,error.message);
  res.setHeader('Cache-Control','public, max-age=60, s-maxage=300');
  return res.status(200).json({...saved,status:saved.status==='stale'?'stale':'snapshot'});
 }
};
