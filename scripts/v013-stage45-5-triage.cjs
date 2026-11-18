'use strict';
// Stage 4.5.5 triage: objective extraction from CI artifacts, never automatic security approval.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve('reports/stage45-5-release');
fs.mkdirSync(root,{recursive:true});
const logPath=path.join(root,'legacy-test.log');
const auditPath=path.join(root,'npm-audit.json');
function read(p){try{return fs.readFileSync(p,'utf8')}catch{return ''}}
function write(name,data){fs.writeFileSync(path.join(root,name),JSON.stringify(data,null,2)+'\n')}
const log=read(logPath),lines=log.split(/\r?\n/),failed=[];
let currentTest=null;
for(const line of lines){
 const m=line.match(/^\s*not ok\s+\d+\s+-\s+(.+)$/);
 if(m){currentTest={name:m[1],context:[],category:'unclassified — manual investigation required'};failed.push(currentTest);continue}
 if(currentTest&&/^\s*(?:ok |not ok |# tests |# pass |# fail |1\.\.)/.test(line))currentTest=null;
 if(currentTest&&currentTest.context.length<12&&/error:|code:|failureType:|stack:|ENOENT|Cannot find|Expected|actual:|operator:/.test(line))currentTest.context.push(line.trim().slice(0,400));
}
const missing=failed.filter(x=>x.context.some(s=>/ENOENT|Cannot find module|module not found/i.test(s)));
const failures={source:logPath,parsedFailures:failed.length,environmentCandidates:missing.length,unclassified:failed.length-missing.length,
 caution:'Candidate classifications are NOT definitive; every failure requires owner review.',cases:failed};
write('legacy-triage.json',failures);
const auditRaw=read(auditPath);
let audit=null;
try{audit=JSON.parse(auditRaw)}catch{}
const lock=(()=>{try{return JSON.parse(fs.readFileSync('package-lock.json','utf8'))}catch{return null}})();
if(audit?.vulnerabilities){
 const findings=Object.entries(audit.vulnerabilities).map(([name,v])=>{
   const nodes=(v.nodes||[]).map(p=>({path:p,devOnly:lock?.packages?.[p]?.dev===true,optional:lock?.packages?.[p]?.optional===true}));
   const scope=nodes.length&&nodes.every(x=>x.devOnly)?'all-reported-nodes-dev-only':'production-reachability-must-be-checked';
   return {name,severity:v.severity,via:v.via,range:v.range,isDirect:v.isDirect,fixAvailable:v.fixAvailable,scope,nodes};
 });
 const grouped={};for(const v of findings){const k=v.severity+'/'+v.scope;(grouped[k]??=[]).push(v.name)}
 write('dependency-triage.json',{metadata:audit.metadata?.vulnerabilities||null,grouped,findings,
   caution:'Dev-only install path is not a security clearance. Determine production bundle reachability and fix versions before GO.'});
 console.log('Dependency audit analyzed:',findings.length,'entries');
}else write('dependency-triage.json',{error:'Missing or invalid npm audit JSON',rawBytes:auditRaw.length});
console.log('Legacy failure triage:',failed.length,'parsed failure cases;',missing.length,'environment candidates');
