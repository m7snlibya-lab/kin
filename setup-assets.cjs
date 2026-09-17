const fs=require('fs'),path=require('path');
const base='/opt/codex/runtimes/codex-primary-runtime/dependencies/node';
fs.mkdirSync('dist/vendor',{recursive:true});
fs.copyFileSync(base+'/node_modules/pako/dist/pako.min.js','dist/vendor/pako.min.js');
fs.copyFileSync(base+'/node_modules/pako/LICENSE','dist/vendor/pako-LICENSE.txt');
const qr=base+'/lib/node_modules/npm/node_modules/qrcode-terminal/vendor/QRCode';
const mods=fs.readdirSync(qr).filter(x=>x.endsWith('.js')).map(x=>JSON.stringify('./'+x.slice(0,-3))+':function(module,exports,require){\n'+fs.readFileSync(path.join(qr,x),'utf8')+'\n}');
fs.writeFileSync('dist/vendor/qr.js','// Bundled QRCode by Kazuhiko Arase; MIT license in source.\nconst modules={'+mods.join(',')+'}; const cache={}; function require(id){if(!cache[id]){const m={exports:{}};cache[id]=m;modules[id](m,m.exports,require)}return cache[id].exports} export default require("./index");');
// Freeze the platform ICU Umm al-Qura month table for identical cross-device results.
const fmt=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'});
const starts=[];for(let d=Math.floor(Date.UTC(1882,0,1)/86400000);d<Math.floor(Date.UTC(2175,0,1)/86400000);d++){const p=Object.fromEntries(fmt.formatToParts(new Date(d*86400000)).map(x=>[x.type,x.value]));if(+p.year>=1300&&+p.year<=1601&&+p.day===1)starts.push([+p.year,+p.month,d]);}
const chosen=starts.filter(x=>x[0]<=1600);if(chosen.length!==3612)throw Error('Invalid calendar table');
const bits=new Uint8Array(Math.ceil(chosen.length/8));chosen.forEach((x,i)=>{const len=starts[i+1][2]-x[2];if(len!==29&&len!==30)throw Error('Invalid month');if(len===30)bits[i>>3]|=1<<(i%8)});
fs.writeFileSync('dist/hijri-data.js',`// Umm al-Qura, AH 1300–1600. Frozen from Node ICU ${process.versions.icu}.\nexport const hijriData={start:${chosen[0][2]},year:1300,count:3612,bits:'${Buffer.from(bits).toString('base64')}'};\n`);
