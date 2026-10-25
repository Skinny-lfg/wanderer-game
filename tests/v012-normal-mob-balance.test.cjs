'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const newCombat=fs.readFileSync(path.join(root,'combat/v012-combat-runtime.js'),'utf8');
const {run}=require('../scripts/v012-affinity-combat-sim.cjs');
const before=(s,old,replacement,tag)=>{
 assert.equal(s.split(old).length-1,1,'Expected one '+tag+' source section');
 return s.replace(old,replacement);
};
function previousImplementation(){
 let old=html;
 const start=old.indexOf('const MOB_POOLS='),end=old.indexOf('};',start)+2;
 assert.ok(start>=0&&end>start);
 const table=old.slice(start,end),prior=table.replace(/,'(?:tank|skirmisher|caster)'(?=\])/g,'');
 assert.equal((table.match(/,'(?:tank|skirmisher|caster)'(?=\])/g)||[]).length,24);
 old=old.slice(0,start)+prior+old.slice(end);
 old=before(old,'THEMES.forEach(t=>t.mobs=(MOB_POOLS[t.id]||[]).map(([name,image,role])=>({name,image,role})));',
  'THEMES.forEach(t=>t.mobs=(MOB_POOLS[t.id]||[]).map(([name,image])=>({name,image})));','original mob mapping');
 let runtime=newCombat;
 runtime=before(runtime,"const role=boss?'boss':miniboss?'miniboss':(['tank','skirmisher','caster'].includes(mob.role)?mob.role:'skirmisher');",
  "const role=boss?'boss':miniboss?'miniboss':theme.mobs[0].name===mob.name?'bruiser':'skirmisher';",'original role logic');
 runtime=before(runtime,"const hp=Math.max(1,Math.round(v.hp*mult*(elite?elite.hp:role==='tank'?1.08:role==='skirmisher'?.92:role==='caster'?.95:1)));",
  "const hp=Math.max(1,Math.round(v.hp*mult*(elite?elite.hp:role==='bruiser'?1.08:role==='skirmisher'?.92:1)));",'original HP multipliers');
 runtime=before(runtime,"attackType:elite?.id==='caster'||variant?.style==='leech'||role==='caster'?'spell':'physical',",
  "attackType:elite?.id==='caster'||variant?.style==='leech'?'spell':'physical',",'original physical attack types');
 runtime=before(runtime,"attackEvery:elite?elite.interval:role==='skirmisher'?1.42:role==='tank'||role==='caster'?1.72:1.62,",
  "attackEvery:elite?elite.interval:role==='skirmisher'?1.42:role==='bruiser'?1.72:1.62,",'original cadence');
 return {sourceOverride:old,moduleOverrides:{'combat/v012-combat-runtime.js':runtime}};
}
const prior=previousImplementation();
const builds=[
 {weapon:'Staff',armorType:'Cloth',family:'magic'},
 {weapon:'Sword',armorType:'Plate',offhandType:'Shield',family:'aegis'},
 {weapon:'Bow',armorType:'Leather',family:'fury'},
 {weapon:'Daggers',armorType:'Leather',offhandType:'Off-Hand Dagger',family:'blood'}
];
test('native paired balance: E1 / E50 / E200; original roles vs 24 visual classes',()=>{
 const out=[],cases=[];
 for(const E of [1,50,200])for(const b of builds)for(let iteration=0;iteration<4;iteration++){
  const seed=20261025+E*101+builds.indexOf(b)*331+iteration*17;
  const config={...b,E,rarity:'Epic',strategy:'triple',runes:true,seed,controlSeed:seed};
  const a=run({...config,...prior});
  const n=run(config);
  assert.equal(a.error,null,'old runtime error '+E+'/'+b.weapon+'/'+seed);
  assert.equal(n.error,null,'new runtime error '+E+'/'+b.weapon+'/'+seed);
  assert.equal(a.timeout,false);
  assert.equal(n.timeout,false);
  cases.push({E,weapon:b.weapon,seed,old:a.reached,next:n.reached,oldWin:a.win,nextWin:n.win,oldDamage:a.damageReceived,newDamage:n.damageReceived});
 }
 const mean=rows=>rows.reduce((s,n)=>s+n,0)/rows.length;
 for(const E of [1,50,200]){
  const group=cases.filter(x=>x.E===E);
  out.push({E,n:group.length,priorMeanRealm:+mean(group.map(x=>x.old)).toFixed(2),
   nextMeanRealm:+mean(group.map(x=>x.next)).toFixed(2),
   oldWins:group.filter(x=>x.oldWin).length,newWins:group.filter(x=>x.nextWin).length,
   oldTotalReceived:group.reduce((s,x)=>s+x.oldDamage,0),
   newTotalReceived:group.reduce((s,x)=>s+x.newDamage,0)});
 }
 console.log('MOB_ROLE_NATIVE_BALANCE '+JSON.stringify({summary:out,paired:cases}));
 for(const row of out){
  assert.ok(Math.abs(row.nextMeanRealm-row.priorMeanRealm)<=1,'realm progression changed >1 at E'+row.E);
  assert.ok(Math.abs(row.newWins-row.oldWins)<=4,'sample wins changed >4/16 at E'+row.E);
  const ratio=row.oldTotalReceived?row.newTotalReceived/row.oldTotalReceived:1;
  assert.ok(ratio>=.75&&ratio<=1.25,'incoming damage outside ±25% at E'+row.E);
 }
 assert.equal(cases.length,48);
});

test('native deterministic D.7 audit snapshots across the same seven loadouts',()=>{
 const builds=[
  {weapon:'Staff',armorType:'Cloth',old:[7202600,9,71033,41]},
  {weapon:'Wand',armorType:'Cloth',offhandType:'Orb',old:[7202697,9,66654,37],endless:[7212731,7,96843,34]},
  {weapon:'Sword',armorType:'Plate',offhandType:'Shield',old:[7202794,14,115192,75],endless:[7212862,13,160073,67]},
  {weapon:'Mace',armorType:'Plate',offhandType:'Shield',old:[7202891,15,99668,53],endless:[7212993,15,171032,55]},
  {weapon:'Daggers',armorType:'Leather',offhandType:'Off-Hand Dagger',old:[7202988,15,102570,103],endless:[7213124,15,200525,137]},
  {weapon:'Bow',armorType:'Leather',old:[7203085,15,145897,144]},
  {weapon:'Two-Handed',armorType:'Leather',old:[7203182,15,112294,54]}
 ];
 const output=[];
 for(const b of builds)for(const [E,reference]of [[200,b.old],[300,b.endless]]){
  if(!reference)continue;
  const seed=reference[0];
  const args={E,weapon:b.weapon,armorType:b.armorType,offhandType:b.offhandType,rarity:'Epic',family:'blood',strategy:'triple',runes:true,seed,controlSeed:seed};
  const priorResult=run({...args,...prior}),nextResult=run(args);
  assert.equal(priorResult.error,null);
  assert.equal(nextResult.error,null);
  output.push({E,weapon:b.weapon,seed,baseline:[priorResult.reached,priorResult.damage,priorResult.weaponAttacks],
    classified:[nextResult.reached,nextResult.damage,nextResult.weaponAttacks]});
 }
 console.log('D7_NORMAL_MOB_COMPARISON '+JSON.stringify(output));
 assert.ok(output.length>=10);
});
