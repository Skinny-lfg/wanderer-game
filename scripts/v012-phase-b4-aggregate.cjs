const fs=require('node:fs'),path=require('node:path'),{builds}=require('./v012-phase-b3-sim.cjs');
const baseline=process.argv[2]||'/tmp/v012-phase-b3-chunks',current=process.argv[3]||'/tmp/v012-phase-b4-chunks',out=process.argv[4]||'/tmp/v012-phase-b4-results.json';
const groups=[],byBuild=[],byLevel=[];let cases=0,mismatches=0,errors=0,timeouts=0;
for(const E of [50,100,200])for(let bi=0;bi<builds.length;bi++)for(const policy of ['triple','random'])for(let pi=0;pi<builds[bi].profiles.length;pi++){
 const file=path.join(current,`${E}-${bi}-${policy}-${pi}.json`),row=JSON.parse(fs.readFileSync(file,'utf8'));
 if(row.seedCount!==64||row.E!==E||row.build!==builds[bi].name||row.policy!==policy||row.profile!==builds[bi].profiles[pi].join('/'))throw Error('Invalid B.4 chunk '+file);
 const refMode=['wand','sword','daggers'].includes(builds[bi].variant)?'candidate':'control';if(row.reference!==refMode)throw Error('Wrong B.3 reference '+file);
 const old=JSON.parse(fs.readFileSync(path.join(baseline,`${E}-${bi}-${policy}-${pi}-control.json`),'utf8')).rows;
 if(old.length!==64)throw Error('Invalid B.3 control');
 row.b3Control={wins:old.filter(r=>r.win).length,realm:+(old.reduce((n,r)=>n+r.realm,0)/64).toFixed(2),dps:+(old.reduce((n,r)=>n+r.dps,0)/64).toFixed(2)};
 row.expectedReference=refMode;cases+=64;mismatches+=row.mismatches.length;errors+=row.errors;timeouts+=row.timeouts;groups.push(row);
}
for(const build of builds){const a=groups.filter(r=>r.build===build.name),mean=key=>+(a.reduce((n,r)=>n+r[key],0)/a.length).toFixed(2);byBuild.push({build:build.name,n:a.length*64,b3ControlWins:a.reduce((n,r)=>n+r.b3Control.wins,0),b4Wins:a.reduce((n,r)=>n+r.wins,0),b3ControlRealm:+(a.reduce((n,r)=>n+r.b3Control.realm,0)/a.length).toFixed(2),b4Realm:mean('realm'),b3ControlDps:+(a.reduce((n,r)=>n+r.b3Control.dps,0)/a.length).toFixed(2),b4Dps:mean('dps'),mismatches:a.reduce((n,r)=>n+r.mismatches.length,0)});}
for(const E of [50,100,200])for(const build of builds){const a=groups.filter(r=>r.E===E&&r.build===build.name),mean=key=>(a.reduce((n,r)=>n+r[key],0)/a.length).toFixed(2);byLevel.push({E,build:build.name,n:a.length*64,b3ControlWins:a.reduce((n,r)=>n+r.b3Control.wins,0),b4Wins:a.reduce((n,r)=>n+r.wins,0),b3ControlRealm:(a.reduce((n,r)=>n+r.b3Control.realm,0)/a.length).toFixed(2),b4Realm:mean('realm'),b3ControlDps:(a.reduce((n,r)=>n+r.b3Control.dps,0)/a.length).toFixed(2),b4Dps:mean('dps'),b4BarrierPerSecond:mean('barrierPerSecond')});}
const result={baseCommit:'952c048',cases,groups:groups.length,mismatches,errors,timeouts,byBuild,byLevel};fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({cases,groups:groups.length,mismatches,errors,timeouts})+'\n');if(mismatches||errors||timeouts)process.exitCode=1;
