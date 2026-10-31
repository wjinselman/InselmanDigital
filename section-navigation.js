(() => {
  const definitions = [
    ['top','Home'],['local-websites','Work'],['cattle-handler','Apps'],
    ['website-packages','Packages'],['services','Services'],
    ['process','Process'],['support','Support'],['about','About'],['contact','Contact']
  ];
  const entries = definitions.map(([id,label]) => ({id,label,target:document.getElementById(id)})).filter(entry=>entry.target);
  if (!entries.length || document.querySelector('.id-section-rail')) return;
  const progress=document.createElement('div');progress.className='id-reading-progress';progress.setAttribute('aria-hidden','true');
  const fill=document.createElement('span');progress.append(fill);
  const nav=document.createElement('nav');nav.className='id-section-rail';nav.setAttribute('aria-label','Page sections');
  const caption=document.createElement('p');caption.className='rail-caption';caption.textContent='On this page';
  const list=document.createElement('ol');nav.append(caption,list);
  for (const entry of entries) {
    const item=document.createElement('li'),link=document.createElement('a');
    link.href='#'+entry.id;link.textContent=entry.label;item.append(link);list.append(item);entry.link=link;
  }
  document.body.append(progress,nav);
  let frame=0,positions=[],needsMeasure=true,active=-1;
  const header=document.querySelector('header');
  function update(){
    frame=0;
    const y=window.scrollY,max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
    fill.style.transform=`scaleX(${max?Math.min(1,Math.max(0,y/max)):0})`;
    if(needsMeasure){positions=entries.map(entry=>entry.id==='top'?0:entry.target.getBoundingClientRect().top+y);needsMeasure=false;}
    const marker=y+(header?.getBoundingClientRect().height||0)+120;
    let current=0;positions.forEach((top,i)=>{if(top<=marker)current=i;});
    if(max>0&&y>=max-2)current=entries.length-1;
    if(current!==active){entries.forEach((entry,i)=>{if(i===current)entry.link.setAttribute('aria-current','location');else entry.link.removeAttribute('aria-current');});active=current;}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  function measure(){needsMeasure=true;schedule();}
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',measure,{passive:true});
  window.addEventListener('hashchange',schedule);
  window.addEventListener('pageshow',measure);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(measure).observe(document.body);
  update();
})();


