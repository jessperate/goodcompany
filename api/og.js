const {findJob, companyLogo} = require('../lib/job-data');
const fonts = require('../lib/og-fonts.json');
const h = (type, style, children, extra = {}) => ({type, props:{style, children, ...extra}});
module.exports = async (req, res) => {
  const job = findJob(req.query.job);
  if (!job) return res.status(404).send('Job not found');
  const {ImageResponse} = await import('@vercel/og');
  const logo = companyLogo(job.company);
  const blue='#002fff', paper='#f6f8ff', lime='#d9f76b';
  const image = new ImageResponse(h('div',{display:'flex',width:'100%',height:'100%',background:paper,padding:32,color:blue,fontFamily:'Museum'},[
    h('div',{display:'flex',flexDirection:'column',width:'100%',border:`2px solid ${blue}`,boxShadow:`8px 8px 0 ${blue}`},[
      h('div',{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 24px',borderBottom:`2px solid ${blue}`,background:'#e9eeff',fontFamily:'Mono',fontSize:18},[h('div',{},'[ + ]'),h('div',{},'GOOD COMPANY / JOB FILE'),h('div',{},'—  ×')]),
      h('div',{display:'flex',flexDirection:'column',flex:1,padding:'32px 42px',justifyContent:'space-between'},[
        h('div',{display:'flex',alignItems:'center',justifyContent:'space-between'},[
          h('div',{fontSize:42,letterSpacing:-2},'Good Company.'),
          h('div',{fontFamily:'Mono',fontSize:20,background:lime,padding:'10px 16px'},':~P')]),
        h('div',{display:'flex',flexDirection:'column',gap:14},[
          h('div',{display:'flex',alignItems:'center',gap:16,fontFamily:'Mono',fontSize:25},[...(logo ? [h('div',{display:'flex',width:64,height:64,padding:8,background:'white',border:'1px solid #c1cdf7'},h('img',{objectFit:'contain'},undefined,{src:logo,width:46,height:46}))] : []),h('div',{},job.company)]),
          h('div',{fontSize:job.title.length>110?42:job.title.length>75?50:64,lineHeight:1.08,letterSpacing:-1},job.title)]),
        h('div',{display:'flex',justifyContent:'space-between',fontFamily:'Mono',fontSize:16,paddingTop:20,borderTop:'1px solid #b7c5f2'},[h('div',{},'GOOD WORK. EVEN BETTER COMPANY.'),h('div',{},'good-company-jess.vercel.app')])])])]),
    {width:1200,height:630,fonts:[{name:'Museum',data:Buffer.from(fonts.museum,'base64'),weight:400,style:'normal'},{name:'Mono',data:Buffer.from(fonts.mono,'base64'),weight:400,style:'normal'}]});
  res.setHeader('Content-Type','image/png');
  res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');
  res.status(200).send(Buffer.from(await image.arrayBuffer()));
};
