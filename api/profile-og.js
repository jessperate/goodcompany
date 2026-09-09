const {findProfile,headshot}=require('../lib/profile-data');
const fonts=require('../lib/og-fonts.json');
const h=(type,style,children,extra={})=>({type,props:{style,children,...extra}});
module.exports=async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  let p;
  try{p=await findProfile(req.query.id);}catch{return res.status(503).send('Profile preview temporarily unavailable');}
  if(!p)return res.status(404).send('Profile not available');
  const {ImageResponse}=await import('@vercel/og');
  const photo=await headshot(p),name=[p.first_name,p.last_name].filter(Boolean).join(' ');
  const blue='#002fff',paper='#f6f8ff',lime='#d9f76b';
  const image=new ImageResponse(h('div',{display:'flex',width:'100%',height:'100%',background:paper,padding:32,color:blue,fontFamily:'Museum'},[
    h('div',{display:'flex',flexDirection:'column',width:'100%',border:`2px solid ${blue}`,boxShadow:`8px 8px 0 ${blue}`},[
      h('div',{display:'flex',justifyContent:'space-between',padding:'14px 24px',borderBottom:`2px solid ${blue}`,background:'#e9eeff',fontFamily:'Mono',fontSize:18},[h('div',{},'[ + ]'),h('div',{},'GOOD COMPANY / PEOPLE'),h('div',{},'—  ×')]),
      h('div',{display:'flex',flexDirection:'column',padding:'28px 40px',flex:1,justifyContent:'space-between'},[
        h('div',{fontSize:42,letterSpacing:-2},'Good Company.'),
        h('div',{display:'flex',gap:36,alignItems:'center'},[
          h('div',{display:'flex',width:190,height:190,flexShrink:0,background:lime,border:`2px solid ${blue}`,boxShadow:`6px 6px 0 ${blue}`,alignItems:'center',justifyContent:'center',fontFamily:'Mono',fontSize:70},photo?h('img',{objectFit:'cover'},undefined,{src:photo,width:186,height:186}):':)'),
          h('div',{display:'flex',flexDirection:'column',flex:1,gap:18},[
            h('div',{fontSize:name.length>55?40:name.length>32?50:66,lineHeight:1.05,letterSpacing:-1,wordBreak:'break-word'},name),
            h('div',{fontFamily:'Mono',fontSize:18,lineHeight:1.5},p.bio?.trim()?p.bio.trim().slice(0,140)+(p.bio.trim().length>140?'…':''):'GOOD PEOPLE. BIG IDEAS.')])]),
        h('div',{display:'flex',justifyContent:'space-between',fontFamily:'Mono',fontSize:16,borderTop:'1px solid #b7c5f2',paddingTop:18},[h('div',{},'MEET YOUR NEXT GOOD CONNECTION.'),h('div',{},'in-good.company')])])])]),{width:1200,height:630,fonts:[{name:'Museum',data:Buffer.from(fonts.museum,'base64'),weight:400,style:'normal'},{name:'Mono',data:Buffer.from(fonts.mono,'base64'),weight:400,style:'normal'}]});
  res.setHeader('Content-Type','image/png');res.status(200).send(Buffer.from(await image.arrayBuffer()));
};
