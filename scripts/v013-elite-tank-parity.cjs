'use strict';
// Stage 9.5: controlled 1v1 comparison of a real Aegis/etc roster Tank and a
// real randomly rolled Elite from the SAME seed and player loadout.
// This is a diagnostic fixture, NOT an earned-account E1-E8 progression rate.
// Only the first-ring selected encounter type is changed in this script.
const fs=require('node:fs'),path=require('node:path');
const create=require('../tests/v012-economy-harness.cjs');
const N=require('./v013-natural-progression.cjs');
const SOURCE=N.run; // Reuse the same delayed native target policy, not a new combat engine.
void SOURCE;
function scenario(seed,type,gear='starter',opts={}){
 const a=create(seed,undefined,{}, {skipPersistence:true,now:1720000000000+seed});
 if(gear==='common')a.setup(1,'Sword','Common'); // Explicit controlled gear, never used in natural campaign.
 const gearFingerprint=JSON.stringify(a.state().equip);
 const statsBefore=a.vitals();
 a.start(1,true);
 const c=a.controller(),g=c.state;
 if(!g.dungeon?.cards?.[0])throw Error('Native E1 cards missing');
 const card=g.dungeon.cards[0];c.chooseRealm(card.id);
 if(!c.visitRoom(1))throw Error('Native first-ring combat room inaccessible');
 if(g.selected?.node!==1||g.selected?.boss)throw Error('Expected normal room 1');
 if(type==='elite')g.selected.elite=true; // Controlled fixture, NOT natural map placement.
 g.selected.mobCount=1;g.selected.escorts=0;
 if(!a.enter())throw Error('Native entry failed');
 const r=a.state().run,leader=r?.encounterLeader||r?.enemy;
 if(!r||r.status!=='fight'||!leader)throw Error('Native first-ring combat missing');
 if(type==='tank'&&leader.miniboss)throw Error('Tank fixture unexpectedly Elite');
 if(type==='elite'&&!leader.miniboss)throw Error('Elite fixture failed to spawn Elite');
 const before={hp:leader.maxhp,atk:leader.atk,def:leader.def,barrier:leader.barrier||0,
  attackEvery:leader.attackEvery,role:leader.role,eliteType:leader.eliteType||null,
  name:leader.name,stage82:!!leader.stage82,stage81:!!leader.stage81,
  playerHp:r.hp,playerMaxHp:r.maxhp,playerDefense:r.stats?.defense??null};
 const fight=N.fightNatural(a,N.PROFILES.balanced,opts.tickLimit||4500);
 return {seed,type,gear,family:card.family,gearFingerprint:gearFingerprint===JSON.stringify(a.state().equip),
  identicalBaseVitals:statsBefore.maxhp===a.baseStats().maxhp,initial:before,
  ...fight,won:!!fight.won,enemyAbilityCasts:fight.enemyAbilityCasts||0,
  hpLossFraction:Number(((before.playerHp-fight.hpEnd)/before.playerMaxHp).toFixed(3))};
}
function compare(opts={}){
 const cfg={seedStart:opts.seedStart??9300,scan:opts.scan??180,
  pairCap:opts.pairCap??30,tickLimit:opts.tickLimit??4500};
 const gearModes=opts.gearModes||['starter','common'],pairs=[],errors=[];
 let skipped=0;
 for(const gear of gearModes){
  let count=0;
  for(let seed=cfg.seedStart;seed<cfg.seedStart+cfg.scan&&count<cfg.pairCap;seed++){
   try{
    const tank=scenario(seed,'tank',gear,cfg);
    if(tank.initial.role!=='tank'){skipped++;continue;} // Native roster role, never forced.
    const elite=scenario(seed,'elite',gear,cfg);
    if(tank.family!==elite.family||tank.initial.playerHp!==elite.initial.playerHp)
     throw Error('Controlled pair did not preserve same card and initial player HP');
    pairs.push({seed,gear,family:tank.family,tank,elite});
    count++;
   }catch(err){errors.push({seed,gear,error:err.stack||err.message});}
  }
 }
 const summary={};
 for(const gear of gearModes){
  const group=pairs.filter(p=>p.gear===gear);
  const mean=(role,metric)=>group.length?
   Number((group.reduce((n,p)=>n+(p[role][metric]||0),0)/group.length).toFixed(2)):null;
  const wins=role=>group.filter(p=>p[role].won).length;
  summary[gear]={pairs:group.length,tankWins:wins('tank'),eliteWins:wins('elite'),
   tankMeanSeconds:mean('tank','seconds'),eliteMeanSeconds:mean('elite','seconds'),
   tankMeanDamageTaken:mean('tank','damageTaken'),eliteMeanDamageTaken:mean('elite','damageTaken'),
   tankMeanAbilityCasts:mean('tank','enemyAbilityCasts'),
   eliteMeanAbilityCasts:mean('elite','enemyAbilityCasts'),
   tankMeanHpLoss:mean('tank','hpLossFraction'),eliteMeanHpLoss:mean('elite','hpLossFraction'),
   eliteTypes:Object.fromEntries([...new Set(group.map(x=>x.elite.initial.eliteType))].sort()
    .map(t=>[t,group.filter(x=>x.elite.initial.eliteType===t).length]))};
 }
 return {stage:'9.5',cohort:'controlled-matched-same-seed-single-tank-vs-single-elite',
  note:'Diagnostic only: forcibly swaps the first native room encounter to Elite; no natural player, no injected items, same native combat and RNG seed.',
  config:cfg,summary,errors,skippedNonTank:skipped,pairs};
}
function markdown(out){
 const lines=['# Wanderer — Stage 9.5 controlled E1 Tank vs Elite 1v1','',
  'Same seed, actual native E1 room, same player starting HP and gear; only the selected room encounter is changed. **Not a natural progression success rate.**','',
  '| Gear | Native Tank wins | Native Elite wins | Tank damage taken (mean) | Elite damage taken (mean) | Tank duration (mean) | Elite duration (mean) | Tank casts | Elite casts |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const [gear,r] of Object.entries(out.summary))lines.push(
  '| '+gear+' ('+r.pairs+' pairs) | '+r.tankWins+' | '+r.eliteWins+' | '+r.tankMeanDamageTaken+
  ' | '+r.eliteMeanDamageTaken+' | '+r.tankMeanSeconds+'s | '+r.eliteMeanSeconds+
  's | '+r.tankMeanAbilityCasts+' | '+r.eliteMeanAbilityCasts+' |');
 lines.push('','## Limitations','', '- The normal Tank is selected from the native seeded roster; the selected-room Elite flag is only a controlled fixture',
  '- Match starts before earning any loot/XP within the run. Both fight the same number of enemies at E1, with the same hero and seed.',
  '- Each paired fight consumes its own native encounter RNG; it is not a bitwise clone of combat RNG after the enemy archetype diverges',
  '- This is an adversarial direct-combat comparison, not a representative human playtest or a route/Boss balance estimate',
  '- Review the raw JSON for individual elite archetypes, deaths, abilities, health and duration',
  '', 'Errors: '+out.errors.length);
 return lines.join('\n')+'\n';
}
function main(args=process.argv.slice(2)){
 const opts={};for(const arg of args){
  const m=/^--(scan|pairs|seed-start|out)=(.+)$/.exec(arg);if(!m)throw Error('Unsupported option: '+arg);
  if(m[1]==='out')opts.out=m[2];else opts[m[1]==='seed-start'?'seedStart':m[1]==='pairs'?'pairCap':'scan']=Number(m[2]);
 }
 if(opts.scan!==undefined&&(!Number.isInteger(opts.scan)||opts.scan<1||opts.scan>800))throw Error('Invalid scan');
 if(opts.pairCap!==undefined&&(!Number.isInteger(opts.pairCap)||opts.pairCap<1||opts.pairCap>150))throw Error('Invalid pair cap');
 const report=compare(opts),dest=path.resolve(process.cwd(),opts.out||'reports/v013-stage95-elite-parity.json');
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(dest.replace(/\.json$/,'.md'),markdown(report));
 console.log('ELITE_TANK_1V1='+JSON.stringify({summary:report.summary,errors:report.errors.slice(0,3),skippedNonTank:report.skippedNonTank}));
 if(report.errors.length||Object.values(report.summary).some(x=>x.pairs<5))process.exitCode=1;
 return report;
}
module.exports={scenario,compare,markdown,main};
if(require.main===module)main();
