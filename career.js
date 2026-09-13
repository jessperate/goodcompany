(() => {
  'use strict';
  const account=window.GoodCompanyAccount, model=window.GoodCompanyCareerModel;
  let state={userId:null,preferences:null,profile:null,error:false},promise=null,revision=0;
  async function load(force=false){
    const id=account.getUser()?.id||null;
    if(!force&&state.userId===id&&promise)return promise;
    const token=++revision;state={userId:id,preferences:null,profile:null,error:false};
    if(!id){promise=Promise.resolve(state);window.dispatchEvent(new Event('goodcompany-career-change'));return promise;}
    promise=(async()=>{
      try{
        const [p,r]=await Promise.all([
          account.client.from('goodcompany_career_preferences').select('*').eq('user_id',id).maybeSingle(),
          account.client.from('goodcompany_profiles').select('user_id,first_name,last_name,bio,links,work_history').eq('user_id',id).maybeSingle()
        ]);
        if(p.error||r.error)throw new Error('load');
        if(token===revision)state={userId:id,preferences:p.data,profile:r.data,error:false};
      }catch{if(token===revision)state.error=true;}
      if(token===revision)window.dispatchEvent(new Event('goodcompany-career-change'));
      return state;
    })();return promise;
  }
  function safeNext(value){try{const url=new URL(value,location.origin);return url.origin===location.origin&&['/','/profile.html'].includes(url.pathname)?url.pathname+url.search+url.hash:'/#directory';}catch{return '/#directory';}}
  async function routeAfterSignIn(){
    if(location.pathname.endsWith('/onboarding.html'))return false;
    const current=await load();if(current.error||!current.userId)return false;
    let pending=null;try{pending=JSON.parse(sessionStorage.getItem('goodcompany-onboarding-draft'));}catch{}
    if(pending||(!current.preferences?.onboarding_completed&&!current.profile)){
      let next=location.pathname+location.search+location.hash;
      try{const invitation=JSON.parse(localStorage.getItem('goodcompany-invite-return')||'null');if(invitation?.expires>Date.now()&&/^[0-9a-f-]{36}$/i.test(invitation.id))next='/profile.html?invite='+invitation.id;}catch{}
      if(sessionStorage.getItem('goodcompany-return-profile')&&!next.includes('invite='))next='/profile.html';
      location.replace('onboarding.html?next='+encodeURIComponent(safeNext(pending?.next||next)));return true;
    }return false;
  }
  async function savePreferences(values){
    const id=account.getUser()?.id;if(!id)throw new Error('Sign in to save your interests.');
    const {data,error}=await account.client.from('goodcompany_career_preferences').upsert({user_id:id,...model.cleanPreferences(values),onboarding_completed:true,updated_at:new Date().toISOString()}).select().single();
    if(error)throw new Error('Your interests weren’t saved. Please try again.');
    if(id!==account.getUser()?.id)throw new Error('Your account changed. Please try again.');
    state={...state,userId:id,preferences:data};window.dispatchEvent(new Event('goodcompany-career-change'));return data;
  }
  function profilePreferences(){
    const host=document.getElementById('career-profile-interests');if(!host)return;
    const requested=new URLSearchParams(location.search).get('id');
    host.hidden=!state.userId||Boolean(requested&&requested!==state.userId);if(host.hidden)return;
    const summary=Object.values(model.cleanPreferences(state.preferences||{})).flat();
    host.querySelector('p').textContent=state.error?'Couldn’t load your interests. Open preferences to try again.':summary.length?summary.join(' · '):'Choose the companies, industries, and roles you want to explore. No finished profile needed.';
  }
  window.GoodCompanyCareer={load,getState:()=>state,savePreferences,safeNext,routeAfterSignIn};
  window.addEventListener('goodcompany-account-change',()=>load());
  window.addEventListener('goodcompany-career-change',profilePreferences);
  load();
})();
