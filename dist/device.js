// Device metadata never enters the portable family payload.
const unsafeKey=key=>['__proto__','constructor','prototype'].includes(key);
const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
function preferences(raw){
 const clean={};if(!record(raw))return clean;
 // Values are consumed through per-feature allowlists. Reject nested/prototype
 // keys here as well, including when receiving changes from another tab.
 for(const [key,value] of Object.entries(raw).slice(0,50)){
  if(unsafeKey(key)||key.length>80)continue;
  if(typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)||typeof value==='string'&&value.length<=120)clean[key]=value;
  else if(['export','birthdayImage'].includes(key)&&record(value)){
   clean[key]={};for(const [k,v] of Object.entries(value).slice(0,30))if(!unsafeKey(k)&&k.length<=80&&(typeof v==='boolean'||typeof v==='string'&&v.length<=120))clean[key][k]=v;
  }
 }return clean;
}
function snapshot(raw){
 const clean={version:1,groups:[],preferences:{},keptHash:'',dismissedHash:''};
 if(!record(raw)||raw.version!==1)return clean;
 const ids=new Set();
 if(Array.isArray(raw.groups))for(const g of raw.groups){
  if(clean.groups.length>=100)break;
  if(!record(g)||typeof g.id!=='string'||!g.id||g.id.length>80||unsafeKey(g.id)||ids.has(g.id)||typeof g.name!=='string'||!g.name.trim()||!Array.isArray(g.members))continue;
  ids.add(g.id);clean.groups.push({id:g.id,name:g.name.trim().slice(0,80),members:[...new Set(g.members.filter(id=>typeof id==='string'&&/^[\w-]{8}$/.test(id)))].slice(0,150)});
 }
 clean.preferences=preferences(raw.preferences);
 for(const key of ['keptHash','dismissedHash'])if(typeof raw[key]==='string'&&raw[key].length<=30000)clean[key]=raw[key];
 return clean;
}
function read(storage,key){
 const text=storage?.getItem(key);
 if(!text||text.length>262144)return snapshot(null);
 try{return snapshot(JSON.parse(text))}catch{return snapshot(null)}
}
export function createDeviceStore(path,storage){
 const key='kin.device.v1:'+path;
 let available=true,value={version:1,groups:[],preferences:{},keptHash:'',dismissedHash:''};
 try{
  value=read(storage,key);
 }catch{available=false}
 let baseline=JSON.parse(JSON.stringify(value));
 return {get value(){return value},get available(){return available},save(){
  try{
   if(!storage)throw Error('Unavailable');
   const latest=read(storage,key);
   if(latest.version===1){
    const before=new Map(baseline.groups.map(g=>[g.id,g])),local=new Map(value.groups.map(g=>[g.id,g]));
    const merged=new Map(latest.groups.map(g=>[g.id,g]));
    for(const [id] of before)if(!local.has(id))merged.delete(id);
    for(const [id,g] of local)if(JSON.stringify(before.get(id))!==JSON.stringify(g))merged.set(id,g);
    value.groups=[...merged.values()];
    for(const [k,v] of Object.entries(latest.preferences)){
     if(JSON.stringify(value.preferences[k])===JSON.stringify(baseline.preferences[k]))value.preferences[k]=v;
    }
    for(const k of ['keptHash','dismissedHash'])if(value[k]===baseline[k]&&typeof latest[k]==='string')value[k]=latest[k];
   }
   const clean=snapshot(value);value.groups=clean.groups;Object.keys(value.preferences).forEach(k=>delete value.preferences[k]);Object.assign(value.preferences,clean.preferences);value.keptHash=clean.keptHash;value.dismissedHash=clean.dismissedHash;
   storage.setItem(key,JSON.stringify(value));baseline=JSON.parse(JSON.stringify(value));available=true;
  }catch{available=false}
  return available;
 }};

}
