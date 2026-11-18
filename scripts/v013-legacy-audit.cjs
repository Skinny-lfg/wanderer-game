'use strict';
// Compare historical npm-test TAP failures by TEST NAME, never swallow npm test's exit status.
// Stage 4.5.3: the v0.12 suite is still red; this inventory is an additional
// regression signal, not a release gate and not proof that a failing test is safe.
const fs=require('node:fs'),path=require('node:path');
function failedNames(tap){
 if(typeof tap!=='string')throw TypeError('TAP output must be text');
 return [...tap.matchAll(/^not ok \d+ - (.+)$/gm)].map(m=>m[1]);
}
function analyze(tap,baseline){
 if(!baseline||!Array.isArray(baseline.items))throw Error('Invalid historical baseline');
 const now=failedNames(tap),before=baseline.items.map(x=>x.name);
 if(now.length!==new Set(now).size||before.length!==new Set(before).size)throw Error('Duplicate test names: cannot compare safely');
 const oldSet=new Set(before),currentSet=new Set(now);
 return {currentFailures:now.length,baselineFailures:before.length,
  newFailures:now.filter(name=>!oldSet.has(name)),
  resolvedFailures:before.filter(name=>!currentSet.has(name))};
}
function cli([tapPath,baselinePath=path.join(__dirname,'../reports/v013-stage45-3-general-suite-baseline.json')]){
 if(!tapPath){process.stderr.write('Usage: node scripts/v013-legacy-audit.cjs <npm-test-output.tap> [baseline.json]\n');return 2;}
 const result=analyze(fs.readFileSync(tapPath,'utf8'),JSON.parse(fs.readFileSync(baselinePath,'utf8')));
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
 // This can detect NEW failures; it does not declare the legacy suite green.
 return result.newFailures.length?1:0;
}
if(require.main===module)process.exitCode=cli(process.argv.slice(2));
module.exports={failedNames,analyze,cli};
