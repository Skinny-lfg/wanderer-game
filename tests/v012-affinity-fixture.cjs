const fs=require('node:fs'),vm=require('node:vm');const scope={};vm.runInNewContext(fs.readFileSync('combat/v012-buildcraft.js','utf8'),scope);const api=scope.WandererV012Buildcraft;
function build(ids=[],families=['blood','decay','magic'],element='lightning'){const b=api.create();b.families=families;b.unlockedFamilies=[...families];b.element=families.includes('magic')?element:null;b.picks=[...ids];b.realmIndex=10;return b;}
function context(b,overrides={}){
 const calls=[],player={hp:300,maxhp:1000,mp:10,maxmp:100,barrier:0},enemy={hp:20000,maxhp:100000,bleedStacks:1,dots:{bleed:[{damage:10,remaining:3}],burn:[],poison:[]},v012Rot:[{damage:5,remaining:4}],slowTime:2,boss:false};
 const c={player,enemy,base:1000,power:500,now:0,critical:true,funded:true,amp:1,random:()=>0,waveKey:'1:1',
 damage(n,label){enemy.hp-=n;calls.push(['damage',n,label]);},dotDamage(n,label){enemy.hp-=n;calls.push(['rot',n,label]);},
 dot(k,n){if(k==='bleed')n=api.bleedDamage(b,n);enemy.dots[k].push({damage:n,remaining:3});enemy[k+'Stacks']=enemy.dots[k].length;calls.push([k,n]);},
 heal(n){const gain=Math.min(player.maxhp-player.hp,n*(c.healingMultiplier??1));player.hp+=gain;calls.push(['heal',gain]);return gain;},
 mana(n){player.mp=Math.min(player.maxmp,player.mp+n);calls.push(['mana',n]);},barrier(n){player.barrier=Math.min(player.maxhp*.3,player.barrier+n);calls.push(['barrier',n]);},chill(n){enemy.slowTime=Math.max(enemy.slowTime,enemy.boss?Math.min(1.2,n):n);calls.push(['chill',n]);},log(){},...overrides};
 return {c,calls};
}
const base={maxhp:1000,defense:100,attacksPerSec:1,crit:10,attack:100,int:10,spellFlat:0,manaFlat:0,mana:100,manaRegen:10,spellPower:100,caster:true,blockChance:0,blockReduction:0};
module.exports={api,build,context,base};
