// Actual native engine, synthetic RAM-only gear and Rune matrix. No E>200 projection.
const fs=require('node:fs'),crypto=require('node:crypto'),{performance}=require('node:perf_hooks'),create=require('../tests/v012-economy-harness.cjs');
const arms=['Sword','Mace','Bow','Daggers','Two-Handed','Staff','Wand'],families=['blood','decay','vitality','aegis','fury','magic'];
const priorities={blood:['bleeding_edge','deep_cuts','blood_drinker','sanguine_fury','executioner'],decay:['toxic_touch','virulent_rot','wasting_curse','wither','blight'],vitality:['renewal','strong_heart','life_bloom','second_breath','last_stand'],aegis:['barrier_pulse','fortified','iron_skin','guarded_block','retaliation'],fury:['quick_hands','precision','brutal_crit','double_strike','adrenaline'],magic:['overcharge','kindling','deep_winter','arcane_focus','elemental_force','mana_spring','efficient_cast','arcane_echo']};
const partners={blood:['decay','magic'],decay:['blood','magic'],vitality:['aegis','magic'],aegis:['vitality','fury'],fury:['magic','blood'],magic:['fury','aegis']};
function run(config){
 const {E,weapon,rarity,family,strategy,runes,seed}=config,start=performance.now(),a=create(seed,undefined,{}, {measure:true,now:1700000000000}),B=a.buildcraft;
 a.setup(E,weapon,rarity);const s=a.state(),g=a.controller().state;g.unlocked=E;
 if(runes){s.runes=['vitality','warding',['Staff','Wand'].includes(weapon)?'wisdom':'might'].map(f=>a.makeRune(f,E));s.runeSlots=s.runes.map(r=>r.id);}
 let steering=seed;const random=()=>((steering=(Math.imul(steering,1664525)+1013904223)>>>0)/4294967296);
 const target=[family,...partners[family]].slice(0,strategy==='mono'?1:strategy==='dual'?2:3);
 a.start(E);a.initial(family);const runtime=a.build().runtime,extra=a.events.run();if(family==='magic')a.element(['fire','frost','lightning'][seed%3]);
 let firstFight=null;
 let ticks=0,error=null,timeout=false,firstHybrid=null,hybridOffers=0,usefulUpgrades=0,synergyCards=0,cardCount=0,pity=0,win=false,last={hp:0,mp:0,maxhp:0},lastPick=[],routes=[],waves=0,bossReached=false;
 for(let step=0;step<45000;step++){
  if(['finished','failed'].includes(g.stage))break;
  const draft=a.draft(),r=s.run,event=extra.event;
  if(draft?.step==='element'){a.element(['fire','frost','lightning'][seed%3]);continue;}
  if(draft?.step==='passive'){
   const cards=draft.options;cardCount+=3;usefulUpgrades+=cards.filter(p=>p.category==='Upgrade'&&p.preview.useful).length;synergyCards+=cards.filter(p=>p.category==='Synergy'&&B.functional(a.build(),p)).length;
   if(cards.some(p=>p.requires.length))hybridOffers++;if(cards.some(p=>p.pity))pity++;
   let pick;if(strategy==='random')pick=cards[Math.floor(random()*3)];else{
    const score=p=>{const own=B.ownedRank(a.build(),p.id),order=priorities[p.family]?.indexOf(p.id)??-1;
     if(strategy==='mono')return (p.family===family?300:0)+(own>0?100:0)+(order<0?0:60-order*8);
     const copy={...a.build(),picks:[...a.build().picks,p.id]},enables=B.CATALOG.filter(q=>q.requires.length&&q.requires.every(f=>target.includes(f))&&B.functional(copy,q)&&!B.functional(a.build(),q)).length;
     return (p.requires.length?(p.requires.every(f=>target.includes(f))?1000:-1000):0)+enables*150+(target.includes(p.family)?80:0)+(own>0?15:0)+(order<0?0:60-order*6);
    };pick=[...cards].sort((x,y)=>score(y)-score(x))[0];
   }
   if(!a.passive(pick.id)){error='Passive rejected';break;}if(pick.requires.length&&firstHybrid===null)firstHybrid=draft.plane.plane;lastPick=[...a.build().picks];
  }else if(event){if(!a.events.choose(2)){error='Event refused';break;}}
  else if(r?.status==='cleared'||a.results().eventExitPending){if(!a.exitResult()){error='Realm exit rejected';break;}}
  else if(r?.status==='fight'){
   bossReached ||=r.enemy.boss;const enemy=r.enemy;
   if(!firstFight){const st=r.stats||{},v=r.enemy;firstFight={playerHP:r.hp,playerMaxHP:r.maxhp,playerAttack:st.attack,playerDefense:st.defense,playerSpeed:st.attacksPerSec,playerCrit:st.crit,playerPower:st.power,enemyHP:v.maxhp,enemyAttack:v.atk,enemyDefense:v.def,enemyInterval:v.attackEvery,enemyElite:!!v.miniboss};}
   let inner=0;
   while(s.run===r&&r.status==='fight'&&r.enemy===enemy&&inner++<2200&&ticks<45000){last={hp:r.hp,mp:r.mp,maxhp:r.maxhp,crit:r.stats.crit,block:r.stats.blockChance};a.tick();ticks++;}
   if(inner>=2200||ticks>=45000){timeout=true;break;}if(enemy.hp<=0)waves++;a.flush();
  }else if(r?.status==='ready')a.flush();
  else if(g.stage==='choice'){
   for(let n=0;a.bag.overflow();n++){if(n>40||!a.bag.discard(a.bag.items().at(-1).id)){error='Bag blocked';break;}}if(error)break;
   let pick;if(!g.history.length)pick=g.offers.find(p=>p.family===family);else if(strategy==='random')pick=g.offers[Math.floor(random()*g.offers.length)];else pick=[...g.offers].sort((x,y)=>{
    const score=p=>(target.includes(p.family)?100:0)+(!a.build().unlockedFamilies.includes(p.family)&&target.includes(p.family)?100:0)-p.waves;
    return score(y)-score(x);
   })[0];
   if(!pick||!a.select(pick.id)||!a.enter()){error='Realm entry rejected';break;}routes.push(pick.family);
  }else{error='Unhandled '+g.stage;break;}
 }
 win=g.stage==='finished';if(!win&&g.stage!=='failed'&&!timeout&&!error)error='Unterminated';
 const metrics=extra.metrics||{},seconds=ticks*.11,m=a.measured,hybrids=lastPick.filter(id=>B.CATALOG.find(p=>p.id===id)?.requires.length);
 return {...config,firstFight,win,reached:Math.min(15,g.history.length+(g.stage==='failed'?1:0)),bossReached,waves,seconds:+seconds.toFixed(2),wallMs:Math.round(performance.now()-start),dps:+((metrics.damageDealt||0)/Math.max(1,seconds)).toFixed(2),damage:metrics.damageDealt||0,dot:Math.round(m.dot),peakProcBurst:m.burst,maxhp:last.maxhp,observedEhpBudget:Math.round(last.maxhp+m.healed+m.absorbed),hp:win?last.hp:0,mana:last.mp,critChance:last.crit,blockChance:last.block,criticalHits:m.crit,weaponAttacks:m.attacks,blocks:m.blocks,incomingAttacks:m.incoming,healPerSecond:+(m.healed/Math.max(1,seconds)).toFixed(3),barrierPerSecond:+(m.barrier/Math.max(1,seconds)).toFixed(3),telemetry:runtime.passiveTelemetry||{},hybrids,firstHybrid,hybridOffers,usefulUpgrades,synergyCards,cardCount,pityPresentations:pity,missing:target.filter(f=>!routes.includes(f)),routes,actualFamilies:[...new Set(routes)],targetFamilies:target,unplannedFamilies:[...new Set(routes)].filter(f=>!target.includes(f)),targetHybrids:hybrids.filter(id=>B.CATALOG.find(p=>p.id===id).requires.every(f=>target.includes(f))),rngEnd:a.checkpoint.seed(),error,timeout};
}
function aggregate(rows,keys){const buckets=new Map();for(const row of rows){const key=keys.map(k=>row[k]).join('/');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(row);}const q=(a,p)=>[...a].sort((x,y)=>x-y)[Math.floor((a.length-1)*p)];return [...buckets].map(([key,a])=>({key,n:a.length,wins:a.filter(r=>r.win).length,winPct:+(100*a.filter(r=>r.win).length/a.length).toFixed(1),medianRealm:q(a.map(r=>r.reached),.5),p90Realm:q(a.map(r=>r.reached),.9),medianSeconds:q(a.map(r=>r.seconds),.5),medianDps:q(a.map(r=>r.dps),.5),hybridRuns:a.filter(r=>r.hybrids.length).length,medianFirstHybrid:q(a.map(r=>r.firstHybrid).filter(x=>x!==null),.5)??null,missingFamilyRuns:a.filter(r=>r.missing.length).length,unplannedFamilyRuns:a.filter(r=>r.unplannedFamilies.length).length,targetHybridRuns:a.filter(r=>r.targetHybrids.length).length,timeouts:a.filter(r=>r.timeout).length,errors:a.filter(r=>r.error).length}));}
if(require.main===module){
 const rows=[],limit=Number(process.env.WANDERER_AFFINITY_LIMIT||0),start=performance.now();
 outer:for(const E of [1,10,50,100,200])for(const weapon of arms)for(const rarity of ['Rare','Epic'])for(const family of families)for(const strategy of ['random','mono','dual','triple'])for(const runes of [true,false]){
  rows.push(run({E,weapon,rarity,family,strategy,runes,seed:20261020+E*31+arms.indexOf(weapon)*97+families.indexOf(family)*17+(rarity==='Epic'?11:0)}));if(rows.length%100===0)process.stderr.write('Completed '+rows.length+' native runs\n');if(limit&&rows.length>=limit)break outer;
 }
 const result={type:'native-integrated-affinity-rework',sourceHash:crypto.createHash('sha256').update(fs.readFileSync('combat/v012-buildcraft.js')).digest('hex'),cases:rows.length,wallSeconds:+((performance.now()-start)/1000).toFixed(1),limits:{maxTicks:45000,maxWaveTicks:2200},policy:'Same tier and rarity gear; zero potions, decline events, no equipment upgrades; steering RNG separate, initial combat seeds paired; observed EHP budget = MaxHP + actual healing + actual Barrier absorption, not a theoretical EHP formula.',groups:aggregate(rows,['E','strategy','runes']),weapons:aggregate(rows,['weapon','strategy']),families:aggregate(rows,['family','strategy']),rows};
 fs.writeFileSync(process.argv[2]||'/tmp/v012-affinity-combat-results.json',JSON.stringify(result)+'\n');console.log(JSON.stringify({cases:rows.length,wallSeconds:result.wallSeconds,errors:rows.filter(r=>r.error).length,timeouts:rows.filter(r=>r.timeout).length}));if(rows.some(r=>r.error))process.exitCode=1;
}
module.exports={run,aggregate};
