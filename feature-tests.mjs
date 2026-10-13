import assert from 'node:assert/strict';
import './dist/vendor/pako.min.js';
import {calendars,MIN,MAX,encode,decode,today} from './dist/core.js';
import {referenceDay,ageAt,comparePeople,yearBounds,eventsBetween,filterPeople} from './dist/domain.js';
import {createDeviceStore} from './dist/device.js';
import {createFamilyStore} from './dist/family-store.js';
import {createCalendarDocument,createCardDocument,pageSize} from './dist/documents.js';
const p=(i,year=2000,m=1,d=1,name='Person '+i)=>({id:Buffer.from('p'+String(i).padStart(5,'0')).toString('base64url'),name,calendar:'g',day:calendars.g.toDay(year,m,d)});
const a=p(1,1990),b=p(2,2000),same=p(3,1990),feb=p(4,2000,2,29);
assert.equal(ageAt(b,a.day),null);assert.deepEqual(ageAt(a,b.day),{years:10,months:0,days:0});
assert.equal(comparePeople(a,b).atBirth.g.b,null);assert.equal(comparePeople(a,same).gapDays,0);assert.throws(()=>comparePeople(a,a));
assert.deepEqual(ageAt(feb,calendars.g.toDay(2023,2,28)),{years:23,months:0,days:0});
assert.ok(referenceDay('g',2030,1,1)>today());assert.throws(()=>referenceDay('g',2030,2,30));assert.throws(()=>referenceDay('g',9999,1,1));
for(const c of ['g','h']){const y=calendars[c].parts(today())[0],bounds=yearBounds(c,y);assert.equal(calendars[c].parts(bounds.start)[1],1);assert.equal(calendars[c].parts(bounds.end)[1],12);assert.ok(bounds.end-bounds.start>=353)}
const hash=encode([a,b]);
assert.equal(filterPeople([a,b],{groups:[{id:'group',members:[a.id]}],group:'group'}).length,1);
assert.equal(filterPeople([p(8,1990,1,1,'آمِنة')],{search:'آمنة',locale:'ar'}).length,1);
const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
const device=createDeviceStore('/kin/',storage);device.value.groups=[{id:'local',name:'Cousins',members:[a.id]}];device.save();
assert.equal(createDeviceStore('/kin/',storage).value.groups[0].name,'Cousins');
const tabOne=createDeviceStore('/kin/',storage),tabTwo=createDeviceStore('/kin/',storage);tabOne.value.groups.push({id:'second',name:'Friends',members:[]});tabOne.save();tabTwo.value.preferences.layout='table';tabTwo.save();assert.equal(tabTwo.value.groups.length,2,'Preference saves do not overwrite groups added in another tab');assert.equal(encode([a,b]),hash);assert.deepEqual(decode(hash),[a,b]);
const blocked=createDeviceStore('/blocked/',{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});blocked.value.groups.push({id:'temp',name:'Temporary',members:[]});assert.equal(blocked.save(),false);assert.equal(blocked.value.groups.length,1);
const store=createFamilyStore('family',()=>storage);assert.deepEqual(store.load(),[]);assert.equal((await store.serialize(()=>store.write([a]))).persisted,true);storage.setItem('family',encode([b]));assert.equal(store.write([a,b]).conflict,true);
const dense=Array.from({length:150},(_,i)=>p(i,1990,1,1,'آمنة عبد الرحمن '+i+' — Long family name for print testing'));
for(const layoutCalendar of ['g','h'])for(const locale of ['ar','en'])for(const layout of ['annual','monthly'])for(const size of ['A4','A3'])for(const orientation of ['landscape','portrait']){
 const year=calendars[layoutCalendar].parts(today())[0],model=createCalendarDocument(dense,{year,layoutCalendar,birthdayCalendar:'both',locale,layout,size,orientation});
 const eventKey=e=>e.person.id+'-'+e.calendar+'-'+e.day;
 assert.deepEqual(model.pages.flatMap(p=>p.events).map(eventKey).sort(),model.events.map(eventKey).sort(),'Every event is preserved exactly once');
 for(const page of model.pages){assert.deepEqual([page.width,page.height],pageSize(size,orientation));for(const op of page.ops)if(op.type==='text'){assert.ok(op.y>0&&op.y<page.height);assert.ok(!op.text.includes('NaN'))}}
 assert.ok(model.pages.length>1,'Dense families have continuation pages');
}
const events=eventsBetween([a],yearBounds('g',2026).start,yearBounds('g',2026).end,'g');
const card=createCardDocument(events[0]);assert.equal(card.pages[0].height,540);assert.ok(!card.pages[0].ops.some(op=>op.text?.includes('Turning')));
assert.equal(createCardDocument(events[0],{shape:'portrait',showAges:true}).pages[0].height,675);
const edge={...a,day:calendars.h.toDay(1400,12,1)};assert.ok(ageAt(edge,MAX,'h').years>=0);
assert.throws(()=>yearBounds('h',1601));assert.throws(()=>eventsBetween([a],MIN-1,MAX,'g'));
console.log('PASS: shared age/reference/year services, groups/storage isolation, save conflicts, 32 dense print layouts without data loss, card privacy and supported bounds.');
