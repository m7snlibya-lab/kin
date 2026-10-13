import {calendars,today,validate,MAX,MIN} from './core.js';
import {eventsBetween} from './domain.js';
// Include today and the next days-1 dates. Enumerate calendar years rather than
// adding 365 days: two Hijri birthdays can occur within one Gregorian year.
export function listBirthdays(records,{from=today(),days=90,calendar='both'}={}){
 if(!Number.isInteger(days)||days<1||days>366)throw Error('Invalid birthday range.');
 return eventsBetween(records,from,Math.min(from+days-1,MAX),calendar);
}
const text=value=>String(value).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'');
const dateCode=day=>new Date(day*86400000).toISOString().slice(0,10).replaceAll('-','');
const utf8=new TextEncoder();
export function foldLine(line){let result='',width=0;for(const char of line){const size=utf8.encode(char).length;if(width+size>75){result+='\r\n ';width=1}result+=char;width+=size}return result}
export function createCalendar(events,{stamp=new Date(),recurringGregorian=true,summary=e=>`${e.person.name} — ${calendars[e.calendar].label} birthday`,description=(e,{recurring})=>recurring?'Yearly birthday exported from Kin. Changes in Kin do not sync.':`Turns ${e.turns}. A one-time birthday exported from Kin.`}={}){
 const timestamp=stamp.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kin//Family birthdays//EN','CALSCALE:GREGORIAN'];
 const series=new Set();
 for(const e of [...events].sort((a,b)=>a.day-b.day)){if(!Number.isInteger(e.day)||e.day<MIN||e.day>MAX||!['g','h'].includes(e.calendar)||!/^[\w-]{8}$/.test(e.person.id))throw Error('Invalid birthday event.');const recurring=recurringGregorian&&e.calendar==='g';let rule;const uid=recurring?`${e.person.id}-g-yearly-${e.person.day}`:`${e.person.id}-${e.calendar}-${e.day}`;if(recurring){validate([e.person]);if(series.has(uid))continue;series.add(uid);const [,month,day]=calendars.g.parts(e.person.day);rule=`RRULE:FREQ=YEARLY;BYMONTH=${month};BYMONTHDAY=${month===2&&day===29?-1:day}`}lines.push('BEGIN:VEVENT',`UID:${uid}@kin-birthdays`,`DTSTAMP:${timestamp}`,`DTSTART;VALUE=DATE:${dateCode(e.day)}`,`DTEND;VALUE=DATE:${dateCode(e.day+1)}`,...(rule?[rule]:[]),`SUMMARY:${text(summary(e,{recurring}))}`,`DESCRIPTION:${text(description(e,{recurring}))}`,'TRANSP:TRANSPARENT','CLASS:PRIVATE','END:VEVENT')}
 lines.push('END:VCALENDAR');return lines.map(foldLine).join('\r\n')+'\r\n';
}
