import {encode,decode} from './core.js';
export const MAX_BACKUP_BYTES=65536;
export function createBackup(records){return JSON.stringify({format:'kin-family',version:1,data:encode(records)},null,2)+'\n'}
export function readBackup(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw Error('This backup is too large. Choose a Kin backup smaller than 64 KB.');
 let file;try{file=JSON.parse(text)}catch{throw Error('This is not a valid Kin backup file.')}
 if(!file||Array.isArray(file)||file.format!=='kin-family'||file.version!==1||typeof file.data!=='string')throw Error('This is not a supported Kin backup.');
 return decode(file.data);
}
