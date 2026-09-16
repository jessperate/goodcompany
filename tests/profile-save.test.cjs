const {test}=require('node:test');
const assert=require('node:assert/strict');
const {changes,fileError,persist,drafts}=require('../profile-save.js');
function fixture({uploadError,rpcError,staleRead=false}={}) {
  let row={user_id:'owner',first_name:'Test',last_name:'Person',bio:'Original',links:{},work_history:[],published:true,recommended_jobs:['one'],avatar_path:'owner/old.png'};
  const writes=[],uploads=[],removed=[];
  const client={
    rpc:async(name,args)=>{writes.push(args);if(rpcError)return {error:rpcError};if(!staleRead)row={...row,...args.profile_data};return {error:null};},
    from:()=>({select:()=>({eq:()=>({single:async()=>({data:{...row},error:null})})})}),
    storage:{from:()=>({upload:async(path,blob,options)=>{uploads.push({path,options});return {error:uploadError};},remove:async(paths)=>{removed.push(...paths);return {error:null};}})}
  };
  return {client,writes,uploads,removed,row:()=>row};
}
test('only changed fields in the active window are sent; stale recommendations cannot erase a bio',()=>{
  const original={first_name:'Test',last_name:'Person',bio:'Old bio',links:{x:'one',website:'two'},work_history:[],published:true,recommended_jobs:['one']};
  const values={...original,links:{website:'two',x:'one'},recommended_jobs:['two']};
  assert.deepEqual(changes(values,original,'jobs'),{recommended_jobs:['two']});
  assert.deepEqual(changes(values,original,'all'),{recommended_jobs:['two']});
  assert.deepEqual(changes({...values,bio:''},original,'about'),{bio:''});
});
test('failed photo upload still persists and verifies the bio',async()=>{
  const f=fixture({uploadError:{statusCode:403}});
  const result=await persist({...f,userId:'owner',patch:{bio:'My new bio'},file:{},prepare:async()=>({type:'image/webp'})});
  assert.equal(result.profile.bio,'My new bio');assert.equal(result.profile.avatar_path,'owner/old.png');
  assert.equal(result.photoError.statusCode,403);assert.equal(f.writes[0].creative_ids,null);assert.deepEqual(f.removed,[]);
});
test('decoder errors do not roll back profile text or remove the existing headshot',async()=>{
  const f=fixture();const result=await persist({...f,userId:'owner',patch:{bio:'Saved text'},file:{},prepare:async()=>{throw new Error('decode');}});
  assert.equal(result.profile.bio,'Saved text');assert.equal(result.photoError.message,'decode');assert.deepEqual(f.uploads,[]);assert.deepEqual(f.removed,[]);
});
test('PNG fallback uses actual encoded MIME type and only removes old photo after verified attachment',async()=>{
  const f=fixture();const result=await persist({...f,userId:'owner',patch:{bio:'Saved text'},file:{},prepare:async()=>({type:'image/png'})});
  assert.equal(result.photoError,null);assert.match(f.uploads[0].path,/\.png$/);assert.equal(f.uploads[0].options.contentType,'image/png');
  assert.equal(result.profile.avatar_path,f.uploads[0].path);assert.deepEqual(f.removed,['owner/old.png']);
  assert.deepEqual(Object.keys(f.writes[1].profile_data),['avatar_path']);
});
test('RPC rejection or mismatched readback never reports a successful save',async()=>{
  const failed=fixture({rpcError:new Error('offline')});await assert.rejects(persist({...failed,userId:'owner',patch:{bio:'draft'}}),/offline/);
  const stale=fixture({staleRead:true});await assert.rejects(persist({...stale,userId:'owner',patch:{bio:'draft'}}),/confirm/);
});
test('an account switch during photo preparation prevents uploading to the prior account',async()=>{
  const f=fixture();let current=true;
  await assert.rejects(persist({...f,userId:'owner',patch:{bio:'Saved text'},file:{},isCurrent:()=>current,prepare:async()=>{current=false;return {type:'image/webp'};}}),/sign-in changed/);
  assert.equal(f.uploads.length,0);
});
test('drafts survive reload, stay account-scoped, can be discarded, and tolerate blocked storage',()=>{
  const map=new Map(),storage={setItem:(k,v)=>map.set(k,v),getItem:k=>map.get(k),removeItem:k=>map.delete(k)};
  drafts(storage).put('owner',{patch:{bio:'Keep this'},scope:'about'});
  assert.equal(drafts(storage).get('owner').patch.bio,'Keep this');assert.equal(drafts(storage).get('another'),null);
  drafts(storage).clear('owner');assert.equal(drafts(storage).get('owner'),null);
  const blocked=drafts({setItem(){throw new Error('blocked');},getItem(){throw new Error('blocked');}});
  assert.equal(blocked.put('owner',{}),false);assert.equal(blocked.get('owner'),null);
});
test('larger photos and files without MIME metadata are accepted; unsupported formats get clear errors',()=>{
  assert.equal(fileError({size:8*1024*1024,type:'image/jpeg'}),'');
  assert.equal(fileError({size:100,type:'',name:'photo.PNG'}),'');
  assert.equal(fileError({size:100,type:'image/heic'}),'');
  assert.match(fileError({size:21*1024*1024,type:'image/png'}),/20 MB/);
  assert.match(fileError({size:100,type:'application/pdf',name:'photo.pdf'}),/Choose/);
});
