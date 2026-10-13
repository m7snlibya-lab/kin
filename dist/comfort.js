import {$,button} from './ui.js';
import {t,months,number} from './i18n.js';

// Keep everyday information visible; organize advanced controls without removing them.
export function createComfort(state,{device,render}){
 const prefs=device.value.preferences;
 const layout=$('#layout-control');
 $('.toolbar-actions').append(layout);
 $('.sort-label .sr-only').className='control-label';
 $('.heading-actions').prepend($('#add-button'));
 $('#share-button').classList.replace('primary','secondary');
 $('#import-button').dataset.i18n='Add from a link';
 $('#tools-button').dataset.i18n='Ages & dates';
 $('#about-button').dataset.i18n='Help';

 const filters=$('.family-filters');
 $('.search-field').insertAdjacentHTML('afterend',`<details id="family-options" class="family-options"><summary><span data-i18n="Filter & organize">${t('Filter & organize')}</span><span id="filter-count" class="count-pill" hidden></span></summary></details><div id="filter-status" class="filter-status" hidden><span id="filter-description"></span>${button('clear-filters','Clear filters')}</div>`);
 $('#family-options').append(filters);
 filters.prepend($('.sort-label'));
 $('#primary-calendar').previousElementSibling.dataset.i18n='Calendar for filters & dates';
 filters.insertAdjacentHTML('beforeend',`<p class="hint filter-explanation" data-i18n="Ages are always shown in both calendars. This choice only changes filters and date-based tools.">${t('Ages are always shown in both calendars. This choice only changes filters and date-based tools.')}</p>`);
 $('#clear-filters').onclick=()=>{state.group='';state.month='';state.search='';$('#family-search').value='';render();$('#family-search').focus()};

 const overview=$('.overview'),peek=document.createElement('details');
 peek.className='overview-peek';peek.id='family-overview';
 peek.innerHTML=`<summary data-i18n="Today & next birthday">${t('Today & next birthday')}</summary>`;
 overview.before(peek);peek.append(overview);
 const aside=$('.workspace > aside'),guide=document.createElement('details');
 guide.className='saving-guide';
 guide.innerHTML=`<summary data-i18n="Saving, sharing & offline help">${t('Saving, sharing & offline help')}</summary>`;
 const offline=$('#offline-label').closest('.detail-line');
 offline.classList.add('offline-summary');aside.prepend(offline);
 for(const child of [...aside.children])if(child!==offline)guide.append(child);
 guide.append($('#install-button'));
 aside.append(guide);
 aside.prepend($('#backup-reminder'));
 aside.prepend(peek);

 $('#about-button').insertAdjacentHTML('beforebegin',`<button id="text-size-button" class="reading-button" aria-pressed="false"><span aria-hidden="true">A+</span> <span id="text-size-label"></span></button>`);
 $('#text-size-button').onclick=()=>{prefs.largeText=!prefs.largeText;device.save();refresh()};
 $('#close-modal').innerHTML=`<span aria-hidden="true">×</span> <span data-i18n="Close">${t('Close')}</span>`;

 function refresh(){
  document.body.classList.toggle('has-family',state.people.length>0);
  document.documentElement.dataset.largeText=prefs.largeText===true?'true':'false';
  $('#text-size-button').setAttribute('aria-pressed',String(prefs.largeText===true));
  $('#text-size-label').textContent=t('Larger text');
  $('#text-size-button > span[aria-hidden]').textContent=prefs.largeText?'✓':'A+';
  const active=[state.group?device.value.groups.find(g=>g.id===state.group)?.name:null,state.month?months(state.primaryCalendar)[+state.month-1]:null,state.search?t('Search: {query}',{query:state.search}):null].filter(Boolean);
  $('#filter-status').hidden=!active.length;
  $('#filter-description').textContent=active.join(' · ');
  $('#filter-count').hidden=!active.length;$('#filter-count').textContent=number(active.length);
  $('#family-options').classList.toggle('has-filters',!!active.length);
  $('#manage-groups').textContent=t('Manage groups');
  $('#layout-control').hidden=state.view!=='people';
 }
 return {refresh};
}
