// Equal seeded Rare equipment: only affinity placement changes. No live saves or services.
const fs=require('node:fs'),{execFileSync}=require('node:child_process'),harness=require('../tests/combat-harness.cjs');
const engines={before:harness(execFileSync('git',['show','735830e:index.html'],{encoding:'utf8',maxBuffer:10*1024*1024})),after:harness()};
const rows=[];
for(const [version,engine]of Object.entries(engines))for(const level of [10,20,30,40,50])for(const weapon of ['Sword','Mace','Two-Handed','Daggers','Staff','Wand'])for(const affinity of ['poison','bleed','sunder','crit','shield','regen','burn','slow','drain'])for(const hybrid of [false,true]){
 let wins=0,seconds=0,hp=0,bossSeconds=0,bosses=0,signatures=0;
 for(let seed=1;seed<=10;seed++){const r=engine.simulate({level,weapon,affinity,hybrid,seed});wins+=r.won?1:0;seconds+=r.seconds;hp+=r.hp;if(r.durations.length===3){bosses++;bossSeconds+=r.durations[2];}signatures+=r.events.filter(x=>/Venom Burst|Blood Hunt:|Armor Shatter:|Perfect Strike:|Last Bastion:|Second Wind:|Flashover:|Deep Freeze:|Soul Pact:/.test(x)).length;}
 rows.push({version,level,weapon,affinity,build:hybrid?'3+2':'5',trials:10,wins,meanSeconds:+(seconds/10).toFixed(2),meanHP:+(hp/10).toFixed(1),bosses,meanBossSeconds:bosses?+(bossSeconds/bosses).toFixed(2):null,signatures});
}
fs.writeFileSync('docs/v09-phase1-simulation.json',JSON.stringify({baseline:'735830e',gear:'Rare, dungeon tier × 0.8; same seeded stats for both affinity layouts',hybrid:'3 primary + 2 Critical (Critical primary uses 2 Regen)',rows},null,2)+'\n');
for(const version of ['before','after'])for(const build of ['5','3+2']){const selected=rows.filter(r=>r.version===version&&r.build===build);console.log(version,build,'wins',selected.reduce((s,r)=>s+r.wins,0),'/',selected.length*10,'mean seconds',+(selected.reduce((s,r)=>s+r.meanSeconds,0)/selected.length).toFixed(2),'signatures',selected.reduce((s,r)=>s+r.signatures,0));}
