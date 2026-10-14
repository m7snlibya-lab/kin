import {calendars,today,encode} from './core.js';
import {t,language,number,parseDigits,messages} from './i18n.js';
import {$,$$,esc,button,mountSelection,download} from './ui.js';
import {loadExportFonts,createMeasure,createCalendarDocument,createCardDocument,renderDocumentPage,canvasBlob,documentPDF} from './documents.js';

export function openDocumentDialog(state,{modal,close,toast,visible,device},event){
 const card=!!event,prefs=device.value.preferences.export||{};
 const defaults={layoutCalendar:'g',year:calendars.g.parts(today())[0],birthdayCalendar:'g',layout:'annual',size:'A4',orientation:'landscape',locale:language(),showAges:false,ink:false,qr:false,shape:'square',theme:'celebratory'};
 const initial={...defaults};
 for(const [k,allowed] of Object.entries({layoutCalendar:['g','h'],birthdayCalendar:['g','h','both'],layout:['annual','monthly'],size:['A4','A3'],orientation:['landscape','portrait'],locale:['en','ar'],shape:['square','portrait'],theme:['celebratory','minimal']}))if(allowed.includes(prefs[k]))initial[k]=prefs[k];
 initial.year=calendars[initial.layoutCalendar].parts(today())[0];
 const select=(id,key,values)=>`<label><span>${t(key)}</span><select id="${id}">${values.map(([v,label])=>`<option value="${v}">${t(label)}</option>`).join('')}</select></label>`;
 modal(card?'Birthday image':'Printable calendar',`<div class="document-settings">${card?'':`<section class="document-people" aria-labelledby="document-people-title"><h3 id="document-people-title">${t('Choose people')}</h3><div id="document-selection"></div></section>`}<div class="export-form">
 ${card?select('doc-shape','Image shape',[['square','Square'],['portrait','Portrait']])+select('doc-theme','Design',[['celebratory','Celebratory'],['minimal','Minimal']]):select('doc-layout-calendar','Year calendar',[['g','Gregorian'],['h','Hijri']])+`<label><span>${t('Year')}</span><input id="doc-year" inputmode="numeric" value="${initial.year}"></label>`+select('doc-birthdays','Birthday calendar',[['g','Gregorian'],['h','Hijri'],['both','Both calendars']])+select('doc-layout','Layout',[['annual','Annual overview'],['monthly','Month per page']])+select('doc-size','Paper size',[['A4','A4'],['A3','A3']])+select('doc-orientation','Orientation',[['landscape','Landscape'],['portrait','Portrait']])}
 ${select('doc-language','Language',[['en','English'],['ar','العربية']])}
 <label class="check-row"><input id="doc-ages" type="checkbox">${t('Show turning ages')}</label>
 ${card?'':`<label class="check-row"><input id="doc-ink" type="checkbox">${t('Ink-friendly design')}</label><label class="check-row"><input id="doc-qr" type="checkbox">${t('Include family QR')}</label><p id="doc-qr-note" class="hint" hidden>${t('Anyone with this QR can read the selected names and birth dates.')}</p>`}
 </div></div><p id="document-status" class="hint export-status" role="status" aria-live="polite"></p><div id="document-preview" class="document-preview"></div><div class="preview-controls">${button('previous-page','Previous page')}<span id="page-count"></span>${button('next-page','Next page')}</div><section class="document-text" tabindex="0" role="region" aria-label="${t('Accessible text preview')}"><h3>${t('Accessible text preview')}</h3><div id="document-text"></div></section><div class="dialog-actions export-controls">${button('cancel-document','Cancel')}${card?button('share-image','Share image'):button('download-pdf','Download PDF','primary')}${button('download-image','Download image',card?'primary':'secondary')}</div><p class="hint">${t('PDFs use high-resolution page images. Download one PNG at a time using the page controls.')}</p>`);
 $('#modal').classList.add('document-dialog');
 let model=null,page=0,generation=0,previewGeneration=0,controller=null,busy=false,timer=null;
 const statusElement=$('#document-status'),formElement=$('.export-form'),selectionElement=$('#document-selection');
 const active=()=>statusElement.isConnected&&$('#modal').open;
 const controls=['#download-pdf','#download-image','#share-image'].map(s=>$(s)).filter(Boolean);
 const setDisabled=disabled=>controls.forEach(b=>b.disabled=disabled);
 const status=text=>{if(active())statusElement.textContent=text};
 const selections=card?null:mountSelection($('#document-selection'),state.people,{selected:visible().map(p=>p.id),changed:()=>schedule()});
 const fieldMap=card?{'#doc-shape':'shape','#doc-theme':'theme','#doc-language':'locale'}:{'#doc-layout-calendar':'layoutCalendar','#doc-birthdays':'birthdayCalendar','#doc-layout':'layout','#doc-size':'size','#doc-orientation':'orientation','#doc-language':'locale'};
 for(const [selector,key] of Object.entries(fieldMap))$(selector).value=initial[key];
 function options(){const value={...initial};for(const [selector,key] of Object.entries(fieldMap))value[key]=$(selector).value;value.showAges=$('#doc-ages').checked;if(!card){value.year=parseDigits($('#doc-year').value);value.ink=$('#doc-ink').checked;value.qr=$('#doc-qr').checked}return value}
 function schedule(){clearTimeout(timer);generation++;model=null;setDisabled(true);timer=setTimeout(build,150)}
 async function build(){
  const ticket=generation;status(t('Preparing preview…'));setDisabled(true);
  try{
   await loadExportFonts();if(ticket!==generation||!$('#modal').open)return;
   const opts=options(),records=card?[event.person]:state.people.filter(p=>selections.values().includes(p.id));
   if(!records.length)throw Error('Select at least one person.');
   if(opts.qr&&(location.origin+location.pathname+encode(records)).length>2000)throw Error('Too much data for a comfortably scannable QR. Choose fewer people or copy the link.');
   const next=card?createCardDocument(event,opts,createMeasure()):createCalendarDocument(records,opts,createMeasure());
   if(ticket!==generation)return;
   model=next;page=0;
   device.value.preferences.export=Object.fromEntries(Object.keys(fieldMap).map(s=>[fieldMap[s],opts[fieldMap[s]]]));device.save();
   await preview(ticket);
   if(ticket===generation){status(t('{count} pages · {events} birthdays',{count:number(model.pages.length),events:number(model.events.length)}));setDisabled(false)}
  }catch(error){if(ticket===generation){model=null;$('#document-preview')?.replaceChildren();status(messages[error.message]?t(error.message):t('Export could not be created. Check the year and try again.'))}}
 }
 async function preview(ticket=generation){
  if(!model)return;const current=model,index=page,previewTicket=++previewGeneration;
  $('#previous-page').disabled=$('#next-page').disabled=true;
  const canvas=await renderDocumentPage(current.pages[index],{scale:Math.min(1.3,820/current.pages[page].width)});
  if(ticket!==generation||previewTicket!==previewGeneration||model!==current||!$('#modal').open){canvas.width=canvas.height=1;return}
  $('#document-preview').replaceChildren(canvas);
  $('#page-count').textContent=t('Page {page} of {total}',{page:number(page+1),total:number(model.pages.length)});
  $('#previous-page').disabled=page===0;$('#next-page').disabled=page===model.pages.length-1;
  $('#document-text').innerHTML=`<h4>${esc(model.pages[page].title)}</h4><ul>${model.pages[page].ops.filter(op=>op.type==='text').map(op=>`<li dir="auto">${esc(op.text)}</li>`).join('')}</ul>`;
 }
 $('#previous-page').onclick=()=>{if(model&&page>0){page--;preview().catch(()=>status(t('Export could not be created. Try again.')))}};
 $('#next-page').onclick=()=>{if(model&&page<model.pages.length-1){page++;preview().catch(()=>status(t('Export could not be created. Try again.')))}};
 $$('.export-form input,.export-form select').forEach(el=>el.onchange=()=>{if(el.id==='doc-layout-calendar')$('#doc-year').value=calendars[el.value].parts(today())[0];if(el.id==='doc-qr')$('#doc-qr-note').hidden=!el.checked;schedule()});
 $('#doc-year')?.addEventListener('input',schedule);
 async function exportFile(kind){
  if(!model||busy)return;
  const snapshot=model,index=page;busy=true;controller=new AbortController();setDisabled(true);formElement.inert=true;selectionElement?.setAttribute('inert','');
  try{
   const blob=kind==='pdf'?await documentPDF(snapshot,{signal:controller.signal,onProgress:(n,total)=>status(t('Generating page {page} of {total}…',{page:number(n),total:number(total)}))}):await canvasBlob(await renderDocumentPage(snapshot.pages[index],{scale:card?2:300/72,signal:controller.signal}));
   if(controller.signal.aborted||!active())return;
   const name=snapshot.name+(kind==='pdf'?'.pdf':'-'+(index+1)+'.png');
   if(kind==='share'&&navigator.canShare){const file=new File([blob],name,{type:'image/png'});if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:t('Birthday image')});status(t('Image shared.'));return}}
   download(blob,name);status(t('Download started.'));
  }catch(error){if(error.name==='AbortError')status(t('Export cancelled.'));else status(t('Export could not be created. Try again.'))}
  finally{busy=false;controller=null;if(active()){formElement.inert=false;selectionElement?.removeAttribute('inert');setDisabled(!model)}}
 }
 $('#download-pdf')?.addEventListener('click',()=>exportFile('pdf'));$('#download-image').onclick=()=>exportFile('png');$('#share-image')?.addEventListener('click',()=>exportFile('share'));
 $('#cancel-document').onclick=()=>{if(busy){controller?.abort();status(t('Export cancelled.'))}else close()};
 state.onDialogClose=()=>{generation++;clearTimeout(timer);controller?.abort();$('#modal').classList.remove('document-dialog');state.onDialogClose=null};
 schedule();
}
