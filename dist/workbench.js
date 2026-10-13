import {calendars,today,MIN,MAX,id,encode} from './core.js';
import {filterPeople,comparePeople,referenceDay,yearBounds,eventsBetween,MILESTONES} from './domain.js';
import {t,language,number,date,months,calendarName,parseDigits} from './i18n.js';
import {$,$$,esc,button,mountSelection,download} from './ui.js';
import {createDeviceStore} from './device.js';
import {ageText} from './views.js';
import {icon} from './icons.js';

export function createWorkbench(state,{modal,close,render,ics,toast}){
 let storage;try{storage=localStorage}catch{}
 const device=createDeviceStore(location.pathname,storage),prefs=device.value.preferences;
 for(const [key,allowed] of Object.entries({sort:['added','birthday','oldest','name'],view:['people','birthdays','timeline'],layout:['cards','table'],primaryCalendar:['g','h'],birthdayCalendar:['both','g','h']}))if(allowed.includes(prefs[key]))state[key]=prefs[key];
 if([30,90,365].includes(prefs.birthdayRange))state.birthdayRange=prefs.birthdayRange;
 $('.search-field').insertAdjacentHTML('beforebegin',`<div class="family-filters"><label><span data-i18n="Group">${t('Group')}</span><select id="group-filter"></select></label><button id="manage-groups" class="quiet" data-i18n="Manage groups">${t('Manage groups')}</button><label><span data-i18n="Birthday month">${t('Birthday month')}</span><select id="month-filter"></select></label><label><span data-i18n="Primary calendar">${t('Primary calendar')}</span><select id="primary-calendar"><option value="g" data-i18n="Gregorian">${t('Gregorian')}</option><option value="h" data-i18n="Hijri">${t('Hijri')}</option></select></label><label id="layout-control"><span data-i18n="People view">${t('People view')}</span><select id="people-layout"><option value="cards" data-i18n="Cards">${t('Cards')}</option><option value="table" data-i18n="Table">${t('Table')}</option></select></label></div>`);
 $('.view-tabs').insertAdjacentHTML('beforeend',`<button id="timeline-tab" role="tab" tabindex="-1" aria-selected="false" aria-controls="timeline-panel" data-view="timeline" data-i18n="Timeline">${t('Timeline')}</button>`);
 $('#birthday-panel').insertAdjacentHTML('afterend','<section id="timeline-panel" role="tabpanel" aria-labelledby="timeline-tab" hidden></section>');
 $('.heading-actions').insertAdjacentHTML('beforeend',`<button id="tools-button" class="button secondary" data-i18n="Tools">${t('Tools')}</button><button id="exports-button" class="button secondary" data-i18n="Export & print">${t('Export & print')}</button>`);
 $('.overview').insertAdjacentHTML('beforebegin',`<div id="reference-banner" class="notice" hidden role="status"></div><div id="backup-reminder" class="notice" hidden></div><p id="device-note" class="hint" hidden data-i18n="Device settings are temporary because browser storage is unavailable.">${t('Device settings are temporary because browser storage is unavailable.')}</p>`);
 $('.agenda-controls').insertAdjacentHTML('beforeend',`<button id="milestones-button" class="button secondary" data-i18n="Milestones">${t('Milestones')}</button>`);
 const visible=()=>filterPeople(state.people,{search:state.search,group:state.group,groups:device.value.groups,month:state.month,calendar:state.primaryCalendar,locale:language()});
 function persist(){for(const key of ['sort','view','layout','primaryCalendar','birthdayCalendar','birthdayRange'])prefs[key]=state[key];device.save()}
 for(const [selector,key] of [['#group-filter','group'],['#month-filter','month'],['#primary-calendar','primaryCalendar'],['#people-layout','layout']])$(selector).onchange=e=>{state[key]=e.target.value;persist();render()};
 $('#manage-groups').onclick=groupsDialog;
 $('#tools-button').onclick=()=>{modal('Ages & dates',`<p class="hint">${t('Choose what you would like to find out.')}</p><div class="tool-list">${button('compare-open','Compare people')}<p class="tool-description">${t('See how old one person was when another was born.')}</p>${button('reference-open','Family on this date')}<p class="tool-description">${t('See everyone’s age on a date in the past or future.')}</p></div>`);$('#compare-open').onclick=compareDialog;$('#reference-open').onclick=referenceDialog};
 $('#exports-button').onclick=()=>{modal('Calendars',`<div class="tool-list">${button('print-open','Printable calendar')}<p class="tool-description">${t('Print a year of family birthdays.')}</p>${button('ics-open','Add to calendar app')}<p class="tool-description">${t('Keep birthdays in your own calendar.')}</p></div><p class="hint">${t('Exports start with the people in your current filters. Review your selection before downloading.')}</p>`);$('#print-open').onclick=()=>openDocuments();$('#ics-open').onclick=()=>{close();state.view='birthdays';render();ics()}};
 let openDocuments=()=>{};
 function groupsDialog(){
  if(state.demo||state.viewOnly)return toast('Merge or save this family before managing groups.');
  modal('Manage groups',`<p class="hint">${t('Groups stay on this device. They are not included in links or family backups.')}</p><div class="tool-list">${device.value.groups.map(g=>`<button class="button secondary" data-group="${esc(g.id)}"><bdi>${esc(g.name)}</bdi></button>`).join('')}${button('new-group','New group','primary')}</div>`);
  $$('[data-group]').forEach(b=>b.onclick=()=>editGroup(device.value.groups.find(g=>g.id===b.dataset.group)));$('#new-group').onclick=()=>editGroup();
 }
 function editGroup(group){
  modal(group?'Edit group':'New group',`<form id="group-form"><label class="form-field"><span>${t('Group name')}</span><input id="group-name" required maxlength="80" dir="auto" value="${esc(group?.name||'')}"></label><div id="group-selection"></div><p id="group-error" class="form-error" role="alert"></p><div class="dialog-actions">${group?button('delete-group','Delete group','danger'):''}${button('save-group','Save group','primary','submit')}</div></form>`);
  const selection=mountSelection($('#group-selection'),state.people,{selected:group?.members||visible().map(p=>p.id)});
  const signature=()=>JSON.stringify([$('#group-name').value,selection.values()]),initial=signature();state.pendingDraft=()=>signature()!==initial;
  $('#group-form').onsubmit=e=>{e.preventDefault();const name=$('#group-name').value.trim();if(!name)return;
   if(!group&&device.value.groups.length>=100){$('#group-error').textContent=t('Up to 100 groups are supported.');return}
   const next={id:group?.id||id(),name,members:selection.values()};
   device.value.groups=group?device.value.groups.map(g=>g.id===group.id?next:g):[...device.value.groups,next];device.save();state.pendingDraft=null;close();render();
  };
  $('#delete-group')?.addEventListener('click',()=>{if(!confirm(t('Delete this group? People will not be deleted.')))return;device.value.groups=device.value.groups.filter(g=>g.id!==group.id);if(state.group===group.id)state.group='';device.save();state.pendingDraft=null;close();render()});
 }
 function compareDialog(){
  const records=visible();if(records.length<2)return toast('Select at least two people using the family filters.');
  const options=records.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  modal('Compare people',`<div class="date-fields"><label>${t('First person')}<select id="compare-a">${options}</select></label><label>${t('Second person')}<select id="compare-b">${options}</select></label></div><div id="comparison-result" aria-live="polite"></div>`);
  $('#compare-b').value=records[1].id;
  const update=()=>{const a=records.find(p=>p.id===$('#compare-a').value),b=records.find(p=>p.id===$('#compare-b').value);
   if(a.id===b.id){$('#comparison-result').textContent=t('Choose two different people.');return}
   const comparison=comparePeople(a,b);
   $('#comparison-result').innerHTML=`<p class="form-preview">${t('Age gap: {days} days',{days:number(comparison.gapDays)})}</p>${['g','h'].map(c=>`<h3 class="has-icon">${icon(c==='g'?'sun':'moon')}${calendarName(c)}</h3><p>${t('When {name} was born',{name:'<bdi>'+esc(b.name)+'</bdi>'})}: <bdi>${esc(a.name)}</bdi> — ${ageText(comparison.atBirth[c].a)}</p><p>${t('When {name} was born',{name:'<bdi>'+esc(a.name)+'</bdi>'})}: <bdi>${esc(b.name)}</bdi> — ${ageText(comparison.atBirth[c].b)}</p>`).join('')}`;
  };$('#compare-a').onchange=$('#compare-b').onchange=update;update();
 }
 function referenceDialog(){
  const [y,m,d]=calendars.g.parts(state.reference??today());
  modal('Family on this date',`<p class="hint">${t('Explore ages in the past or future. Birth dates and family links will not change.')}</p><form id="reference-form"><label class="form-field"><span>${t('Calendar')}</span><select id="reference-calendar"><option value="g">${calendarName('g')}</option><option value="h">${calendarName('h')}</option></select></label><div class="date-fields"><label>${t('Day')}<input id="reference-day" inputmode="numeric" value="${d}" required></label><label>${t('Month')}<select id="reference-month"></select></label><label>${t('Year')}<input id="reference-year" inputmode="numeric" value="${y}" required></label></div><p id="reference-error" class="form-error" role="alert"></p><div class="dialog-actions">${button('reference-today','Back to today')}${button('reference-apply','Show family','primary','submit')}</div></form>`);
  let c='g';function fill(month){$('#reference-month').innerHTML=months(c).map((n,i)=>`<option value="${i+1}">${n}</option>`).join('');$('#reference-month').value=String(month)}fill(m);
  const read=()=>referenceDay(c,parseDigits($('#reference-year').value),parseDigits($('#reference-month').value),parseDigits($('#reference-day').value));
  $('#reference-calendar').onchange=e=>{try{const day=read();c=e.target.value;const [y,m,d]=calendars[c].parts(day);$('#reference-year').value=y;$('#reference-day').value=d;fill(m);$('#reference-error').textContent=''}catch{$('#reference-calendar').value=c;$('#reference-error').textContent=t('Invalid reference date.')}};
  $('#reference-form').onsubmit=e=>{e.preventDefault();try{state.reference=read();close();render()}catch{$('#reference-error').textContent=t('Invalid reference date.')}};
  $('#reference-today').onclick=()=>{state.reference=null;close();render()};
 }

 $('#milestones-button').onclick=()=>{modal('Milestones',`<p class="hint">${t('Milestones use the birthday calendar selected in the agenda.')}</p><div class="milestone-options">${MILESTONES.map(n=>`<label><input type="checkbox" value="${n}" ${state.milestones.includes(n)?'checked':''}>${number(n)}</label>`).join('')}</div><div class="dialog-actions">${button('clear-milestones','All birthdays')}${button('apply-milestones','Apply','primary')}</div>`);$('#clear-milestones').onclick=()=>{state.milestones=[];close();render()};$('#apply-milestones').onclick=()=>{state.milestones=$$('.milestone-options input:checked').map(i=>+i.value);close();render()}};
 function renderTimeline(){
  const panel=$('#timeline-panel');panel.hidden=state.view!=='timeline';if(panel.hidden)return;
  const records=visible();let events;
  if(state.timelineMode==='births')events=[...records].sort((a,b)=>a.day-b.day).map(p=>({day:p.day,person:p}));
  else{try{const {start,end}=yearBounds(state.primaryCalendar,calendars[state.primaryCalendar].parts(state.now)[0]);events=eventsBetween(records,start,end,state.birthdayCalendar)}catch{events=[]}}
  panel.innerHTML=`<label class="form-field"><span>${t('Timeline')}</span><select id="timeline-mode"><option value="births">${t('Birth history')}</option><option value="birthdays">${t('Birthdays in this year')}</option></select></label><ol class="family-timeline">${events.map(e=>`<li><strong dir="auto">${esc(e.person.name)}</strong><span>${date(e.day,state.primaryCalendar)} · ${date(e.day,state.primaryCalendar==='g'?'h':'g')}${e.calendar?' · '+calendarName(e.calendar)+' · '+t('Turning {age}',{age:number(e.turns)}):''}</span></li>`).join('')}</ol>${events.length?'':`<p class="hint">${t('No matching names')}</p>`}`;
  $('#timeline-mode').value=state.timelineMode;$('#timeline-mode').onchange=e=>{state.timelineMode=e.target.value;renderTimeline()};
 }
 function refresh(){
  persist();$('#device-note').hidden=device.available;
  if(state.group&&!device.value.groups.some(g=>g.id===state.group))state.group='';
  $('#group-filter').innerHTML=`<option value="">${t('Everyone')}</option>`+device.value.groups.map(g=>`<option value="${esc(g.id)}">${esc(g.name)}</option>`).join('');$('#group-filter').value=state.group;
  $('#month-filter').innerHTML=`<option value="">${t('All months')}</option>`+months(state.primaryCalendar).map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');$('#month-filter').value=state.month;
  for(const [s,k] of [['#primary-calendar','primaryCalendar'],['#people-layout','layout'],['#sort','sort'],['#birthday-range','birthdayRange'],['#birthday-calendar','birthdayCalendar']])$(s).value=String(state[k]);
  $('#layout-control').hidden=state.view!=='people';
  const banner=$('#reference-banner');banner.hidden=state.reference===null;
  banner.innerHTML=state.reference===null?'':`${t('Viewing family on {date}',{date:date(state.now)})} · ${date(state.now,'h')} ${button('back-today','Back to today')}`;
  $('#back-today')?.addEventListener('click',()=>{state.reference=null;render()});
  $('.date-item .eyebrow').textContent=t(state.reference===null?'TODAY, IN TWO CALENDARS':'REFERENCE DATE, IN TWO CALENDARS');
 const hash=state.people.length?encode(state.people):'';
  $('#backup-reminder').hidden=!hash||state.demo||state.viewOnly||device.value.keptHash===hash||device.value.dismissedHash===hash;
  $('#backup-reminder').innerHTML=`<span>${t('Saved on this device. Keep a fresh family link or backup after changes.')}</span>${button('keep-copy','Keep a copy')}${button('dismiss-reminder','Dismiss')}`;
  $('#keep-copy').onclick=()=>$('#share-button').click();$('#dismiss-reminder').onclick=()=>{device.value.dismissedHash=hash;device.save();$('#backup-reminder').hidden=true};
  renderTimeline();
 }
 return {visible,refresh,device,persist,markKept(rows){if(rows.length===state.people.length&&encode(rows)===encode(state.people)){device.value.keptHash=encode(rows);device.save();refresh()}},setDocuments(fn){openDocuments=fn},showCard(event){openDocuments(event)}};
}
