const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../profile.js'),'utf8');
const start=source.indexOf("  form.addEventListener('submit',async event=>{");
const handler=source.slice(start,source.indexOf("  $('restore-profile-draft').addEventListener",start));
function setup({scope='about',photoError=null,failure=null}={}) {
 const nodes={},messages=[],records=[],cached=[],cleared=[];
 const $=id=>nodes[id]||(nodes[id]={files:[],value:'',focus(){}});
 const profile={user_id:'owner',first_name:'Test',last_name:'Person',bio:'Original',links:{},work_history:[],published:false,recommended_jobs:['one']};
 const ctx={$,editing:true,editingScope:scope,owner:true,saving:false,dirty:true,generation:1,removePhoto:false,profile,savedJobIds:['one'],savedCreativeIds:[],creativeIds:[],creativeMap:new Map(),jobIds:['two'],client:{},
 account:{getUser:()=>({id:'owner'})},form:{addEventListener:(name,fn)=>ctx.submit=fn,reportValidity:()=>true},
 formValues:()=>({...profile,bio:'New biography',recommended_jobs:['two']}),networkFields:[],fields:{},names:{},
 persistence:{...require('../profile-save.js'),persist:async args=>{records.push(args);if(failure)throw failure;return {profile:{...profile,...args.patch},photoError};}},
 draftStore:{clear:id=>cleared.push(id)},rememberDraft:()=>cached.push(true),status:msg=>messages.push(msg),renderSavedOwner:()=>{ctx.editing=false;},
 document:{querySelector:()=>null},renderRecommendations(){},readWork:()=>[]};
 vm.runInNewContext(handler,ctx);return {ctx,records,cached,cleared,messages,click:()=>ctx.submit({preventDefault(){}})};
}
 test('about window save sends bio but preserves other recommendation windows and exits edit mode only after success',async()=>{
 const h=setup();await h.click();assert.deepEqual(Object.keys(h.records[0].patch),['bio']);assert.equal(h.records[0].creativeIds,null);assert.equal(h.ctx.editing,false);assert.equal(h.ctx.dirty,false);assert.equal(h.cleared.length,1);assert.match(h.messages.at(-1),/^Saved!/);
 });
 test('failed photo leaves editor and selected photo available while reporting text as saved',async()=>{
 const h=setup({photoError:{statusCode:403}});h.ctx.$('headshot').files=[{name:'test.png'}];await h.click();
 assert.equal(h.ctx.profile.bio,'New biography');assert.equal(h.ctx.editing,true);assert.equal(h.ctx.dirty,true);assert.equal(h.ctx.$('headshot').files.length,1);assert.equal(h.cleared.length,0);assert.match(h.messages.at(-1),/details are saved, but the photo wasn’t saved/);
 });
 test('failed save keeps the draft, edit state, and original saved profile',async()=>{
 const h=setup({failure:new Error('offline')});await h.click();assert.equal(h.ctx.profile.bio,'Original');assert.equal(h.ctx.editing,true);assert.equal(h.cleared.length,0);assert.equal(h.ctx.saving,false);assert.match(h.messages.at(-1),/draft is still here/);
 });
 test('saving jobs cannot modify bio or upload the headshot from another window',async()=>{
 const h=setup({scope:'jobs'});h.ctx.$('headshot').files=[{}];await h.click();assert.deepEqual(Object.keys(h.records[0].patch),['recommended_jobs']);assert.equal(h.records[0].file,null);assert.equal(h.ctx.profile.bio,'Original');
 });
