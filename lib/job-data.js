const fs = require('node:fs');
const path = require('node:path');
const raw = fs.readFileSync(path.join(process.cwd(), 'jobs.js'), 'utf8');
const jobs = JSON.parse(raw.split('const JOBS = ')[1].trim().replace(/;$/, ''));
exports.findJob = id => typeof id === 'string' ? jobs.find(job => job.id === id) : undefined;
exports.escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const companiesRaw = fs.readFileSync(path.join(process.cwd(), 'companies.js'), 'utf8');
const companies = JSON.parse(companiesRaw.split('const COMPANIES = ')[1].trim().replace(/;$/, ''));
exports.companyLogo = company => {
  const logo = companies[company]?.logo;
  if (!logo || !/^logos\/[a-z0-9-]+\.svg$/.test(logo)) return null;
  try {
    const svg = fs.readFileSync(path.join(process.cwd(), logo), 'utf8');
    return svg.match(/href="(data:image\/(?:png|jpeg|webp);base64,[^"]+)"/)?.[1] || `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } catch { return null; }
};
