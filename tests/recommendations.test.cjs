const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../recommendations.js'),'utf8');
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 let user={id:'owner'},saved=[],calls=0,error=null; const events={},clicks={},elements={};
 const button={dataset:{recommendJob:'job-one'},setAttribute(k,v){this[k]=v;}};
 const client={from(){return{select(){return this},eq(){return this},async maybeSingle(){return{data:{recommended_jobs:[...saved]}}}}},async rpc(name,args){calls++;assert.equal(name,'goodcompany_recommend_job');if(error)return{error};saved=[...new Set([...saved,args.job_id])];return{data:saved};}};
 const storage=new Map();const account={client,getUser:()=>user,openAccount(){elements.opened=true;}};
 const context={window:{GoodCompanyAccount:account,addEventListener:(n,f)=>events[n]=f},document:{querySelectorAll:()=>[button],getElementById:id=>elements[id]??=( {} ),addEventListener:(n,f)=>clicks[n]=f},JOBS:[{id:'job-one'}],localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},Date,JSON};
 vm.runInNewContext(source,context);await tick();
 const click=()=>clicks.click({target:{closest:()=>button},preventDefault(){},stopPropagation(){}});
 click();click();await tick();assert.equal(calls,1);assert.deepEqual(saved,['job-one']);assert.match(button.innerHTML,/In your top ten/);assert.equal(button.disabled,true);
 events.focus();await tick();assert.match(button.innerHTML,/In your top ten/);
 user=null;events['goodcompany-account-change']();await tick();click();assert.equal(elements.opened,true);assert.equal(calls,1);
 user={id:'second'};saved=[];error={code:'P0001',message:'Your top ten is full.'};events['goodcompany-account-change']();await tick();await tick();assert.match(elements['recommend-job-status'].textContent,/full/);assert.equal(button.disabled,false);
 console.log('Modal recommendation save, duplicate click, reload, guest sign-in and failure recovery passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
