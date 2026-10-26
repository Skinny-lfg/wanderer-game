// Paired A/B combat checkpoint simulation. All profiles are synthetic RAM-only;
// each case uses identical tier, seed, weapon and affinity across the four arms.
const fs=require('node:fs'),crypto=require('node:crypto'),create=require('../tests/v012-economy-harness.cjs');
const tiers=[1,10,20,50,100,200],families=['blood','decay','vitality','aegis','fury','magic'],arms=[0,8,10,12],repetitions=Math.max(1,Math.min(70,Number(process.env.GAUNTLET_REPS)||70));
const passivePriority={blood:['bleeding_edge','deep_cuts','blood_drinker','executioner'],decay:['toxic_touch','virulent_rot','wither','blight'],vitality:['renewal','strong_heart','second_breath','life_bloom'],aegis:['fortified','iron_skin','barrier_pulse','guarded_block'],fury:['quick_hands','precision','double_strike','brutal_crit'],magic:['overcharge','arcane_focus','mana_spring','efficient_cast']};
const rows=[];let runId=0;
function hasNormalOffer(E,family,seed){const a=create(seed,undefined,{}, {skipPersistence:true});a.controller().state.unlocked=E;const tier=E,weapon=['Sword','Mace','Bow','Daggers','Two-Handed','Staff','Wand'][seed%7],rarity=seed%3===0?'Epic':'Rare';a.setup(tier,weapon,rarity);const armor=['Cloth','Leather','Plate'][seed%3];for(const slot of ['helm','armor','gloves','boots','belt'])a.state().equip[slot]=a.makeItem(tier,slot,null,'loot',armor,rarity);if(seed%4===0)a.state().equip.weapon=a.makeItem(tier,'weapon',null,'loot',weapon,'Legendary');a.start(E);a.initial(family);return a.controller().state.offers.some(x=>!x.elite&&!x.boss&&!x.event);}
function one(E,family,seed,arm){
 const start=Date.now(),a=create(seed,undefined,{}, {skipPersistence:true,measure:true,hostname:'localhost',search:`?expeditionPhase1=1${arm?'&gauntlet='+arm:''}`});
 const s=a.state(),weapon=['Sword','Mace','Bow','Daggers','Two-Handed','Staff','Wand'][seed%7],tier=E;
 a.controller().state.unlocked=E;a.setup(tier,weapon,seed%3===0?'Epic':'Rare');
 const armor=['Cloth','Leather','Plate'][seed%3];for(const slot of ['helm','armor','gloves','boots','belt'])s.equip[slot]=a.makeItem(tier,slot,null,'loot',armor,seed%3===0?'Epic':'Rare');
 if(seed%4===0)s.equip.weapon=a.makeItem(tier,'weapon',null,'loot',weapon,'Legendary');
 a.start(E);a.initial(family);const g=a.controller().state;if(family==='magic')a.element(['fire','frost','lightning'][seed%3]);
 // Define the tested build archetype explicitly. Product progression grants
 // this starter when the first Realm resolves; the simulator begins combat
 // at that point so passives/Legendary hooks are observable in every arm.
 a.initialPassive(a.build(),family);
 let offer=g.offers.find(x=>x.family===family&&!x.elite&&!x.boss&&!x.event)||g.offers.find(x=>!x.elite&&!x.boss&&!x.event);
 if(!offer)throw Error(`No normal offer E${E} ${family} seed ${seed} arm ${arm}; stage ${g.stage}; offers ${JSON.stringify(g.offers)}`);a.select(offer.id);a.enter();
 if(a.draft()?.step==='element')a.element(['fire','frost','lightning'][seed%3]);
 if(a.draft()?.step==='passive'){const order=passivePriority[family]||[],pick=[...a.draft().options].sort((x,y)=>(order.indexOf(x.id)<0?99:order.indexOf(x.id))-(order.indexOf(y.id)<0?99:order.indexOf(y.id)))[0];a.passive(pick.id);}
 if(a.draft()?.step==='element')a.element(['fire','frost','lightning'][seed%3]);if(a.draft()?.step==='passive')a.passive(a.draft().options[0].id);
 const r=s.run,before={gold:s.gold,fragments:s.fragments},passiveStart=Object.fromEntries(Object.entries(a.build()?.runtime?.passiveTelemetry||{}).map(([k,v])=>[k,v.activations||0]));
 let ticks=0,kills=0,intervals=[],lastKillTick=0,lastKillEnemy=null,previous=r.enemy,timeout=false,transitionTicks=0;const seenEnemies=new WeakSet(),enemyStats=[];
 for(let guard=0;guard<200000&&g.stage==='combat';guard++){
  if(r.status==='fight'){
   const enemy=r.enemy;if(enemy&&!seenEnemies.has(enemy)){seenEnemies.add(enemy);enemyStats.push({hp:enemy.maxhp,attack:enemy.atk});}a.tick();ticks++;
   // This inert harness does not run the browser's winEncounter callback;
   // commit the native victory transition when the integrated combat tick has
   // reduced this enemy to zero HP.
   if(enemy.hp<=0&&r.enemy===enemy&&r.status==='fight')a.win();
   if(enemy.hp<=0&&lastKillEnemy!==enemy){kills++;intervals.push((ticks-lastKillTick)*.11);lastKillTick=ticks;lastKillEnemy=enemy;previous=r.enemy;}
   if(s.run!==r||g.stage!=='combat')break;
   if(r.status==='cleared'||r.hp<=0)break;
   continue;
  }
  if(r.status==='ready'){
   // Old Wave transitions use the production 650 ms callback. Advance it and
   // account for that wait separately from combat clock time.
   transitionTicks++;a.flush();if(r.status==='ready'&&r.enemy===previous){timeout=true;break;}continue;
  }
  break;
  if(guard===199999)timeout=true;
 }
 if(r.status==='fight'&&ticks>=200000)timeout=true;
 if(g.stage==='combat'&&r.status==='cleared'&&a.draft()?.kind==='reward')a.passive(a.draft().options[0].id);
 const tele=a.build()?.runtime?.passiveTelemetry||{},passives={};for(const [k,v]of Object.entries(tele)){const n=(v.activations||0)-(passiveStart[k]||0);if(n)passives[k]=n;}
 const metrics=a.events.run()?.metrics||{};const actualSeconds=+(r.combatSeconds||0),transitionSeconds=arm?0:transitionTicks*.65;
 return {E,family,seed,arm:arm||'baseline',count:arm||offer.waves,selectedWaves:offer.waves,weapon,armor,kills,enemyCount:enemyStats.length,enemyHp:enemyStats.map(x=>x.hp),enemyAttack:enemyStats.map(x=>x.attack),ticks,combatSeconds:actualSeconds,transitionSeconds,elapsedCombatAndTransitions:+(actualSeconds+transitionSeconds).toFixed(3),meanKillInterval:+(intervals.length?intervals.reduce((x,y)=>x+y,0)/intervals.length:0).toFixed(3),damageDealt:Math.round(metrics.damageDealt||0),damageTaken:Math.round(metrics.damageTaken||0),dps:+((metrics.damageDealt||0)/Math.max(.001,actualSeconds)).toFixed(2),healed:a.measured.healed,barrierGenerated:a.measured.barrier,barrierAbsorbed:a.measured.absorbed,gold:s.gold-before.gold,fragments:s.fragments-before.fragments,items:a.results().earned.length,treasures:r.valuables.length,survived:r.hp>0,completed:r.status==='cleared',finalHp:+r.hp.toFixed(1),passives,legendaryProcs:Object.fromEntries(Object.entries(metrics.procs||{}).filter(([k])=>String(k).startsWith('Legendary'))),timedOut:timeout,wallMs:Date.now()-start};
}
for(const E of tiers)for(const family of families)for(let rep=0;rep<repetitions;rep++){
 let seed=(E*100000+families.indexOf(family)*1000+rep+1)>>>0;while(!hasNormalOffer(E,family,seed))seed=(seed+1)>>>0;
 for(const arm of arms){const row=one(E,family,seed,arm);rows.push(row);runId++;if(runId%500===0)console.log(`completed ${runId}/${tiers.length*families.length*repetitions*arms.length}`);}
}
const groups=new Map();for(const r of rows){const key=`${r.E}|${r.family}|${r.arm}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
const summaries=[...groups.entries()].map(([key,rs])=>{const [E,family,arm]=key.split('|'),avg=k=>+(rs.reduce((n,r)=>n+(Number(r[k])||0),0)/rs.length).toFixed(3),sumObjects=k=>Object.fromEntries(rs.flatMap(r=>Object.entries(r[k]||{})).reduce((m,[id,n])=>m.set(id,(m.get(id)||0)+Number(n||0)),new Map())),complete=rs.filter(r=>r.completed),enemyHp=rs.flatMap(r=>r.enemyHp),enemyAttack=rs.flatMap(r=>r.enemyAttack);return {E:Number(E),family,arm,n:rs.length,completed:complete.length,killCount:avg('kills'),enemyCount:avg('enemyCount'),meanEnemyHP:+(enemyHp.reduce((a,b)=>a+b,0)/Math.max(1,enemyHp.length)).toFixed(1),enemyHPRange:[Math.min(...enemyHp),Math.max(...enemyHp)],meanEnemyAttack:+(enemyAttack.reduce((a,b)=>a+b,0)/Math.max(1,enemyAttack.length)).toFixed(1),combatSeconds:avg('combatSeconds'),transitionSeconds:avg('transitionSeconds'),elapsed:avg('elapsedCombatAndTransitions'),damageDealt:avg('damageDealt'),damageTaken:avg('damageTaken'),dps:avg('dps'),healed:avg('healed'),barrierGenerated:avg('barrierGenerated'),barrierAbsorbed:avg('barrierAbsorbed'),gold:avg('gold'),fragments:avg('fragments'),items:avg('items'),completedGold:+(complete.reduce((n,r)=>n+r.gold,0)/Math.max(1,complete.length)).toFixed(2),completedFragments:+(complete.reduce((n,r)=>n+r.fragments,0)/Math.max(1,complete.length)).toFixed(2),completedItems:+(complete.reduce((n,r)=>n+r.items,0)/Math.max(1,complete.length)).toFixed(2),passiveActivations:sumObjects('passives'),legendaryProcs:sumObjects('legendaryProcs'),survivalRate:+(rs.filter(r=>r.survived).length/rs.length).toFixed(3),timeouts:rs.filter(r=>r.timedOut).length,wallMs:rs.reduce((n,r)=>n+r.wallMs,0)};});
const result={method:'paired one-Realm synthetic combat, native integrated engine; same seed/tier/build input across baseline and 8/10/12 arms',arms:arms.map(x=>x||'baseline'),tiers,families,repetitions,cases:rows.length,timeouts:rows.filter(r=>r.timedOut).length,htmlSha256:crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),summary:summaries,rows};
fs.writeFileSync(process.argv[2]||'test-results/v013-phase2a/simulation.json',JSON.stringify(result));
console.log(JSON.stringify({cases:result.cases,timeouts:result.timeouts,summary:summaries},null,2));
