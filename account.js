(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const dialog = $('account-dialog');
  const client = window.supabase.createClient('https://eodrqcucaersbpxxessa.supabase.co', 'sb_publishable_0hxg0eaxPx48OjiB3eSMMQ_DK3827FO');
  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let user = null, pins = new Map(), revision = 0, loading = true;
  const busy = new Set();
  const message = text => { $('account-status').textContent = text; };
  function refreshButtons() {
    document.querySelectorAll('[data-pin]').forEach(button => {
      const saved = pins.has(button.dataset.pin);
      button.setAttribute('aria-pressed', String(saved));
      button.innerHTML = saved ? 'Pinned <i class="ri-pushpin-fill" aria-hidden="true"></i>' : 'Pin job <i class="ri-pushpin-line" aria-hidden="true"></i>';
      button.disabled = loading || busy.has(button.dataset.pin);
    });
  }
  function renderProfile() {
    $('account-open').textContent = user ? 'My profile' : 'Sign in';
    $('account-title').textContent = user ? 'Your next chapter.' : 'Keep the good ones.';
    $('account-form').hidden = Boolean(user);
    $('account-profile').hidden = !user;
    $('profile-email').textContent = user?.email || '';
    $('pinned-jobs').innerHTML = [...pins.values()].map(pin => `<article class="saved-job"><p>${escape(pin.company)}</p><h3>${escape(pin.title)}</h3><div><a href="${escape(/^https:\/\//.test(pin.source_url) ? pin.source_url : '#')}" target="_blank" rel="noopener noreferrer">View listing <i class="ri-arrow-right-up-line" aria-hidden="true"></i></a><button type="button" class="pin-job" data-pin="${escape(pin.job_id)}" aria-label="Unpin ${escape(pin.title)}">Pinned <i class="ri-pushpin-fill" aria-hidden="true"></i></button></div></article>`).join('');
    $('pins-empty').hidden = pins.size > 0;
    $('pins-empty').textContent = loading ? 'Loading your pinned jobs…' : 'Your shortlist starts here. Pin a job that catches your eye.';
    refreshButtons();
  }
  async function sessionChanged(session) {
    const nextUser = session?.user || null;
    if (!loading && nextUser?.id === user?.id) return;
    const current = ++revision;
    user = nextUser; pins.clear(); loading = Boolean(user); renderProfile();
    if (!user) { loading = false; renderProfile(); return; }
    try {
      const rows = [];
      for (let start = 0; ; start += 1000) {
        const {data, error} = await client.from('goodcompany_saved_jobs').select('job_id,title,company,source_url,saved_at').order('saved_at',{ascending:false}).order('job_id').range(start,start+999);
        if (error) throw error;
        if (current !== revision) return;
        rows.push(...data);
        if (data.length < 1000) break;
      }
      pins = new Map(rows.map(row => [row.job_id,row]));
      message('');
    } catch (error) { if (current === revision) message('Could not load your pinned jobs. Please sign out and try again.'); }
    finally { if (current === revision) { loading = false; renderProfile(); } }
  }
  function openAccount() { if (!dialog.open) dialog.showModal(); }
  async function togglePin(id) {
    if (loading || busy.has(id)) return;
    if (!user) { sessionStorage.setItem('goodcompany-pending-pin',id); openAccount(); message('Sign in to pin this job to your profile.'); return; }
    const owner = user.id, current = revision, existing = pins.get(id), job = JOBS.find(job => job.id === id);
    if (!existing && !job) return;
    busy.add(id); refreshButtons();
    try {
      const row = existing || {job_id:id,title:job.title,company:job.company,source_url:job.url};
      const {error} = existing ? await client.from('goodcompany_saved_jobs').delete().eq('user_id',owner).eq('job_id',id) : await client.from('goodcompany_saved_jobs').insert({...row,user_id:owner});
      if (error && error.code !== '23505') throw error;
      if (current !== revision) return;
      if (existing) pins.delete(id); else pins.set(id,row);
      message(existing ? 'Job unpinned.' : 'Job pinned to your profile.');
      $('pin-status').textContent = existing ? 'Job unpinned.' : 'Job pinned to your profile.';
    } catch (error) { if (current === revision) { openAccount(); message('Could not save that change. Please try again.'); } }
    finally { busy.delete(id); renderProfile(); }
  }
  window.GoodCompanyAccount = {refreshButtons};
  document.addEventListener('click', event => { const button = event.target.closest('[data-pin]'); if (button) { event.preventDefault(); event.stopPropagation(); togglePin(button.dataset.pin); } });
  $('account-open').addEventListener('click',openAccount);
  $('account-close').addEventListener('click',()=>dialog.close());
  $('account-form').addEventListener('submit',async event => {
    event.preventDefault(); const button = $('email-submit'); button.disabled = true; message('Sending your sign-in link…');
    try {
      const {error} = await client.auth.signInWithOtp({email:$('account-email').value.trim(),options:{emailRedirectTo:'https://good-company-jess.vercel.app/'}});
      if (error) throw error;
      message('Check your inbox for a sign-in link. It creates your account if you’re new here. You can close this window.');
    } catch (error) { message(error.status === 429 ? 'Too many requests. Please wait a few minutes before trying again.' : 'We couldn’t send your link. Please check your email address and try again.'); }
    finally { button.disabled = false; }
  });
  $('account-signout').addEventListener('click',async () => {
    $('account-signout').disabled = true;
    const {error} = await client.auth.signOut({scope:'local'});
    $('account-signout').disabled = false;
    if (error) message('Could not sign out. Please try again.'); else { sessionStorage.removeItem('goodcompany-pending-pin'); message('You’re signed out.'); }
  });
  client.auth.onAuthStateChange((event,session) => { setTimeout(async () => {
    await sessionChanged(session);
    if (event === 'SIGNED_IN' && session) {
      const pending = sessionStorage.getItem('goodcompany-pending-pin');
      if (pending) { sessionStorage.removeItem('goodcompany-pending-pin'); if (!pins.has(pending)) await togglePin(pending); }
    }
  },0); });
  client.auth.getSession().then(({data,error}) => { if (error) message('Your sign-in link may have expired. Request a new one.'); sessionChanged(data.session); });
  const callbackError = new URLSearchParams(location.hash.slice(1)).get('error_description');
  if (callbackError) { openAccount(); message('This sign-in link has expired or was already used. Please request a new link.'); history.replaceState(null,'',location.pathname); }
})();
