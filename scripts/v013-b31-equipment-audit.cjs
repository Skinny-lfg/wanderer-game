'use strict';
// B3.1 screening: native items only, fixed talent budgets and matched seeds.
// Agent scoring is read-only. No production balance values or policy weights are changed.
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),N=require('./v013-natural-progression.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),{observer}=require('./v013-b23b-stalemate.cjs');
const OUT='reports/b31',BASE='10d70349acc8b095682f4d2963a358221f35b1eb',SEEDS=20,F=['blood','decay','radiance','aegis','fury','arcane'],OFF=[null,'Shield','Orb','Tome','Charm','Off-Hand Dagger'],WEAPONS=['Sword','Mace','Daggers','Two-Handed','Bow','Wand','Staff'],ARMOR=['Cloth','Leather','Plate'];
const profiles=[['blood-sword','smart-blood-sword'],['decay-cycle-daggers','smart-decay-cycle-daggers'],['decay-cycle-wand','smart-decay-cycle-wand'],['fury-daggers','smart-fury-daggers'],['aegis-mace','pure-aegis'],['radiance-mace','smart-radiance-pure'],['arcane-arcane-wand','smart-arcane-arcane-pure']];
const studies=[...profiles.map(([id,agent])=>({id,agent,kind:'offhand-armor'})),...['blood-sword','arcane-arcane-wand'].map(id=>({id,agent:profiles.find(x=>x[0]===id)[1],kind:'weapon'}))],scenarios=[{id:'solo',kind:'normal',size:1},{id:'group12',kind:'normal',size:12},{id:'boss',kind:'boss'}];
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),write=(name,x)=>{fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x,null,2));},read=name=>JSON.parse(fs.readFileSync(OUT+'/'+name+'.json','utf8')),mean=(rows,f)=>rows.length?rows.reduce((n,x)=>n+f(x),0)/rows.length:null;
function arms(st,p){
 if(st.kind==='weapon')return WEAPONS.map(w=>({id:'weapon-'+w,weapon:w,armor:p.armorType,off:null}));
 return [...OFF.map(off=>({id:'offhand-'+(off||'None'),armor:p.armorType,off})),...ARMOR.filter(a=>a!==p.armorType).map(armor=>({id:'armor-'+armor,armor,off:p.offhandType}))];
}
function strip(e,omit=[]){return Object.entries(e).filter(([k])=>!omit.includes(k)).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,v?Object.fromEntries(Object.entries(v).filter(([key])=>key!=='id')):null]);}
function cell(st,p,sc,i,arm){
 const seed=100600001+i*109,family=F[i%F.length],build={id:p.id,weapon:p.weapon,families:p.families,skills:[],element:p.element};
 const x=S.encounter(10,build,seed,sc.kind,{...S.DEFAULTS,mode:'encounter',points:p.t.nodes.length,gear:'current',rarity:'Rare',runes:false,contracts:'none',boons:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:arm.off,...(arm.armor!==p.armorType?{stageE10ArmorVariant:arm.armor}:{}),...(arm.weapon?{stageB31WeaponVariant:arm.weapon}:{}),stageB31EquipmentAudit:true,...(sc.id==='solo'?{stalemateAudit:observer(true)}:{})},undefined,undefined,family,1,sc.size);
 assert.equal(x.level,10);assert.equal(x.pointsSpent,p.t.nodes.length);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.armorType,arm.armor);assert.equal(x.offhandType,arm.off);assert.equal(x.weaponType,arm.weapon||p.weapon);assert.equal([x.won,x.died,x.timedOut,!!x.surrendered].filter(Boolean).length,1);
 if(x.surrendered)assert.equal(x.surrenderSettlement.outcome,'defeat');
 const m=x.affinityMetrics||{},w=x.weaponStatusMetrics||{},e=x.equipmentAudit;
 return {arm:arm.id,seed,resolved:x.resolvedSeed,realm:family,rosterHash:hash([x.roster,x.initialRoles,x.conditionId,x.conditionMarked,x.traitId,x.bossModifierIds,x.bossId]),gearHash:x.gearFingerprint,nonOff:hash(strip(e,['offhand'])),nonArmor:hash(strip(e,['helm','armor','gloves','boots','belt'])),nonWeapon:hash(strip(e,['weapon'])),equipment:e,stats:x.heroBaseStats,won:x.won,died:x.died,surrendered:!!x.surrendered,timeout:x.timedOut,seconds:x.seconds,firstKill:x.firstKillSeconds,damage:x.damageDealt,taken:x.damageTaken,absorbed:x.absorbed,healing:m.healingActual||0,barrier:m.barrierGenerated||0,orbBarrier:m.offhandOrbBarrier||0,tomeMana:m.offhandTomeMana||0,charmHealing:m.offhandCharmHealing||0,dot:m.dotDamageActual||0,offHits:w.secondaryEquipmentStatusOffhandStrikes||0,offDamage:w.secondaryEquipmentStatusOffhandDamage||0,offBleed:w.secondaryEquipmentStatusOffhandBleedApplications||0,offRot:w.secondaryEquipmentStatusOffhandRotApplications||0,mainHits:w.secondaryEquipmentStatusMainStrikes||0,manaSpent:x.manaSpent,mpEnd:x.mpEnd,mpMax:x.mpMax,unfunded:x.unfundedCasterAttacks,hpEnd:x.hpEnd,hpMax:x.hpMax};
}
function pair(st,p,sc,i){
 const list=arms(st,p),rows=list.map(a=>cell(st,p,sc,i,a)),base=rows[0];for(const row of rows){assert.equal(row.rosterHash,base.rosterHash,'Roster/condition drift');assert.equal(row.resolved,base.resolved,'Realm seed drift');if(st.kind==='weapon')assert.equal(row.nonWeapon,base.nonWeapon,'Non-weapon gear drift');else if(row.arm.startsWith('offhand-'))assert.equal(row.nonOff,base.nonOff,'Non-offhand gear drift');else {const comparator=rows.find(x=>x.arm==='offhand-'+(p.offhandType||'None'));assert.equal(row.nonArmor,comparator.nonArmor,'Non-armor gear drift');}}
 // Score all choices against one fixed observed context, rather than each arm's own post-choice stats.
 const current=st.kind==='weapon'?rows.find(x=>x.arm==='weapon-'+p.weapon):rows.find(x=>x.arm==='offhand-'+(p.offhandType||'None'));
 const stats=current.stats,pr={...D.approvedProfile(st.agent),adaptiveNodes:[...p.t.nodes],synergyContext:{stats,nodes:[...p.t.nodes],weapon:current.equipment.weapon?.subtype,offhand:current.equipment.offhand?.subtype}};
 for(const r of rows){
  const score=policy=>N.handPairScore(r.equipment,policy),reference=policy=>N.handPairScore(current.equipment,policy),h={...pr},h23={...pr,offhandPolicy:'b23'};
  if(!r.arm.startsWith('armor-'))r.score={H:score(h)-reference(h),H23:score(h23)-reference(h23),daggerUtility:N.offhandPairUtility(r.equipment.weapon,r.equipment.offhand,h23),context:'fixed native baseline stats, same talent nodes'};
  else r.score={H:['helm','armor','gloves','boots','belt'].reduce((n,k)=>n+N.gearScore(r.equipment[k],h,k)-N.gearScore(current.equipment[k],h,k),0),H23:['helm','armor','gloves','boots','belt'].reduce((n,k)=>n+N.gearScore(r.equipment[k],h23,k)-N.gearScore(current.equipment[k],h23,k),0)};
 }
 return {scenario:sc.id,seed:base.seed,baseline:current.arm,rows};
}
function run(index,n=SEEDS){const st=studies[index];assert(st);const p=G.profile(st.id),cases=[];for(const sc of scenarios)for(let i=0;i<n;i++)cases.push(pair(st,p,sc,i));return {index,study:st,commit:process.env.GITHUB_SHA||null,source:S.sourceFingerprint().sha256,points:p.t.nodes.length,nodes:p.t.nodes,cases};}
function scoreDetail(item,equip,p){
 const q={...p,offhandPolicy:'b23'},next={...equip,offhand:item},h={...p,offhandPolicy:null};
 const score=(gear,profile)=>N.handPairScore(gear,profile);
 const raw=N.gearScore(item,{...q,plan:null,synergyAudit:false},'offhand'),synergy=N.gearScore(item,{...q,plan:null},'offhand')-raw,planner=N.gearScore(item,q,'offhand')-raw-synergy;
 return {raw,synergy,planner,daggerUtility:N.offhandPairUtility(equip.weapon,item,q),H:score(next,h)-score(equip,h),H23:score(next,q)-score(equip,q)};
}
function agents(pi){
 const id=['smart-blood-sword','smart-decay-cycle-daggers','smart-decay-cycle-wand','hybrid-decay-blood'][pi];assert(id);const rows=[];
 for(const seed of [100500001,100500108]){
  const observations=[],p={...D.approvedProfile(id),offhandPolicy:'b23'};
  const acc=N.simulateAccount(seed,id,{...N.DEFAULTS,...D.CONFIG,tickLimit:13000},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:({a,level,attempt,profile,camp})=>{
   const st=a.state(),equip=st.equip,stats=a.baseStats(),nodes=[...st.automaticTalents.nodes],q={...profile,adaptiveNodes:nodes,synergyContext:{stats,nodes,weapon:equip.weapon?.subtype,offhand:equip.offhand?.subtype}};
   const dagger=x=>['Daggers','Off-Hand Dagger'].includes(x?.subtype);
   const options=[...(st.stash||[]).filter(dagger).map(item=>({item,source:'stash'})),...(st.merchant?.stock||[]).filter(dagger).map(item=>({item,source:'merchant'}))];
   const legal=!['Two-Handed','Bow','Staff'].includes(equip.weapon?.subtype);
   if(nodes.length>=10&&options.length)observations.push({level,attempt,nodes,stats,weapon:equip.weapon,offhand:equip.offhand,cap:N.capabilities(a).offhandDagger,chosen:(camp?.equipped||[]).filter(x=>x.slot==='offhand'),candidates:options.map(({item,source})=>({item,source,legal:legal&&(source==='stash'||N.investmentAllowed(item,q,'offhand',equip)),affordable:source==='stash'||item.goldPrice<=st.gold,...(legal?{score:scoreDetail(item,equip,q)}:{})}))});
   return {legal:a.talents.valid(st.automaticTalents),stats};
  }});
  const audit=A.audit(id,[acc]),issues=[...audit.issues];for(const t of acc.attempts)issues.push(...D.compatibilityIssues(t,p));assert.deepEqual(audit.errors,[]);assert.deepEqual(issues,[]);rows.push({seed,endLevel:acc.endLevel,observations});
 }
 write('agent-'+pi,{id,commit:process.env.GITHUB_SHA||null,rows});const candidates=rows.flatMap(r=>r.observations.flatMap(o=>o.candidates.filter(c=>c.legal&&c.affordable)));console.log('B31_AGENT='+JSON.stringify({id,accounts:rows.length,candidateObservations:candidates.length,positive:candidates.filter(c=>c.score.H23>=2.5).length,meanGain:mean(candidates,c=>c.score.H23),meanDaggerUtility:mean(candidates,c=>c.score.daggerUtility)}));
}
function metrics(rows){const n=rows.length,wins=rows.filter(x=>x.won).length,timeout=rows.filter(x=>x.timeout).length;return {n,wins,deaths:rows.filter(x=>x.died).length,surrenders:rows.filter(x=>x.surrendered).length,timeout,winPctAll:100*wins/n,resolvedWinPct:n===timeout?null:100*wins/(n-timeout),seconds:mean(rows,x=>x.seconds),DPS:mean(rows,x=>x.seconds?x.damage/x.seconds:0),damagePerHit:mean(rows,x=>x.mainHits+x.offHits?x.damage/(x.mainHits+x.offHits):0),AP:mean(rows,x=>x.stats.attack||0),SP:mean(rows,x=>x.stats.spellPower||0),APS:mean(rows,x=>x.stats.attacksPerSec||0),HP:mean(rows,x=>x.stats.maxhp||0),defense:mean(rows,x=>x.stats.defense||0),block:mean(rows,x=>x.stats.blockChance||0),evasion:mean(rows,x=>x.stats.evasionRating||0),takenPerSec:mean(rows,x=>x.seconds?x.taken/x.seconds:0),healing:mean(rows,x=>x.healing),barrier:mean(rows,x=>x.barrier),absorbed:mean(rows,x=>x.absorbed),orbBarrier:mean(rows,x=>x.orbBarrier),tomeMana:mean(rows,x=>x.tomeMana),charmHealing:mean(rows,x=>x.charmHealing),offHits:mean(rows,x=>x.offHits),offDamage:mean(rows,x=>x.offDamage),offBleed:mean(rows,x=>x.offBleed),offRot:mean(rows,x=>x.offRot),manaSpent:mean(rows,x=>x.manaSpent),unfunded:mean(rows,x=>x.unfunded),H:mean(rows,x=>x.score.H),H23:mean(rows,x=>x.score.H23)};}
function aggregate(){
 const xs=studies.map((st,i)=>read('study-'+i));assert.equal(new Set(xs.map(x=>x.source)).size,1);const results=[],all=xs.flatMap(x=>x.cases.flatMap(c=>c.rows));
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.cases.length,SEEDS*scenarios.length);assert.equal(new Set(x.cases.map(c=>c.scenario+'/'+c.seed)).size,x.cases.length);
  for(const sc of scenarios){const cases=x.cases.filter(c=>c.scenario===sc.id),baseline=cases[0].baseline;
   const byArm=Object.fromEntries(cases[0].rows.map(r=>{const rows=cases.map(c=>c.rows.find(x=>x.arm===r.arm));const pairs=cases.map(c=>[c.rows.find(x=>x.arm===baseline),c.rows.find(x=>x.arm===r.arm)]).filter(([a,b])=>!a.timeout&&!b.timeout);return [r.arm,{...metrics(rows),pairedN:pairs.length,pairedWinDelta:mean(pairs,([a,b])=>100*(Number(b.won)-Number(a.won))),winGains:pairs.filter(([a,b])=>!a.won&&b.won).length,winLosses:pairs.filter(([a,b])=>a.won&&!b.won).length}];}));
   const out={study:x.study,scenario:sc.id,baseline,arms:byArm};results.push(out);console.log('B31_STUDY='+JSON.stringify(out));
  }
 }
 const agents=[0,1,2,3].map(i=>read('agent-'+i)),summary={baseline:BASE,commit:process.env.GITHUB_SHA,source:xs[0].source,fights:all.length,timeouts:all.filter(x=>x.timeout).length,surrenders:all.filter(x=>x.surrendered).length,agentAccounts:agents.reduce((n,x)=>n+x.rows.length,0),results,agents:agents.map(x=>({id:x.id,accounts:x.rows.length,observations:x.rows.reduce((n,r)=>n+r.observations.length,0)})),scope:'Exploratory 20 matched seeds; not final balance or representative natural baseline. Equipment variants have equal tier/rarity, native affix rolls, not identical numerical stats. Weapon screen holds all other slots fixed and no offhand; not a full-loadout comparison. Camp observations are post-decision, not a causal purchase log.'};
 assert.equal(all.length,4200);write('summary',summary);console.log('B31_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(summary.timeouts)process.exitCode=1;
}
function smoke(){const diff=execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy'],{encoding:'utf8'}).trim();assert.equal(diff,'','Production drift');for(let i=0;i<studies.length;i++){const st=studies[i],p=G.profile(st.id);pair(st,p,scenarios[0],0);}console.log('B31_SMOKE='+JSON.stringify({studies:studies.length,productionDrift:false}));}
if(require.main===module){const [cmd,i]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')write('study-'+i,run(Number(i)));else if(cmd==='agent')agents(Number(i));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
