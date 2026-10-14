// Blocking head script: resolve presentation before the English HTML can paint.
(()=>{
 const root=document.documentElement;
 let lang=(navigator.language||'').toLowerCase().startsWith('ar')?'ar':'en';
 try{const saved=localStorage.getItem('kin.language');if(saved==='ar'||saved==='en')lang=saved}catch{}
 root.lang=lang;root.dir=lang==='ar'?'rtl':'ltr';root.dataset.booting='true';
 const loadingLabel=lang==='ar'?'جارٍ التحميل…':'Loading…';
 let observer;
 function showLoading(){
  if(!document.body||!root.hasAttribute('data-booting'))return;
  observer?.disconnect();
  const status=document.createElement('div');status.id='startup-status';status.setAttribute('role','status');
  const spinner=document.createElement('span');spinner.className='loading-spinner';spinner.setAttribute('aria-hidden','true');
  const label=document.createElement('span');label.textContent=loadingLabel;
  status.append(spinner,label);document.body.prepend(status);
 }
 observer=new MutationObserver(showLoading);observer.observe(root,{childList:true});showLoading();
 document.title=lang==='ar'?'كِن — عائلتك مع مرور الأيام':'Kin — Family, through time';
 let timer;
 function recovery(){
  if(!root.hasAttribute('data-booting')||!document.body||document.querySelector('#startup-recovery'))return;
  observer?.disconnect();document.querySelector('#startup-status')?.remove();
  const box=document.createElement('section');box.id='startup-recovery';box.className='startup-recovery';box.setAttribute('role','alert');
  const message=document.createElement('p');message.textContent=lang==='ar'?'تعذّر فتح التطبيق حتى الآن. تحقق من الاتصال ثم أعد المحاولة.':'The app is taking longer to open. Check your connection and try again.';
  const retry=document.createElement('button');retry.className='button primary';retry.textContent=lang==='ar'?'إعادة المحاولة':'Try again';retry.onclick=()=>location.reload();
  box.append(message,retry);document.body.append(box);
 }
 window.kinStartupReady=()=>{clearTimeout(timer);root.removeAttribute('data-booting');observer?.disconnect();document.querySelector('#startup-status')?.remove();document.querySelector('#startup-recovery')?.remove();delete window.kinStartupReady};
 timer=setTimeout(recovery,10000);
 window.addEventListener('error',()=>{if(root.hasAttribute('data-booting'))setTimeout(recovery,0)},true);
})();
