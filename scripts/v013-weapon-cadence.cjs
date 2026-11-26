// Controlled, RAM-only encounters using the integrated expedition engine.
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const create = require('../tests/v012-economy-harness.cjs');
const T = globalThis.WandererAutomaticTalents;
const weapons = ['Sword', 'Mace', 'Bow', 'Daggers', 'Two-Handed', 'Staff', 'Wand'];
const stages = [
  {tier:1, rarity:'Common', sparse:true, points:0},
  {tier:3, rarity:'Rare', sparse:true, points:0},
  {tier:25, rarity:'Rare', points:15},
  {tier:100, rarity:'Epic', points:40},
  {tier:200, rarity:'Epic', points:80}
];
const encounters = {
  single:{count:1}, patrol:{count:3}, horde:{count:20},
  elite:{elite:true}, boss:{boss:true}
};
const baseline = process.argv.includes('--baseline');
const overrides = {};
if (baseline) {
  for (const file of ['combat/v012-gear-stats.js','combat/v012-combat-runtime.js','online/v012-expedition-runtime.js']) {
    overrides[file] = execFileSync('git',['show','4f76660:'+file],{encoding:'utf8'});
  }
}
function measure(stage, weapon, encounter, seed) {
  const a = create(seed, undefined, overrides, {measure:true});
  const magic = ['Staff','Wand'].includes(weapon);
  const agile = ['Bow','Daggers'].includes(weapon);
  a.setup(stage.tier, weapon, stage.rarity);
  for (const slot of ['helm','armor','gloves','belt','boots']) {
    a.state().equip[slot] = a.makeItem(stage.tier,slot,null,'loot',magic?'Cloth':agile?'Leather':'Plate',stage.sparse?'Common':stage.rarity);
  }
  if (stage.sparse) {
    for (const slot of ['gloves','belt','boots','amulet','ring1','ring2']) a.state().equip[slot]=null;
  }
  let progress = {...T.create(), xp:Math.max(0,stage.points-2)*100, starterPoints:2};
  const goals = magic?['affinity_arcane','passive_arcane_focus','passive_mana_spring','passive_barrier_pulse']:
    agile?['affinity_fury','passive_quick_hands','passive_precision','passive_adrenaline']:
    ['affinity_fury','passive_quick_hands','passive_brutal_crit','passive_barrier_pulse'];
  for (const id of goals) {
    for (const node of T.path(progress,id)||[]) {
      if (!progress.nodes.includes(node)) {
        const next = T.allocate(progress,node);
        if (!next) break;
        progress = next;
      }
    }
  }
  a.state().automaticTalents = progress;
  a.setUnlocked(stage.tier);
  a.start(stage.tier,true);
  a.select(a.controller().state.offers.find(p=>p.mobCount).id);
  a.enter();
  const r = a.encounter(encounter);
  const mobs = [...(r.enemies||[r.enemy]),...(r.groupReserve||[])];
  const enemyHp = mobs.reduce((n,e)=>n+e.maxhp,0);
  let ticks=0, firstKill=null;
  while (r.status==='fight' && r.hp>0 && ticks<2000) {
    a.tick();
    ticks++;
    if (firstKill===null && mobs.some(e=>e.hp<=0)) firstKill=ticks*.11;
  }
  return {speed:r.stats.attacksPerSec, seconds:ticks*.11, firstKill,
    win:r.hp>0 && mobs.every(e=>e.hp<=0), timeout:ticks>=2000,
    attacks:a.measured.attacks, incoming:a.measured.incoming,
    hpLeft:Math.max(0,r.hp)/r.maxhp, enemyHp};
}
const rows=[];
for (const stage of stages) for (const weapon of weapons) for (const [name,encounter] of Object.entries(encounters)) {
  const samples=[431,432,433].map(seed=>measure(stage,weapon,encounter,seed));
  const mean=key=>Math.round(samples.reduce((n,s)=>n+(s[key]||0),0)/samples.length*100)/100;
  rows.push({tier:stage.tier,weapon,encounter:name,interval:Math.round(100/mean('speed'))/100,
    seconds:mean('seconds'),firstKill:mean('firstKill'),wins:samples.filter(s=>s.win).length,
    incoming:mean('incoming'),hpLeft:mean('hpLeft'),enemyHp:mean('enemyHp'),
    timeouts:samples.filter(s=>s.timeout).length});
}
const output=process.argv.find(x=>x.endsWith('.json'));
if (output) fs.writeFileSync(output,JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify(rows.filter(r=>r.tier===3||r.encounter==='single')));
