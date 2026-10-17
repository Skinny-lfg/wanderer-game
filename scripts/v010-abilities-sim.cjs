// Experimental source-string transforms run only inside the existing Node VM.
// Production index.html, saves and Firebase are never written.
const assert=require('node:assert/strict');
const {harness}=require('./simulate-v091.cjs');
const {gear}=require('./v010-balance-ab.cjs');
const baseline=require('../docs/v010-progression-baseline.json').players;
const LEVELS=[20,40,60,80,100,120,160,200];
const THEMES=['temple','ash','frost','drowned'],ELITES=['tank','berserker','vampire','caster'];
const edit=(from,to)=>s=>{assert.equal(s.split(from).length-1,1,'Missing/ambiguous production anchor '+from.slice(0,50));return s.replace(from,to)};
const common=[
 edit('function weaponAttack(r){',`function protoMetric(r,key,n=1){const m=r.protoMetrics||(r.protoMetrics={});m[key]=(m[key]||0)+n;}
function weaponAttack(r){`),
 edit('r.mp-=cost;cast=true;element=',"r.mp-=cost;protoMetric(r,'manaSpent',cost);cast=true;element="),
 edit('if(r.tEnemy>=e.attackEvery*slowed){',"if(r.tEnemy>=e.attackEvery*slowed){protoMetric(r,'enemyAttacks');"),
 edit('if(hasDots){const applied=tickDots(e);e.hp-=applied;',"if(hasDots){const applied=tickDots(e);protoMetric(r,'dotDamage',applied);e.hp-=applied;"),
 edit('if(!effect)return;\n const bonus=s.bonus||{}',"if(!effect)return;\n if(state.run)protoMetric(state.run,'affinity:'+effect);\n const bonus=s.bonus||{}")
];
const variants={baseline:[]};
for(const [n,pct] of [['shatter20',.20],['shatter30',.30],['shatter40',.40]])variants[n]=[
 edit('if(cast){\n  if(damage>0&&Math.random()',`if(cast&&element==='slow'&&damage>0&&e.slowTime>0){const q=r.protoShatter||(r.protoShatter={enemy:null,hits:0});if(q.enemy!==e){q.enemy=e;q.hits=0;}q.hits++;if(q.hits>=3&&setReady(r,'protoShatter',6)){q.hits=0;const burst=setDirectEnemyDamage(r,s.spellPower*${pct},'Shatter');protoMetric(r,'shatterDamage',burst);protoMetric(r,'shatterProcs');}}\n if(cast){\n  if(damage>0&&Math.random()`)
];
for(const [n,pct] of [['frostbite6',.06],['frostbite10',.10],['frostbite14',.14]])variants[n]=[
 edit("return Math.min(.15,(b.poisonWeaken?",`return Math.min(.25,(e.slowTime>0&&(r.stats.main?.magic||r.stats.main?.effect)==='slow'?${pct}:0)+(b.poisonWeaken?`)
];
for(const [n,delay] of [['glacial25',.25],['glacial40',.40],['glacial60',.60]])variants[n]=[
 edit('if(cast){\n  if(damage>0&&Math.random()',`if(cast&&element==='slow'&&damage>0&&e.slowTime>0){const q=r.protoGlacial||(r.protoGlacial={enemy:null,hits:0});if(q.enemy!==e){q.enemy=e;q.hits=0;}q.hits++;if(q.hits>=3&&setReady(r,'protoGlacial',10)){q.hits=0;if(setDelayEnemy(r,e.boss?${delay}*.4:${delay}))protoMetric(r,'glacialDelays');}}\n if(cast){\n  if(damage>0&&Math.random()`)
];
for(const [n,share] of [['combust60',.60],['combust80',.80],['combust100',1]])variants[n]=[
 edit('src.push({damage:potency,remaining:3});enemy.dots[effect]=src;synchronizeDots(enemy);',`src.push({damage:potency,remaining:3});enemy.dots[effect]=src;synchronizeDots(enemy);if(effect==='burn'&&enemy.hp>0&&r&&r.stats.caster){const q=r.protoCombust||(r.protoCombust={enemy:null,applications:0});if(q.enemy!==enemy){q.enemy=enemy;q.applications=0;}q.applications++;if(q.applications>=3&&enemy.burnStacks>=3&&setReady(r,'protoCombust',8)){q.applications=0;const dot=enemy.dots.burn.shift();const moved=dot.damage*dot.remaining;const burst=setDirectEnemyDamage(r,moved*${share},'Combustion');protoMetric(r,'combustDamage',burst);protoMetric(r,'combustMoved',moved);protoMetric(r,'combustProcs');synchronizeDots(enemy);}}`)
];
for(const [n,pct] of [['ignition4',.04],['ignition6',.06],['ignition8',.08]])variants[n]=[
 edit('if(isMagicOffhand(off)&&off.magic===element)damage=Math.round(damage*1.30);',`if(isMagicOffhand(off)&&off.magic===element)damage=Math.round(damage*1.30);if(element==='burn'){const q=r.protoIgnite||(r.protoIgnite={stacks:0,until:0});if(now>q.until)q.stacks=0;damage=Math.round(damage*(1+q.stacks*${pct}));q.stacks=Math.min(3,q.stacks+1);q.until=now+5;protoMetric(r,'ignitionCasts');}`)
];
for(const [n,pct] of [['searing3',.03],['searing4',.04],['searing5',.05]])variants[n]=[
 edit('if(isMagicOffhand(off)&&off.magic===element)damage=Math.round(damage*1.30);',`if(isMagicOffhand(off)&&off.magic===element)damage=Math.round(damage*1.30);if(element==='burn'&&e.burnStacks>0){damage=Math.round(damage*(1+Math.min(4,e.burnStacks)*${pct}));protoMetric(r,'searingCasts');}`)
];
for(const [n,chance,ratio] of [['doubleA',.15,.40],['doubleB',.25,.55],['doubleC',.35,.65]])variants[n]=[
 edit('if(real>0)tryPassiveGearAffinity(r,real);',`if(kind==='Daggers'&&damage>0&&e.hp>0&&Math.random()<${chance}){let extra=Math.max(1,Math.round(base*${ratio}));if(e.barrier>0){const absorbed=Math.min(e.barrier,extra);e.barrier-=absorbed;extra-=absorbed;}e.hp-=extra;if(extra>0)floatText(extra,'enemy');protoMetric(r,'doubleStrikes');protoMetric(r,'doubleDamage',extra);}\n if(real>0)tryPassiveGearAffinity(r,real);`)
];
for(const [n,pct] of [['channel3',.03],['channel5',.05],['channel7',.07]])variants[n]=[
 edit('if(isMagicOffhand(off)&&off.magic===element)damage=Math.round(damage*1.30);',`if(isMagicOffhand(off)&&off.magic===element)damage=Math.round(damage*1.30);if(kind==='Staff'){const q=r.protoChannel||(r.protoChannel={stacks:0,until:0});if(now>q.until)q.stacks=0;damage=Math.round(damage*(1+q.stacks*${pct}));q.stacks=Math.min(3,q.stacks+1);q.until=now+4;protoMetric(r,'channelCasts');}`)
];
for(const [n,pct] of [['ward10',.10],['ward15',.15],['ward20',.20]])variants[n]=[
 edit('if(weapon?.subtype===\'Staff\'&&cast&&setReady(r,\'arcaneGuard\',6)){',`if(kind==='Staff'&&cast){r.protoWardCasts=(r.protoWardCasts||0)+1;if(r.protoWardCasts%3===0&&setReady(r,'protoWard',10)){r.protoWardUntil=now+4;protoMetric(r,'wardPrimed');}}\n if(weapon?.subtype==='Staff'&&cast&&setReady(r,'arcaneGuard',6)){`),
 edit('const mitigation=Math.max(lt.guard||0,lt.weaken||0);lt.guard=0;lt.weaken=0;',`const ward=(r.protoWardUntil||0)>setNow(r)?${pct}:0;if(ward){r.protoWardUntil=0;protoMetric(r,'wardHits');}const mitigation=Math.max(lt.guard||0,lt.weaken||0,ward);lt.guard=0;lt.weaken=0;`)
];
for(const [n,pct] of [['burst25',.25],['burst35',.35],['burst45',.45]])variants[n]=[
 edit('if(isMagicOffhand(off)&&off.magic===element)damage=Math.round(damage*1.30);',`if(isMagicOffhand(off)&&off.magic===element)damage=Math.round(damage*1.30);if(kind==='Staff'){r.protoBurstCasts=(r.protoBurstCasts||0)+1;if(r.protoBurstCasts%3===0&&r.mp>=4){r.mp-=4;protoMetric(r,'manaSpent',4);damage+=Math.round(s.spellPower*${pct});protoMetric(r,'burstProcs');}}`)
];
function compose(names,disabled=[]){let changes=[...common,...names.flatMap(name=>variants[name]||[])];if(disabled.length)changes.push(edit('if(!d||!legendaryHas(id)||!setReady(r,\'legendary:\'+id,d.cooldown))return false;',`if(${disabled.map(id=>`id==='${id}'`).join('||')}||!d||!legendaryHas(id)||!setReady(r,'legendary:'+id,d.cooldown))return false;`));return s=>changes.reduce((v,f)=>f(v),s);}
function transform(name,disabled=[]){return compose([name],disabled);}
function context(name='baseline',disabled=[]){return harness('index.html',{legendary:true,transform:transform(name,disabled)});}
function acquired(type,level){return baseline.map(p=>({p,s:p.snapshots[level]})).filter(({s})=>{if(!s)return false;const w=s.equip.weapon;if(type==='Frost')return (w?.magic||w?.effect)==='slow';if(type==='Fire')return (w?.magic||w?.effect)==='burn';return w?.subtype===type;});}
function fixtures(c,type,level){const build={Frost:'frost',Fire:'fire',Staff:'staff',Daggers:'daggers'}[type];c.campaign.reset((level*10007+[...type].reduce((n,ch)=>n+ch.charCodeAt(0),0))>>>0);return Array.from({length:4},(_,i)=>({generated:true,s:{equip:Object.fromEntries(gear(c.inspect,level,build,'mid',i).map(x=>{let item;for(let j=0;j<1000;j++){item=c.inspect.makeItem(x.tier,x.slot,x.effect,'loot',x.subtype,x.rarity);if(item.effect===x.effect)break;}assert.equal(item.effect,x.effect);return [x.slot,item];})),runes:[],runeSlots:[]}}));}
function caseList(c,type,level,maxAcquired=6){const a=acquired(type,level).slice(0,maxAcquired);return a.length?a.map(x=>({...x,generated:false})):fixtures(c,type,level);}
function trialOptions(s,level,k){return {level,equipment:s.equip,runes:s.runes,runeSlots:s.runeSlots,weapon:s.equip.weapon?.subtype,seed:(Math.imul(level*1009+k*7919+31053,2654435761)>>>0),theme:THEMES[k%4],elite:ELITES[Math.floor(k/2)%4],diagnostics:true};}
function aggregate(c,examples,level,n){let sum={wins:0,hp:0,seconds:0,damageIn:0,damageOut:0,dotDamage:0,manaSpent:0,enemyAttacks:0,attackCount:0,castCount:0,affinityTriggers:0,doubleStrikes:0,doubleDamage:0,shatterDamage:0,combustDamage:0,combustMoved:0,wardHits:0,glacialDelays:0,legendaryProcs:0},count=0;
 for(let i=0;i<n;i++){const r=c.trial(trialOptions(examples[i%examples.length].s,level,i));if(r.timeout)throw Error('Combat timeout at '+level);count++;sum.wins+=+r.win;for(const key of ['hp','seconds','damageIn','damageOut','dotDamage'])sum[key]+=r[key];sum.attackCount+=r.attacks;sum.castCount+=r.casts;sum.affinityTriggers+=Object.entries(r.protoMetrics).filter(([k])=>k.startsWith('affinity:')).reduce((a,[,v])=>a+v,0);for(const key of ['manaSpent','enemyAttacks','doubleStrikes','doubleDamage','shatterDamage','combustDamage','combustMoved','wardHits','glacialDelays'])sum[key]+=r.protoMetrics[key]||0;sum.legendaryProcs+=Object.values(r.legendaryProcs).reduce((a,b)=>a+b,0);}
 const p=sum.wins/n,z=1.96,den=1+z*z/n,center=(p+z*z/(2*n))/den,half=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den;
 return {n,wins:sum.wins,ci95:[+(center-half).toFixed(3),+(center+half).toFixed(3)],...Object.fromEntries(Object.entries(sum).filter(([k])=>k!=='wins').map(([k,v])=>[k,+(v/n).toFixed(2)]))};
}
module.exports={LEVELS,variants,context,compose,acquired,fixtures,caseList,aggregate,trialOptions};
