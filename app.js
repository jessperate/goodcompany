'use strict';

const hasVerifiedConnection = job => job.connection?.verifiedFirstDegree === true && job.connection?.currentEmployeeCount > 0;

function filterJobs(jobs, {query = '', category = 'All disciplines', workplace = 'all', network = false, level = 'all', comp = 0, disclosed = false} = {}) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return jobs.filter(job => {
    const searchable = [job.title, job.company, job.category, job.location, job.workplace, job.summary, ...(job.highlights || []), ...(job.keywords || [])].join(' ').toLocaleLowerCase();
    return words.every(word => searchable.includes(word)) &&
      (category === 'All disciplines' || job.category === category) &&
      (workplace === 'all' || job.workplace === workplace) &&
      (!network || hasVerifiedConnection(job)) &&
      (level === 'all' || job.level === level) &&
      (!disclosed || Boolean(job.salary)) &&
      (!Number(comp) || (job.salaryCurrency === 'USD' && job.salaryMax >= Number(comp)));
  }).sort((a,b) => Number(hasVerifiedConnection(b)) - Number(hasVerifiedConnection(a)));
}

(() => {
  const $ = id => document.getElementById(id);
  const state = {query:'',category:'All disciplines',workplace:'all',network:false,level:'all',comp:0,disclosed:false};
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const connectionIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m10 13 4-4M8.5 15.5l-1 1a4 4 0 0 1-5.7-5.7l4-4a4 4 0 0 1 5.7 0M15.5 8.5l1-1a4 4 0 0 1 5.7 5.7l-4 4a4 4 0 0 1-5.7 0" transform="translate(0 0) scale(.95)"/></svg>';
  const mark = job => `<span class="company-mark company-logo" aria-hidden="true"><img src="${esc(COMPANIES[job.company]?.logo || '')}" alt="" width="40" height="40" loading="lazy"></span>`;
  function companyProfile(job) {
    const company = COMPANIES[job.company];
    if (!company) return '';
    const links = (title, items) => items?.length ? `<div class="company-resource-group"><h4>${title}</h4><ul>${items.map(item=>`<li><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)} <span aria-hidden="true">↗</span></a><small>${esc(item.source)}</small></li>`).join('')}</ul></div>` : '';
    return `<section class="company-profile detail-section"><p class="eyebrow">BEHIND THE JOB</p><h3>Get to know ${esc(job.company)}</h3><p>${esc(company.about)}</p><a class="company-website" href="${esc(company.website)}" target="_blank" rel="noopener noreferrer">Company website ↗</a><div class="company-review">${company.glassdoor ? `<a href="${esc(company.glassdoor.url)}" target="_blank" rel="noopener noreferrer"><strong>★ ${esc(company.glassdoor.rating)} / 5</strong><span>Employee reviews on Glassdoor ↗</span></a><small>Observed ${esc(company.checkedAt)} · Rating may change; Glassdoor may require sign-in.</small>` : '<p>Glassdoor rating not verified for this company.</p>'}</div>${links('Leadership conversations',company.interviews)}${links('In the news',company.press)}${links('Awards & recognition',company.recognition)}<p class="company-research-note">Company context checked ${esc(company.checkedAt)}. Stories retain their original dates; recognition does not guarantee workplace quality.</p></section>`;
  }
  const categories = ['All disciplines',...new Set(JOBS.map(job => job.category))];

  $('categories').innerHTML = categories.map(category => `<button class="category" type="button" data-category="${esc(category)}" aria-pressed="${category === state.category}"><span>${esc(category)}</span><span class="count">${category === 'All disciplines' ? JOBS.length : JOBS.filter(job=>job.category===category).length}</span></button>`).join('');

  function render() {
    const jobs = filterJobs(JOBS,state);
    $('result-count').innerHTML = `<strong>${jobs.length} ${jobs.length === 1 ? 'opportunity' : 'opportunities'}</strong> ${state.network ? 'in Jess’s network' : 'to make your next move'}`;
    $('empty').hidden = jobs.length > 0;
    const networkReady = JOBS.some(hasVerifiedConnection);
    $('empty-title').textContent = state.network && !networkReady ? 'Verified connections are coming soon' : 'A little too specific?';
    $('empty-description').textContent = state.network && !networkReady ? 'Jess’s LinkedIn network has not been imported yet. Turn off this filter to browse all roles.' : 'Try another keyword or give your filters some breathing room.';
    $('reset').hidden = !state.query && state.category === 'All disciplines' && state.workplace === 'all' && !state.network && state.level === 'all' && !Number(state.comp) && !state.disclosed;
    document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === state.category)));
    $('job-list').innerHTML = jobs.map(job => `<article class="job-card" aria-labelledby="title-${esc(job.id)}">
      <div class="job-body">${mark(job)}<div class="job-copy"><div class="company-line"><span>${esc(job.company)}</span></div><h3 class="job-title" id="title-${esc(job.id)}"><button type="button" data-job="${esc(job.id)}" aria-haspopup="dialog">${esc(job.title)}</button></h3><div class="job-metadata"><span>${esc(job.location)}</span><span class="separator" aria-hidden="true">·</span><span>${esc(job.workplace)}</span><span class="separator" aria-hidden="true">·</span><span class="job-type">${esc(job.level || "Level not specified")}</span></div><p class="job-pay">${esc(job.salaryLabel || "Pay not listed")}</p></div><button type="button" class="details-arrow" data-job="${esc(job.id)}" aria-label="View ${esc(job.title)} at ${esc(job.company)}" aria-haspopup="dialog"><span aria-hidden="true">↗</span></button></div>
      ${hasVerifiedConnection(job) ? `<div class="connection-strip"><span class="network-badge">${connectionIcon}Jess’s network</span><span class="connection-description">${esc(job.connection.short)}</span></div>` : ''}
    </article>`).join('');
  }

  function reset() {
    Object.assign(state,{query:'',category:'All disciplines',workplace:'all',network:false,level:'all',comp:0,disclosed:false});
    $('search').value='';$('workplace').value='all';$('network').checked=false;$('level').value='all';$('comp').value='0';$('disclosed').checked=false;
    render();$('search').focus();
  }

  function openJob(id) {
    const job = JOBS.find(job=>job.id===id);
    if(!job) return;
    $('job-detail').innerHTML = `<div class="detail-company">${mark(job)}<span>${esc(job.company)}</span></div><h2 id="detail-title">${esc(job.title)}</h2><div class="detail-tags"><span>${esc(job.category)}</span><span>${esc(job.level || "Level not specified")}</span><span>${esc(job.location)}</span><span>${esc(job.workplace)}</span>${job.type ? `<span>${esc(job.type)}</span>`:''}</div><section class="detail-section"><h3>The opportunity</h3><p>${esc(job.summary)}</p></section>${job.highlights?.length ? `<section class="detail-section"><h3>A few things to know</h3><ul>${job.highlights.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></section>`:''}${job.salary ? `<section class="detail-section"><h3>Published base salary</h3><p>${esc(job.salary)}</p></section>`:''}${hasVerifiedConnection(job) ? `<section class="detail-section detail-connection"><span class="network-badge">${connectionIcon}The connection</span><p>${esc(job.connection.detail)}</p><p class="connection-caveat">This is a company connection; introductions and referrals aren’t guaranteed.</p></section>`:''}${companyProfile(job)}<div class="detail-footer"><a class="primary-button" href="${esc(job.url)}" target="_blank" rel="noopener noreferrer">View original listing <span aria-hidden="true">↗</span><span class="sr-only">(opens in a new tab)</span></a><p>Source: ${esc(job.company)}’s job board<br>Checked ${esc(job.checkedAt || "September 7, 2026")}</p></div>`;
    $('job-dialog').showModal();
    $('job-dialog').scrollTop=0;
  }

  $('search').addEventListener('input',event=>{state.query=event.target.value;render();});
  $('workplace').addEventListener('change',event=>{state.workplace=event.target.value;render();});
  ['level','comp'].forEach(id=>$(id).addEventListener('change',event=>{state[id]=event.target.value;render();}));
  $('disclosed').addEventListener('change',event=>{state.disclosed=event.target.checked;render();});
  $('network').addEventListener('change',event=>{state.network=event.target.checked;render();});
  $('categories').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(button){state.category=button.dataset.category;render();}});
  $('reset').addEventListener('click',reset);
  $('empty-reset').addEventListener('click',reset);
  $('job-list').addEventListener('click',event=>{const button=event.target.closest('[data-job]');if(button)openJob(button.dataset.job);});
  $('about-open').addEventListener('click',()=>$('about-dialog').showModal());
  ['job','about'].forEach(name=>{
    const dialog=$(name+'-dialog');
    $(name+'-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;
      const box=dialog.getBoundingClientRect();
      if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
    });
  });
  render();
})();
