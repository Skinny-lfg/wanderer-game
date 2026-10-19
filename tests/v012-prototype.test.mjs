import test from 'node:test';
import assert from 'node:assert/strict';
import {FAMILIES,PATHS,PASSIVES,MAX_AFFINITIES,STORAGE_KEY,newProfile,begin,choosePassive,choosePath,rerollPath,resolveRoom,usePotion,useCampHealthPotion,tick,stats,equip,abandon,leaveFinished} from '../online/v012-engine.mjs';

test('v0.12 prototype does not use classic save key and has five families and 13 paths',()=>{
 assert.match(STORAGE_KEY,/v012/);
 assert.equal(Object.keys(FAMILIES).length,5);
 assert.equal(new Set(PATHS.map(x=>x.id)).size,13);
 for(const a of Object.keys(FAMILIES))assert.ok(PATHS.some(x=>x.affinity===a));
 assert.equal(PASSIVES.length,40);
});

test('initial chosen affinity guaranteed in first path offers, and 3 reward choices',()=>{
 const p=newProfile(1234);begin(p,'blood',2);
 assert.equal(p.run.stage,'startReward');assert.equal(p.run.potions.hp,0);assert.equal(p.run.potions.mana,2);
 assert.equal(p.run.passiveOffers.length,3);
 assert.ok(p.run.passiveOffers.every(id=>PASSIVES.find(x=>x.id===id).affinity==='blood'));
 choosePassive(p,p.run.passiveOffers[0]);
 assert.equal(p.run.stage,'path');
 assert.ok(p.run.pathOffers.map(id=>PATHS.find(x=>x.id===id).affinity).includes('blood'));
 assert.throws(()=>rerollPath(p,p.run.pathOffers.findIndex(id=>PATHS.find(x=>x.id===id).affinity==='blood')),/guaranteed/);
 assert.equal(new Set(p.run.pathOffers.map(id=>PATHS.find(x=>x.id===id).affinity)).size,3);
});

test('lock applies to previous picked affinity only, reroll does not bypass lock',()=>{
 const p=newProfile(488);begin(p,'blood');choosePassive(p,p.run.passiveOffers[0]);
 const first=p.run.pathOffers.find(id=>PATHS.find(x=>x.id===id).affinity==='blood');
 choosePath(p,first);
 assert.equal(p.run.lastPathAffinity,'blood');
 // Leave first combat quickly, with a single enemy at a time.
 while(p.run.stage==='combat'){p.run.fight.enemy.hp=1;p.run.fight.enemy.attack=0;for(let i=0;i<16&&p.run.stage==='combat';i++)tick(p,.2);}
 assert.equal(p.run.stage,'reward');
 choosePassive(p,p.run.passiveOffers[0]);
 assert.equal(p.run.room,2);
 const families=p.run.pathOffers.map(id=>PATHS.find(x=>x.id===id).affinity);
 assert.ok(!families.includes('blood'));
 const rolls=p.run.rerolls;rerollPath(p,0);
 assert.equal(p.run.rerolls,rolls-1);
 assert.ok(p.run.pathOffers.every(id=>PATHS.find(x=>x.id===id).affinity!=='blood'));
 assert.equal(new Set(p.run.pathOffers.map(id=>PATHS.find(x=>x.id===id).affinity)).size,3);
});

test('three affinities maximum; further path offers and rerolls remain inside those families',()=>{
 const p=newProfile(65);begin(p,'blood');choosePassive(p,p.run.passiveOffers[0]);
 const r=p.run;
 for(const fam of ['vitality','aegis']){
  r.stage='reward';
  r.passiveOffers=PASSIVES.filter(x=>x.affinity===fam&&!x.requires.length).slice(0,3).map(x=>x.id);
  choosePassive(p,r.passiveOffers[0]);
 }
 assert.equal(r.affinities.length,MAX_AFFINITIES);
 assert.ok(r.pathOffers.every(id=>r.affinities.includes(PATHS.find(x=>x.id===id).affinity)));
 assert.equal(r.pathOffers.length,3,'must still show three plans with repeated affinity families');
 assert.equal(new Set(r.pathOffers).size,3);
 for(let i=0;i<3;i++){
  const index=r.pathOffers.findIndex(id=>PATHS.find(x=>x.id===id).affinity!==r.lastPathAffinity);
  if(index>=0&&r.rerolls>0){
   rerollPath(p,index);
   assert.ok(r.pathOffers.every(id=>r.affinities.includes(PATHS.find(x=>x.id===id).affinity)));
  }
 }
 r.stage='reward';
 r.passiveOffers=PASSIVES.filter(x=>x.affinity==='arcane').slice(0,3).map(x=>x.id);
 assert.throws(()=>choosePassive(p,r.passiveOffers[0]),/Maximum three affinities/);
 assert.equal(r.affinities.length,3);
});

