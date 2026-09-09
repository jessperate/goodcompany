(() => {
 'use strict';
 const account=window.GoodCompanyAccount, client=account.client;
 let owner=null, jobs=[], loading=false, busy=false, generation=0, failed=false;
 const status=text=>{const el=document.getElementById('recommend-job-status') || document.getElementById('pin-status');if(el)el.textContent=text;};
 function refreshButtons(){
  document.querySelectorAll('[data-recommend-job]').forEach(b=>{
   const added=jobs.includes(b.dataset.recommendJob);
   b.disabled=loading || busy || added;
   b.innerHTML=added?'In your top ten <i class="ri-check-line" aria-hidden="true"></i>':'Add to top ten jobs <i class="ri-add-line" aria-hidden="true"></i>';
   b.setAttribute('aria-pressed',String(added));
  });
 }
 async function sync(force=false){
  const user=account.getUser();if(!force && owner===user?.id)return;
  owner=user?.id; jobs=[];failed=false;const current=++generation;
  loading=Boolean(owner);refreshButtons();
  if(!owner)return;
  try {
   const {data,error}=await client.from('goodcompany_profiles').select('recommended_jobs').eq('user_id',owner).maybeSingle();
   if(error)throw error;if(current!==generation)return;jobs=data?.recommended_jobs || [];
  } catch {if(current===generation){failed=true;status('Could not load your top ten. You can try adding again.');}}
  finally {if(current===generation){loading=false;refreshButtons();}}
  if(current!==generation)return;
  let pending;try{pending=JSON.parse(localStorage.getItem('goodcompany-pending-recommendation') || 'null');}catch{}
  if(pending?.expires>Date.now() && JOBS.some(j=>j.id===pending.id)){
   localStorage.removeItem('goodcompany-pending-recommendation');await add(pending.id);
  }
 }
 async function add(id){
  if(busy || loading || !JOBS.some(j=>j.id===id))return;
  if(!account.getUser()){
   try{localStorage.setItem('goodcompany-pending-recommendation',JSON.stringify({id,expires:Date.now()+3600000}));}catch{}
   account.openAccount();document.getElementById('account-status').textContent='Sign in to add this job to your top ten.';return;
  }
  if(!failed && jobs.includes(id))return;
  const user=account.getUser().id;busy=true;refreshButtons();status('Saving to your top ten…');
  try {
   const {data,error}=await client.rpc('goodcompany_recommend_job',{job_id:id});
   if(error)throw error;if(account.getUser()?.id!==user)return;
   jobs=data;failed=false;status('Saved to your top ten jobs. Manage your list on your profile.');
  } catch(error){if(account.getUser()?.id===user)status(error.code==='P0001'?error.message:'Could not save this job. Please try again.');}
  finally{busy=false;refreshButtons();}
 }
 document.addEventListener('click',event=>{const b=event.target.closest('[data-recommend-job]');if(b){event.preventDefault();event.stopPropagation();add(b.dataset.recommendJob);}});
 window.addEventListener('goodcompany-account-change',()=>sync());
 window.addEventListener('focus',()=>sync(true));
 window.GoodCompanyRecommendations={refreshButtons};sync();
})();
