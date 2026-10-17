// Offline v0.10 screening. Variants patch only the VM's source string; index.html stays unchanged.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {harness}=require('./simulate-v091.cjs');
const {createHash}=require('node:crypto');
const source=fs.readFileSync('index.html','utf8');
const sha=createHash('sha256').update(source).digest('hex');
const builds={dark:['Wand','drain'],regen:['Mace','regen'],shield:['Mace','shield'],poison:['Sword','poison'],heavy:['Two-Handed','bleed'],bow:['Bow','crit'],daggers:['Daggers','crit'],staff:['Staff','shock'],fire:['Staff','burn'],frost:['Staff','slow'],wand:['Wand','burn']};
const slots=['weapon','offhand','armor','helm','amulet','gloves','ring1','ring2','boots'];
const themes=['temple','ash','frost','drowned'];
const elites=['tank','berserker','vampire','caster'];
const edit=(from,to)=>(s)=>{const n=s.split(from).length-1;assert.equal(n,1,'Variant anchor changed: '+from.slice(0,60));return s.replace(from,to)};
const variants={
 baseline:[],
 fire21:[edit('poison:.15,bleed:.18,burn:.17','poison:.15,bleed:.18,burn:.21')],
 fire25:[edit('poison:.15,bleed:.18,burn:.17','poison:.15,bleed:.18,burn:.25')],
 fireHit15:[edit('const base=damage;r.lastBaseHit=base;','if(weapon?.effect===\'burn\'&&e.burnStacks>0)damage=Math.round(damage*1.15);const base=damage;r.lastBaseHit=base;')],
 fireCast160:[edit('damage=Math.max(1,Math.round(s.spellPower*factor));','damage=Math.max(1,Math.round(s.spellPower*factor*(element===\'burn\'?1.6:1)));')],
 fireCast135:[edit('damage=Math.max(1,Math.round(s.spellPower*factor));','damage=Math.max(1,Math.round(s.spellPower*factor*(element===\'burn\'?1.35:1)));')],
 frost35:[edit("['slow','Frost Set','slowBonus',.25","['slow','Frost Set','slowBonus',.35")],
 frost45:[edit("['slow','Frost Set','slowBonus',.25","['slow','Frost Set','slowBonus',.45")],
 frostWeaken12:[edit('b.frostWeaken&&e.slowTime>0?.08:0','b.frostWeaken&&e.slowTime>0?.12:0')],
 frost80:[edit("['slow','Frost Set','slowBonus',.25","['slow','Frost Set','slowBonus',.80")],
 frost60:[edit("['slow','Frost Set','slowBonus',.25","['slow','Frost Set','slowBonus',.60")],
 frost40:[edit("['slow','Frost Set','slowBonus',.25","['slow','Frost Set','slowBonus',.40")],
 frost50:[edit("['slow','Frost Set','slowBonus',.25","['slow','Frost Set','slowBonus',.50")],
 bowBarrier3:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Bow\'&&critical&&setReady(r,\'bowGuard\',6))setBarrier(r,r.maxhp*.03);')],
 bowBarrier5:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Bow\'&&critical&&setReady(r,\'bowGuard\',6))setBarrier(r,r.maxhp*.05);')],
 bowBarrier7:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Bow\'&&critical&&setReady(r,\'bowGuard\',6))setBarrier(r,r.maxhp*.07);')],
 bowBarrier20:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Bow\'&&critical&&setReady(r,\'bowGuard\',6))setBarrier(r,r.maxhp*.20);')],
 bowBarrier12:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Bow\'&&critical&&setReady(r,\'bowGuard\',6))setBarrier(r,r.maxhp*.12);')],
 bowBarrier8:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Bow\'&&critical&&setReady(r,\'bowGuard\',6))setBarrier(r,r.maxhp*.08);')],
 bowBarrier10:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Bow\'&&critical&&setReady(r,\'bowGuard\',6))setBarrier(r,r.maxhp*.10);')],
 daggerBarrier3:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Daggers\'&&critical&&setReady(r,\'daggerGuard\',4))setBarrier(r,r.maxhp*.03);')],
 daggerBarrier5:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Daggers\'&&critical&&setReady(r,\'daggerGuard\',4))setBarrier(r,r.maxhp*.05);')],
 daggerBarrier7:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Daggers\'&&critical&&setReady(r,\'daggerGuard\',4))setBarrier(r,r.maxhp*.07);')],
 daggerBarrier20:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Daggers\'&&critical&&setReady(r,\'daggerGuard\',4))setBarrier(r,r.maxhp*.20);')],
 daggerBarrier12:[edit('const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);','const added=setOnAttack(r,base,critical,perfect)+legendaryAttackBonus(r,base,critical,cast);if(kind===\'Daggers\'&&critical&&setReady(r,\'daggerGuard\',4))setBarrier(r,r.maxhp*.12);')],
 heavyGuard5:[edit('setBarrier(r,r.maxhp*.025);','setBarrier(r,r.maxhp*.05);')],
 heavyGuard8:[edit('setBarrier(r,r.maxhp*.025);','setBarrier(r,r.maxhp*.08);')],
 heavyFactor19:[edit("kind==='Two-Handed'?1.70:kind==='Mace'?1.4","kind==='Two-Handed'?1.90:kind==='Mace'?1.4")],
 heavyFactor22:[edit("kind==='Two-Handed'?1.70:kind==='Mace'?1.4","kind==='Two-Handed'?2.20:kind==='Mace'?1.4")],
 heavyFactor20:[edit("kind==='Two-Handed'?1.70:kind==='Mace'?1.4","kind==='Two-Handed'?2.00:kind==='Mace'?1.4")],
 heavyFactor185:[edit("kind==='Two-Handed'?1.70:kind==='Mace'?1.4","kind==='Two-Handed'?1.85:kind==='Mace'?1.4")],
 staffGuard5:[edit('setBarrier(r,r.maxhp*.035);','setBarrier(r,r.maxhp*.05);')],
 staffGuard8:[edit('setBarrier(r,r.maxhp*.035);','setBarrier(r,r.maxhp*.08);')],
 staffCost11:[edit("const kind=weapon?.subtype||'Unarmed',cost=kind==='Staff'?13:kind==='Wand'?9:0;","const kind=weapon?.subtype||'Unarmed',cost=kind==='Staff'?11:kind==='Wand'?9:0;")],
 staffGuard15:[edit('setBarrier(r,r.maxhp*.035);','setBarrier(r,r.maxhp*.15);')],
 staffGuard12:[edit('setBarrier(r,r.maxhp*.035);','setBarrier(r,r.maxhp*.12);')],
 wandFactor90:[edit("const factor=kind==='Staff'?1.32:.77;","const factor=kind==='Staff'?1.32:.90;")],
 wandFactor115:[edit("const factor=kind==='Staff'?1.32:.77;","const factor=kind==='Staff'?1.32:1.15;")],
 wandFactor100:[edit("const factor=kind==='Staff'?1.32:.77;","const factor=kind==='Staff'?1.32:1.00;")],
 passiveUniform45:[edit("2+(bonus.shieldBonus||0)+(baseDamage||0)*.07","(2+(bonus.shieldBonus||0)+(baseDamage||0)*.07)*mult"),edit("(baseDamage||s.attack||5)*.1)","(baseDamage||s.attack||5)*.1*mult)")],
 passiveSelective:[edit("2+(bonus.shieldBonus||0)+(baseDamage||0)*.07","(2+(bonus.shieldBonus||0)+(baseDamage||0)*.07)*(mult<1?.75:1)"),edit("(baseDamage||s.attack||5)*.1)","(baseDamage||s.attack||5)*.1*(mult<1?.70:1))")],
 speedDiminish30:[edit('(rawSpeed-2.5)*.2','(rawSpeed-2.5)*.3')],
 speedDiminish40:[edit('(rawSpeed-2.5)*.2','(rawSpeed-2.5)*.4')],
 speedTier100:[edit('const rawSpeed=baseSpeed+catchUp;s.rawAttackSpeed=rawSpeed;','const rawSpeed=Math.max(.25,baseSpeed+catchUp-Math.max(0,(main?.tier||1)-100)*.004);s.rawAttackSpeed=rawSpeed;')],
 enemyHpLate15:[edit('const hp=Math.max(1,Math.round(v.hp*mult*(elite?elite.hp:role===\'bruiser\'?1.08:role===\'skirmisher\'?.92:1)));','const hp=Math.max(1,Math.round(v.hp*mult*(elite?elite.hp:role===\'bruiser\'?1.08:role===\'skirmisher\'?.92:1)*(1+Math.min(.15,Math.max(0,level-100)*.0015))));')]
};
variants.combined=[...variants.fireCast135,...variants.frost60,...variants.bowBarrier12,...variants.heavyFactor20,...variants.staffGuard12,...variants.wandFactor100];
function gear(api,level,build,profile,rotation){
 const [weapon,primary]=builds[build],heavy=['Bow','Staff','Two-Handed'].includes(weapon),result=[];let points=0;
 const kinds={weapon,offhand:weapon==='Wand'?'Orb':weapon==='Daggers'?'Off-Hand Dagger':'Shield',armor:'Armor',helm:'Helm',amulet:'Amulet',gloves:'Gloves',ring1:'Ring',ring2:'Ring',boots:'Boots'};
 const tiers=profile==='epic'?[1]:[.8,.9,1],rarities=profile==='epic'?['Epic']:['Uncommon','Rare','Rare','Rare','Epic'];
 for(const slot of slots){if(slot==='offhand'&&heavy)continue;const subtype=kinds[slot],pool=api.elementPool(slot,subtype),weight=slot==='weapon'&&heavy?2:1;
  const effect=pool.includes(primary)&&points+weight<=5?primary:pool.find(x=>x!==primary&&x!=='drain'&&x!=='regen')||pool[0];
  if(effect===primary)points+=weight;
  const i=result.length+rotation;result.push({slot,subtype,effect,tier:Math.max(1,Math.round(level*tiers[i%tiers.length])),rarity:rarities[i%rarities.length]});
 }
 assert(points>=3,'Primary set not attained: '+build+' '+points);return result;
}
const hash=x=>{x=Math.imul(x^(x>>>16),0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return (x^(x>>>16))>>>0;};
let trials=0;
function simulate(name,build,level,profile,n,offset=0){
 const transform=variants[name].length?s=>variants[name].reduce((v,f)=>f(v),s):undefined;
 const c=harness('index.html',{transform,legendary:true}),sum={wins:0,hp:0,seconds:0,damageIn:0,damageOut:0,healing:0,barrierGained:0,blockedDamage:0,aps:0},eliteWins={tank:0,berserker:0,vampire:0,caster:0},deathWaves={};
 for(let i=0;i<n;i++){const id=i+offset,elite=elites[id%4],theme=themes[Math.floor(id/4)%4],seed=hash(100100+level*1000+id),r=c.trial({level,weapon:builds[build][0],seed,elite,theme,gearPlan:gear(c.inspect,level,build,profile,id%5),diagnostics:true});
  assert(!r.timeout);trials++;sum.wins+=Number(r.win);sum.hp+=r.hp;sum.seconds+=r.seconds;sum.damageIn+=r.damageIn;sum.damageOut+=r.damageOut;sum.healing+=r.healing;sum.barrierGained+=r.barrierGained;sum.blockedDamage+=r.blockedDamage;sum.aps+=r.stats.aps;eliteWins[elite]+=Number(r.win);if(r.deathWave)deathWaves[r.deathWave]=(deathWaves[r.deathWave]||0)+1;
 }
 const p=sum.wins/n,z=1.96,den=1+z*z/n,center=(p+z*z/(2*n))/den,half=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den;
 return {name,build,level,profile,n,winCI95:[+(center-half).toFixed(3),+(center+half).toFixed(3)],...Object.fromEntries(Object.entries(sum).map(([k,v])=>[k,+(v/n).toFixed(3)])),deathWaves,eliteWins};
}
function run(){
 const rows=[],baseBuilds=Object.keys(builds),screen={fire:['fire21','fire25','fireHit15'],frost:['frost35','frost45','frostWeaken12'],bow:['bowBarrier3','bowBarrier5','bowBarrier7'],daggers:['daggerBarrier3','daggerBarrier5','daggerBarrier7'],heavy:['heavyGuard5','heavyGuard8','heavyFactor19'],staff:['staffGuard5','staffGuard8','staffCost11'],wand:['wandFactor90']};
 for(const build of baseBuilds)for(const profile of ['mid','epic'])rows.push(simulate('baseline',build,100,profile,48));
 for(const [build,names]of Object.entries(screen))for(const name of names)for(const profile of ['mid','epic'])rows.push(simulate(name,build,100,profile,48));
 for(const name of ['baseline','passiveUniform45','passiveSelective'])for(const build of ['dark','regen','shield'])for(const profile of ['mid','epic'])rows.push(simulate(name,build,100,profile,48,2000));
 for(const name of ['baseline','speedDiminish30','speedDiminish40','speedTier100','enemyHpLate15'])for(const level of [20,40,60,100,160,200])for(const build of ['bow','heavy','regen','fire'])for(const profile of ['mid','epic'])rows.push(simulate(name,build,level,profile,24,4000));
 for(const [name,build]of [['fireCast160','fire'],['frost80','frost'],['bowBarrier20','bow'],['daggerBarrier20','daggers'],['heavyFactor22','heavy'],['staffGuard15','staff'],['wandFactor115','wand']])for(const profile of ['mid','epic'])rows.push(simulate(name,build,100,profile,48,6000));
 for(const [name,build]of [['fireCast135','fire'],['frost60','frost'],['bowBarrier12','bow'],['daggerBarrier12','daggers'],['heavyFactor20','heavy'],['staffGuard12','staff'],['wandFactor100','wand']])for(const profile of ['mid','epic'])rows.push(simulate(name,build,100,profile,48,6000));
 for(const name of ['baseline','combined'])for(const level of [100,200])for(const build of ['fire','frost','bow','heavy','staff','wand'])for(const profile of ['mid','epic'])rows.push(simulate(name,build,level,profile,24,7000));
 assert(trials>=8000&&trials<=12000,'Combat budget: '+trials);
 return {sourceCommit:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceSha256:sha,notes:['Production inline combat in Node VM; external Legendary definitions loaded.','Fixtures legal but deterministic mixed rarity/tier sequences approximate, rather than reproduce, v0.9.3 profile B.','Death and extraction are intercepted; progression and human time are not simulated.','Paired initial seeds/gear; differing RNG consumption after a proc means trajectories are not exact common-random-number counterfactuals.'],trials,rows};
}
if(require.main===module){const result=run();fs.writeFileSync('docs/v010-combat-balance-results.json',JSON.stringify(result,null,2)+'\n');console.log('A/B trials:',result.trials,'groups:',result.rows.length);}
module.exports={run,gear,variants,simulate};
