'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const B=require('./v013-b1-e10-rebaseline.cjs'),N=require('./v013-natural-progression.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),F=require('./v013-b12c3-equipment-factorial.cjs'),S=require('./simulate-progression.cjs');
const selection=require('../reports/v013-b12c1-selection.json'),out='reports/b12c5';
const ARMS={G:'identity',H:'hands',I:'both',J:'ring'};
const RING_SEED=76201617,RING_IDS=['smart-arcane-arcane-pure','smart-arcane-fire-pure','smart-arcane-lightning-pure'];
const sum=(a,f)=>a.reduce((n,x)=>n+f(x),0),pct=(a,b)=>b?100*a/b:null;
function profile(id,arm){
 assert(ARMS[arm]);return {...F.profile(id,'B'),decisionIsolation:ARMS[arm],preferDualDaggers:arm!=='H'&&arm!=='J'&&id==='smart-fury-daggers'};
}
function observe(ctx){
 const p=F.observe(ctx),s=ctx.a.state(),profile={...ctx.profile,adaptiveNodes:[...s.automaticTalents.nodes]};
 const ringOffers=(s.merchant?.stock||[]).filter(x=>['ring1','ring2'].includes(x.slot)).map(x=>({name:x.name,slot:x.slot,price:x.goldPrice,def:x.def||0,spell:x.spell||0,atk:x.atk||0,statGainBySlot:Object.fromEntries(['ring1','ring2'].map(slot=>[slot,N.gearScore(x,profile,slot)-N.gearScore(s.equip[slot],profile,slot)]))}));
 return {...p,commitment:N.softIdentityEnabled(profile)?N.commitmentWeight(profile):0,ringOffers};
}
function replay(id,pick,arm){
 const p=profile(id,arm),a=N.simulateAccount(pick.seed,id,{...N.DEFAULTS,...A.config},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:observe});
 assert.equal(a.startXp,0);assert(a.initialGear.items.every(x=>x.startingGear));
 const audit=A.audit(id,[a]),ts=a.attempts.map(t=>({...F.trace(t,p),commitment:t.earnedProbe?.commitment??null,ringOffers:t.earnedProbe?.ringOffers||[]}));
 return {id,seed:pick.seed,arm,endLevel:a.endLevel,stopReason:a.stopReason,errors:audit.errors,issues:audit.issues,coverage:audit.coverage,trace:ts,invalid:ts.flatMap(t=>t.invalid.map(x=>({level:t.level,attempt:t.attempt,...x})))};
}
function write(file,obj){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/'+file,JSON.stringify(obj,null,2));}
function run(shard){
 assert(Number.isInteger(shard)&&shard>=0&&shard<7);
 assert.deepEqual(selection.profiles.map(x=>x.id),B.NATURAL);
 const rows=[];
 for(const p of selection.profiles.slice(shard*4,shard*4+4))for(const pick of p.picks){
  for(const arm of ['G','H','I',...(RING_IDS.includes(p.id)&&pick.seed===RING_SEED?['J']:[])]){
   const r=replay(p.id,pick,arm);rows.push(r);
   console.log('B12C5_CELL='+JSON.stringify({id:r.id,seed:r.seed,arm:r.arm,endLevel:r.endLevel,errors:r.errors.length,issues:r.issues.length,invalid:r.invalid.length,developed:r.coverage.developed.fights}));
  }
 }
 write('shard-'+shard+'.json',{shard,commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,config:A.config,arms:ARMS,rows});
}
function first(base,r){
 const d=F.firstDifference(base,r);if(!d)return null;
 const {level,attempt}=d;
 const at=r.trace.find(t=>t.level===level&&t.attempt===attempt);
 return {...d,commitment:at?.commitment??null,remainingRingOffers:at?.ringOffers||[]};
}
function ringState(r){
 const t=r.trace.find(t=>t.level===1&&t.attempt===11);if(!t)return null;
 return {gear:t.state.gear.filter(x=>['ring1','ring2'].includes(x.slot)),stats:t.stats,status:t.status,investments:t.investments,commitment:t.commitment??null,remainingRingOffers:t.ringOffers||[]};
}
function recommendation(arms){
 const b=arms.B;
 const eligible=['G','H','I'].filter(k=>{
  const c=arms[k];
  const betterIdentity=pct(c.weaponMatched,c.weaponObserved)>=pct(b.weaponMatched,b.weaponObserved)&&pct(c.armorMatched,c.armorObserved)>=pct(b.armorMatched,b.armorObserved);
  const improvement=c.endLevelMean>b.endLevelMean||c.clearedE10>b.clearedE10||pct(c.weaponMatched,c.weaponObserved)-pct(b.weaponMatched,b.weaponObserved)>=.5||pct(c.armorMatched,c.armorObserved)-pct(b.armorMatched,b.armorObserved)>=.5;
  return !c.errors&&!c.issues&&!c.invalidInvestments&&!c.earlyTimeouts&&c.stuckE1<=b.stuckE1&&c.reachedE5>=b.reachedE5&&c.reachedE10>=b.reachedE10&&c.clearedE10>=b.clearedE10&&c.endLevelMean>=b.endLevelMean&&betterIdentity&&improvement;
 });
 eligible.sort((x,y)=>arms[y].clearedE10-arms[x].clearedE10||arms[y].endLevelMean-arms[x].endLevelMean||arms[x].stuckE1-arms[y].stuckE1||x.localeCompare(y));
 return {recommended:eligible[0]||'B',eligible,scope:'provisional selected-seed decision; independent validation and approval required'};
}
function aggregate(){
 const read=(dir,i)=>JSON.parse(fs.readFileSync(dir+'/shard-'+i+'.json','utf8')),indices=Array.from({length:7},(_,i)=>i);
 const shards=indices.map(i=>read(out,i)),base=indices.map(i=>read('baseline',i)),full=indices.map(i=>read('previous',i));
 assert(shards.every((s,i)=>s.shard===i&&s.commit===shards[0].commit&&s.native===shards[0].native&&JSON.stringify(s.config)===JSON.stringify(A.config)&&JSON.stringify(s.arms)===JSON.stringify(ARMS)));
 assert(base.every((s,i)=>s.shard===i&&s.commit==='6ddb2ae7ca99148f10fd8d6201ef8a5bda649602'&&s.native===shards[0].native&&JSON.stringify(s.config)===JSON.stringify(A.config)&&s.arms.B.compat&&!s.arms.B.strict));
 assert(full.every((s,i)=>s.shard===i&&s.commit==='a0a1ca46d1a9de007aa3ec2008f40e5ace8c041a'&&s.native===shards[0].native&&JSON.stringify(s.config)===JSON.stringify(A.config)&&s.policy==='b12c4-v1'));
 const rows=shards.flatMap(s=>s.rows),prior=base.flatMap(s=>s.rows.filter(r=>r.arm==='B')),previous=full.flatMap(s=>s.rows);
 const all=[...prior,...previous,...rows],key=r=>r.id+'/'+r.seed+'/'+r.arm,map=new Map(all.map(r=>[key(r),r]));
 assert.equal(prior.length,56);assert.equal(previous.length,56);assert.equal(rows.length,171);assert.equal(map.size,283);
 const pairs=[];
 for(const p of selection.profiles)for(const pick of p.picks){
  const k=p.id+'/'+pick.seed,ring=RING_IDS.includes(p.id)&&pick.seed===RING_SEED;
  const cells=Object.fromEntries(['B','F','G','H','I',...(ring?['J']:[])].map(arm=>[arm,map.get(k+'/'+arm)]));assert(Object.values(cells).every(Boolean));
  const levels=Object.fromEntries(Object.entries(cells).map(([k,r])=>[k,r.endLevel]));
  const contrast=v=>({identity:((v.G-v.B)+(v.I-v.H))/2,hands:((v.H-v.B)+(v.I-v.G))/2,interaction:v.I-v.H-v.G+v.B});
  pairs.push({id:p.id,seed:pick.seed,levels,effects:contrast(levels),reachedE2:contrast(Object.fromEntries(Object.entries(levels).map(([k,v])=>[k,Number(v>=2)]))),reachedE10:contrast(Object.fromEntries(Object.entries(levels).map(([k,v])=>[k,Number(v>=10)]))),firstDifferences:Object.fromEntries(Object.entries(cells).filter(([k])=>k!=='B').map(([k,r])=>[k,first(cells.B,r)])),...(ring?{ringDiagnostic:Object.fromEntries(Object.entries(cells).map(([k,r])=>[k,ringState(r)]))}:{})});
 }
 const arms=Object.fromEntries(['B','F','G','H','I','J'].map(arm=>[arm,F.summarize(all.filter(r=>r.arm===arm))]));
 const progress=Object.fromEntries(['F','G','H','I'].map(k=>[k,{improved:pairs.filter(p=>p.levels[k]>p.levels.B).length,equal:pairs.filter(p=>p.levels[k]===p.levels.B).length,worse:pairs.filter(p=>p.levels[k]<p.levels.B).length}]));
 const effects=Object.fromEntries(['effects','reachedE2','reachedE10'].map(metric=>[metric,Object.fromEntries(['identity','hands','interaction'].map(k=>[k,sum(pairs,p=>p[metric][k])/pairs.length]))]));
 const gate={errors:sum(rows,r=>r.errors.length),issues:sum(rows,r=>r.issues.length),invalid:sum(rows,r=>r.invalid.length)};
 const summary={arms,progress,effects,gate,selection:Object.values(gate).some(n=>n>0)?{recommended:'B',reason:'technical gate failed'}:recommendation(arms)};
 write('summary.json',{baselineRun:45906458862,previousRun:45910259921,commit:shards[0].commit,native:shards[0].native,config:A.config,selection,summary,pairs});
 console.log('B12C5_OVERVIEW='+JSON.stringify(summary));
 for(const p of pairs)console.log('B12C5_PAIR='+JSON.stringify({id:p.id,seed:p.seed,levels:p.levels,effects:p.effects,firstDifferences:Object.fromEntries(Object.entries(p.firstDifferences).map(([k,v])=>[k,v?{level:v.level,attempt:v.attempt,kind:v.kind,commitment:v.commitment}:null])),...(p.ringDiagnostic?{ringDiagnostic:Object.fromEntries(Object.entries(p.ringDiagnostic).map(([k,v])=>[k,v?{status:v.status,defense:v.stats.defense,spellPower:v.stats.spellPower,rings:v.gear.map(x=>({slot:x.slot,name:x.name,stats:x.stats})),bought:v.investments.bought}:null]))}:{})}));
 if(Object.values(gate).some(n=>n>0))process.exitCode=1;
}
if(require.main===module){if(process.argv[2]==='aggregate')aggregate();else run(Number(process.argv[2]));}
module.exports={profile,recommendation,ARMS};
