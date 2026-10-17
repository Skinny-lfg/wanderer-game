const fs=require('node:fs');
const assert=require('node:assert/strict');
const {harness}=require('./simulate-v091.cjs');
const {gear}=require('./v010-balance-ab.cjs');
const {context,compose,aggregate,caseList}=require('./v010-abilities-sim.cjs');
const {makeIdentity,makeExample}=require('./v010-legendary-audit.cjs');
const base=context('baseline'),combo=harness('index.html',{legendary:true,transform:compose(['shatter30','doubleB'])});
const active=['winterheart-spire','tome-of-the-eternal-flame','pendant-of-the-first-flame','fang-of-the-sunbreaker','crescent-of-the-emberveil'];
function setFixture(type,count,level=40){const effect={Frost:'slow',Fire:'burn',Daggers:'crit'}[type];return caseList(base,type,level).map(({s:source})=>{
 const equip=JSON.parse(JSON.stringify(source.equip)),mutable=[];
 for(const [slot,item] of Object.entries(equip))if(item&&item.rarity!=='Legendary'){
  const pool=base.inspect.elementPool(item.slot,item.subtype),alt=pool.find(v=>v!==effect);if(!alt)continue;
  item.effect=alt;if(item.magic!==null)item.magic=alt;
  if(pool.includes(effect))mutable.push([slot,item]);
 }
 let remaining=count-base.inspect.setCounts(equip)[effect];
 for(const [slot,item] of mutable.sort((a,b)=>Number(b[0]==='weapon')-Number(a[0]==='weapon'))){const weight=slot==='weapon'&&base.inspect.isTwoHanded(item)?2:1;if(weight>remaining)continue;item.effect=effect;if(item.magic!==null)item.magic=effect;remaining-=weight;if(!remaining)break;}
 assert.equal(remaining,0);assert.equal(base.inspect.setCounts(equip)[effect],count);return {generated:true,s:{equip,runes:source.runes,runeSlots:source.runeSlots}};});}
function testLegend(id,build,slot,subtype){const variant=id==='winterheart-spire'?'shatter30':['tome-of-the-eternal-flame','pendant-of-the-first-flame'].includes(id)?'ignition4':['fang-of-the-sunbreaker','crescent-of-the-emberveil'].includes(id)?'doubleB':'baseline',ex=makeExample(base,build,id,slot,subtype),on=aggregate(context(variant),ex,100,100),off=harness('index.html',{legendary:true,transform:compose([variant],[id])}),offResult=aggregate(off,ex,100,100);return {id,variant,level:100,on,off:offResult};}
function run(){const rows=[];
 for(const [type,name] of [['Frost','shatter30'],['Fire','ignition4'],['Daggers','doubleB']])for(const count of [2,3,5]){const ex=setFixture(type,count);rows.push({kind:'setThreshold',type,name,count,level:40,base:aggregate(base,ex,40,100),combo:aggregate(combo,ex,40,100)});}
 for(const type of ['Frost','Fire','Daggers','Staff'])for(const [level,normal] of [[99,true],[100,false],[199,true],[200,false]]){const ex=caseList(base,type,normal?level+1:level);rows.push({kind:'bossNormal',type,level,normal,source:ex[0].generated?'generated':'acquired',base:aggregate(base,ex,level,100),combo:aggregate(combo,ex,level,100)});}
 const legendary=[testLegend('winterheart-spire','frost','weapon','Staff'),testLegend('tome-of-the-eternal-flame','wand','offhand','Tome'),testLegend('pendant-of-the-first-flame','fire','amulet','Amulet'),testLegend('starweaver-relic','wand','weapon','Wand'),testLegend('fang-of-the-sunbreaker','daggers','weapon','Daggers'),testLegend('crescent-of-the-emberveil','daggers','offhand','Off-Hand Dagger')];
 for(const [build,type] of [['dark','Wand'],['regen','Mace'],['shield','Mace']])for(const level of [100,200]){const specs=gear(base.inspect,level,build,'mid',0),equip={};for(const x of specs){let item;for(let i=0;i<1000;i++){item=base.inspect.makeItem(x.tier,x.slot,x.effect,'loot',x.subtype,x.rarity);if(item.effect===x.effect)break;}equip[x.slot]=item;}const ex=[{s:{equip,runes:[],runeSlots:[]}}];rows.push({kind:'control',build,level,base:aggregate(base,ex,level,100),combo:aggregate(combo,ex,level,100)});}
 return {candidate:['shatter30','doubleB'],rows,legendary};}
if(require.main===module){const result=run(),path='docs/v010-new-abilities-results.json',data=JSON.parse(fs.readFileSync(path));data.interactions=result;fs.writeFileSync(path,JSON.stringify(data)+'\n');console.log('interaction groups',result.rows.length,'legendary pairs',result.legendary.length);}
module.exports={run};
