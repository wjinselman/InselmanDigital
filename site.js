(()=>{'use strict';
document.getElementById('year').textContent=new Date().getFullYear();
const viewer=document.getElementById('viewer');
document.querySelectorAll('.shot button').forEach(button=>button.addEventListener('click',()=>{const image=button.querySelector('img');viewer.querySelector('img').src=button.dataset.full;viewer.querySelector('img').alt=image.alt;viewer.querySelector('p').textContent=button.closest('figure').querySelector('figcaption').textContent;viewer.showModal()}));
const menu=document.getElementById('tech-menu'),toggle=document.querySelector('.menu-toggle');
toggle.addEventListener('click',()=>{menu.showModal();toggle.setAttribute('aria-expanded','true')});
menu.addEventListener('close',()=>toggle.setAttribute('aria-expanded','false'));
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));
for(const dialog of [viewer,menu]){
 dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
}
const form=document.getElementById('estimate-form');
if(form){
 const result=document.getElementById('request-result'),message=document.getElementById('request-message'),status=document.getElementById('request-status');
 form.addEventListener('submit',e=>{
  e.preventDefault();const data=new FormData(form);
  message.value=`Hello Eric, I would like a free spray foam estimate.\n\nName: ${data.get('name')}\nContact: ${data.get('contact')}\nBuilding: ${data.get('building')}\nTown: ${data.get('town')}\nDetails: ${data.get('details')||'To follow'}\n\nI can send photos and dimensions. Please let me know the next steps.`;
  document.getElementById('email-request').href='mailto:sbsprayfoam@outlook.com?subject='+encodeURIComponent('Spray foam estimate request')+'&body='+encodeURIComponent(message.value);
  result.hidden=false;status.textContent='Ready to copy or open in email. Nothing has been sent.';message.focus();
 });
 document.getElementById('copy-request').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(message.value);status.textContent='Copied. Paste into your email or text to Eric and attach your photos.'}catch{message.focus();message.select();status.textContent='Copy the selected request with Ctrl+C (âŒ˜C on Mac).'}});
}
})();
