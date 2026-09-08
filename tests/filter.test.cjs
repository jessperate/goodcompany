const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'stages.js'),'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8').split('\n(() => {')[0], context);
const fixture = [
 {id:'b',company:'AirOps',title:'Brand Designer',category:'Brand & visual',location:'New York',workplace:'Hybrid',level:'Senior',salary:'Published',salaryCurrency:'USD',salaryMax:180000},
 {id:'p',company:'Adobe',title:'Product Designer',category:'Product design',location:'London',workplace:'On-site',level:'Mid-level'},
 {id:'u',company:'Unclassified Company',title:'Brand Designer',category:'Brand & visual',location:'New York',workplace:'Remote',level:'Senior'},
];
context.fixture = fixture;
function ids(options) { context.options=options;return Array.from(vm.runInContext('filterJobs(fixture,options).map(j=>j.id)',context)); }
assert.deepEqual(ids({}),['b','p','u']);
assert.deepEqual(ids({stage:'Series B'}),['b']);
assert.deepEqual(ids({stage:'Public'}),['p']);
assert.deepEqual(ids({stage:'Seed'}),[]);
assert.deepEqual(ids({stage:'Series B',query:'brand New York',workplace:'Hybrid',level:'Senior',comp:175000,disclosed:true}),['b']);
assert.deepEqual(ids({stage:'Series B',comp:200000}),[]);
assert.deepEqual(ids({stage:'Public',category:'Brand & visual'}),[]);
assert.deepEqual(ids({network:true,stage:'Series B'}),[]);
assert.deepEqual(ids({stage:'all'}),['b','p','u']);
vm.runInContext(fs.readFileSync(path.join(root,'jobs.js'),'utf8'), context);
const jobs=vm.runInContext('JOBS',context);
assert.equal(new Set(jobs.map(j=>j.id)).size,jobs.length);
for(const j of jobs){assert(j.title && j.company && j.url);assert.match(j.url,/^https:\/\//);}
console.log('Company stage, combined filters, unknown-stage handling, and listing integrity passed.');

const crossRole={id:'creator',company:'Adobe',title:'Creator Partnerships',category:'Creator marketing',disciplines:['Influencer marketing','Social media'],workplace:'Remote',level:'Senior',salary:'Published',salaryCurrency:'USD',salaryMax:180000};
context.fixture=[...fixture,crossRole];
assert.deepEqual(ids({category:'Influencer marketing',stage:'Public',workplace:'Remote',level:'Senior',comp:150000}),['creator']);
assert.deepEqual(ids({category:'Social media',query:'influencer'}),['creator']);
assert.deepEqual(ids({category:'Product design'}),['p']);
assert.deepEqual(ids({category:'Creator marketing',workplace:'On-site'}),[]);
assert.equal(ids({}).filter(id=>id==='creator').length,1);
console.log('Overlapping marketing disciplines and combined filters passed.');
