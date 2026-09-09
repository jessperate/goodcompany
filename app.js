
// Keep native selects as the source of truth, with a keyboard-accessible custom menu.
function enhanceSelects() {
  const controls = [];
  document.querySelectorAll('.location-field select, .extra-filters select').forEach(select => {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = `${select.id}-button`;
    trigger.className = 'select-trigger';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const label = document.querySelector(`label[for="${select.id}"]`);
    const name = label?.textContent.trim() || 'Work setup';
    if (label) label.htmlFor = trigger.id;
    const value = document.createElement('span');
    value.className = 'select-value';
    const arrow = document.createElement('span');
    arrow.className = 'select-chevron';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = '<i class="ri-arrow-down-s-line" aria-hidden="true"></i>';
    trigger.append(value, arrow);
    const menu = document.createElement('div');
    menu.id = `${select.id}-options`;
    menu.className = 'select-menu';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', name);
    menu.hidden = true;
    trigger.setAttribute('aria-controls', menu.id);
    let active = select.selectedIndex;
    let search = '', searchTimer;
    const options = [...select.options].map((option, index) => {
      const row = document.createElement('div');
      row.id = `${select.id}-option-${index}`;
      row.className = 'select-option';
      row.setAttribute('role', 'option');
      row.textContent = option.textContent;
      const check = document.createElement("i");
      check.className = "ri-check-line option-check";
      check.setAttribute("aria-hidden", "true");
      row.append(check);
      row.addEventListener('pointerdown', event => event.preventDefault());
      row.addEventListener('click', () => choose(index));
      menu.append(row);
      return row;
    });
    function sync() {
      value.textContent = select.selectedOptions[0].textContent;
      trigger.setAttribute('aria-label', `${name}: ${value.textContent}`);
      wrapper.classList.toggle('has-selection', select.selectedIndex > 0);
      options.forEach((row, i) => row.setAttribute('aria-selected', String(i === select.selectedIndex)));
    }
    function highlight(index) {
      active = Math.max(0, Math.min(index, options.length - 1));
      options.forEach((row, i) => row.classList.toggle('is-active', i === active));
      trigger.setAttribute('aria-activedescendant', options[active].id);
      options[active].scrollIntoView({block: 'nearest'});
    }
    function close() {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.removeAttribute('aria-activedescendant');
      wrapper.classList.remove('is-open');
    }
    function open() {
      controls.forEach(control => control.close());
      sync();
      menu.hidden = false;
      wrapper.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      highlight(select.selectedIndex);
    }
    function choose(index) {
      select.selectedIndex = index;
      sync();
      close();
      select.dispatchEvent(new Event('change', {bubbles: true}));
      trigger.focus();
    }
    trigger.addEventListener('click', () => menu.hidden ? open() : close());
    trigger.addEventListener('keydown', event => {
      const key = event.key;
      if (key === 'Tab') { close(); return; }
      if (key === 'Escape') { if (!menu.hidden) { event.preventDefault(); close(); } return; }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) {
        event.preventDefault();
        if (menu.hidden) { open(); if (key === 'Home') highlight(0); if (key === 'End') highlight(options.length - 1); return; }
        if (key === 'Enter' || key === ' ') choose(active);
        else highlight(key === 'Home' ? 0 : key === 'End' ? options.length - 1 : active + (key === 'ArrowDown' ? 1 : -1));
      } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (menu.hidden) open();
        clearTimeout(searchTimer);
        search += key.toLocaleLowerCase();
        const match = options.findIndex(row => row.textContent.toLocaleLowerCase().startsWith(search));
        if (match >= 0) highlight(match);
        searchTimer = setTimeout(() => { search = ''; }, 600);
      }
    });
    select.before(wrapper);
    wrapper.append(select, trigger, menu);
    select.classList.add('select-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    select.addEventListener('change', sync);
    wrapper.addEventListener('focusout', event => { if (!wrapper.contains(event.relatedTarget)) close(); });
    document.addEventListener('pointerdown', event => { if (!wrapper.contains(event.target)) close(); });
    controls.push({sync, close});
    sync();
  });
  return () => controls.forEach(control => { control.sync(); control.close(); });
}

