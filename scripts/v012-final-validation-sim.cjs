// Phase 5 validation only: reuse the Phase 4 original-combat driver, never prototype formulas.
const fs=require('node:fs'),crypto=require('node:crypto');
const {run,campaign,priorities}=require('./v012-economy-sim.cjs');
const definitions={
 blood_focus:{families:['blood','vitality','aegis'],picks:['bleeding_edge','deep_cuts','executioner','blood_drinker','sanguine_fury']},
 decay_focus:{families:['decay','vitality','aegis'],picks:['toxic_touch','virulent_rot','wasting_curse','blight','wither']},
 aegis_focus:{families:['aegis','vitality','blood'],picks:['iron_skin','fortified','guarded_block','barrier_pulse','retaliation']},
 fury_focus:{families:['fury','blood','decay'],picks:['quick_hands','precision','brutal_crit','double_strike','adrenaline']},
 fire_focus:{families:['magic','aegis','vitality'],element:'fire',picks:['arcane_focus','kindling','mana_spring','efficient_cast','elemental_force']},
 frost_focus:{families:['magic','aegis','vitality'],element:'frost',picks:['deep_winter','arcane_focus','mana_spring','efficient_cast','elemental_force']},
 lightning_focus:{families:['magic','aegis','vitality'],element:'lightning',picks:['overcharge','arcane_focus','mana_spring','efficient_cast','elemental_force']},
 hybrid_sustain:{families:['vitality','aegis','blood'],split:true,hybridFirst:true,picks:['renewal','second_breath','sanctuary','blood_ward','hemovore']},
 hybrid_spell:{families:['magic','decay','fury'],split:true,hybridFirst:true,picks:['toxic_touch','hex_bolt','spellblade','toxic_precision','arcane_focus']}
};
for(const [name,p]of Object.entries(definitions))priorities[name]={route:'safe',...p};
const rows=[];
for(const level of [1,20,80,200])for(const ratio of [.5,1,1.5])for(const strategy of Object.keys(definitions))for(let seed=1;seed<=4;seed++){
 const weapon=['Sword','Mace','Bow','Daggers','Two-Handed','Staff','Wand'][(level+seed)%7];
 rows.push({...run({level,ratio,strategy,seed,weapon}),matrix:'builds'});
}
for(const level of [20,80,200])for(const rarity of ['Common','Rare','Epic'])for(const weapon of ['Sword','Staff'])for(let seed=1;seed<=4;seed++){
 rows.push({...run({level,ratio:1,strategy:'hybrid_sustain',seed,weapon,rarity}),rarity,matrix:'rarity'});
}
const campaigns=[];for(const policy of ['loot','forge','merchant','both'])for(let seed=1;seed<=3;seed++)campaigns.push(campaign(policy,seed));
function summarize(list){
 const avg=k=>+(list.reduce((n,r)=>n+r[k],0)/list.length).toFixed(2);
 return {runs:list.length,wins:list.filter(r=>r.won).length,bossReached:list.filter(r=>r.bossReached).length,meanPlanes:avg('planes'),lateWaves:avg('lateWaves'),gold:avg('gold'),fragments:avg('fragments'),loot:avg('loot'),hybridPicks:avg('hybridPicks'),timeouts:avg('timeouts')};
}
const builds=[];for(const strategy of Object.keys(definitions))for(const level of [1,20,80,200])builds.push({strategy,level,...summarize(rows.filter(r=>r.matrix==='builds'&&r.strategy===strategy&&r.level===level&&r.ratio===1))});
const gear=[];for(const ratio of [.5,1,1.5])for(const level of [1,20,80,200])gear.push({ratio,level,...summarize(rows.filter(r=>r.matrix==='builds'&&r.ratio===ratio&&r.level===level))});
const rarity=[];for(const quality of ['Common','Rare','Epic'])for(const level of [20,80,200])rarity.push({rarity:quality,level,...summarize(rows.filter(r=>r.matrix==='rarity'&&r.rarity===quality&&r.level===level))});
const result={engine:'Original index.html updateFight, native drops/Forge/Merchant; no prototype tick; memory fixtures only',node:process.version,
 sourceHtmlSha256:crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),cases:rows.length,campaignRuns:campaigns.length*24,
 timeouts:rows.reduce((n,r)=>n+r.timeouts,0),definitions,builds,gear,rarity,rows,campaigns};
fs.writeFileSync(process.argv[2]||'/tmp/v012-final-validation-metrics.json',JSON.stringify(result)+'\n');
console.log(JSON.stringify({cases:result.cases,campaignRuns:result.campaignRuns,timeouts:result.timeouts,gear,rarity,builds},null,2));
