import test from 'node:test';import assert from 'node:assert/strict';
import '../online/v012-save.js';
const S=globalThis.WandererV012Save;
function legacy(){return {characterId:'knight',maxDungeon:200,chosen:200,attemptCompleted:true,gold:1234,fragments:567,materials:{iron:9,cloth:3},
 onlineProgress:{attemptId:'old-attempt',deepestCleared:200,activeMs:9999,milestones:{200:{activeMs:8888}},timingEligible:true,timerMetric:'combat-v1'},
 stashCapacity:40,stash:[{id:'stored',name:'Legacy Helm',slot:'helm',subtype:'Helm',tier:180,rarity:'Epic',def:90,effect:'poison'}],
 equip:{weapon:{id:'legend',name:'Blade of the First Dawn',legendaryId:'blade-of-the-first-dawn',slot:'weapon',subtype:'Sword',tier:200,rarity:'Legendary',effect:'crit',atk:122,upgradeRank:10,upgradeBase:{atk:101.6666666667}}},
 run:null,runes:[{id:'rune',name:'Rune of Fury',family:'fury',tier:200,value:63}],runeSlots:['rune',null,null],sigils:[{id:'sigil',affinity:'shock'}],merchant:null,valuables:[]};}
function memory(){const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}
test('versioned migration preserves gear, Legendary ranks, materials, currencies, Runes, identity and old progress as history',()=>{
 const old=legacy(),raw=JSON.stringify(old),identity={uid:'fixture-alice',projectId:'demo-wanderer',nickname:'alice_1'};
 const {save,archive}=S.migrateLegacy(raw,{binding:'alice',identity});
 assert.equal(JSON.stringify(old),raw);assert.equal(archive,raw);assert.equal(save.schemaVersion,12);
 assert.deepEqual(save.profile,{...old,expeditionOverflow:[]});assert.deepEqual(save.identity,identity);
 assert.equal(save.expedition.completed,0);assert.equal(save.expedition.unlocked,1);assert.equal(save.legacyHistory.maxDungeon,200);
 const again=S.migrateLegacy(save,{binding:'alice'});assert.equal(again.migrated,false);assert.equal(again.archive,null);assert.deepEqual(again.save,save);
});
test('old cloud envelope is copied at an expected revision; foreign bindings and unknown versions fail closed',()=>{
 const envelope={payload:JSON.stringify(legacy()),revision:7,schemaVersion:1};
 const m=S.migrateLegacy(envelope,{binding:'alice',expectedRevision:7});assert.equal(m.save.migration.sourceRevision,7);assert.equal(m.save.migration.requiresApproval,true);
 assert.throws(()=>S.migrateLegacy(envelope,{binding:'alice',expectedRevision:6}),/source cloud conflict/);
 assert.throws(()=>S.validate(m.save,'bob'),/foreign/);
 assert.throws(()=>S.migrateLegacy({...envelope,schemaVersion:99}),/legacy cloud envelope/);
 assert.throws(()=>S.validate({...m.save,schemaVersion:13}),/unsupported/);
 assert.throws(()=>S.migrateLegacy({...legacy(),format:'unknown-game'}),/unsupported legacy format/);
 assert.throws(()=>S.migrateLegacy({...legacy(),version:99}),/unsupported legacy format/);
});
test('older ring, translated rarity, numeric stats and shards aliases are normalized on a copy with an exact archive',()=>{
 const old=legacy();delete old.fragments;old.shards=72;
 old.stash[0].def='90';delete old.stash[0].id;old.stash[0].rarity='Épico';
 old.equip.ring={name:'Old Ring',slot:'ring',tier:10,rarity:'Rare',atk:4};
 const raw=JSON.stringify(old),m=S.migrateLegacy(raw);
 assert.equal(m.archive,raw);assert.equal(m.save.profile.fragments,72);assert.equal(m.save.profile.equip.ring1.slot,'ring1');
 assert.equal(m.save.profile.stash[0].def,90);assert.equal(m.save.profile.stash[0].rarity,'Epic');
 assert.equal(new Set([m.save.profile.stash[0].id,m.save.profile.equip.ring1.id]).size,2);
});
test('interrupted classic rewards are archived, never silently minted; new committed rewards survive interruption exactly once',()=>{
 const old=legacy();old.run={gold:9999,fragments:9999,loot:[{id:'not-extracted'}]};
 const m=S.migrateLegacy(old);assert.equal(m.save.profile.gold,1234);assert.equal(m.save.profile.stash.length,1);assert.equal(JSON.parse(m.archive).run.gold,9999);
 const saved=m.save;saved.expedition={...saved.expedition,attempts:1,active:{attempt:1,level:1,plane:2,wave:0,stage:'choice'},lastOutcome:'active',awardKeys:['1:1:1']};
 saved.profile.gold+=17;saved.profile.fragments+=9;
 const {save,interrupted}=S.recover(saved);assert.equal(interrupted,true);assert.equal(save.expedition.lastOutcome,'interrupted');
 assert.equal(save.profile.gold,1251);assert.equal(save.profile.fragments,576);assert.equal(save.expedition.active,null);
 assert.equal(S.recover(save).interrupted,false);assert.deepEqual(S.recover(save).save,save);
});
test('corruption, duplicate IDs, illegal Rune slots, fourth-ring slots, unsafe stats, invented unlocks and duplicate rewards are rejected',()=>{
 const base=S.create(legacy());const checks=[
  s=>{s.profile.gold=-1;},s=>{s.profile.fragments=Infinity;},s=>{s.profile.stash.push({...s.profile.equip.weapon});},
  s=>{s.profile.equip.weapon.upgradeRank=11;},s=>{s.profile.stash[0].atk='NaN';},
  s=>{s.profile.equip.ring3=s.profile.stash[0];},s=>{s.profile.runeSlots=['rune','rune',null];},
  s=>{s.expedition.unlocked=200;},s=>{s.expedition.awardKeys=['0:1:1','0:1:1'];},
  s=>{s.profile.expeditionOverflow=[{...s.profile.stash[0]}];},s=>{s.profile.pendingRuneReward={tier:1,options:[]};},
  s=>{s.profile.merchant={stock:[{id:'merchant',name:'Invalid',slot:'helm',tier:1,rarity:'Rare',atk:'Infinity',goldPrice:2}],sigils:['burn','slow','shock','bleed'],refreshCost:20};}
 ];
 for(const mutate of checks){const copy=structuredClone(base);mutate(copy);assert.throws(()=>S.validate(copy));}
 assert.throws(()=>S.validate('{"broken"'));assert.throws(()=>S.create(JSON.parse('{"__proto__":{"polluted":true}}')));
});
test('isolated storage backs up before writes; stale tabs, binding swaps and source archive replacement cannot overwrite data',()=>{
 const io=memory(),oldRaw=JSON.stringify(legacy());io.data.set('wanderer_account_real_v092','UNTOUCHED');
 const first=S.createStore(io,'alice'),second=S.createStore(io,'alice');assert.equal(first.load(),null);assert.equal(second.load(),null);
 const m=S.migrateLegacy(oldRaw,{binding:'alice'}),one=first.commit(m.save,m.archive);assert.equal(one.revision,1);
 assert.throws(()=>second.commit(m.save),/conflict/);assert.equal(io.getItem(first.key+'_source'),oldRaw);
 const two=first.commit({...one,profile:{...one.profile,gold:1300}});assert.equal(two.revision,2);assert.equal(first.backup().profile.gold,1234);
 assert.throws(()=>first.commit(two,'DIFFERENT ORIGINAL'),/archive already exists/);
 assert.throws(()=>first.commit({...two,binding:'bob'}),/foreign/);
 assert.equal(io.getItem('wanderer_account_real_v092'),'UNTOUCHED');
});
test('quota/partial-write failures keep the previous durable checkpoint and recoverable backup',()=>{
 const io=memory(),store=S.createStore(io);store.load();const saved=store.commit(S.create(legacy()));
 const raw=io.getItem(store.key),write=io.setItem;io.setItem=(key,value)=>{if(key===store.key)throw Error('QuotaExceededError');write(key,value);};
 assert.throws(()=>store.commit({...saved,profile:{...saved.profile,gold:9999}}),/Quota/);
 assert.equal(io.getItem(store.key),raw);assert.equal(store.backup().profile.gold,1234);
 io.setItem=write;assert.equal(store.commit(saved).revision,2);
 io.data.set(store.key,'{BROKEN');assert.throws(()=>S.createStore(io).load());assert.equal(io.getItem(store.key),'{BROKEN');
});
test('migration never merges shared prototype Magic+Poison gear into an account',()=>{
 const prototype={version:1,inventory:[{id:1,affinity:'magic'}],equipped:{weapon:1},unlocked:20,run:{magicElement:'poison'}};
 assert.throws(()=>S.migrateLegacy(prototype),/unsupported legacy format/);assert.equal(prototype.run.magicElement,'poison');
});
test('writer rejects owner swaps, history edits, reward rollback and unlocks without the final boss checkpoint',()=>{
 const io=memory(),store=S.createStore(io);store.load();let save=store.commit(S.create(legacy()));
 const changed=structuredClone(save);changed.legacyHistory.maxDungeon=2;
 assert.throws(()=>store.commit(changed),/history changed/);
 const owner=structuredClone(save);owner.identity={uid:'other',projectId:'demo',nickname:'other'};
 assert.throws(()=>store.commit(owner),/identity changed/);
 save.expedition.attempts=1;save.expedition.active={attempt:1,level:1,plane:1,wave:1,stage:'combat'};save.expedition.lastOutcome='active';save=store.commit(save);
 const invented=structuredClone(save);invented.expedition.completed=1;invented.expedition.unlocked=2;invented.expedition.active=null;invented.expedition.lastOutcome='victory';
 assert.throws(()=>store.commit(invented),/boss checkpoint/);
 save.expedition.awardKeys=['1:1:1'];save=store.commit(save);
 const rolledBack=structuredClone(save);rolledBack.expedition.awardKeys=[];assert.throws(()=>store.commit(rolledBack),/ledger rollback/);
 assert.equal(store.load().expedition.completed,0);
});
test('legacy two-handed reservation retains the displaced offhand and older Merchant inventory',()=>{
 const old=legacy();old.equip.weapon.subtype='Staff';old.equip.offhand={id:'shield',name:'Shield',slot:'offhand',tier:30,rarity:'Rare',def:20};
 old.merchant={stock:[{id:'sale',name:'Old Sale',slot:'helm',tier:10,rarity:'Rare',goldPrice:30}]};
 const m=S.migrateLegacy(old);assert.equal(m.save.profile.equip.offhand,null);assert(m.save.profile.stash.some(i=>i.id==='shield'));
 assert.equal(m.save.profile.merchant.stock[0].id,'sale');assert.equal(m.save.profile.merchant.sigils.length,4);
 assert.deepEqual(JSON.parse(m.archive),old);
});
test('exhausted revision counters fail before modifying the durable record',()=>{
 const io=memory(),save=S.create(legacy());save.revision=Number.MAX_SAFE_INTEGER;
 io.data.set(S.key('local'),JSON.stringify(save));const store=S.createStore(io),loaded=store.load();
 assert.throws(()=>store.commit(loaded),/revision exhausted/);assert.equal(store.load().revision,Number.MAX_SAFE_INTEGER);
});
