import {ageAt,nextEvent,groupBirthMonths} from './domain.js';
import {date,quantity,t,calendarName,number,weekday,months,language} from './i18n.js';
import {esc} from './ui.js';
import {icon} from './icons.js';
const ageText=a=>a?[quantity(a.years,'year'),quantity(a.months,'month'),quantity(a.days,'day')].join(' · '):t('Not born yet');
export {ageText};

export function birthdayMonths(records,state){
 const calendar=state.birthdayMonthCalendar,order=[calendar,calendar==='g'?'h':'g'];
 return groupBirthMonths(records,calendar,language()).map(({month,people})=>`
  <section class="birth-month" aria-labelledby="birth-month-${calendar}-${month}">
   <h3 id="birth-month-${calendar}-${month}" class="birth-month-heading">${icon(calendar==='g'?'sun':'moon')}<span>${months(calendar)[month-1]}</span><span class="birth-month-count"><span class="sr-only">${t('People')}: </span>${number(people.length)}</span></h3>
   <div class="birth-month-people">${people.map(({person,day})=>`
    <article class="birth-month-person"><button type="button" class="birth-month-open" data-person="${person.id}" aria-labelledby="month-name-${person.id}" aria-describedby="month-facts-${person.id}">
     <span class="birth-month-day" aria-hidden="true">${number(day)}</span>
     <span class="birth-month-details"><span id="month-name-${person.id}" class="birth-month-name"><bdi>${esc(person.name)}</bdi><span class="sr-only"> · ${t('Person details')}</span>${icon('next')}</span>
      <span id="month-facts-${person.id}" class="birth-month-facts">
       <span class="birth-month-dates">${order.map(c=>`<span class="birth-month-date age-${c}" data-birth-date="${c}">${icon(c==='g'?'sun':'moon')}<span><span class="sr-only">${t('Born')} · ${calendarName(c)} · </span><bdi>${date(person.day,c)}</bdi></span></span>`).join('')}</span>
       <span class="birth-month-age-label">${t(state.reference===null?'Age today':'Age on this date')}</span>
       <span class="birth-month-ages">${order.map(c=>`<span class="age-${c}" data-birth-age="${c}">${icon(c==='g'?'sun':'moon')}<span><span class="sr-only">${calendarName(c)} · </span>${ageText(ageAt(person,state.now,c))}</span></span>`).join('')}</span>
      </span>
     </span>
    </button></article>`).join('')}</div>
  </section>`).join('');
}

export function personRow(p,state){
 const next=['g','h'].map(c=>({c,event:nextEvent(p,Math.max(state.now,p.day),c)})).filter(x=>x.event).sort((a,b)=>a.event.day-b.event.day)[0];
 return `<article class="person-row"><button class="person-open" data-person="${p.id}" aria-label="${esc(t('Details for {name}',{name:p.name}))}"><h3 dir="auto">${esc(p.name)}</h3><div class="row-ages">${['g','h'].map(c=>`<span class="row-age age-${c}">${icon(c==='g'?'sun':'moon')}<span><span class="sr-only">${calendarName(c)} · </span>${ageText(ageAt(p,state.now,c))}</span></span>`).join('')}</div><p class="row-next">${next?`${icon(next.c==='g'?'sun':'moon')}<span>${t('Next birthday')} · ${date(next.event.day,next.c)} · ${next.event.day===state.now?t('Today!'):t('{days} away',{days:quantity(next.event.day-state.now,'day')})}</span>`:t('No birthday in the supported range')}</p><span class="row-detail">${t('Person details')}${icon('next')}</span></button></article>`;
}

