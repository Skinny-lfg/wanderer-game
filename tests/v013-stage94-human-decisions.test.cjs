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
 assert.equal(next.room,2,'high-HP player considers valuable marked Elite before a Reliquary detour');
 assert.equal(next.objective,true);
 assert(next.elite?.marked,'native marked Elite reward is recognized');
 const injured=N.selectRoom(c,N.PROFILES.cautious,{hp:35,maxhp:100});
 assert.equal(injured.room,3,'a dangerously wounded player refuses the optional Elite encounter');
 d.steps=0;
 assert.equal(N.selectRoom(c,N.PROFILES.cautious,{hp:100,maxhp:100}),null,
  'steps are never bypassed');
});

test('Elite risk/reward policy uses native drop and rarity tables, not invented guarantees',()=>{
 const LOOT=globalThis.WandererV012LootRules;
 const g={history:[],dungeon:{cleared:[0,1],foundationState:{bossPreparation:{markedElite:false}}}};
 const card={objective:7,risk:0};
 const node={kind:'elite',escorts:0};
 const ctx={room:7,cha:5,equipment:{armor:{startingGear:true},weapon:{startingGear:true}}};
 const eval0=N.eliteOpportunity(g,card,node,N.PROFILES.cautious,{hp:100,maxhp:100},ctx);
 const ordinary=LOOT.v013DungeonWaveOdds(1,5),elite=LOOT.v013DungeonWaveOdds(4,5);
 assert.equal(eval0.loot.eliteDrop,elite.drop);
 assert.equal(eval0.loot.normalDrop,ordinary.drop);
 assert.equal(eval0.loot.eliteRarePlus,
  Math.round((elite.rarities.Rare+elite.rarities.Epic+elite.rarities.Legendary)*1e4)/1e4);
 assert.equal(eval0.marked,true);
 assert(eval0.benefit>eval0.threat,'healthy starter account has a profitable 0-escort Elite');
 assert(eval0.breakdown.bossPrepUtility>0);
 assert(eval0.breakdown.extractionUtility>0);
});
test('Extra Elite escorts, low HP and observed HP losses legitimately reduce appeal',()=>{
 const g={history:[],dungeon:{cleared:[0,1],foundationState:{bossPreparation:{markedElite:false}}}};
 const card={objective:5,risk:0},context={room:5};
 const healthy=N.eliteOpportunity(g,card,{escorts:0},N.PROFILES.balanced,{hp:100,maxhp:100},context);
 const escorted=N.eliteOpportunity(g,card,{escorts:2},N.PROFILES.balanced,{hp:100,maxhp:100},context);
 const injured=N.eliteOpportunity(g,card,{escorts:0},N.PROFILES.balanced,{hp:40,maxhp:100},
  {...context,recentFights:[{hpStart:90,hpEnd:20,hpMax:100}]});
 assert(escorted.scoreDelta>healthy.scoreDelta);
 assert(injured.scoreDelta>healthy.scoreDelta);
 assert(injured.threat>healthy.threat);
});
test('Unmarked Elite gets better loot without pretending it prepares the boss or pays Marked Essence',()=>{
 const g={history:[],dungeon:{cleared:[0,1],foundationState:{bossPreparation:{markedElite:false}}}};
 const node={escorts:0};
 const marked=N.eliteOpportunity(g,{objective:5},node,N.PROFILES.balanced,{hp:100,maxhp:100},{room:5});
 const unmarked=N.eliteOpportunity(g,{objective:6},node,N.PROFILES.balanced,{hp:100,maxhp:100},{room:5});
 assert.equal(unmarked.loot.eliteDrop,marked.loot.eliteDrop);
 assert(unmarked.benefit<marked.benefit);
 assert.equal(unmarked.breakdown.extractionUtility,0);
 assert.equal(unmarked.breakdown.bossPrepUtility,0);
 const first={...g,dungeon:{...g.dungeon,cleared:[0]}};
 assert.equal(N.eliteOpportunity(first,{objective:6},node,N.PROFILES.balanced,{hp:100,maxhp:100},{room:5}).loot.eliteDrop,1,
  'first real Dungeon encounter has a guarantee for all room types');
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
test('Native Health Potion can be consumed only after a genuine first-room combat',()=>{
 const a=create(9101,undefined,{}, {skipPersistence:true,now:1720000009101}),s=a.state();
 // A unit fixture injects doses, but all combat and subsequent potion actions
 // are native: this is API verification, not part of the balance cohort.
 s.consumables={health:1,scout:1};s.potionSelection=['health','scout'];
 a.start(1,true);
 const c=a.controller();c.chooseRealm(c.state.dungeon.cards[0].id);
 const before=[];
 assert.equal(N.usePotionKind(a,'health','too_early',before),false,
  'a player cannot drink restorative potions before the first room');
 assert.equal(c.visitRoom(1),true);
 assert.equal(a.enter(),true);
 const combat=a.state().run;
 for(let t=0;t<4500&&combat?.status==='fight';t++)a.tick();
 assert.equal(combat.status,'cleared','native E1 solo room must actually be beaten');
 assert.equal(a.exitResult(),true);
 assert(c.state.planeIndex>1);
 const low=a.vitals().hp,max=a.vitals().maxhp;
 assert(low<max,'native first-room combat damages player');
 const log=[];
 assert.equal(N.usePotionKind(a,'health','recover_from_real_room',log),true);
 assert.equal(log[0].kind,'health');
 assert.equal(a.events.run().potions[0].used,true);
 assert(a.vitals().hp>low);
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
 assert.equal(r.stage,'9.6')
 assert.equal(r.schemaVersion,5);
 assert(r.levels.every(x=>Number.isInteger(x.firstRoomsWithoutGear)&&Number.isInteger(x.firstRoomGearDrops)));
 assert(r.levels.every(x=>Number.isInteger(x.ordinaryGreyDrops)&&Number.isInteger(x.forgeFragmentsFromGrey)));;
 assert(Array.isArray(entry.decisions)&&entry.decisions.length>0);
 assert.equal(E1.boonsSelected,entry.boons.length);
 assert.equal(E1.eliteFights,entry.rooms.filter(x=>x.roomType==='elite').length);
 assert.equal(E1.eliteDrops,entry.rooms.filter(x=>x.roomType==='elite').reduce((n,x)=>n+(x.loot?.length||0),0));
 assert.equal(E1.potionsUsed,entry.potions.length);
 assert.equal(E1.markedElitePreparations,Number(!!entry.prepFinal?.markedElite));
 assert.equal(E1.reliquaryPreparations,Number(!!entry.prepFinal?.reliquary));
 assert(!r.accounts[0].attempts.some(x=>x.level>1&&!entry.bossWon),
  'unlocked progression must not be bypassed');
});
