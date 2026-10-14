import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {resolve, relative, sep} from 'node:path';
import {spawnSync} from 'node:child_process';

const root=resolve('dist');
const read=path=>readFile(resolve(root,path),'utf8');
const sw=await read('sw.js');
const version=JSON.parse(await readFile('package.json','utf8')).version;
assert.equal(sw.match(/const VERSION='([^']+)'/)?.[1],version,'Bump the worker version alongside the package release');
const cached=new Set([...sw.matchAll(/'\.\/([^']*)'/g)].map(match=>match[1]));
async function check(path){
 for(const entry of await readdir(path,{withFileTypes:true})){
  const full=resolve(path,entry.name);
  if(entry.isDirectory()){await check(full);continue}
  const asset=relative(root,full).split(sep).join('/');
  if(/\.(?:html|css|js|png|svg|webmanifest|ttf|woff2)$/.test(asset)&&asset!=='sw.js')assert.ok(cached.has(asset),`Offline asset missing: ${asset}`);
  if(asset.endsWith('.js')){
   const syntax=spawnSync(process.execPath,['--check',full],{encoding:'utf8',windowsHide:true});
   assert.ifError(syntax.error);
   assert.equal(syntax.status,0,`Invalid JavaScript: ${asset}\n${syntax.stderr}`);
   const code=await read(asset);
   for(const match of code.matchAll(/(?:import|export)\s+(?:[^'"\n]*?\sfrom\s*)?['"](\.\.?\/[^'"]+)['"]/g)){
    const dependency=resolve(full,'..',match[1]);
    assert.ok(dependency.startsWith(root+sep),`Import escapes release: ${asset}`);
    await readFile(dependency);
   }
  }
 }
}
await check(root);
for(const asset of cached)if(asset)await readFile(resolve(root,asset));
const manifest=JSON.parse(await read('manifest.webmanifest'));
assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
for(const icon of manifest.icons)await readFile(resolve(root,icon.src));
const html=await read('index.html');
assert.match(html,/<meta http-equiv="Content-Security-Policy"/,'Static release needs its content security policy');
for(const [,asset] of html.matchAll(/(?:src|href)="(\.\/[^\"]+)"/g))await readFile(resolve(root,asset));
console.log(`PASS: Kin ${version} release version, offline coverage, module imports and install assets.`);
