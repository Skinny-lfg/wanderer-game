'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const N=require('../scripts/v013-natural-progression.cjs');
const create=require('./v012-economy-harness.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
test('Natural E1–E8 defaults remain bounded and opt-in E20 is supported',()=>{
 const p=N.parseArgs();
 assert.deepEqual(p.seeds,[9101,9201]);assert.deepEqual(p.profiles,['cautious','balanced']);
 assert.equal(p.maxLevel,8);assert.equal(p.maxAttempts,6);
 assert.equal(N.parseArgs(['--max-level=20','--max-attempts=24','--max-total-attempts=90']).maxLevel,20);
 assert.throws(()=>N.parseArgs(['--max-level=21']),/E1–E20/);
 assert.throws(()=>N.parseArgs(['--max-total-attempts=0']),/Total attempt budget/);
 assert.throws(()=>N.parseArgs(['--max-attempts=0']),/Max attempts/);
 assert.throws(()=>N.parseArgs(['--profiles=synthetic']),/Invalid profiles/);
 assert.throws(()=>N.parseArgs(['--seeds=1,2,3,4,5,6,7,8,9','--profiles=cautious,balanced,daring']),/cohort/);
});
test('Stage 7.8 agent uses only current Contract offers and their fixed prize',()=>{
 const profile=N.PROFILES.balanced,card={risk:1};
 const offer={ids:['monster_hunt','marked_chambers'],
  rewards:{monster_hunt:{kind:'gold',gold:45},
   marked_chambers:{kind:'blueprint',recipeId:'rare-test-recipe'}}};
 assert.equal(N.chooseContract(offer,profile,card),'marked_chambers');
 assert(N.contractScore('boon_collector',{kind:'essence',essence:7},profile,card)>0);
 assert.equal(N.contractScore('pathfinder',{kind:'gold',gold:45},profile,card),-Infinity);
 assert.equal(N.contractScore('shrine_oath',{kind:'gold',gold:45},profile,card),-Infinity);
 assert.equal(N.chooseContract({ids:['pathfinder'],rewards:{}},profile,card),null);
});
test('Contract marked rooms guide legal travel decisions without altering the Dungeon',()=>{
 const card={id:'route-test',nodes:[{kind:'entrance'},{kind:'combat',count:1,range:[1,1]},
  {kind:'combat',count:1,range:[1,1]},{kind:'boss'},{kind:'combat',count:1}],
  edges:[[0,1],[0,2],[1,3],[2,3],[3,4]],boonShrines:[]};
 const d={realm:card.id,cards:[card],current:0,visited:[0],cleared:[0],scouted:[],
  steps:14,discoveredSecrets:[]},g={stage:'choice',history:[],dungeon:d};
 const c={state:g,realmMap:()=>card,travelPath:i=>[1,2].includes(i)?[0,i]:[],
  travelCost:path=>path.length-1};
 assert.equal(N.selectRoom(c,N.PROFILES.balanced,{hp:100,maxhp:100}).room,1);
 d.foundationState={contractId:'marked_chambers',bossPreparation:{},boonIds:[],decisions:[]};
 d.stage72RewardPlan={markedRooms:[2,4]};
 assert.equal(N.selectRoom(c,N.PROFILES.balanced,{hp:100,maxhp:100}).room,2);
 assert.deepEqual(d.cleared,[0]);
 assert.equal(d.steps,14);
});
test('Completed native Contract can prompt legal early extraction to secure a guaranteed Blueprint',()=>{
 const card={id:'sample',risk:0,nodes:[{kind:'entrance'},{kind:'combat'},{kind:'boss'}],edges:[[0,1],[1,2]]};
 const g={stage:'choice',planeIndex:3,history:[{node:1,boss:false,elite:false,event:null,monstersDefeated:6}],
  dungeon:{realm:'sample',cards:[card],cleared:[0,1],visited:[0,1],
   foundationState:{contractId:'monster_hunt'},stage72RewardPlan:{rewards:{monster_hunt:{kind:'blueprint',recipeId:'recipe-fixture'}}}}};
 assert.equal(N.contractExitDecision(g,{type:'boss'},{hp:70,maxhp:100}).reason,'secure_guaranteed_blueprint');
 assert.equal(N.contractExitDecision(g,{type:'spring'},{hp:100,maxhp:100}),null);
 assert.equal(N.contractExitDecision({...g,planeIndex:1},{type:'boss'},{hp:70,maxhp:100}),null);
 assert.equal(N.contractExitDecision({...g,stage:'failed'},{type:'boss'},{hp:70,maxhp:100}),null);
 g.history[0].monstersDefeated=5;
 assert.equal(N.contractExitDecision(g,{type:'boss'},{hp:70,maxhp:100}),null,'incomplete objectives are not paid');
});
test('Natural gear score values measured item attributes, not fabricated rarity rewards',()=>{
 const p=N.PROFILES.cautious;
 const starter={slot:'weapon',rarity:'Common',tier:1,atk:3};
 const loot={...starter,rarity:'Uncommon',atk:9};
 assert(N.gearScore(loot,p)>N.gearScore(starter,p));
 assert.equal(N.gearScore(null,p),-1);
});
test('Natural account actually starts with v0.13 native weak equipment and 0 earned points',()=>{
 const a=create(9301,undefined,{}, {skipPersistence:true,now:1720000009301});
 const before=N.gearSnapshot(a);
 assert(before.total>=3);assert.equal(before.starter,before.total);
 assert.equal(a.talents.earned(a.state().automaticTalents),0);
 const p=N.spendEarnedTalents(a,N.PROFILES.cautious);
 assert.equal(p.bought.length,0);assert.equal(a.state().automaticTalents.xp,0);
});
test('Only earned native XP unlocks permanent talent purchases',()=>{
 const a=create(9302,undefined,{}, {skipPersistence:true,now:1720000009302}),T=a.talents;
 const initial=a.state().automaticTalents;
 const minted=T.award(initial,200); // Unit fixture: tests accounting, runner never awards XP.
 a.state().automaticTalents=minted;
 const report=N.spendEarnedTalents(a,N.PROFILES.cautious);
 assert.equal(report.xp,200);assert.equal(a.state().automaticTalents.xp,200);
 assert(report.spent<=T.earned(a.state().automaticTalents));
 assert(T.valid(a.state().automaticTalents));
 assert(report.bought.length>0);
});
test('Realm selection and human-like event preferences respond to risk and HP',()=>{
 const cards=[{id:'fury',risk:2,family:'fury'},{id:'aegis',risk:0,family:'aegis'},{id:'blood',risk:1,family:'blood'}];
 assert.equal(N.choiceRealm(cards,N.PROFILES.cautious,{starter:3}).id,'aegis');
 assert.equal(N.choiceRealm(cards,N.PROFILES.daring,{starter:0}).risk,1);
 assert.equal(N.eventOptions('forgotten_reliquary',{hp:50,maxhp:100},N.PROFILES.cautious)[0],1);
 assert.equal(N.eventOptions('forgotten_reliquary',{hp:100,maxhp:100},N.PROFILES.cautious)[0],0);
});
test('A cautious player uses UI-visible mob ranges and prioritizes a reachable solo room',()=>{
 const card={nodes:[{kind:'entrance'},{kind:'combat',range:[1,1]},{kind:'combat',range:[2,4]},{kind:'boss'},{kind:'event'}],edges:[[0,1],[0,2],[1,3],[2,3]]};
 const state={stage:'choice',dungeon:{realm:'test',cards:[card],current:0,visited:[0],cleared:[],scouted:[],steps:12,discoveredSecrets:[]}};
 const c={state,realmMap:()=>card,travelPath:i=>i===0?[0]:i===1||i===2?[0,i]:[],travelCost:path=>path.length-1};
 const first=N.selectRoom(c,N.PROFILES.cautious,{hp:100,maxhp:100});
 assert.equal(first.room,1);
 assert.deepEqual(first.visibleMobRange,[1,1]);
 card.nodes[2].kind='shrine';
 const second=N.selectRoom(c,N.PROFILES.cautious,{hp:100,maxhp:100});
 assert.equal(second.room,2,'a discovered accessible shrine is allowed to influence native decision');
 card.nodes[4].kind='elite';
 assert.equal(N.selectRoom(c,N.PROFILES.cautious,{hp:100,maxhp:100}).room,2,'unreachable room 4 must not alter choice');
});
test('Censored E2–E8 levels are not misreported as zero-percent success',()=>{
 const options=N.parseArgs(['--seeds=9303','--profiles=cautious','--max-attempts=1']);
 const fake={seed:9303,profile:'cautious',initialGear:{},attempts:[{level:1,attempt:1,status:'defeat',xpEarned:20,fightsWon:1}],
  reached:[1],endLevel:1,stopReason:'E1 unbeaten',xp:20,talents:[],finalGear:{total:3,starter:3}};
 const report=N.analyze([fake],options);
 assert.equal(report.levels[0].attempts,1);
 assert.equal(report.levels[1].attempts,0);
 assert.match(report.levels[1].observations,/not_reached/);
});
test('Native runner source cannot inject free equipment, level unlocks or arbitrary enemy deaths',()=>{
 const source=fs.readFileSync('scripts/v013-natural-progression.cjs','utf8');
 for(const forbidden of ['a.setup(','.setUnlocked(','.encounter(','.makeItem(','.award(','.hp=0'])
  assert(!source.includes(forbidden),'Runner bypasses native progression: '+forbidden);
});
test('One true E1 account run completes by victory, defeat or extraction without bypassing progression',()=>{
 const cfg=N.parseArgs(['--seeds=9304','--profiles=cautious','--max-level=1','--max-attempts=1','--tick-limit=4500']);
 const result=N.run(cfg),a=result.accounts[0],r=a.attempts[0];
 assert.equal(result.coverage.accounts,1);assert.equal(result.coverage.attempts,1);
 assert.equal(result.coverage.errors,0,JSON.stringify({error:r.error,stop:a.stopReason}));
 assert(['victory','defeat','extracted'].includes(r.status),r.status);
 assert(a.endLevel>=1&&a.endLevel<=2,'unlocked must only advance from natural Boss victory');
 assert.equal(r.before.xp,0);assert.equal(r.before.earned,0);
 assert(r.xpEnd>=r.xpStart);
 assert(r.gearAfter.items.every(i=>i.rarity!==null));
 assert.equal(r.contractOptions.length,2);
 assert(r.contract&&r.contractOptions.includes(r.contract));
 assert(['gold','essence','fragments','reagent','potion','blueprint'].includes(r.contractPrize.kind));
 assert.equal(r.contractCompleted,!!r.contractProgress?.done);
 assert.equal(r.contractPayoutSecured,!!r.contractPaid);
 assert(r.contractProgress.current<=r.contractProgress.target);
 if(r.contractPaid){
  assert(['victory','extracted'].includes(r.status));
  assert.equal(r.contractResult.status,'completed');
  assert.equal(r.contractPaid.id,r.contract);
 }else assert.notEqual(r.contractResult.status,'completed');
 assert.equal(result.levels[0].contractsSelected,1);
 assert.equal(result.levels[0].contractsPaid,Number(r.contractPayoutSecured));
 assert.equal(result.levels[0].blueprintsSecured,Number(r.contractPaid?.kind==='blueprint'));
});

test('Successful native extraction is never counted as a defeat despite controller abandoned stage',()=>{
 const cfg=N.parseArgs(['--seeds=9101','--profiles=cautious','--max-level=1','--max-attempts=1']);
 const out=N.run(cfg);
 assert.equal(out.coverage.errors,0);
 const attempt=out.accounts[0].attempts[0];
 assert.equal(attempt.extracted,true,'early cautious profile should bank real cleared-room rewards');
 assert.equal(attempt.status,'extracted','native controller.abandon() must not overwrite extraction outcome');
 assert.equal(out.levels[0].extractions,1);
 assert.equal(out.levels[0].deaths,0);
 assert.equal(out.accounts[0].endLevel,1,'extraction must not unlock E2');
});

test('Anchor Rune agent uses actual loadout eligibility, unique families and earned magnitude',()=>{const a=create(9108),s=a.state();a.setup(1,'Sword','Common');s.runes=['archmage','abyss','clarity','efficiency','guard','execution','assault','haste'].map(id=>a.makeRune(id,1,'Legendary'));const weaker=a.makeRune('execution',70,'Common');s.runes.push(weaker);N.manageEarnedRunes(a,N.PROFILES.daring);const owned=s.runeSlots.filter(Boolean).map(id=>s.runes.find(r=>r.id===id));assert.equal(owned.length,3);assert(owned.some(r=>r.family==='execution'&&r.id!==weaker.id));assert(owned.some(r=>r.family==='assault'));assert(owned.some(r=>r.family==='haste'));assert(owned.every(r=>!['archmage','abyss','clarity','efficiency'].includes(r.family)));assert.equal(new Set(owned.map(r=>r.family)).size,3);});
