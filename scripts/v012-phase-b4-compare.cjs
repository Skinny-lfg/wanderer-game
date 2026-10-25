// Compare native B.4 production with the paired B.3 candidate/control rows.
const fs=require('node:fs'),path=require('node:path'),{run}=require('./v012-affinity-combat-sim.cjs'),{builds,seedFor}=require('./v012-phase-b3-sim.cjs');
const [EText,biText,policy,piText,baselineDir,out]=process.argv.slice(2),E=Number(EText),bi=Number(biText),pi=Number(piText),build=builds[bi];
if(![50,100,200].includes(E)||!build||!build.profiles[pi]||!['triple','random'].includes(policy))throw Error('Invalid B.4 chunk');
const mode=['wand','sword','daggers'].includes(build.variant)?'candidate':'control';
const reference=JSON.parse(fs.readFileSync(path.join(baselineDir,`${E}-${bi}-${policy}-${pi}-${mode}.json`),'utf8')).rows;
if(reference.length!==64)throw Error('Incomplete B.3 reference');
const fields=['win','reached','dps','hp','maxhp','damageReceived','healPerSecond','barrierPerSecond','weaponAttacks','seconds','bossReached','routes','allPicks','error','timeout'];
const baselineKey={reached:'realm',hp:'hpRemaining',allPicks:'passives'};
const mismatches=[],rows=[];
for(let rep=0;rep<64;rep++){
 const target=build.profiles[pi],seed=seedFor(E,bi,policy,rep),result=run({E,weapon:build.weapon,armorType:build.armorType,offhandType:build.offhandType,buildName:build.name,rarity:'Epic',family:target[0],targetFamilies:target,strategy:policy,runes:true,seed,controlSeed:seed});
 const expected=reference[rep];if(expected.seed!==seed||expected.rep!==rep)throw Error('B.3 seed mismatch');
 const differences=fields.filter(field=>JSON.stringify(result[field])!==JSON.stringify(expected[baselineKey[field]||field]));
 if(differences.length)mismatches.push({rep,seed,fields:differences,expected:{win:expected.win,realm:expected.realm,dps:expected.dps},actual:{win:result.win,realm:result.reached,dps:result.dps}});
 rows.push({win:result.win,realm:result.reached,dps:result.dps,hp:result.hp,damageReceived:result.damageReceived,barrierPerSecond:result.barrierPerSecond,error:result.error,timeout:result.timeout});
}
const mean=key=>+(rows.reduce((n,r)=>n+r[key],0)/64).toFixed(2);
const summary={E,build:build.name,policy,profile:build.profiles[pi].join('/'),reference:mode,seedCount:64,wins:rows.filter(r=>r.win).length,realm:mean('realm'),dps:mean('dps'),hp:mean('hp'),damageReceived:mean('damageReceived'),barrierPerSecond:mean('barrierPerSecond'),mismatches,errors:rows.filter(r=>r.error).length,timeouts:rows.filter(r=>r.timeout).length};
fs.writeFileSync(out,JSON.stringify(summary)+'\n');process.stdout.write(JSON.stringify({E,bi,policy,pi,reference:mode,mismatches:mismatches.length,errors:summary.errors,timeouts:summary.timeouts})+'\n');
if(mismatches.length||summary.errors||summary.timeouts)process.exitCode=1;
