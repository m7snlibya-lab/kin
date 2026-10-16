import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import './dist/vendor/pako.min.js';
import {decode,encode,calendars} from './dist/core.js';
import {createDeviceStore} from './dist/device.js';
import {securityFindings} from './scripts/check-security-sarif.mjs';

const person={id:'cDAwMDAx',name:'<img src=x onerror=alert(1)>',calendar:'g',day:calendars.g.toDay(2000,1,1)};
assert.deepEqual(decode(encode([person])),[person],'Names remain literal data, not stripped or interpreted');
const compressed=bytes=>'#k1z'+Buffer.from(bytes).toString('base64url');
const raw=Buffer.from(encode([]).slice(4),'base64url');
assert.deepEqual(decode(compressed(pako.deflate(raw))),[]);
assert.throws(()=>decode(compressed(gzipSync(raw))),'Only the documented zlib wrapper is accepted');
assert.throws(()=>decode(compressed(Buffer.concat([pako.deflate(raw),Buffer.from([1,2,3])]))),'Reject ignored compressed trailing bytes');
assert.throws(()=>decode(compressed(pako.deflate(new Uint8Array(1_000_000)))),/safe size/,'Stop expanding a compression bomb');
for(const value of [null,{},[],42,'#k1z'+'a'.repeat(30000)])assert.throws(()=>decode(value));

let data=null;
const storage={getItem(){return data},setItem(key,value){data=value}};
data='{"version":1,"groups":[{"id":"valid","name":"Family","members":["cDAwMDAx","bad",{},"cDAwMDAx"]},{"id":"broken","name":{},"members":null},{"id":"valid","name":"Duplicate","members":[]}],"preferences":{"__proto__":{"polluted":true},"constructor":{},"layout":"list","export":{"__proto__":{"polluted":true},"layout":"monthly","ink":true}},"keptHash":{}}';
const device=createDeviceStore('/kin/',storage),prefs=device.value.preferences;
assert.deepEqual(device.value.groups,[{id:'valid',name:'Family',members:[person.id]}]);
assert.equal(Object.getPrototypeOf(prefs),Object.prototype);assert.equal(Object.hasOwn(prefs,'__proto__'),false);
assert.deepEqual(prefs.export,{layout:'monthly',ink:true});assert.equal(device.value.keptHash,'');
// The save path must apply exactly the same validation as the initial read.
data=JSON.stringify({version:1,groups:[{id:'broken',name:12,members:null}],preferences:JSON.parse('{"__proto__":{"polluted":true},"view":"tools","export":{"constructor":{},"ink":false}}')});
prefs.layout='table';assert.equal(device.save(),true);assert.equal(device.value.preferences,prefs,'Do not detach live preference consumers');
assert.deepEqual(device.value.groups,[]);assert.equal(prefs.view,'tools');assert.equal(prefs.layout,'table');assert.equal({}.polluted,undefined);
assert.equal(Object.hasOwn(prefs,'__proto__'),false);assert.deepEqual(prefs.export,{ink:false});
for(const invalid of ['{bad json','x'.repeat(262145),JSON.stringify({version:999,groups:[]})]){
 data=invalid;const recovered=createDeviceStore('/kin/',storage);assert.equal(recovered.value.groups.length,0);recovered.value.preferences.layout='list';assert.equal(recovered.save(),true);assert.equal(JSON.parse(data).preferences.layout,'list');
}
data=JSON.stringify({version:1,groups:Array.from({length:110},(_,i)=>({id:'g'+i,name:'Group',members:[]}))});
assert.equal(createDeviceStore('/kin/',storage).value.groups.length,100);

const html=await readFile('dist/index.html','utf8');
const policy=html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
for(const directive of ["script-src 'self'","object-src 'none'","base-uri 'none'","form-action 'none'","frame-src 'none'"])assert.ok(policy.includes(directive));
assert.ok(!/unsafe-inline|unsafe-eval|https?:|\*/.test(policy));
assert.match(html,/type="module" src="\.\/bootstrap.js"/);
const workflow=await readFile('.github/workflows/pages.yml','utf8');
for(const [,action,ref]of workflow.matchAll(/uses:\s*([^@\s]+)@([^\s]+)/g))assert.match(ref,/^[a-f0-9]{40}$/,`Pin ${action} to an immutable commit`);
assert.match(workflow,/persist-credentials: false/);assert.match(workflow,/npm ci --ignore-scripts/);assert.match(workflow,/npm audit --audit-level=low/);
assert.doesNotMatch(workflow,/pull_request_target|write-all/);
const scan={runs:[{tool:{driver:{rules:[{id:'security-rule',properties:{'security-severity':'4.3'}},{id:'tagged-rule',properties:{tags:['security']}},{id:'quality-rule',properties:{}}]}},results:[{ruleId:'security-rule'},{ruleId:'tagged-rule'},{ruleId:'security-rule',kind:'pass'},{ruleId:'quality-rule'}]}]};
assert.equal(securityFindings(scan).length,2);assert.throws(()=>securityFindings({}));
assert.match(workflow,/needs: \[verify, security\]/);
console.log('PASS: bounded zlib-only imports, compression bombs, trailing-byte rejection, prototype-key defenses, cross-tab settings validation, malformed storage recovery, CSP and immutable deployment actions.');
