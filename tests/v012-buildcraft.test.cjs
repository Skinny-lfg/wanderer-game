const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),src=readFileSync(path.join(root,'combat/v012-buildcraft.js'),'utf8');
const sandbox={};vm.runInNewContext(src,sandbox,{filename:'combat/v012-buildcraft.js'});
const api=sandbox.WandererV012Buildcraft;
const base={maxhp:160,defense:20,attacksPerSec:1.25,crit:10,attack:25,int:5,spellFlat:0,manaFlat:0,mana:0,manaRegen:0,spellPower:0,caster:false};
function ctx(f=0){
 const player={hp:50,maxhp:200,mp:15,maxmp:80,barrier:0};
 const enemy={hp:400,maxhp:2000,bleedStacks:2,poisonStacks:1,burnStacks:0,
 v012Rot:[{damage:3,remaining:4}],v012Shock:0,dots:{bleed:[],burn:[],poison:[]},slowTime:0};
 const history=[];
 const c={player,enemy,now:0,base:100,power:55,amp:1.2,critical:true,magical:false,
 random:()=>f,
 dot(kind,potency){const damage=Math.max(1,Math.round(potency));enemy.dots[kind].push({damage,remaining:3});history.push(['dot',kind,damage]);},
 dotDamage(n){enemy.hp-=Math.round(n);history.push(['dotDamage',Math.round(n)]);},
 damage(n,label){enemy.hp-=Math.round(n);history.push(['damage',Math.round(n),label]);},
 heal(n){const old=player.hp;player.hp=Math.min(player.maxhp,player.hp+Math.max(0,n));history.push(['heal',player.hp-old]);return player.hp-old;},
 barrier(n){player.barrier=Math.min(player.maxhp*.3,player.barrier+Math.max(0,n));history.push(['barrier',n]);},
 mana(n){player.mp=Math.min(player.maxmp,player.mp+n);history.push(['mana',n]);},
 chill(n){enemy.slowTime=Math.max(enemy.slowTime,n);history.push(['chill',n]);},
 log(msg){history.push(['log',msg]);}};
 return {c,history};
}
function replay(id,family,element='lightning'){
 const b=api.create();b.families=[family];const pass=api.CATALOG.find(p=>p.id===id);
 for(const f of pass?.requires||[])if(!b.families.includes(f))b.families.push(f);
 if(b.families.includes('magic'))b.element=pass?.element||element;
 if(id)b.picks.push(id);
 const {c,history}=ctx(0);
 const mods=api.mods(b,base);
 const cost=api.nextCost(b);
 const healed=api.enemyHealMultiplier(b,c.enemy);
 const incoming=api.incoming(b,c,100);
 const speedBefore=api.speed(b,0);
 api.onDefend(b,c,20,12);
 api.onAttack(b,c);
 c.now+=1.5;api.onAttack(b,c);
 api.onCast(b,c);
 for(let i=0;i<4;i++){c.now+=1;api.onCast(b,c);}
 api.onSecond(b,c);
 api.onKill(b,c);
 const alive=api.survive(b,c);
 return {mods:JSON.stringify(mods),cost,healed,incoming,speedBefore,alive,history:JSON.stringify(history),
 hp:c.player.hp,mp:c.player.mp,barrier:c.player.barrier,enemyHp:c.enemy.hp,slow:c.enemy.slowTime,
 rot:JSON.stringify(c.enemy.v012Rot),bleed:JSON.stringify(c.enemy.dots.bleed),burn:JSON.stringify(c.enemy.dots.burn),
 runtime:JSON.stringify(b.runtime)};
}
test('every advertised passive is unique, finite, and changes at least one executed combat outcome',()=>{
 const ids=new Set();
 for(const p of api.CATALOG){
  assert(!ids.has(p.id),'duplicate '+p.id);ids.add(p.id);
  assert(api.FAMILIES.includes(p.family)&&p.max>=1&&p.max<=2,p.id);
  assert(p.description.length>15,'tooltip/behavior '+p.id);
  assert(p.requires.every(f=>api.FAMILIES.includes(f)),p.id+' valid hybrid');
  if(p.element)assert(api.ELEMENTS.includes(p.element),p.id+' valid element');
  const baseline=replay(null,p.family,p.element||'lightning');
  const withPassive=replay(p.id,p.family,p.element||'lightning');
  if(JSON.stringify(withPassive)===JSON.stringify(baseline)){
   // A player who does not have the required status should not be shown a placebo.
   throw Error('Displayed passive did not affect covered combat scenario: '+p.id);
  }
 }
 assert(api.CATALOG.length>=45,'meaningful buildcraft catalog');
});
test('six family acquisition, Magic Fire/Frost/Lightning and rank limits',()=>{
 const fam=new Set(api.FAMILIES);assert.deepEqual([...fam].sort(),['aegis','blood','decay','fury','magic','vitality'].sort());
 for(const ele of api.ELEMENTS){
  const b=api.create();b.families=['magic','fury'];
  api.element(b,ele);assert.throws(()=>api.element(b,'fire'),/already chosen/);
  const opts=api.options(b,'magic',()=>0.3);
  assert.equal(opts.length,3);assert(opts.every(o=>api.eligible(b,o.family).includes(o)));
  const chosen=opts[0];api.choose(b,'magic',chosen.id,opts);
  assert.equal(api.rank(b,chosen.id),1);assert.equal(b.element,ele);
  const {c}=ctx(0);
  c.enemy.v012Shock=0;c.enemy.v012Rot=[];c.enemy.bleedStacks=0;
  api.onCast(b,c);
  if(ele==='fire')assert(c.enemy.dots.burn.length>0,'Fire inflicts classic Burn');
  if(ele==='frost')assert(c.enemy.slowTime>0,'Frost inflicts classic Chill');
  if(ele==='lightning'){
   for(let n=0;n<3;n++){c.now+=.8;api.onCast(b,c);}
   assert.equal(c.enemy.v012Shock,0,'Lightning discharges at four stacks');
   assert(c.enemy.hp<400,'Shock deals bounded burst');
  }
 }
 const b=api.create();b.families=['blood','decay','magic'];b.element='lightning';
 for(let i=0;i<15;i++){const opts=api.options(b,'blood',()=>.31);assert.equal(opts.length,3);api.choose(b,'blood',opts[0].id,opts);}
 assert.equal(b.picks.length,15,'fallback pool prevents choice deadlock without unlimited ranks');
 for(const p of api.CATALOG)assert(api.rank(b,p.id)<=p.max,p.id+' capped');
 api.clear(b);assert.equal(b.picks.length,0);assert.equal(b.element,null);
});
test('hybrids require both families; simulated DOT, shock, healing, barrier, attack limits remain finite',()=>{
 const pairs=api.CATALOG.filter(p=>p.requires.length);
 for(const p of pairs){
  const b=api.create();b.families=[p.family];b.element=p.element||null;
  assert(!api.eligible(b,p.family).some(x=>x.id===p.id),'locked hybrid '+p.id);
  b.families=[...new Set(p.requires)];
  if(b.families.includes('magic'))b.element='fire';
  assert(api.eligible(b,p.family).some(x=>x.id===p.id),'unlocked hybrid '+p.id);
 }
 for(const family of api.FAMILIES){
  const b=api.create();b.families=[family];b.element=family==='magic'?'lightning':null;
  b.picks=api.CATALOG.filter(p=>p.family===family&&!p.requires.length&&(!p.element||p.element===b.element)).map(p=>p.id);
  const {c}=ctx(0);const stats=api.mods(b,base);
  assert(stats.maxhp<=base.maxhp*1.3&&stats.crit<=65&&stats.attacksPerSec<=5);
  for(let n=0;n<200;n++){
   c.now+=.25;
   api.onAttack(b,c);api.onCast(b,c);
   if(n%4===0)api.onSecond(b,c);
   c.enemy.hp=Math.max(1,c.enemy.hp);
   assert(c.enemy.dots.bleed.length<=200&&c.enemy.v012Rot.length<=6&&c.enemy.v012Shock<=4,'bounded v0.12 runtime');
   assert(c.player.hp<=c.player.maxhp&&c.player.barrier<=c.player.maxhp*.3,'survival caps');
  }
  assert(Number.isFinite(c.enemy.hp)&&Number.isFinite(c.player.hp));
 }
});
test('integration gates original weapons, Legendary and permanent save mechanics unchanged',()=>{
 const source=readFileSync(path.join(root,'index.html'),'utf8');
 assert(source.includes("if(isPhase1Run())phase2WeaponAttack(r,base,critical,cast);"));
 assert(source.includes('if(isPhase1Run())phase2MagicTick(r);'));
 assert(source.includes('WandererV012Buildcraft.onSecond(phase1Build,phase2Context(r))'));
 assert(source.includes('WandererV012Buildcraft.survive(phase1Build,phase2Context(r))'));
 assert(source.includes("if(PHASE1_PREVIEW||saveBlocked)return;"));
 assert(source.includes("caster=!!main&&['Staff','Wand'].includes(main.subtype)"));
 assert(source.includes('legendaryAttackBonus(r,base,critical,cast)'));
 assert(source.includes('legendaryDefensiveEffects(r,damageBlocked,hit,blocked'));
 assert(source.includes("state.run={phase1:true,phase1Magic:!!phase1Build.element"));
});

