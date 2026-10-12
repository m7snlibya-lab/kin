import assert from 'node:assert/strict';
import './dist/vendor/pako.min.js';
const {calendars,inputDay,age,nextBirthday,formatDate,weekday,encode,decode,mergePlan,merge,MIN,MAX,id,today}=await import('./dist/core.js');
const g=(y,m,d)=>calendars.g.toDay(y,m,d);
assert.equal(weekday(g(2000,1,1)),'Saturday');
assert.equal(formatDate(g(2024,3,11),'h'),'1 Ramadan 1445 AH');
assert.deepEqual(age(g(2000,2,29),g(2023,2,28),'g'),{years:23,months:0,days:0});
assert.equal(nextBirthday(g(2000,2,29),g(2023,2,28),'g').inDays,0);
assert.equal(nextBirthday(g(2000,2,29),g(2023,3,1),'g').day,g(2024,2,29));
assert.deepEqual(age(g(2023,1,31),g(2023,3,1),'g'),{years:0,months:1,days:1});
assert.deepEqual(age(g(2024,3,11),g(2024,3,11),'h'),{years:0,months:0,days:0});
assert.throws(()=>inputDay('g',2023,2,29));assert.throws(()=>inputDay('g',2030,1,1));
const intl=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'});
let checks=0;for(let n=MIN;n<=MAX;n++){const parts=calendars.h.parts(n);assert.equal(calendars.h.toDay(...parts),n);const expected=Object.fromEntries(intl.formatToParts(new Date(n*86400000)).map(x=>[x.type,x.value]));assert.deepEqual(parts,[+expected.year,+expected.month,+expected.day]);checks++}
for(let year=1318;year<1600;year++){for(let m=1;m<=12;m++){if(calendars.h.days(year,m)===30&&calendars.h.days(year+1,m)===29){const born=calendars.h.toDay(year,m,30),ann=calendars.h.toDay(year+1,m,29);assert.equal(nextBirthday(born,ann,'h').inDays,0);assert.deepEqual(age(born,ann,'h'),{years:1,months:0,days:0})}}}
const rows=Array.from({length:150},(_,i)=>({id:id(),name:i%2?'عائشة '+i:'Élodie 🌸 '+i,day:g(1900+i%120,1+i%12,1+i%28),calendar:i%2?'h':'g'}));
for(const n of [0,1,2,5,20,150])assert.deepEqual(decode(encode(rows.slice(0,n))),rows.slice(0,n));
const one=encode(rows.slice(0,1));assert.throws(()=>decode(one.slice(0,-3)));assert.throws(()=>decode('#k9rAAA'));assert.throws(()=>decode(encode(rows).slice(0,-12)+'badcorrupted'));assert.throws(()=>encode([...rows,rows[0]]));
const same={...rows[0]},changed={...same,name:'Updated'},other={...rows[1]},dup={...same,id:id()};const plan=mergePlan([same],[changed,other,dup]);assert.equal(plan.conflicts.length,1);assert.equal(plan.duplicates.length,1);assert.deepEqual(merge([same],plan),[same,other]);assert.deepEqual(merge([same],plan,[same.id]),[changed,other]);
for(let birth=MIN;birth<today();birth+=157){for(const c of ['g','h']){const a=age(birth,today(),c),b=nextBirthday(birth,today(),c);assert.ok(a.years>=0&&a.months>=0&&a.months<=11&&a.days>=0&&a.days<=31);assert.ok(b.inDays>=0&&b.inDays<=(c==='g'?366:355))}}
const {default:QR}=await import('./dist/vendor/qr.js');const qr=new QR(-1,1);qr.addData('https://kin.example/'+encode(rows.slice(0,5)));qr.make();assert.ok(qr.getModuleCount()>20);
console.log(JSON.stringify({passed:true,hijriDatesChecked:checks,tests:'calendar round trips, ICU parity, leap dates, ages, birthdays, Unicode links, corruption, merge conflicts, QR generation',payloadCharacters:{one:one.length,five:encode(rows.slice(0,5)).length,twenty:encode(rows.slice(0,20)).length,max150:encode(rows).length}},null,2));
for(const year of [0,26,99,1899])assert.throws(()=>inputDay('g',year,1,1));
const independentTwin={...rows[0],id:id()};assert.equal(mergePlan([],[rows[0],independentTwin]).added.length,1);
const bomb=globalThis.pako.deflate(new Uint8Array(100000));const bombHash='#k1z'+Buffer.from(bomb).toString('base64url');assert.throws(()=>decode(bombHash),/safe size limit/);
console.log('PASS: Gregorian short-year rejection, within-import duplicate detection, decompression size limit.');

const selectiveBase=[rows[0]],calendarEdit={...rows[0],calendar:rows[0].calendar==='g'?'h':'g'};
const selectivePlan=mergePlan(selectiveBase,[calendarEdit,rows[1],rows[2]]);
assert.equal(selectivePlan.conflicts.length,1,'Input-calendar-only edits must be reviewed');
assert.deepEqual(merge(selectiveBase,selectivePlan,[],[]),selectiveBase,'Deselecting all imports preserves the saved circle');
assert.deepEqual(merge(selectiveBase,selectivePlan,[rows[0].id],[rows[2].id]),[calendarEdit,rows[2]],'New people and conflict choices are independent');
assert.deepEqual(merge(selectiveBase,selectivePlan),[rows[0],rows[1],rows[2]],'Default conflicts preserve local records');
assert.deepEqual(selectiveBase,[rows[0]],'Review must not mutate saved records');
const fullPlan=mergePlan(rows,[{...rows[0],id:id(),name:'Additional person'}]);
assert.equal(merge(rows,fullPlan,[],[]).length,150,'A full circle can decline extra people');
assert.throws(()=>merge(rows,fullPlan),/150/);
console.log('PASS: selective imports, independent calendar conflicts, no mutation, and selection at the family size limit.');

for(const year of [1e9,Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>inputDay('g',year,1,1),'Out-of-range years must never return NaN');
assert.throws(()=>encode([{...rows[0],name:'Broken \ud800 name'}]),/invalid/,'Reject names that would silently change during UTF-8 encoding');
console.log('PASS: finite date bounds and lossless Unicode validation.');
