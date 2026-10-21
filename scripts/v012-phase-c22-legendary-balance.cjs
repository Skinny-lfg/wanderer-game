// Paired, RAM-only C.2.2 Legendary audit. Never changes production modules.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {run}=require('./v012-affinity-combat-sim.cjs');
const runtimePath='combat/v012-combat-runtime.js';
const replace=(source,from,to)=>{
 const count=source.split(from).length-1;
 if(count!==1)throw Error(`C.2.2 runtime invariant: expected one ${from}, found ${count}`);
 return source.replace(from,to);
};
const originalVeilBarrier="t.veilBarrier=ports.setBarrier(r,r.maxhp*(ports.legendaryEmpowered(r,'veil-thousand-seals')?.06:.04))";
const calibratedSwordVeilBarrier="t.veilBarrier=ports.setBarrier(r,r.maxhp*((r.stats?.main?.subtype==='Sword'&&r.stats?.off?.subtype==='Shield')?(ports.legendaryEmpowered(r,'veil-thousand-seals')?.04:.025):(ports.legendaryEmpowered(r,'veil-thousand-seals')?.06:.04)))";
const production=fs.readFileSync(path.resolve(__dirname,'../'+runtimePath),'utf8');
// Preserve the measured baseline after the selected correction lands in production.
const native=production.includes(originalVeilBarrier)?production:replace(production,calibratedSwordVeilBarrier,originalVeilBarrier);
const mods={
 veil_barrier_moderate:[["ports.legendaryEmpowered(r,'veil-thousand-seals')?.06:.04","ports.legendaryEmpowered(r,'veil-thousand-seals')?.05:.03"]],
 veil_barrier_strong:[["ports.legendaryEmpowered(r,'veil-thousand-seals')?.06:.04","ports.legendaryEmpowered(r,'veil-thousand-seals')?.04:.025"]],
 veil_damage_moderate:[["ports.legendaryEmpowered(r,'veil-thousand-seals')?.45:.30","ports.legendaryEmpowered(r,'veil-thousand-seals')?.38:.25"]],
 veil_damage_strong:[["ports.legendaryEmpowered(r,'veil-thousand-seals')?.45:.30","ports.legendaryEmpowered(r,'veil-thousand-seals')?.30:.20"]],
 sword_veil_barrier_moderate:[["t.veilBarrier=ports.setBarrier(r,r.maxhp*(ports.legendaryEmpowered(r,'veil-thousand-seals')?.06:.04))","t.veilBarrier=ports.setBarrier(r,r.maxhp*((r.stats?.main?.subtype==='Sword'&&r.stats?.off?.subtype==='Shield')?(ports.legendaryEmpowered(r,'veil-thousand-seals')?.05:.03):(ports.legendaryEmpowered(r,'veil-thousand-seals')?.06:.04)))"]],
 sword_veil_barrier_strong:[[originalVeilBarrier,calibratedSwordVeilBarrier]],
 oathwall_65_95:[["ports.legendaryEmpowered(r,'oathwall')?1.10:.75","ports.legendaryEmpowered(r,'oathwall')?.95:.65"]],
 oathwall_60_90:[["ports.legendaryEmpowered(r,'oathwall')?1.10:.75","ports.legendaryEmpowered(r,'oathwall')?.90:.60"]],
 verdant_heal:[["ports.legendaryEmpowered(r,'verdant-oath')?.012:.008","ports.legendaryEmpowered(r,'verdant-oath')?.009:.006"]],
 verdant_damage:[["ports.legendaryEmpowered(r,'verdant-oath')?.90:.60","ports.legendaryEmpowered(r,'verdant-oath')?.75:.50"]]
};
const sources={base:native};
for(const [key,edits]of Object.entries(mods))sources[key]=edits.reduce((s,[a,b])=>replace(s,a,b),native);
const profiles=[
 {name:'sword-none',build:'Plate Sword + Shield',weapon:'Sword',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],items:null},
 {name:'sword-veil',build:'Plate Sword + Shield',weapon:'Sword',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],items:{belt:'veil-thousand-seals'}},
 {name:'sword-oathwall',build:'Plate Sword + Shield',weapon:'Sword',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],items:{offhand:'oathwall'}},
 {name:'sword-verdant',build:'Plate Sword + Shield',weapon:'Sword',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],items:{weapon:'verdant-oath'}},
 {name:'sword-oathwall-veil',build:'Plate Sword + Shield',weapon:'Sword',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],items:{offhand:'oathwall',belt:'veil-thousand-seals'}},
 {name:'sword-verdant-veil',build:'Plate Sword + Shield',weapon:'Sword',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],items:{weapon:'verdant-oath',belt:'veil-thousand-seals'}},
 {name:'sword-verdant-oathwall',build:'Plate Sword + Shield',weapon:'Sword',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],items:{weapon:'verdant-oath',offhand:'oathwall'}},
 {name:'wand-voidglass-veil',build:'Cloth Wand + Orb',weapon:'Wand',offhandType:'Orb',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],items:{weapon:'voidglass',belt:'veil-thousand-seals'}},
 {name:'staff-veil-heartroot',build:'Cloth Staff',weapon:'Staff',armorType:'Cloth',family:'magic',targetFamilies:['magic','aegis','decay'],items:{belt:'veil-thousand-seals',armor:'heartroot-carapace'}},
 {name:'mace-oathwall-heartroot',build:'Plate Mace + Shield',weapon:'Mace',offhandType:'Shield',armorType:'Plate',family:'vitality',targetFamilies:['vitality','aegis','fury'],items:{offhand:'oathwall',armor:'heartroot-carapace'}},
 {name:'bow-veil-heartroot',build:'Leather Bow',weapon:'Bow',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],items:{belt:'veil-thousand-seals',armor:'heartroot-carapace'}},
 {name:'twohand-gravewake-eye',build:'Leather Two-Handed',weapon:'Two-Handed',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],items:{weapon:'gravewake',ring1:'eye-of-morrow'}},
 {name:'twohand-veil-heartroot',build:'Leather Two-Handed',weapon:'Two-Handed',armorType:'Leather',family:'decay',targetFamilies:['decay','fury','blood'],items:{belt:'veil-thousand-seals',armor:'heartroot-carapace'}}
];
function armsFor(p){
 const ids=Object.values(p.items||{}),out=['base'];
 if(ids.includes('veil-thousand-seals'))out.push(...Object.keys(mods).filter(k=>k.startsWith('veil_')));
 if((p.build==='Plate Sword + Shield'&&ids.includes('veil-thousand-seals'))||['sword-none','wand-voidglass-veil','staff-veil-heartroot','mace-oathwall-heartroot','bow-veil-heartroot','twohand-gravewake-eye','twohand-veil-heartroot'].includes(p.name))out.push('sword_veil_barrier_moderate','sword_veil_barrier_strong');
 if(ids.includes('oathwall'))out.push(...Object.keys(mods).filter(k=>k.startsWith('oathwall_')));
 if(ids.includes('verdant-oath'))out.push(...Object.keys(mods).filter(k=>k.startsWith('verdant_')));
 return out;
}
const mode=process.argv[2]||'triage',output=process.argv[3]||`/tmp/wanderer-c22-${mode}.json`;
if(!['triage','confirm'].includes(mode))throw Error('mode must be triage or confirm');
const seeds=mode==='triage'?16:64,levels=[50,100,200],policies=['triple','random'];
const selected=new Set((process.env.C22_ARMS||'').split(',').filter(Boolean));
if(mode==='confirm'&&!selected.size)throw Error('C22_ARMS required in confirm mode');
for(const key of selected)if(!sources[key])throw Error('Unknown arm '+key);
const prior=process.argv[4]&&JSON.parse(fs.readFileSync(process.argv[4],'utf8'));
const earlier=process.argv[5]&&JSON.parse(fs.readFileSync(process.argv[5],'utf8'));
if(prior&&(!prior.complete||prior.phase!=='C2.1'||prior.seeds!==64))throw Error('Invalid C.2.1 reuse file');
if(earlier&&(!earlier.complete||earlier.phase!=='C2.2'||earlier.mode!=='triage'))throw Error('Invalid triage reuse file');
const c21=new Map((prior?.rows||[]).map(r=>[[r.E,r.build,r.policy,r.seed,r.profile,r.arm].join('|'),r]));
const triage=new Map((earlier?.rows||[]).map(r=>[[r.E,r.profile,r.policy,r.seed,r.arm].join('|'),r]));
const previous=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):null;
const sourceSha=crypto.createHash('sha256').update(native).digest('hex');
if(previous&&(previous.phase!=='C2.2'||previous.mode!==mode||previous.sourceSha!==sourceSha||previous.seeds!==seeds||JSON.stringify(previous.selected)!==JSON.stringify([...selected])))throw Error('Existing result is not the same C.2.2 experiment');
const rows=previous?.rows||[];let computed=previous?.computed||0,reused=previous?.reused||0;
const done=new Set(rows.map(r=>[r.E,r.profile,r.policy,r.seed,r.arm].join('|')));
const maxNew=Number(process.env.C22_MAX_NEW||1200);
if(!Number.isInteger(maxNew)||maxNew<1)throw Error('Invalid C22_MAX_NEW');
function normalize(r,p,arm,source){return {E:r.E,profile:p.name,build:p.build,policy:r.policy,seed:r.seed,arm,
 win:!!r.win,reached:r.reached,dps:r.dps,heal:r.heal??r.healPerSecond,barrier:r.barrier??r.barrierPerSecond,
 ehp:r.ehp??r.observedEhpBudget,received:r.received??r.damageReceived,
 procs:r.procs??r.legendaryProcCounts,blocks:r.blocks??null,incoming:r.incomingAttacks??null,
 telemetry:r.telemetry??null,unlockedFamilies:r.unlockedFamilies??null,error:r.error||null,timeout:!!r.timeout,source};}
