// Real classic combat runtime v0.12 integration: deterministic, no account/save/deploy.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const main=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const boot='load();if(!state.merchant)rollShop();save();render();';
assert(main?.includes(boot),'unchanged classic bootstrap');
const seed=String.raw`
 fresh();
 animateStrike=animateDefense=animateEnemyStrike=floatText=updateBars=render=renderCombat=save=()=>{};
 addLog=()=>{};winEncounter=()=>{state.run.status='ready';};die=()=>{state.run.status='dead';};
 Math.random=()=>.1;phase1Clock=0;
 const results=[];
 for(const weaponType of ['Sword','Mace','Bow','Daggers','Two-Handed','Staff','Wand']){
  for(const affinity of ['blood','decay','vitality','aegis','fury','magic']){
   const elements=affinity==='magic'?['fire','frost','lightning']:[null];
   for(const magicElement of elements){
    phase1Build=WandererV012Buildcraft.create();phase1Build.families=[affinity];
    phase1Build.element=magicElement;
    phase1Build.picks=WandererV012Buildcraft.CATALOG.filter(p=>p.family===affinity&&!p.requires.length&&!p.element).map(p=>p.id);
    state.equip=makeSlots();state.equip.weapon=makeItem(30,'weapon',null,'loot',weaponType,'Rare');
    state.equip.armor=makeItem(30,'armor',null,'loot','Armor','Rare');
    const stats=phase2Stats();
    state.run={phase1:true,phase1Magic:!!magicElement,tier:15,path:'temple',enc:1,status:'fight',
      stats,hp:stats.maxhp,maxhp:stats.maxhp,mp:stats.mana,maxmp:stats.mana,
      barrier:0,combatSeconds:0,tPlayer:0,tEnemy:0,tDot:0,setCooldowns:{},enemy:null};
    const r=state.run;
    r.enemy=enemyFor(15,1,{theme:THEMES[0],boss:false,elite:false});
    r.enemy.hp=r.enemy.maxhp=300000;r.enemy.atk=1;r.enemy.attackEvery=100000;
    r.enemy.barrier=0;
    WandererV012Buildcraft.resetWave(phase1Build,r.enemy);
    for(let tick=0;tick<210&&r.status==='fight';tick++)updateFight();
    results.push({weaponType,affinity,element:magicElement,hp:r.hp,mp:r.mp,
      rot:r.enemy.v012Rot?.length||0,shock:r.enemy.v012Shock||0,
      bleed:r.enemy.bleedStacks,burn:r.enemy.burnStacks,slow:r.enemy.slowTime,
      enemyDamage:300000-r.enemy.hp,gearTwoHand:!stats.off&&['Two-Handed','Bow','Staff'].includes(weaponType),
      caster:stats.caster});
   }
  }
 }
 // Existing legendary hooks are not replaced by the Expedition adapter.
 phase1Build=WandererV012Buildcraft.create();phase1Build.families=['magic'];phase1Build.element='fire';
 const signature=LEGENDARY_CATALOG.find(x=>x.slot==='weapon'&&x.subtype==='Sword');
 if(!signature)throw Error('Classic Legendary catalog must include a Sword');
 let item,legendSeed=39;Math.random=()=>{legendSeed=(Math.imul(legendSeed,1664525)+1013904223)>>>0;return legendSeed/4294967296;};
 for(let k=0;k<500;k++){item=makeItem(30,'weapon',null,'loot','Sword','Legendary');if(item.legendaryId===signature.id)break;}
 if(item.legendaryId!==signature.id||!legendarySignature(item))throw Error('Legendary fixture unavailable');
 state.equip=makeSlots();state.equip.weapon=item;
 const s=phase2Stats();state.run={phase1:true,phase1Magic:true,tier:15,path:'temple',enc:1,status:'fight',
  stats:s,hp:s.maxhp,maxhp:s.maxhp,mp:s.mana,maxmp:s.mana,barrier:0,combatSeconds:0,tPlayer:0,tEnemy:0,tDot:0,enemy:null};
 state.run.enemy=enemyFor(15,1,{theme:THEMES[0],boss:false,elite:false});
 state.run.enemy.hp=100000;weaponAttack(state.run);
 globalThis.__phase2Combat={results,legendaryId:item.legendaryId,signature:!!legendarySignature(item)};
`;
const store=new Map();const node=()=>({innerHTML:'',textContent:'',style:{},dataset:{},classList:{remove(){},add(){}},focus(){}});
const sandbox={document:{getElementById:()=>node(),querySelectorAll:()=>[],querySelector:()=>null,createElement:node},
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},URLSearchParams,
 location:{search:'?expeditionPhase1=1'},setTimeout:()=>0,setInterval:()=>0,clearTimeout:()=>{},clearInterval:()=>{},console};
const source=[fs.readFileSync('combat/legendary.js','utf8'),fs.readFileSync('combat/v012-buildcraft.js','utf8'),main.replace(boot,seed)].join('\n');
vm.runInNewContext(source,sandbox,{filename:'v012-classic-combat.js',timeout:20000});
const result=sandbox.__phase2Combat;assert(result?.signature,'Legendary identity survives original battle');
assert.equal(result.results.length,56,'seven weapon types by eight family/element combinations');
for(const o of result.results){
 assert(Number.isFinite(o.hp)&&Number.isFinite(o.mp)&&Number.isFinite(o.enemyDamage)&&o.enemyDamage>0,JSON.stringify(o));
 assert(o.hp>=0&&o.mp>=0&&o.rot<=6&&o.shock<=4,'bounded combat '+JSON.stringify(o));
 assert.equal(o.caster,['Staff','Wand'].includes(o.weaponType),'original class weapon rules preserved');
}
for(const w of ['Sword','Bow','Staff','Wand']){
 const cases=result.results.filter(r=>r.weaponType===w&&r.affinity==='magic');
 assert.equal(cases.length,3);
 assert(cases.find(r=>r.element==='fire').enemyDamage>0,'Fire on '+w);
 assert(cases.find(r=>r.element==='lightning').enemyDamage>0,'Shock on '+w);
 assert(cases.find(r=>r.element==='frost').enemyDamage>0,'Frost on '+w);
}
console.log('PASS v0.12 original combat: 56 bounded weapon/family/element simulations and Legendary Sword hooks');
