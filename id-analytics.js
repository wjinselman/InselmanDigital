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
  const optedOut = read(consentKey) === 'rejected' || navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  const excluded = internal || !production || navigator.webdriver === true || optedOut;
  // Older website forms could fall back to GET. Remove their known fields from
  // the current history entry before initializing any page tracking.
  let scrubbed = false;
  ['name','company','email','phone','project_type','message','timeline','_honey','_replyto','_subject','_template','_captcha'].forEach(key => {
    if (pageUrl.searchParams.has(key)) { pageUrl.searchParams.delete(key); scrubbed = true; }
  });
  if (scrubbed) history.replaceState(history.state, '', pageUrl.pathname + pageUrl.search + pageUrl.hash);
  let loaded = false;
  const queuedEvents = [];
  const allowedEvents = new Set(['generate_lead','quote_submit_error','open_project_form','open_demo_contact','click_call','click_text','click_email','click_demo','click_resume']);
  function track(name, details = {}) {
    if (excluded || !allowedEvents.has(name)) return;
    const safe = { page_path: location.pathname };
    for (const key of ['contact_method','placement','failure_type']) {
      if (typeof details[key] === 'string' && /^[a-z0-9_-]{1,40}$/i.test(details[key])) safe[key] = details[key];
    }
    if (!loaded) { if (queuedEvents.length < 30) queuedEvents.push({name,safe}); return; }
    try { window.gtag('event', name, safe); window.clarity('event', name); } catch (_) { /* Contact still works if tracking is unavailable. */ }
  }
  function loadAnalytics() {
    if (loaded || excluded) return;
    loaded = true;
    window['ga-disable-' + gaId] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js', new Date());
    const clean = new URL(location.origin + location.pathname);
    ['utm_source','utm_medium','utm_campaign'].forEach(key => {
      const value = pageUrl.searchParams.get(key);
      if (value && /^[a-z0-9_. -]{1,100}$/i.test(value)) clean.searchParams.set(key,value);
    });
    window.gtag('config',gaId,{page_location:clean.href,page_referrer:document.referrer.split('?')[0].split('#')[0],allow_google_signals:false,allow_ad_personalization_signals:false});
    window.clarity = window.clarity || function () { (window.clarity.q=window.clarity.q||[]).push(arguments); };
    window.clarity('consentv2',{analytics_Storage:'denied',ad_Storage:'denied'});
    for (const src of ['https://www.googletagmanager.com/gtag/js?id='+gaId,'https://www.clarity.ms/tag/'+clarityId]) {
      const script=document.createElement('script'); script.async=true; script.src=src; document.head.appendChild(script);
    }
    queuedEvents.splice(0).forEach(({name,safe})=>track(name,safe));
  }
  function renderBanner() {} // Retained for existing modal callers; no analytics prompt.
  document.getElementById('idConsent')?.setAttribute('hidden', '');
  const preferences=document.createElement('div'); preferences.className='id-privacy-controls';
  const privacy=document.createElement('a'); privacy.href='/privacy.html'; privacy.textContent='Privacy'; preferences.appendChild(privacy);
  if(internal) { const note=document.createElement('span');note.textContent='Owner/testing mode — analytics excluded on this browser.';preferences.appendChild(note); }
  document.body.appendChild(preferences);
  loadAnalytics();
  window.InselmanPrivacy=Object.freeze({reset(){},status(){return excluded?'excluded':'cookieless';}});
  window.InselmanAnalytics=Object.freeze({track,excluded,internal});

  window.InselmanLead=(name,method)=>track(name,{contact_method:method});
  document.addEventListener('click',event=>{
    const el=event.target.closest('a[href]'); if(!el)return;
    // Silverback pages already have their own contact event handlers.
    if(/(?:silverback|metal-building-spray-foam)\.html$/.test(location.pathname))return;
    const href=el.getAttribute('href')||'';
    if(href.startsWith('tel:'))track('click_call',{contact_method:'phone'});
    else if(href.startsWith('sms:'))track('click_text',{contact_method:'sms'});
    else if(href.startsWith('mailto:'))track('click_email',{contact_method:'email'});
  });
})();
