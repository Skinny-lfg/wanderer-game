'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs');
const create=require('./v012-economy-harness.cjs');

test('Boon policy considers costs, survival, mana and late Expedition step pressure',()=>{
 const cautious=N.PROFILES.cautious,bleeder=N.PROFILES.balanced;
 const weak={vitals:{hp:42,maxhp:100,maxmp:0},steps:10};
 assert(N.boonScore('bastion_oath',cautious,weak)>N.boonScore('blood_tribute',cautious,weak));
 assert.equal(N.chooseBoon({ids:['blood_tribute','bastion_oath','wayfarers_bargain']},cautious,weak),'bastion_oath');
 assert(N.boonScore('aetherbound_pact',cautious,weak)<N.boonScore('predators_focus',cautious,weak));
 assert(N.boonScore('wayfarers_bargain',cautious,{vitals:{hp:100,maxhp:100},steps:3})>
   N.boonScore('wayfarers_bargain',cautious,weak));
 assert(N.boonScore('blood_tribute',bleeder,{vitals:{hp:100,maxhp:100},bleedReady:true})>
   N.boonScore('blood_tribute',cautious,weak));
});
test('Contracts select only legitimately offered objectives, prioritizing attainable partial rewards',()=>{
 const ids=['pathfinder','oath_of_defiance'];
 assert.equal(N.chooseContract({ids},N.PROFILES.cautious,{}),'pathfinder');
 assert.equal(N.chooseContract({ids:['oath_of_defiance']},N.PROFILES.cautious,{}),'oath_of_defiance');
 assert.equal(N.chooseContract(null,N.PROFILES.balanced,{}),null);
});
test('Reliquary health sacrifice is used only above safe HP threshold',()=>{
 const v=N.PROFILES.balanced;
 assert.equal(N.eventOptions('forgotten_reliquary',{hp:90,maxhp:100},v)[0],0);
 assert.equal(N.eventOptions('forgotten_reliquary',{hp:70,maxhp:100},v)[0],1);
 assert.equal(N.eventOptions('forgotten_reliquary',{hp:95,maxhp:100},v,{reliquaryCompleted:true})[0],1);
});
test('Route decisions respect real visible steps, Boss prep and cannot path to unreachable rooms',()=>{
 const nodes=[{kind:'entrance'},{kind:'combat',range:[1,1]},
  {kind:'elite',escorts:0},{kind:'event',event:'forgotten_reliquary'},
  {kind:'boss',escorts:0}];
 const card={id:'arena',nodes,objective:2,reliquaryRoom:3,
  edges:[[0,1],[0,2],[0,3],[1,4],[2,4],[3,4]]};
 const d={realm:'arena',current:0,visited:[0],cleared:[1],steps:12,
  scouted:[],discoveredSecrets:[],foundationState:{bossPreparation:{markedElite:false,reliquary:false}}};
 const c={state:{dungeon:d},realmMap:()=>card,travelPath:i=>i===2||i===3?[0,i]:[],
  travelCost:()=>1};
 const next=N.selectRoom(c,N.PROFILES.cautious,{hp:100,maxhp:100});
 assert.equal(next.room,3,'safe Reliquary with a high-HP player offers a genuine Boss preparation route');
 assert.equal(next.reliquary,true);
 d.steps=0;
 assert.equal(N.selectRoom(c,N.PROFILES.cautious,{hp:100,maxhp:100}),null,
  'steps are never bypassed');
});
test('Exact-kind potion selection never consumes another native dose on a failed request',()=>{
 const calls=[],a={
  events:{run:()=>({started:true,potions:[{kind:'scout',used:false},{kind:'health',used:false}]})},
  potions:{use:(index,mode)=>{calls.push({index,mode});return index===1;}},
  state:()=>({potionSelection:[]})
 };
 const log=[];
 assert.equal(N.usePotionKind(a,'health','low_hp',log),true);
 assert.deepEqual(calls,[{index:1,mode:undefined}]);
 assert.deepEqual(log,[{kind:'health',slot:1,reason:'low_hp'}]);
 assert.equal(N.usePotionKind(a,'barrier','boss',log),false);
 assert.equal(calls.length,1,'never substitute a Scout for a missing Barrier dose');
});
test('Native between-room Health Potion uses actual game rules and costs the owned dose',()=>{
 const a=create(9451,undefined,{}, {skipPersistence:true,now:1720000009451}),s=a.state();
 const stats=a.baseStats(),maxhp=stats.maxhp;
 // Controlled native API fixture to exercise the consumption rule; campaign
 // simulator itself never injects Gold, HP, equipment or consumables.
 s.consumables={health:1,scout:1};s.potionSelection=['health','scout'];
 a.start(1,true);
 const c=a.controller();c.chooseRealm(c.state.dungeon.cards[0].id);
 a.setVitals({hp:Math.floor(maxhp*.35),mp:stats.mana,maxhp,maxmp:stats.mana});
 const log=[];
 assert.equal(N.usePotionKind(a,'health','recover_from_real_room',log),true);
 assert.equal(log[0].kind,'health');
 assert.equal(a.events.run().potions[0].used,true);
 assert(a.vitals().hp>Math.floor(maxhp*.35));
 assert.equal(N.usePotionKind(a,'health','double_dose',log),false);
 assert.equal(log.length,1);
 assert.equal(a.events.run().potions[1].used,false,'Scout not consumed as Health');
});
test('The new policy does not invent equipment, XP or level unlocks',()=>{
 const a=create(9452,undefined,{}, {skipPersistence:true,now:1720000009452}),xp=a.state().automaticTalents.xp;
 const gear=JSON.stringify(N.gearSnapshot(a)),g=a.controller().state.unlocked;
 const selected=N.chooseBoon({ids:['wayfarers_bargain','bastion_oath']},N.PROFILES.cautious,
  {vitals:{hp:80,maxhp:100},steps:5});
 assert.equal(selected,'bastion_oath');
 assert.equal(a.state().automaticTalents.xp,xp);
 assert.equal(JSON.stringify(N.gearSnapshot(a)),gear);
 assert.equal(a.controller().state.unlocked,g);
});
test('A full new E1 account reports independent prep, Boon and potion telemetry without simulator errors',()=>{
 const opts=N.parseArgs(['--seeds=9461','--profiles=balanced','--max-level=1','--max-attempts=1']);
 const r=N.run(opts),entry=r.accounts[0].attempts[0],E1=r.levels[0];
 assert.equal(r.coverage.errors,0,entry.error);
 assert.equal(entry.level,1);
 assert.equal(r.stage,'9.4');
 assert(Array.isArray(entry.decisions)&&entry.decisions.length>0);
 assert.equal(E1.boonsSelected,entry.boons.length);
 assert.equal(E1.potionsUsed,entry.potions.length);
 assert.equal(E1.markedElitePreparations,Number(!!entry.prepFinal?.markedElite));
 assert.equal(E1.reliquaryPreparations,Number(!!entry.prepFinal?.reliquary));
 assert(!r.accounts[0].attempts.some(x=>x.level>1&&!entry.bossWon),
  'unlocked progression must not be bypassed');
});
