'use strict';
// Stage 6.24A: read-only E1-E5 calibration of all enemy roles and real players.
// This is a foundation audit, NOT yet the future replacement scaling formula.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const N=require('./v013-natural-progression.cjs');
const S=require('./simulate-progression.cjs');
// The simulator uses this inside its isolated VM; the read-only curve auditor
// loads the same canonical pure helper into Node for numeric inspection.
require('../combat/v012-combat-core.js');
const C=require('./v013-stage623-earned-matched-enemies.cjs');
const levels=[1,2,3,4,5];
const traceLevels=[1,2,3,4,5,6,10,14,15,16,20,34,35,36,50,69,70,71,100,200];
const profiles=['cautious','balanced','smart-blood-fury-vitality'];
const groups=[3,6,12];
const root=path.resolve(__dirname,'..');
function sha(obj){
 const source=typeof obj==='string'?obj:JSON.stringify(obj);
 return crypto.createHash('sha256').update(source).digest('hex');
}
function median(arr){
 const a=arr.filter(Number.isFinite).sort((x,y)=>x-y);
 if(!a.length)return null;
 const mid=Math.floor(a.length/2);
 return a.length%2?a[mid]:(a[mid-1]+a[mid])/2;
}
function pct(w,n){return n?Number((w/n*100).toFixed(1)):null;}
function safety(p){
 if(typeof p!=='string'||!p.startsWith('reports/')||!p.endsWith('.json')||p.includes('..'))throw Error('Unsafe Stage 6.24 output path');
 return p;
}
function parse(args){
 const options={mode:'cohort',seed:9701,out:'reports/v013-stage624-seed9701.json',inputs:null};
 for(const arg of args){
  const m=/^--([a-z-]+)=(.+)$/.exec(arg);
  if(!m)throw Error('Invalid Stage 6.24 option');
  if(m[1]==='mode')options.mode=m[2];
  else if(m[1]==='seed')options.seed=Number(m[2]);
  else if(m[1]==='out')options.out=m[2];
  else if(m[1]==='inputs')options.inputs=m[2];
  else throw Error('Unsupported Stage 6.24 option '+m[1]);
 }
 safety(options.out);
 if(!['cohort','aggregate'].includes(options.mode))throw Error('Invalid mode');
 if(options.mode==='cohort'&&(!Number.isInteger(options.seed)||options.seed<1||options.seed>10000000))throw Error('Invalid seed');
 if(options.mode==='aggregate'&&(!options.inputs||!options.inputs.startsWith('reports/')||options.inputs.includes('..')))throw Error('Invalid inputs directory');
 return options;
}
function formulas(){
 const progress=globalThis.WandererExpeditionProgression;
 const core=globalThis.WandererV012CombatCore;
 const elite=globalThis.WandererV013EliteAbilities;
 const boss=globalThis.WandererV013BossAbilities;
 if(!progress||!core||!elite||!boss)throw Error('Missing native scaling runtime');
 const files=['combat/expedition-progression.js','combat/v012-combat-core.js',
  'combat/v012-combat-runtime.js','online/v013-elite-abilities.js',
  'online/v013-boss-abilities.js','online/v013-enemy-roster.js',
  'economy/v013-gear-rolls.js','combat/v012-gear-stats.js',
  'combat/talent-graph-runtime.js'];
 const source={native:S.sourceFingerprint().sha256};
 for(const file of files)source[file]=sha(fs.readFileSync(path.resolve(root,file),'utf8'));
 const rows=[];
 for(const level of traceLevels){
  const namedElites={};
  for(const id of C.ELITES)namedElites[id]=progress.enemyScaling(level,'elite',id);
  const namedBosses={};
  for(const value of Object.values(boss.PROFILES)){
   namedBosses[value.id]=progress.enemyScaling(level,'boss',value.style);
  }
  rows.push({level,reference:progress.enemyReference(level),
   gearTier:progress.gearTier(level).id,normalBase:core.estimateEnemy(level,1),
   eliteBase:core.estimateEnemy(level,4),
   eliteExtras:namedElites,bossExtras:namedBosses});
 }
 return {source,rows,gearTierThresholds:[1,5,15,35,70]};
}
function checkpoint({a,seed,profile,level,attempt}){
 if(level<1||level>5||attempt!==1)return null;
 const s=a.state();
 const t=s.automaticTalents;
 const gear=N.gearSnapshot(a);
 const stats=a.baseStats();
 if(a.controller().state.unlocked!==level||!a.talents.valid(t))throw Error('Not a legitimately unlocked native Camp');
 if(!s.equip.weapon||!Array.isArray(s.runes)||!Array.isArray(s.runeSlots))throw Error('Invalid native gear');
 for(const id of s.runeSlots)if(id!=null&&!s.runes.some(r=>r.id===id))throw Error('Invalid equipped Rune ownership');
 const state={level,unlocked:level,equip:JSON.parse(JSON.stringify(s.equip)),
  automaticTalents:JSON.parse(JSON.stringify(t)),
  runes:JSON.parse(JSON.stringify(s.runes)),runeSlots:JSON.parse(JSON.stringify(s.runeSlots))};
 const player={};
 for(const key of ['maxhp','attack','defense','spellPower','power']){
  player[key]=Number.isFinite(stats[key])?stats[key]:null;
 }
 if(!player.maxhp||!player.attack||!Number.isFinite(player.power))throw Error('Invalid native derived player attributes');
 return {state,player,seed,level,attempt,profileName:profile.name,
  talentsEarned:a.talents.earned(t),equipmentPieces:gear.total,
  remainingStarter:gear.starter,initialWeapon:s.equip.weapon.subtype,
  nativeCampDigest:sha({state}),gearFingerprint:sha(state.equip)};
}
function progress(seed){
 const plan=N.parseArgs(['--seeds='+seed,'--profiles='+profiles.join(','),
  '--max-level=5','--max-attempts=12','--max-total-attempts=60',
  '--out=reports/v013-stage624-progress.json']);
 const collected=new Map();
 const n=N.run(plan,{onCamp:point=>{
  const snap=checkpoint(point);
  if(!snap)return;
  const id=point.seed+'|'+point.profile.name+'|E'+point.level;
  if(collected.has(id))throw Error('Duplicate earned Camp state');
  collected.set(id,snap);
 }});
 if(n.coverage.errors){
  const errors=[];
  for(const ac of n.accounts)for(const t of ac.attempts){
   if(t.error)errors.push({seed:ac.seed,profile:ac.profile,E:t.level,error:t.error});
  }
  throw Error('Natural account runner errors: '+JSON.stringify(errors));
 }
 const accounts=[];
 const snapshots=[];
 for(const ac of n.accounts){
  const levelsOfAccount={};
  for(const E of levels){
   const attempts=ac.attempts.filter(x=>x.level===E);
   levelsOfAccount[E]={
    attempts:attempts.length,
    bossEntered:attempts.filter(x=>x.bossReached).length,
    bossWon:attempts.filter(x=>x.bossWon).length,
    deaths:attempts.filter(x=>x.status==='defeat').length,
    extractions:attempts.filter(x=>x.status==='extracted').length};
   const first=attempts.find(x=>x.attempt===1);
   if(!first)continue;
   const key=seed+'|'+N.PROFILES[ac.profile].name+'|E'+E;
   const snap=collected.get(key);
   if(!snap||first.before.unlocked!==E||
    first.before.xp!==snap.state.automaticTalents.xp||
    first.before.gear.total!==snap.equipmentPieces||
    JSON.stringify(first.before.talentNodes)!==JSON.stringify(snap.state.automaticTalents.nodes))
    throw Error('Real Camp and natural attempt mismatch '+key);
   snapshots.push({...snap,profile:ac.profile,checkpointKey:seed+'|'+ac.profile+'|E'+E});
  }
  accounts.push({seed:ac.seed,profile:ac.profile,reached:ac.reached,
   levels:levelsOfAccount,attempts:ac.attempts.length});
 }
 if(new Set(snapshots.map(x=>x.checkpointKey)).size!==snapshots.length)throw Error('Duplicate earned snapshots');
 return {source:n.source,accounts,snapshots,attempts:n.coverage.attempts};
}
function groupFight(snap,arenaSeed,count,tank){
 const r=S.encounter(snap.level,C.model(snap),arenaSeed,'normal',
  C.options(snap,'normal'),undefined,undefined,undefined,1,count);
 const checks={
  gear:r.gearFingerprint===tank.gearFingerprint,
  talents:JSON.stringify(r.controlledTalentNodes)===JSON.stringify(tank.talentNodes),
  realm:r.affinity===tank.affinity&&r.risk===tank.risk&&r.resolvedSeed===tank.resolvedSeed,
  condition:r.plannedConditionId===tank.conditionId,
  playerVitals:r.hpStart===tank.hpStart&&r.hpMax===tank.hpMax&&
   r.mpStart===tank.mpStart&&r.mpMax===tank.mpMax,
  native:r.nativeEncounter==='normal'&&r.initialEnemies===count,
  finished:!r.timedOut&&(r.won||r.died)
 };
 if(Object.values(checks).some(x=>!x))throw Error('Unmatched native group '+snap.level+'/'+count+': '+JSON.stringify(checks));
 return {won:r.won,died:r.died,damageTaken:r.damageTaken,roles:r.initialRoles,checks};
}
function cohort(seed){
 const model=formulas(),nat=progress(seed);
 if(model.source.native!==nat.source)throw Error('Native fingerprint mismatch');
 const rows=[];
 for(const s of nat.snapshots){
  const matched=C.series({...s,sourceTrialRealm:null,sourceTrialRisk:null});
  const groupResults={};
  for(const count of groups)groupResults[count]=groupFight(s,matched.arenaSeed,count,matched.native.tank);
  rows.push({checkpointKey:s.checkpointKey,level:s.level,profile:s.profile,
   player:s.player,matched,groups:groupResults});
 }
 return {stage:'6.24A',mode:'cohort',seed,source:catSource(model),
  model,accounts:nat.accounts,snapshots:nat.snapshots,rows,
  coverage:{accounts:nat.accounts.length,checkpoints:rows.length,fights:rows.length*13,
   attempts:nat.attempts,errors:0}};
}
function catSource(model){return model.source.native;}
function outcomes(arr){
 const wins=arr.filter(x=>x.win===true||x.won===true).length;
 return {n:arr.length,wins,winPct:pct(wins,arr.length),
  medianDamage:median(arr.map(x=>x.damageTaken))};
}
function summarize(rows,accounts){
 const result=[];
 for(const E of levels){
  const subset=rows.filter(x=>x.level===E);
  const matches=subset.map(x=>x.matched);
  const eliteRuns=[];
  for(const m of matches)for(const id of C.ELITES)eliteRuns.push(m.native.elites[id]);
  const byElite={};
  for(const id of C.ELITES)byElite[id]=outcomes(matches.map(m=>m.native.elites[id]));
  const bossByAffinity={};
  for(const aff of C.FAMILIES){
   const same=matches.filter(m=>m.nativeRealm===aff);
   bossByAffinity[aff]={n:same.length,wins:same.filter(m=>m.native.boss.win).length};
  }
  const natural={attempts:0,bossEntered:0,bossWon:0,deaths:0,extractions:0};
  for(const a of accounts)for(const key of Object.keys(natural))natural[key]+=a.levels[E][key];
  const byGroup={};
  for(const count of groups)byGroup[count]=outcomes(subset.map(x=>x.groups[count]));
  const player={};
  for(const key of ['maxhp','attack','defense','spellPower','power'])
   player[key]=median(subset.map(x=>x.player[key]));
  result.push({E,accounts:subset.length,player,
   talentNodes:median(matches.map(m=>m.spentTalents)),
   starterGear:median(matches.map(m=>m.remainingStarterEquipment)),
   natural,tank:outcomes(matches.map(m=>m.native.tank)),
   elites:outcomes(eliteRuns),boss:outcomes(matches.map(m=>m.native.boss)),
   eliteById:byElite,bossByAffinity,groups:byGroup});
 }
 return result;
}
function aggregate(shards){
 if(!shards.length)throw Error('Stage 6.24 needs shards');
 const first=shards[0],seeds=new Set(),keys=new Set();
 const accounts=[],snapshots=[],rows=[];
 for(const shard of shards){
  if(shard.stage!=='6.24A'||shard.mode!=='cohort'||shard.source!==first.source||
   sha(shard.model)!==sha(first.model)||seeds.has(shard.seed)||shard.coverage.errors)
   throw Error('Stage 6.24 wrong source or duplicate shard');
  seeds.add(shard.seed);
  accounts.push(...shard.accounts);
  for(const snap of shard.snapshots){
   if(keys.has(snap.checkpointKey))throw Error('Duplicated earned checkpoint');
   keys.add(snap.checkpointKey);snapshots.push(snap);
  }
  for(const r of shard.rows){
   if(!r.matched.samePlayerAndRealm)throw Error('Unmatched hero');
   for(const checks of Object.values(r.matched.checks)){
    if(Object.values(checks).some(x=>!x))throw Error('Unmatched Elite');
   }
   for(const g of Object.values(r.groups)){
    if(Object.values(g.checks).some(x=>!x))throw Error('Unmatched group');
   }
   rows.push(r);
  }
 }
 if(rows.length!==snapshots.length||new Set(rows.map(x=>x.checkpointKey)).size!==rows.length)
  throw Error('Missing E1-E5 scenario');
 return {stage:'6.24A',mode:'aggregate',source:first.source,model:first.model,
  accounts,snapshots,rows,
  coverage:{shards:shards.length,seeds:seeds.size,accounts:accounts.length,
   checkpoints:rows.length,fights:rows.length*13,errors:0,allMatched:true},
  byLevel:summarize(rows,accounts)};
}
function report(data){
 const a=['# Stage 6.24A — Baseline E1–E5: jogadores e TODOS os inimigos','',
  '**Auditoria nativa antes de alterar o escalamento.** Esta fase NÃO modifica o jogo.','',
  'Engine: '+data.source,'','Cobertura: '+JSON.stringify(data.coverage),'',
  '| E | Contas | Tentativas naturais | Boss natural V/E | HP jogador | ATK jogador | Talentos | Tank solo V/N | 8 Elites V/N | Boss não preparado V/N | Grupo 3 | Grupo 6 | Grupo 12 |',
  '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const x of data.byLevel){
  a.push('| E'+x.E+' | '+x.accounts+' | '+x.natural.attempts+
   ' | '+x.natural.bossWon+'/'+x.natural.bossEntered+
   ' | '+x.player.maxhp+' | '+x.player.attack+' | '+x.talentNodes+
   ' | '+x.tank.wins+'/'+x.tank.n+' | '+x.elites.wins+'/'+x.elites.n+
   ' | '+x.boss.wins+'/'+x.boss.n+' | '+x.groups[3].wins+'/'+x.groups[3].n+
   ' | '+x.groups[6].wins+'/'+x.groups[6].n+' | '+x.groups[12].wins+'/'+x.groups[12].n+' |');
 }
 for(const x of data.byLevel){
  a.push('','## E'+x.E+' — Elites, Bosses e jogador','',
   '| Elite | Vitórias/jogos do jogador | Dano recebido mediana |',
   '|---|---:|---:|');
  for(const id of C.ELITES){
   const r=x.eliteById[id];
   a.push('| '+C.ELITE_NAMES[id]+' | '+r.wins+'/'+r.n+' | '+r.medianDamage+' |');
  }
  a.push('','Bosses por Affinity: '+JSON.stringify(x.bossByAffinity),
   '','Stats do herói em Camp: '+JSON.stringify(x.player));
 }
 a.push('','## Fórmulas atuais e fronteiras','',
  '| E | Referência | HP base normal | ATK base normal | HP extra Gravecaller | HP extra The Gilded | HP Boss Rift | Gear tier |',
  '|---:|---:|---:|---:|---:|---:|---:|---|');
 for(const t of data.model.rows){
  a.push('| E'+t.level+' | '+t.reference.toFixed(3)+' | '+t.normalBase.hp+' | '+
   t.normalBase.atk+' | ×'+t.eliteExtras.gravecaller.hp.toFixed(3)+
   ' | ×'+t.eliteExtras.the_gilded.hp.toFixed(3)+
   ' | ×'+t.bossExtras.rift.hp.toFixed(3)+' | '+t.gearTier+' |');
 }
 a.push('','## Decisão de arquitetura',
  '','1. Validar primeiro E1, E2, E3, E4 e E5: solo, grupos, todos os oito Elites, Bosses que o Realm realmente gerar e builds/equipamento nativos.',
  '2. Corrigir HP/ATK/DEF e mecânicas BASE individualmente até a hierarquia Boss > Elite > Tank > normal ser razoável nos níveis iniciais.',
  '3. Só depois parametrizar UMA progressão contínua desde E1 para todos, substituindo as curvas Elite iniciadas em E6, e as correções Boss até E30.',
  '4. O crescimento dos jogadores não é só o E: é XP/Talents, raridade/afixos, gear tier E5/15/35/70, runas, Boons, potions e disponibilidade de recursos.',
  '5. Fazer regressões E5/E6, E14/E15/E16, E34/E35/E36, E69/E70/E71 e E100/E200. Não buffar apenas a partir de E6.',
  '6. Bosses sem preparação em arena não representam percentagens de vitórias naturais.',
  '','## Limitações',
  '','- Um único Boss por checkpoint é repetido como controlo nas comparações com oito Elites; não são oito Bosses independentes.',
  '- Apenas contas que legitimamente alcançaram cada E entram nos encontros emparelhados; as restantes são censuradas.',
  '- Grupos 3/6/12 têm papéis sorteados nativamente, e as arenas não incluem Boons nem potions.',
  '- A trajetória E6–E200 é um traçado de fórmulas nativas, NÃO um conjunto de jogadores que atingiram esses níveis.',
  '- Nenhuma alteração numérica de balanceamento foi introduzida nesta fase.','');
 return a.join('\n');
}
function main(args=process.argv.slice(2)){
 const p=parse(args);
 let data;
 if(p.mode==='cohort')data=cohort(p.seed);
 else{
  const dir=path.resolve(root,p.inputs);
  const files=fs.readdirSync(dir).filter(x=>/^v013-stage624-seed\d+\.json$/.test(x)).sort();
  if(!files.length)throw Error('Missing Stage 6.24 input shards');
  data=aggregate(files.map(x=>JSON.parse(fs.readFileSync(path.join(dir,x),'utf8'))));
 }
 const filepath=path.resolve(root,safety(p.out));
 fs.mkdirSync(path.dirname(filepath),{recursive:true});
 fs.writeFileSync(filepath,JSON.stringify(data,null,2)+'\n');
 if(data.mode==='aggregate')fs.writeFileSync(filepath.replace(/\.json$/,'.md'),report(data)+'\n');
 let summary;
 if(data.mode==='cohort')summary={seed:p.seed,coverage:data.coverage};
 else summary={source:data.source,coverage:data.coverage,levels:data.byLevel.map(x=>({
  E:x.E,n:x.accounts,hp:x.player.maxhp,attack:x.player.attack,
  talents:x.talentNodes,natural:x.natural,
  tank:x.tank.wins+'/'+x.tank.n,elite:x.elites.wins+'/'+x.elites.n,
  boss:x.boss.wins+'/'+x.boss.n,
  group3:x.groups[3].wins+'/'+x.groups[3].n,
  group6:x.groups[6].wins+'/'+x.groups[6].n,
  group12:x.groups[12].wins+'/'+x.groups[12].n,
  byElite:Object.fromEntries(C.ELITES.map(id=>[id,x.eliteById[id].wins+'/'+x.eliteById[id].n]))}))};
 console.log('STAGE624='+JSON.stringify(summary));
 return data;
}
module.exports={levels,traceLevels,profiles,groups,formulas,parse,checkpoint,progress,groupFight,cohort,outcomes,summarize,aggregate,report,main};
if(require.main===module){try{main();}catch(e){console.error('STAGE624_ERROR '+(e.stack||e));process.exitCode=1;}}
