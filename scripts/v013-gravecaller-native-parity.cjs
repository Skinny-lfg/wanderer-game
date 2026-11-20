'use strict';
// Native Gravecaller seeded outcome parity for pre/post cosmetic rename.
// Run twice with --root=<old checkout> and --root=<candidate checkout>.
const fs=require('node:fs'),path=require('node:path');
const opts=Object.fromEntries(process.argv.slice(2).map(s=>{const m=/^--([^=]+)=(.+)$/.exec(s);if(!m)throw Error('Expected --root, --out');return [m[1],m[2]];}));
if(!opts.root||!opts.out)throw Error('Missing --root and --out');
const S=require(path.resolve(opts.root,'scripts/v013-elite-tank-parity.cjs'));
const rows=[];
for(let seed=16001;seed<16601&&rows.length<6;seed++){
 const inspect=S.scenario(seed,'elite','starter',{inspectOnly:true});
 if(inspect.initial.eliteType!=='gravecaller')continue;
 const fight=S.scenario(seed,'elite','starter',{targetPolicy:'mechanics',tickLimit:1800});
 const keys=['won','died','timedOut','seconds','hpStart','hpEnd','damageTaken','damageDealt','enemyAbilityCasts','eliteSummons','deathboundApplications','deathboundTicks','deathboundDamage','targetSwitches','minionFocusSwitches','minionFocusSeconds'];
 const metrics=Object.fromEntries(keys.map(k=>[k,fight[k]??null]));
 rows.push({seed,family:fight.family,initial:{hp:fight.initial.hp,atk:fight.initial.atk,def:fight.initial.def,playerHp:fight.initial.playerHp},metrics});
}
if(rows.length!==6)throw Error('Not enough native Gravecaller matched seeds: '+rows.length);
fs.mkdirSync(path.dirname(opts.out),{recursive:true});
fs.writeFileSync(opts.out,JSON.stringify(rows,null,2)+'\n');
console.log('GRAVECALLER_PARITY='+JSON.stringify({root:opts.root,matched:rows.length,seeds:rows.map(x=>x.seed)}));