'use strict';

const jobDisciplines = job => [...new Set([job.category, ...(job.disciplines || [])])];

const hasVerifiedConnection = job => job.connection?.verifiedFirstDegree === true && job.connection?.currentEmployeeCount > 0;

function filterJobs(jobs, {query = '', category = 'All disciplines', workplace = 'all', network = false, level = 'all', comp = 0, disclosed = false, stage = 'all'} = {}) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return jobs.filter(job => {
    const searchable = [job.title, job.company, ...jobDisciplines(job), job.location, job.workplace, job.summary, ...(job.highlights || []), ...(job.keywords || [])].join(' ').toLocaleLowerCase();
    return (stage === 'all' || COMPANY_STAGES[job.company]?.stage === stage) &&
      words.every(word => searchable.includes(word)) &&
      (category === 'All disciplines' || jobDisciplines(job).includes(category)) &&
      (workplace === 'all' || (job.workplaceOptions || [job.workplace]).includes(workplace)) &&
      (!network || hasVerifiedConnection(job)) &&
      (level === 'all' || job.level === level) &&
      (!disclosed || Boolean(job.salary)) &&
      (!Number(comp) || (job.salaryCurrency === 'USD' && job.salaryMax >= Number(comp)));
  }).sort((a,b) => Number(hasVerifiedConnection(b)) - Number(hasVerifiedConnection(a)));
}

function paginateJobs(jobs, requestedPage = 1, pageSize = 30) {
  const pageCount = Math.max(1, Math.ceil(jobs.length / pageSize));
  const page = Math.min(pageCount, Math.max(1, Math.floor(Number(requestedPage)) || 1));
  const start = (page - 1) * pageSize;
  return {page, pageCount, start, items:jobs.slice(start, start + pageSize)};
}

