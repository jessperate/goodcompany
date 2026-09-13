/* Append a release with an increasing version and its actual UTC ship time.
   Keep older entries so returning members can catch up on everything unseen. */
(function(root){
  const releases=[{
    version:1, shippedAt:'2026-09-13T18:55:00Z', label:'September 13, 2026',
    features:[
      {icon:'ri-compass-3-line',title:'Your next chapter, your kind of company.',body:'Choose the company types, industries, and roles you’re interested in—even before completing your profile. Put matching interests first in the directory.',href:'/onboarding.html',cta:'Choose my interests'},
      {icon:'ri-side-bar-line',title:'Meet your career sidecar.',body:'Open a job and choose “Check my fit” to compare your career history or résumé with the role. See the experience you’ve mentioned and what you could make clearer.',href:'/#directory',cta:'Explore jobs'},
      {icon:'ri-file-text-line',title:'A little résumé polish.',body:'Build a private draft for each job, optionally refine it with AI, and review every suggestion before you save. Your public profile stays yours.',href:'/#directory',cta:'Find my next role'}
    ]
  }];
  function published(now=Date.now()){return releases.filter(r=>Date.parse(r.shippedAt)<=now);}
  function unseen(user,seen=0,now=Date.now()){
    if(!user?.id)return [];
    const joined=Date.parse(user.created_at)||0;
    return published(now).filter(r=>r.version>seen&&Date.parse(r.shippedAt)>joined);
  }
  const api={releases,published,unseen};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.GoodCompanyReleases=api;
})(typeof window==='object'?window:globalThis);
