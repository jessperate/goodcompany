(() => {
 const editor=document.getElementById('work-editor');
 const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const states=new WeakMap();
 editor.addEventListener('input',event=>{
  const input=event.target;if(input.dataset.field!=='company')return;
  const row=input.closest('.work-row'),box=row.querySelector('.company-matches');
  row.querySelector('[data-field="website"]').value='';row.querySelector('[data-field="logo"]').value='';
  row.querySelector('.company-selected').textContent='';
  const old=states.get(row);clearTimeout(old?.timer);old?.controller.abort();
  const state={controller:new AbortController(),matches:[]};states.set(row,state);
  const q=input.value.trim();box.hidden=q.length<2;
  if(q.length<2){box.innerHTML='';return;}
  const manual=()=>`<button type="button" data-company-manual>Add “${esc(q)}” manually</button>`;
  box.innerHTML='<p>Searching companies…</p>'+manual();
  state.timer=setTimeout(async()=>{
   try{
    const r=await fetch('/api/company-search?q='+encodeURIComponent(q),{signal:state.controller.signal});if(!r.ok)throw new Error();
    const data=await r.json();if(states.get(row)!==state||!row.isConnected)return;
    state.matches=data.companies;
    box.innerHTML=state.matches.map((c,i)=>`<button type="button" data-company-pick="${i}"><img src="${esc(c.logo)}" alt="" width="28" height="28" referrerpolicy="no-referrer"><span>${esc(c.name)}<small>${esc(new URL(c.website).hostname)} · ${esc(c.source)}</small></span></button>`).join('')+(data.unavailable?'<p>Online search is unavailable. You can still add a company manually.</p>':'')+manual();
   }catch(e){if(e.name!=='AbortError'&&states.get(row)===state)box.innerHTML='<p>Search unavailable.</p>'+manual();}
  },250);
 });
 editor.addEventListener('click',event=>{
  const button=event.target.closest('[data-company-pick],[data-company-manual]');if(!button)return;
  const row=button.closest('.work-row'),input=row.querySelector('[data-field="company"]'),state=states.get(row);
  if(button.hasAttribute('data-company-pick')){
   const c=state?.matches[Number(button.dataset.companyPick)];if(!c)return;
   input.value=c.name;row.querySelector('[data-field="website"]').value=c.website;row.querySelector('[data-field="logo"]').value=c.logo;
   row.querySelector('.company-selected').textContent=new URL(c.website).hostname;
  }
  clearTimeout(state?.timer);state?.controller.abort();states.delete(row);
  row.querySelector('.company-matches').hidden=true;
  row.querySelector('[data-field="role"]').dispatchEvent(new Event('input',{bubbles:true}));
  row.querySelector('[data-field="role"]').focus();
 });
 editor.addEventListener('keydown',event=>{
  const row=event.target.closest('.work-row');if(!row)return;
  const box=row.querySelector('.company-matches');
  if(event.key==='Escape'){box.hidden=true;return;}
  if(event.key==='ArrowDown'&&event.target.dataset.field==='company'&&!box.hidden){event.preventDefault();box.querySelector('button')?.focus();}
 });
})();
