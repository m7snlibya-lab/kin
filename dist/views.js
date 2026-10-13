import {ageAt,nextEvent} from './domain.js';
import {date,quantity,t,calendarName,number,weekday} from './i18n.js';
import {esc} from './ui.js';
const ageText=a=>a?[quantity(a.years,'year'),quantity(a.months,'month'),quantity(a.days,'day')].join(' · '):t('Not born yet');
export {ageText};
function ageDisplay(a){
 if(!a)return t('Not born yet');
 const full=quantity(a.years,'year'),value=number(a.years);
 return full.startsWith(value)?`<span class="age-value">${value}</span> <span class="age-unit">${full.slice(value.length).trim()}</span>`:`<span class="age-word">${full}</span>`;
}
export function personCard(p,state){
 const metrics=['g','h'].map(c=>({c,a:ageAt(p,state.now,c),next:nextEvent(p,Math.max(state.now,p.day),c)}));
 const born=state.now>=p.day;
 return `<article class="person-card"><div class="person-top"><div class="avatar tone-${Array.from(p.id).reduce((n,c)=>n+c.codePointAt(0),0)%4}" aria-hidden="true">${esc(p.name.trim().split(/\s+/).slice(0,2).map(n=>Array.from(n)[0]).join('').toLocaleUpperCase())}</div><div class="person-title"><h3 dir="auto">${esc(p.name)}</h3></div><button class="icon-button edit-button" data-edit="${p.id}" aria-label="${esc(t('Edit {name}',{name:p.name}))}">${t('Edit')}</button></div>
 <div class="age-grid dual-ages">${metrics.map(({c,a})=>`<section class="calendar-age age-${c}" aria-label="${t('Age in {calendar}',{calendar:calendarName(c)})}"><h4 class="calendar-label">${calendarName(c)}</h4><div class="age-num">${ageDisplay(a)}</div>${a?`<p class="age-rest"><span>${quantity(a.months,'month')}</span><span aria-hidden="true"> · </span><span>${quantity(a.days,'day')}</span></p>`:''}<p class="birth-date"><span>${t('Born')}</span>${date(p.day,c)}</p></section>`).join('')}</div>
 <section class="birthday-preview" aria-label="${t('Next birthdays')}"><h4>${t('Next birthdays')}</h4>${metrics.map(({c,next})=>`<div class="birthday-row ${next?.day===state.now?'today':''}"><div><span class="birthday-type">${calendarName(c)}</span><span class="birthday-date">${next?date(next.day,c):t('No birthday in the supported range')}</span></div>${next?`<strong>${next.day===state.now?t('Birthday today!'):t('{days} to go',{days:quantity(next.day-state.now,'day')})}</strong>`:''}</div>`).join('')}</section>
 <details class="person-details"><summary>${t('More details')}</summary><p>${t('Born on a {day}',{day:weekday(p.day)})}</p>${born?`<p class="lived">${t('Days lived')} <strong>${number(state.now-p.day)}</strong></p>`:''}</details></article>`;
}
export function peopleTable(records,state){
 return `<div class="table-scroll"><table class="family-table"><caption class="sr-only">${t('Your people')}</caption><thead><tr>${['Name','Birth date','Gregorian','Hijri','Next birthday','Edit'].map(k=>`<th scope="col">${t(k)}</th>`).join('')}</tr></thead><tbody>${records.map(p=>{
 const next=nextEvent(p,Math.max(state.now,p.day),state.primaryCalendar);
 return `<tr><th scope="row" dir="auto">${esc(p.name)}</th><td>${date(p.day)}<br>${date(p.day,'h')}</td><td>${ageText(ageAt(p,state.now,'g'))}</td><td>${ageText(ageAt(p,state.now,'h'))}</td><td>${next?date(next.day):'—'}</td><td><button class="quiet" data-edit="${p.id}" aria-label="${esc(t('Edit {name}',{name:p.name}))}">${t('Edit')}</button></td></tr>`;
 }).join('')}</tbody></table></div>`;
}
