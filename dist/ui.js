import {t} from './i18n.js';
export const $=s=>document.querySelector(s);
export const $$=s=>[...document.querySelectorAll(s)];
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const button=(id,key,kind='secondary',type='button')=>`<button id="${id}" type="${type}" class="button ${kind}">${t(key)}</button>`;
export function createDialogs(state){
 let opener=null,activation=null;
 document.addEventListener('click',event=>{if(!$('#modal').contains(event.target))activation=event.target.closest?.('button,a,select,input,textarea,summary')||null},true);
 function restoreFocus(){if($('#modal').open)return;const editId=opener?.dataset?.edit;const target=opener?.isConnected&&opener!==document.body?opener:editId?document.querySelector('[data-edit="'+editId+'"]'):null;(target||$('#add-button')).focus()}
 function confirmLeave(){if(state.saving)return false;if(state.pendingDraft?.()&&!window.confirm(t('Discard your unsaved changes?')))return false;state.pendingDraft=null;return true}
 function close(){if(!confirmLeave())return false;$('#modal').close();queueMicrotask(restoreFocus);return true}
 function modal(title,html){if(!$('#modal').open){opener=activation?.isConnected?activation:document.activeElement;activation=null;}state.onDialogClose?.();state.pendingDraft=null;$('#modal').onclose=null;$('#modal-title').textContent=t(title);$('#modal-body').innerHTML=html;if(!$('#modal').open)$('#modal').showModal();const first=[...$('#modal-body').querySelectorAll('input:not([type=checkbox]):not([readonly]),select,textarea:not([readonly]),button,summary')].find(el=>!el.disabled&&el.getClientRects().length);(first||$('#close-modal')).focus()}
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
 root.innerHTML=`<label class="check-all"><input type="checkbox" class="selection-all">${t('Select everyone')}</label><input class="selection-search" type="search" aria-label="${t('Search family')}" placeholder="${t('Search your family…')}"><p class="selection-count hint" aria-live="polite"></p><div class="check-list">${records.map(p=>`<label class="check-row" data-name="${esc(p.name.toLocaleLowerCase())}"><input class="selection-person" type="checkbox" value="${p.id}" ${ids.has(p.id)?'checked':''}><bdi>${esc(p.name)}</bdi></label>`).join('')}</div>`;
 const inputs=[...root.querySelectorAll('.selection-person')],all=root.querySelector('.selection-all');
 const values=()=>inputs.filter(i=>i.checked).map(i=>i.value);
 function update(){const n=values().length;all.checked=n===inputs.length&&n>0;all.indeterminate=n>0&&n<inputs.length;root.querySelector('.selection-count').textContent=t('{selected} of {total} people',{selected:n,total:inputs.length});changed(values())}
 inputs.forEach(i=>i.onchange=update);all.onchange=()=>{inputs.forEach(i=>i.checked=all.checked);update()};
 root.querySelector('.selection-search').oninput=e=>{const q=e.target.value.normalize('NFKD').replace(/\p{M}|ـ/gu,'').toLocaleLowerCase();root.querySelectorAll('[data-name]').forEach(row=>row.hidden=!row.dataset.name.normalize('NFKD').replace(/\p{M}|ـ/gu,'').includes(q))};
 update();return {values};
}