function ageDisplay(a){
 if(!a)return t('Not born yet');
 const full=quantity(a.years,'year'),value=number(a.years);
 return full.startsWith(value)?`<span class="age-value">${value}</span> <span class="age-unit">${full.slice(value.length).trim()}</span>`:`<span class="age-word">${full}</span>`;
}
export function personCard(p,state){
 const metrics=['g','h'].map(c=>({c,a:ageAt(p,state.now,c),next:nextEvent(p,Math.max(state.now,p.day),c)}));
 const born=state.now>=p.day;
 const edit=state.demo||state.viewOnly?'':`<button class="icon-button edit-button has-icon" data-edit="${p.id}" aria-label="${esc(t('Edit {name}',{name:p.name}))}">${icon('edit')}<span>${t('Edit')}</span></button>`;
 return `<article class="person-card"><div class="person-top"><div class="avatar tone-${Array.from(p.id).reduce((n,c)=>n+c.codePointAt(0),0)%4}" aria-hidden="true">${esc(p.name.trim().split(/\s+/).slice(0,2).map(n=>Array.from(n)[0]).join('').toLocaleUpperCase())}</div><div class="person-title"><h3 dir="auto">${esc(p.name)}</h3><p class="birth-weekday">${t('Born on a {day}',{day:weekday(p.day)})}</p></div>${edit}</div>
 <div class="age-grid dual-ages">${metrics.map(({c,a})=>`<section class="calendar-age age-${c}" aria-label="${t('Age in {calendar}',{calendar:calendarName(c)})}"><h4 class="calendar-label">${icon(c==='g'?'sun':'moon')}<span>${calendarName(c)}</span></h4><div class="age-num">${ageDisplay(a)}</div>${a?`<p class="age-rest"><span>${quantity(a.months,'month')}</span><span aria-hidden="true"> · </span><span>${quantity(a.days,'day')}</span></p>`:''}<p class="birth-date"><span>${t('Born')}</span>${date(p.day,c)}</p></section>`).join('')}</div>
 <section class="birthday-preview" aria-label="${t('Next birthdays')}"><h4>${t('Next birthdays')}</h4>${metrics.map(({c,next})=>`<div class="birthday-row ${next?.day===state.now?'today':''}"><div><span class="birthday-type">${calendarName(c)}</span><span class="birthday-date">${next?date(next.day,c):t('No birthday in the supported range')}</span></div>${next?`<strong>${next.day===state.now?t('Birthday today!'):t('{days} to go',{days:quantity(next.day-state.now,'day')})}</strong>`:''}</div>`).join('')}</section>
 ${born?`<p class="person-lifetime"><span>${t('Days lived')}</span><strong>${number(state.now-p.day)}</strong></p>`:''}</article>`;
}
export function peopleTable(records,state){
 return `<p id="table-scroll-hint" class="table-scroll-hint" hidden>${t('Scroll sideways to see the full table. Names stay on one line.')}</p><div class="table-scroll" tabindex="0" role="region" aria-label="${t('Family table')}" aria-describedby="table-scroll-hint"><table class="family-table"><caption class="sr-only">${t('Your people')}</caption><thead><tr>${['Name','Birth date','Gregorian','Hijri','Next birthday',...(!state.demo&&!state.viewOnly?['Edit']:[])].map(k=>`<th scope="col">${k==='Gregorian'?icon('sun'):k==='Hijri'?icon('moon'):''}${t(k)}</th>`).join('')}</tr></thead><tbody>${records.map(p=>{
 const next=nextEvent(p,Math.max(state.now,p.day),state.primaryCalendar);
 return `<tr><th scope="row"><bdi class="table-name">${esc(p.name)}</bdi>${state.now>=p.day?`<span class="table-fact">${t('Days lived')} · ${number(state.now-p.day)}</span>`:''}</th><td>${['g','h'].map(c=>`<span class="table-date">${icon(c==='g'?'sun':'moon')}<span class="sr-only">${calendarName(c)} · </span><bdi>${date(p.day,c)}</bdi></span>`).join('')}<span class="table-fact">${t('Born on a {day}',{day:weekday(p.day)})}</span></td><td>${ageText(ageAt(p,state.now,'g'))}</td><td>${ageText(ageAt(p,state.now,'h'))}</td><td>${next?`<span class="table-date">${icon(state.primaryCalendar==='g'?'sun':'moon')}<span class="sr-only">${calendarName(state.primaryCalendar)} · </span><bdi>${date(next.day,state.primaryCalendar)}</bdi></span>`:'—'}</td>${!state.demo&&!state.viewOnly?`<td><button class="quiet has-icon" data-edit="${p.id}" aria-label="${esc(t('Edit {name}',{name:p.name}))}">${icon('edit')}<span>${t('Edit')}</span></button></td>`:''}</tr>`;
 }).join('')}</tbody></table></div>`;
}
