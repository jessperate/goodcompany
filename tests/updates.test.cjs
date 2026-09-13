const {test}=require('node:test'),assert=require('node:assert/strict');
const feed=require('../releases.js');
const now=Date.parse('2026-09-14T00:00:00Z'),old={id:'old',created_at:'2026-09-08T00:00:00Z'};
test('signed-out visitors and brand-new members do not get historical release popups',()=>{
 assert.deepEqual(feed.unseen(null,0,now),[]);
 assert.deepEqual(feed.unseen({id:'new',created_at:'2026-09-14T00:00:00Z'},0,now),[]);
});
test('returning accounts see unseen releases once and never see future entries',()=>{
 assert.equal(feed.unseen(old,0,now).length,1);
 assert.deepEqual(feed.unseen(old,1,now),[]);
 assert.deepEqual(feed.unseen(old,0,Date.parse('2026-09-12')),[]);
});
test('later releases accumulate since the saved receipt, excluding pre-account changes',()=>{
 feed.releases.push({version:2,shippedAt:'2026-09-15T00:00:00Z',features:[]},{version:3,shippedAt:'2026-09-16T00:00:00Z',features:[]});
 try{
  assert.deepEqual(feed.unseen(old,1,Date.parse('2026-09-17')).map(r=>r.version),[2,3]);
  assert.deepEqual(feed.unseen({id:'later',created_at:'2026-09-15T12:00:00Z'},0,Date.parse('2026-09-17')).map(r=>r.version),[3]);
 }finally{feed.releases.splice(1);}
});
