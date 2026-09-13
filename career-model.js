/* Shared, explainable matching. Never a prediction of hiring success. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GoodCompanyCareerModel=api;})(typeof globalThis==='object'?globalThis:this,()=>{
  const choices={
    company_types:['Seed','Series A','Series B','Series C+','Public','Independent / bootstrapped','Agency / studio'],
    industries:['AI & machine learning','Software & developer tools','Finance & fintech','Media & entertainment','Commerce & consumer','Health & wellness','Education','Climate & energy','Travel & hospitality'],
    roles:['Product design','Brand & visual','Design engineering','Motion & video','Content & strategy','Creative leadership','Social media','Influencer marketing','Creator marketing','AI Creative','Industrial design'],
    work_setups:['Remote','Hybrid','On-site']
  };
  const industryRules={
    'AI & machine learning':/\b(ai|artificial intelligence|machine learning|llm|generative)\b/i,
    'Software & developer tools':/\b(software|developer|cloud|saas|infrastructure|workspace|coding|code platform)\b/i,
    'Finance & fintech':/\b(financ\w*|bank\w*|payments?|fintech|spend management|credit|trading)\b/i,
    'Media & entertainment':/\b(media|entertainment|streaming|gaming|games|music|publishing)\b/i,
    'Commerce & consumer':/\b(commerce|shopping|retail|consumer|marketplace)\b/i,
    'Health & wellness':/\b(health\w*|medical|wellness|fitness|care delivery)\b/i,
    Education:/\b(education|learning platform|schools?|teaching)\b/i,
    'Climate & energy':/\b(climate|energy|sustainab\w*|carbon|solar)\b/i,
    'Travel & hospitality':/\b(travel|hospitality|hotels?|tourism|vacation)\b/i
  };
  const skillRules={
    'Product design':/\b(product design\w*|ux|user experience|ui|user interface)\b/i,
    'Brand design':/\b(brand\w*|visual identit\w*|art direction)\b/i,
    'Web design':/\b(web design\w*|websites?|webflow|framer|web presence)\b/i,
    'Design systems':/\b(design systems?|component librar\w*)\b/i,
    'User research':/\b(user research|usability|user testing|research interviews)\b/i,
    Prototyping:/\b(prototyp\w*)\b/i,
    Figma:/\bfigma\b/i,
    'Creative coding':/\b(javascript|typescript|react|html|css|creative coding|design engineer\w*)\b/i,
    Motion:/\b(motion|animation|after effects)\b/i,
    Video:/\b(video|film|editing|premiere|production)\b/i,
    '3D':/\b(3d|blender|cinema 4d|unreal)\b/i,
    'Social media':/\b(social media|social content|social strategy|tiktok)\b/i,
    'Creator partnerships':/\b(influencer\w*|creator marketing|creator partnerships)\b/i,
    'Content strategy':/\b(content strategy|copywrit\w*|storytelling|editorial)\b/i,
    'Creative leadership':/\b(creative director|design director|led a team|managed a team|team leadership|mentoring|mentored)\b/i,
    'Marketing campaigns':/\b(campaign\w*|growth marketing|performance marketing)\b/i,
    'AI tools':/\b(ai|artificial intelligence|generative|midjourney|stable diffusion|llm)\b/i,
    'Accessibility':/\b(accessibility|wcag|inclusive design)\b/i,
    'Data & experimentation':/\b(analytics|experimentation|a\/b test\w*|data.driven)\b/i,
    'Industrial design':/\b(industrial design|cad|physical products)\b/i
  };
  const textOfJob=j=>[j.title,j.summary,...(j.highlights||[])].filter(Boolean).join('\n');
  function cleanPreferences(value={}){return Object.fromEntries(Object.entries(choices).map(([key,allowed])=>[key,[...new Set(Array.isArray(value[key])?value[key]:[])].filter(v=>allowed.includes(v))]));}
  function industries(company={}){return Object.entries(industryRules).filter(([,re])=>re.test(company.about||'')).map(([key])=>key);}
  function disciplines(job){return [...new Set([job.category,...(job.disciplines||[]),...(job.tags||[])])].filter(Boolean);}
  function preferences(job,prefs={},company={},stage={}){
    const p=cleanPreferences(prefs), tags=industries(company);
    const companyTypes=[stage.stage];
    if(/\b(agency|studio)\b/i.test(company.about||''))companyTypes.push('Agency / studio');
    if(/\b(bootstrapped|independent)\b/i.test(company.about||''))companyTypes.push('Independent / bootstrapped');
    return [['Role',p.roles,disciplines(job)],['Company type',p.company_types,companyTypes.filter(Boolean)],['Industry',p.industries,tags],['Work setup',p.work_setups,(job.workplaceOptions||[job.workplace]).filter(x=>/^(Remote|Hybrid|On-site)$/.test(x))]].filter(([,selected])=>selected.length).map(([label,selected,actual])=>({label,selected,actual,match:actual.some(x=>selected.includes(x)),unknown:!actual.length,inferred:label==='Industry'||(label==='Company type'&&!stage.stage)}));
  }
  function careerText(profile={}){return [profile.bio,...(profile.work_history||[]).map(r=>[r.role,r.accomplishments].filter(Boolean).join(': '))].filter(Boolean).join('\n');}
  function fit(job,profile={},resume=''){
    const source=resume.trim()||careerText(profile),description=textOfJob(job);
    const enough=resume.trim().length>=80 || (profile.work_history||[]).some(r=>r.role?.trim()&&r.accomplishments?.trim());
    const cues=Object.entries(skillRules).filter(([,re])=>re.test(description));
    const lines=source.split(/\n+/).filter(Boolean);
    const matched=cues.filter(([,re])=>re.test(source)).map(([label,re])=>({label,evidence:lines.find(line=>re.test(line))?.slice(0,300)||''}));
    const gaps=cues.filter(([,re])=>!re.test(source)).map(([label])=>label);
    return {enough,total:cues.length,score:enough&&cues.length>=2?Math.round(100*matched.length/cues.length):null,matched,gaps,source:resume.trim()?'résumé text':'saved career history',checkedAt:job.checkedAt||null};
  }
  function draft(job,profile={},resume=''){
    if(resume.trim())return resume.trim();
    const relevant=Object.entries(skillRules).filter(([,re])=>re.test(textOfJob(job))).map(([,re])=>re);
    const relevance=s=>relevant.filter(re=>re.test(s)).length;
    return [[profile.first_name,profile.last_name].filter(Boolean).join(' '),Object.entries(profile.links||{}).filter(([k,v])=>['email','website','linkedin'].includes(k)&&v).map(([,v])=>v).join(' | '),profile.bio,'EXPERIENCE',...(profile.work_history||[]).map(row=>{
      const bullets=(row.accomplishments||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).sort((a,b)=>relevance(b)-relevance(a));
      return [[row.role,row.company].filter(Boolean).join(' — '),row.years,...bullets.map(x=>'• '+x.replace(/^[•*-]\s*/,''))].filter(Boolean).join('\n');
    })].filter(Boolean).join('\n\n');
  }
  return {choices,cleanPreferences,industries,preferences,fit,draft,careerText,textOfJob};
});
