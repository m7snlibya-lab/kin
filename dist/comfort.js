import {$,button,esc} from './ui.js';
import {t,months,number,calendarName} from './i18n.js';
import {icon,labelControl} from './icons.js';

// Keep everyday information visible; organize advanced controls without removing them.
export function createComfort(state,{device,render}){
 const layout=$('#layout-control');
 const toolbar=$('.toolbar-actions');
 toolbar.append($('#tools-button'),$('#exports-button'),$('#import-button'));
 $('.section-toolbar h2').classList.add('sr-only');
 // Match visual and reading order: family views before occasional utilities.
 $('.view-tabs').after($('.section-toolbar'));
 $('.view-tabs').insertAdjacentHTML('beforeend',`<button id="tools-tab" role="tab" tabindex="-1" aria-selected="false" aria-controls="tools-panel" data-view="tools" data-i18n="Tools">${t('Tools')}</button>`);
 $('#timeline-tab').removeAttribute('role');$('#timeline-tab').removeAttribute('aria-selected');$('#timeline-tab').removeAttribute('aria-controls');$('#timeline-tab').tabIndex=0;
 $('#timeline-panel').setAttribute('aria-labelledby','timeline-tab');
 $('#timeline-panel').insertAdjacentHTML('afterend',`<section id="tools-panel" role="tabpanel" aria-labelledby="tools-tab" hidden><h2 data-i18n="Tools">${t('Tools')}</h2><p class="hint" data-i18n="A few useful things for your family.">${t('A few useful things for your family.')}</p><div class="tools-grid"></div><h3 id="data-tools-title" data-i18n="Your data">${t('Your data')}</h3><p id="data-tools-help" class="hint" data-i18n="Backups are files you keep. Kin does not sync to a cloud account.">${t('Backups are files you keep. Kin does not sync to a cloud account.')}</p><div class="data-tools"></div></section>`);
 $('#tools-panel .tools-grid').append($('#tools-button'),$('#exports-button'),$('#timeline-tab'));
 $('#tools-panel .data-tools').append($('#import-button'));
 $('#tools-panel .data-tools').insertAdjacentHTML('afterbegin',button('backup-button','Back up family'));
 $('#tools-panel').append($('#about-button'));
 $('.section-toolbar').hidden=true;
 $('#add-button').classList.remove('small');
 $('.site-header nav').prepend($('#add-button'));
 $('.page-heading h1').dataset.i18n='Your people';
 $('.page-heading h1').insertAdjacentHTML('afterend','<p id="family-mode" class="family-mode" role="status"></p>');
 const finder=document.createElement('div');finder.className='discovery-bar';
 $('.search-field').before(finder);finder.append($('.search-field'),layout);
 $('#layout-control > span').className='sr-only';
 $('.sort-label .sr-only').className='control-label';
 // Add person lives in the persistent app header, not repeated in each view.
 $('#share-button').classList.replace('primary','secondary');
 $('#import-button').dataset.i18n='Import & restore';
 $('#exports-button').dataset.i18n='Calendars';
 $('#tools-button').dataset.i18n='Ages & dates';
 $('#about-button').dataset.i18n='Help';
 const copy=$('.page-heading > div');
 copy.classList.add('hero-copy');copy.append($('.heading-actions'));
 const celebration=$('.next-item');celebration.className='celebration-panel';
 celebration.querySelector('.eyebrow').dataset.i18n='Next in your circle';
 celebration.insertAdjacentHTML('beforeend',`<button id="see-birthdays" class="celebration-link" data-i18n="View birthdays">${t('View birthdays')}</button>`);
 $('.page-heading').append(celebration);
 $('#see-birthdays').onclick=()=>{state.view='birthdays';state.birthdayCalendar='both';state.birthdayRange=365;state.milestones=[];render();$('#birthdays-tab').focus();$('#birthday-panel').scrollIntoView({block:'start',behavior:'auto'})};

 const filters=$('.family-filters');
 $('.search-field').insertAdjacentHTML('afterend',`<details id="family-options" class="family-options"><summary><span data-i18n="Filter & organize">${t('Filter & organize')}</span><span id="filter-count" class="count-pill" hidden></span></summary></details><div id="filter-status" class="filter-status" hidden><div id="filter-description" class="filter-chips"></div>${button('clear-filters','Clear filters')}</div>`);
 $('#family-options').append(filters);finder.append($('#family-options'));finder.after($('#filter-status'));
 const results=document.createElement('div');results.className='results-toolbar';results.id='results-toolbar';
 results.innerHTML='<p id="results-summary" role="status" aria-live="polite" aria-atomic="true"></p>';
 $('#filter-status').after(results);results.append($('.sort-label'));
 $('#primary-calendar').previousElementSibling.dataset.i18n='Calendar for filters & dates';
 filters.insertAdjacentHTML('beforeend',`<p class="hint filter-explanation" data-i18n="Ages are always shown in both calendars. This choice only changes filters and date-based tools.">${t('Ages are always shown in both calendars. This choice only changes filters and date-based tools.')}</p>`);
 $('#clear-filters').onclick=()=>{state.group='';state.month='';state.search='';$('#family-search').value='';render();$('#family-search').focus()};
 $('#filter-description').onclick=e=>{
  const chip=e.target.closest('[data-remove-filter]');if(!chip)return;
  const key=chip.dataset.removeFilter,index=[...chip.parentElement.children].indexOf(chip);
  state[key]='';if(key==='search')$('#family-search').value='';render();
  const remaining=[...$('#filter-description').children];
  (remaining[Math.min(index,remaining.length-1)]||(key==='search'?$('#family-search'):$('#family-options>summary'))).focus();
 };

 const overview=$('.overview');overview.id='family-overview';
 overview.querySelector('.overview-item:not(.date-item)').hidden=true;
 for(const [selector,name] of [['#today-g','sun'],['#today-h','moon']]){
  const value=$(selector),row=document.createElement('div');row.className='today-date';
  value.className='today-value';value.before(row);
  row.innerHTML=icon(name)+'<div class="today-calendar"><span class="today-calendar-label" data-calendar-label="'+(name==='sun'?'g':'h')+'"></span></div>';
  row.querySelector('.today-calendar').append(value);
 }
 const aside=$('.workspace > aside');
 const offline=$('#offline-label').closest('.detail-line');
 offline.querySelector('span[aria-hidden]').outerHTML='<span id="offline-symbol" aria-hidden="true">'+icon('clock')+'</span>';
 offline.classList.add('offline-summary');aside.prepend(offline);
 // Long explanations remain available through Help, not repeated on the family page.
 $('.link-note').remove();$('.aside-details').remove();
 aside.append($('#install-button'));
 aside.prepend($('#backup-reminder'));aside.prepend(overview);

 $('#close-modal').innerHTML=`<span aria-hidden="true">${icon('close')}</span> <span data-i18n="Close">${t('Close')}</span>`;

 for(const [selector,name,key] of [
  ['#add-button','plus','Add person'],['#share-button','share','Share family'],['#backup-button','backup','Back up family'],['#tools-tab','tools','Tools'],
  ['#tools-button','compare'],['#exports-button','calendar'],['#import-button','folder'],
  ['#people-tab','people'],['#birthdays-tab','calendar'],['#timeline-tab','timeline'],['#about-button','help'],['#install-button','install','Install app'],['#manage-groups','people']
 ])labelControl($(selector),name,key);
 for(const [id,key] of [['tools-button','Compare ages or explore another date.'],['exports-button','Print birthdays or add them to a calendar.'],['timeline-tab','See your family’s births through time.'],['backup-button','Download a private file to keep safe.'],['import-button','Review a family link or restore a file.']]){
  const tile=$('#'+id),label=tile.querySelector('span'),copy=document.createElement('span');copy.className='tool-copy';
  label.before(copy);copy.append(label);
  const description=document.createElement('span');description.className='tool-description';description.dataset.i18n=key;description.textContent=t(key);copy.append(description);
 }
 $('.search-field').insertAdjacentHTML('afterbegin',icon('search'));
 const summary=$('#family-options > summary');summary.classList.add('has-icon');
 summary.insertAdjacentHTML('afterbegin',icon('filter'));summary.insertAdjacentHTML('beforeend',icon('chevron'));
 let observedTable=null;
 const tableObserver=new ResizeObserver(updateScrollHint);
 function updateScrollHint(){
  const table=$('.table-scroll'),hint=$('#table-scroll-hint');if(!hint||!table)return;
  const scrollable=table.scrollWidth>table.clientWidth+1;hint.hidden=!scrollable;table.tabIndex=scrollable?0:-1;
  if(scrollable)table.setAttribute('aria-describedby','table-scroll-hint');else table.removeAttribute('aria-describedby');
 }

 function refresh(){
  document.body.classList.toggle('has-family',state.people.length>0);
  $('.celebration-panel').hidden=state.people.length===0;
  $('.celebration-panel .eyebrow').textContent=t(state.reference===null?'Next in your circle':'Next from this date');
  for(const label of document.querySelectorAll('[data-calendar-label]'))label.textContent=calendarName(label.dataset.calendarLabel);
  $('#tools-button').hidden=$('#exports-button').hidden=state.people.length===0;
  $('.discovery-bar').hidden=state.people.length===0;
  $('.view-tabs').hidden=false;
  $('#tools-panel').hidden=state.view!=='tools';
  const tools=state.view==='tools';
  $('.page-heading h1').textContent=t(state.view==='birthdays'?'Birthdays':state.view==='timeline'?'Timeline':tools?'Tools':'Your people');
  $('#people').classList.toggle('list-layout',state.layout==='list');
  $('.discovery-bar').hidden=!state.people.length||tools;
  $('#filter-status').hidden=tools;
  $('#family-mode').textContent=t(state.demo?'Example family':state.viewOnly?'Shared family · view only':state.people.length?(state.storageAvailable===false?'Only in this link':'Saved on this device'):'No account needed');
  $('#add-button').hidden=state.demo||state.viewOnly;
  $('#share-button').hidden=state.demo||!state.people.length;
  $('#backup-button').hidden=state.demo||state.viewOnly||!state.people.length;
  $('#import-button').hidden=state.demo||state.viewOnly;
  $('#data-tools-title').hidden=$('#data-tools-help').hidden=state.demo||state.viewOnly;
  $('#exports-button').hidden=!state.people.length||state.demo;
  $('#timeline-tab').hidden=!state.people.length;
  $('#birthdays-tab').disabled=!state.people.length;
  $('.celebration-panel').hidden=!state.people.length||tools||state.view==='timeline';
  const active=[
   state.group?{key:'group',label:t('Group: {name}',{name:device.value.groups.find(g=>g.id===state.group)?.name||''})}:null,
   state.month?{key:'month',label:t('{calendar}: {month}',{calendar:calendarName(state.primaryCalendar),month:months(state.primaryCalendar)[+state.month-1]})}:null,
   state.search?{key:'search',label:t('Search: {query}',{query:state.search})}:null
  ].filter(Boolean);
  $('#filter-status').hidden=!active.length||tools;
  $('#clear-filters span').textContent=t('Clear filters');
  $('#filter-description').innerHTML=active.map(({key,label})=>
   `<button type="button" class="filter-chip" data-remove-filter="${key}" title="${esc(label)}" aria-label="${esc(t('Remove filter: {filter}',{filter:label}))}"><bdi>${esc(label)}</bdi>${icon('close')}</button>`
  ).join('');
  $('#results-toolbar').hidden=!state.people.length||tools;
  $('#results-summary').textContent=t('Showing {shown} of {total} people',{shown:$('#list-count').textContent,total:number(state.people.length)});
  $('#filter-count').hidden=!active.length;$('#filter-count').textContent=number(active.length);
  $('#family-options').classList.toggle('has-filters',!!active.length);

  $('.sort-label').hidden=state.view!=='people'||state.people.length<2;
  $('#layout-control').hidden=state.view!=='people';
  const table=$('.table-scroll');
  if(table!==observedTable){tableObserver.disconnect();observedTable=table;if(table)tableObserver.observe(table)}
  updateScrollHint();
 }
 return {refresh};
}
