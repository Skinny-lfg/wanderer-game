const test=require('node:test');
const assert=require('node:assert/strict');
const {runPlayer,harnessFor}=require('../scripts/v010-progression.cjs');

test('persistent progression is deterministic and conserves valid resources',()=>{
 const opts={policy:'experienced',seed:991022,style:'Bow',attempts:15,snapshots:false};
 const a=runPlayer(opts),b=runPlayer(opts);
 for(const field of ['attempts','clears','deaths','earlyExtracts','farmRuns','deepestCleared','gold','fragments','power','combatSeconds'])assert.equal(a[field],b[field],field);
 assert.equal(a.attempts,15);
 assert(a.gold>=0&&a.fragments>=0&&a.deepestCleared>=0);
 assert(a.clears+a.deaths+a.earlyExtracts<=a.attempts);
});
test('earned inventory remains valid in direct combat A/B',()=>{
 const c=harnessFor('baseline');
 const snapshot=require('../docs/v010-progression-baseline.json').players.map(x=>x.snapshots[20]).find(Boolean);
 const result=c.trial({level:20,weapon:snapshot.equip.weapon?.subtype,equipment:snapshot.equip,runes:snapshot.runes,runeSlots:snapshot.runeSlots,seed:1234});
 assert.equal(result.timeout,false);
 assert(result.hp>=0&&result.hp<=100);
});
