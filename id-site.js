/* Shared contact and analytics behavior. No customer form content belongs in analytics. */
(() => {
  'use strict';
  const consentKey = 'inselman-analytics-consent-v2';
  const ownerKey = 'inselman-internal-traffic';
  const gaId = 'G-G25PMCDVXQ';
  const clarityId = 'xjyb7pg6fq';
  const read = key => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const write = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  const pageUrl = new URL(location.href);
  if (pageUrl.searchParams.get('id_internal') === '1') write(ownerKey, '1');
  if (pageUrl.searchParams.get('id_internal') === '0') write(ownerKey, '0');
  const internal = pageUrl.searchParams.get('id_internal') === '1' || (pageUrl.searchParams.get('id_internal') !== '0' && read(ownerKey) === '1');
  const production = ['inselmandigital.com', 'www.inselmandigital.com'].includes(location.hostname);
  const excluded = internal || !production || navigator.webdriver === true;
  // Older website forms could fall back to GET. Remove their known fields from
  // the current history entry before initializing any page tracking.
  let scrubbed = false;
  ['name','company','email','phone','project_type','message','timeline','_honey','_replyto','_subject','_template','_captcha'].forEach(key => {
    if (pageUrl.searchParams.has(key)) { pageUrl.searchParams.delete(key); scrubbed = true; }
  });
  if (scrubbed) history.replaceState(history.state, '', pageUrl.pathname + pageUrl.search + pageUrl.hash);
  let choice = read(consentKey) || '';
  let loaded = false;
  let autoTimer;
  const queuedEvents = [];
  const allowedEvents = new Set(['generate_lead','quote_submit_error','open_project_form','open_demo_contact','click_call','click_text','click_email','click_demo','click_resume']);
  function track(name, details = {}) {
    if (excluded || choice === 'rejected' || !allowedEvents.has(name)) return;
    const safe = { page_path: location.pathname };
    for (const key of ['contact_method','placement','failure_type']) {
      if (typeof details[key] === 'string' && /^[a-z0-9_-]{1,40}$/i.test(details[key])) safe[key] = details[key];
    }
    if (!loaded) { if (queuedEvents.length < 30) queuedEvents.push({name,safe}); return; }
    try { window.gtag('event', name, safe); window.clarity('event', name); } catch (_) { /* Contact still works if tracking is unavailable. */ }
  }
  function loadAnalytics() {
    if (loaded || excluded || choice === 'rejected') return;
    loaded = true;
    window['ga-disable-' + gaId] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js', new Date());
    const clean = new URL(location.origin + location.pathname);
    ['utm_source','utm_medium','utm_campaign'].forEach(key => {
      const value = pageUrl.searchParams.get(key);
      if (value && /^[a-z0-9_. -]{1,100}$/i.test(value)) clean.searchParams.set(key,value);
    });
    window.gtag('config',gaId,{page_location:clean.href,page_referrer:document.referrer.split('?')[0].split('#')[0],allow_google_signals:false,allow_ad_personalization_signals:false});
    window.clarity = window.clarity || function () { (window.clarity.q=window.clarity.q||[]).push(arguments); };
    window.clarity('consentv2',{analytics_Storage:'granted',ad_Storage:'denied'});
    for (const src of ['https://www.googletagmanager.com/gtag/js?id='+gaId,'https://www.clarity.ms/tag/'+clarityId]) {
      const script=document.createElement('script'); script.async=true; script.src=src; document.head.appendChild(script);
    }
    queuedEvents.splice(0).forEach(({name,safe})=>track(name,safe));
  }
  const banner = document.getElementById('idConsent');
  let preferencesOpen = !choice && !excluded;
  function renderBanner() {
    if (banner) banner.hidden = !preferencesOpen || Boolean(document.querySelector('.modal:not([hidden])'));
  }
  function setChoice(value) {
    choice=value; write(consentKey,value); preferencesOpen=false; clearTimeout(autoTimer); renderBanner();
    if(value==='rejected')queuedEvents.length=0;
    if(value==='accepted') loadAnalytics();
    else if(loaded) {
      window['ga-disable-'+gaId]=true;
      try { window.gtag('consent','update',{analytics_storage:'denied'}); window.clarity('consentv2',{analytics_Storage:'denied',ad_Storage:'denied'}); } catch (_) {}
      // A full reload unloads providers so even cookieless recording stops.
      location.reload();
    }
  }
  banner?.querySelector('[data-consent-accept]')?.addEventListener('click',()=>setChoice('accepted'));
  banner?.querySelector('[data-consent-reject]')?.addEventListener('click',()=>setChoice('rejected'));
  const preferences=document.createElement('div'); preferences.className='id-privacy-controls';
  const settings=document.createElement('button'); settings.type='button'; settings.textContent='Analytics preferences';
  settings.addEventListener('click',()=>{preferencesOpen=true;renderBanner();banner?.querySelector('button')?.focus();});
  if(!excluded) preferences.appendChild(settings);
  const privacy=document.createElement('a'); privacy.href='privacy.html'; privacy.textContent='Privacy'; preferences.appendChild(privacy);
  if(internal) { const note=document.createElement('span');note.textContent='Owner/testing mode — analytics excluded on this browser.';preferences.appendChild(note); }
  document.body.appendChild(preferences);
  if(!excluded && choice!=='rejected') {
    if(choice==='accepted') loadAnalytics();
    else autoTimer=setTimeout(loadAnalytics,3000); // Preserve the site's documented opt-out model.
  }
  renderBanner();
  document.querySelectorAll('.modal').forEach(modal=>new MutationObserver(renderBanner).observe(modal,{attributes:true,attributeFilter:['hidden']}));
  window.InselmanPrivacy=Object.freeze({reset(){preferencesOpen=true;renderBanner();},status(){return excluded?'excluded':choice||'default-analytics';}});
  window.InselmanAnalytics=Object.freeze({track,excluded,internal});

  const menu=document.getElementById('menu') || document.querySelector('button.menu');
  const nav=document.getElementById('navlinks');
  const closeMenu=()=>{nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');};
  menu?.addEventListener('click',()=>{const open=nav?.classList.toggle('open');menu.setAttribute('aria-expanded',String(Boolean(open)));});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',event=>{
    const hash=a.getAttribute('href').slice(1);if(!hash)return;
    const target=document.getElementById(decodeURIComponent(hash));
    if(target){event.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});closeMenu();}
  }));
  const modal=document.getElementById('contactModal');
  let contactTrigger,oldOverflow='';
  function closeContact() {
    if(!modal || modal.hidden)return;
    modal.hidden=true;document.body.style.overflow=oldOverflow;contactTrigger?.focus({preventScroll:true});renderBanner();
  }
  document.querySelectorAll('[data-contact]').forEach(button=>button.addEventListener('click',()=>{
    if(!modal)return;
    if(modal.hidden){contactTrigger=button;oldOverflow=document.body.style.overflow;}
    closeMenu();modal.hidden=false;document.body.style.overflow='hidden';renderBanner();
    modal.querySelector('input:not([type="hidden"]),a,button')?.focus();
    track('open_project_form');
  }));
  modal?.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',closeContact));
  modal?.addEventListener('click',event=>{if(event.target===modal)closeContact();});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){closeMenu();closeContact();}
    if(event.key==='Tab' && modal && !modal.hidden){
      const controls=[...modal.querySelectorAll('a[href],button,input,select,textarea')].filter(el=>!el.disabled && el.tabIndex>=0 && !el.closest('[hidden]'));
      if(!controls.length)return;
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  const topbar=document.querySelector('.topbar');
  if(topbar)window.addEventListener('scroll',()=>topbar.classList.toggle('scrolled',scrollY>12),{passive:true});
  const isApple=/iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  if(isApple)document.querySelectorAll('a[href^="sms:"]').forEach(link=>link.href=link.getAttribute('href').replace('?body=','&body='));
  document.addEventListener('click',event=>{
    const target=event.target.closest('a,button');if(!target)return;
    const href=target.getAttribute('href')||'';
    const placement=target.closest('.modal')?'dialog':target.closest('header')?'header':target.closest('footer')?'footer':'content';
    if(href.startsWith('tel:'))track('click_call',{contact_method:'phone',placement});
    else if(href.startsWith('sms:'))track('click_text',{contact_method:'sms',placement});
    else if(href.startsWith('mailto:'))track('click_email',{contact_method:'email',placement});
    else if(target.hasAttribute('data-demo'))track('open_demo_contact',{placement});
    else if(/\.pdf(?:[?#]|$)/i.test(href))track('click_resume',{placement});
  });

  const form=document.getElementById('quoteForm');
  if(!form)return;
  const status=document.getElementById('quoteStatus'),submit=document.getElementById('quoteSubmit');
  let pending=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(pending || !form.reportValidity())return;
    const payload=Object.fromEntries(new FormData(form).entries());
    if(String(payload._honey||'').trim()){status.textContent='Please call or email us to discuss your project.';return;}
    payload.name=String(payload.name||'').trim();payload.email=String(payload.email||'').trim();payload.message=String(payload.message||'').trim();
    if(!payload.name || !payload.email || !payload.message){status.className='quote-status err';status.textContent='Please add your name, email, and project details.';return;}
    pending=true;
    const originalLabel=submit.textContent;
    const controls=[...form.elements].filter(el=>el!==submit && !el.hasAttribute('data-close')).map(el=>({el,disabled:el.disabled}));
    controls.forEach(({el})=>el.disabled=true);
    status.className='quote-status';status.textContent='Sending…';submit.disabled=true;submit.textContent='Sending…';
    payload._subject='New Inselman Digital project request';payload._template='table';payload._captcha='true';payload._replyto=payload.email;
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
    let succeeded=false;
    try {
      const response=await fetch('https://formsubmit.co/ajax/william@inselmandigital.com',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      const result=await response.json();
      if(!response.ok || (result.success!==true && result.success!=='true'))throw new Error('unconfirmed');
      succeeded=true;status.className='quote-status ok';status.textContent='Your request was accepted. I’ll review it personally and reply as soon as I can.';
      form.reset();submit.textContent='Request accepted ✓';
      track('generate_lead',{contact_method:'online'});
    } catch(error) {
      status.className='quote-status err';status.textContent='We couldn’t confirm delivery. Your details are still here. Please call or text 580-465-4804 to check before retrying.';
      track('quote_submit_error',{failure_type:error.name==='AbortError'?'timeout':'unconfirmed'});
    } finally {
      clearTimeout(timer);controls.forEach(({el,disabled})=>el.disabled=disabled);
      const unlock=()=>{pending=false;submit.disabled=false;submit.textContent=originalLabel;};
      if(succeeded)setTimeout(unlock,2500);else unlock();
    }
  });
})();
