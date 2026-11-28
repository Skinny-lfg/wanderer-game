'use strict';
// B8.2: explicitly versioned natural policy. No runtime overrides, grants or tuning.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const B=require('./v013-b1-e10-rebaseline.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),N=require('./v013-natural-progression.cjs'),S=require('./simulate-progression.cjs'),P=require('./v013-build-planner.cjs');
const POLICY='b8.2-combat-aware',IDS=Object.freeze([...B.NATURAL]),SEED=138200091;
const CONFIG=Object.freeze({...D.CONFIG,tickLimit:13000});
function profile(id){
 assert(IDS.includes(id),id);
 return {...D.approvedProfile(id),offhandPolicy:'b23',equipmentIntelligence:'b32d7-combat-aware'};
}
function manifest(){
 const m=B.manifest(),potions=globalThis.WandererV012Consumables;
 assert.equal(IDS.length,28);assert.equal(new Set(IDS).size,IDS.length);
 assert(IDS.includes('smart-decay-outbreak'));assert(!IDS.some(x=>x.includes('plagueheart')));
 assert.equal(potions.CATALOG.length,21);assert.deepEqual(potions.CATALOG.map(p=>p.id).sort(),potions.RECIPES.map(p=>p.id).sort());
 for(const id of IDS)for(const p of potions.CATALOG)assert(Number.isFinite(N.potionScore(p.id,profile(id))),id+'/'+p.id);
 return {commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,policy:POLICY,config:CONFIG,profiles:m.natural,seed:SEED,potions:m.potions};
}
function account(id,seed=SEED,config=CONFIG){
 const p=profile(id),a=N.simulateAccount(seed,id,{...N.DEFAULTS,...config},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:({a})=>({legal:a.talents.valid(a.state().automaticTalents),stats:a.baseStats()})});
 assert.equal(a.startXp,0);assert(a.initialGear.items.every(x=>x.startingGear));
 const audit=A.audit(id,[a]);assert.deepEqual(audit.errors,[],id);assert.deepEqual(audit.issues,[],id);
 for(const t of a.attempts){assert(!t.error,id+' '+JSON.stringify(t.error));assert.deepEqual(D.compatibilityIssues(t,p),[],id);assert(!(t.rooms||[]).some(r=>r.timedOut),id+' timeout');}
 return {id,seed,endLevel:a.endLevel,attempts:a.attempts.length,stopReason:a.stopReason,coverage:audit.coverage.all};
}
function smoke(){
 const m=manifest(),rows=IDS.map(id=>account(id,SEED,{...CONFIG,maxLevel:1,maxAttempts:1,maxTotalAttempts:1}));
 assert(rows.every(r=>r.attempts===1));
 const report={...m,scope:'E1, one earned native attempt per profile; no E10 balance claim',rows};
 fs.mkdirSync('reports/b82',{recursive:true});fs.writeFileSync('reports/b82/smoke.json',JSON.stringify(report,null,2));
 console.log('B82_SMOKE='+JSON.stringify({policy:POLICY,profiles:rows.length,attempts:rows.reduce((n,r)=>n+r.attempts,0),native:m.native}));
}
module.exports={POLICY,IDS,SEED,CONFIG,profile,manifest,account,smoke};
if(require.main===module)smoke();
