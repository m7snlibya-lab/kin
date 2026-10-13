import {ageAt,nextEvent} from './domain.js';
import {date,quantity,t,calendarName,number,weekday} from './i18n.js';
import {esc} from './ui.js';
const ageText=a=>a?[quantity(a.years,'year'),quantity(a.months,'month'),quantity(a.days,'day')].join(' · '):t('Not born yet');
export {ageText};
export function personCard(p,state){
 const c=state.primaryCalendar,a=ageAt(p,state.now,c),next=nextEvent(p,Math.max(state.now,p.day),c);
 return `<article class="person-card"><div class="person-top"><div class="avatar">${esc(p.name.trim().slice(0,1))}</div><div class="person-title"><h3 dir="auto">${esc(p.name)}</h3><p>${t('Born on a {day}',{day:weekday(p.day)})}</p></div><button class="icon-button edit-button" data-edit="${p.id}" aria-label="${esc(t('Edit {name}',{name:p.name}))}">${t('Edit')}</button></div><div class="primary-age"><span class="calendar-label">${calendarName(c)}</span><strong>${a?quantity(a.years,'year'):t('Not born yet')}</strong>${a?`<span>${quantity(a.months,'month')} · ${quantity(a.days,'day')}</span>`:''}</div><p class="next-birthday">${next?t('Turns {age} on {date}',{age:quantity(next.turns,'year'),date:date(next.day,c)}):t('No birthday in the supported range')}</p><details class="person-details"><summary>${t('Both calendars and details')}</summary><div class="age-grid">${['g','h'].map(c=>`<div><div class="calendar-label">${calendarName(c)}</div><p>${ageText(ageAt(p,state.now,c))}</p><div class="birth-date">${date(p.day,c)}</div></div>`).join('')}</div>${a?`<p class="lived">${t('Days lived')} <strong>${number(state.now-p.day)}</strong></p>`:''}</details></article>`;
}
export function peopleTable(records,state){
 return `<div class="table-scroll"><table class="family-table"><caption class="sr-only">${t('Your people')}</caption><thead><tr>${['Name','Birth date','Gregorian','Hijri','Next birthday','Edit'].map(k=>`<th scope="col">${t(k)}</th>`).join('')}</tr></thead><tbody>${records.map(p=>{
 const next=nextEvent(p,Math.max(state.now,p.day),state.primaryCalendar);
 return `<tr><th scope="row" dir="auto">${esc(p.name)}</th><td>${date(p.day)}<br>${date(p.day,'h')}</td><td>${ageText(ageAt(p,state.now,'g'))}</td><td>${ageText(ageAt(p,state.now,'h'))}</td><td>${next?date(next.day):'—'}</td><td><button class="quiet" data-edit="${p.id}" aria-label="${esc(t('Edit {name}',{name:p.name}))}">${t('Edit')}</button></td></tr>`;
 }).join('')}</tbody></table></div>`;
}