(() => {
  const $ = id => document.getElementById(id);
  const syncSelects = enhanceSelects();
  const state = {query:'',category:'All disciplines',workplace:'all',network:false,level:'all',comp:0,disclosed:false,stage:'all'};
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const connectionIcon = '<i class="ri-links-line" aria-hidden="true"></i>';
  const mark = job => `<span class="company-mark company-logo" aria-hidden="true"><img src="${esc(COMPANIES[job.company]?.logo || '')}" alt="" width="40" height="40" loading="lazy"></span>`;
  function trueupProfile(company) {
    const stats = company.trueup;
    if (!stats?.url) return '<section class="trueup-panel"><h4>Company snapshot · TrueUp</h4><p>No verified TrueUp snapshot available for this company yet.</p></section>';
    const value = n => n == null ? 'Not available' : Number(n).toLocaleString('en-US');
    const stale = stats.status === 'stale';
    return `<section class="trueup-panel"><h4>Company snapshot · TrueUp</h4>${stale ? '<p>A recent snapshot isn’t available. Visit TrueUp for the latest company information.</p>' : `<dl class="trueup-stats"><div><dt>Open roles</dt><dd>${value(stats.openJobs)}</dd></div><div><dt>Remote openings</dt><dd>${value(stats.remoteJobs)}</dd></div><div><dt>Employee growth · 12 months</dt><dd>${esc(stats.employeeGrowth || 'Not available')}</dd></div></dl><p class="trueup-method">Company-wide openings, not just creative roles. Counts may be rounded. Employee growth is a Workforce.ai estimate via TrueUp, not a measure of new hires. A hiring trend isn’t available in this snapshot.</p>`}<a href="${esc(stats.url)}" target="_blank" rel="noopener noreferrer">View on TrueUp <i class="ri-arrow-right-up-line" aria-hidden="true"></i></a><small>Checked September 8, 2026 · Source snapshot: ${esc(stats.crawl || 'date unavailable')} at check time. Not live data.</small></section>`;
  }
  function companyProfile(job) {
    const company = COMPANIES[job.company];
    if (!company) return '';
    const links = (title, items) => items?.length ? `<div class="company-resource-group"><h4>${title}</h4><ul>${items.map(item=>`<li><a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.title)} <span aria-hidden="true"><i class="ri-arrow-right-up-line" aria-hidden="true"></i></span></a><small>${esc(item.source)}</small></li>`).join('')}</ul></div>` : '';
    return `<section class="company-profile detail-section"><p class="eyebrow">BEHIND THE JOB</p><h3>Get to know ${esc(job.company)}</h3><p>${esc(company.about)}</p><a class="company-website" href="${esc(company.website)}" target="_blank" rel="noopener noreferrer">Company website <i class="ri-arrow-right-up-line" aria-hidden="true"></i></a><div class="company-review">${company.glassdoor ? `<a href="${esc(company.glassdoor.url)}" target="_blank" rel="noopener noreferrer"><strong><i class="ri-star-fill" aria-hidden="true"></i> ${esc(company.glassdoor.rating)} / 5</strong><span>Employee reviews on Glassdoor <i class="ri-arrow-right-up-line" aria-hidden="true"></i></span></a><small>Observed ${esc(company.checkedAt)} · Rating may change; Glassdoor may require sign-in.</small>` : '<p>Glassdoor rating not verified for this company.</p>'}</div>${trueupProfile(company)}${links('Leadership conversations',company.interviews)}${links('In the news',company.press)}${links('Awards & recognition',company.recognition)}<p class="company-research-note">Company context checked ${esc(company.checkedAt)}. Stories retain their original dates; recognition does not guarantee workplace quality.</p></section>`;
  }
  const categories = ['All disciplines',...new Set(JOBS.flatMap(jobDisciplines))];

  $('categories').innerHTML = categories.map(category => `<button class="category" type="button" data-category="${esc(category)}" aria-pressed="${category === state.category}"><span>${esc(category)}</span><span class="count">${category === 'All disciplines' ? JOBS.length : JOBS.filter(job=>jobDisciplines(job).includes(category)).length}</span></button>`).join('');

  let currentPage = 1;
  function render(resetPage = true) {
    if (resetPage) currentPage = 1;
    const jobs = filterJobs(JOBS,state);
    const paging = paginateJobs(jobs, currentPage);
    currentPage = paging.page;
    $('result-count').innerHTML = `<strong>${jobs.length} ${jobs.length === 1 ? 'opportunity' : 'opportunities'}</strong> ${state.network ? 'in Jess’s network' : 'to make your next move'}${jobs.length ? `<span class="page-range">Showing ${paging.start + 1}–${paging.start + paging.items.length}</span>` : ''}`;
    $('empty').hidden = jobs.length > 0;
    const networkReady = JOBS.some(hasVerifiedConnection);
    $('empty-title').textContent = state.network && !networkReady ? 'Verified connections are coming soon' : 'A little too specific?';
    $('empty-description').textContent = state.network && !networkReady ? 'Jess’s LinkedIn network has not been imported yet. Turn off this filter to browse all roles.' : 'Try another keyword or give your filters some breathing room.';
    $('reset').hidden = !state.query && state.category === 'All disciplines' && state.workplace === 'all' && !state.network && state.level === 'all' && !Number(state.comp) && !state.disclosed && state.stage === 'all';
    document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === state.category)));
    $('job-list').innerHTML = paging.items.map(job => `<article class="job-card" data-open-job="${esc(job.id)}" aria-labelledby="title-${esc(job.id)}">
      <div class="job-body">${mark(job)}<div class="job-copy"><div class="company-line"><span>${esc(job.company)}</span></div><h3 class="job-title" id="title-${esc(job.id)}"><button type="button" data-job="${esc(job.id)}" aria-haspopup="dialog">${esc(job.title)}</button></h3><div class="job-metadata"><span>${esc(job.location)}</span><span class="separator" aria-hidden="true">·</span><span>${esc(job.workplace)}</span><span class="separator" aria-hidden="true">·</span><span class="job-type">${esc(job.level || "Level not specified")}</span></div><p class="job-pay">${esc(job.salaryLabel || "Pay not listed")}</p></div><button type="button" class="pin-job" data-pin="${esc(job.id)}" aria-label="Pin ${esc(job.title)}" aria-pressed="false">Pin job <i class="ri-pushpin-line" aria-hidden="true"></i></button><button type="button" class="details-arrow card-open" data-job="${esc(job.id)}" aria-label="View ${esc(job.title)} at ${esc(job.company)}" aria-haspopup="dialog"><span aria-hidden="true"><i class="ri-arrow-right-up-line" aria-hidden="true"></i></span></button></div>
      ${hasVerifiedConnection(job) ? `<div class="connection-strip"><span class="network-badge">${connectionIcon}Jess’s network</span><span class="connection-description">${esc(job.connection.short)}</span></div>` : ''}
    </article>`).join('');
    const pagination = $('job-pagination');
    pagination.hidden = paging.pageCount <= 1;
    const pageButton = (page, label, content, disabled = false) => `<button type="button" data-page="${page}" aria-label="${label}" ${disabled ? 'disabled' : ''} ${page === currentPage && /^Page /.test(label) ? 'aria-current="page"' : ''}>${content}</button>`;
    const visiblePages = Array.from({length:paging.pageCount},(_,i)=>i+1).filter(page => paging.pageCount <= 7 || page === 1 || page === paging.pageCount || Math.abs(page-currentPage) <= 2);
    let previous = 0;
    pagination.innerHTML = pageButton(currentPage-1,'Previous page','<i class="ri-arrow-left-line" aria-hidden="true"></i>',currentPage===1) + visiblePages.map(page => {
      const gap = previous && page-previous>1 ? '<span class="page-ellipsis" aria-hidden="true">…</span>' : '';
      previous = page;
      return gap + pageButton(page,`Page ${page}`,page);
    }).join('') + pageButton(currentPage+1,'Next page','<i class="ri-arrow-right-line" aria-hidden="true"></i>',currentPage===paging.pageCount);
    window.GoodCompanyAccount?.refreshButtons();
  }

  function reset() {
    Object.assign(state,{query:'',category:'All disciplines',workplace:'all',network:false,level:'all',comp:0,disclosed:false,stage:'all'});
    $('search').value='';$('workplace').value='all';$('network').checked=false;$('level').value='all';$('stage').value='all';$('comp').value='0';$('disclosed').checked=false;
    syncSelects();
    render();$('search').focus();
  }

  function jobLink(id) {
    const url = new URL('https://in-good.company/');
    url.searchParams.set('job', id);
    return url.href;
  }

  function syncJobFromUrl() {
    const id = new URL(location.href).searchParams.get('job');
    const dialog = $('job-dialog');
    if (id && JOBS.some(job => job.id === id)) {
      $('job-link-notice').hidden = true;
      openJob(id, false);
    } else {
      if (dialog.open) dialog.close();
      $('job-link-notice').hidden = !id;
    }
  }

  const minimizedJobs = new Map();
  function renderJobTray() {
    $('job-tray').hidden = !minimizedJobs.size;
    $('job-tray').innerHTML = [...minimizedJobs.keys()].map(id => {
      const job = JOBS.find(job => job.id === id);
      return `<div class="tray-folder"><button type="button" data-restore-job="${esc(id)}" aria-label="Restore ${esc(job.title)} at ${esc(job.company)}"><i class="ri-folder-line" aria-hidden="true"></i><span>${esc(job.company)} · ${esc(job.title)}</span></button><button type="button" data-dismiss-job="${esc(id)}" aria-label="Close minimized ${esc(job.title)}"><i class="ri-close-line" aria-hidden="true"></i></button></div>`;
    }).join('');
  }
  function setJobExpanded(expanded) {
    $('job-dialog').classList.toggle('is-expanded', expanded);
    $('job-expand').setAttribute('aria-pressed', String(expanded));
    $('job-expand').setAttribute('aria-label', expanded ? 'Restore job size' : 'Expand job');
    $('job-expand').title = expanded ? 'Restore size' : 'Expand';
    $('job-expand').innerHTML = `<i class="${expanded ? 'ri-file-copy-line' : 'ri-checkbox-blank-line'}" aria-hidden="true"></i>`;
  }
  $('job-expand').addEventListener('click', () => setJobExpanded(!$('job-dialog').classList.contains('is-expanded')));
  $('job-minimize').addEventListener('click', () => {
    const id = $('job-dialog').dataset.jobId;
    minimizedJobs.set(id, {scroll: $('job-detail').scrollTop, expanded: $('job-dialog').classList.contains('is-expanded')});
    $('job-dialog').close();
    renderJobTray();
    $('job-window-status').textContent = 'Job minimized. Reopen it from the minimized jobs tray.';
    $('job-tray').querySelector('[data-restore-job]').focus();
  });
  $('job-tray').addEventListener('click', event => {
    const restore = event.target.closest('[data-restore-job]');
    if (restore) { openJob(restore.dataset.restoreJob); return; }
    const dismiss = event.target.closest('[data-dismiss-job]');
    if (dismiss) {
      minimizedJobs.delete(dismiss.dataset.dismissJob);
      renderJobTray();
      ($('job-tray').querySelector('button') || $('search')).focus({preventScroll:true});
    }
  });

  function openJob(id, updateUrl = true) {
    const job = JOBS.find(job=>job.id===id);
    if(!job) return;
    const savedWindow = minimizedJobs.get(id);
    minimizedJobs.delete(id);
    renderJobTray();
    setJobExpanded(savedWindow?.expanded || false);
    $('job-folder-label').textContent = job.company;
    $('job-dialog').dataset.jobId = id;
    $('job-link-notice').hidden = true;
    if (updateUrl && new URL(location.href).searchParams.get('job') !== id) {
      const url = new URL(location.href);
      url.searchParams.set('job', id);
      history.pushState(null, '', url);
    }
    $('job-detail').innerHTML = `<div class="detail-company">${mark(job)}<span>${esc(job.company)}</span></div><h2 id="detail-title">${esc(job.title)}</h2><div class="job-share"><button type="button" class="share-job" id="share-job"><i class="ri-share-forward-line" aria-hidden="true"></i> Share job</button><button type="button" class="pin-job modal-pin-job" data-pin="${esc(job.id)}" aria-label="Pin ${esc(job.title)}" aria-pressed="false">Pin job <i class="ri-pushpin-line" aria-hidden="true"></i></button><span id="share-status" role="status" aria-live="polite"></span><label id="share-fallback" hidden>Copy this job link<input id="share-url" type="text" readonly value="${esc(jobLink(id))}"></label></div><div class="detail-tags"><span>${esc(job.category)}</span><span>${esc(job.level || "Level not specified")}</span><span>${esc(job.location)}</span><span>${esc(job.workplace)}</span>${job.type ? `<span>${esc(job.type)}</span>`:''}</div><section class="detail-section"><h3>The opportunity</h3><p>${esc(job.summary)}</p></section>${job.highlights?.length ? `<section class="detail-section"><h3>A few things to know</h3><ul>${job.highlights.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></section>`:''}${job.salary ? `<section class="detail-section"><h3>${esc(job.compensationHeading || (job.salaryCashMin != null ? "Published cash compensation" : "Published base salary"))}</h3><p>${esc(job.salary)}</p></section>`:''}${hasVerifiedConnection(job) ? `<section class="detail-section detail-connection"><span class="network-badge">${connectionIcon}The connection</span><p>${esc(job.connection.detail)}</p><p class="connection-caveat">This is a company connection; introductions and referrals aren’t guaranteed.</p></section>`:''}${COMPANY_STAGES[job.company] ? `<section class="detail-section"><h3>Company stage</h3><p>${esc(COMPANY_STAGES[job.company].stage)} · <a href="${esc(COMPANY_STAGES[job.company].url)}" target="_blank" rel="noopener noreferrer">Source <i class="ri-arrow-right-up-line" aria-hidden="true"></i></a></p></section>` : ''}${companyProfile(job)}${job.linkedinUrls?.length ? `<section class="detail-section"><h3>Also on LinkedIn</h3>${[...new Set(job.linkedinUrls)].map(url => `<p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">View LinkedIn posting <i class="ri-arrow-right-up-line" aria-hidden="true"></i></a></p>`).join('')}</section>` : ''}<div class="detail-footer"><a class="primary-button" href="${esc(job.url)}" target="_blank" rel="noopener noreferrer">View original listing <span aria-hidden="true"><i class="ri-arrow-right-up-line" aria-hidden="true"></i></span><span class="sr-only">(opens in a new tab)</span></a><p>Source: ${esc(job.source || (job.company + '’s job board'))}<br>Checked ${esc(job.checkedAt || "September 7, 2026")}</p></div>`;
    window.GoodCompanyAccount?.refreshButtons();
    if (!$('job-dialog').open) $('job-dialog').showModal();
    $('job-detail').scrollTop = savedWindow?.scroll || 0;
    $('job-detail').focus({preventScroll:true});
  }

  $('job-detail').addEventListener('click', async event => {
    const button = event.target.closest('#share-job');
    if (!button) return;
    const id = $('job-dialog').dataset.jobId;
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(jobLink(id));
      if ($('job-dialog').dataset.jobId === id) $('share-status').textContent = 'Link copied!';
    } catch {
      if ($('job-dialog').dataset.jobId === id) {
        $('share-fallback').hidden = false;
        $('share-status').textContent = 'Copy the link below to share this job.';
        $('share-url').focus();
        $('share-url').select();
      }
    } finally {
      button.disabled = false;
    }
  });
  $('job-dialog').addEventListener('close', () => {
    const url = new URL(location.href);
    if (!$('job-dialog').open && url.searchParams.get('job') === $('job-dialog').dataset.jobId) {
      url.searchParams.delete('job');
      history.replaceState(null, '', url);
    }
  });
  window.addEventListener('popstate', syncJobFromUrl);

  $('job-pagination').addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page);
    render(false);
    const heading = $('result-count');
    heading.setAttribute('tabindex','-1');
    heading.focus({preventScroll:true});
    heading.scrollIntoView({block:'start',behavior:'instant'});
  });

  $('search').addEventListener('input',event=>{state.query=event.target.value;render();});
  $('workplace').addEventListener('change',event=>{state.workplace=event.target.value;render();});
  ['level','comp','stage'].forEach(id=>$(id).addEventListener('change',event=>{state[id]=event.target.value;render();}));
  $('disclosed').addEventListener('change',event=>{state.disclosed=event.target.checked;render();});
  $('network').addEventListener('change',event=>{state.network=event.target.checked;render();});
  $('categories').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(button){state.category=button.dataset.category;render();}});
  $('reset').addEventListener('click',reset);
  $('empty-reset').addEventListener('click',reset);
  $('job-list').addEventListener('click',event=>{const button=event.target.closest('[data-job]');if(button){openJob(button.dataset.job);return;}if(event.target.closest('button,a,input,select'))return;const card=event.target.closest('[data-open-job]');if(card)openJob(card.dataset.openJob);});
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
  const mainWindow = document.querySelector('.site-window');
  let desktopScroll = 0;
  let desktopTrigger = $('main-minimize');
  function revealVoid(event) {
    desktopScroll = window.scrollY;
    desktopTrigger = event.currentTarget;
    mainWindow.hidden = true;
    $('desktop-void').hidden = false;
    document.body.classList.add('in-the-void');
    window.scrollTo({top:0, behavior:'instant'});
    $('main-reopen').focus({preventScroll:true});
  }
  $('main-minimize').addEventListener('click', revealVoid);
  $('main-close').addEventListener('click', revealVoid);
  $('main-reopen').addEventListener('click', () => {
    mainWindow.hidden = false;
    $('desktop-void').hidden = true;
    document.body.classList.remove('in-the-void');
    window.scrollTo({top:desktopScroll, behavior:'instant'});
    desktopTrigger.focus({preventScroll:true});
  });
  render();
  syncJobFromUrl();
})();
