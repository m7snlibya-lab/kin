import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseAst} from 'rolldown/parseAst';
import './dist/vendor/pako.min.js';
const i=await import('./dist/i18n.js');const core=await import('./dist/core.js');const {helpSections}=await import('./dist/help.js');
const records=[{id:'YXJhYmlj',name:'آمنة Al-Sayed',day:core.calendars.g.toDay(2000,1,1),calendar:'h'}];
i.setLanguage('en');const link=core.encode(records);assert.equal(i.date(records[0].day),'1 January 2000');
i.setLanguage('ar');assert.equal(i.date(records[0].day),'١ يناير ٢٠٠٠');assert.equal(i.date(core.calendars.g.toDay(2024,3,11),'h'),'١ رمضان ١٤٤٥ هـ');assert.equal(i.weekday(records[0].day),'السبت');assert.equal(i.parseDigits('١٤٤٥'),1445);assert.equal(i.parseDigits('۱۴۴۵'),1445);assert.equal(i.parseDigits(' 2024 '),2024);assert.ok(Number.isNaN(i.parseDigits('')));assert.ok(Number.isNaN(i.parseDigits('12x')));assert.ok(Number.isNaN(i.parseDigits('1e3')));
assert.equal(i.quantity(1,'day'),'يوم واحد');assert.equal(i.quantity(2,'day'),'يومان');assert.equal(i.quantity(3,'day'),'٣ أيام');assert.equal(i.quantity(11,'day'),'١١ يومًا');assert.equal(i.quantity(100,'day'),'١٠٠ يوم');
assert.equal(core.encode(records),link);assert.deepEqual(core.decode(link),records);i.setLanguage('en');assert.equal(core.encode(records),link);assert.equal(i.quantity(1,'month'),'1 month');assert.equal(i.quantity(2,'month'),'2 months');
const keys=[...helpSections.map(x=>x[1])];
function walk(node){
 if(!node||typeof node!=='object')return;
 if(node.type==='CallExpression'&&node.callee.type==='Identifier'){
  const name=node.callee.name,index=name==='button'||name==='select'?1:0;
  if(['t','tr','modal','notice','toast','button','select'].includes(name)){
   const value=node.arguments[index]?.value;if(typeof value==='string')keys.push(value);
  }
 }
 for(const value of Object.values(node))if(value&&typeof value==='object'){if(Array.isArray(value))value.forEach(walk);else walk(value)}
}
for(const file of fs.readdirSync('dist').filter(f=>f.endsWith('.js')&&!['hijri-data.js','features-i18n.js'].includes(f)))walk(parseAst(fs.readFileSync('dist/'+file,'utf8'),{sourceType:'module'}));
for(const [,key] of fs.readFileSync('dist/index.html','utf8').matchAll(/data-i18n="([^"]+)"/g))keys.push(key);
for(const key of keys)assert.ok(i.messages[key],`Missing Arabic translation: ${key}`);
for(const [key,translation] of Object.entries(i.messages)){const placeholders=s=>[...s.matchAll(/\{(\w+)\}/g)].map(x=>x[1]).sort();assert.deepEqual(placeholders(translation),placeholders(key),`Interpolation mismatch: ${key}`)}
const cached=[...fs.readFileSync('dist/sw.js','utf8').matchAll(/'\.\/([^']*)'/g)].map(x=>x[1]);for(const asset of ['i18n.js','help.js','app.js','core.js','backup.js','birthdays.js'])assert.ok(cached.includes(asset),asset);for(const asset of cached)if(asset)assert.ok(fs.existsSync('dist/'+asset),asset);
console.log('PASS: Arabic/English dates, weekdays, plurals, Arabic/Persian/Western input, translation coverage, unchanged links and offline asset coverage.');
