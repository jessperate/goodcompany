(() => {
  'use strict';
  const account=window.GoodCompanyAccount, releases=window.GoodCompanyReleases;
  let owner=null, generation=0, pending=[], shownVersion=0, dismissed=false, timer=null;
  const key=id=>'goodcompany-updates-seen:'+id;
  const cached=id=>{try{return Number(localStorage.getItem(key(id)))||0;}catch{return 0;}};
  const remember=(id,v)=>{try{localStorage.setItem(key(id),String(Math.max(v,cached(id))));}catch{}};
  const dialog=document.createElement('dialog');
  dialog.id='whats-new-dialog';dialog.className='whats-new-dialog';
  dialog.setAttribute('aria-labelledby','whats-new-title');
  dialog.innerHTML=`<header class="updates-titlebar"><span><i class="ri-sparkling-line" aria-hidden="true"></i> GOOD COMPANY / UPDATES</span><button type="button" aria-label="Close what’s new" data-updates-dismiss><i class="ri-close-line" aria-hidden="true"></i></button></header><div class="updates-body"><p class="updates-eyebrow">A FEW NEW THINGS FOR YOU :)</p><h2 id="whats-new-title" tabindex="-1">While you were away.</h2><p>Good Company’s been making a few things. Here’s what’s new.</p><div id="updates-list"></div><div class="updates-actions"><button class="primary-button" type="button" data-updates-dismiss>Got it. Let’s go <i class="ri-arrow-right-line" aria-hidden="true"></i></button><span>We’ll remember you’ve seen these.</span></div></div>`;
  document.body.append(dialog);
  const list=dialog.querySelector('#updates-list');
  const replay=document.createElement('button');replay.type='button';replay.className='text-button updates-replay';replay.textContent='What’s new';replay.hidden=true;
  document.querySelector('footer')?.append(replay);
  async function save(id,v){
    if(!id||!v||account.getUser()?.id!==id)return;
    try{await account.client.rpc('goodcompany_acknowledge_updates',{seen_version:v});}catch{}
    // Local receipt also prevents repeats if the network is temporarily unavailable.
    // The next visit reconciles it with the account receipt on the server.
  }
  function draw(entries){
    list.replaceChildren();
    for(const release of [...entries].reverse()){
      const date=document.createElement('p');date.className='updates-date';date.textContent=release.label;list.append(date);
      for(const feature of release.features){
        const article=document.createElement('article'),icon=document.createElement('i'),body=document.createElement('div'),h=document.createElement('h3'),p=document.createElement('p'),a=document.createElement('a');
        icon.className=feature.icon;icon.setAttribute('aria-hidden','true');h.textContent=feature.title;p.textContent=feature.body;a.textContent=feature.cta+' ';a.href=feature.href;const arrow=document.createElement('i');arrow.className='ri-arrow-right-up-line';arrow.setAttribute('aria-hidden','true');a.append(arrow);
        body.append(h,p,a);article.append(icon,body);list.append(article);
      }
    }
  }
  function show(){
    clearTimeout(timer);
    if(!pending.length||dismissed||!owner||account.getUser()?.id!==owner||dialog.open)return;
    if(document.hidden||document.querySelector('dialog[open]'))return;
    shownVersion=Math.max(...pending.map(r=>r.version));draw(pending);dialog.showModal();dialog.querySelector('h2').focus();
  }
  function dismiss(){
    if(!dialog.open)return;
    const id=owner,v=shownVersion;dismissed=true;pending=[];
    remember(id,v);void save(id,v);dialog.close();
  }
  dialog.querySelectorAll('[data-updates-dismiss]').forEach(b=>b.addEventListener('click',dismiss));
  dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
  dialog.addEventListener('click',e=>{
    if(e.target.closest('a'))dismiss();
    if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dismiss();}
  });
  async function ready(){
    const user=account.getUser();if(!user||user.id===owner)return;
    owner=user.id;const token=++generation;dismissed=false;replay.hidden=false;
    try{
      const {data,error}=await account.client.from('goodcompany_update_receipts').select('last_seen_version').eq('user_id',user.id).maybeSingle();
      if(error||token!==generation||account.getUser()?.id!==user.id)return;
      const local=cached(user.id),server=data?.last_seen_version||0,seen=Math.max(local,server);
      if(local>server)void save(user.id,local);
      if(server>local)remember(user.id,server);
      pending=releases.unseen(user,seen);
      if(!pending.length){const latest=Math.max(0,...releases.published().map(r=>r.version));if(latest>seen){remember(user.id,latest);void save(user.id,latest);}return;}
      timer=setTimeout(show,900);
    }catch{/* Do not interrupt browsing or replay old updates on a failed read. */}
  }
  replay.addEventListener('click',()=>{if(!account.getUser())return;pending=releases.published();dismissed=false;show();});
  window.addEventListener('goodcompany-session-ready',ready);
  window.addEventListener('goodcompany-account-change',()=>{
    if(owner&&account.getUser()?.id!==owner){++generation;owner=null;pending=[];clearTimeout(timer);dialog.close();replay.hidden=true;}
  });
  document.addEventListener('close',e=>{if(e.target!==dialog)timer=setTimeout(show,350);},true);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)show();});
  window.addEventListener('storage',e=>{if(owner&&e.key===key(owner)&&Number(e.newValue)>=Math.max(0,...pending.map(r=>r.version))){dismissed=true;pending=[];dialog.close();}});
})();
