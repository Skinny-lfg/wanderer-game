'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function extract(source,name){
 const start=source.indexOf('function '+name+'(');
 assert(start>=0,'Missing native function '+name);
 const body=source.indexOf('{',start);
 let depth=0;
 for(let i=body;i<source.length;i++){
  if(source[i]==='{')depth++;
  else if(source[i]==='}'&&--depth===0)return source.slice(start,i+1);
 }
 throw Error('Unclosed function '+name);
}
function lightning(storm=false,active=4){
 const source=read('combat/v012-combat-runtime.js');
 const calls=[],metrics={},ports={
  state:{automaticTalents:{nodes:storm?['overcharge','storm_mastery']:['overcharge']}},
  phase1Build:{runtime:{talentBonuses:{}}},
  floatText(){},
  phase6Metric(r,key,n){metrics[key]=(metrics[key]||0)+n;},
  combatLinkEffect(r,kind,from,to){calls.push({kind,from,to});},
  addLog(){}
 };
 const ctx={ports,root:{},WandererV012Buildcraft:{enemyDefense:()=>0}};
 vm.createContext(ctx);
 vm.runInContext(['v013LightningChainFactors','v013SecondaryHit','v013LightningChainDamage']
   .map(name=>extract(source,name)).join('\n'),ctx);
 const enemies=Array.from({length:active},(_,i)=>({name:'Mob '+i,hp:10000,maxhp:10000,barrier:0,def:0,baseDef:0,boss:false}));
 const r={enemy:enemies[0],enemies,stats:{attack:10,spellPower:50,main:{subtype:'Staff'}},combatSeconds:1};
 return {r,metrics,calls,chain:ctx.v013LightningChainDamage};
}
test('Lightning uses five bounded jumps and persistent visible Static Marks, then detonates on a later chain',()=>{
 const {r,metrics,chain}=lightning(false,4);
 assert.equal(chain(r,50),5);
 assert.equal(metrics.lightningChainJumps,5);
 assert.equal(metrics.lightningMarksDetonated||0,0);
 for(const target of r.enemies.slice(1))assert.equal(target.v013LightningMark.serial,1);
 r.combatSeconds=2;
 assert.equal(chain(r,50),5);
 assert.equal(metrics.lightningMarksDetonated,3,'Only one detonation per previously marked enemy per chain');
 assert(metrics.lightningMarkDamage>0);
 assert.equal(metrics.lightningChainJumps,10);
 assert(r.enemies.slice(1).every(e=>e.v013LightningMark.serial===2));
 r.combatSeconds=11;
 assert.equal(chain(r,50),5);
 assert.equal(metrics.lightningMarksDetonated,3,'Expired marks must not detonate');
});
test('Storm Mastery adds one further hop, and no jumps target reserve enemies',()=>{
 const {r,metrics,chain}=lightning(true,4),reserve={name:'Unspawned',hp:10000,maxhp:10000};
 r.groupReserve=[reserve];
 assert.equal(chain(r,50),6);
 assert.equal(metrics.lightningChainJumps,6);
 assert.equal(reserve.v013LightningMark,undefined);
 assert.equal(reserve.hp,10000);
});
test('Lightning scales jumps with available active enemies, rather than multiplying small rooms',()=>{
 for(const [active,expected] of [[1,0],[2,1],[3,3],[4,5]]){
  const {r,chain}=lightning(false,active);
  assert.equal(chain(r,50),expected,'Unexpected jumps with '+active+' live enemies');
 }
});
test('Bloodshed transfers active Bleed and three ticks of direct immediate damage, but does not pre-hit reserves',()=>{
 const source=read('combat/v012-buildcraft.js');
 const context={rank:()=>0,specialized:(b,id)=>id==='blood_transfer',activated:()=>true,heal:()=>{},ready:()=>false};
 vm.createContext(context);
 vm.runInContext(extract(source,'onKill'),context);
 function exercise(active){
  const original={name:'Dead',hp:0,bleedStacks:1,dots:{bleed:[{damage:20,remaining:3}]}};
  const target={name:'Next',hp:100,maxhp:100,dots:{bleed:[]},bleedStacks:0};
  let claimed=0,synced=0,burst=0;
  const c={enemy:original,player:{maxhp:100,hp:100,enemies:active?[original,target]:[original],groupReserve:active?[]:[target]},
   now:1,waveComplete:false,
   synchronizeDots(){synced++;},
   secondaryHit(enemy,n){claimed++;enemy.hp-=n;return n;},
   trigger(id){if(id==='blood_transfer_burst')burst++;}};
  context.onKill({runtime:{}},c);
  assert.equal(target.dots.bleed.length,1);
  assert.equal(target.dots.bleed[0].damage,10);
  assert.equal(target.dots.bleed[0].transferred,true);
  assert.equal(synced,1);
  assert.equal(target.hp,active?70:100);
  assert.equal(claimed,active?1:0);
  assert.equal(burst,active?1:0);
 }
 exercise(true);exercise(false);
});
test('Active combat and documentation modules are exact mirrors and mark UI exists',()=>{
 for(const file of ['combat/v012-combat-runtime.js','combat/v012-buildcraft.js','combat/talent-catalog.js','combat/talent-graph-next.js','online/v012-expedition-runtime.js','index.html'])
  assert.equal(read(file),read('docs/'+file),'Divergent docs mirror: '+file);
 const main=read('index.html');
 assert(main.includes('Static Mark'));
 assert(main.includes('e.v013LightningMark?.expiresAt'));
 const source=read('online/v012-expedition-runtime.js');
 assert(source.includes('Math.round(transferredTick*3)'),'Contagion must burst immediately');
 assert(source.includes('r.enemies.includes(target)'),'No pre-spawn reserve death');
});
