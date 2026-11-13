'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const ctx={};vm.runInNewContext(fs.readFileSync('combat/v012-combat-core.js','utf8'),ctx);const C=ctx.WandererV012CombatCore;
const make=()=>({name:'Mob',hp:100,maxhp:100,atk:20,attackEvery:2,def:5,barrier:0,dots:{bleed:[]}});
test('solo encounters preserve original enemy object and stats',()=>{const mob=make(),group=C.createEnemyGroup(()=>mob,1);assert.equal(group[0],mob);assert.equal(group[0].maxhp,100);assert.equal(group[0].atk,20);});
test('variable encounters scale mobs and stagger four active slots',()=>{for(const [count,scale] of [[3,{hp:.5,atk:.45}],[12,{hp:.16,atk:.10}],[20,{hp:.1,atk:.055}]]){const g=C.createEnemyGroup(make,count,{activeSlots:Math.min(count,4),scale});assert.equal(g.length,count);assert(g.every(e=>e.maxhp===Math.round(100*scale.hp)&&e.atk===Math.max(1,Math.round(20*scale.atk))));assert.equal(new Set(g.slice(0,4).map(e=>e.groupClock)).size,Math.min(4,count));g[0].dots.bleed.push({damage:5});assert.equal(g[1].dots.bleed.length,0);assert.equal(C.nextGroupTarget(g),g[0]);g[0].hp=0;assert.equal(C.nextGroupTarget(g),g[1]);assert.equal(C.groupComplete(g),false);g.forEach(e=>e.hp=0);assert.equal(C.groupComplete(g),true);assert.equal(C.nextGroupTarget(g),null);}});
test('rejects unsupported group sizes and multi-boss encounters',()=>{assert.throws(()=>C.createEnemyGroup(make,23,{scale:{hp:.1,atk:.1}}),/Invalid/);assert.throws(()=>C.createEnemyGroup(()=>({...make(),boss:true}),2,{scale:{hp:.1,atk:.1}}),/solo/);assert.equal(C.groupComplete([]),false);});
test('group factory rejects shared instances and invalid attack clocks',()=>{const shared=make();assert.throws(()=>C.createEnemyGroup(()=>shared,2),/Invalid/);assert.throws(()=>C.createEnemyGroup(()=>({...make(),attackEvery:0}),2),/Invalid/);});
const create=require('./v012-economy-harness.cjs');
function offerMob(a,size){const c=a.controller(),g=c.state,offer=g.offers.find(p=>c.reachable(p)&&g.routeMap[0][p.lane]==='combat');assert(offer);offer.mobCount=size;g.routeMobCounts[0][offer.lane]=size;return offer;}
test('routes create 3, 12, or 18–22 mobs with at most four visible',()=>{
 for(const [size,reserve] of [[3,0],[12,8],[20,16]]){const a=create(809+size),c=a.controller();a.start(1,true);const g=c.state;const lane=offerMob(a,size);lane.waves=1;a.select(lane.id);assert(a.enter());const run=a.state().run;assert.equal(run.enemies?.length||1,Math.min(4,size));assert.equal(run.groupReserve.length,reserve);}
});
test('a 20-mob encounter keeps four slots filled with reinforcements and pays once',()=>{
 const a=create(810);a.start(1,true);const c=a.controller(),offer=offerMob(a,20);a.select(offer.id);assert.equal(a.enter(),true);let run=a.state().run;assert.equal(run.enemies.length,4);assert.equal(run.groupReserve.length,16);const gold=a.state().gold,plane=c.state.planeIndex;
 for(let i=0;i<19;i++){const target=run.enemy,slot=target.groupSlot,reserveBefore=run.groupReserve.length;target.hp=0;a.win();assert.equal(target.groupDefeated,true);assert.equal(run.enemies.filter(enemy=>enemy.hp>0).length,Math.min(4,20-(i+1)));assert.equal(run.enemies[slot]===target,reserveBefore===0);assert.equal(a.state().gold,gold);assert.equal(c.state.planeIndex,plane);assert.equal(run.status,'fight');}
 run.enemy.hp=0;a.win();a.flush();assert.equal(run.groupReserve.length,0);assert(a.state().gold>gold);const paid=a.state().gold;a.win();assert.equal(a.state().gold,paid);
});
test('each live mob has an independent automatic attack clock',()=>{
 const a=create(811);a.start(1,true);const c=a.controller(),offer=offerMob(a,20);assert(offer);a.select(offer.id);assert(a.enter());const run=a.state().run;run.stats.attacksPerSec=0;run.hp=run.maxhp=100000;run.enemies.forEach(e=>{e.hp=e.maxhp=100000;e.atk=10;});for(let i=0;i<100;i++)a.tick();assert(run.hp<run.maxhp);assert(run.enemies.every(e=>e.groupClock<e.attackEvery));assert(new Set(run.enemies.map(e=>e.groupClock.toFixed(2))).size>1);
});
test('reloading a group fight restarts the same wave without duplicating rewards',()=>{
 const storage=new Map();let a=create(812,undefined,{}, {sessionStorage:storage});a.start(1,true);const c=a.controller(),offer=offerMob(a,20);assert(offer);a.select(offer.id);assert(a.enter());const before=a.state().run.enemies.map(e=>[e.name,e.maxhp,e.atk]);a.state().run.enemy.hp=0;a.win();assert.equal(a.state().gold,0);
 a=create(812,undefined,{}, {sessionStorage:storage});assert.equal(a.debug().saveBlocked,false);assert(a.checkpoint.resume());assert.equal(JSON.stringify(a.state().run.enemies.map(e=>[e.name,e.maxhp,e.atk])),JSON.stringify(before));assert.equal(a.state().gold,0);
});
test('automatic single-target attacks clear a large mob encounter without player actions',()=>{
 const a=create(813);a.start(1,true);const c=a.controller(),offer=offerMob(a,20);assert(offer);a.select(offer.id);assert(a.enter());const run=a.state().run;run.stats.attack=1000;run.stats.attacksPerSec=3;run.hp=run.maxhp=10000;const wave=run.enc;for(let i=0;i<300&&run.status==='fight'&&run.enc===wave;i++)a.tick();assert(run.enemies.every(m=>m.hp<=0));assert.notEqual(run.status,'fight');assert(a.state().gold>0);
});
test('map offers save randomized mob counts and retain them through rerolls',()=>{
 const a=create(814),c=a.controller();a.start(1,true);const g=c.state;assert(g.offers.filter(p=>g.routeMap[0][p.lane]==='combat').every(p=>[3,12].includes(p.mobCount)||p.mobCount>=18&&p.mobCount<=22));const snapshot=JSON.stringify(g.routeMobCounts);c.restore(JSON.parse(JSON.stringify(g)));assert.equal(JSON.stringify(c.state.routeMobCounts),snapshot);const index=c.state.offers.findIndex(p=>p.mobCount>=18),old=c.state.offers[index];c.reroll(index);assert.equal(c.state.offers[index].mobCount,old.mobCount);assert.equal(c.state.offers[index].lane,old.lane);
});
test('obsolete route checkpoints are rejected',()=>{
 const a=create(814);a.start(1,true);const old=JSON.parse(JSON.stringify(a.controller().state));delete old.encounterVersion;assert.throws(()=>a.controller().restore(old),/encounter version/);
});
function startHorde(seed,weapon,element){const a=create(seed);a.setup(1,weapon);if(element)a.state().automaticTalents={xp:0,nodes:[],element};a.start(1,true);const c=a.controller(),offer=offerMob(a,20);assert(offer);a.select(offer.id);assert(a.enter());const r=a.state().run;r.hp=r.maxhp=100000;r.stats.attack=100;r.stats.spellPower=100;r.stats.attacksPerSec=4;r.enemies.forEach(e=>{e.hp=e.maxhp=10000;e.atk=0;e.barrier=0;});return {a,r};}
function untilPlayerHit(a,r){for(let i=0;i<20&&!r.lastBaseHit;i++)a.tick();assert(r.lastBaseHit>0);}
test('Two-Handed cleaves two other targets without repeating primary procs',()=>{const {a,r}=startHorde(815,'Two-Handed');untilPlayerHit(a,r);assert(r.enemies[0].hp<10000);assert(r.enemies[1].hp<10000);assert(r.enemies[2].hp<10000);assert.equal(r.enemies[3].hp,10000);assert.equal(r.enemies[1].dots.bleed.length,0);});
test('Lightning casts hit two other mobs and spend Mana once',()=>{const {a,r}=startHorde(816,'Staff','lightning');r.mp=r.maxmp=10000;untilPlayerHit(a,r);assert(r.enemies[0].hp<10000);assert(r.enemies[1].hp<10000);assert(r.enemies[2].hp<10000);assert.equal(r.enemies[3].hp,10000);assert.equal(r.metrics.fundedCasts,1);assert(r.metrics.manaSpent>0);});
test('secondary multi-kills are settled once and their slots receive replacements',()=>{const {a,r}=startHorde(817,'Two-Handed'),first=r.enemies[1],second=r.enemies[2];first.hp=1;second.hp=1;const gold=a.state().gold;untilPlayerHit(a,r);assert(r.enemies[0].hp>0);assert(first.groupDefeated);assert(second.groupDefeated);assert.notEqual(r.enemies[1],first);assert.notEqual(r.enemies[2],second);assert.equal(a.state().gold,gold);assert.equal(r.status,'fight');a.win();assert.equal(a.state().gold,gold);});
test('talent forks improve cleave, extend lightning and reward one-target focus',()=>{
 {const {a,r}=startHorde(818,'Two-Handed');a.state().automaticTalents={xp:1000,nodes:['might','passive_bleeding_edge','fork_cleave_str_1','fork_cleave_str_2','cleave_mastery']};untilPlayerHit(a,r);assert.equal(10000-r.enemies[1].hp,Math.round(r.lastBaseHit*.6));}
 {const {a,r}=startHorde(819,'Staff','lightning');a.state().automaticTalents={xp:1000,nodes:['haste','flow','passive_arcane_focus','fork_storm_int_1','fork_storm_int_2','storm_mastery'],element:'lightning'};r.mp=r.maxmp=10000;untilPlayerHit(a,r);assert(r.enemies[3].hp<10000);assert.equal(r.metrics.fundedCasts,1);}
 {const plain=startHorde(820,'Sword'),focus=startHorde(820,'Sword');for(const x of [plain,focus]){x.r.groupReserve=[];}for(const x of [plain,focus])x.r.enemies.slice(1).forEach(e=>{e.hp=0;e.groupDefeated=true;});focus.a.state().automaticTalents={xp:1000,nodes:['haste','passive_quick_hands','fork_focus_agi_1','fork_focus_agi_2','single_target_mastery']};untilPlayerHit(plain.a,plain.r);untilPlayerHit(focus.a,focus.r);assert(focus.r.lastBaseHit>plain.r.lastBaseHit);}
});
test('contagion spreads weakened effects once and cannot spread recursively',()=>{
 const {a,r}=startHorde(821,'Sword');a.state().automaticTalents={xp:500,nodes:['might','passive_toxic_touch','fork_plague_agi_1','fork_plague_agi_2','plague_spread']};const first=r.enemy;first.dots.bleed=[{damage:20,remaining:3}];first.bleedStacks=1;first.v012Rot=[{damage:10,remaining:3,ticks:0}];first.hp=0;a.win();
 for(const mob of r.enemies.slice(1,3)){assert.equal(mob.dots.bleed[0].damage,10);assert.equal(mob.v012Rot[0].damage,5);assert(mob.v012Rot[0].spread);}
 r.enemy.hp=0;a.win();assert.equal(r.enemies[3].dots.bleed.length,0);assert.equal(r.enemies[3].v012Rot.length,0);
});
test('damage over time ticks independently on non-target enemies',()=>{
 const {a,r}=startHorde(822,'Sword');const mob=r.enemies[1];mob.dots.bleed=[{damage:10,remaining:2}];mob.bleedStacks=1;mob.v012Rot=[{damage:7,remaining:2,ticks:0}];r.tDot=.95;r.stats.attacksPerSec=0;const before=mob.hp;a.tick();assert.equal(before-mob.hp,17);assert.equal(mob.dots.bleed[0].remaining,1);assert.equal(mob.v012Rot[0].remaining,1);
});
test('Second Breath heals after the last reinforcement, not the first mob',()=>{
 const a=create(823);a.state().automaticTalents={xp:200,nodes:['vitality','passive_second_breath']};a.start(1,true);const c=a.controller(),offer=offerMob(a,20);a.select(offer.id);assert(a.enter());const r=a.state().run;r.hp=20;r.maxhp=1000;for(let i=0;i<19;i++){r.enemy.hp=0;a.win();assert.equal(r.hp,20);}r.enemy.hp=0;a.win();assert(r.hp>20);
});
test('fire and frost area talents affect up to two secondary mobs',()=>{
 {const {a,r}=startHorde(824,'Staff','fire');a.state().automaticTalents={xp:1000,nodes:['haste','flow','passive_kindling','fork_fire_int_1','fork_fire_int_2','fire_spread'],element:'fire'};a.build().runtime.permanentTalents=['kindling'];r.mp=r.maxmp=10000;untilPlayerHit(a,r);assert(r.enemies[0].dots.burn.length);assert(r.enemies[1].dots.burn.length);assert(r.enemies[2].dots.burn.length);assert.equal(r.enemies[3].dots.burn.length,0);assert(r.enemies[1].dots.burn[0].spread);}
 {const {a,r}=startHorde(825,'Staff','frost');a.state().automaticTalents={xp:1000,nodes:['haste','flow','passive_deep_winter','fork_frost_int_1','fork_frost_int_2','frost_spread'],element:'frost'};a.build().runtime.permanentTalents=['deep_winter'];r.mp=r.maxmp=10000;untilPlayerHit(a,r);assert(r.enemies[1].slowTime>0);assert(r.enemies[2].slowTime>0);assert.equal(r.enemies[3].slowTime,0);}
});
test('cleave accounts for each secondary target defense',()=>{const {a,r}=startHorde(826,'Two-Handed');r.enemies[1].def=0;r.enemies[2].def=100;untilPlayerHit(a,r);assert(10000-r.enemies[1].hp>10000-r.enemies[2].hp);});
test('group rewards use one risk-adjusted roll and award XP once per Realm',()=>{
 const results=[];for(const size of [3,12,20]){const a=create(830),c=a.controller();a.start(1,true);const offer=offerMob(a,size);a.select(offer.id);offer.waves=1;assert(a.enter());a.rng(.125);const r=a.state().run;while(r.status==='fight'){r.enemy.hp=0;a.win();}const xp=a.state().automaticTalents.xp,gold=a.state().gold,loot=r.loot.length;a.win();assert.equal(a.state().automaticTalents.xp,xp);assert.equal(a.state().gold,gold);results.push({xp,gold,loot});}
 assert(results[0].xp<results[1].xp&&results[1].xp<=results[2].xp);assert(results[0].gold<=results[1].gold&&results[1].gold<=results[2].gold);assert(results.every(x=>x.loot>=0&&x.loot<=1));
});
test('Bow, Sword and Mace area forks affect one additional enemy only',()=>{
 for(const [weapon,id] of [['Bow','bow_pierce'],['Sword','sword_sweep'],['Mace','mace_shockwave']]){const {a,r}=startHorde(831,weapon);a.state().automaticTalents={xp:1000,nodes:[id]};untilPlayerHit(a,r);assert(r.enemies[1].hp<10000,weapon);assert.equal(r.enemies[2].hp,10000,weapon);assert.equal(r.enemies[3].hp,10000,weapon);if(weapon==='Mace')assert.equal(r.enemies[1].slowTime,1);}
});
test('arena renders each mob with its own portrait, idle image and health bar',()=>{
 const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('function phase3GroupEnemyMarkup(enemy,index,run){'),end=html.indexOf('\nfunction phase3BindGroupEnemyFocus',start),ui={ART:{enemy:'fallback.png'},esc:String,enemyDebuffMarkup:()=>''};vm.runInNewContext(html.slice(start,end)+'\nthis.markup=phase3GroupCombatMarkup;',ui);const first={name:'First',image:'first.gif',hp:20,maxhp:20},second={name:'Second',image:'second.gif',hp:10,maxhp:20},markup=ui.markup({enemies:[first,second],enemy:first});assert.equal((markup.match(/data-group-index=/g)||[]).length,2);assert.match(markup,/data-attack-src="first.gif" data-idle-src="first.png" src="first.png"/);assert.match(markup,/data-attack-src="second.gif" data-idle-src="second.png" src="second.png"/);assert.equal((markup.match(/id="enemyPortrait"/g)||[]).length,1);assert.match(markup,/id="arenaEnemyPortrait-1"/);
});

test('new routes contain one encounter per node and restore that rule',()=>{const a=create(912);a.start(1,true);const c=a.controller();assert.equal(c.state.encounterVersion,1);assert(c.state.offers.every(p=>p.waves===(p.event?0:1)));c.restore(JSON.parse(JSON.stringify(c.state)));assert(c.state.offers.every(p=>p.waves===(p.event?0:1)));});
test('horde defense scales down with mob durability',()=>{const g=C.createEnemyGroup(()=>({...make(),def:100,baseDef:100}),20,{scale:{hp:.1,atk:.18}});assert(g.every(e=>e.def===15&&e.baseDef===15));});
