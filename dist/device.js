// Device metadata never enters the portable family payload.
export function createDeviceStore(path,storage){
 const key='kin.device.v1:'+path;
 let available=true,value={version:1,groups:[],preferences:{},keptHash:'',dismissedHash:''};
 try{
  const raw=JSON.parse(storage?.getItem(key)||'null');
  if(raw?.version===1){
   value.groups=Array.isArray(raw.groups)?raw.groups.filter(g=>g&&typeof g.id==='string'&&typeof g.name==='string'&&g.name.trim()&&Array.isArray(g.members)).slice(0,100).map(g=>({id:g.id,name:g.name.slice(0,80),members:[...new Set(g.members.filter(id=>typeof id==='string'))].slice(0,150)})):[];
   value.preferences=raw.preferences&&typeof raw.preferences==='object'&&!Array.isArray(raw.preferences)?raw.preferences:{};
   value.keptHash=typeof raw.keptHash==='string'?raw.keptHash:'';
   value.dismissedHash=typeof raw.dismissedHash==='string'?raw.dismissedHash:'';
  }
 }catch{available=false}
 let baseline=JSON.parse(JSON.stringify(value));
 return {get value(){return value},get available(){return available},save(){
  try{
   if(!storage)throw Error('Unavailable');
   const latest=JSON.parse(storage.getItem(key)||'null');
   if(latest?.version===1&&Array.isArray(latest.groups)){
    const before=new Map(baseline.groups.map(g=>[g.id,g])),local=new Map(value.groups.map(g=>[g.id,g]));
    const merged=new Map(latest.groups.filter(g=>g&&typeof g.id==='string').map(g=>[g.id,g]));
    for(const [id] of before)if(!local.has(id))merged.delete(id);
    for(const [id,g] of local)if(JSON.stringify(before.get(id))!==JSON.stringify(g))merged.set(id,g);
    value.groups=[...merged.values()];
    for(const [k,v] of Object.entries(latest.preferences||{})){
     if(['__proto__','constructor','prototype'].includes(k))continue;
     if(JSON.stringify(value.preferences[k])===JSON.stringify(baseline.preferences[k]))value.preferences[k]=v;
    }
    for(const k of ['keptHash','dismissedHash'])if(value[k]===baseline[k]&&typeof latest[k]==='string')value[k]=latest[k];
   }
   storage.setItem(key,JSON.stringify(value));baseline=JSON.parse(JSON.stringify(value));available=true;
  }catch{available=false}
  return available;
 }};

}
