import test from 'node:test';
import assert from 'node:assert/strict';
import {FAMILIES,MAGIC_ELEMENTS,PATHS,PASSIVES,MAX_AFFINITIES,STORAGE_KEY,newProfile,begin,choosePassive,chooseMagicElement,migrateMagicProfile,ensureMagicElementChoice,choosePath,rerollPath,resolveRoom,usePotion,useCampHealthPotion,useCampManaPotion,ensurePlaneOffers,tick,stats,equip,abandon,leaveFinished} from '../online/v012-engine.mjs';

test('v0.12 prototype does not use classic save key and has five families and 13 paths',()=>{
 assert.match(STORAGE_KEY,/v012/);
 assert.equal(Object.keys(FAMILIES).length,5);
 assert.equal(new Set(PATHS.map(x=>x.id)).size,13);
 for(const a of Object.keys(FAMILIES))assert.ok(PATHS.some(x=>x.affinity===a));
 assert.equal(PASSIVES.length,49);
 assert.deepEqual(Object.keys(MAGIC_ELEMENTS),['fire','poison','frost']);
 assert.equal(FAMILIES.magic.name,'Magic');
});

test('initial chosen affinity guaranteed in first path offers, and 3 reward choices',()=>{
 const p=newProfile(1234);begin(p,'blood',2);
 assert.equal(p.run.stage,'startReward');assert.equal(p.run.potions.hp,1);assert.equal(p.run.potions.mana,2);
 assert.equal(p.run.passiveOffers.length,3);
 assert.ok(p.run.passiveOffers.every(id=>PASSIVES.find(x=>x.id===id).affinity==='blood'));
 choosePassive(p,p.run.passiveOffers[0]);
 assert.equal(p.run.stage,'path');
 assert.ok(p.run.pathOffers.map(id=>PATHS.find(x=>x.id===id).affinity).includes('blood'));
 assert.throws(()=>rerollPath(p,p.run.pathOffers.findIndex(id=>PATHS.find(x=>x.id===id).affinity==='blood')),/guaranteed/);
 assert.equal(new Set(p.run.pathOffers.map(id=>PATHS.find(x=>x.id===id).affinity)).size,3);
 assert.equal(p.run.planeOffers.length,3);
 assert.ok(p.run.planeOffers.every(x=>x.waves>=1&&x.waves<=3&&typeof x.elite==='boolean'));
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
 r.passiveOffers=PASSIVES.filter(x=>x.affinity==='magic').slice(0,3).map(x=>x.id);
 assert.throws(()=>choosePassive(p,r.passiveOffers[0]),/Maximum three affinities/);
 assert.equal(r.affinities.length,3);
});

