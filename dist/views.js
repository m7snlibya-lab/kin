import {ageAt,nextEvent} from './domain.js';
import {date,quantity,t,calendarName,number,weekday} from './i18n.js';
import {esc} from './ui.js';
import {icon} from './icons.js';
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
 return `<article class="person-card"><div class="person-top"><div class="avatar tone-${Array.from(p.id).reduce((n,c)=>n+c.codePointAt(0),0)%4}" aria-hidden="true">${esc(p.name.trim().split(/\s+/).slice(0,2).map(n=>Array.from(n)[0]).join('').toLocaleUpperCase())}</div><div class="person-title"><h3 dir="auto">${esc(p.name)}</h3><p class="birth-weekday">${t('Born on a {day}',{day:weekday(p.day)})}</p></div><button class="icon-button edit-button has-icon" data-edit="${p.id}" aria-label="${esc(t('Edit {name}',{name:p.name}))}">${icon('edit')}<span>${t('Edit')}</span></button></div>
 <div class="age-grid dual-ages">${metrics.map(({c,a})=>`<section class="calendar-age age-${c}" aria-label="${t('Age in {calendar}',{calendar:calendarName(c)})}"><h4 class="calendar-label">${icon(c==='g'?'sun':'moon')}<span>${calendarName(c)}</span></h4><div class="age-num">${ageDisplay(a)}</div>${a?`<p class="age-rest"><span>${quantity(a.months,'month')}</span><span aria-hidden="true"> · </span><span>${quantity(a.days,'day')}</span></p>`:''}<p class="birth-date"><span>${t('Born')}</span>${date(p.day,c)}</p></section>`).join('')}</div>
 <section class="birthday-preview" aria-label="${t('Next birthdays')}"><h4>${t('Next birthdays')}</h4>${metrics.map(({c,next})=>`<div class="birthday-row ${next?.day===state.now?'today':''}"><div><span class="birthday-type">${calendarName(c)}</span><span class="birthday-date">${next?date(next.day,c):t('No birthday in the supported range')}</span></div>${next?`<strong>${next.day===state.now?t('Birthday today!'):t('{days} to go',{days:quantity(next.day-state.now,'day')})}</strong>`:''}</div>`).join('')}</section>
 ${born?`<p class="person-lifetime"><span>${t('Days lived')}</span><strong>${number(state.now-p.day)}</strong></p>`:''}</article>`;
}
export function peopleTable(records,state){
 return `<p id="table-scroll-hint" class="table-scroll-hint" hidden>${t('Scroll sideways to see the full table. Names stay on one line.')}</p><div class="table-scroll" tabindex="0" role="region" aria-label="${t('Family table')}" aria-describedby="table-scroll-hint"><table class="family-table"><caption class="sr-only">${t('Your people')}</caption><thead><tr>${['Name','Birth date','Gregorian','Hijri','Next birthday','Edit'].map(k=>`<th scope="col">${k==='Gregorian'?icon('sun'):k==='Hijri'?icon('moon'):''}${t(k)}</th>`).join('')}</tr></thead><tbody>${records.map(p=>{
 const next=nextEvent(p,Math.max(state.now,p.day),state.primaryCalendar);
 return `<tr><th scope="row"><bdi class="table-name">${esc(p.name)}</bdi>${state.now>=p.day?`<span class="table-fact">${t('Days lived')} · ${number(state.now-p.day)}</span>`:''}</th><td><span class="table-date">${date(p.day)}</span><span class="table-date">${date(p.day,'h')}</span><span class="table-fact">${t('Born on a {day}',{day:weekday(p.day)})}</span></td><td>${ageText(ageAt(p,state.now,'g'))}</td><td>${ageText(ageAt(p,state.now,'h'))}</td><td>${next?date(next.day):'—'}</td><td><button class="quiet has-icon" data-edit="${p.id}" aria-label="${esc(t('Edit {name}',{name:p.name}))}">${icon('edit')}<span>${t('Edit')}</span></button></td></tr>`;
 }).join('')}</tbody></table></div>`;
}
