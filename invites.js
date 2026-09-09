(() => {
  'use strict';
  const $=id=>document.getElementById(id), account=window.GoodCompanyAccount;
  const client=account.client, profileUI=window.GoodCompanyProfile;
  const esc=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');
  const incoming=new URLSearchParams(location.search).get('invite');
  const link=id=>'https://in-good.company/profile.html?invite='+encodeURIComponent(id);
  let rows=[],listKey='',listGeneration=0,welcomeGeneration=0,requestId=null,creating=false,accepting=false;
  let selectedInvite=null,openingButton=null,welcome=null;
  const errors=error=>error?.code==='P0001' ? error.message : 'Could not complete that request. Please try again.';
  const date=value=>new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  const ownEditor=()=>{const s=profileUI.getState();return s.owner && s.editing && account.getUser();};
  function clearReturn() {try {localStorage.removeItem('goodcompany-invite-return');}catch{}}
  function rememberReturn() {try {localStorage.setItem('goodcompany-invite-return',JSON.stringify({id:incoming,expires:Date.now()+3600000}));}catch{}}
  function renderList() {
    const s=profileUI.getState();
    $('invite-list').innerHTML=rows.length ? rows.map(row=>{
      const added=row.creative_id && s.creativeIds.includes(row.creative_id);
      const label=row.status==='ready' ? [row.first_name,row.last_name].filter(Boolean).join(' ') : row.recipient_label;
      const state=added?'Selected in your top 10':({pending:'Waiting for them to accept',accepted:'Accepted · waiting for a published profile',ready:'Published · ready to add',expired:'Link expired'})[row.status];
      return `<article class="invite-row"><strong>${esc(label)}</strong><p>${esc(state)}</p>${row.status==='pending'?`<small>Expires ${esc(date(row.expires_at))}</small>`:''}<div class="invite-row-actions">${row.status==='ready'?`<button type="button" data-invite-add="${esc(row.id)}" ${added || s.creativeIds.length>=10 || s.saving?'disabled':''}>${added?'Selected':s.creativeIds.length>=10?'Your top 10 is full':'Add to my top 10'}</button>`:''}${row.status==='pending'?`<button type="button" data-invite-link="${esc(row.id)}">Share invite</button>`:''}<button type="button" data-invite-cancel="${esc(row.id)}">${row.status==='expired'?'Dismiss':'Cancel invitation'}</button></div></article>`;
    }).join('') : '<p class="no-picks">No pending invitations. Invite someone you’d love to recommend.</p>';
  }
  async function refreshList() {
    const user=account.getUser(); if(!ownEditor()) return;
    const token=++listGeneration;
    $('invite-list-status').textContent='Checking invitations…';
    try {
      const {data,error}=await client.rpc('goodcompany_list_invites');
      if(error) throw error;
      if(token!==listGeneration || account.getUser()?.id!==user.id || !ownEditor()) return;
      rows=data || []; renderList(); $('invite-list-status').textContent='';
    } catch(error) {if(token===listGeneration) $('invite-list-status').textContent=errors(error);}
  }
  function showResult(id) {
    selectedInvite=id;
    const url=link(id), message=`I’d love to feature you in my top 10 creatives on Good Company. Accept my invitation, create your profile, and publish it when you’re ready.\n\n${url}`;
    $('invite-form').hidden=true; $('invite-result').hidden=false;
    $('invite-message').value=message; $('invite-link').value=url;
    $('invite-email').href='mailto:?subject='+encodeURIComponent('Come join me on Good Company')+'&body='+encodeURIComponent(message);
    $('invite-share').hidden=typeof navigator.share!=='function';
    $('invite-status').textContent='Ready to share. Send this personal link to one person.';
  }
  function openDialog(id=null) {
    if(!ownEditor()) return;
    openingButton=document.activeElement;
    requestId=crypto.randomUUID(); selectedInvite=null;
    $('invite-form').hidden=false; $('invite-result').hidden=true;
    $('invite-name').value=$('creative-search').value.trim().slice(0,80);
    const published=profileUI.getState().profile?.published;
    $('invite-create').disabled=!published;
    $('invite-status').textContent=published ? '' : 'Save and publish your profile first so your invitation can introduce you by name.';
    if(id) showResult(id);
    $('invite-dialog').showModal();
    (id ? $('invite-copy') : $('invite-name')).focus();
  }
  $('invite-open').addEventListener('click',()=>openDialog());
  $('invite-close').addEventListener('click',()=>$('invite-dialog').close());
  $('invite-dialog').addEventListener('close',()=>openingButton?.isConnected && openingButton.focus());
  $('invite-dialog').addEventListener('click',event=>{if(event.target===$('invite-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) event.target.close();}});
  $('invite-form').addEventListener('submit',async event=>{
    event.preventDefault(); if(creating || !ownEditor() || !$('invite-form').reportValidity()) return;
    const user=account.getUser(); creating=true; $('invite-create').disabled=true;
    $('invite-status').textContent='Creating your invitation…';
    try {
      const {data,error}=await client.rpc('goodcompany_create_invite',{invite_id:requestId,recipient_label:$('invite-name').value.trim()});
      if(error) throw error;
      if(account.getUser()?.id!==user.id || !ownEditor()) return;
      showResult(data); refreshList();
    } catch(error) {$('invite-status').textContent=errors(error);}
    finally {creating=false; $('invite-create').disabled=!profileUI.getState().profile?.published;}
  });
  $('invite-copy').addEventListener('click',async()=>{
    try {await navigator.clipboard.writeText($('invite-message').value);$('invite-status').textContent='Invitation copied. Paste it into a message to your creative.';}
    catch {$('invite-message').focus();$('invite-message').select();$('invite-status').textContent='Select and copy the invitation above.';}
  });
  $('invite-link').addEventListener('click',()=>$('invite-link').select());
  $('invite-share').addEventListener('click',async()=>{
    if(!selectedInvite) return;
    try {await navigator.share({title:'An invitation to Good Company',text:'I’d love to feature you in my top 10 creatives.',url:link(selectedInvite)});}
    catch(error) {if(error.name!=='AbortError') $('invite-status').textContent='Use Copy invitation to share this link.';}
  });
  $('invite-refresh').addEventListener('click',refreshList);
  $('invite-list').addEventListener('click',async event=>{
    const b=event.target.closest('button');if(!b || !ownEditor() || profileUI.getState().saving) return;
    if(b.dataset.inviteLink) {openDialog(b.dataset.inviteLink);return;}
    if(b.dataset.inviteAdd) {
      const row=rows.find(r=>r.id===b.dataset.inviteAdd);if(!row?.creative_id) return;
      b.disabled=true;
      const owner=account.getUser()?.id;
      try {
        const {data,error}=await client.from('goodcompany_profiles').select('user_id,first_name,last_name').eq('user_id',row.creative_id).eq('published',true).maybeSingle();
        if(error) throw error;
        if(account.getUser()?.id!==owner) return;
        if(!data) {$('invite-list-status').textContent='This profile is no longer public. Refresh your invitations.';return;}
        if(profileUI.addCreative(data)) $('invite-list-status').textContent='Added to your selection. Save your profile to keep this recommendation.';
        else $('invite-list-status').textContent='Your list is full or this creative is already selected.';
      } catch(error) {$('invite-list-status').textContent=errors(error);}
      finally {renderList();}
    }
    if(b.dataset.inviteCancel) {
      if(b.dataset.confirmCancel!=='yes'){b.dataset.confirmCancel='yes';b.textContent='Confirm cancel';$('invite-list-status').textContent='This will disable the invitation link. Click Confirm cancel to continue.';return;}
      b.disabled=true;
      try {const {error}=await client.rpc('goodcompany_cancel_invite',{invite_id:b.dataset.inviteCancel});if(error) throw error;await refreshList();}
      catch(error) {$('invite-list-status').textContent=errors(error);b.disabled=false;}
    }
  });
  function renderWelcome() {
    if(!incoming) return;
    const user=account.getUser(), s=profileUI.getState();
    $('invite-welcome').hidden=false; $('invite-accept').hidden=true;$('invite-edit-profile').hidden=true;
    if(!welcome) {$('invite-welcome-copy').textContent='Checking your invitation…';return;}
    if(welcome.status==='unavailable') {
      $('invite-welcome-title').textContent='This invitation is unavailable.';
      $('invite-welcome-copy').textContent='It may have expired, been canceled, or already been accepted by someone else. Ask the sender for a new link.';
      clearReturn();return;
    }
    $('invite-welcome-title').textContent=`${welcome.inviter_name} invited you to Good Company.`;
    if(welcome.status==='own') {$('invite-welcome-copy').textContent='This is your invitation. Share the link with the creative you’d like to recommend.';clearReturn();return;}
    if(welcome.status==='accepted') {
      clearReturn();
      $('invite-welcome-copy').textContent=s.profile?.published && s.owner ? 'Your profile is published. Your inviter can now choose to add you to their top 10.' : 'Invitation accepted! Create your profile and choose Publish my profile when you’re ready. Your inviter can then add you to their top 10.';
      $('invite-edit-profile').hidden=false;
      return;
    }
    if(!account.getUser()) rememberReturn();
    $('invite-welcome-copy').textContent='They’d love to feature you in their top 10 creatives. Accept to connect your profile to this invitation; you choose when to publish it.';
    $('invite-accept').hidden=false; $('invite-accept').disabled=accepting;
    $('invite-accept').textContent=user ? 'Accept invitation' : 'Sign in to accept';
  }
  async function loadWelcome() {
    if(!incoming) return;
    const token=++welcomeGeneration;
    if(!valid(incoming)) {welcome={status:'unavailable'};renderWelcome();return;}
    renderWelcome();
    try {
      const {data,error}=await client.rpc('goodcompany_lookup_invite',{invite_id:incoming});if(error) throw error;
      if(token!==welcomeGeneration) return;
      welcome=data;renderWelcome();
    } catch {if(token===welcomeGeneration){$('invite-welcome').hidden=false;$('invite-welcome-copy').textContent='We couldn’t check this invitation. Refresh to try again.';}}
  }
  $('invite-accept').addEventListener('click',async()=>{
    if(accepting || welcome?.status!=='pending') return;
    if(!account.getUser()) {rememberReturn();sessionStorage.setItem('goodcompany-return-profile','1');account.openAccount();return;}
    accepting=true;renderWelcome();$('invite-welcome-status').textContent='Accepting your invitation…';
    try {
      const {error}=await client.rpc('goodcompany_claim_invite',{invite_id:incoming});if(error) throw error;
      clearReturn();$('invite-welcome-status').textContent='Invitation accepted.';await loadWelcome();
    } catch(error) {$('invite-welcome-status').textContent=errors(error);}
    finally {accepting=false;renderWelcome();}
  });
  $('invite-edit-profile').addEventListener('click',event=>{
    const s=profileUI.getState();
    if(!s.owner) return;
    event.preventDefault();
    if(!s.editing && !$('edit-profile').hidden) $('edit-profile').click();
    $('profile-main').scrollIntoView({block:'start'});
    document.querySelector('#profile-form input[name=first_name]')?.focus();
  });
  function sync() {
    const s=profileUI.getState(), user=account.getUser();
    const key=ownEditor() ? `${user.id}:${Boolean(s.profile?.published)}` : '';
    if(key!==listKey) {listKey=key;rows=[];++listGeneration;if(key)refreshList();}
    else if(key)renderList();
    if(!user || !s.owner) {if($('invite-dialog').open)$('invite-dialog').close();$('invite-result').hidden=true;}
    renderWelcome();
  }
  window.addEventListener('goodcompany-profile-view',sync);
  window.addEventListener('goodcompany-account-change',()=>{sync();loadWelcome();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(ownEditor())refreshList();if(incoming)loadWelcome();}});
  sync();loadWelcome();
})();
