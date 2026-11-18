'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const Links=require('../online/v013-combat-links.js');
function actor(name){return {name,role:'skirmisher',hp:100,maxhp:100};}
function mockArena(run){
 const participants=new Map(),effects=[];
 function rectangle(left,top,w=70,h=95){return {left,top,width:w,height:h};}
 const area={getBoundingClientRect:()=>rectangle(0,0,900,500),
  querySelector(selector){
   if(selector==='#heroPortrait')return {getBoundingClientRect:()=>rectangle(100,240)};
   const index=Number(selector.match(/\[data-group-index="(\d+)"\]/)?.[1]);
   if(!Number.isFinite(index))return null;
   if(!run.enemies?.[index])return null;
   return {querySelector:()=>({getBoundingClientRect:()=>rectangle(350+index*100,100+index*60)})};
  },
  querySelectorAll(selector){assert.equal(selector,'.combatLinkFx');return effects.filter(e=>!e.removed);},
  appendChild(fx){effects.push(fx);}
 };
 const fakeDoc={visibilityState:'visible',getElementById:id=>id==='scene'?area:null,
  createElement:tag=>{
   assert.equal(tag,'span');
   const styles={};return {tag,style:{setProperty(key,value){styles[key]=value;},styles},dataset:{},
    setAttribute(key,value){assert.equal(key,'aria-hidden');assert.equal(value,'true');},
    addEventListener(type,fn){assert.equal(type,'animationend');this.finish=fn;},
    remove(){this.removed=true;}};
  }
 };
 return {fakeDoc,effects,area};
}
test('palette defines visually distinct AoE, DoTs, heals, wards and transfers',()=>{
 for(const type of ['aoe','cleave','pierce','shock','bleed','rot','burn','frost','ward','heal','rally','siphon','summon','pulse']){
  assert(Array.isArray(Links.COLORS[type]),type);
  assert.equal(Links.COLORS[type].length,2);
 }
 assert(Links.MAX_ACTIVE<=8&&Links.MAX_TARGETS<=4&&Links.DURATION<1000);
});
test('visuals connect actual visible targets, cap simultaneous effects and never mutate a run',()=>{
 const first=actor('first'),second=actor('second'),third=actor('third'),reserved=actor('reserved');
 const run={status:'fight',phase1:true,combatSeconds:14,enemies:[first,second,third],enemy:first,groupReserve:[reserved]};
 const {fakeDoc,effects}=mockArena(run);
 const prior=globalThis.document,media=globalThis.matchMedia;
 try{
  globalThis.document=fakeDoc;globalThis.matchMedia=()=>({matches:false});
  const before=JSON.stringify(run);
  assert.equal(Links.show(run,'bleed',first,[second,third]),2);
  assert.equal(Links.show(run,'bleed',first,[second,third]),0,'duplicate within same tick is throttled');
  assert.equal(Links.show(run,'bleed',first,[third]),1,'different target remains visible');
  assert.equal(Links.show(run,'rot',first,[reserved]),0,'queued reinforcements are not drawn');
  assert.equal(Links.show(run,'shock',first,['hero']),1);
  assert.equal(Links.show(run,'ward',first,[first]),1,'self Barrier creates a pulse');
  assert.equal(effects[0].style.styles['--link-x'],'385.0px');
  assert.equal(effects[0].style.styles['--link-length'],Math.hypot(100,60).toFixed(1)+'px');
  assert.equal(effects[0].dataset.effect,'bleed');
  assert(effects[0].className.includes('combatLinkFx'));
  assert.equal(JSON.stringify(run),before,'VFX cannot change combat data or persistence');
  for(let i=0;i<18;i++){run.combatSeconds++;Links.show(run,i%2?'burn':'frost',first,[second]);}
  assert(effects.filter(e=>!e.removed).length<=Links.MAX_ACTIVE);
  const last=effects.at(-1);last.finish({animationName:'combatLinkTravel'});assert(!last.removed);
  last.finish({animationName:'combatLinkFade'});assert(last.removed);
 }finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior;if(media===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=media;}
});
test('reduced motion, hidden tabs, inactive combat and absent DOM suppress animations',()=>{
 const a=actor('a'),b=actor('b'),r={phase1:true,status:'fight',combatSeconds:0,enemies:[a,b],enemy:a};
 const {fakeDoc}=mockArena(r),old=globalThis.document,media=globalThis.matchMedia;
 try{
  globalThis.document=fakeDoc;globalThis.matchMedia=()=>({matches:true});
  assert.equal(Links.show(r,'aoe',a,[b]),0);
  globalThis.matchMedia=()=>({matches:false});fakeDoc.visibilityState='hidden';
  assert.equal(Links.show(r,'aoe',a,[b]),0);
  fakeDoc.visibilityState='visible';r.status='ready';
  assert.equal(Links.show(r,'aoe',a,[b]),0);
  r.status='fight';r.phase1=false;assert.equal(Links.show(r,'aoe',a,[b]),0);
  r.phase1=true;delete globalThis.document;assert.equal(Links.show(r,'aoe',a,[b]),0);
  assert.equal(Links.show(r,'unknown',a,[b]),0);
 }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;if(media===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=media;}
});
test('native hooks, docs and preview content hashing are wired and mirrored',()=>{
 const html=fs.readFileSync('index.html','utf8'),docs=fs.readFileSync('docs/index.html','utf8');
 for(const markup of [html,docs]){
  assert(markup.includes('online/v013-combat-links.js'));
  assert(markup.includes('get combatLinkEffect(){return combatLinkEffect;}'));
 }
 for(const [a,b]of [
 ['online/v013-combat-links.js','docs/online/v013-combat-links.js'],
 ['online/v013-combat-arena.css','docs/online/v013-combat-arena.css'],
 ['combat/v012-combat-runtime.js','docs/combat/v012-combat-runtime.js'],
 ['online/v012-expedition-runtime.js','docs/online/v012-expedition-runtime.js'],
 ['online/v013-expedition-boons.js','docs/online/v013-expedition-boons.js']]){
  assert.equal(fs.readFileSync(a,'utf8'),fs.readFileSync(b,'utf8'),a+' docs drift');
 }
 const combat=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
 const expedition=fs.readFileSync('online/v012-expedition-runtime.js','utf8');
 assert(combat.includes("label.includes('Chain Lightning')?'shock'"));
 assert(combat.includes("event.label==='Guarding'?'ward'"));
 assert(combat.includes("combatLinkEffect?.(r,'rot',previous,[e])"));
 assert(expedition.includes("combatLinkEffect?.(r,'bleed',enemy,[target])"));
 assert(expedition.includes("combatLinkEffect?.(r,'rot',enemy,[target])"));
 assert(fs.readFileSync('scripts/prepare-automatic-preview.mjs','utf8').includes("'online/v013-combat-links.js'"));
});
