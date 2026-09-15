const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
const start=source.indexOf("  $('job-detail').addEventListener('click', async event => {");
const handler=source.slice(start,source.indexOf("  $('job-dialog').addEventListener('close'",start));
function setup({copy=false,clipboard,share}={}){
 const nodes={};
 const $=id=>nodes[id]||(nodes[id]={id,hidden:true,dataset:{jobId:'test-job'},focus(){this.focused=true;},select(){this.selected=true;},setAttribute(k,v){this[k]=v;},addEventListener(_,fn){this.click=fn;}});
 const timers=[];
 vm.runInNewContext(handler,{$,navigator:{clipboard,share},document:{execCommand:()=>copy},JOBS:[{id:'test-job',title:'Designer',company:'Example'}],jobLink:id=>'https://in-good.company/?job='+id,setTimeout:(fn)=>{timers.push(fn);return timers.length;},clearTimeout(){}});
 return {$,timers,click:id=>$('job-detail').click({target:{closest:()=>id?$(id):null}})};
}
test('Share immediately exposes the job URL without waiting for clipboard permissions',async()=>{
 const h=setup();await h.click('share-job');
 assert.equal(h.$('share-fallback').hidden,false);
 assert.equal(h.$('share-job')['aria-expanded'],'true');
 assert.equal(h.$('share-url').selected,true);
});
test('copy succeeds with synchronous fallback or async clipboard',async()=>{
 for(const options of [{copy:true},{clipboard:{writeText:async url=>assert.equal(url,'https://in-good.company/?job=test-job')}}]){
  const h=setup(options);await h.click('copy-job-link');assert.match(h.$('share-status').textContent,/Link copied/);assert.equal(h.$('copy-job-link').disabled,false);
 }
});
test('denied, missing, or stalled clipboard leaves the URL selectable and re-enables the button',async()=>{
 for(const options of [{},{clipboard:{writeText:async()=>{throw Error('denied');}}},{clipboard:{writeText:()=>new Promise(()=>{})}}]){
  const h=setup(options),pending=h.click('copy-job-link');
  h.timers.forEach(fn=>fn());await pending;
  assert.match(h.$('share-status').textContent,/Select and copy/);
  assert.equal(h.$('copy-job-link').disabled,false);assert.equal(h.$('share-url').selected,true);
 }
});
test('native sharing receives the job permalink and cancellation keeps copy available',async()=>{
 let payload;
 const h=setup({share:async data=>{payload=data;throw Object.assign(Error('cancel'),{name:'AbortError'});}});
 await h.click('share-job-device');assert.equal(payload.url,'https://in-good.company/?job=test-job');
 assert.match(h.$('share-status').textContent,/canceled/);assert.equal(h.$('share-job-device').disabled,false);
});
test('late clipboard result cannot change the next job modal',async()=>{
 let resolve;
 const h=setup({clipboard:{writeText:()=>new Promise(r=>{resolve=r;})}});
 const pending=h.click('copy-job-link');h.$('job-dialog').dataset.jobId='another-job';resolve();await pending;
 assert.equal(h.$('share-status').textContent,undefined);
});

