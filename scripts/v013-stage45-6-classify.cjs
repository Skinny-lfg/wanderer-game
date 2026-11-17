'use strict';
// Stage 4.5.6: legacy failures are signals, not a reason to rewrite current gameplay.
// A candidate diagnosis is NEVER equivalent to verified obsolescence or a green test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('reports/stage45-6-regression');
fs.mkdirSync(root,{recursive:true});
const tap=fs.readFileSync(path.join(root,'npm-test.tap'),'utf8');
const baseline=JSON.parse(fs.readFileSync('reports/v013-stage45-3-general-suite-baseline.json','utf8'));
const legacyIndex=new Map(baseline.items.map(x=>[x.name,x]));
const failed=[...tap.matchAll(/^not ok\s+\d+\s+-\s+(.+)$/gm)].map(x=>x[1]);
assert.equal(new Set(failed).size,failed.length,'Duplicated names: cannot classify reliably');
const textOf=(name)=>name.toLowerCase();
const patterns=[
 {id:'old-route-expected',risk:'P1',suspected:'Changed v0.13 route/draft contract',match:/\b(draft|reroll|affinity offer|old reward|initial affinity|realm clear|reward checkpoint|choose an affinity|passive must be chosen)\b/i,probe:'tests/v013-current-dungeon-and-talents.test.cjs; tests/v013-full-expedition-integration.test.cjs'},
 {id:'combat-trigger',risk:'P0',suspected:'Potential combat or passive defect — reproduce using a live v0.13 fight',match:/reapers_cadence|oathwall|Crimson Fang|Veil empowers|positive trigger|unique gate|percentage burst|Bleed\/Burn|Rot ticks|dodge|Dual Dagger|Wand \+ Orb|Second Wind|offhand|attack clock|Elite debuffs|numeric.*scaling|affinity scaling|passive is unique|all twelve effects|funded cast|combat outcome/i,probe:'tests/v013-encounter-traits-runtime.test.cjs; tests/v013-stat-consistency.test.cjs; tests/v013-simulation.test.cjs'},
 {id:'legacy-parity',risk:'P1',suspected:'v0.12 runtime parity may use retired mob count/route contracts',match:/runtime parity automatic-rpg-variable-mob-counts|native paired balance|D\.7 audit|D\.7: Dual Dagger/i,probe:'tests/v013-simulation.test.cjs; tests/v013-full-expedition-integration.test.cjs'},
 {id:'save-fixture',risk:'P1',suspected:'Legacy v0.12 save/fixture mismatch; ensure v0.13 checkpoint remains valid',match:/Invalid v0\.12 save: crafting progress|old checkpoints|schema 13|versioned save|save sessions|preserves.*reload/i,probe:'tests/v013-dungeon-checkpoint-integrity.test.cjs; tests/v013-current-dungeon-and-talents.test.cjs'},
 {id:'mock-dom',risk:'P1',suspected:'Legacy synthetic DOM binding incompatible with current UI',match:/\$\(\.\.\.\)\.onclick is not a function|vendor\/crafting actions|Forge and Merchant prices/i,probe:'tests/v013-stage45-4-browser.cjs; tests/v013-stage45-5-browser.cjs'},
 {id:'economy-rewards',risk:'P0',suspected:'Potential loot/economy/extraction regression requiring actual settlement test',match:/full Stash|Full Stash|Full Expedition victory|loot rules|rewards.*once|Boss Rune|Rune rewards|Extract allows|extraction summary|crafting|salvage|treasure|gear and Runes|Rune tiers|E1\/E2|award|potion|Potion|Belt crafts|gear retains|reward ledger/i,probe:'tests/v013-full-expedition-integration.test.cjs; tests/v013-loot.test.cjs; tests/v013-crafting.test.cjs'},
 {id:'legacy-event-contract',risk:'P2',suspected:'Event catalog/scheduling changed; compare to intended v0.13 event pool',match:/event catalog has eight|route schedule groups|no retained event requires/i,probe:'tests/v013-full-expedition-integration.test.cjs'},
 {id:'presentation-version',risk:'P2',suspected:'Version / legacy page copy changed intentionally; inspect current UI separately',match:/public entrypoint displays|preview uses a separate|passive UX copy|damage animations|enemy projectile VFX|functions have one implementation|enemy attack clock remains/i,probe:'tests/v013-stage45-4-browser.cjs'},
 {id:'progression-and-equipment',risk:'P1',suspected:'Current progression or item stat formula may differ; compare to approved v0.13 specs',match:/stat budget|item coefficients|armor categories|old gear|affinity|equipment|evasion|attack speed|infinity|gear and Runes/i,probe:'tests/v013-stat-consistency.test.cjs; tests/v013-tier-upgrade.test.cjs'}
];
function select(old,name){
 const err=String(old?.error||'');
 // Stronger error evidence before title heuristics; these remain candidate diagnoses.
 if(/Invalid v0\.12 save: crafting progress/i.test(err))return {...patterns.find(p=>p.id==='save-fixture'),evidence:'Legacy save validator refused fixture'};
 if(/\$\(\.\.\.\)\.onclick is not a function/i.test(err))return {...patterns.find(p=>p.id==='mock-dom'),evidence:'Mock DOM lacks clickable control'};
 if(/Cannot read properties of null \(reading 'options'\)|Not a reachable Realm|Magic element already chosen or ineligible|Boss modifiers failed to apply/i.test(err))return {...patterns.find(p=>p.id==='old-route-expected'),evidence:'Synthetic fixture could not establish current route'};
 const p=patterns.find(p=>p.match.test(name));
 return p?{...p,evidence:'Name-based risk routing, not a verified root cause'}:
 {id:'unresolved',risk:'P1',suspected:'No trustworthy classification — requires reproduction',probe:'Investigate source test and current rule',evidence:'No matching pattern'};
}
const rows=failed.map((name,i)=>{
 const old=legacyIndex.get(name),p=select(old,name);
 return {number:i+1,name,legacyFile:old?.file||null,baselineError:old?.error||null,
   existedIn106:!!old,candidate:p.id,risk:p.risk,suspectedCause:p.suspected,
   evidence:p.evidence,currentProbe:p.probe,status:'OPEN — no individual gameplay clearance'};
});
const counts={};
for(const r of rows){const k=r.risk+'/'+r.candidate;counts[k]=(counts[k]||0)+1}
const fresh=rows.filter(x=>!x.existedIn106);
const resolved=baseline.items.filter(x=>!failed.includes(x.name));
const output={source:'npm test on full GitHub runner, v0.13 stacked PR',legacyBaseline:baseline.failing,
 totalNow:rows.length,notPresentFromBaseline:resolved.length,newAgainstBaseline:fresh.length,
 counts, releaseDecision:'NOT CLEARED — all 96 legacy failures remain individually open until reproduced/accepted',
 note:'Even when a current v0.13 gate passes, it cannot prove that a legacy failure is obsolete. Risk groups prioritize manual/current-API checks.',
 newFailures:fresh, resolvedFromOldSnapshot:resolved.map(x=>({name:x.name,file:x.file,oldError:x.error})),cases:rows};
