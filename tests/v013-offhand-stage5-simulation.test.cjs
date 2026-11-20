'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../scripts/v013-offhand-stage5.cjs'),S=require('../scripts/simulate-progression.cjs'),N=require('../scripts/v013-natural-progression.cjs');
test('Stage 5 matrix is bounded, includes Shield Orb Tome Charm, four Expeditions and all native enemy tiers',()=>{
 assert.deepEqual(P.TYPES,['Shield','Orb','Tome','Charm']);
 assert.deepEqual(P.LEVELS.map(x=>x.E),[1,5,10,20]);
 assert.deepEqual(P.LEVELS.map(x=>x.points),[0,4,10,18]);
 assert.deepEqual(P.KINDS,['normal','elite','boss']);
 assert(P.BUILDS.some(x=>x.weapon==='Sword')&&P.BUILDS.some(x=>x.weapon==='Wand'));
 assert(P.BUILDS.some(x=>x.weapon==='Mace')&&P.BUILDS.some(x=>x.weapon==='Daggers'));
 assert.throws(()=>P.parseArgs(['--mode=large']),/Invalid/);
 assert.throws(()=>P.parseArgs(['--out=..\/tmp\/escape.json']),/Invalid/);
 assert.equal(P.parseArgs(['--mode=paired']).mode,'paired');
});
test('Stage 5 controlled native smoke test uses four actual Off-Hand items, identical other gear and same real encounter',()=>{
 const report=P.pairedReport({mode:'smoke'});
 assert.equal(report.coverage.expected,4);
 assert.equal(report.coverage.completed,4,JSON.stringify(report.issues));
 assert.equal(report.coverage.pairedGroups,1);
 assert.equal(report.coverage.issues,0,JSON.stringify(report.issues));
 assert.deepEqual(report.rows.map(r=>r.offhand),P.TYPES);
 assert.equal(new Set(report.rows.map(r=>r.otherGearFingerprint)).size,1);
 assert.equal(new Set(report.rows.map(r=>r.realm)).size,1);
 assert.equal(new Set(report.rows.map(r=>r.affinity)).size,1);
 assert.equal(new Set(report.rows.map(r=>r.groupSize)).size,1);
 for(const r of report.rows){
  assert(r.gearFingerprint&&r.otherGearFingerprint);
  assert(Number.isFinite(r.spellPower)&&r.barrierGenerated>=0);
  assert(r.won||r.died,'native fight must end in win/death');
  assert(r.barrierAbsorbed>=0&&r.tomeMana>=0&&r.charmHealing>=0&&r.orbBarrier>=0);
  if(r.offhand==='Shield')assert.equal(r.orbBarrier+r.tomeMana+r.charmHealing,0);
  if(r.offhand==='Tome')assert.equal(r.orbBarrier+r.charmHealing,0);
  if(r.offhand==='Orb')assert.equal(r.tomeMana+r.charmHealing,0);
  if(r.offhand==='Charm')assert.equal(r.tomeMana+r.orbBarrier,0);
 }
 assert(report.limitations.some(s=>s.includes('not naturally earned loot')));
});
test('Stage 5 native simulator rejects illegal guaranteed traits and two-handed Off-Hands',()=>{
 const defaultOptions={...S.DEFAULTS,mode:'encounter',rarity:'Epic',points:0,lockScenarioStreams:true,tickLimit:500};
 assert.throws(()=>S.encounter(1,{...P.BUILDS[2],weapon:'Staff'},94101,'normal',{...defaultOptions,offhandType:'Orb'}),/Off-Hand not compatible/);
 assert.throws(()=>S.encounter(1,P.BUILDS[0],94101,'normal',{...defaultOptions,offhandType:'Charm',offhandEpicTrait:'echoing_recall'}),/Invalid controlled Epic trait/);
 const clean=S.encounter(1,P.BUILDS[0],94101,'normal',{...defaultOptions,offhandType:'Orb',offhandEpicTrait:null});
 assert.equal(clean.offhandTrait,null,'explicit trait-free Epic control has no random Arcane Ward');
 const ward=S.encounter(1,P.BUILDS[0],94101,'normal',{...defaultOptions,offhandType:'Orb',offhandEpicTrait:'ward'});
 assert.equal(ward.offhandTrait,'ward');
 assert.equal(ward.otherGearFingerprint,clean.otherGearFingerprint,'Epic trait A/B holds every other equipment item fixed');
});
test('Stage 5 native gear decisions value active Mana only for Mana-capable profiles',()=>{
 const basic={slot:'offhand',rarity:'Epic',tier:20,spell:5,mana:20,manaRegenBonus:.5,hp:10,wardBonus:.03};
 const tome={...basic,subtype:'Tome',v013Trait:'echoing_recall'};
 const magic=N.PROFILES['magic-fire'],physical=N.PROFILES['leather-duelist'];
 const withoutMana={...tome,mana:0,manaRegenBonus:0};
 assert(N.gearScore(tome,magic)>N.gearScore(withoutMana,magic),'Magic recognizes Mana sustain');
 assert.equal(N.gearScore(tome,physical),N.gearScore(withoutMana,physical),'Physical without Magic/Decay cannot value unusable Mana');
 const epic={...basic,subtype:'Charm',v013Trait:'heartbloom'};
 assert(N.gearScore(epic,N.PROFILES.cautious)>N.gearScore({...epic,v013Trait:null},N.PROFILES.cautious));
 assert(N.gearScore({...basic,subtype:'Orb',v013Trait:'ward'},magic)>
  N.gearScore({...basic,subtype:'Orb',v013Trait:null},magic));
});
test('Stage 5 reports conditional win time and per-proc telemetry instead of inventing combat Power',()=>{
 const rows=[
  {level:5,kind:'normal',offhand:'Orb',won:false,died:true,timedOut:false,seconds:1,barrierGenerated:4,orbBarrier:4},
  {level:5,kind:'normal',offhand:'Orb',won:true,died:false,timedOut:false,seconds:10,barrierGenerated:6,orbBarrier:6}
 ];
 const a=P.summaries(rows,['level','kind','offhand'])[0];
 assert.equal(a.wins,1);assert.equal(a.deaths,1);assert.equal(a.meanSecondsOnWins,10);
 assert.equal(a.meanBarrierGenerated,5);assert.equal(a.meanOrbBarrier,5);
 const m=P.metrics({affinityMetrics:{offhandTomeMana:5,offhandOrbBarrier:0,offhandCharmHealing:0}});
 assert.equal(m.tomeMana,5);
 assert(!('power' in m));
});
test('Stage 5 case selection never fabricates earned-account progression or disables combat fairness checks',()=>{
 const source=fs.readFileSync('scripts/v013-offhand-stage5.cjs','utf8');
 assert(source.includes('pairedScenarioStreams:true'));
 assert(source.includes('otherGearFingerprint'));
 assert(source.includes('max-level=20'));
 assert(source.includes('Unreached E levels are censored'));
 const native=fs.readFileSync('scripts/simulate-progression.cjs','utf8');
 assert(native.includes('offhandOrbBarrier'));
 assert(native.includes('offhandCharmHealing'));
 assert(native.includes('offhandTomeMana'));
 assert(native.includes('lockScenarioStreams'));
 const account=fs.readFileSync('scripts/v013-natural-progression.cjs','utf8');
 assert(!account.includes('a.setup('));
 assert(!account.includes('.setUnlocked('));
});
