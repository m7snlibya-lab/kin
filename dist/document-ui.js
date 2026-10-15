import {calendars,today,encode} from './core.js';
import {t,language,number,parseDigits,messages} from './i18n.js';
import {$,$$,esc,button,mountSelection,download,setBusy} from './ui.js';
import {loadExportFonts,createMeasure,createCalendarDocument,createCardDocument,renderDocumentPage,canvasBlob,documentPDF} from './documents.js';

export function openDocumentDialog(state,{modal,close,toast,visible,device},event){
 const card=!!event,saved=card?device.value.preferences.birthdayImage:device.value.preferences.export;
 const prefs=saved||(card?device.value.preferences.export:{})||{};
 const contextCalendar=state.birthdayView==='months'?state.birthdayMonthCalendar:state.primaryCalendar;
 const defaults={layoutCalendar:contextCalendar,year:calendars[contextCalendar].parts(today())[0],birthdayCalendar:state.birthdayView==='months'?contextCalendar:state.birthdayCalendar,layout:'annual',size:'A4',orientation:'landscape',locale:language(),showAges:false,ink:false,qr:false,shape:'square',theme:'celebratory'};
 const presets={year:{layout:'annual',size:'A4',orientation:'landscape',ink:false},monthly:{layout:'monthly',size:'A4',orientation:'portrait',ink:true},wall:{layout:'annual',size:'A3',orientation:'landscape',ink:false}};
 const initial={...defaults,showAges:saved?.showAges===true,ink:!card&&prefs.ink===true};
 for(const [k,allowed] of Object.entries({layoutCalendar:['g','h'],birthdayCalendar:['g','h','both'],layout:['annual','monthly'],size:['A4','A3'],orientation:['landscape','portrait'],locale:['en','ar'],shape:['square','portrait'],theme:['celebratory','minimal']}))if(allowed.includes(prefs[k]))initial[k]=prefs[k];
 initial.year=calendars[initial.layoutCalendar].parts(today())[0];
 const select=(id,key,values)=>`<label><span>${t(key)}</span><select id="${id}">${values.map(([v,label])=>`<option value="${v}">${t(label)}</option>`).join('')}</select></label>`;
 modal(card?'Birthday image':'Printable calendar',`<div class="document-settings">${card?'':`<section class="document-people" aria-labelledby="document-people-title"><h3 id="document-people-title">${t('Choose people')}</h3><div id="document-selection"></div></section>`}<div class="export-form">
 ${card?select('doc-shape','Image shape',[['square','Square'],['portrait','Portrait']])+select('doc-theme','Design',[['celebratory','Celebratory'],['minimal','Minimal']]):select('doc-layout-calendar','Year calendar',[['g','Gregorian'],['h','Hijri']])+`<label><span>${t('Year')}</span><input id="doc-year" inputmode="numeric" value="${number(initial.year).replace(/[٬,]/g,'')}"></label>`+select('doc-birthdays','Birthday calendar',[['g','Gregorian'],['h','Hijri'],['both','Both calendars']])+select('doc-layout','Layout',[['annual','Annual overview'],['monthly','Month per page']])+select('doc-size','Paper size',[['A4','A4'],['A3','A3']])+select('doc-orientation','Orientation',[['landscape','Landscape'],['portrait','Portrait']])}
 ${select('doc-language','Language',[['en','English'],['ar','العربية']])}
 <label class="check-row"><input id="doc-ages" type="checkbox">${t('Show turning ages')}</label>
 ${card?'':`<label class="check-row"><input id="doc-ink" type="checkbox">${t('Ink-friendly design')}</label><label class="check-row"><input id="doc-qr" type="checkbox">${t('Include family QR')}</label><p id="doc-qr-note" class="hint" hidden>${t('Anyone with this QR can read the selected names and birth dates.')}</p>`}
 </div></div><p id="document-status" class="hint export-status" role="status" aria-live="polite"></p><div id="document-preview" class="document-preview"></div><div class="preview-controls">${button('previous-page','Previous page')}<span id="page-count"></span>${button('next-page','Next page')}</div><section class="document-text" tabindex="0" role="region" aria-label="${t('Accessible text preview')}"><h3>${t('Accessible text preview')}</h3><div id="document-text"></div></section><div class="dialog-actions export-controls">${button('cancel-document','Cancel')}${card?button('share-image','Share image'):button('download-pdf','Download PDF','primary')}${button('download-image','Download image',card?'primary':'secondary')}</div><p class="hint">${t('PDFs use high-resolution page images. Download one PNG at a time using the page controls.')}</p>`);
 $('#modal').classList.add('document-dialog');
 const body=$('#modal-body'),settings=$('.document-settings'),previewElement=$('#document-preview');
 const stage=document.createElement('section');stage.className='document-stage';stage.setAttribute('aria-label',t('Preview'));
 const previewControls=$('.preview-controls'),previewStatus=$('#document-status');
 settings.before(stage);stage.append(previewStatus,previewElement,previewControls);
 if(!card){
  const essentials=document.createElement('div');essentials.className='document-essentials';
  stage.prepend(essentials);
  ['#doc-layout-calendar','#doc-year','#doc-birthdays'].forEach(s=>essentials.append($(s).closest('label')));
  settings.querySelector('.export-form').insertAdjacentHTML('afterbegin',`<h3 class="print-settings-title">${t('Print settings')}</h3>`);
 }
 const workspace=document.createElement('div');workspace.className='document-workspace';
 body.prepend(workspace);workspace.append(stage,settings);
 let navigation=null,headerObserver=null;
 if(!card){
  $('#modal').classList.add('calendar-dialog');
  navigation=document.createElement('nav');navigation.className='document-jumps';navigation.setAttribute('aria-label',t('Print sections'));
  navigation.innerHTML=`${button('doc-jump-preview','Preview')}${button('doc-jump-people','Choose people')}${button('doc-jump-settings','Print settings')}<label class="document-section-menu"><span>${t('Go to section')}</span><select id="doc-section"><option value="preview">${t('Preview')}</option><option value="people">${t('Choose people')}</option><option value="settings">${t('Print settings')}</option></select></label>`;
  workspace.before(navigation);
  settings.querySelector('.print-settings-title').insertAdjacentHTML('afterend',`${select('doc-preset','Quick setup',[['year','A4 year overview'],['monthly','Monthly pages'],['wall','A3 wall calendar'],['custom','Custom settings']])}<p class="hint preset-note">${t('Set paper and layout together. People, dates and QR choices stay unchanged.')}</p>`);
  stage.insertAdjacentHTML('beforeend','<p id="document-summary" class="hint document-summary"></p>');
  const jump=target=>{target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'auto'})};
  $('#document-preview').tabIndex=-1;
  const go=key=>{const targets={preview:'#document-preview',people:'#document-selection .selection-all',settings:'#doc-preset'};$('#doc-section').value=key;jump($(targets[key]))};
  $('#doc-jump-preview').onclick=()=>go('preview');$('#doc-jump-people').onclick=()=>go('people');$('#doc-jump-settings').onclick=()=>go('settings');$('#doc-section').onchange=e=>go(e.target.value);
  $('#doc-preset option[value=custom]').disabled=true;
  const measureHeader=()=>{const dialog=$('#modal');dialog.style.setProperty('--document-head-height',Math.ceil($('.dialog-head').getBoundingClientRect().height)+'px');dialog.style.setProperty('--document-nav-height',Math.ceil(navigation.getBoundingClientRect().height)+'px')};
  headerObserver=new ResizeObserver(measureHeader);headerObserver.observe($('.dialog-head'));headerObserver.observe(navigation);measureHeader();
 }

 $('#modal-title').tabIndex=-1;$('#modal-title').focus({preventScroll:true});$('#modal').scrollTop=0;
 let model=null,page=0,generation=0,previewGeneration=0,controller=null,busy=false,timer=null;
 const statusElement=$('#document-status'),formElement=$('.export-form'),selectionElement=$('#document-selection');
 const active=()=>statusElement.isConnected&&$('#modal').open;
 const controls=['#download-pdf','#download-image','#share-image'].map(s=>$(s)).filter(Boolean);
 const setDisabled=disabled=>controls.forEach(b=>b.disabled=disabled);
 const status=text=>{if(active())statusElement.textContent=text};
 const working=value=>{if(active()){statusElement.classList.toggle('is-loading',value);$('#document-preview').setAttribute('aria-busy',String(value))}};
 const selections=card?null:mountSelection($('#document-selection'),state.people,{selected:visible().map(p=>p.id),changed:()=>schedule()});
 // Keep the preview at the start; selection remains a clearly titled section.
 const fieldMap=card?{'#doc-shape':'shape','#doc-theme':'theme','#doc-language':'locale'}:{'#doc-layout-calendar':'layoutCalendar','#doc-birthdays':'birthdayCalendar','#doc-layout':'layout','#doc-size':'size','#doc-orientation':'orientation','#doc-language':'locale'};
 for(const [selector,key] of Object.entries(fieldMap))$(selector).value=initial[key];
 $('#doc-ages').checked=initial.showAges;if(!card)$('#doc-ink').checked=initial.ink;
 if(!card)$('#doc-preset').onchange=e=>{const preset=presets[e.target.value];if(!preset)return;for(const key of ['layout','size','orientation'])$('#doc-'+key).value=preset[key];$('#doc-ink').checked=preset.ink;schedule()};
 function options(){const value={...initial};for(const [selector,key] of Object.entries(fieldMap))value[key]=$(selector).value;value.showAges=$('#doc-ages').checked;if(!card){value.year=parseDigits($('#doc-year').value);value.ink=$('#doc-ink').checked;value.qr=$('#doc-qr').checked}return value}
 function schedule(){if(!card){const selected=selectionElement.querySelectorAll('.selection-person:checked').length;const opts={layout:$('#doc-layout').value,size:$('#doc-size').value,orientation:$('#doc-orientation').value,ink:$('#doc-ink').checked};$('#doc-preset').value=Object.keys(presets).find(k=>Object.entries(presets[k]).every(([key,value])=>opts[key]===value))||'custom';$('#doc-jump-people span').textContent=$('#doc-section option[value=people]').textContent=t('People ({count})',{count:number(selected)});$('#document-summary').textContent=t('People: {count} · {paper} · {orientation} · {layout}',{count:number(selected),paper:opts.size,orientation:t(opts.orientation==='landscape'?'Landscape':'Portrait'),layout:t(opts.layout==='annual'?'Annual overview':'Month per page')})}clearTimeout(timer);generation++;model=null;setDisabled(true);status(t('Preparing preview…'));working(true);timer=setTimeout(build,150)}
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
   device.value.preferences[card?'birthdayImage':'export']={...Object.fromEntries(Object.keys(fieldMap).map(s=>[fieldMap[s],opts[fieldMap[s]]])),showAges:opts.showAges,ink:opts.ink===true};device.save();
   await preview(ticket);
   if(ticket===generation){status(t('Pages: {count} · Birthdays: {events}',{count:number(model.pages.length),events:number(model.events.length)}));setDisabled(false)}
  }catch(error){if(ticket===generation){model=null;$('#document-preview')?.replaceChildren();status(messages[error.message]?t(error.message):t('Export could not be created. Check the year and try again.'))}}
  finally{if(ticket===generation)working(false)}
 }
 async function preview(ticket=generation){
  if(!model)return;const current=model,index=page,previewTicket=++previewGeneration;
  $('#previous-page').disabled=$('#next-page').disabled=true;
  const canvas=await renderDocumentPage(current.pages[index],{scale:Math.min(1.3,820/current.pages[page].width)});
  if(ticket!==generation||previewTicket!==previewGeneration||model!==current||!$('#modal').open){canvas.width=canvas.height=1;return}
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',t('Preview of page {page} of {total}',{page:number(page+1),total:number(model.pages.length)}));
  $('#document-preview').replaceChildren(canvas);
  $('#page-count').textContent=t('Page {page} of {total}',{page:number(page+1),total:number(model.pages.length)});
  $('.preview-controls').hidden=model.pages.length===1;
  $('#previous-page').disabled=page===0;$('#next-page').disabled=page===model.pages.length-1;
  $('#document-text').dir=model.locale==='ar'?'rtl':'ltr';
  $('#document-text').innerHTML=`<h4>${esc(model.pages[page].title)}</h4><ul>${model.pages[page].ops.filter(op=>op.type==='text').map(op=>`<li dir="auto">${esc(op.text)}</li>`).join('')}</ul>`;
 }
 $('#previous-page').onclick=()=>{if(model&&page>0){page--;preview().catch(()=>status(t('Export could not be created. Try again.')))}};
 $('#next-page').onclick=()=>{if(model&&page<model.pages.length-1){page++;preview().catch(()=>status(t('Export could not be created. Try again.')))}};
 $$('.export-form input,.export-form select:not(#doc-preset),.document-essentials input,.document-essentials select').forEach(el=>el.onchange=()=>{if(el.id==='doc-layout-calendar')$('#doc-year').value=number(calendars[el.value].parts(today())[0]).replace(/[٬,]/g,'');if(el.id==='doc-qr')$('#doc-qr-note').hidden=!el.checked;schedule()});
 $('#doc-year')?.addEventListener('input',schedule);
 async function exportFile(kind){
  if(!model||busy)return;
  const trigger=$(kind==='pdf'?'#download-pdf':kind==='share'?'#share-image':'#download-image');
  setBusy(trigger,true,'Preparing download…');working(true);status(t('Preparing download…'));$('#cancel-document span').textContent=t('Cancel export');
  const snapshot=model,index=page;busy=true;controller=new AbortController();setDisabled(true);formElement.inert=true;navigation?.setAttribute('inert','');$('.document-essentials')?.setAttribute('inert','');selectionElement?.setAttribute('inert','');
  try{
   const blob=kind==='pdf'?await documentPDF(snapshot,{signal:controller.signal,onProgress:(n,total)=>status(t('Generating page {page} of {total}…',{page:number(n),total:number(total)}))}):await canvasBlob(await renderDocumentPage(snapshot.pages[index],{scale:card?2:300/72,signal:controller.signal}));
   if(controller.signal.aborted||!active())return;
   const name=snapshot.name+(kind==='pdf'?'.pdf':'-'+(index+1)+'.png');
   if(kind==='share'&&navigator.canShare){const file=new File([blob],name,{type:'image/png'});if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:t('Birthday image')});status(t('Image shared.'));return}}
   download(blob,name);status(t('Download started.'));
  }catch(error){if(error.name==='AbortError')status(t('Export cancelled.'));else status(t('Export could not be created. Try again.'))}
  finally{setBusy(trigger,false);busy=false;controller=null;if(active()){working(false);$('#cancel-document span').textContent=t('Cancel');formElement.inert=false;navigation?.removeAttribute('inert');$('.document-essentials')?.removeAttribute('inert');selectionElement?.removeAttribute('inert');setDisabled(!model)}}
 }
 $('#download-pdf')?.addEventListener('click',()=>exportFile('pdf'));$('#download-image').onclick=()=>exportFile('png');$('#share-image')?.addEventListener('click',()=>exportFile('share'));
 $('#cancel-document').onclick=()=>{if(busy){controller?.abort();status(t('Export cancelled.'))}else close()};
 state.onDialogClose=()=>{generation++;clearTimeout(timer);controller?.abort();headerObserver?.disconnect();$('#modal').style.removeProperty('--document-head-height');$('#modal').style.removeProperty('--document-nav-height');$('#modal').classList.remove('document-dialog','calendar-dialog');state.onDialogClose=null};
 schedule();
}
