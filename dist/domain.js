import {age,calendars,MIN,MAX,validate,today} from './core.js';
export function referenceDay(calendar,y,m,d){
 const cal=calendars[calendar];
 if(!cal||![y,m,d].every(Number.isSafeInteger)||m<1||m>12||d<1||d>cal.days(y,m))throw Error('Invalid reference date.');
 const day=cal.toDay(y,m,d);
 if(!Number.isSafeInteger(day)||day<MIN||day>MAX)throw Error('Invalid reference date.');
 return day;
}
export function ageAt(person,day,calendar='g'){
 if(!Number.isInteger(day)||day<MIN||day>MAX||!calendars[calendar])throw Error('Invalid reference date.');
 return day<person.day?null:age(person.day,day,calendar);
}
export function comparePeople(a,b){
 if(a.id===b.id)throw Error('Choose two different people.');
 return {older:a.day<=b.day?a:b,younger:a.day<=b.day?b:a,
  gapDays:Math.abs(a.day-b.day),atBirth:Object.fromEntries(['g','h'].map(c=>[c,{a:ageAt(a,b.day,c),b:ageAt(b,a.day,c)}]))};
}
export function yearBounds(calendar,year){
 if(!calendars[calendar]||!Number.isInteger(year))throw Error('Invalid reference date.');
 const start=referenceDay(calendar,year,1,1),end=referenceDay(calendar,year,12,calendars[calendar].days(year,12));
 return {start,end};
}
export function eventsBetween(records,start,end,calendar='both'){
 validate(records);
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<MIN||end>MAX||start>end||!['g','h','both'].includes(calendar))throw Error('Invalid birthday range.');
 const events=[];
 for(const person of records)for(const c of calendar==='both'?['g','h']:[calendar]){
  const cal=calendars[c],[birthYear,month,day]=cal.parts(person.day),[first]=cal.parts(start),[last]=cal.parts(end);
  for(let year=first;year<=last;year++){
   const eventDay=cal.toDay(year,month,Math.min(day,cal.days(year,month)));
   if(eventDay>=start&&eventDay<=end&&eventDay>=person.day)events.push({person,calendar:c,day:eventDay,inDays:eventDay-start,turns:year-birthYear});
  }
 }
 return events.sort((a,b)=>a.day-b.day||a.person.name.localeCompare(b.person.name,'en')||a.calendar.localeCompare(b.calendar));
}
export function nextEvent(person,day,calendar){
 return eventsBetween([person],day,Math.min(MAX,day+366),calendar)[0]||null;
}
export const MILESTONES=[1,10,18,21,30,40,50,60,70,80,90,100];
export function filterPeople(records,{search='',group='',groups=[],month='',calendar='g',locale='en'}={}){
 const normalized=s=>s.normalize('NFKD').replace(/\p{M}|ـ/gu,'').toLocaleLowerCase(locale);
 const members=group?groups.find(g=>g.id===group)?.members||[]:null;
 return records.filter(p=>(!members||members.includes(p.id))&&normalized(p.name).includes(normalized(search))&&(!month||calendars[calendar].parts(p.day)[1]===+month));
}
export function safeToday(){return Math.max(MIN,Math.min(MAX,today()))}