test('three-affinity late rooms always offer three usable path IDs with no fourth family',()=>{
 const p=newProfile(463);begin(p,'blood');choosePassive(p,p.run.passiveOffers[0]);
 const r=p.run;
 for(const fam of ['aegis','vitality']){
  r.stage='reward';r.passiveOffers=PASSIVES.filter(x=>x.affinity===fam&&!x.requires.length).slice(0,3).map(x=>x.id);
  choosePassive(p,r.passiveOffers[0]);
 }
 r.room=7;r.lastPathAffinity='blood';r.stage='reward';
 r.passiveOffers=PASSIVES.filter(x=>x.affinity==='aegis'&&!x.requires.length&&!r.passives.includes(x.id)).slice(0,3).map(x=>x.id);
 choosePassive(p,r.passiveOffers[0]);
 assert.equal(r.pathOffers.length,3);
 assert.equal(new Set(r.pathOffers).size,3);
 assert.ok(r.pathOffers.every(id=>typeof id==='string'&&PATHS.some(x=>x.id===id&&r.affinities.includes(x.affinity))));
 assert.ok(r.pathOffers.every(id=>PATHS.find(x=>x.id===id).affinity!=='blood'));
 const first=r.pathOffers[0];choosePath(p,first);
 assert.ok(['combat','event','altar','chest','elite','boss'].includes(r.stage));
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

test('both potions work between combat Planes, never during waves',()=>{
 const p=newProfile(513);assert.throws(()=>begin(p,'fury',4),/Mana potions/);
 begin(p,'fury',2);
 const r=p.run;
 r.hp=stats(p).hp*.5;r.mp=stats(p).mana*.4;
 assert.equal(usePotion(p,'hp'),true);
 assert.equal(usePotion(p,'mana'),true);
 assert.equal(r.potions.hp,0);assert.equal(r.potions.mana,1);
 assert.throws(()=>useCampHealthPotion(p),/at camp/i);
 assert.throws(()=>useCampManaPotion(p),/to camp/i);
 choosePassive(p,r.passiveOffers[0]);choosePath(p,r.pathOffers[0]);
 assert.throws(()=>usePotion(p,'mana'),/between combats/i);
 assert.throws(()=>usePotion(p,'hp'),/between combats/i);
 abandon(p);leaveFinished(p);
 assert.equal(p.restHpRatio,1,'Health resets to full when Expedition ends');
 assert.equal(p.restMpRatio,1,'Mana resets to full when Expedition ends');
 assert.equal(useCampHealthPotion(p),false,'Health potion cannot be wasted at full HP');
 assert.equal(useCampManaPotion(p),false,'Mana potion cannot be wasted at full Mana');
 p.restHpRatio=.4;p.restMpRatio=.3; // Legacy local profile from an older test build.
 begin(p,'fury',1);
 assert.equal(p.run.hp,stats(p).hp);
 assert.equal(p.run.mp,stats(p).mana);
});

test('Expedition victory, defeat and abandonment restore Health and Mana',()=>{
 const defeated=newProfile(181);begin(defeated,'blood');choosePassive(defeated,defeated.run.passiveOffers[0]);
 defeated.run.hp=0;defeated.run.mp=3;
 abandon(defeated);
 assert.equal(defeated.restHpRatio,1,'Defeat immediately restores next-adventure HP');
 assert.equal(defeated.restMpRatio,1,'Defeat immediately restores next-adventure Mana');
 leaveFinished(defeated);
 assert.equal(defeated.restHpRatio,1);
 assert.equal(defeated.restMpRatio,1);
 begin(defeated,'fury');
 assert.equal(defeated.run.hp,stats(defeated).hp);
 assert.equal(defeated.run.mp,stats(defeated).mana);

 const old=newProfile(727);old.restHpRatio=.4;old.restMpRatio=.3;
 begin(old,'blood');
 assert.equal(old.run.hp,stats(old).hp,'Legacy profiles with partial HP still start full');
 assert.equal(old.run.mp,stats(old).mana,'Legacy profiles with partial Mana still start full');

 const winner=newProfile(811);begin(winner,'blood');choosePassive(winner,winner.run.passiveOffers[0]);
 const r=winner.run;
 r.room=15;r.rooms[14]='boss';r.stage='path';
 choosePath(winner,r.pathOffers[0]);
 while(r.stage==='combat'){
  r.hp=1;r.mp=0;r.fight.enemy.hp=1;r.fight.enemy.attack=0;
  for(let i=0;i<15&&r.stage==='combat';i++)tick(winner,.2);
 }
 assert.equal(r.stage,'finished');
 assert.equal(winner.restHpRatio,1,'Victory restores HP for the next Expedition');
 assert.equal(winner.restMpRatio,1,'Victory restores Mana for the next Expedition');
 assert.match(r.result,/Expedition 2 unlocked/);
});

test('permanent loot and unlocked difficulty survive defeat',()=>{
 const p=newProfile(72);const count=p.inventory.length;
 begin(p,'aegis');choosePassive(p,p.run.passiveOffers[0]);
 // A chest Plane now has waves before the reward.
 p.run.rooms[0]='chest';const path=p.run.pathOffers[0];choosePath(p,path);
 while(p.run.stage==='combat'){
  p.run.fight.enemy.hp=1;p.run.fight.enemy.attack=0;
  for(let i=0;i<20&&p.run.stage==='combat';i++)tick(p,.2);
 }
 assert.equal(p.run.stage,'chest');
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
 begin(p,'magic');chooseMagicElement(p,'fire');choosePassive(p,p.run.passiveOffers[0]);choosePath(p,p.run.pathOffers[0]);
 assert.throws(()=>equip(p,1),/during combat/);
});

test('difficulty picker can replay lower unlocked tiers without skipping progression',()=>{
 const p=newProfile(902);p.unlocked=4;
 assert.throws(()=>begin(p,'fury',2,5),/Expedition level not unlocked/);
 begin(p,'fury',2,2);
 assert.equal(p.run.level,2);
 assert.equal(p.unlocked,4);
 assert.equal(p.run.rooms[0],'combat');
 assert.equal(p.run.rooms[14],'boss');
});


test('offered Plane wave count matches combat, wave rewards, and bonus Elite visibility',()=>{
 const p=newProfile(878);begin(p,'blood');choosePassive(p,p.run.passiveOffers[0]);
 const r=p.run;
 for(const offer of r.planeOffers){assert.ok(offer.waves>=1&&offer.waves<=3);assert.equal(typeof offer.elite,'boolean');}
 const option=r.planeOffers.find(x=>x.waves>=2)||r.planeOffers[0];
 const beforeGold=p.gold;
 choosePath(p,option.id);
 assert.equal(r.fight.waves,option.waves,'player sees actual incoming wave count');
 for(let wave=0;wave<option.waves&&r.stage==='combat';wave++){
  const e=r.fight.enemy;
  assert.equal(e.elite,!!option.elite&&wave===option.waves-1);
  e.hp=1;e.attack=0;
  for(let i=0;i<20&&r.stage==='combat'&&r.fight?.enemy===e;i++)tick(p,.2);
 }
 assert.ok(p.gold>beforeGold,'wave kills must award currency');
 assert.equal(r.stage,'reward');
});

test('gear can be changed between Planes but not during waves; resource caps change accordingly',()=>{
 const p=newProfile(219);begin(p,'magic');chooseMagicElement(p,'poison');choosePassive(p,p.run.passiveOffers[0]);
 const r=p.run;
 p.inventory.push({id:91,slot:'armor',name:'Test Cloth Armor',rarity:'Epic',level:1,atk:0,armor:6,hp:32,mana:25,material:'Cloth',affinity:null});
 const old=stats(p);r.hp=old.hp*.7;r.mp=old.mana*.45;
 equip(p,91);
 const fresh=stats(p);
 assert.ok(fresh.hp>old.hp&&fresh.mana>old.mana);
 assert.ok(r.hp>old.hp*.7&&r.mp>old.mana*.45);
 const previous=ensurePlaneOffers(p);
 assert.equal(previous,false,'current Plane choices already include previews');
 choosePath(p,r.pathOffers[0]);assert.throws(()=>equip(p,1),/during combat/);
 r.fight.enemy.hp=1;r.fight.enemy.attack=0;
 while(r.stage==='combat'){
  r.fight.enemy.hp=1;r.fight.enemy.attack=0;
  for(let i=0;i<20&&r.stage==='combat';i++)tick(p,.2);
 }
 assert.equal(r.stage,'reward');
 equip(p,1);
 assert.equal(p.equipped.weapon,1);
});

test('legacy Plane offers are hydrated without overwriting an ongoing test inventory',()=>{
 const p=newProfile(346);begin(p,'fury');choosePassive(p,p.run.passiveOffers[0]);
 p.run.planeOffers=undefined;
 const gearCount=p.inventory.length;
 assert.equal(ensurePlaneOffers(p),true);
 assert.equal(p.run.planeOffers.length,3);
 assert.ok(p.run.planeOffers.every(x=>p.run.pathOffers.includes(x.id)&&x.waves>=1&&x.waves<=3));
 assert.equal(p.inventory.length,gearCount);
 assert.equal(ensurePlaneOffers(p),false);
});


test('Magic requires Fire, Poison or Frost before mana/spell/element passives',()=>{
 for(const element of ['fire','poison','frost']){
  const p=newProfile(1300+['fire','poison','frost'].indexOf(element));
  begin(p,'magic');
  assert.equal(p.run.stage,'element');
  assert.equal(p.run.passiveOffers.length,0,'Mana and Spell Power are not offered before choosing element');
  assert.throws(()=>choosePassive(p,'spell_focus'),/Passive not offered/);
  assert.throws(()=>chooseMagicElement(p,'lightning'),/unavailable/);
  chooseMagicElement(p,element);
  assert.equal(p.run.stage,'startReward');assert.equal(p.run.magicElement,element);
  assert.equal(p.run.passiveOffers.length,3);
  assert.ok(p.run.passiveOffers.some(id=>PASSIVES.find(x=>x.id===id).element===element),'first choice must include a matching elemental passive');
  assert.ok(p.run.passiveOffers.every(id=>{let e=PASSIVES.find(x=>x.id===id).element;return !e||e===element;}));
  assert.throws(()=>chooseMagicElement(p,'fire'),/unavailable/,'cannot change elements mid-run');
 }
});
test('Magic unlocked by a Plane chooses element after combat, as one of at most 3 affinities',()=>{
 const p=newProfile(1419);begin(p,'blood');choosePassive(p,p.run.passiveOffers[0]);
 const r=p.run;
 const magicPlane=r.pathOffers.find(id=>PATHS.find(x=>x.id===id).affinity==='magic');
 if(!magicPlane){
  // The synthetic bot opens a valid Magic plane even if the random three initially omit it.
  const path=PATHS.find(x=>x.affinity==='magic');
  r.pathOffers[0]=path.id;
  r.planeOffers[0]={id:path.id,waves:1,elite:false,bonus:null};
 }
 choosePath(p,magicPlane||r.pathOffers[0]);
 while(r.stage==='combat'){
  r.fight.enemy.hp=1;r.fight.enemy.attack=0;
  for(let i=0;i<20&&r.stage==='combat';i++)tick(p,.2);
 }
 assert.equal(r.stage,'element');
 assert.equal(r.affinities.includes('magic'),false);
 chooseMagicElement(p,'frost');
 assert.equal(r.stage,'reward');
 assert.ok(r.affinities.includes('magic'));
 assert.equal(r.affinities.length,2);
 assert.equal(r.magicElement,'frost');
 assert.ok(r.passiveOffers.some(id=>PASSIVES.find(x=>x.id===id).element==='frost'));
 choosePassive(p,r.passiveOffers[0]);
 assert.equal(r.stage,'path');
});
test('Magic elemental spells operate with Sword and Staff Wand increase elemental output',()=>{
 function simulate(weapon){
  const p=newProfile(4422);
  if(weapon!=='Sword'){
   p.inventory.push({id:4,slot:'weapon',name:'Test '+weapon,rarity:'Common',level:1,atk:7,armor:0,hp:0,mana:0,material:null,affinity:null});
   p.equipped.weapon=4;
  }
  begin(p,'magic');chooseMagicElement(p,'fire');
  choosePassive(p,p.run.passiveOffers[0]);
  const r=p.run,plane=r.pathOffers[0];
  choosePath(p,plane);
  r.fight.enemy.attack=0;
  r.fight.enemy.maxhp=9999;
  r.fight.enemy.hp=9999;
  const manaBefore=r.mp;
  for(let i=0;i<10;i++)tick(p,.2);
  return {damage:9999-r.fight.enemy.hp,manaUsed:manaBefore-r.mp,burn:r.fight.enemy.burn};
 }
 const sword=simulate('Sword'),wand=simulate('Wand'),staff=simulate('Staff');
 assert.ok(sword.manaUsed>0&&sword.burn>0,'Magic spells should use mana and burn with a Sword');
 assert.ok(wand.damage>sword.damage,'Wand improves elemental magic damage');
 assert.ok(staff.damage>wand.damage,'Staff has a larger elemental bonus');
});
test('Poison stacks and Frost Chill are separate from Blood Bleed',()=>{
 for(const element of ['poison','frost']){
  const p=newProfile(774);begin(p,'magic');chooseMagicElement(p,element);choosePassive(p,p.run.passiveOffers[0]);
  choosePath(p,p.run.pathOffers[0]);
  const r=p.run;r.fight.enemy.attack=0;r.fight.enemy.hp=9999;r.fight.enemy.maxhp=9999;
  for(let i=0;i<11;i++)tick(p,.2);
  const e=r.fight.enemy;
  if(element==='poison')assert.ok(e.toxic>0&&e.bleed===0,'Poison does not silently become Blood Bleed');
  else assert.ok(e.chill>0&&e.toxic===0,'Frost applies chill instead of Poison');
 }
});
test('old Arcane local test runs are migrated to Magic and prompted at a safe stage',()=>{
 const p=newProfile(23);begin(p,'fury');choosePassive(p,p.run.passiveOffers[0]);
 p.run.affinities.push('arcane');p.run.initial='arcane';p.run.lastPathAffinity='arcane';
 p.inventory[0].affinity='arcane';
 assert.equal(migrateMagicProfile(p),true);
 assert.equal(p.run.initial,'magic');assert.equal(p.run.affinities.includes('magic'),true);
 assert.equal(p.run.lastPathAffinity,'magic');assert.equal(p.inventory[0].affinity,'magic');
 assert.equal(ensureMagicElementChoice(p),true);
 assert.equal(p.run.stage,'element');
 chooseMagicElement(p,'poison');
 assert.equal(p.run.stage,'path');
 assert.equal(p.run.magicElement,'poison');
 assert.equal(migrateMagicProfile(p),false);
});
