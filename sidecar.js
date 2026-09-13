(() => {
  'use strict';
  const $=id=>document.getElementById(id),account=window.GoodCompanyAccount,career=window.GoodCompanyCareer,model=window.GoodCompanyCareerModel;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let active=null,profile={},source='',generation=0,dirty=false,busy=false,proposal='',openedBy=null,activeUser=null;
  const drafts=new Map();
  const panel=$('career-sidecar'),dialog=$('job-dialog');
  function say(text){$('sidecar-status').textContent=text;}
  function close(){if(busy)return;if(dirty&&!confirm('Close without saving this résumé draft?'))return;panel.hidden=true;dialog.classList.remove('has-sidecar');active=null;++generation;dirty=false;openedBy?.focus();}
  function updateFit(){
    if(!active)return;
    const result=model.fit(active,profile,source),s=career.getState();
    const prefs=model.preferences(active,s.preferences||{},COMPANIES[active.company]||{},COMPANY_STAGES[active.company]||{});
    $('fit-results').innerHTML=`<div class="fit-score"><strong>${result.score===null?'—':result.score+'%'}</strong><div><h3>Experience overlap</h3><p>${result.score===null?(result.enough?'This listing has too few recognized topic cues to score.':'Add accomplishments or résumé text for a more useful check.'):`${result.matched.length} of ${result.total} topic cues appear in your ${result.source}.`}</p></div></div><p class="sidecar-help">A keyword-based guide, not an ATS score or a prediction. It doesn’t assess portfolio quality, seniority, eligibility, or location requirements.</p><details><summary>How this check works</summary><p>We look for a fixed set of creative skills and topics in the saved job title, summary, and highlights, then check for the same topics in your history or pasted résumé. Each topic counts equally. A missing mention doesn’t mean missing experience. Preferences are separate from this score.</p><p>Job information checked ${esc(active.checkedAt||'date unavailable')}. <a href="${esc(active.url)}" target="_blank" rel="noopener noreferrer">Confirm the full, current requirements <i class="ri-arrow-right-up-line" aria-hidden="true"></i></a>.</p></details>${prefs.length?`<h3>Your interests</h3><ul class="preference-matches">${prefs.map(p=>`<li><i class="ri-${p.unknown?'question':p.match?'checkbox-circle':'subtract'}-line" aria-hidden="true"></i><div>${esc(p.label)}: ${p.unknown?'Not enough company information':p.match?'Matches your choices':'Outside your choices'}<small>${esc(p.actual.join(' · '))}${p.inferred&&!p.unknown?' · Inferred from company description':''}</small></div></li>`).join('')}</ul>`:'<p><a href="onboarding.html">Set your job interests</a> to compare company types, industries, and roles.</p>'}<h3>Experience to bring forward</h3>${result.matched.length?`<ul class="fit-evidence">${result.matched.map(m=>`<li><strong>${esc(m.label)}</strong><p>“${esc(m.evidence)}”</p></li>`).join('')}</ul>`:'<p>No clear topic matches yet. Add concrete projects and accomplishments to your profile or paste résumé text below.</p>'}<h3>Things to make clearer</h3>${result.gaps.length?`<p>These topics appear in the listing but weren’t found in your text. Add a specific example only if it reflects your experience.</p><ul>${result.gaps.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>All recognized topic cues are covered. Check the original listing for requirements this simple check may miss.</p>'}`;
  }
  async function open(id,button){
    if(active?.id===id&&!panel.hidden)return;
    if(dirty&&!confirm('Discard the unsaved draft before opening another job?'))return;
    const job=JOBS.find(j=>j.id===id);if(!job)return;
    active=job;openedBy=button;const token=++generation;dirty=false;busy=false;proposal='';
    panel.hidden=false;dialog.classList.add('has-sidecar');$('sidecar-heading').focus();$('sidecar-company').textContent=`${job.company} / ${job.title}`;
    $('sidecar-body').hidden=true;$('sidecar-guest').hidden=true;say('Loading your career history…');
    const state=await career.load(true);if(token!==generation)return;
    if(!state.userId){$('sidecar-guest').hidden=false;say('Sign in to compare your experience and keep a private résumé draft.');return;}
    if(state.error){say('Couldn’t load your saved history. Close this panel and try again.');return;}
    activeUser=state.userId;profile=state.profile||{};source='';$('resume-ai-consent').checked=false;
    try{
      const {data,error}=await account.client.from('goodcompany_resume_drafts').select('draft_text,source_text,updated_at').eq('user_id',state.userId).eq('job_id',id).maybeSingle();
      if(error)throw error;if(token!==generation||state.userId!==account.getUser()?.id)return;
      source=data?.source_text||'';$('resume-source').value=source;$('resume-draft').value=data?.draft_text||'';drafts.set(state.userId+':'+id,data);
      $('sidecar-body').hidden=false;$('refinement-review').hidden=true;$('resume-draft').readOnly=Boolean(data?.draft_text);$('resume-edit').hidden=!data?.draft_text;
      $('sidecar-profile-hint').textContent=profile.work_history?.length?'Using the career history saved on your profile.':'Your profile doesn’t have career history yet. Add it, or paste your résumé below.';
      updateFit();say(data?'Your private draft is saved. Click Edit draft to make changes.':'Your résumé stays private. Start from your career history or paste your existing résumé.');
    }catch{if(token===generation)say('Couldn’t load your draft. Close this panel and try again before editing.');}
  }
  $('sidecar-close').addEventListener('click',close);
  document.addEventListener('click',event=>{const b=event.target.closest('[data-check-fit]');if(b){event.preventDefault();open(b.dataset.checkFit,b);}});
  $('sidecar-signin').addEventListener('click',()=>{sessionStorage.setItem('goodcompany-return-fit',active.id);account.openAccount();});
  $('resume-source').addEventListener('input',()=>{source=$('resume-source').value;dirty=true;say('Unsaved résumé text. Save draft to keep it for this job.');});
  $('resume-check').addEventListener('click',()=>{updateFit();say('Experience overlap updated using your résumé text.');});
  $('resume-build').addEventListener('click',()=>{
    if(!active||busy)return;
    if($('resume-draft').value&&!confirm('Replace the current draft with a fresh draft from your history or résumé text?'))return;
    if(!source.trim()&&!profile.work_history?.length){say('Add career history to your profile, or paste résumé text first.');return;}
    $('resume-draft').value=model.draft(active,profile,source);$('resume-draft').readOnly=false;$('resume-edit').hidden=true;dirty=true;$('resume-draft').focus();
    say('Draft ready. Your facts are preserved; relevant accomplishment lines are brought forward. Review and edit before saving.');
  });
  $('resume-edit').addEventListener('click',()=>{$('resume-draft').readOnly=false;$('resume-edit').hidden=true;$('resume-draft').focus();});
  $('resume-draft').addEventListener('input',()=>{dirty=true;say('Unsaved changes.');});
  $('resume-save').addEventListener('click',async()=>{
    if(!active||busy)return;const id=active.id,uid=account.getUser()?.id,token=generation;
    if(!uid){say('Sign in again to save.');return;}
    busy=true;$('resume-save').disabled=true;say('Saving your private draft…');
    try{
      const row={user_id:uid,job_id:id,draft_text:$('resume-draft').value,source_text:source,updated_at:new Date().toISOString()};
      const {error}=await account.client.from('goodcompany_resume_drafts').upsert(row);if(error)throw error;
      if(token!==generation||uid!==account.getUser()?.id)return;
      drafts.set(uid+':'+id,row);dirty=false;$('resume-draft').readOnly=true;$('resume-edit').hidden=false;say('Saved privately to your account. Your public profile is unchanged.');
    }catch{if(token===generation)say('Your draft wasn’t saved. Your edits are still here; please try again.');}
    finally{busy=false;$('resume-save').disabled=false;}
  });
  $('resume-delete').addEventListener('click',async()=>{
    if(!active||busy||!confirm('Delete the private résumé text and draft saved for this job?'))return;
    const token=generation,uid=account.getUser()?.id;if(!uid)return;busy=true;
    try{const {error}=await account.client.from('goodcompany_resume_drafts').delete().eq('user_id',uid).eq('job_id',active.id);if(error)throw error;if(token!==generation)return;source='';$('resume-source').value='';$('resume-draft').value='';$('resume-draft').readOnly=false;$('resume-edit').hidden=true;$('refinement-review').hidden=true;dirty=false;updateFit();say('Deleted the saved résumé text and draft for this job.');}catch{say('Couldn’t delete this draft. Please try again.');}finally{busy=false;}
  });
  $('resume-copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('resume-draft').value);say('Résumé copied.');}catch{$('resume-draft').focus();$('resume-draft').select();say('Select and copy the résumé text.');}});
  $('resume-download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([$ ('resume-draft').value],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`good-company-${active.company.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-resume.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('resume-refine').addEventListener('click',async()=>{
    if(!active||busy)return;
    const draft=$('resume-draft').value.trim();if(draft.length<80){say('Build or paste a draft with some career details first.');return;}
    if(!$('resume-ai-consent').checked){say('Check the box to send this draft and the job description for AI refinement.');$('resume-ai-consent').focus();return;}
    const token=generation,uid=account.getUser()?.id;busy=true;$('resume-refine').disabled=true;$('resume-draft').readOnly=true;say('Polishing your draft. Your original stays here while you review the suggestion…');
    try{
      const {data}=await account.client.auth.getSession();if(!data.session)throw new Error('Please sign in again.');
      const payload=JSON.stringify({jobId:active.id,draft,consent:true});
      const send=accessToken=>fetch('/api/resume-refine',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+accessToken},body:payload,signal:AbortSignal.timeout(60000)});
      let response=await send(data.session.access_token);
      if(response.status===401){
        const refreshed=await account.client.auth.refreshSession();
        if(refreshed.error||!refreshed.data.session)throw new Error('Your session expired. Sign in again to refine; your draft is still here.');
        response=await send(refreshed.data.session.access_token);
      }
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Refinement is unavailable. Your draft is unchanged.');
      if(token!==generation||uid!==account.getUser()?.id)return;
      proposal=result.text;$('resume-proposal').value=proposal;$('refinement-review').hidden=false;
      say('Suggestion ready. Check every claim against your experience before using it. Nothing has been replaced or saved.');$('refinement-review').scrollIntoView({block:'nearest'});
    }catch(e){if(token===generation)say(e.name==='TimeoutError'?'That took too long. Your draft is unchanged. Try again later.':e.message);}
    finally{busy=false;$('resume-refine').disabled=false;$('resume-edit').hidden=false;}
  });
  $('resume-use-proposal').addEventListener('click',()=>{$('resume-draft').value=$('resume-proposal').value;$('resume-draft').readOnly=false;$('resume-edit').hidden=true;$('refinement-review').hidden=true;dirty=true;say('Suggestion moved to your draft. Review it, then save.');});
  $('resume-discard-proposal').addEventListener('click',()=>{$('refinement-review').hidden=true;proposal='';say('Suggestion discarded. Your original draft is unchanged.');});
  window.GoodCompanySidecar={changeJob:id=>{if(!active||active.id===id)return true;if(busy||(dirty&&!confirm('Discard the unsaved draft before opening another job?')))return false;dirty=false;panel.hidden=true;dialog.classList.remove('has-sidecar');active=null;++generation;return true;}};
  dialog.addEventListener('cancel',event=>{if(!panel.hidden){event.preventDefault();close();}});
  dialog.addEventListener('close',()=>{panel.hidden=true;dialog.classList.remove('has-sidecar');++generation;active=null;dirty=false;});
  // Main folder controls must not silently discard an unsaved private draft.
  dialog.addEventListener('click',event=>{if((event.target.closest('#job-close,#job-minimize')||event.target===dialog)&&(busy||(dirty&&!confirm('Close this job without saving your résumé draft?')))){event.preventDefault();event.stopImmediatePropagation();}},true);
  window.addEventListener('goodcompany-account-change',()=>{if(active&&activeUser!==account.getUser()?.id){panel.hidden=true;dialog.classList.remove('has-sidecar');++generation;active=null;dirty=false;$('resume-draft').value='';$('resume-source').value='';}});
  window.addEventListener('beforeunload',event=>{if(dirty||busy){event.preventDefault();event.returnValue='';}});
  const resumePending=async()=>{const id=sessionStorage.getItem('goodcompany-return-fit');if(id&&account.getUser()&&dialog.dataset.jobId===id){sessionStorage.removeItem('goodcompany-return-fit');open(id,document.querySelector('[data-check-fit]'));}};
  window.addEventListener('goodcompany-career-change',resumePending);
})();
