'use strict';
// B8.6 read-only diagnosis: earned native progression, no runtime overrides.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const R=require('./v013-b82-natural-readiness.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),N=require('./v013-natural-progression.cjs'),P=require('./v013-build-planner.cjs');
const T=globalThis.WandererAutomaticTalents,GRAPH=new Map(T.NODES.map(n=>[n.id,n]));
const BASE='b4a4fc290f938de25d6e5fb069ce44e5177f49ca',OUT='reports/b86',SEEDS=Array.from({length:10},(_,i)=>138600137+193*i),CONFIG={...R.CONFIG};
const base=id=>id.replace(/_rank\d+$/,''),sum=(a,f)=>a.reduce((n,x)=>n+f(x),0),mean=(a,f)=>{const v=a.map(f).filter(Number.isFinite);return v.length?+(sum(v,x=>x)/v.length).toFixed(2):null;},pct=(n,d)=>d?+(100*n/d).toFixed(2):null;
const count=(a,f)=>{const m={};for(const x of a){const k=f(x)??'none';m[k]=(m[k]||0)+1;}return m;};
const owned=v=>new Set((v.nodes||[]).map(base)),describe=id=>{const n=GRAPH.get(id);assert(n&&!n.pending,id);return {id,name:n.name,kind:n.kind,family:n.family||null,pair:n.pair||null,element:n.element||null,advanced:!!n.advanced,requires:n.requires||null,prerequisites:n.prerequisites||[],anyRequires:n.anyRequires||[]};};
function planFor(p){return p.plan?P.getPlan(p.plan):{primary:p.families[0],secondary:p.families[1],mix:p.style!=='focused'&&p.families.length>1,element:p.element||'arcane',weapons:p.weapons,focus:{blood:'bleed',fury:'speed',arcane:'spell',decay:'rot',aegis:'defense',radiance:'defense'}[p.families[0]],milestones:p.targets||[]};}
function goals(p){const plan=planFor(p);return [...new Set([...(p.targets||[]),...(p.preparedTargets||[]),...(plan.milestones||[])])];}
// Pure legal-route witness. Hypothetical XP is allocated only to a detached
// progress value, never to the native account. This is a feasible route from
// the current planner, NOT a proven global minimum over all possible routes.
function routeWitness(v,target,plan,families){
 if(owned(v).has(target))return {cost:0,route:[]};
 const route=P.routeTo(T,v,target,plan,families);
 if(!route)return {cost:null,route:null,reason:'planner_route_missing'};
 let copy={...v,xp:T.POINT_XP*T.MAX_POINTS,nodes:[...v.nodes]};
 for(const id of route){
  const next=T.allocate(copy,id);if(!next)return {cost:null,route,reason:'native_route_rejected:'+id};
  copy=next;
  if(id==='element_choice'&&plan.element&&plan.element!=='arcane'){
   const changed=T.selectElement(copy,plan.element);if(!changed)return {cost:null,route,reason:'native_attunement_rejected'};copy=changed;
  }
 }
 if(!owned(copy).has(target))return {cost:null,route,reason:'goal_not_retained'};
 return {cost:route.length,route};
}
function graphAudit(p){
 const plan=planFor(p),targets=[...new Set([...p.families.map(f=>'affinity_'+f),...p.families.map(f=>P.OPENING_SKILLS[f]),...(p.families.includes('arcane')?['element_choice']:[]),...goals(p)])];
 return targets.map(id=>({...describe(id),...routeWitness(T.create(),id,plan,p.families)}));
}
function manifest(){
 const m=R.manifest();assert.equal(m.native,'37f7a986a538580d1c28552c07e36b4f82e3e6758acee6dce20d04460adaa027');
 assert.equal(T.POINT_XP,100);assert.equal(T.MAX_POINTS,100);assert.equal(new Set(SEEDS).size,10);
 for(const old of ['./v013-b83-natural-pilot.cjs','./v013-b85-early-recovery.cjs','./v013-b85b-selective-opening.cjs'])assert(SEEDS.every(seed=>!require(old).SEEDS.includes(seed)));
 return {base:BASE,commit:process.env.GITHUB_SHA||null,native:m.native,policy:m.policy,config:CONFIG,pointXP:T.POINT_XP,maxPoints:T.MAX_POINTS,seeds:SEEDS,profiles:R.IDS.map(id=>{const p=R.profile(id),plan=planFor(p);return {id,families:p.families,plan:p.plan||null,secondAt:plan.secondary?(plan.secondAt||12):null,thirdAt:plan.third?(plan.thirdAt||28):null,goals:goals(p),opening:P.OPENING_SKILLS[p.families[0]],routes:graphAudit(p)};}),expected:R.IDS.length*SEEDS.length};
}
function account(id,index,config=CONFIG){
 const seed=SEEDS[index],p=R.profile(id),plan=planFor(p),targets=goals(p),issues=[];
 try{
  const a=N.simulateAccount(seed,id,{...N.DEFAULTS,...config},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:({a,camp,previousAttempts})=>{
   const v=a.state().automaticTalents,previous=previousAttempts.at(-1)?.after,prior={...T.create(),xp:v.xp,nodes:[...(previous?.talentNodes||[])],prepared:previous?.prepared||null};
   if(previous?.element)prior.element=previous.element;
   const legal=T.valid(v),priorLegal=T.valid(prior),allowed=camp.plan?.allowed||p.families;
   const remaining=T.earned(v)-v.nodes.length;
   const routes=targets.map(goal=>{
    const current=routeWitness(v,goal,plan,p.families),priorRoute=priorLegal?routeWitness(prior,goal,plan,p.families):{cost:null,reason:'prior_invalid'};
    return {id:goal,owned:owned(v).has(goal),cost:current.cost,reason:current.reason||null,priorCost:priorRoute.cost,priorOwned:owned(prior).has(goal),priorFree:T.earned(v)-prior.nodes.length,remaining,allowed:(!GRAPH.get(goal).family||allowed.includes(GRAPH.get(goal).family))&&(!GRAPH.get(goal).pair||GRAPH.get(goal).pair.every(f=>allowed.includes(f)))};
   });
   return {legal,stats:a.baseStats(),talentAudit:{priorLegal,allowed,routes}};
  }});
  assert.equal(a.startXp,0);assert(a.initialGear.items.every(x=>x.startingGear));assert(a.attempts.length<=60);
  const audit=A.audit(id,[a]);issues.push(...audit.issues);
  for(const t of a.attempts)for(const message of D.compatibilityIssues(t,p))issues.push({level:t.level,attempt:t.attempt,message});
  return {...a,id,index,seed,issues};
 }catch(e){return {id,index,seed,endLevel:null,attempts:[{status:'error',error:e.message,diagnostic:String(e.stack).slice(0,6000)}],issues};}
}
const ts=a=>a.attempts.filter(t=>t.before&&t.after),rooms=a=>ts(a).flatMap(t=>t.rooms||[]),nodes=s=>new Set((s?.talentNodes||[]).map(base)),isSkill=id=>{const n=GRAPH.get(id);return n&&!n.pending&&!['stat','affinity','choice'].includes(n.kind);};
function point(t){return t?{level:t.level,attempt:t.attempt,xp:t.before.xp,earned:t.before.earned,spent:t.before.spent,nodes:t.before.talentNodes,element:t.before.element||'arcane',weapon:t.before.gear.items.find(i=>i.slot==='weapon')?.subtype||null}:null;}
function milestone(a,test){return point(ts(a).find(t=>test(nodes(t.before),t)));}
function first(a,p){
 const g=goals(p),firstGoal=(n)=>g.some(id=>n.has(id)),primary=p.families[0],opening=P.OPENING_SKILLS[primary];
 const result={affinity:milestone(a,n=>n.has('affinity_'+primary)),opening:milestone(a,n=>n.has(opening)),firstSkill:milestone(a,n=>[...n].some(isSkill)),firstGoal:milestone(a,firstGoal),firstFocused:milestone(a,n=>[...n].some(id=>GRAPH.get(id)?.kind==='focused')),firstMixed:milestone(a,n=>[...n].some(id=>GRAPH.get(id)?.kind==='mixed')),secondAffinity:milestone(a,n=>[...n].filter(id=>id.startsWith('affinity_')).length>=2),element:milestone(a,n=>n.has('element_choice')),goals:Object.fromEntries(g.map(id=>[id,milestone(a,n=>n.has(id))]))};
 return result;
}
function fightUse(rs,id){
 const owned=rs.filter(r=>(r.actualTalentNodes||[]).map(base).includes(id)),recorded=owned.filter(r=>(r.passiveActivations?.[id]||0)>0||r.preparedId===id&&r.preparedActivations>0);
 return {ownedFights:owned.length,recordedActivatedFights:recorded.length,passiveActivations:sum(owned,r=>r.passiveActivations?.[id]||0),preparedFights:owned.filter(r=>r.preparedId===id).length,preparedActivations:sum(owned.filter(r=>r.preparedId===id),r=>r.preparedActivations||0),telemetryNote:'absence of a recorded counter is not proof of no effect'};
}
function summarize(as,p){
 const g=goals(p),all=as.flatMap(ts),rs=as.flatMap(rooms),milestones=as.map(a=>({seed:a.seed,endLevel:a.endLevel,...first(a,p)}));
 const milestoneSummary=rows=>({acquired:rows.filter(Boolean).length,startingAccounts:as.length,acquiredPct:pct(rows.filter(Boolean).length,as.length),firstE:count(rows.filter(Boolean),x=>x.level),meanXP:mean(rows.filter(Boolean),x=>x.xp),meanPoints:mean(rows.filter(Boolean),x=>x.spent)});
 const levels=Array.from({length:10},(_,i)=>{const level=i+1,rows=as.map(a=>ts(a).find(t=>t.level===level)).filter(Boolean),last=as.map(a=>ts(a).filter(t=>t.level===level).at(-1)).filter(Boolean),attempts=all.filter(t=>t.level===level),fights=attempts.flatMap(t=>t.rooms||[]);return {level,entered:rows.length,cleared:as.filter(a=>a.endLevel>level).length,attempts:attempts.length,entryXP:mean(rows,t=>t.before.xp),entryEarned:mean(rows,t=>t.before.earned),entrySpent:mean(rows,t=>t.before.spent),entryUnspent:mean(rows,t=>t.before.earned-t.before.spent),entrySkill:rows.filter(t=>[...nodes(t.before)].some(isSkill)).length,entryOpening:rows.filter(t=>nodes(t.before).has(P.OPENING_SKILLS[p.families[0]])).length,entryGoal:rows.filter(t=>g.some(id=>nodes(t.before).has(id))).length,entryFocused:rows.filter(t=>[...nodes(t.before)].some(id=>GRAPH.get(id)?.kind==='focused')).length,entryMixed:rows.filter(t=>[...nodes(t.before)].some(id=>GRAPH.get(id)?.kind==='mixed')).length,lastXP:mean(last,t=>t.after.xp),xpPerAttempt:mean(attempts,t=>t.after.xp-t.before.xp),xpPerWonFight:sum(fights,r=>r.won?1:0)?+(sum(attempts,t=>t.after.xp-t.before.xp)/sum(fights,r=>r.won?1:0)).toFixed(2):null,winPct:pct(fights.filter(r=>r.won).length,fights.length),byKind:Object.fromEntries(['combat','elite','boss'].map(k=>[k,D.outcomes(D.counts(fights.filter(r=>r.roomType===k)))])),entryWeapon:count(rows,t=>t.before.gear.items.find(i=>i.slot==='weapon')?.subtype),goals:Object.fromEntries(g.map(id=>[id,{entryOwned:rows.filter(t=>nodes(t.before).has(id)).length,...fightUse(fights,id)}]))};});
 const decisions=g.map(id=>{
  const rows=all.flatMap(t=>(t.earnedProbe?.talentAudit?.routes||[]).filter(r=>r.id===id&&!r.priorOwned));
  return {id,observedUnownedCampEntries:rows.length,priorRouteMissing:rows.filter(r=>r.priorCost===null).length,priorAffordable:rows.filter(r=>r.priorCost!==null&&r.priorCost<=r.priorFree).length,affordableButNotAcquired:rows.filter(r=>r.priorCost!==null&&r.priorCost<=r.priorFree&&!r.owned).length,affordableAllowedButNotAcquired:rows.filter(r=>r.allowed&&r.priorCost!==null&&r.priorCost<=r.priorFree&&!r.owned).length,notAllowedByPlan:rows.filter(r=>!r.allowed).length,unownedWithCurrentRoute:rows.filter(r=>!r.owned&&r.cost!==null).length,meanAdditionalCost:mean(rows.filter(r=>!r.owned&&r.cost!==null),r=>r.cost),...fightUse(rs,id)};
 });
 return {accounts:as.length,clearedE10:as.filter(a=>a.endLevel>=11).length,levels,milestones:Object.fromEntries(['affinity','opening','firstSkill','firstGoal','firstFocused','firstMixed','secondAffinity','element'].map(k=>[k,milestoneSummary(milestones.map(x=>x[k]))])),goals:Object.fromEntries(g.map(id=>[id,milestoneSummary(milestones.map(x=>x.goals[id]))])),decisions,resets:sum(all,t=>(t.camp?.resets||[]).length),nodePurchases:count(all.flatMap(t=>t.camp?.talents||[]),x=>GRAPH.get(base(x))?.kind),accountsDetail:milestones};
}
function save(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),zlib.gzipSync(JSON.stringify(x)));}
function shard(i){const id=R.IDS[i];assert(id);const accounts=SEEDS.map((_,k)=>account(id,k));save('profile-'+i+'.json.gz',{manifest:manifest(),i,id,accounts});console.log('B86_SHARD='+JSON.stringify({id,accounts:accounts.length,errors:sum(accounts,a=>a.attempts.filter(t=>t.error||t.status==='error').length),issues:sum(accounts,a=>a.issues.length)}));}
function aggregate(){
 const m=manifest(),all=[],missing=[],invalid=[];
 for(const [i,id] of R.IDS.entries())try{const x=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(OUT,'profile-'+i+'.json.gz'))));assert.deepEqual(x.manifest,m);assert.equal(x.id,id);assert.equal(x.accounts.length,SEEDS.length);x.accounts.forEach((a,k)=>{assert.equal(a.seed,SEEDS[k]);assert.equal(a.id,id);assert.equal(a.index,k);});all.push(...x.accounts);}catch(e){(e.code==='ENOENT'?missing:invalid).push({i,id,error:e.message});}
 const integrity={accounts:all.length,expected:m.expected,missing,invalid,errors:sum(all,a=>a.attempts.filter(t=>t.error||t.status==='error').length),issues:sum(all,a=>a.issues.length),timeouts:sum(all,a=>rooms(a).filter(r=>r.timedOut).length)};
 const clean=integrity.accounts===m.expected&&!missing.length&&!invalid.length&&!integrity.errors&&!integrity.issues&&!integrity.timeouts;
 const profiles=R.IDS.map(id=>({id,...summarize(all.filter(a=>a.id===id),R.profile(id))}));
 const levels=Array.from({length:10},(_,i)=>{const level=i+1,entries=all.map(a=>ts(a).find(t=>t.level===level)).filter(Boolean);return {level,entered:entries.length,cleared:all.filter(a=>a.endLevel>level).length,entryXP:mean(entries,t=>t.before.xp),entryEarned:mean(entries,t=>t.before.earned),entrySpent:mean(entries,t=>t.before.spent),entryUnspent:mean(entries,t=>t.before.earned-t.before.spent),entrySkill:sum(profiles,p=>p.levels[i].entrySkill),entryOpening:sum(profiles,p=>p.levels[i].entryOpening),entryGoal:sum(profiles,p=>p.levels[i].entryGoal),entryFocused:sum(profiles,p=>p.levels[i].entryFocused),entryMixed:sum(profiles,p=>p.levels[i].entryMixed)};});
 const result={manifest:m,integrity,clean,levels,profiles,notes:['Ten fresh shared seed blocks; exploratory, not population acceptance. Per-level entries conditional on reach.','Route witnesses are legal when available, not proven minimum cost; no account resources altered. Missing route may be plan restrictions, not impossible graph.','Prior affordable but not acquired can reflect competing goals, not necessarily incorrect choice. Missing activation counters are not evidence of no effect.','No XP, rewards, talents, equipment, agent policy or combat tuning changed.']};
 fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(result,null,2));
 for(const p of profiles)console.log('B86_PROFILE='+JSON.stringify({id:p.id,clearedE10:p.clearedE10,milestones:p.milestones,goals:p.goals,decisions:p.decisions,levels:p.levels.filter(l=>[1,5,10].includes(l.level))}));
 console.log('B86_OVERVIEW='+JSON.stringify({integrity,clean,levels}));if(!clean)process.exitCode=1;
}
module.exports={manifest,account,summarize,routeWitness,graphAudit,planFor,first,SEEDS,CONFIG};
if(require.main===module){const [cmd,i]=process.argv.slice(2);if(cmd==='plan'){const m=manifest();fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(m,null,2));console.log('B86_PLAN='+JSON.stringify({expected:m.expected,pointXP:m.pointXP,profiles:m.profiles.length,seedBlocks:m.seeds.length,native:m.native}));}else if(cmd==='shard')shard(Number(i));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
