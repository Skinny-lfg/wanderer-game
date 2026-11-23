'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../scripts/v013-stage635-native-player-envelope.cjs');
const B=require('../scripts/v013-stage632-player-power.cjs');
test('Stage6.35: all 100 legal profiles and 5 seeds, up to E200, no unsafe file or fake E',()=>{
 assert.equal(B.IDS.length,100);assert.equal(B.BATCHES.length,20);
 assert.deepEqual(B.SEEDS,[9861,9863,9865,9867,9869]);
 const c=P.settings(['--batch=19','--seed=9869','--max-level=200','--max-total-attempts=400']);
 assert.equal(c.maxLevel,200);assert.equal(c.maxTotalAttempts,400);assert.equal(c.batch,19);
 for(const args of [['--max-level=201'],['--max-level=0'],['--batch=20'],['--seed=42'],
  ['--max-total-attempts=0'],['--max-total-attempts=2001'],['--take=6'],
  ['--out=../../invalid.json'],['--inputs=../wrong'],['--mode=fabricate'],['--foo=5']])
  assert.throws(()=>P.settings(args));
});
test('Stage6.35: same-account percentage growth never treats zero baselines as zero gain',()=>{
 assert.equal(P.difference(100,115),15);
 assert.equal(P.difference(120,120),0);
 assert.equal(P.difference(100,80),-20);
 assert.equal(P.difference(0,10),null);
 assert.equal(P.difference(null,10),null);
 assert.equal(P.difference(-10,10),null);
});
const sample=(E,attributes={})=>({
 E,earnedTalents:E*3,spentAttributes:E,equipment:[{slot:'weapon',id:'starter'+E}],
 itemBudgetMissing:1,metrics:Object.fromEntries(P.KINDS.map(k=>[k,attributes[k]??100]))
});
test('Stage6.35: real equipment ID switches tracked, not automatically called improvement',()=>{
 const old=sample(5,{maxhp:100,attack:100,spellPower:0});
 const next=sample(6,{maxhp:115,attack:100,spellPower:22});
 const row=P.paired(old,next),summary=P.safeSummary([row]);
 assert.equal(row.changes,1);
 assert.equal(row.gearReplaced,true);
 assert.equal(row.itemBudgetDelta,null,'missing native roll budgets must not be invented');
 assert.equal(row.values.maxhp,15);
 assert.equal(row.values.attack,0);
 assert.equal(row.values.spellPower,null);
 assert.equal(summary.gearChanged,100);
 assert.equal(summary.medians.spellPower.n,0);
 assert.equal(summary.medians.maxhp.median,15);
 assert.throws(()=>P.paired(old,sample(7)),/Nonconsecutive/);
});
test('Stage6.35: explicit native risk, coverage and original enemy policy left untouched',()=>{
 const src=require('node:fs').readFileSync('combat/expedition-progression.js','utf8');
 assert(src.includes('const CALIBRATION_STAT_ONLY=false;'));
 assert(src.includes('initialReference:.775'));
 assert(src.includes('lateLogGrowth:.014'));
 assert(src.includes('function enemyScaling('));
 assert.throws(()=>P.aggregate([]),/No Stage6.35/);
});