const work=[];
for(const E of levels)for(const p of profiles)for(const policy of policies)for(let seed=0;seed<seeds;seed++)for(const arm of armsFor(p)){
 if(mode==='triage'&&arm.startsWith('sword_veil_'))continue;
 if(mode==='confirm'&&arm==='veil_barrier_moderate'&&p.build==='Plate Sword + Shield'&&selected.has('sword_veil_barrier_moderate'))continue;
 if(mode==='confirm'&&arm.startsWith('sword_veil_')&&(!p.items||!Object.values(p.items).includes('veil-thousand-seals')||p.build!=='Plate Sword + Shield')&&seed>=16)continue;
 if(selected.size&&!selected.has(arm))continue;
 work.push({E,p,policy,seed,arm});
}
function save(complete){fs.writeFileSync(output,JSON.stringify({phase:'C2.2',mode,complete,sourceSha,seeds,levels,policies,selected:[...selected],computed,reused,rows})+'\n');}
let newComputed=0;
for(const [i,{E,p,policy,seed,arm}]of work.entries()){
 if(done.has([E,p.name,policy,seed,arm].join('|')))continue;
 let r;
 const equivalent=arm.startsWith('sword_veil_barrier_')&&p.build==='Plate Sword + Shield'&&Object.values(p.items||{}).includes('veil-thousand-seals')?arm.slice('sword_'.length):arm;
 const old=triage.get([E,p.name,policy,seed,equivalent].join('|'));
 if(old){r={...old,arm,source:equivalent===arm?'c22-triage':'c22-triage-equivalent'};reused++;}
 else if(arm==='base'&&p.build!=='Plate Sword + Shield'&&prior){
  const ids=Object.values(p.items||{}),historicalArm=ids.includes('heartroot-carapace')?'heartroot':'base';
  const historicalProfile=ids.join('+')||'none';
  const found=c21.get([E,p.build,policy,seed,historicalProfile,historicalArm].join('|'));
  if(found){r=normalize(found,p,arm,'c21-artifact');reused++;}
 }
 if(!r){
  try{const observed=run({E,weapon:p.weapon,rarity:'Epic',armorType:p.armorType,offhandType:p.offhandType,
   family:p.family,targetFamilies:p.targetFamilies,strategy:policy,routeMode:'planned',runes:true,
   seed:20261021+seed,controlSeed:822000+seed*17+E,legendaryItems:p.items,
   moduleOverrides:{[runtimePath]:sources[arm]}});
   r=normalize({...observed,E,policy,seed},p,arm,'computed');
  }catch(e){r={E,profile:p.name,build:p.build,policy,seed,arm,error:String(e?.stack||e),timeout:false,source:'computed'};}
  computed++;newComputed++;
 }
 rows.push(r);
 if((i+1)%200===0){process.stderr.write(`C22 ${i+1}/${work.length} computed=${computed} reused=${reused}\n`);save(false);}
 if(newComputed>=maxNew){save(false);console.log(JSON.stringify({phase:'C2.2',mode,complete:false,total:rows.length,expected:work.length,computed,reused,output}));process.exit(0);}
}
save(true);
const errors=rows.filter(r=>r.error||r.timeout);
console.log(JSON.stringify({phase:'C2.2',mode,total:rows.length,expected:work.length,computed,reused,errors:errors.length,output}));
if(errors.length){console.error(JSON.stringify(errors.slice(0,3)));process.exitCode=1;}
