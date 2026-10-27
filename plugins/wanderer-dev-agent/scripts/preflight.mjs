import {collectProjectSnapshot} from './project-snapshot.mjs';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const pluginRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repoRoot=path.resolve(pluginRoot,'../..');
const firebaseConfigHome=path.join(process.env.TMPDIR||'/tmp','wanderer-dev-agent','firebase-config');
mkdirSync(firebaseConfigHome,{recursive:true,mode:0o700});
const run=(command,args,timeout=10000)=>spawnSync(command,args,{cwd:repoRoot,encoding:'utf8',timeout,stdio:['ignore','pipe','pipe'],env:{...process.env,XDG_CONFIG_HOME:firebaseConfigHome,NO_UPDATE_NOTIFIER:'1'}});
const git=(...args)=>run('git',args);
const branch=git('branch','--show-current').stdout?.trim()||null;
const remote=git('remote','get-url','origin').stdout?.trim()||null;
const porcelain=git('status','--porcelain=v1');
const firebaseBin=path.join(repoRoot,'node_modules','.bin','firebase');
const firebase=existsSync(firebaseBin)?run(firebaseBin,['--version']):null;
let playwrightVersion=null,firebaseConfig=null,firebasePackageVersion=null;
try{playwrightVersion=JSON.parse(readFileSync(path.join(repoRoot,'node_modules','playwright','package.json'),'utf8')).version;}catch{}
try{firebasePackageVersion=JSON.parse(readFileSync(path.join(repoRoot,'node_modules','firebase-tools','package.json'),'utf8')).version;}catch{}
try{firebaseConfig=JSON.parse(readFileSync(path.join(repoRoot,'firebase.json'),'utf8'));}catch{}
const chromiumPath=process.env.CHROMIUM_PATH||'/usr/bin/chromium';
const chromium=existsSync(chromiumPath)?run(chromiumPath,['--version']):null;
const firebaseVersion=firebasePackageVersion||firebase?.stdout?.match(/\b\d+\.\d+\.\d+\b/)?.[0]||null;
const checks={
 project:collectProjectSnapshot(),
 repository:{path:repoRoot,branch,branchStatus:branch==='development'?'PASS':branch==='main'?'FAIL':'REVIEW',origin:remote,originStatus:/^https:\/\/github\.com\/Skinny-lfg\/wanderer-game(?:\.git)?$/.test(remote||'')?'PASS':'FAIL',workingTree:porcelain.status===0?(porcelain.stdout?'DIRTY':'CLEAN'):'UNKNOWN'},
 runtime:{node:process.version,nodeStatus:Number(process.versions.node.split('.')[0])>=20?'PASS':'FAIL'},
 firebase:{cli:firebaseVersion,cliStatus:firebaseVersion&&firebase?.status===0?'PASS':firebase?.status===null?'ERROR':'MISSING',cliExitCode:firebase?.status??null,authEmulator:firebaseConfig?.emulators?.auth?'CONFIGURED':'MISSING',firestoreEmulator:firebaseConfig?.emulators?.firestore?'CONFIGURED':'MISSING',emulatorStatus:firebaseConfig?.emulators?.auth&&firebaseConfig?.emulators?.firestore?'PASS':'FAIL',policy:'Isolated CLI config under /tmp; demo-wanderer emulators only; no CLI login or production project'},
 browser:{playwright:playwrightVersion,playwrightStatus:playwrightVersion?'PASS':'MISSING',chromium:chromium?.status===0?chromium.stdout.trim():null,chromiumStatus:chromium?.status===0?'PASS':'MISSING'},
 connectors:{github:'Verify via connected GitHub tools; local script does not read tokens.',googleDrive:'Verify via connected Drive tools when Drive is in scope.'}
};
const failed=['repository.branchStatus','repository.originStatus','runtime.nodeStatus','firebase.cliStatus','firebase.emulatorStatus','browser.playwrightStatus','browser.chromiumStatus'].some(key=>{const [a,b]=key.split('.');return checks[a][b]==='FAIL'||checks[a][b]==='MISSING'||checks[a][b]==='ERROR';});
process.stdout.write(JSON.stringify({ok:!failed,checks},null,2)+'\n');
if(failed)process.exitCode=1;
