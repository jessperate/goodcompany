(() => {
  'use strict';
  const $=id=>document.getElementById(id),career=window.GoodCompanyCareer,model=window.GoodCompanyCareerModel,account=window.GoodCompanyAccount;
  const next=career.safeNext(new URLSearchParams(location.search).get('next')||'/#directory');
  const sections=[['company_types','What’s your kind of company?','From small teams to household names. Pick any that feel right.'],['industries','What worlds interest you?','A little curiosity goes a long way. Choose as many as you like.'],['roles','What would you like to make next?','Choose your disciplines. You can explore outside them anytime.']];
  let step=0,dirty=false,saving=false,initialized=false;
  function checks(key){return model.choices[key].map((label,i)=>`<label class="interest-choice"><input type="checkbox" name="${key}" value="${label}" id="${key}-${i}"><span>${label}</span><i class="ri-check-line" aria-hidden="true"></i></label>`).join('');}
  $('onboarding-steps').innerHTML=sections.map(([key,title,copy],i)=>`<section data-step="${i}" ${i?'hidden':''}><p class="eyebrow">A LITTLE DIRECTION / ${i+1} OF 3</p><h1 tabindex="-1">${title}</h1><p>${copy}</p><fieldset><legend class="sr-only">${title}</legend><div class="interest-grid">${checks(key)}</div></fieldset>${key==='roles'?`<fieldset class="work-preferences"><legend>How do you like to work? <span>(optional)</span></legend><div class="interest-grid">${checks('work_setups')}</div></fieldset>`:''}</section>`).join('');
  function values(){return Object.fromEntries(Object.keys(model.choices).map(k=>[k,[...document.querySelectorAll(`input[name="${k}"]:checked`)].map(x=>x.value)]));}
  function paint(p){for(const input of $('onboarding-form').querySelectorAll('input'))input.checked=(p[input.name]||[]).includes(input.value);}
  function show(focus=true){document.querySelectorAll('[data-step]').forEach(el=>el.hidden=Number(el.dataset.step)!==step);$('onboarding-back').hidden=!step;$('onboarding-next').textContent=step===2?'Save my interests':'Next';$('onboarding-progress').textContent=`${step+1} / 3`;if(focus)document.querySelector(`[data-step="${step}"] h1`).focus();}
  $('onboarding-form').addEventListener('input',()=>{dirty=true;try{sessionStorage.setItem('goodcompany-onboarding-draft',JSON.stringify({...values(),next}));}catch{}});
  $('onboarding-back').addEventListener('click',()=>{step=Math.max(0,step-1);show();});
  async function finish(skip=false){
    if(saving)return;
    const p=skip?model.cleanPreferences():values();
    if(!account.getUser()){
      try{sessionStorage.setItem('goodcompany-onboarding-draft',JSON.stringify({...p,next,skip}));}catch{}
      $('onboarding-status').textContent='Your choices are ready. Sign in with Google or email to save them to your account.';
      account.openAccount();return;
    }
    saving=true;$('onboarding-controls').disabled=true;$('onboarding-status').textContent='Saving your interests…';
    try{
      await career.savePreferences(p);sessionStorage.removeItem('goodcompany-onboarding-draft');sessionStorage.removeItem('goodcompany-return-profile');dirty=false;
      $('onboarding-form').hidden=true;$('onboarding-done').hidden=false;$('onboarding-status').textContent='Saved to your account. You can change these anytime.';
      $('onboarding-browse').href=next.startsWith('/?')?next:'/#directory';$('onboarding-profile').href=next.startsWith('/profile.html')?next:'/profile.html';
      $('onboarding-done-title').focus();
    }catch(e){$('onboarding-status').textContent=e.message;}finally{saving=false;$('onboarding-controls').disabled=false;}
  }
  $('onboarding-form').addEventListener('submit',event=>{event.preventDefault();if(step<2){step++;show();}else finish();});
  $('onboarding-skip').addEventListener('click',()=>finish(true));
  async function init(){
    const s=await career.load();if(initialized||dirty)return;initialized=true;
    let pending;try{pending=JSON.parse(sessionStorage.getItem('goodcompany-onboarding-draft')||'null');}catch{}
    paint(model.cleanPreferences(pending||s.preferences||{}));
    if(pending&&account.getUser()){step=2;show(false);$('onboarding-status').textContent='Welcome! Your choices are here. Save them to get started.';}
    else if(s.error)$('onboarding-status').textContent='Couldn’t load saved interests. Refresh before editing existing preferences.';
  }
  window.addEventListener('goodcompany-career-change',()=>{if(!dirty){initialized=false;init();}});
  init();show(false);
})();
