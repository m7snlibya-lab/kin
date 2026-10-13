// Blocking head script: resolve presentation before the English HTML can paint.
(()=>{
 const root=document.documentElement;
 let lang=(navigator.language||'').toLowerCase().startsWith('ar')?'ar':'en';
 try{const saved=localStorage.getItem('kin.language');if(saved==='ar'||saved==='en')lang=saved}catch{}
 root.lang=lang;root.dir=lang==='ar'?'rtl':'ltr';root.dataset.booting='true';
 root.dataset.loadingLabel=lang==='ar'?'جارٍ فتح عائلتك…':'Opening your family…';
 try{const prefs=JSON.parse(localStorage.getItem('kin.device.v1:'+location.pathname)||'null')?.preferences;root.dataset.largeText=prefs?.largeText===true?'true':'false'}catch{}
 document.title=lang==='ar'?'كِن — عائلتك مع مرور الأيام':'Kin — Family, through time';
 let timer;
 function recovery(){
  if(!root.hasAttribute('data-booting')||!document.body||document.querySelector('#startup-recovery'))return;
  root.dataset.loadingLabel='';
  const box=document.createElement('section');box.id='startup-recovery';box.className='startup-recovery';box.setAttribute('role','alert');
  const message=document.createElement('p');message.textContent=lang==='ar'?'تعذّر فتح التطبيق حتى الآن. تحقق من الاتصال ثم أعد المحاولة.':'The app is taking longer to open. Check your connection and try again.';
  const retry=document.createElement('button');retry.className='button primary';retry.textContent=lang==='ar'?'إعادة المحاولة':'Try again';retry.onclick=()=>location.reload();
  box.append(message,retry);document.body.append(box);
 }
 window.kinStartupReady=()=>{clearTimeout(timer);root.removeAttribute('data-booting');root.removeAttribute('data-loading-label');document.querySelector('#startup-recovery')?.remove();delete window.kinStartupReady};
 timer=setTimeout(recovery,10000);
 window.addEventListener('error',()=>{if(root.hasAttribute('data-booting'))setTimeout(recovery,0)},true);
})();
