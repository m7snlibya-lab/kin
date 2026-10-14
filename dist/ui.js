import {t,number} from './i18n.js';
import {icon} from './icons.js';
export const $=s=>document.querySelector(s);
export const $$=s=>[...document.querySelectorAll(s)];
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const actionIcons={'compare-open':'compare','reference-open':'history','print-open':'printer','ics-open':'export','copy-share':'copy','native-share':'share','download-backup':'backup','download-qr':'qr','download-calendar':'export','download-pdf':'download','download-image':'image','share-image':'share','previous-page':'previous','next-page':'next','new-group':'plus','save-group':'check','save-person':'check'};
export const button=(id,key,kind='secondary',type='button',description='')=>`<button id="${id}" type="${type}" class="button ${kind}${actionIcons[id]?' has-icon':''}${description?' tool-action':''}">${actionIcons[id]?icon(actionIcons[id]):''}${description?`<span class="tool-copy"><strong>${t(key)}</strong><span>${t(description)}</span></span>`:`<span>${t(key)}</span>`}</button>`;
const busyButtons=new WeakMap();
export function setBusy(el,busy,key='Saving…'){
 if(el?.tagName!=='BUTTON')return;
 if(busy){
  if(!busyButtons.has(el))busyButtons.set(el,{html:el.innerHTML,disabled:el.disabled});
  el.disabled=true;el.setAttribute('aria-busy','true');el.classList.add('is-busy');el.innerHTML='<span>'+t(key)+'</span>';
 }else if(busyButtons.has(el)){
  const previous=busyButtons.get(el);el.innerHTML=previous.html;el.disabled=previous.disabled;
  el.removeAttribute('aria-busy');el.classList.remove('is-busy');busyButtons.delete(el);
 }
}
export function createDialogs(state){
 let opener=null,activation=null,returnTo=null;
 document.addEventListener('click',event=>{if(!$('#modal').contains(event.target))activation=event.target.closest?.('button,a,select,input,textarea,summary')||null},true);
 function restoreFocus(){
  if($('#modal').open)return;
  const visible=el=>el?.isConnected&&el!==document.body&&el.getClientRects().length&&!el.disabled;
  const findVisible=selector=>$$(selector).find(visible);
  const editId=opener?.dataset?.edit,personId=opener?.dataset?.person;
  const target=visible(opener)?opener:editId?findVisible('[data-edit="'+editId+'"]'):personId?findVisible('[data-person="'+personId+'"]'):null;
  (visible(returnTo)?returnTo:target||findVisible('[role="tab"][aria-selected="true"]')||$('#add-button')).focus();
 }
 function confirmLeave(){if(state.saving)return false;if(state.pendingDraft?.()&&!window.confirm(t('Discard your unsaved changes?')))return false;state.pendingDraft=null;return true}
 function close(focusTarget=null){if(!confirmLeave())return false;returnTo=typeof focusTarget?.focus==='function'?focusTarget:null;$('#modal').close();queueMicrotask(restoreFocus);return true}
 function modal(title,html){if(!$('#modal').open){opener=activation?.isConnected?activation:document.activeElement;activation=null;returnTo=null;}state.onDialogClose?.();state.pendingDraft=null;$('#modal').onclose=null;$('#modal-title').textContent=t(title);$('#modal-body').innerHTML=html;if(!$('#modal').open)$('#modal').showModal();const first=[...$('#modal-body').querySelectorAll('input:not([type=checkbox]):not([readonly]),select,textarea:not([readonly]),button,summary')].find(el=>!el.disabled&&el.getClientRects().length);(first||$('#close-modal')).focus()}
 $('#close-modal').onclick=close;
 $('#modal').addEventListener('cancel',e=>{e.preventDefault();close()});
 $('#modal').addEventListener('close',()=>{state.onDialogClose?.();restoreFocus()});
 $('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
 window.addEventListener('beforeunload',e=>{if(state.pendingDraft?.()){e.preventDefault();e.returnValue=''}});
 return {modal,close,confirmLeave};
}
export function download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export function mountSelection(root,records,{selected=records.map(p=>p.id),changed=()=>{}}={}){
 const ids=new Set(selected);
 root.innerHTML=`<label class="check-all"><input type="checkbox" class="selection-all">${t('Select everyone')}</label><input class="selection-search" type="search" dir="auto" aria-label="${t('Search family')}" placeholder="${t('Search your family…')}"><p class="selection-count hint" aria-live="polite"></p><div class="check-list">${records.map(p=>`<label class="check-row" data-name="${esc(p.name.toLocaleLowerCase())}"><input class="selection-person" type="checkbox" value="${p.id}" ${ids.has(p.id)?'checked':''}><bdi>${esc(p.name)}</bdi></label>`).join('')}</div><p class="selection-empty hint" role="status" hidden>${t('No matching names')}</p>`;
 const inputs=[...root.querySelectorAll('.selection-person')],all=root.querySelector('.selection-all');
 const values=()=>inputs.filter(i=>i.checked).map(i=>i.value);
 function update(){const n=values().length;all.checked=n===inputs.length&&n>0;all.indeterminate=n>0&&n<inputs.length;root.querySelector('.selection-count').textContent=t('{selected} of {total} people',{selected:number(n),total:number(inputs.length)});changed(values())}
 inputs.forEach(i=>i.onchange=update);all.onchange=()=>{inputs.forEach(i=>i.checked=all.checked);update()};
 root.querySelector('.selection-search').oninput=e=>{const q=e.target.value.normalize('NFKD').replace(/\p{M}|ـ/gu,'').toLocaleLowerCase();const rows=[...root.querySelectorAll('[data-name]')];rows.forEach(row=>row.hidden=!row.dataset.name.normalize('NFKD').replace(/\p{M}|ـ/gu,'').includes(q));root.querySelector('.selection-empty').hidden=rows.some(row=>!row.hidden)};
 update();return {values};
}
