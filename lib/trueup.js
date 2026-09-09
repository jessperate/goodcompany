function plain(html) {
 return html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g,' ').trim();
}
function parseTrueup(html,company) {
 const title=plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
 if(title.toLowerCase()!==company.toLowerCase()) throw Error('Company page mismatch');
 // Ignore competitor comparison cards so their metrics cannot fill missing values.
 const text=plain(html).split(/Compare to other companies/i)[0];
 const number=raw=>{if(raw==null)return null;const n=Number(raw.replace(/,/g,''));return Number.isFinite(n)&&n>=0?n:null;};
 const exact=text.match(/company with ([\d,]+) job openings/i)?.[1];
 const open=exact ?? text.match(/Open jobs\s+([\d,]+)(?=\s)/i)?.[1];
 const remote=text.match(/Remote openings\s+[\d.]+%\s+([\d,]+) jobs?/i)?.[1] ?? text.match(/🌎\s*Remote\s*([\d,]+)/u)?.[1];
 const growth=text.match(/Employee growth\s+([+−-]?[\d,.]+%)\s+past 12 months/i)?.[1] || null;
 if(open==null && remote==null && growth==null) throw Error('No company metrics found');
 return {openJobs:number(open),remoteJobs:number(remote),employeeGrowth:growth};
}
module.exports={parseTrueup};
