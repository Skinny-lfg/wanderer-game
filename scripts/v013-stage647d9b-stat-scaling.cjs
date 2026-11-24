'use strict';
// Stage 6.47D.9B: isolated matched native combat; never write gameplay modules.
const fs=require('node:fs'),assert=require('node:assert/strict'),Module=require('node:module'),path=require('node:path');
const N=require('./v013-natural-progression.cjs'),D=require('./v013-stage628-postcap-difficulty.cjs'),S=require('./simulate-progression.cjs');
const A=require('./v013-stage647d9a-stat-scaling.cjs');
const MODES=['current','flat5-defense','percent-only','max-floor','hybrid-low'];
const LEVELS=[1,2,5,10,20,50,100,200];
const FILE='combat/v012-gear-stats.js',SOURCE=fs.readFileSync(FILE,'utf8');
const FIELDS={flatAttack:'attack',flatArmor:'defense',flatLife:'maxhp',flatSpell:'spellPower'};
function delta(n,k,base,mode){
 const f=n[k],t=k==='flatLife'?[5,8,12].indexOf(f):f-2;
 if(t<0||t>2)throw Error('Unexpected tier '+k+' '+f);
 const p=base*(k==='flatLife'?[.005,.0075,.01]:[.02,.03,.04])[t];
 const h=base*(k==='flatLife'?[.005,.0075,.01]:[.01,.015,.02])[t];
 if(mode==='current')return 0;
 if(mode==='flat5-defense')return k==='flatArmor'?5-f:0;
 if(mode==='percent-only')return base*[.02,.03,.04][t]-f;
 if(mode==='max-floor')return Math.max(f,p)-f;
 if(mode==='hybrid-low')return h;
 throw Error('Unknown candidate '+mode);
}
function replaceOnce(s,a,b){assert.equal(s.split(a).length,2,'Missing unique source anchor '+a);return s.replace(a,b);}
function gearSource(mode){
 if(mode==='current')return SOURCE;
 const anchor=' if(state?.automaticTalents?.nodes?.length&&root.WandererAutomaticTalents)root.WandererAutomaticTalents.apply(s,state.automaticTalents);';
 const extra=' if(state?.automaticTalents?.nodes?.length&&root.WandererAutomaticTalents){const T=root.WandererAutomaticTalents,rs=T.graphProgress(state.automaticTalents),base={...s},delta=('+delta.toString()+');for(const [k,dest] of Object.entries('+JSON.stringify(FIELDS)+'))for(const n of T.NODES)if(rs.ranks[n.id]&&n[k]>0)s[dest]+=delta(n,k,base[dest]||0,'+JSON.stringify(mode)+')*rs.ranks[n.id];}';
 return replaceOnce(SOURCE,anchor,extra+'\n'+anchor);
}
// Compile an isolated copy of the existing native simulator entry point. Only
// extend its already supported VM module-overrides map; no files on disk change.
function isolatedSimulator(){
 const filename=require.resolve('./simulate-progression.cjs'),source=fs.readFileSync(filename,'utf8');
 const patched=replaceOnce(source,'    const overrides={','    const overrides={\n      ...(opts.stage647d9bGearSource===undefined?{}:{"combat/v012-gear-stats.js":opts.stage647d9bGearSource}),');
 const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m._compile(patched,filename);return m.exports;
}
function selftest(){
 assert.equal(delta({flatArmor:3},'flatArmor',100,'max-floor'),0);
 assert.equal(delta({flatArmor:3},'flatArmor',200,'max-floor'),3);
 assert.equal(delta({flatLife:8},'flatLife',1000,'hybrid-low'),7.5);
 assert.equal(delta({flatArmor:3},'flatArmor',100,'flat5-defense'),2);
 for(const mode of MODES)new Function(gearSource(mode));
 assert.equal(typeof isolatedSimulator().encounter,'function');
 console.log('STAGE647D9B_SELFTEST_OK');
}
function runFight(sim,snap,sc,seed,mode){
 const opts=D.fixtures(snap);
 if(sc.type==='elite')opts.stage619EliteType=sc.id;
 opts.stage647d9bGearSource=gearSource(mode);
 return sim.encounter(snap.level,D.build(snap),seed,sc.type,opts,undefined,undefined,sc.realm,1,sc.type==='normal'?sc.size:undefined);
}
function compare(a,b){
 for(const k of ['gearFingerprint','otherGearFingerprint','resolvedSeed','affinity','risk','nativeEncounter','initialEnemies','eliteType','bossId','talentXp','pointsBudget','pointsSpent','controlledTalentNodes','roster'])
  assert.deepEqual(b[k],a[k],'Matched fixture drift '+k);
}
function cohort(profile,seed,maxLevel,trials,otherTrials){
 const cfg={profile,seed,maxLevel,maxAttempts:12,maxTotalAttempts:400,extraCheckpointLevels:LEVELS};
 const {account,checkpoints,nativeCombatTimeouts}=D.collect(cfg,{allowNativeCombatTimeouts:true});
 const sim=isolatedSimulator(),rows=[];
 for(const snap of checkpoints.filter(x=>LEVELS.includes(x.level))){
  const realm=D.scenarios(snap)[0].realm;
  const scenarios=[...[1,2,3,4,8,12].map(size=>({id:'group-'+size,type:'normal',size,realm})),...D.scenarios(snap).filter(x=>x.type!=='normal')];
  for(let i=0;i<(snap.level===10?trials:otherTrials);i++)for(const sc of scenarios){
   const fightSeed=6479001+seed*101+snap.level*283+i*37717;
   const original=D.native(snap,sc,fightSeed);
   const control=runFight(sim,snap,sc,fightSeed,'current');
   compare(original,control);assert.deepEqual(D.record(control),D.record(original),'Baseline native mismatch');
   const results={current:D.record(control)};
   for(const mode of MODES.slice(1)){
    const x=runFight(sim,snap,sc,fightSeed,mode);compare(control,x);results[mode]=D.record(x);
   }
   rows.push({E:snap.level,profile,seed:fightSeed,id:sc.id,type:sc.type,results});
  }
  console.log('CHECKPOINT='+JSON.stringify({E:snap.level,profile,rows:rows.length}));
 }
 const out={profile,seed,source:S.sourceFingerprint().sha256,endLevel:account.endLevel,checkpoints:checkpoints.filter(x=>LEVELS.includes(x.level)).map(x=>x.level),timeouts:nativeCombatTimeouts.length,rows};
 fs.mkdirSync('reports/stage647d9b',{recursive:true});fs.writeFileSync('reports/stage647d9b/'+profile+'-'+seed+'.json',JSON.stringify(out));console.log('COHORT='+JSON.stringify({...out,rows:rows.length}));
}
function aggregate(){
 const dir='reports/stage647d9b',shards=fs.readdirSync(dir).filter(x=>x.endsWith('.json')).map(x=>JSON.parse(fs.readFileSync(dir+'/'+x,'utf8')));
 assert.equal(new Set(shards.map(x=>x.source)).size,1);
 const rows=shards.flatMap(x=>x.rows);
 const mean=a=>a.length?a.reduce((n,v)=>n+v,0)/a.length:null;
 function summarize(sub){
  return Object.fromEntries(MODES.map(mode=>{const a=sub.map(x=>x.results[mode]),resolved=a.filter(x=>x.win||x.loss),wins=a.filter(x=>x.win).length;return [mode,{n:a.length,wins,losses:a.filter(x=>x.loss).length,timeouts:a.filter(x=>x.timeout).length,winPct:resolved.length?100*wins/resolved.length:null,meanDamage:mean(a.map(x=>x.damageTaken).filter(Number.isFinite)),meanSeconds:mean(a.map(x=>x.seconds).filter(Number.isFinite)),meanRemainingHP:mean(a.filter(x=>x.win&&x.hpMax>0).map(x=>100*x.hpEnd/x.hpMax)),pairedWinDelta:mean(sub.map(r=>Number(r.results[mode].win)-Number(r.results.current.win)))}];}));
 }
 const levels=LEVELS.map(E=>{const a=rows.filter(x=>x.E===E);return {E,accounts:shards.filter(x=>x.checkpoints.includes(E)).length,scenarios:a.length,byType:Object.fromEntries(['normal','elite','boss'].map(t=>[t,summarize(a.filter(x=>x.type===t))])),byEnemy:Object.fromEntries([...new Set(a.map(x=>x.id))].map(id=>[id,summarize(a.filter(x=>x.id===id))])),byProfile:Object.fromEntries([...new Set(a.map(x=>x.profile))].map(p=>[p,summarize(a.filter(x=>x.profile===p))]))};});
 const result={stage:'6.47D.9B',sources:[...new Set(shards.map(x=>x.source))],accounts:shards.map(({rows,...x})=>x),matchedScenarios:rows.length,nativeFights:rows.length*(MODES.length+1),levels};
 fs.writeFileSync('reports/v013-stage647d9b-stat-scaling.json',JSON.stringify(result,null,2));console.log('STAGE647D9B='+JSON.stringify({...result,levels:levels.map(({byEnemy,byProfile,...x})=>x)}));
}
if(require.main===module){const [cmd,p,s,m,t,o]=process.argv.slice(2);if(cmd==='selftest')selftest();else if(cmd==='cohort')cohort(p,+s,+m,+t,+o);else if(cmd==='aggregate')aggregate();else throw Error('Unknown mode');}
