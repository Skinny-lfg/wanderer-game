'use strict';
// VM-only factorial diagnosis. No production edits, no deployment.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs');
const IDS=["blood-daggers","blood-sword","blood-twohand","fury-daggers","fury-bow","fury-twohand","decay-cycle-twohand","decay-cycle-wand","decay-focus-wand","vitality-sword","vitality-wand","aegis-sword","aegis-mace","aegis-orb","magic-fire-wand","magic-lightning-wand","magic-frost-staff","magic-arcane-wand"],CONTROL=["blood-daggers","fury-bow","decay-cycle-wand","vitality-sword","aegis-mace","magic-lightning-wand"];
const N=60,SIZES=[6,8,12,16],SMALL_N=12,SMALL_SIZES=[1,4,22],F=['blood','decay','vitality','aegis','fury','magic'];
const MODES={native:{},composition:{count:true},attributes:{stats:true},combined:{count:true,stats:true},spread:{count:true,stats:true,spread:true},lightMinions:{count:true,stats:true,spread:true,light:true}};
const OUT=process.env.GROUP_PRESSURE_OUT||'reports/e10-group-pressure';
const R=fs.readFileSync('online/v013-enemy-roster.js','utf8'),C=fs.readFileSync('combat/v012-combat-core.js','utf8'),E=fs.readFileSync('online/v012-expedition-runtime.js','utf8');
function rep(s,a,b){assert.equal(s.split(a).length,2,'source anchor '+a);return s.replace(a,b);}
function roster(mode){
 let r=R;
 if(mode.count){
  const a="count===6?2+(countRoll<.4?1:0):count<=12?2+(countRoll<.5?1:0):";
  r=rep(r,a,"count<=12?2:");
  r=rep(r,"count<=17?3+(countRoll<.35?1:0):3+(countRoll<.5?1:0);","count<=17?2+(countRoll<.35?1:0):2+(countRoll<.5?1:0);");
 }
 if(mode.spread){
  const a=" }\n return list;\n}\n// Choose only artwork";
  r=rep(r,a," }\n if(list.length>4){\n  const head=locked?list[0]:null,pool=list.slice(locked),chiefs=pool.filter(e=>e.role!=='minion'),minions=pool.filter(e=>e.role==='minion'),result=Array(list.length);\n  if(head)result[0]=head;\n  const total=chiefs.length+Number(head&&head.role!=='minion');\n  let offset=head&&head.role!=='minion'?1:0;\n  for(let i=0;i<chiefs.length;i++){let index=Math.max(locked,Math.floor((i+offset)*list.length/total));while(result[index]!==undefined)index++;result[index]=chiefs[i];}\n  for(let i=0;i<result.length;i++)if(result[i]===undefined)result[i]=minions.shift();\n  return result;\n }\n return list;\n}\n// Choose only artwork");
 }
 return r;
}
function core(mode){
 let s=C;
 if(mode.stats)s=rep(s,"}else{hp=escort.hp;atk=escort.atk/pressure;def=escort.def;}","}else{hp=escort.hp;atk=escort.atk/pressure;def=escort.def;if(n>=6){const mature=1-opening;hp=opening*hp+mature*.90;atk=opening*atk+mature*.85;def=opening*def+mature*.93;}}");
 if(mode.light)s=rep(s,"e.maxhp=Math.max(1,Math.round(e.maxhp*hp));","if(n>=6&&e.role==='minion')hp*=1-.15*(1-opening);\n  e.maxhp=Math.max(1,Math.round(e.maxhp*hp));");
 return s;
}
// Keep all condition effects other than a marked Carrion Swarm count override.
// This is a deliberate controlled size fixture, not a natural campaign.
const exp=rep(E,"(!statOnly&&conditions&&conditionCard?conditions.countFor(g.selected,conditionCard,g.dungeon,conditionMitigation):(g.selected.mobCount||3))","(g.selected.mobCount||3)");
const overlays=Object.fromEntries(Object.entries(MODES).map(([id,v])=>[id,{stage617RosterSource:roster(v),stageArmorCoreSource:core(v),stage648b1ExpeditionSource:exp}]));
const principal=e=>e.role!=='minion';
const avg=(a,k)=>{const v=a.map(x=>x[k]).filter(Number.isFinite);return v.length?v.reduce((s,n)=>s+n,0)/v.length:null;};
const sum=(a,k)=>a.reduce((s,x)=>s+(Number(x[k])||0),0);
function pure(){
 const mockF={rng(seed,domain){let s=seed>>>0;for(const ch of domain)s=Math.imul(s^ch.charCodeAt(0),16777619)>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}};
 const modules={};for(const [id,m] of Object.entries(MODES)){
  const env={WandererV013ExpeditionFoundation:mockF};new Function('globalThis',roster(m))(env);new Function('globalThis',core(m))(env);new Function(exp);modules[id]=env;
 }
 const factory=(n,k)=>Array.from({length:n},(_,i)=>({id:i,role:i<k?'tank':'minion',maxhp:1000,hp:1000,atk:1000,def:1000,baseDef:1000,attackEvery:2}));
 let checks=0;
 for(const [id,m] of Object.entries(MODES)){
  const api=modules[id].WandererV013EnemyRoster,base=modules.native.WandererV013EnemyRoster,cc=modules[id].WandererV012CombatCore,bc=modules.native.WandererV012CombatCore;
  for(const realm of Object.keys(api.CATALOG))for(let n=1;n<=22;n++)for(let seed=1;seed<=8;seed++){
   const catalog=api.ROLES.map(role=>({role,name:role,image:role})),args={seed,realm,family:F[seed%6],node:1,count:n,catalog};
   const list=api.plan(args),original=base.plan(args),k=list.filter(principal).length;
   assert.equal(list.length,n);assert.deepEqual(list,api.plan(args));
   if(!m.count||n<=5)assert.deepEqual(list,original);
   if(m.count&&n>=6)assert(n<=12?k===2:k>=2&&k<=3);
   const actors=list.map((e,i)=>({...e,id:i,hp:100}));
   for(const keepFirst of [false,true]){const ordered=api.orderForArena(actors,{...args,keepFirst});
    assert.equal(new Set(ordered).size,n);assert(ordered.every(e=>actors.includes(e)));if(keepFirst)assert.equal(ordered[0],actors[0]);
    if(m.spread&&n>4&&k>=2)assert(ordered.slice(0,4).some(principal),'missing opening principal');
   }
   checks++;
  }
  for(const level of [1,2,5,10,20,100,200])for(const n of [1,2,3,4,5,6,8,12,16,22]){
   const k=Math.min(2,n),a=factory(n,k),b=factory(n,k);cc.applyNormalRoomBudget(a,level);bc.applyNormalRoomBudget(b,level);
   if(level===1||n<=5||!m.stats)assert.deepEqual(a,b,'unchanged budget drift');
   assert(a.every(e=>e.hp>0&&e.atk>0&&e.def>=0&&e.hp===e.maxhp));
   const leader={...factory(1,1)[0],boss:true},before=JSON.stringify(leader);cc.applyNormalRoomBudget([leader],level);assert.equal(JSON.stringify(leader),before);
  }
 }
 console.log('GROUP_PRESSURE_PURE='+JSON.stringify({checks,modes:Object.keys(MODES),levels:[1,2,5,10,20,100,200]}));
}
function cell(p,size,i,mode){
 const family=F[i%F.length],seed=65901001+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...overlays[mode]};
 const x=S.encounter(10,build,seed,'normal',opts,undefined,undefined,family,1,size);
 assert.equal(x.level,10);assert.equal(x.pointsSpent,30);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.affinity,family);assert.equal(x.armorType,p.armorType);assert.equal(x.offhandType,p.offhandType);
 assert.equal(x.requestedGroupSize,size);assert.equal(x.initialEnemies,size);assert.equal(x.roster.length,size);assert.equal(x.initialVisible,Math.min(size,4));assert(x.peakVisibleEnemies<=4);
 assert(Number(x.won)+Number(x.died)+Number(x.timedOut)===1);
 if(x.won){assert.equal(x.groupPressure.remainingReserve,0);assert.equal(x.groupPressure.remainingActors,0);}
 const roster=x.roster,initial=roster.slice(0,4),pr=roster.filter(principal),gp=x.groupPressure,m=x.affinityMetrics||{};
 if(MODES[mode].count&&size>=6)assert(size<=12?pr.length===2:pr.length>=2&&pr.length<=3);
 return {size,i,seed,resolved:x.resolvedSeed,family,gear:x.gearFingerprint,stats:x.heroBaseStats,nodes:x.controlledTalentNodes,trait:x.traitId,condition:x.conditionId,marked:x.conditionMarked,vanguard:x.vanguardEncounter,roster,roles:x.initialRoles,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,secondaryDot:x.secondaryDotDamage,taken:x.damageTaken,absorbed:x.absorbed,healed:m.healingActual||0,hpMax:x.hpMax,hpEnd:x.hpEnd,minHpPct:x.minHpPct,firstKill:x.firstKillSeconds,firstPrincipalKill:gp.firstPrincipalKill,firstMinionKill:gp.firstMinionKill,principalSeconds:gp.principalSeconds,threePrincipalSeconds:gp.threePrincipalSeconds,minionOnlySeconds:gp.minionOnlySeconds,peakPrincipals:gp.peakPrincipals,initialPrincipals:gp.initialPrincipals,totalPrincipals:pr.length,totalHp:sum(roster,'maxHp'),principalHp:sum(pr,'maxHp'),principalAtk:sum(pr,'attack'),initialHp:sum(initial,'maxHp'),initialRawDps:initial.reduce((s,e)=>s+e.attack/e.attackEvery,0),reinforcements:x.reinforcementsSpawned,remainingActors:gp.remainingActors,remainingReserve:gp.remainingReserve,unfunded:x.unfundedCasterAttacks,manaSpent:x.manaSpent};
}
function pair(a,b,mode){
 for(const k of ['size','i','seed','resolved','family','gear','stats','nodes','trait','condition','marked','vanguard'])assert.deepEqual(a[k],b[k],'pair '+k);
 if(!MODES[mode].count||a.size<=5)assert.deepEqual(a.roles,b.roles,'role drift');
 if(mode==='native'||a.size<=5)assert.deepEqual(a,b,'unchanged fight drift');
}
function summarize(rows){
 const n=rows.length,sec=sum(rows,'seconds'),wins=rows.filter(r=>r.won).length;
 const out={n,wins,win:100*wins/n,timeouts:rows.filter(r=>r.timeout).length,dps:sec?sum(rows,'damage')/sec:0,secondaryDps:sec?sum(rows,'secondary')/sec:0,secondaryShare:sum(rows,'damage')?sum(rows,'secondary')/sum(rows,'damage'):0,hps:sec?sum(rows,'healed')/sec:0,damageTakenPerSecond:sec?sum(rows,'taken')/sec:0,noInitialPrincipal:100*rows.filter(r=>r.initialPrincipals===0).length/n};
 for(const k of ['seconds','taken','absorbed','healed','hpEnd','minHpPct','firstKill','firstPrincipalKill','firstMinionKill','principalSeconds','threePrincipalSeconds','minionOnlySeconds','peakPrincipals','initialPrincipals','totalPrincipals','totalHp','principalHp','principalAtk','initialHp','initialRawDps','reinforcements','remainingActors','remainingReserve','unfunded','manaSpent'])out[k]=avg(rows,k);
 return out;
}
function arm(id,mode,size,n,file){
 assert(IDS.includes(id)&&Object.hasOwn(MODES,mode)&&Number.isInteger(size)&&size>=1&&size<=22&&Number.isInteger(n)&&n>0&&n<=N);
 const p=G.profile(id),rows=Array.from({length:n},(_,i)=>cell(p,size,i,mode));
 fs.writeFileSync(file,JSON.stringify({id,mode,size,n,source:S.sourceFingerprint().sha256,rows}));
 console.log('GROUP_PRESSURE_ARM='+JSON.stringify({id,mode,size,...summarize(rows)}));
}
function run(id){
 const p=G.profile(id),jobs=[];for(const size of SIZES)for(const mode of Object.keys(MODES))jobs.push([size,mode,N]);
 if(CONTROL.includes(id))for(const size of SMALL_SIZES)for(const mode of ['native','lightMinions'])jobs.push([size,mode,SMALL_N]);
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'group-pressure-')),rows=[];
 try{
  for(const [size,mode,n] of jobs){
   const file=path.join(tmp,'arm.json'),child=spawnSync(process.execPath,['--max-old-space-size=4096',__filename,'arm',id,mode,String(size),String(n),file],{stdio:'inherit'});
   if(child.error)throw child.error;assert.equal(child.status,0,'arm failed '+id+'/'+size+'/'+mode);
   const x=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(x.id,id);assert.equal(x.mode,mode);assert.equal(x.size,size);assert.equal(x.n,n);assert.equal(x.rows.length,n);assert.equal(x.source,S.sourceFingerprint().sha256);
   const base=rows.find(v=>v.size===size&&v.mode==='native');if(base)for(let i=0;i<n;i++)pair(base.rows[i],x.rows[i],mode);
   rows.push(x);fs.unlinkSync(file);
  }
  fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,id+'.json'),JSON.stringify({id,role:p.role,families:p.families,nodes:p.t.nodes,source:S.sourceFingerprint().sha256,arms:rows}));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
