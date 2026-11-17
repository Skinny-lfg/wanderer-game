'use strict';
// Stage 4.5.4: browser verification of current three-card Dungeon and v15 UI.
// Uses a temporary local-only preview. The test hook is injected into that copy,
// not saved into production index.html or into player saves.
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const reportDir=path.resolve('reports/v013-browser-qa');
fs.mkdirSync(reportDir,{recursive:true});
const report={date:new Date().toISOString(),tests:[],pageErrors:[],notFound:[],accessibility:[],screenshots:[],limitations:[]};
const note=(name,data={})=>{report.tests.push({name,...data});console.log('PASS: '+name);};
const save=()=>fs.writeFileSync(path.join(reportDir,'stage45-4-report.json'),JSON.stringify(report,null,2));
function createPreview(){
 const output=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim();
 const root=output.replace(/^Isolated automatic RPG preview:\s*/,'');
 const entry=path.join(root,'index.html');
 let source=fs.readFileSync(entry,'utf8');
 const boot='phase1Init();\nconst phase3RestoredScroll';
 assert(source.includes(boot),'Cannot locate known v0.13 test-only injection point');
 const shim=String.raw