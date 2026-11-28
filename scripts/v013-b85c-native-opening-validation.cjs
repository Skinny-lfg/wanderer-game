'use strict';
// B8.5C: compare production integration with the already tested B2 VM candidate.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const R=require('./v013-b82-natural-readiness.cjs'),N=require('./v013-natural-progression.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs');
const ROOT=path.resolve(__dirname,'..'),BASE='c9a4cf35942cc8e3a0dee83acdcdbcaa3bdb29b0',CORE='combat/v012-combat-core.js';
const historical=execFileSync('git',['show',BASE+':'+CORE],{cwd:ROOT,encoding:'utf8'}),source=fs.readFileSync(path.join(ROOT,CORE),'utf8');
const anchor='  e.maxhp=Math.max(1,Math.round(e.maxhp*hp));';
assert.equal(historical.split(anchor).length,2);
// Exact B2 experimental source from B8.5B (before native integration).
const candidate=historical.replace(anchor,'  if(expedition===1&&n===1){if(e.role==="tank"){hp*=.80;atk*=.85;}else if(e.role==="skirmisher"){hp*=.90;atk*=.90;}} // B8.5B selective relief\n'+anchor);
const plain=x=>JSON.parse(JSON.stringify(x));
function probe(code,level,roles,leader=null){
 const ctx={};vm.runInNewContext(code,ctx);
 const group=roles.map((role,i)=>({role,hp:73+i,maxhp:73+i,atk:17+i,def:5,baseDef:5,attackEvery:1.75,...(leader&&i===0?{[leader]:true}:{})}));
 const result=ctx.WandererV012CombatCore.applyNormalRoomBudget(group,level);
 return plain({group,result});
}
function staticGate(){
 assert.equal(source,fs.readFileSync(path.join(ROOT,'docs',CORE),'utf8'));
 const roles=['tank','skirmisher','caster','minion'];
 let cases=0,unchanged=0;
 for(const level of [1,2,3,5,10,35,200,201])for(const size of [1,2,4,8,12,16,22])for(const role of roles)for(const leader of [null,'boss','miniboss']){
  const roster=Array.from({length:size},(_,i)=>i===0?role:roles[(i+roles.indexOf(role))%roles.length]);
  const old=probe(historical,level,roster,leader),actual=probe(source,level,roster,leader),expected=probe(candidate,level,roster,leader);
  assert.deepEqual(actual,expected,JSON.stringify({level,size,role,leader}));cases++;
  if(leader||level!==1||size!==1||!['tank','skirmisher'].includes(role)){assert.deepEqual(actual,old);unchanged++;}
  else{assert(actual.group[0].maxhp<old.group[0].maxhp);assert(actual.group[0].atk<old.group[0].atk);assert.equal(actual.group[0].def,old.group[0].def);assert.equal(actual.group[0].attackEvery,old.group[0].attackEvery);}
 }
 return {cases,unchanged,changed:cases-unchanged};
}
const IDS=['smart-blood-sword','smart-fury-daggers','smart-decay-outbreak','smart-arcane-arcane-pure','pure-aegis','hybrid-fury-radiance'];
const SEEDS=[138510097,138510097+181*37],CONFIG={...R.CONFIG,maxLevel:3};
function account(id,seed,override){
 const p=R.profile(id);let recorded=false;
 const a=N.simulateAccount(seed,id,{...N.DEFAULTS,...CONFIG},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,moduleOverrides:override?{[CORE]:candidate}:{},recordModules:entries=>{const e=entries.find(x=>x.file===CORE);assert(e);assert.equal(e.overridden,override);recorded=true;},onCamp:({a})=>({legal:a.talents.valid(a.state().automaticTalents),stats:a.baseStats()})});
 assert(recorded);assert.equal(a.startXp,0);assert(a.initialGear.items.every(x=>x.startingGear));assert(a.attempts.length<=60);
 const audit=A.audit(id,[a]);assert.deepEqual(audit.errors,[]);assert.deepEqual(audit.issues,[]);
 for(const t of a.attempts){assert(!t.error,JSON.stringify({id,seed,error:t.error,diagnostic:t.diagnostic}));assert.deepEqual(D.compatibilityIssues(t,p),[]);assert(!(t.rooms||[]).some(r=>r.timedOut));}
 return a;
}
function replay(){
 const statics=staticGate(),rows=[];
 for(const id of IDS)for(const seed of SEEDS){
  const before=account(id,seed,true),after=account(id,seed,false);
  // Compare complete earned account reports, not just win/lose totals.
  assert.deepEqual(plain(after),plain(before),id+' / '+seed+' native vs B2');
  const row={id,seed,endLevel:after.endLevel,attempts:after.attempts.length,fights:after.attempts.reduce((n,t)=>n+(t.rooms||[]).length,0),xp:after.xp,matched:true};
  rows.push(row);console.log('B85C_REPLAY='+JSON.stringify(row));
 }
 const result={base:BASE,commit:process.env.GITHUB_SHA||null,manifest:R.manifest(),statics,accounts:rows,matched:rows.length,expected:IDS.length*SEEDS.length};
 fs.mkdirSync(path.join(ROOT,'reports/b85c'),{recursive:true});fs.writeFileSync(path.join(ROOT,'reports/b85c/replay.json'),JSON.stringify(result,null,2));
 console.log('B85C_OVERVIEW='+JSON.stringify({statics,matched:rows.length,expected:result.expected,fights:rows.reduce((n,r)=>n+r.fights,0),native:result.manifest.native}));
}
module.exports={staticGate};
if(require.main===module)replay();
