'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/v013-combat-balance-audit.cjs');

function combat(extra={}){
 return {mode:'elites',kind:'elite',level:1,build:'blood-fury',seed:9301,
  resolvedSeed:9301,affinity:'decay',risk:0,eliteType:'vampire',
  targetPolicy:'mechanics',pointsBudget:0,gearRarity:'Common',gearE:1,
  gearFingerprint:'fixed-native-item-rolls',
  nativeEncounter:'elite',runes:false,groupSize:1,won:true,died:false,
  status:'cleared',seconds:20,damageTaken:30,damageDealt:60,
  hpStart:100,hpEnd:70,hpMax:100,mpMax:0,minHpPct:70,
  enemyAbilityCasts:2,...extra};
}
function duel(seed,type='vampire',gear='starter'){
 const stats={playerHp:100,playerMaxHp:100,playerDefense:5};
 return {seed,gear,family:'blood',
  tank:{seed,gear,gearFingerprint:true,initial:{role:'tank',...stats},
   won:true,died:false,seconds:40,damageTaken:15,hpLossFraction:.15},
  elite:{seed,gear,gearFingerprint:true,initial:{role:'miniboss',eliteType:type,...stats},
   won:false,died:true,seconds:29,damageTaken:100,hpLossFraction:1}};
}
test('bounded CLI validates native matrix and explicit behavior policies',()=>{
 const c=A.parseArgs(['--seeds=1,2','--builds=blood-fury','--affinities=aegis,blood',
  '--risks=0,1','--group-sizes=3','--policies=focus,mechanics','--points=0',
  '--rarity=Common','--pairs=2','--scan=20']);
 assert.equal(c.planned,2*1*2*(2*2+1+1));
 assert.deepEqual(c.policies,['focus','mechanics']);
 for(const args of [
  ['--seeds=NaN'],['--points=101'],['--policies=perfect'],['--pairs=0'],
  ['--scan=801'],['--pairs=40','--scan=20'],['--natural=yes'],
  ['--levels=0'],['--out=unsafe.txt'],['--wrong=1']
 ])assert.throws(()=>A.parseArgs(args),args.join(' '));
});
test('Wilson bounds keep 0/5 and 5/5 uncertain rather than certain',()=>{
 assert.equal(A.wilson(0,0),null);
 assert(A.wilson(0,5)[1]>0);
 assert(A.wilson(5,5)[0]<100);
 assert.deepEqual(A.wilson(3,6),[18.8,81.2]);
 assert.equal(A.percentile([10,20,30,40],.5),25);
});
test('native duplicate resolved seeds do not inflate survival or sample size',()=>{
 const rows=[combat(),combat({seed:9302,resolvedSeed:9301,won:false,died:true,status:'died',
  damageTaken:90}),combat({seed:9303,resolvedSeed:9303,won:false,died:true,status:'died',
  damageTaken:100}),combat({seed:9304,resolvedSeed:9304,won:false,died:false,
  timedOut:true,status:'timeout'}),combat({seed:9305,error:'native crash',won:false})];
 const [g]=A.controlledGroups(rows);
 assert.equal(g.attempted,5);assert.equal(g.validAttempts,3);
 assert.equal(g.independent,2);assert.equal(g.duplicateSeeds,1);
 assert.equal(g.wins,1);assert.equal(g.deaths,1);
 assert.equal(g.errors,1);assert.equal(g.timeouts,1);
 assert.equal(g.winPct,50);
 assert.equal(g.damageTakenMean,65);
 assert(g.flags.includes('duplicate_native_seed'));
 assert(g.flags.includes('insufficient_independent_sample'));
});
test('unobserved archetype is explicitly missing; paired deltas have real controls',()=>{
 const p=A.pairedGroups({pairs:[duel(1),duel(2,'gravecaller')],errors:[],skippedNonTank:5});
 const all=p.groups.find(x=>x.gear==='starter'&&x.eliteType==='all');
 const v=p.groups.find(x=>x.gear==='starter'&&x.eliteType==='vampire');
 const absent=p.groups.find(x=>x.gear==='starter'&&x.eliteType==='berserker');
 assert.equal(p.matched,2);assert.equal(all.tankWins,2);assert.equal(all.eliteWins,0);
 assert.equal(all.discordantTankWinOnly,2);
 assert.equal(all.extraEliteDamageMean,85);
 assert.equal(v.pairs,1);assert.equal(absent.pairs,0);
 assert(absent.flags.includes('unobserved_archetype'));
 assert.equal(all.extraEliteDamageBootstrap95,null);
});
test('invalid controlled Tank vs Elite pairs fail integrity instead of being silently used',()=>{
 const bad=duel(3);bad.elite.initial.playerHp=99;
 const p=A.pairedGroups({pairs:[bad],errors:[{seed:7,error:'fixture'}]});
 assert.equal(p.matched,0);assert.equal(p.invalidPairs.length,1);
 assert.equal(p.sourceErrors.length,1);
});
test('baseline comparison is matched on native seed, loadout dimensions and actual result',()=>{
 const before=combat();
 const now=combat({damageTaken:60,seconds:28,won:false,died:true,status:'died'});
 const old={schemaVersion:1,controlled:{rows:[before]},settings:{test:1},sourceSha256:'old'};
 const current={schemaVersion:1,controlled:{rows:[now]},settings:{test:1},sourceSha256:'new'};
 const match=A.compareBaseline(current,old);
 assert.equal(match.matched,1);assert.equal(match.unmatched,0);
 assert.equal(match.byMode.elites.winDeltaPct,-100);
 assert.equal(match.byMode.elites.damageTakenDeltaMean,30);
 assert.equal(match.byMode.elites.secondsDeltaMean,8);
 assert.equal(match.comparableEquipment,1);
 const shift=A.compareBaseline({...current,controlled:{rows:[{...now,resolvedSeed:9307}]}},old);
 assert.equal(shift.matched,0);assert.equal(shift.unmatched,1);
 const stats=A.compareBaseline({...current,controlled:{rows:[{...now,hpMax:140}]}},old);
 assert.equal(stats.comparablePlayerHpAndMp,0);
 assert(stats.warnings.includes('native_player_vitals_changed'));
 const gear=A.compareBaseline({...current,controlled:{rows:[{...now,gearFingerprint:'changed-rolls'}]}},old);
 assert.equal(gear.comparableEquipment,0);
 assert.equal(gear.equipmentChanged,1);
 assert(gear.warnings.includes('native_equipment_fingerprint_changed'));
});
test('unit-sized audit uses isolated native input modes and exposes missing coverage honestly',()=>{
 const cfg=A.parseArgs(['--seeds=1','--builds=blood-fury','--affinities=blood',
  '--risks=0','--group-sizes=3','--pairs=1','--scan=10']);
 const simulate=opts=>{
  const kind=opts.mode==='bosses'?'boss':opts.mode==='enemies'?'normal':'elite';
  return {sourceSha256:'test-source',rows:[combat({mode:opts.mode,kind,
   seed:1,resolvedSeed:1,bossAffinity:kind==='boss'?'blood':null,
   bossStyle:kind==='boss'?'leech':null,affinity:'blood',
   risk:0,groupSize:opts.mode==='enemies'?3:1,
   nativeEncounter:kind,eliteType:kind==='elite'?'vampire':null})],summary:{errors:0}};
 };
 const result=A.run(cfg,{simulate,compare:()=>({pairs:[],errors:[],skippedNonTank:3}),
  fingerprint:()=>({sha256:'test-source',files:['index.html']}),
  previewParity:()=>({checkedModules:12,mismatches:[],htmlDiffers:false})});
 assert.equal(result.coverage.planned,3);
 assert.equal(result.coverage.observed,3);
 assert.equal(result.coverage.missingBosses.length,0);
 assert(result.coverage.missingEliteTypes.includes('gravecaller'));
 assert.equal(result.failures.length,0);
 assert.match(A.markdown(result),/Tank vs Elite/);
});
test('audit reports fingerprint drift as a quality failure even if fights succeeded',()=>{
 const cfg=A.parseArgs(['--seeds=1','--builds=blood-fury','--affinities=blood',
  '--risks=0','--group-sizes=3','--pairs=1','--scan=10']);
 const result=A.run(cfg,{
  simulate:opts=>({sourceSha256:'different',rows:[combat({mode:opts.mode})],summary:{errors:0}}),
  compare:()=>({pairs:[],errors:[]}),fingerprint:()=>({sha256:'truth',files:[]})
 });
 assert(result.failures.some(f=>f.startsWith('source_fingerprint_mismatch')));
});

