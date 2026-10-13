import {decode,encode,validate} from './core.js';
export function createFamilyStore(key,storage){
 let revision=null,persisted=true;
 return {
  get revision(){return revision},get persisted(){return persisted},
  load(){const raw=storage()?.getItem(key)??null;revision=raw;return raw?decode(raw):[]},
  latest(){try{return storage()?.getItem(key)??null}catch{return revision}},
  write(rows){
   let latest;try{latest=storage()?.getItem(key)??null}catch{latest=revision}
   if(latest!==revision)return {conflict:true};
   validate(rows);const hash=encode(rows);
   try{const target=storage();if(!target)throw Error('Unavailable');target.setItem(key,hash);revision=hash;persisted=true}catch{persisted=false}
   return {hash,persisted};
  },
  async serialize(action){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
   try{
    if(!globalThis.navigator?.locks)return action();
    try{return await navigator.locks.request(key,{signal:controller.signal},async()=>{
     // Publish Firefox's storage snapshot before releasing the cross-tab lock.
     const result=action();await new Promise(resolve=>setTimeout(resolve,0));return result;
    })}catch(error){if(['SecurityError','NotSupportedError'].includes(error.name))return action();throw error}
   }finally{clearTimeout(timer)}
  }
 };
}
