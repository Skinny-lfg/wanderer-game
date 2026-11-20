'use strict';
// Stage 03: independently verify and aggregate 200 genuine E1→E20 accounts.
// Never treat unreached Expeditions as failures; never treat a runner error as
// a death or silently interpolate an unplayed E level.
const fs=require('node:fs'),path=require('node:path');
const S=require('./v013-stage03-run-seed.cjs');
const B=require('./v013-stage02-aggregate.cjs');
const sum=(xs,fn=x=>x)=>xs.reduce((n,x)=>n+(Number(fn(x))||0),0);
const mean=xs=>xs.length?Math.round(sum(xs)/xs.length*100)/100:null;
const median=B.median,p90=B.p90;
const group=xs=>Object.fromEntries([...new Set(xs)].sort().map(x=>[x,xs.filter(y=>y===x).length]));
const percent=(num,den)=>den?Math.round(10000*num/den)/100:null;
function ensure(cond,msg){if(!cond)throw Error('Stage 03 audit integrity: '+msg);}
function validateShard(d){
 const seed=d?.stage03?.seed;
 ensure(S.SEEDS.includes(seed),'unexpected seed '+seed);
 ensure(d.stage03?.stage==='main-200-account-E20-audit','missing Stage 03 identity');
 const cfg=d.settings||{};
 ensure(cfg.seeds?.length===1&&cfg.seeds[0]===seed,'seed mismatch '+seed);
 ensure(cfg.decisionModel==='adaptive'&&cfg.maxLevel===S.MAX_LEVEL&&
  cfg.maxAttempts===S.MAX_ATTEMPTS&&cfg.maxTotalAttempts===S.MAX_TOTAL_ATTEMPTS&&
  cfg.tickLimit===S.TICK_LIMIT,'policy, level or budgets mismatch '+seed);
 ensure(d.integrity?.noFabricatedXp&&d.integrity?.noForcedEquipment&&
  d.integrity?.noForcedEncounter&&d.integrity?.noForcedLevelUnlock&&
  d.integrity?.noDamageOverride,'native integrity flags missing '+seed);
 ensure(d.accounts?.length===10&&d.coverage?.accounts===10,'incomplete ten accounts '+seed);
 ensure(d.accounts.every(a=>a.seed===seed),'foreign account in '+seed);
 ensure(new Set(d.accounts.map(a=>a.profile)).size===10&&
  S.PROFILES.every(p=>d.accounts.some(a=>a.profile===p)),'missing/duplicate profile '+seed);
 ensure(sum(d.accounts,a=>a.attempts.length)===d.coverage.attempts,'coverage attempts '+seed);
 const gotErrors=d.accounts.flatMap(a=>a.attempts.filter(t=>t.status==='error'||t.error));
 ensure(gotErrors.length===d.coverage.errors,'coverage errors '+seed);
 for(const a of d.accounts){
  const id=seed+'/'+a.profile,cleared=new Set(),perLevel=new Map();
  ensure(a.startXp===0&&a.initialGear?.total>0&&
   a.initialGear?.total===a.initialGear?.starter,'not a fresh native account '+id);
  ensure(a.reached?.length&&a.reached[0]===1&&
   a.reached.every((E,i)=>E===i+1&&E<=20),'unearned Expedition reach '+id);
  ensure(a.attempts.length>0&&a.attempts.length<=S.MAX_TOTAL_ATTEMPTS,'attempt budget '+id);
  for(const t of a.attempts){
   ensure(Number.isInteger(t.level)&&t.level>=1&&t.level<=20&&
    a.reached.includes(t.level),'attempted locked Expedition '+id);
   const num=(perLevel.get(t.level)||0)+1;
   ensure(t.attempt===num&&num<=S.MAX_ATTEMPTS,'attempt order or budget '+id+' E'+t.level);
   perLevel.set(t.level,num);
   ensure(t.level===1||cleared.has(t.level-1),'skipped preceding Boss '+id+' E'+t.level);
   ensure(!cleared.has(t.level),'continued after native Boss win '+id+' E'+t.level);
   if(t.bossWon){
    ensure(t.status==='victory'&&t.after?.unlocked>=t.level+1,
     'synthetic Boss victory '+id+' E'+t.level);
    cleared.add(t.level);
   }else ensure(t.status!=='victory','undocumented Boss victory '+id+' E'+t.level);
   if(t.before&&t.after)ensure(t.after.xp>=t.before.xp,'XP decreased '+id+' E'+t.level);
  }
  ensure(a.endLevel===Math.max(0,...cleared)+1,'final unlocked E mismatch '+id);
  ensure(a.reached.length===Math.min(20,a.endLevel),'incomplete reached ledger '+id);
 }
 return true;
}
const HASH_FILES=Object.freeze([
 'scripts/v013-natural-progression.cjs','scripts/v013-agent-strategy.cjs',
 'scripts/v013-stage03-run-seed.cjs','scripts/v013-stage03-aggregate.cjs',
 'tests/v012-economy-harness.cjs','combat/v012-gear-stats.js'
]);
function verifyProvenance(dir,shards){
 let canonical=null;
 const revisions=new Set(),nodes=new Set();
 for(const d of shards){
  const seed=d.stage03.seed,file=path.join(dir,'raw-'+seed+'.provenance.txt');
  ensure(fs.existsSync(file),'missing provenance for '+seed);
  const lines=fs.readFileSync(file,'utf8').trim().split(/\r?\n/);
  const revision=lines.find(x=>x.startsWith('revision='))?.slice(9);
  const node=lines.find(x=>x.startsWith('node='))?.slice(5);
  const statedSeed=lines.find(x=>x.startsWith('seed='))?.slice(5);
  ensure(/^[0-9a-f]{40}$/.test(revision||'')&&Number(statedSeed)===seed,
   'invalid Git revision or seed tag '+seed);
  ensure(/^v\d+\.\d+\.\d+$/.test(node||''),'unknown Node version '+seed);
  revisions.add(revision);nodes.add(node);
  const hashes=Object.fromEntries(lines.map(line=>/^([0-9a-f]{64})\s+(\S+)$/.exec(line))
   .filter(Boolean).map(m=>[m[2],m[1]]));
  ensure(HASH_FILES.every(f=>/^[0-9a-f]{64}$/.test(hashes[f]||'')),
   'incomplete SHA manifest for '+seed);
  ensure(hashes['scripts/v013-natural-progression.cjs']===d.runnerSha256&&
   hashes['scripts/v013-agent-strategy.cjs']===d.agentStrategySha256,
   'claimed runner/agent hash differs from actual file '+seed);
  const selected=Object.fromEntries(HASH_FILES.map(f=>[f,hashes[f]]));
  if(canonical)ensure(JSON.stringify(selected)===JSON.stringify(canonical),
   'source file hash drift at '+seed);
  else canonical=selected;
 }
 ensure(revisions.size===1&&nodes.size===1,'mixed Git commits or Node patch versions');
 return {gitRevision:[...revisions][0],nodeVersion:[...nodes][0],
  fileSha256:canonical,integrity:'exact Git revision, Node patch version and native file hashes matched in all 20 shards'};
}
function audit(shards){
 ensure(shards.length===S.SEEDS.length,'expected exactly 20 seed shards; got '+shards.length);
 const seen=new Set(),sourceHashes=new Set(),runnerHashes=new Set(),
  agentHashes=new Set(),accounts=[];
 for(const d of shards){
  validateShard(d);
  const seed=d.stage03.seed;
  ensure(!seen.has(seed),'duplicate seed '+seed);
  seen.add(seed);
  sourceHashes.add(d.source);runnerHashes.add(d.runnerSha256);
  agentHashes.add(d.agentStrategySha256);
  accounts.push(...d.accounts);
 }
 ensure(S.SEEDS.every(seed=>seen.has(seed)),'missing scheduled seed');
 ensure(accounts.length===200,'not exactly 200 native accounts');
 ensure(new Set(accounts.map(a=>a.seed+'/'+a.profile)).size===200,'duplicate profile/seed account');
 ensure(runnerHashes.size===1&&agentHashes.size===1,'mixed agent or runner versions');
 const attempts=accounts.flatMap(a=>a.attempts);
 const rows=accounts.map(a=>B.accountRow(a));
 const errors=rows.flatMap(a=>a.errors);
 const byE=Array.from({length:20},(_,i)=>{
  const E=i+1,entrants=accounts.filter(a=>a.reached.includes(E)),
   clears=entrants.filter(a=>a.attempts.some(t=>t.level===E&&t.bossWon));
  const levelAttempts=attempts.filter(t=>t.level===E);
  const tries=clears.map(a=>a.attempts.find(t=>t.level===E&&t.bossWon).attempt);
  const bossRooms=levelAttempts.flatMap(t=>(t.rooms||[]).filter(r=>r.roomType==='boss'));
  return {E,entered:entrants.length,cleared:clears.length,
   notReached:accounts.length-entrants.length,
   conditionalClearPct:percent(clears.length,entrants.length),
   accountClearPct:percent(clears.length,accounts.length),
   attempts:levelAttempts.length,
   medianAttemptsToClear:median(tries),meanAttemptsToClear:mean(tries),
   p90AttemptsToClear:p90(tries),
   deaths:levelAttempts.filter(t=>t.status==='defeat').length,
   extractions:levelAttempts.filter(t=>t.status==='extracted').length,
   bossReached:levelAttempts.filter(t=>t.bossReached).length,
   bossFights:bossRooms.length,bossWins:bossRooms.filter(r=>r.won).length,
   bossHP:median(bossRooms.map(r=>r.hpMax).filter(Number.isFinite)),
   elites:sum(levelAttempts,t=>(t.rooms||[]).filter(r=>r.roomType==='elite').length),
   eliteWins:sum(levelAttempts,t=>(t.rooms||[]).filter(r=>r.roomType==='elite'&&r.won).length),
   gearUpgrades:sum(levelAttempts,t=>(t.equipped||[]).length+(t.camp?.equipped||[]).length),
   crafts:sum(levelAttempts,t=>(t.camp?.crafted||[]).length),
   potionUses:sum(levelAttempts,t=>t.potions?.length),
   talentResets:sum(levelAttempts,t=>t.camp?.resets?.length),
   nativeXpEarned:sum(levelAttempts,t=>t.xpEarned),
   errors:levelAttempts.filter(t=>t.status==='error'||t.error).length,
   endsAtThisE:rows.filter(a=>a.highestReached===E&&a.stopClass!=='completed_E20').length
  };
 });
 const milestones=Object.fromEntries([1,5,10,15,20].map(E=>{
  const reached=rows.filter(a=>a.highestReached>=E),won=rows.filter(a=>a.highestCleared>=E);
  const triesReach=accounts.filter(a=>a.reached.includes(E)).map(a=>
   a.attempts.filter(t=>t.level<E).length);
  const triesClear=accounts.filter(a=>a.attempts.some(t=>t.level===E&&t.bossWon)).map(a=>
   a.attempts.filter(t=>t.level<=E).length);
  return ['E'+E,{reached:reached.length,cleared:won.length,
   medianAttemptsToReach:median(triesReach),p90AttemptsToReach:p90(triesReach),
   medianAttemptsToClear:median(triesClear),p90AttemptsToClear:p90(triesClear)}];
 }));
 const profiles=Object.fromEntries(S.PROFILES.map(profile=>{
  const aa=rows.filter(a=>a.profile===profile),original=accounts.filter(a=>a.profile===profile);
  const totals=sum(aa,a=>a.totalAttempts);
  return [profile,{accounts:aa.length,attempts:totals,
   reached:Object.fromEntries([1,5,10,15,20].map(E=>['E'+E,aa.filter(a=>a.highestReached>=E).length])),
   cleared:Object.fromEntries([1,5,10,15,20].map(E=>['E'+E,aa.filter(a=>a.highestCleared>=E).length])),
   medianTriesToClearE1:median(original.filter(a=>a.attempts.some(t=>t.level===1&&t.bossWon))
    .map(a=>a.attempts.find(t=>t.level===1&&t.bossWon).attempt)),
   medianTotalTriesToClearE20:median(original.filter(a=>a.attempts.some(t=>t.level===20&&t.bossWon))
    .map(a=>a.attempts.filter(t=>t.level<=20).length)),
   medianTotalAttempts:median(aa.map(a=>a.totalAttempts)),
   failures:group(aa.map(a=>a.stopClass)),deaths:sum(aa,a=>a.deaths),
   extractions:sum(aa,a=>a.extractions),talentResets:sum(aa,a=>a.talentResets),
   crafts:sum(aa,a=>a.crafts),pivots:aa.filter(a=>a.pivoted).length,
   medianFinalXp:median(aa.map(a=>a.finalXp)),
   medianFinalNodes:median(aa.map(a=>a.finalNodes)),
   medianFinalGold:median(aa.map(a=>a.finalGold)),
   medianFinalFragments:median(aa.map(a=>a.finalFragments))}];
 }));
 const roles=attempts.flatMap(t=>(t.rooms||[]).filter(r=>r.capabilities)
  .map(r=>({damageMode:r.capabilities?.role||'unknown',
   affinityComposition:r.capabilities?.affinityComposition||'unobserved',
   synergyStage:r.capabilities?.synergyStage||'unobserved'})));
 const bossStyles=attempts.flatMap(t=>(t.rooms||[]).filter(r=>r.roomType==='boss')).reduce((acc,r)=>{
  const key=r.bossStyle||'unknown';const st=acc[key]||(acc[key]={fights:0,wins:0,deaths:0});
  st.fights++;if(r.won)st.wins++;if(r.died)st.deaths++;return acc;
 },{});
 const completed=rows.filter(a=>a.stopClass==='completed_E20');
 const result={stage:'03 — 200 persistent native E1–E20 accounts',settings:{
  seeds:[...S.SEEDS],profiles:[...S.PROFILES],accountsPerProfile:20,
  decisionPolicy:'adaptive',maxLevel:20,maxAttemptsPerLevel:18,
  maxAttemptsPerAccount:360,nativeCombatTicks:12000},
  provenance:{engineSourceVariants:[...sourceHashes].sort(),runnerSha256:[...runnerHashes][0],
   agentStrategySha256:[...agentHashes][0]},
  coverage:{accounts:accounts.length,shards:shards.length,
   attempts:attempts.length,errors:errors.length,
   reachedE20:milestones.E20.reached,clearedE20:milestones.E20.cleared,
   stops:group(rows.map(a=>a.stopClass)),
   highestReached:Math.max(...rows.map(a=>a.highestReached)),
   highestCleared:Math.max(...rows.map(a=>a.highestCleared))},
  milestones,perExpedition:byE,profiles,accounts:rows,
  observedCombat:{mode:group(roles.map(r=>r.damageMode)),
   affinityComposition:group(roles.map(r=>r.affinityComposition)),
   synergyStage:group(roles.map(r=>r.synergyStage)),bossStyles},
  completedE20:{count:completed.length,
   medianCumulativeAttempts:median(completed.map(a=>a.totalAttempts)),
   p90CumulativeAttempts:p90(completed.map(a=>a.totalAttempts))},
  errors,limitations:[
   'These are deterministic policy agents, not a statistical sample of human players.',
   'Each E only describes accounts that unlocked it; unobserved E levels are censored, not lost.',
   'Median attempts to win a level uses only accounts that won within 18 attempts.',
   'Stopped after 18 attempts or 360 total is a limited-policy result, not proof of impossible builds.',
   'Same seed across distinct profiles does not keep subsequent gear/room RNG matched after decisions diverge.',
   'Every E requires a real Boss win; no synthetic XP, unlocked levels, gear or forced combats.'
  ]};
 return result;
}
function markdown(r){
 const l=['# Wanderer v0.13 — Auditoria principal: 200 contas até E20','',
  '**Progressão natural, persistência nativa dentro de cada conta; sem alterações ao balanceamento.**','',
  'Contas: **'+r.coverage.accounts+'** · Tentativas: **'+r.coverage.attempts+
  '** · Erros: **'+r.coverage.errors+'** · Boss E20 derrotado: **'+r.coverage.clearedE20+
  '/200**.','',
  'Versão: '+r.provenance.gitRevision+' · Node '+r.provenance.nodeVersion+' · 20 lotes verificados.','',
  '## Milestones',
  '| Objetivo | Chegaram | Boss derrotado | Mediana tentativas acumuladas até chegar | P90 até chegar | Mediana até derrotar | P90 até derrotar |',
  '|---|---:|---:|---:|---:|---:|---:|',
  ...Object.entries(r.milestones).map(([k,s])=>'| '+k+' | '+s.reached+' | '+s.cleared+
   ' | '+(s.medianAttemptsToReach??'—')+' | '+(s.p90AttemptsToReach??'—')+
   ' | '+(s.medianAttemptsToClear??'—')+' | '+(s.p90AttemptsToClear??'—')+' |'),
  '','## Dificuldade observada por Expedition',
  '| E | Entraram | Venceram | Taxa dos que entraram | Tentativas | Mediana para vencer E | P90 | Mortes | Extrações | Erros |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
  ...r.perExpedition.map(x=>'| E'+x.E+' | '+x.entered+' | '+x.cleared+' | '+
   (x.conditionalClearPct===null?'Não observado':x.conditionalClearPct+'%')+' | '+
   x.attempts+' | '+(x.medianAttemptsToClear??'—')+' | '+
   (x.p90AttemptsToClear??'—')+' | '+x.deaths+' | '+x.extractions+' | '+x.errors+' |'),
  '','## 20 contas por perfil',
  '| Perfil | E1 vencido | E5 alcançado | E10 alcançado | E15 alcançado | E20 alcançado | E20 vencido | Tentativas totais |',
  '|---|---:|---:|---:|---:|---:|---:|---:|',
  ...Object.entries(r.profiles).map(([p,s])=>'| '+p+' | '+s.cleared.E1+
   ' | '+s.reached.E5+' | '+s.reached.E10+' | '+s.reached.E15+
   ' | '+s.reached.E20+' | '+s.cleared.E20+' | '+s.attempts+' |'),
  '','## Contas individuais',
  '| Seed | Perfil | E mais alto alcançado | E mais alto derrotado | Tentativas | Situação final |',
  '|---:|---|---:|---:|---:|---|',
  ...r.accounts.map(a=>'| '+a.seed+' | '+a.profile+' | E'+a.highestReached+
   ' | '+(a.highestCleared?'E'+a.highestCleared:'—')+
   ' | '+a.totalAttempts+' | '+a.stopClass+' |'),
  '','## Limitações',...r.limitations.map(x=>'- '+x),
  '','As sequências completas de salas, talentos, recompensas, recursos, combate e derrotas estão nos 20 artefactos JSON originais, agrupados por semente.',''];
 return l.join('\n');
}
function main(args=process.argv.slice(2)){
 const dir=path.resolve(args[0]||'reports/stage03');
 const dest=path.resolve(args[1]||'reports/stage03/stage03-200-accounts.json');
 const names=fs.readdirSync(dir).filter(f=>/^raw-\d+\.json$/.test(f)).sort();
 const shards=names.map(name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8')));
 const result=audit(shards);
 Object.assign(result.provenance,verifyProvenance(dir,shards));
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(result)+'\n');
 console.log('STAGE03_FINAL='+JSON.stringify({coverage:result.coverage,
  milestones:result.milestones,
  perE:result.perExpedition.map(r=>({E:r.E,entered:r.entered,cleared:r.cleared,
   attempts:r.attempts,medianTries:r.medianAttemptsToClear,errors:r.errors})),
  profiles:Object.fromEntries(Object.entries(result.profiles).map(([k,v])=>[k,{
   reached:v.reached,cleared:v.cleared,attempts:v.attempts}])),
  provenance:result.provenance.gitRevision}));
 if(result.coverage.errors)process.exitCode=1;
 return result;
}
if(require.main===module)main();
module.exports={validateShard,verifyProvenance,audit,markdown,main,percent,median,p90};