function smoke(){
 pure();
 for(const id of IDS)assert.equal(G.profile(id).t.nodes.length,30);
 // Real native one-seed checks plus unchanged small-group controls.
 for(const id of ['blood-daggers','magic-lightning-wand']){
  const p=G.profile(id);
  for(const size of [4,8,12]){const a=cell(p,size,0,'native');for(const mode of Object.keys(MODES).slice(1))pair(a,cell(p,size,0,mode),mode);}
 }
 console.log('GROUP_PRESSURE_SMOKE_OK');
}
function aggregate(){
 const profiles=IDS.map(id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'),'utf8'))),source=new Set(profiles.map(p=>p.source));assert.equal(source.size,1);
 let fights=0;
 for(const p of profiles){
  assert.equal(p.arms.length,SIZES.length*Object.keys(MODES).length+(CONTROL.includes(p.id)?SMALL_SIZES.length*2:0));
  for(const a of p.arms){assert.equal(a.id,p.id);assert.equal(a.source,p.source);assert.equal(a.n,SIZES.includes(a.size)?N:SMALL_N);assert.equal(a.rows.length,a.n);assert.equal(new Set(a.rows.map(r=>r.i)).size,a.n);
   const base=p.arms.find(v=>v.size===a.size&&v.mode==='native');assert(base);for(let i=0;i<a.n;i++)pair(base.rows[i],a.rows[i],a.mode);fights+=a.n;
   if(a.mode==='spread'||a.mode==='lightMinions'&&a.size<=16){const other=p.arms.find(v=>v.size===a.size&&v.mode===(a.mode==='spread'?'combined':'spread'));if(other)for(let i=0;i<a.n;i++){const ra=a.rows[i].roster,rb=other.rows[i].roster;if(a.mode==='spread')assert.deepEqual(ra.map(e=>JSON.stringify(e)).sort(),rb.map(e=>JSON.stringify(e)).sort(),'order-only changed actor stats');else assert.deepEqual(ra.map(e=>({...e,maxHp:undefined})),rb.map(e=>({...e,maxHp:undefined})),'light HP-only drift');}}
  }
 }
 const planned=IDS.length*SIZES.length*Object.keys(MODES).length*N+CONTROL.length*SMALL_SIZES.length*2*SMALL_N;assert.equal(fights,planned);
 function groups(ps,sizes,modes){return Object.fromEntries(sizes.map(size=>[size,Object.fromEntries(modes.map(mode=>{const rows=ps.flatMap(p=>p.arms.find(a=>a.size===size&&a.mode===mode)?.rows||[]);const base=ps.flatMap(p=>p.arms.find(a=>a.size===size&&a.mode==='native')?.rows||[]);assert.equal(rows.length,base.length);const s=summarize(rows),b=summarize(base);return [mode,{...s,delta:s.win-b.win,gains:rows.filter((r,i)=>r.won&&!base[i].won).length,losses:rows.filter((r,i)=>!r.won&&base[i].won).length}];}))]));}
 const modes=Object.keys(MODES),all=groups(profiles,SIZES,modes),byFamily=Object.fromEntries(F.map(f=>[f,groups(profiles.filter(p=>p.families.includes(f)),SIZES,modes)])),byRole=Object.fromEntries([...new Set(profiles.map(p=>p.role))].map(r=>[r,groups(profiles.filter(p=>p.role===r),SIZES,modes)])),controls=groups(profiles.filter(p=>CONTROL.includes(p.id)),SMALL_SIZES,['native','lightMinions']);
 const result={fights,source:[...source][0],config:MODES,all,byFamily,byRole,controls,profiles:profiles.map(p=>({id:p.id,role:p.role,families:p.families,results:groups([p],SIZES,modes)}))};
 fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(result));
 const compact=g=>Object.fromEntries(Object.entries(g).map(([size,a])=>[size,Object.fromEntries(Object.entries(a).map(([m,s])=>[m,{n:s.n,win:s.win,delta:s.delta,gains:s.gains,losses:s.losses,timeouts:s.timeouts,initialPrincipals:s.initialPrincipals,totalPrincipals:s.totalPrincipals,noInitialPrincipal:s.noInitialPrincipal,initialRawDps:s.initialRawDps,initialHp:s.initialHp,totalHp:s.totalHp,principalHp:s.principalHp,principalAtk:s.principalAtk,taken:s.taken,healed:s.healed,seconds:s.seconds,secondaryDps:s.secondaryDps,secondaryShare:s.secondaryShare,minionOnlySeconds:s.minionOnlySeconds,principalSeconds:s.principalSeconds}]))]));
 console.log('GROUP_PRESSURE_OVERVIEW='+JSON.stringify({fights,config:MODES,all:compact(all),controls:compact(controls)}));
 for(const [family,g] of Object.entries(byFamily))console.log('GROUP_PRESSURE_FAMILY='+JSON.stringify({family,results:compact(g)}));
 for(const [role,g] of Object.entries(byRole))console.log('GROUP_PRESSURE_ROLE='+JSON.stringify({role,results:compact(g)}));
 for(const p of result.profiles)console.log('GROUP_PRESSURE_PROFILE='+JSON.stringify({...p,results:compact(p.results)}));
}
if(require.main===module){const [cmd,id,mode,size,n,file]=process.argv.slice(2);if(cmd==='pure')pure();else if(cmd==='smoke')smoke();else if(cmd==='run')run(id);else if(cmd==='arm')arm(id,mode,Number(size),Number(n),file);else if(cmd==='aggregate')aggregate();else throw Error('unknown command');}
