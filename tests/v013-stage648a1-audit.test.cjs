'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const campaign=require('../scripts/v013-stage647d9f-synergy.cjs');
const {T}=require('./v013-current-talent-helper.cjs');

test('the workflow names exactly the 42 configured agents and their targets exist',()=>{
 const yaml=fs.readFileSync('.github/workflows/v013-stage647d9f-synergy.yml','utf8');
 const names=yaml.match(/profile: \[([^\]]+)\]/)[1].split(', ');
 assert.deepEqual(names,campaign.PROFILES);
 assert.equal(new Set(names).size,42);
 const graph=new Set(T.NODES.map(n=>n.id));
 for(const id of names){
  const p=campaign.profile(id);
  for(const target of [...p.targets||[],...p.preparedTargets||[]])assert(graph.has(target),id+' '+target);
 }
 assert.throws(()=>campaign.profile('typo'),/Unknown campaign profile/);
});

test('aggregate checks capture provenance and rejects repeated replay cells even at the correct total',()=>{
 const cwd=process.cwd(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wanderer-648-unit-'));
 try{
  process.chdir(tmp);
  fs.mkdirSync('reports/stage647d9f',{recursive:true});
  const accounts=campaign.SEEDS.map(seed=>({seed,snapshot:null}));
  const shard={id:'balanced',source:'fixture',complete:true,trials:1,scenarioCount:21,accounts,rows:[]};
  const write=()=>fs.writeFileSync('reports/stage647d9f/balanced.json',JSON.stringify(shard));
  accounts[1].seed=accounts[0].seed;
  write();assert.throws(campaign.aggregate,/invalid capture seeds/);
  accounts[1].seed=campaign.SEEDS[1];accounts[0].snapshot={};
  shard.rows=Array.from({length:21},()=>({trial:0,scenario:'normal-1',naturalSeed:accounts[0].seed,won:true,died:false,timeout:false}));
  write();assert.throws(campaign.aggregate,/duplicate replay/);
 }finally{process.chdir(cwd);fs.rmSync(tmp,{recursive:true,force:true});}
});
