import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import readline from 'node:readline';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const firebaseConfigHome=path.join(process.env.TMPDIR||'/tmp','wanderer-dev-agent','firebase-config');
mkdirSync(firebaseConfigHome,{recursive:true,mode:0o700});
const suites={unit:['npm',['test']],preview:['npm',['run','test:preview']],browser:['npm',['run','test:browser']],assets:['npm',['run','test:assets']],simulation:['npm',['run','simulate:v012']],rules:['npm',['run','test:rules']]};
const toolList=[
 {name:'preflight',title:'Run Wanderer preflight',description:'Read-only local check of development branch, worktree, Firebase Emulator Suite, and Playwright. Verify GitHub and Google Drive through connected app tools.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,openWorldHint:false,destructiveHint:false}},
 {name:'run_check',title:'Run an isolated Wanderer check',description:'Run one allow-listed npm validation suite. The rules suite uses only local Auth/Firestore emulators with demo-wanderer. No Firebase login, production project, deploy, or real saves.',inputSchema:{type:'object',properties:{suite:{type:'string',enum:Object.keys(suites)}},required:['suite'],additionalProperties:false},annotations:{readOnlyHint:false,openWorldHint:false,destructiveHint:false}},
 {name:'capture_preview_screenshots',title:'Capture isolated preview screenshots',description:'Open the password-gated private local preview with generated synthetic credentials, start a synthetic Expedition, detect page/asset errors, and save mobile/desktop screenshots under ignored test-results.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,openWorldHint:false,destructiveHint:false}}
];
const respond=(id,result)=>process.stdout.write(JSON.stringify({jsonrpc:'2.0',id,result})+'\n');
const rpcError=(id,code,message)=>process.stdout.write(JSON.stringify({jsonrpc:'2.0',id,error:{code,message}})+'\n');
function execute(command,args,{timeout=600000}={}){
 return new Promise((resolve,reject)=>{
  const child=spawn(command,args,{cwd:root,env:{...process.env,XDG_CONFIG_HOME:firebaseConfigHome},stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
  const timer=setTimeout(()=>child.kill('SIGTERM'),timeout);
  child.stdout.on('data',x=>{stdout+=x.toString();if(stdout.length>120000)stdout=stdout.slice(-120000);});
  child.stderr.on('data',x=>{stderr+=x.toString();if(stderr.length>40000)stderr=stderr.slice(-40000);});
  child.on('error',e=>{clearTimeout(timer);reject(e);});
  child.on('close',(code,signal)=>{clearTimeout(timer);resolve({code,signal,stdout,stderr});});
 });
}
async function callTool(name,args={}){
 if(name==='preflight'){
  const r=await execute(process.execPath,[path.join(root,'plugins/wanderer-dev-agent/scripts/preflight.mjs')],{timeout:30000});
  return {content:[{type:'text',text:r.stdout||r.stderr}],structuredContent:{exitCode:r.code,report:r.stdout.trim()}};
 }
 if(name==='run_check'){
  if(!Object.hasOwn(suites,args.suite))throw Error('Unsupported suite.');
  if(args.suite==='rules'){
   const config=JSON.parse(await (await import('node:fs/promises')).readFile(path.join(root,'firebase.json'),'utf8'));
   if(!config.emulators?.auth||!config.emulators?.firestore)throw Error('Both local Auth and Firestore emulators must be configured.');
  }
  const [command,argv]=suites[args.suite];
  const r=await execute(command,argv,{timeout:args.suite==='browser'?600000:args.suite==='unit'?300000:180000});
  const body=`suite=${args.suite} exit=${r.code}\n${r.stdout}${r.stderr?`\nSTDERR:\n${r.stderr}`:''}`;
  return {content:[{type:'text',text:body}],structuredContent:{suite:args.suite,exitCode:r.code,passed:r.code===0}};
 }
 if(name==='capture_preview_screenshots'){
  const r=await execute(process.execPath,[path.join(root,'plugins/wanderer-dev-agent/scripts/capture-preview.mjs')],{timeout:180000});
  return {content:[{type:'text',text:r.stdout||r.stderr}],structuredContent:{exitCode:r.code,passed:r.code===0}};
 }
 throw Error('Unknown tool.');
}
const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
rl.on('line',async line=>{
 let message;try{message=JSON.parse(line);}catch{return;}
 if(message.method==='notifications/initialized')return;
 if(message.method==='ping')return respond(message.id,{});
 if(message.method==='initialize')return respond(message.id,{protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'wanderer-dev-agent',version:'0.1.0'}});
 if(message.method==='tools/list')return respond(message.id,{tools:toolList});
 if(message.method==='tools/call'){
  try{return respond(message.id,await callTool(message.params?.name,message.params?.arguments||{}));}
  catch(e){return respond(message.id,{isError:true,content:[{type:'text',text:e.message||String(e)}]});}
 }
 if(message.id!==undefined)return rpcError(message.id,-32601,'Method not found');
});
