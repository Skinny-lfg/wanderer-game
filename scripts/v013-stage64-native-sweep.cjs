'use strict';
// CI-only Stage 6.4 tuning: changes only detached temporary Git worktrees.
// The game branch contains exactly one candidate, no runtime tuning switches.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const variants=Object.freeze([
 {id:'low-mana',mana:10,arcaneMana:8,physical:.85,wand:.35,staff:.95,arcaneBonus:.10},
 {id:'high-mana',mana:16,arcaneMana:14,physical:.85,wand:.35,staff:.95,arcaneBonus:.10},
 {id:'prior-weapon',mana:12,arcaneMana:10,physical:.85,wand:.45,staff:.80,arcaneBonus:.10}
]);
const chosen=Object.freeze({id:'stage64-default',mana:12,arcaneMana:10,physical:.85,wand:.35,staff:.95,arcaneBonus:.10});
function patch(file,config){
 let s=fs.readFileSync(file,'utf8');
 const originalCost='const INFUSION_RULE=Object.freeze({duration:7,cooldown:6,charges:2,cost:12,arcaneCost:10});';
 const originalPower='const INFUSION_POWER=Object.freeze({physical:.85,Wand:.35,Staff:.95,arcaneBonus:.10});';
 if(s.split(originalCost).length!==2||s.split(originalPower).length!==2)throw Error('Stage 6.4 production tuning source changed unexpectedly');
 s=s.replace(originalCost,'const INFUSION_RULE=Object.freeze({duration:7,cooldown:6,charges:2,cost:'+config.mana+',arcaneCost:'+config.arcaneMana+'});')
 .replace(originalPower,'const INFUSION_POWER=Object.freeze({physical:'+config.physical+',Wand:'+config.wand+',Staff:'+config.staff+',arcaneBonus:'+config.arcaneBonus+'});');
 fs.writeFileSync(file,s);return s;
}
function metrics(report){
 const select=(level,encounter,mode,weapon)=>report.groups.find(g=>g.level===level&&g.encounter===encounter&&g.mode===mode&&g.weapon===weapon);
 const out=[];
 for(const level of [5,35])for(const encounter of ['group-3','group-10','boss-aegis','boss-decay']){
  const names=['Sword','Wand','Staff'];
  for(const weapon of names){
   const g=select(level,encounter,'arcane',weapon);if(!g)continue;
   out.push({level,encounter,weapon,wins:g.wins,n:g.n,dps:g.dps,manaSpent:g.manaSpent,fallbacks:g.fallbacks,
    hpEnd:g.hpEnd,infusionHits:g.infusionHits});
  }
 }
 return out;
}
function run(){
 const cwd=process.cwd(),tmp=process.env.RUNNER_TEMP||path.join(cwd,'reports','.stage64-temp'),
  root=path.join(tmp,'stage64-trials');fs.mkdirSync(root,{recursive:true});
 const reports=[{...chosen,report:JSON.parse(fs.readFileSync('reports/stage64-native-after.json','utf8'))}];
 for(const variant of variants){
  const worktree=path.join(root,variant.id);
  cp.execFileSync('git',['worktree','add','--detach',worktree,'HEAD'],{cwd,stdio:'pipe'});
  try{
   const nodeModules=path.join(cwd,'node_modules');
   if(fs.existsSync(nodeModules))fs.symlinkSync(nodeModules,path.join(worktree,'node_modules'),'dir');
   const a=patch(path.join(worktree,'combat','v012-buildcraft.js'),variant);
   const b=patch(path.join(worktree,'docs','combat','v012-buildcraft.js'),variant);
   if(a!==b)throw Error('Game/Pages tuning mirror drift');
   const out=path.join(cwd,'reports','stage64-native-'+variant.id+'.json');
   const proc=cp.spawnSync(process.execPath,[path.join(cwd,'scripts/v013-stage64-native-magic-matrix.cjs')],{
    cwd,env:{...process.env,STAGE64_NATIVE_ROOT:worktree,STAGE64_REPORT_FILE:out},
    maxBuffer:4*1024*1024,encoding:'utf8'});
   if(proc.status!==0)throw Error('Native '+variant.id+' failed: '+(proc.stderr||'')+'\n'+(proc.stdout||'').slice(-5000));
   const report=JSON.parse(fs.readFileSync(out,'utf8'));if(!report.success)throw Error('Invalid native matrix '+variant.id);
   const base=reports[0].report;
   if(report.rows.length!==base.rows.length)throw Error('Candidate row count mismatch');
   const keys=new Map(base.rows.map(r=>[r.key,r]));
   for(const row of report.rows){const old=keys.get(row.key);if(!old)throw Error('Missing fixture '+row.key);
    for(const attr of ['gearFingerprint','rosterHash','hpMax','mpMax','mpStart','realm','risk','pointsSpent'])
     if(row[attr]!==old[attr])throw Error('Candidate fixture mismatch '+attr+' '+row.key);
   }
   reports.push({...variant,report});
   console.log('STAGE64_SWEEP_VARIANT='+JSON.stringify({id:variant.id,cases:report.rows.length,arcaneE35:metrics(report).filter(x=>x.level===35&&x.encounter==='group-10')}));
  }finally{
   cp.execFileSync('git',['worktree','remove','--force',worktree],{cwd,stdio:'pipe'});
  }
 }
 const summary={stage:'6.4',kind:'isolated-temporary-worktree-native-sweep',
  variants:reports.map(({report,...config})=>({config,cases:report.rows.length,
   rows:metrics(report)})),
  note:'Trial variants are only in discarded detached worktrees; the shipped branch keeps stage64-default. These short controlled scenarios do not approve final balance.'};
 fs.writeFileSync('reports/stage64-native-tuning-sweep.json',JSON.stringify(summary,null,2)+'\n');
 console.log('STAGE64_SWEEP='+JSON.stringify({success:true,variants:summary.variants.map(x=>({id:x.config.id,config:x.config,arcaneE35Group10:x.rows.filter(z=>z.level===35&&z.encounter==='group-10')}))}));
 return summary;
}
if(require.main===module)run();
module.exports={variants,chosen,patch,metrics,run};