fs.writeFileSync(path.join(root,'classification.json'),JSON.stringify(output,null,2)+'\n');
const escapeCell=x=>String(x||'').replace(/\|/g,'\\|').replace(/\n/g,' ');
const md=['# Wanderer v0.13 — Stage 4.5.6 failure-by-failure review','',
 '**Provisional classification; no legacy failure has been cleared by labels alone.**','',
 'Historic baseline: '+baseline.failing+'; current: '+rows.length+'; new against baseline: '+fresh.length+'; old cases not currently failing: '+resolved.length+'.','',
 '| Risk / suspected cause | Count |','|---|---:|',
 ...Object.entries(counts).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,n])=>'| '+k+' | '+n+' |'),
 '', '## Full inventory',
 '| # | Legacy file | Test | Risk | Suspected category | Status |',
 '|---:|---|---|---|---|---|',
 ...rows.map(r=>'| '+r.number+' | '+escapeCell(r.legacyFile||'NEW')+' | '+escapeCell(r.name)+' | '+r.risk+' | '+r.candidate+' | OPEN |'),
 '', '## Evidence requirements',
 '- **P0:** reproduce failing combat/economy path with current v0.13 harness or real UI, compare rules, then add dedicated regression test before changing gameplay.',
 '- **P1:** establish fixture/API parity first, then rerun the exact mechanic with current v0.13 state.',
 '- **P2:** document intended design change; do not delete a safety assertion without an equivalent modern check.',
 '- **New baseline failures:** escalate before Stage 5, regardless of total failure count.',
 '- Firebase login/cloud save integration is excluded from this *development-only* gameplay gate; v0.12 live remains unchanged.',
 '', '## Out of date / new compared with earlier incomplete snapshot',
 'New failing tests: '+(fresh.map(x=>x.name).join('; ')||'none')+'.',
 'Previously failing, now not failing: '+(resolved.map(x=>x.name).join('; ')||'none')+'.',
 ''];
fs.writeFileSync(path.join(root,'classification.md'),md.join('\n'));
console.log('STAGE 4.5.6 CLASSIFICATION',JSON.stringify({total:rows.length,new:fresh.length,resolved:resolved.length,counts}));
console.log('P0 candidates:',rows.filter(x=>x.risk==='P0').map(x=>x.name).join(' | '));
console.log('New failing tests:',fresh.map(x=>x.name).join(' | ')||'none');
if(!rows.length)process.exitCode=2; // No evidence is a failed audit, not a green suite.