test('independent Aegis retaliation sources both resolve without recursive new hits',()=>{
 const b=api.create();b.families=['aegis','fury'];b.picks=['retaliation','counterstrike'];
 const {c,history}=ctx(.99);c.enemy.v012Rot=[];
 api.onDefend(b,c,19,11);
 assert.equal(b.runtime.counterBlock,1);
 assert.equal(b.runtime.counterBarrier,1);
 api.onAttack(b,c);
 const hits=history.filter(x=>x[0]==='damage').map(x=>x[2]);
 assert(hits.includes('🛡 Counterstrike')&&hits.includes('🛡 Retaliation'),'both effects proc');
 const prev=history.length;api.onAttack(b,c);
 assert.equal(history.slice(prev).filter(x=>x[0]==='damage').length,0,'no extra hits from already spent charges');
});
test('Staff/Wand amplify all Magic schools without consuming extra status rolls',()=>{
 for(const school of api.ELEMENTS){
  const b=api.create();b.families=['magic'];b.element=school;
  function cast(amp){const {c,history}=ctx(1);c.enemy.v012Shock=3;c.power=110;c.amp=amp;
   api.onCast(b,c);return {history,enemy:c.enemy};}
  b.runtime.magicHits=0;
  const basic=cast(1);
  b.runtime.magicHits=0;b.cooldowns=Object.create(null);
  const wand=cast(1.12);
  b.runtime.magicHits=0;b.cooldowns=Object.create(null);
  const staff=cast(1.25);
  if(school==='fire'){
   const potency=run=>run.enemy.dots.burn[0].damage;
   assert(staff&&potency(staff)>potency(wand)&&potency(wand)>potency(basic),'Fire scales with magical weapon');
  }else if(school==='lightning'){
   const hp=run=>run.enemy.hp;
   assert(hp(staff)<hp(wand)&&hp(wand)<hp(basic),'Lightning burst scales with magical weapon');
  }else{
   const chill=run=>run.enemy.slowTime;
   assert(chill(staff)>0&&chill(wand)===chill(basic),'Frost amplifies damage, not control duration, without specialized passive');
  }
 }
});
