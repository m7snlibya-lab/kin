import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function securityFindings(sarif){
 assert.ok(Array.isArray(sarif.runs)&&sarif.runs.length,'Missing analyzer runs');
 return sarif.runs.flatMap(run=>{
  const rules=new Map((run.tool?.driver?.rules||[]).map(rule=>[rule.id,rule]));
  return (run.results||[]).filter(result=>{
   if(['pass','notApplicable','informational'].includes(result.kind))return false;
   const properties=rules.get(result.ruleId)?.properties||{};
   return Number(properties['security-severity'])>0||properties.tags?.includes('security');
  });
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const directory=process.argv[2];assert.ok(directory,'Provide the analysis output directory');
 const files=(await readdir(directory)).filter(file=>file.endsWith('.sarif'));
 assert.ok(files.length,'No security analysis was produced');
 let count=0;
 for(const file of files){
  const findings=securityFindings(JSON.parse(await readFile(resolve(directory,file),'utf8')));count+=findings.length;
  for(const result of findings){const p=result.locations?.[0]?.physicalLocation;console.log('[security]',result.ruleId,p?.artifactLocation?.uri,p?.region?.startLine,result.message?.text)}
 }
 assert.equal(count,0,'Security findings must be reviewed and fixed before deploying');
 console.log(`PASS: no security findings in ${files.length} CodeQL analysis file(s).`);
}
