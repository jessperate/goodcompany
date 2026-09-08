const fs = require('node:fs');
const path = require('node:path');
const raw = fs.readFileSync(path.join(process.cwd(), 'jobs.js'), 'utf8');
const jobs = JSON.parse(raw.split('const JOBS = ')[1].trim().replace(/;$/, ''));
exports.findJob = id => typeof id === 'string' ? jobs.find(job => job.id === id) : undefined;
exports.escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
