// Structural draft distribution only; gameplay outcomes come from the native combat matrix.
const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');const {api:B,build,base}=require('../tests/v012-affinity-fixture.cjs');
const scope={};vm.runInNewContext(cp.execFileSync('git',['show','02feebb:combat/v012-buildcraft.js'],{encoding:'utf8'}),scope);const old=scope.WandererV012Buildcraft;
const rng=s=>()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
function compare(A){const m={drafts:0,cards:0,usefulUpgrades:0,synergyCards:0,functionalSynergy:0,untriggered:0,overcap:0,pity:0,hybridBy10:0,hybridBy14:0,errors:0,distinctResults:0};const results=new Set();
 for(let seed=1;seed<=1000;seed++){
  const families=[['blood','decay','magic'],['vitality','aegis','fury'],['blood','aegis','magic']][seed%3],b=A.create();b.families=families;b.element=families.includes('magic')?['fire','frost','lightning'][seed%3]:null;
  for(const family of families)A.initial(b,family);b.runtime.hybridRules=true;b.runtime.draftStats=base;const random=rng(seed);let earliest=99;
  for(let realm=1;realm<15;realm++){b.realmIndex=realm;b.runtime.hybridWindow=[6,8,10].includes(realm);let cards;try{cards=A.options(b,families[realm%3],random);}catch{m.errors++;break;}
   m.drafts++;m.cards+=cards.length;if(cards.some(p=>p.requires.length))earliest=Math.min(earliest,realm);
   for(const p of cards){const current=B.CATALOG.find(x=>x.id===p.id),useful=B.preview(b,p.id,base).useful,owned=B.ownedRank(b,p.id);if(owned&&useful)m.usefulUpgrades++;if(!B.functional(b,current))m.untriggered++;if(owned>=current.max)m.overcap++;if(p.category==='Synergy'){m.synergyCards++;if(B.functional(b,current))m.functionalSynergy++;}if(p.pity)m.pity++;}
   A.choose(b,families[realm%3],cards[Math.floor(random()*cards.length)].id,cards);
  }
  if(earliest<=10)m.hybridBy10++;if(earliest<=14)m.hybridBy14++;results.add([...b.picks].sort().join(':'));
 }
 m.distinctResults=results.size;m.usefulUpgradePct=+(100*m.usefulUpgrades/m.cards).toFixed(2);m.functionalSynergyPct=m.synergyCards?+(100*m.functionalSynergy/m.synergyCards).toFixed(2):null;return m;
}
const result={baselineCommit:'02feebb',seeds:1000,policy:'Matched deterministic seeds, three early unlocked families; identical raw gear stats; all normal drafts through Realm14; random legal selections. Structural offers only, not win-rate simulation.',before:compare(old),after:compare(B)};
fs.writeFileSync(process.argv[2]||'/tmp/v012-affinity-draft-results.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
