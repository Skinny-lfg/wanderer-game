'use strict';
// B8.5 — disposable VM candidates, not production balance changes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict'),zlib=require('node:zlib');
const R=require('./v013-b82-natural-readiness.cjs'),P=require('./v013-b83-natural-pilot.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),N=require('./v013-natural-progression.cjs'),S=require('./simulate-progression.cjs');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'reports/b85'),BASE='bec6d6348059acaaf4d6467b6e50cb0a66f20bb4';
const CORE='combat/v012-combat-core.js',GEAR='economy/v013-gear-rolls.js',original=Object.fromEntries([CORE,GEAR].map(f=>[f,fs.readFileSync(path.join(ROOT,f),'utf8')]));
const IDS=['smart-blood-sword','smart-fury-daggers','smart-decay-outbreak','smart-arcane-arcane-pure','pure-aegis','hybrid-fury-radiance'];
const ARMS=['A','B','C','D'],SEEDS=[...P.SEEDS,...Array.from({length:20},(_,i)=>138500093+i*179)],CONFIG={...R.CONFIG,maxLevel:3};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),sum=(a,f)=>a.reduce((n,x)=>n+f(x),0),pct=(n,d)=>d?+(100*n/d).toFixed(2):null,mean=(a,f)=>a.length?+(sum(a,f)/a.length).toFixed(2):null;
function replace(s,a,b){assert.equal(s.split(a).length,2,'Source contract '+a);return s.replace(a,b);}
function overrides(arm){
 assert(ARMS.includes(arm));const x={};
 if(['B','D'].includes(arm))x[CORE]=replace(original[CORE],'  e.maxhp=Math.max(1,Math.round(e.maxhp*hp));','  if(expedition===1&&n===1){hp*=.80;atk*=.85;} // B8.5 test-only opening relief\n  e.maxhp=Math.max(1,Math.round(e.maxhp*hp));');
 if(['C','D'].includes(arm))x[GEAR]=replace(replace(original[GEAR],"if(slot==='armor')return {...base,subtype:'Armor',armorType:'Cloth',name:'Worn Tunic',def:1};","if(slot==='armor')return {...base,subtype:'Armor',armorType:'Cloth',name:'Worn Tunic',def:2};"),"if(slot==='helm')return {...base,subtype:'Helm',armorType:'Cloth',name:'Worn Hood',hp:4};","if(slot==='helm')return {...base,subtype:'Helm',armorType:'Cloth',name:'Worn Hood',hp:8};");
 return x;
}
function manifest(){
 const m=R.manifest();assert.equal(m.native,'c7b33228eec7acce9917468a1a7a6452d9938493f13d44ac8b79a1c551327210');
 assert.equal(new Set(SEEDS).size,25);assert(IDS.every(id=>R.IDS.includes(id)));
 return {commit:process.env.GITHUB_SHA||null,base:BASE,native:m.native,policy:m.policy,config:CONFIG,profiles:IDS,seeds:SEEDS,trainingSeeds:P.SEEDS,heldOutSeeds:SEEDS.slice(5),arms:ARMS,sourceHashes:Object.fromEntries(ARMS.map(a=>[a,Object.fromEntries([CORE,GEAR].map(f=>[f,sha(overrides(a)[f]||original[f])]))])),expected:IDS.length*SEEDS.length*ARMS.length};
}
function runAccount(id,arm,index,config=CONFIG){
 const seed=SEEDS[index],p=R.profile(id),patch=overrides(arm),issues=[];let loaded=false;
 try{
  const a=N.simulateAccount(seed,id,{...N.DEFAULTS,...config},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,moduleOverrides:patch,recordModules:entries=>{
   for(const f of [CORE,GEAR]){const e=entries.find(x=>x.file===f);assert(e);assert.equal(e.overridden,Object.hasOwn(patch,f));assert.equal(e.sha256,sha(patch[f]||original[f]));}
   assert.deepEqual(entries.filter(x=>x.overridden&&x.file!=='index.html').map(x=>x.file).sort(),Object.keys(patch).sort());loaded=true;
  },onCamp:({a})=>({legal:a.talents.valid(a.state().automaticTalents),stats:a.baseStats()})});
  assert(loaded);assert.equal(a.startXp,0);assert(a.initialGear.items.every(x=>x.startingGear));
  const audit=A.audit(id,[a]);issues.push(...audit.issues);
  for(const t of a.attempts)for(const message of D.compatibilityIssues(t,p))issues.push({level:t.level,attempt:t.attempt,message});
  return {...a,id,arm,index,issues,seed};
 }catch(e){return {id,arm,index,seed,endLevel:null,attempts:[{status:'error',error:e.message,diagnostic:String(e.stack).slice(0,6000)}],issues};}
}
const rs=ts=>ts.flatMap(t=>t.rooms||[]),kind=r=>r.roomType==='combat'?'normal':r.roomType;
function summarize(as){
 const e1=as.flatMap(a=>a.attempts.filter(t=>t.level===1)),first=e1.map(t=>t.rooms?.[0]).filter(Boolean),firstAttempt=as.map(a=>a.attempts[0]?.rooms?.[0]).filter(Boolean),won=as.filter(a=>a.endLevel>=2);
 const byLevel=Array.from({length:CONFIG.maxLevel},(_,i)=>{const level=i+1,ts=as.flatMap(a=>a.attempts.filter(t=>t.level===level)),fights=rs(ts);return {level,entered:as.filter(a=>a.attempts.some(t=>t.level===level)).length,cleared:as.filter(a=>a.endLevel>level).length,attempts:ts.length,extractions:ts.filter(t=>t.status==='extracted').length,byType:Object.fromEntries(['normal','elite','boss'].map(k=>[k,D.outcomes(D.counts(fights.filter(r=>kind(r)===k)))]))};});
 const all=as.flatMap(a=>a.attempts),fail=as.filter(a=>a.endLevel===1);
 const firstRoles=Object.fromEntries(['tank','skirmisher','caster','minion'].map(role=>[role,D.outcomes(D.counts(first.filter(r=>r.initialEnemies===1&&r.initialRoleCounts?.[role]===1)))]));
 return {accounts:as.length,e1Cleared:won.length,e1ClearPct:pct(won.length,as.length),e1Attempts:e1.length,meanAttemptsToClear:mean(won,a=>a.attempts.find(t=>t.level===1&&t.bossWon)?.attempt||0),clearedBy3:won.filter(a=>a.attempts.find(t=>t.level===1&&t.bossWon)?.attempt<=3).length,clearedBy6:won.filter(a=>a.attempts.find(t=>t.level===1&&t.bossWon)?.attempt<=6).length,firstAttempt:D.outcomes(D.counts(firstAttempt)),firstFight:D.outcomes(D.counts(first)),firstRoles,firstFightHpEndPct:mean(first,r=>100*r.hpEnd/Math.max(1,r.hpMax)),firstFightSeconds:mean(first,r=>r.seconds),noFightWins:as.filter(a=>!rs(a.attempts.filter(t=>t.level===1)).some(r=>r.won)).length,noXpAfterE1:as.filter(a=>(a.attempts.filter(t=>t.level===1).at(-1)?.after?.xp??null)===0).length,failedE1Xp:mean(fail,a=>a.xp||0),failedE1Gold:mean(fail,a=>a.gold||0),starterRemainingAtE2:mean(as.filter(a=>a.attempts.some(t=>t.level===2)),a=>a.attempts.find(t=>t.level===2).before?.gear?.starter||0),e2Xp:mean(as.filter(a=>a.attempts.some(t=>t.level===2)),a=>a.attempts.find(t=>t.level===2).before?.xp||0),e2Points:mean(as.filter(a=>a.attempts.some(t=>t.level===2)),a=>a.attempts.find(t=>t.level===2).before?.spent||0),e1Drops:sum(rs(e1),r=>(r.loot||[]).length),e1PotionUses:sum(e1,t=>(t.potions||[]).length),errors:all.filter(t=>t.error||t.status==='error').length,issues:sum(as,a=>a.issues.length),timeouts:rs(all).filter(r=>r.timedOut).length,levels:byLevel};
}
function save(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),zlib.gzipSync(JSON.stringify(x)));}
function shard(i,j){const id=IDS[i],arm=ARMS[j];assert(id&&arm);const accounts=SEEDS.map((_,k)=>runAccount(id,arm,k));save('shard-'+i+'-'+j+'.json.gz',{manifest:manifest(),i,j,id,arm,accounts});console.log('B85_SHARD='+JSON.stringify({id,arm,...summarize(accounts)}));}
function paired(a,b){const key=x=>x.id+'/'+x.seed,m=new Map(a.map(x=>[key(x),x]));assert.equal(m.size,a.length);const pairs=b.filter(x=>m.has(key(x))).map(x=>[m.get(key(x)),x]);return {matched:pairs.length,improved:pairs.filter(([x,y])=>x.endLevel===1&&y.endLevel>=2).length,worsened:pairs.filter(([x,y])=>x.endLevel>=2&&y.endLevel===1).length,bothClear:pairs.filter(([x,y])=>x.endLevel>=2&&y.endLevel>=2).length,neitherClear:pairs.filter(([x,y])=>x.endLevel===1&&y.endLevel===1).length};}
function aggregate(){
 const m=manifest(),all=[],missing=[],invalid=[];
 for(const [i,id] of IDS.entries())for(const [j,arm] of ARMS.entries()){try{const x=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(OUT,'shard-'+i+'-'+j+'.json.gz'))));assert.deepEqual(x.manifest,m);assert.equal(x.id,id);assert.equal(x.arm,arm);assert.equal(x.accounts.length,SEEDS.length);x.accounts.forEach((a,k)=>{assert.equal(a.seed,SEEDS[k]);assert.equal(a.index,k);assert.equal(a.id,id);assert.equal(a.arm,arm);});all.push(...x.accounts);}catch(e){(e.code==='ENOENT'?missing:invalid).push({i,j,error:e.message});}}
 const by=Object.fromEntries(ARMS.map(arm=>[arm,all.filter(a=>a.arm===arm)]));
 const cohorts={pilot:a=>a.index<5,heldOut:a=>a.index>=5};
 const reports=Object.fromEntries(Object.entries(cohorts).map(([k,f])=>[k,Object.fromEntries(ARMS.map(arm=>[arm,{...summarize(by[arm].filter(f)),paired:paired(by.A.filter(f),by[arm].filter(f)),bySeed:Object.fromEntries(SEEDS.filter((s,i)=>f({index:i})).map(seed=>[seed,summarize(by[arm].filter(a=>a.seed===seed))])),byProfile:Object.fromEntries(IDS.map(id=>[id,summarize(by[arm].filter(a=>f(a)&&a.id===id))]))}]))]));
 const integrity={accounts:all.length,expected:m.expected,missing,invalid,errors:sum(all,a=>a.attempts.filter(t=>t.error||t.status==='error').length),issues:sum(all,a=>a.issues.length),timeouts:sum(all,a=>rs(a.attempts).filter(r=>r.timedOut).length)};
 const clean=integrity.accounts===m.expected&&!missing.length&&!invalid.length&&!integrity.errors&&!integrity.issues&&!integrity.timeouts;
 const result={manifest:m,integrity,clean,reports,interactionHeldOutPP:reports.heldOut.D.e1ClearPct-reports.heldOut.B.e1ClearPct-reports.heldOut.C.e1ClearPct+reports.heldOut.A.e1ClearPct,notes:['Five reused exploratory seed blocks reported separately from 20 fresh held-out screening blocks. Shared seeds, correlated accounts; no human win-rate claim.','Different subsequent RNG consumption and routes are legitimate downstream effects, not identical encounter comparisons.','E2–E3 conditional on survivors, compare reach and clear separately. Starter items may persist into later levels.','No candidate auto-adopted; evaluate recovery benefit and E2/E3 spillover before approval.']};
 fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(result,null,2));
 for(const [cohort,arms] of Object.entries(reports))for(const [arm,r] of Object.entries(arms)){const {bySeed,byProfile,...s}=r;console.log('B85_RESULT='+JSON.stringify({cohort,arm,...s}));}
 console.log('B85_OVERVIEW='+JSON.stringify({integrity,clean,interactionHeldOutPP:result.interactionHeldOutPP}));if(!clean)process.exitCode=1;
}
function coreProbe(arm,level,role='tank',size=1){const ctx={};vm.runInNewContext(overrides(arm)[CORE]||original[CORE],ctx);const group=Array.from({length:size},()=>({role,maxhp:100,hp:100,atk:100,def:10,baseDef:10,attackEvery:1.5}));ctx.WandererV012CombatCore.applyNormalRoomBudget(group,level);return JSON.parse(JSON.stringify(group));}
module.exports={manifest,overrides,coreProbe,runAccount,summarize,ARMS,IDS,SEEDS,CONFIG};
if(require.main===module){const [cmd,i,j]=process.argv.slice(2);if(cmd==='plan')console.log('B85_PLAN='+JSON.stringify(manifest()));else if(cmd==='shard')shard(Number(i),Number(j));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
