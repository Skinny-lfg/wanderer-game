'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const B=require('./v013-b1-e10-rebaseline.cjs'),N=require('./v013-natural-progression.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),F=require('./v013-b12c3-equipment-factorial.cjs'),S=require('./simulate-progression.cjs');
const selection=require('../reports/v013-b12c1-selection.json'),out='reports/b12c4',policy='b12c4-v1';
function profile(id){return {...F.profile(id,'B'),adaptiveEquipment:policy,preferDualDaggers:id==='smart-fury-daggers'};}
function observe(ctx){
 const p=F.observe(ctx),s=ctx.a.state(),nodes=[...s.automaticTalents.nodes],profile={...ctx.profile,adaptiveNodes:nodes};
 return {...p,commitment:N.commitmentWeight(profile),handScore:N.handPairScore(s.equip,profile)};
}
function replay(id,pick){
 const p=profile(id),a=N.simulateAccount(pick.seed,id,{...N.DEFAULTS,...A.config},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:observe});
 assert.equal(a.startXp,0);assert(a.initialGear.items.every(x=>x.startingGear));
 const audit=A.audit(id,[a]),ts=a.attempts.map(t=>({...F.trace(t,p),commitment:t.earnedProbe?.commitment??null,handScore:t.earnedProbe?.handScore??null}));
 return {id,seed:pick.seed,arm:'F',intent:{weapons:p.weapons,armor:p.armor,offhands:p.offhands||[]},endLevel:a.endLevel,stopReason:a.stopReason,errors:audit.errors,issues:audit.issues,coverage:audit.coverage,trace:ts,invalid:ts.flatMap(t=>t.invalid.map(x=>({level:t.level,attempt:t.attempt,...x})))};
}
const sum=(a,f)=>a.reduce((n,x)=>n+f(x),0),ratio=(a,b)=>b?+(100*a/b).toFixed(2):null;
function write(file,obj){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/'+file,JSON.stringify(obj,null,2));}
function run(shard){
 assert(Number.isInteger(shard)&&shard>=0&&shard<7);
 assert.deepEqual(selection.profiles.map(x=>x.id),B.NATURAL);
 const rows=[];
 for(const p of selection.profiles.slice(shard*4,shard*4+4))for(const pick of p.picks){
  const r=replay(p.id,pick);rows.push(r);
  console.log('B12C4_CELL='+JSON.stringify({id:r.id,seed:r.seed,endLevel:r.endLevel,errors:r.errors.length,issues:r.issues.length,invalid:r.invalid.length,weapon:r.coverage.developed.weapon,offhand:r.coverage.developed.offhand}));
 }
 write('shard-'+shard+'.json',{shard,commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,config:A.config,policy,rows});
}
function aggregate(){
 const read=(dir,i)=>JSON.parse(fs.readFileSync(dir+'/shard-'+i+'.json','utf8')),indices=Array.from({length:7},(_,i)=>i);
 const shards=indices.map(i=>read(out,i)),base=indices.map(i=>read('baseline',i));
 assert(shards.every((s,i)=>s.shard===i&&s.commit===shards[0].commit&&s.native===shards[0].native&&s.policy===policy&&JSON.stringify(s.config)===JSON.stringify(A.config)));
 assert(base.every((s,i)=>s.shard===i&&s.commit==='6ddb2ae7ca99148f10fd8d6201ef8a5bda649602'&&s.native===base[0].native&&JSON.stringify(s.config)===JSON.stringify(A.config)&&s.arms.B.compat===true&&s.arms.B.strict===false));
 assert.equal(shards[0].native,base[0].native,'native engine fingerprint changed');
 const rows=shards.flatMap(s=>s.rows),prior=base.flatMap(s=>s.rows.filter(r=>r.arm==='B')),by=new Map(prior.map(r=>[r.id+'/'+r.seed,r]));
 assert.equal(rows.length,56);assert.equal(by.size,56);assert.equal(new Set(rows.map(r=>r.id+'/'+r.seed)).size,56);
 const pairs=[];
 for(const r of rows){
  const b=by.get(r.id+'/'+r.seed);assert(b);
  pairs.push({id:r.id,seed:r.seed,before:b.endLevel,after:r.endLevel,delta:r.endLevel-b.endLevel,firstDifference:F.firstDifference(b,r),weapon:[ratio(b.coverage.developed.weaponMatched,b.coverage.developed.weaponObserved),ratio(r.coverage.developed.weaponMatched,r.coverage.developed.weaponObserved)],armor:[ratio(b.coverage.developed.armorMatched,b.coverage.developed.armorObserved),ratio(r.coverage.developed.armorMatched,r.coverage.developed.armorObserved)],offhand:[b.coverage.developed.offhand,r.coverage.developed.offhand],mana:[b.coverage.developed.mana,r.coverage.developed.mana],commitment:Object.fromEntries([0,5,10,15].map(w=>[w,r.trace.filter(t=>t.commitment===w).length]))});
 }
 const baseline=F.summarize(prior),candidate=F.summarize(rows),progress={improved:pairs.filter(p=>p.delta>0).length,equal:pairs.filter(p=>p.delta===0).length,worse:pairs.filter(p=>p.delta<0).length};
 const gate={errors:sum(rows,r=>r.errors.length),issues:sum(rows,r=>r.issues.length),invalid:sum(rows,r=>r.invalid.length)};
 const summary={baseline,candidate,progress,gate,meanPairedDelta:sum(pairs,p=>p.delta)/pairs.length,identityDelta:{weapon:ratio(candidate.weaponMatched,candidate.weaponObserved)-ratio(baseline.weaponMatched,baseline.weaponObserved),armor:ratio(candidate.armorMatched,candidate.armorObserved)-ratio(baseline.armorMatched,baseline.armorObserved)}};
 write('summary.json',{baselineRun:45906458862,baselineCommit:base[0].commit,commit:shards[0].commit,native:shards[0].native,config:A.config,selection,policy,summary,pairs});
 console.log('B12C4_OVERVIEW='+JSON.stringify(summary));
 for(const p of pairs)console.log('B12C4_PAIR='+JSON.stringify({...p,firstDifference:p.firstDifference?{level:p.firstDifference.level,attempt:p.firstDifference.attempt,kind:p.firstDifference.kind}:null}));
 if(Object.values(gate).some(n=>n>0))process.exitCode=1;
}
if(require.main===module){if(process.argv[2]==='aggregate')aggregate();else run(Number(process.argv[2]));}
module.exports={profile,observe};
