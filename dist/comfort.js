import {$,button,esc} from './ui.js';
import {t,months,number,calendarName} from './i18n.js';
import {icon,labelControl} from './icons.js';

// Keep everyday information visible; organize advanced controls without removing them.
export function createComfort(state,{device,render}){
 const prefs=device.value.preferences;
 const layout=$('#layout-control');
 const toolbar=$('.toolbar-actions');
 toolbar.append($('#tools-button'),$('#exports-button'),$('#import-button'));
 $('.section-toolbar h2').classList.add('sr-only');
 // Match visual and reading order: family views before occasional utilities.
 $('.view-tabs').after($('.section-toolbar'));
 const finder=document.createElement('div');finder.className='discovery-bar';
 $('.search-field').before(finder);finder.append($('.search-field'),layout);
 $('#layout-control > span').className='sr-only';
 $('.sort-label .sr-only').className='control-label';
 $('.heading-actions').prepend($('#add-button'));
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

 const overview=$('.overview'),peek=document.createElement('details');
 peek.className='overview-peek';peek.id='family-overview';
 peek.innerHTML=`<summary data-i18n="Today in both calendars">${t('Today in both calendars')}</summary>`;
 overview.before(peek);peek.append(overview);
 const aside=$('.workspace > aside'),guide=document.createElement('details');
 guide.className='saving-guide';
 guide.innerHTML=`<summary data-i18n="Saving, sharing & offline help">${t('Saving, sharing & offline help')}</summary>`;
 const offline=$('#offline-label').closest('.detail-line');
 offline.querySelector('span[aria-hidden]').outerHTML='<span id="offline-symbol" aria-hidden="true">'+icon('clock')+'</span>';
 const details=aside.querySelectorAll('.aside-details .detail-line');
 details[0].querySelector('span[aria-hidden]').outerHTML=icon('calendar');
 details[2].querySelector('span[aria-hidden]').outerHTML=icon('people');
 $('.link-note .note-icon').innerHTML=icon('share');
 offline.classList.add('offline-summary');aside.prepend(offline);
 for(const child of [...aside.children])if(child!==offline)guide.append(child);
 guide.append($('#install-button'));
 aside.append(guide);
 aside.prepend($('#backup-reminder'));
 aside.prepend(peek);

 $('#about-button').insertAdjacentHTML('beforebegin',`<button id="text-size-button" class="reading-button" aria-pressed="false"><span class="reading-symbol" aria-hidden="true">${icon('text')}</span> <span id="text-size-label"></span></button>`);
 $('#text-size-button').onclick=()=>{prefs.largeText=!prefs.largeText;device.save();refresh()};
 $('#close-modal').innerHTML=`<span aria-hidden="true">${icon('close')}</span> <span data-i18n="Close">${t('Close')}</span>`;

 for(const [selector,name,key] of [
  ['#add-button','plus','Add person'],['#share-button','share','Share & backup'],
  ['#tools-button','compare'],['#exports-button','calendar'],['#import-button','folder'],
  ['#people-tab','people'],['#birthdays-tab','calendar'],['#timeline-tab','timeline'],['#about-button','help'],['#install-button','install','Install app'],['#manage-groups','people']
 ])labelControl($(selector),name,key);
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
  $('#tools-button').hidden=$('#exports-button').hidden=state.people.length===0;
  $('.discovery-bar').hidden=state.people.length===0;
  $('.view-tabs').hidden=state.people.length===0;
  document.documentElement.dataset.largeText=prefs.largeText===true?'true':'false';
  $('#text-size-button').setAttribute('aria-pressed',String(prefs.largeText===true));
  $('#text-size-label').textContent=t('Larger text');
  $('#text-size-button > span[aria-hidden]').innerHTML=icon(prefs.largeText?'check':'text');
  const active=[
   state.group?{key:'group',label:t('Group: {name}',{name:device.value.groups.find(g=>g.id===state.group)?.name||''})}:null,
   state.month?{key:'month',label:t('{calendar}: {month}',{calendar:calendarName(state.primaryCalendar),month:months(state.primaryCalendar)[+state.month-1]})}:null,
   state.search?{key:'search',label:t('Search: {query}',{query:state.search})}:null
  ].filter(Boolean);
  $('#filter-status').hidden=!active.length;
  $('#clear-filters span').textContent=t('Clear filters');
  $('#filter-description').innerHTML=active.map(({key,label})=>
   `<button type="button" class="filter-chip" data-remove-filter="${key}" title="${esc(label)}" aria-label="${esc(t('Remove filter: {filter}',{filter:label}))}"><bdi>${esc(label)}</bdi>${icon('close')}</button>`
  ).join('');
  $('#results-toolbar').hidden=!state.people.length;
  $('#results-summary').textContent=t('Showing {shown} of {total} people',{shown:$('#list-count').textContent,total:number(state.people.length)});
  $('#filter-count').hidden=!active.length;$('#filter-count').textContent=number(active.length);
  $('#family-options').classList.toggle('has-filters',!!active.length);

  $('#layout-control').hidden=state.view!=='people';
  const table=$('.table-scroll');
  if(table!==observedTable){tableObserver.disconnect();observedTable=table;if(table)tableObserver.observe(table)}
  updateScrollHint();
 }
 return {refresh};
}