test('combat uses sequential waves, no multi-enemy targeting',()=>{
 const p=newProfile(166);begin(p,'blood');choosePassive(p,p.run.passiveOffers[0]);
 choosePath(p,p.run.pathOffers[0]);
 assert.equal(p.run.stage,'combat');
 const f=p.run.fight;
 assert.ok(f.enemy);
 assert.equal(Object.hasOwn(f,'enemies'),false);
 if(f.waves===2){
  const before=f.enemy;f.enemy.hp=1;f.enemy.attack=0;
  for(let i=0;i<25;i++){tick(p,.2);if(p.run.fight?.enemy!==before)break;}
  assert.equal(p.run.stage,'combat');assert.equal(p.run.fight.wave,1);assert.notEqual(p.run.fight.enemy,before);
 }
});

test('Health potions are usable only between runs; Mana potions work during adventures',()=>{
 const p=newProfile(513);assert.throws(()=>begin(p,'fury',4),/Mana potions/);
 begin(p,'fury',2);
 const r=p.run;r.hp=stats(p).hp*.5;
 assert.throws(()=>usePotion(p,'hp'),/only.*camp/i);
 assert.throws(()=>useCampHealthPotion(p),/at camp/i);
 assert.equal(r.potions.hp,0);
 assert.equal(usePotion(p,'mana'),false);
 assert.equal(r.potions.mana,2);
 abandon(p);leaveFinished(p);
 assert.equal(p.restHpRatio,.4);
 assert.equal(useCampHealthPotion(p),true);
 assert.ok(p.restHpRatio>.69);
 assert.equal(p.healthPotionStock,2);
 const hpRatio=p.restHpRatio;begin(p,'fury',2);
 assert.equal(p.run.hp,Math.round(stats(p).hp*hpRatio));
});

test('permanent loot and unlocked difficulty survive defeat',()=>{
 const p=newProfile(72);const count=p.inventory.length;
 begin(p,'aegis');choosePassive(p,p.run.passiveOffers[0]);
 // Force a chest selection via a deterministic test room assignment.
 p.run.rooms[0]='chest';const path=p.run.pathOffers[0];choosePath(p,path);
 resolveRoom(p,'treasure');
 assert.ok(p.inventory.length>count);
 abandon(p);
 assert.equal(p.run.stage,'finished');const n=p.inventory.length;leaveFinished(p);
 assert.equal(p.inventory.length,n);assert.equal(p.unlocked,1);
 assert.equal(p.run,null);
});

test('boss victory alone unlocks next difficulty and keeps permanent items',()=>{
 const p=newProfile(987);begin(p,'vitality');choosePassive(p,p.run.passiveOffers[0]);
 let guard=0;
 while(p.run.stage!=='finished'&&guard++<90){
  const r=p.run;
  if(r.stage==='path'){const choice=r.pathOffers[0];choosePath(p,choice);}
  else if(r.stage==='combat'){
   for(let n=0;n<40&&r.stage==='combat';n++){
    if(r.fight){r.fight.enemy.hp=1;r.fight.enemy.attack=0;}
    tick(p,.2);
   }
  } else if(r.stage==='reward')choosePassive(p,r.passiveOffers[0]);
  else if(r.stage==='chest')resolveRoom(p,'treasure');
  else if(r.stage==='altar')resolveRoom(p,'heal');
  else if(r.stage==='event')resolveRoom(p,'safe');
  else assert.fail('Unexpected stage '+r.stage);
  // Debug assertion for state machine: no premature unlock.
  if(p.run.stage!=='finished')assert.equal(p.unlocked,1);
 }
 assert.ok(guard<90,'expedition should terminate within 90 state transitions');
 assert.equal(p.run.stage,'finished');assert.match(p.run.result,/Victory/);
 assert.equal(p.unlocked,2);assert.equal(p.record.at(-1).won,true);
 const gearCount=p.inventory.length;leaveFinished(p);assert.equal(p.inventory.length,gearCount);
});

test('gear can be equipped at camp, but changes are blocked during active combat',()=>{
 const p=newProfile(77);p.inventory.push({id:9,slot:'weapon',name:'Rare Staff',rarity:'Rare',level:1,atk:21,armor:0,hp:0,mana:20,material:null});
 equip(p,9);assert.equal(p.equipped.weapon,9);
 begin(p,'arcane');choosePassive(p,p.run.passiveOffers[0]);choosePath(p,p.run.pathOffers[0]);
 assert.throws(()=>equip(p,1),/during combat/);
});

test('difficulty picker can replay lower unlocked tiers without skipping progression',()=>{
 const p=newProfile(902);p.unlocked=4;
 assert.throws(()=>begin(p,'fury',2,5),/Difficulty not unlocked/);
 begin(p,'fury',2,2);
 assert.equal(p.run.level,2);
 assert.equal(p.unlocked,4);
 assert.equal(p.run.rooms[0],'combat');
 assert.equal(p.run.rooms[14],'boss');
});
