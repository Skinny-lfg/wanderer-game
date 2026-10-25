'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const runtime=read('combat/v012-combat-runtime.js'),stats=read('combat/v012-gear-stats.js'),economy=read('economy/v012-equipment-runtime.js');
const checks=[
 ['dual actual secondary attack',/weaponAttack\(r,true\)/.test(runtime)&&/offhandStrike\)damage=Math\.max\(1,Math\.round\(damage\*\.5\)\)/.test(runtime)],
 ['dual secondary hit gated on main strike',/!offhandStrike&&weapon\?\.subtype==='Daggers'/.test(runtime)],
 ['orb grants 30% matching magic affinity',/off\.magic===element\)damage=Math\.round\(damage\*1\.30\)/.test(runtime)],
 ['orb periodic barrier',/wandOrbBarrier',6/.test(runtime)],
 ['orb spell power multiplier',/subtype==='Orb'&&item\.orbSpellB4!==true\?Math\.round\(value\*1\.12\)/.test(stats)],
 ['shield base counter cooldown',/shieldBaseCounter',2\.5/.test(runtime)],
 ['shield counter sword 65%',/subtype==='Sword'\?\.65:\.45/.test(runtime)],
 ['shield block cap 48 baseline',/off\?\.subtype==='Shield'\?Math\.min\(48/.test(stats)],
 ['twohand offhand suppressed',/isTwoHanded\(equipment\.weapon\)/.test(stats)],
 ['dagger selectable in either slot',/\['weapon','offhand'\]\.includes\(target\)/.test(economy)]
];
for(const [name,pass] of checks)console.log('E31_ASSERT '+JSON.stringify({name,pass}));
if(checks.some(x=>!x[1]))process.exitCode=1;
const run=cp.spawnSync(process.execPath,[path.join(__dirname,'v012-phase-e3-combat-diagnostic.cjs'),process.argv[2]||'/tmp/e31-combat.json'],{encoding:'utf8',maxBuffer:1024*1024*10});
if(run.status!==0){process.stderr.write(run.stderr||run.stdout);process.exit(run.status||1);}
for(const line of run.stdout.split('\n'))if(line.includes('E3_COMBAT '))console.log(line.replace('E3_COMBAT','E31_COMBAT'));
console.log('E31_CHECKS '+JSON.stringify({pass:checks.filter(x=>x[1]).length,total:checks.length,combat:'240 native paired-seed runs'}));
