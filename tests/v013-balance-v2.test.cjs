'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const S=require('../scripts/simulate-progression.cjs');
const T=globalThis.WandererAutomaticTalents;
const A=globalThis.WandererV013BossAbilities;
const M=globalThis.WandererV013BossModifiers;
const F=globalThis.WandererV013ExpeditionFoundation;
const small={...S.DEFAULTS,levels:[15],seeds:[9101],builds:['blood-fury'],points:24,tickLimit:4500};
test('CLI supports current six-Boss, Elite and swarm modes, bounded affinities/risk/size/points',()=>{
 let opts=S.parseArgs(['--mode=bosses','--levels=15','--seeds=9101','--builds=blood-fury','--affinities=magic,decay','--risks=0,2','--points=0','--boons=first']);
 assert.equal(opts.mode,'bosses');assert.deepEqual(opts.affinities,['magic','decay']);assert.deepEqual(opts.risks,[0,2]);assert.equal(opts.points,0);assert.equal(opts.boons,'first');
 opts=S.parseArgs(['--mode=enemies','--group-sizes=3,12,20']);assert.deepEqual(opts.groupSizes,[3,12,20]);
 assert.equal(S.parseArgs(['--mode=elites']).mode,'elites');
 for(const arg of ['--affinities=unknown','--risks=3','--group-sizes=1','--group-sizes=23','--points=-1','--points=101','--mode=obsolete','--boons=best','--contracts=best'])
  assert.throws(()=>S.parseArgs([arg]),arg);
 assert.throws(()=>S.parseArgs(['--mode=bosses','--levels=1,5,15,35,50,70,100,200,250,500,1000','--seeds='+Array.from({length:30},(_,i)=>i+1).join(',')]),/matrix too large/);
});
test('Talents: zero points means genuinely no talents; partial points never create free nodes',()=>{
 const p=S.talentPlan(S.BUILDS[0],0);
 assert.equal(p.treeVersion,15);assert.equal(T.earned(p),0);assert.equal(p.nodes.length,0);assert(T.valid(p));
 const partial=S.talentPlan(S.BUILDS[0],7);
 assert(T.valid(partial));assert(partial.nodes.length<=7);assert.equal(T.earned(partial),7);
 const full=S.talentPlan(S.BUILDS[0],24);
 assert(T.valid(full));assert(full.nodes.length>=20);
 for(const key of S.BUILDS[0].skills)assert(full.nodes.includes(key),key);
});
test('Every current Boss Affinity enters a real native fight and reports its Stage 8 mechanics',()=>{
 const opts={...small,mode:'bosses',affinities:['blood','decay','vitality','aegis','fury','magic'],risks:[1]};
 const result=S.simulate(opts);
 assert.equal(result.schemaVersion,3);assert.equal(result.summary.cases,6);
 assert.equal(result.summary.errors,0,JSON.stringify(result.rows.filter(x=>x.error)));
 assert.equal(result.summary.timeouts,0);
 assert.deepEqual(result.summary.exposures.bossAffinities,['aegis','blood','decay','fury','magic','vitality']);
 assert(result.assumptions.bossmods.includes('Legacy Rift-only'));
 for(const row of result.rows){
  assert.equal(row.nativeEncounter,'boss');
  assert.equal(row.type,'boss');
  assert.equal(row.bossStyle,A.profileFor(row.affinity).style);
  assert.equal(row.bossName,A.profileFor(row.affinity).name);
  assert.equal(row.risk,1);assert.equal(row.pointsBudget,24);
  assert(row.initialEnemies>=1&&row.peakVisibleEnemies<=4&&row.enemies<=10);
  assert(Number.isFinite(row.bossSummons)&&Number.isFinite(row.bossHealing));
  assert(Number.isSafeInteger(row.resolvedSeed)&&row.seedShift>=0);
 }
 const again=S.simulate(opts);assert.deepEqual(result.rows,again.rows,'Seed-matched modern Boss diagnostics must be deterministic');
});
test('Current normal swarms and Elite leader use native abilities and report original field makeup',()=>{
 const enemies=S.simulate({...small,mode:'enemies',groupSizes:[3,12,20]});
 assert.equal(enemies.summary.cases,3);assert.equal(enemies.summary.errors,0,JSON.stringify(enemies.rows.filter(x=>x.error)));
 assert(enemies.rows.every(x=>x.type==='combat'));
 assert.deepEqual(enemies.rows.map(x=>x.initialEnemies),[3,12,20]);
 assert(enemies.rows.every(x=>x.initialRoles.minion>=0&&x.peakVisibleEnemies<=4));
 const elite=S.simulate({...small,mode:'elites'});
 assert.equal(elite.summary.cases,1);assert.equal(elite.summary.errors,0);
 assert.equal(elite.rows[0].type,'elite');assert(elite.rows[0].eliteType);
});
test('Boss modifier diagnostic never rewrites Boss ID and rejects excluded combinations',()=>{
 const selected=F.CATALOG.bossModifiers.find(x=>M.check([x.id],'leech','relentless_hunt'));
 assert(selected);
 const row=S.encounter(15,S.BUILDS[0],9101,'boss',{...small,mode:'bossmods'},undefined,selected.id,'blood',1);
 assert.equal(row.bossAffinity,'blood');assert.equal(row.bossName,'Rift Harbinger');assert(row.bossModifierIds.includes(selected.id));
 assert.throws(()=>S.encounter(15,S.BUILDS[0],9101,'boss',small,undefined,'bone_ward','aegis',1),/not compatible/);
});
test('Real Dungeon balance report includes Stage 7 Essence/reagents/XP and Stage 8 combat totals',()=>{
 const data=S.dungeon(15,S.BUILDS[0],9101,{...small,boons:'first'});
 assert.equal(data.error,null,JSON.stringify(data));
 assert.equal(data.affinity,data.bossAffinity);
 assert.equal(data.bossName,A.profileFor(data.affinity).name);
 assert(Array.isArray(data.boonsTaken));
 assert(Number.isFinite(data.essenceNet));
 assert(Number.isFinite(data.talentXpNet));
 assert(data.coresNet&&Object.keys(data.coresNet).length===6);
 assert(data.rooms.every(r=>Number.isFinite(r.enemyAbilityCasts)&&Number.isFinite(r.bossSummons)));
});
test('Optional Contract policy selects the actual native Stage 7 offer without injecting rewards',()=>{
 const opts={...small,mode:'dungeon',contracts:'first',boons:'none'};
 const row=S.dungeon(15,S.BUILDS[0],9101,opts);
 assert.equal(row.error,null,JSON.stringify(row));
 assert(row.contractId);
 assert(row.contractReward===null||typeof row.contractReward==='object');
 const repeat=S.dungeon(15,S.BUILDS[0],9101,opts);
 assert.deepEqual(row,repeat);
});
test('Historical Rift-only diagnostic and synthetic boss-ID manipulation have been removed',()=>{
 const src=fs.readFileSync('scripts/simulate-progression.cjs','utf8');
 assert(!src.includes("g.bossId='rift'"));
 assert(!src.includes('against Rift Harbinger in an initial-ring'));
 assert(src.includes('F.BOSS_STYLE_BY_AFFINITY'));
 assert(!src.includes('points<23'));
});
