const fs = require('node:fs');
const path = require('node:path');
const {findJob, escape} = require('../lib/job-data');
const template = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
module.exports = (req, res) => {
  const job = findJob(req.query.job);
  let html = template;
  if (job) {
    const title = `${job.title} at ${job.company} — Good Company`;
    const description = `Explore ${job.title} at ${job.company}. Good work. Even better company.`;
    const url = `https://good-company-jess.vercel.app/?job=${encodeURIComponent(job.id)}`;
    const image = `https://good-company-jess.vercel.app/api/og?job=${encodeURIComponent(job.id)}&v=2`;
    html = html.replace(/<title>.*?<\/title>/, `<title>${escape(title)}</title>`);
    for (const [key,value] of Object.entries({'og:title':title,'twitter:title':title,'description':description,'og:description':description,'twitter:description':description,'og:url':url,'og:image':image,'twitter:image':image,'og:image:height':'630','og:image:type':'image/png','og:image:alt':title})) {
      html = html.replace(new RegExp(`(<meta (?:name|property)="${key}" content=")[^"]*(")`), (_,a,b)=>a+escape(value)+b);
    }
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, (_,a,b)=>a+escape(url)+b);
  }
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
  res.status(200).send(html);
};