test('combat/economy modules simulated from source match Pages mirror files',()=>{
 const parity=A.previewRuntimeParity();
 assert(parity.checkedModules>=10);
 assert.deepEqual(parity.mismatches,[],
  'A mismatch means the native simulator no longer validates the published preview runtime');
 assert.equal(typeof parity.htmlDiffers,'boolean');
});
test('a live/preview combat module mismatch is a blocking data-quality failure',()=>{
 const cfg=A.parseArgs(['--seeds=1','--builds=blood-fury','--affinities=blood',
  '--risks=0','--group-sizes=3','--pairs=1','--scan=10']);
 const result=A.run(cfg,{
  simulate:opts=>({sourceSha256:'test',rows:[combat({mode:opts.mode})],summary:{errors:0}}),
  compare:()=>({pairs:[],errors:[]}),
  fingerprint:()=>({sha256:'test',files:['index.html']}),
  previewParity:()=>({checkedModules:12,mismatches:['online/v013-elite-abilities.js'],
   htmlDiffers:true})
 });
 assert(result.failures.some(x=>x.includes('preview_runtime_module_mismatch')));
 assert.equal(result.previewRuntimeParity.mismatches.length,1);
});

test('real native controlled combat stores a deterministic complete equipment signature',()=>{
 const S=require('../scripts/simulate-progression.cjs');
 const o={...S.DEFAULTS,mode:'enemies',points:0,rarity:'Common',
  gear:'current',groupSizes:[3],targetPolicy:'mechanics'};
 const build=S.BUILDS.find(b=>b.id==='blood-fury');
 const one=S.encounter(1,build,9101,'normal',o,undefined,undefined,undefined,undefined,3);
 const repeat=S.encounter(1,build,9101,'normal',o,undefined,undefined,undefined,undefined,3);
 assert.match(one.gearFingerprint,/^[0-9a-f]{64}$/);
 assert.equal(one.gearFingerprint,repeat.gearFingerprint);
 assert.equal(one.resolvedSeed,repeat.resolvedSeed);
 assert.equal(one.damageTaken,repeat.damageTaken);
 assert.equal(one.won,repeat.won);
});
