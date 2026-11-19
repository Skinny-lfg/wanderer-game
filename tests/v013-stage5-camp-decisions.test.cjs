'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const create=require('./v012-economy-harness.cjs');
const N=require('../scripts/v013-natural-progression.cjs');

const cautious=N.PROFILES.cautious;
const solo={type:'combat',visibleMobRange:[1,1]};
const group={type:'combat',visibleMobRange:[3,4]};
const bagItem={id:'drop-1',slot:'weapon',rarity:'Uncommon',tier:1,atk:5,source:'loot'};
const input=(extra={})=>({hp:30,maxhp:100,bag:[],next:solo,profile:cautious,
 gold:0,fragments:0,essence:0,recentFights:[],...extra});

test('protects unbanked physical Bag equipment at low HP',()=>{
 const result=N.evaluateRetreat(input({bag:[bagItem],hp:42}));
 assert.equal(result.extract,true);
 assert.equal(result.reason,'protect_carried_loot');
 assert.equal(result.bagItems,1);
 assert(result.bagValue>0);
});
test('without physical loot, risk a visible solo encounter if unable to invest',()=>{
 const result=N.evaluateRetreat(input({hp:24,gold:2,fragments:6}));
 assert.equal(result.extract,false);
 assert.equal(result.reason,'risk_easy_room_no_bag');
});
test('without Bag loot, leave dangerous group to return and improve at Camp',()=>{
 const urgent=N.evaluateRetreat(input({next:group,hp:24,gold:36}));
 assert.equal(urgent.extract,true);
 assert.equal(urgent.reason,'return_to_camp_to_invest');
 const worse=N.evaluateRetreat(input({next:group,hp:24}));
 assert.equal(worse.extract,true);
 assert.equal(worse.reason,'avoid_very_dangerous_room');
});
test('safe healing room remains preferable to abandoning valuables immediately',()=>{
 const r=N.evaluateRetreat(input({hp:35,bag:[bagItem],next:{type:'spring'}}));
 assert.equal(r.extract,false);
 assert.equal(r.reason,'recover_at_safe_room');
});
test('native Forge demands and consumes earned Fragments and Essence',()=>{
 const a=create(6551,undefined,{}, {skipPersistence:true,now:1720000006551});
 const s=a.state(),level=1,id='green_sword',cost=a.forge.progress(id,level);
 assert.equal(cost.ready,false);
 const beforeStash=s.stash.length;
 assert.equal(a.forge.craft(id,level),null);
 assert.equal(s.stash.length,beforeStash);
 s.fragments=cost.cost.fragments;
 s.crafting.essence=cost.cost.essence;
 const check=a.forge.progress(id,level);
 assert.equal(check.ready,true);
 const item=a.forge.craft(id,level);
 assert(item&&item.source==='forge'&&item.crafted===true);
 assert.equal(item.recipeId,id);
 assert.equal(s.fragments,0);
 assert.equal(s.crafting.essence,0);
 assert(s.stash.some(x=>x.id===item.id));
 assert.equal(a.forge.craft(id,level),null,'cannot craft again without materials');
});
test('Camp policy crafts only when actual native materials are available',()=>{
 const a=create(6552,undefined,{}, {skipPersistence:true,now:1720000006552});
 assert.deepEqual(N.craftEarned(a,cautious,1),[]);
 const s=a.state(),p=a.forge.progress('green_sword',1);
 s.fragments=p.cost.fragments;s.crafting.essence=p.cost.essence;
 const crafted=N.craftEarned(a,cautious,1);
 assert(crafted.length<=1);
 assert.equal(s.fragments<=p.cost.fragments,true);
 assert.equal(s.crafting.essence<=p.cost.essence,true);
 if(crafted.length)assert(crafted.every(x=>x.fragmentsSpent>0&&x.essenceSpent>0));
});

test('Full native Stash can be cleared through legitimate salvage and never invents Fragments',()=>{
 const a=create(6652,undefined,{}, {skipPersistence:true,now:1720000006652});
 const state=a.state(),capacity=state.stashCapacity;
 assert(Number.isInteger(capacity)&&capacity>4,'native Stash capacity exists');
 for(let i=state.stash.length;i<capacity;i++){
  state.stash.push(a.makeItem(1,'gloves',null,'loot','Gloves','Common'));
 }
 assert.equal(state.stash.length,capacity);
 const priorFragments=state.fragments,action=N.consolidateStash(a,cautious);
 assert(action.salvaged>=4,'reserve at least four actual Stash slots');
 assert.equal(action.occupiedBefore,capacity);
 assert.equal(action.overflowAfter,0);
 assert(state.stash.length<=capacity-4);
 assert.equal(state.fragments-priorFragments,action.fragmentsGained);
 assert(action.fragmentsGained>=0,'salvage never costs/forges Fragments');
});
test('Secured overflow items are claimed with the native inventory action after cleanup',()=>{
 const a=create(6653,undefined,{}, {skipPersistence:true,now:1720000006653});
 const state=a.state(),capacity=state.stashCapacity;
 for(let i=state.stash.length;i<capacity;i++)state.stash.push(a.makeItem(1,'gloves',null,'loot','Gloves','Common'));
 const recovered=a.makeItem(1,'boots',null,'loot','Boots','Uncommon');
 state.expeditionOverflow.push(recovered);
 const result=N.consolidateStash(a,cautious);
 assert(result.salvaged>=1);
 assert.equal(result.claimedOverflow,1);
 assert.equal(result.overflowAfter,0);
 assert(state.stash.some(item=>item.id===recovered.id),'original overflow item claimed with its original id');
});
