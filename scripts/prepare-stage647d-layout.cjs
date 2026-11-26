'use strict';
// Stage 6.47D: visual-only standalone atlas, based on real live graph.
// No changes to the production graph, saves, talent allocator or combat.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const PLAN={
 blood:[['cleave_mastery'],['accelerated_bleeding','Accelerated Bleeding','bleeding_edge','Trade duration for faster Bleed ticks; fixed total damage. Proposal only.'],['blood_reservoir','Blood Reservoir','sanguine_fury','Reserved for redesign: avoid reinforcing Blood/Radiance and Carrion. Proposal only.']],
 fury:[['single_target_mastery'],['fan_of_blades'],['bow_pierce']],
 radiance:[['vital_pulse','Vital Pulse','affinity_radiance','Periodic bounded HP-scaling AoE. No recursive statuses.'],['living_force','Living Force','second_breath','Effective healing conversion; alternative to Vital Strike.'],['grasping_roots','Grasping Roots','life_bloom','Limited periodic damage and attack-speed control.']],
 aegis:[['ward_echo','Ward Echo','affinity_aegis','Small periodic damage while Barrier exists; not another Stored Force or uncapped Barrier multiplier.'],['sword_sweep'],['mace_shockwave']],
 arcane:[['arcane_nova','Arcane Nova','element_choice','Arcane-mode Infusion hits two secondary enemies; alternative to Grave Bloom.'],['elemental_resonance','Elemental Resonance','arcane_echo','Frost-specific candidate, not a blanket Fire/Lightning buff.'],['mana_convergence','Mana Convergence','mana_spring','Conditional Arcane/Frost mana tool, pending telemetry.']],
 decay:[['contagious_touch','Contagious Touch','affinity_decay','Limited spread from primary paid Rot applications; never spread recursively.'],['corruption_nova','Corruption Nova','toxic_touch','Single global bounded Rot pulse; alternative to mixed AoE.'],['soul_drain','Soul Drain','wither','Conditional return from native paid Rot; pending mana telemetry.']]
};
// Six-fold rotationally repeated geometry; two intermediate tracks and one
// later track. Radial enlargement of the original atlas creates space, without
// changing the prerequisites of a single real talent.
const SLOTS=[{angle:-13,start:650,step:45},{angle:13,start:650,step:45},{angle:4,start:1090,step:65}];
function once(s,a,b){assert.equal(s.split(a).length,2,'Missing/ambiguous source anchor: '+a.slice(0,100));return s.replace(a,b);}
function build(){
 let js=read('preview/talent-rebuild/prototype.js');
 js=once(js,'graph=G.createGraph(WandererV012Buildcraft.CATALOG,WandererTalentCatalog.NODES),','originalGraph=G.createGraph(WandererV012Buildcraft.CATALOG,WandererTalentCatalog.NODES),');
 js=once(js,'families=G.FAMILIES,byId=new Map(graph.map(n=>[n.id,n]));',
 'families=G.FAMILIES;\nconst PLAN='+JSON.stringify(PLAN)+',SLOTS='+JSON.stringify(SLOTS)+';\nconst graph=[...originalGraph],forkSlot=new Map();\n'+
 "for(const family of families)PLAN[family].forEach(([id,name,parent,description],slot)=>{forkSlot.set(id,slot);if(!name)return;const prefix='proposal_'+id;graph.push({id:prefix+'_1',kind:'stat',family,requires:parent,name:'Proposed stat path',description:'Visual placeholder only',weaponFork:prefix,proposal:true},{id:prefix+'_2',kind:'stat',family,requires:prefix+'_1',name:'Proposed stat path',description:'Visual placeholder only',weaponFork:prefix,proposal:true},{id:'gate_'+prefix,kind:'stat',family,requires:prefix+'_2',name:'Proposed stat gate',description:'Visual placeholder only',gateFor:prefix,proposal:true},{id:prefix,kind:'weapon',family,requires:'gate_'+prefix,name,description:'DESIGN CANDIDATE — '+description,weaponFork:prefix,proposal:true,maxRank:1});forkSlot.set(prefix,slot);});\nconst byId=new Map(graph.map(n=>[n.id,n]));");
 const a=js.indexOf(' if(n.weaponFork){'),b=js.indexOf(' if(n.outerStep)',a);assert(a>=0&&b>a);
 js=js.slice(0,a)+" if(n.weaponFork){const slot=SLOTS[forkSlot.get(n.weaponFork)];if(!slot)throw Error('Missing fork slot '+n.id);a+=slot.angle*Math.PI/180;r=slot.start+slot.step*(n.kind==='weapon'?3:n.id.endsWith('_1')?0:1);positions[n.id]=polar(a,r);continue;}\n"+js.slice(b);
 // scale original layout, then place fork gates on the exact third track coordinate
 const g0=js.indexOf('for(const n of graph.filter(n=>n.gateFor))'),g1=js.indexOf('const el=',g0);
 assert(g0>=0&&g1>g0);
 js=js.slice(0,g0)+js.slice(g0,g1).replace('const skill=byId.get(n.gateFor),p=',"const skill=byId.get(n.gateFor);if(skill.weaponFork){const slot=SLOTS[forkSlot.get(skill.weaponFork)];positions[n.id]=polar(angle(skill.family)+slot.angle*Math.PI/180,slot.start+slot.step*2);continue;}const p=")+
 "for(const n of graph){if(n.weaponFork||n.gateFor&&byId.get(n.gateFor)?.weaponFork)continue;positions[n.id].x*=1.25;positions[n.id].y*=1.25;}\n"+js.slice(g1);
 return js;
}
function main(){
 let js=build();
 js=once(js,"const q=positions[dep],data={'data-from':dep,'data-to':n.id};","const q=positions[dep],data={'data-from':dep,'data-to':n.id,...(n.proposal?{class:'proposal-link'}:{})};");
 js=once(js,"class:'node','data-id':n.id","class:'node'+(n.proposal?' proposal':'')+(n.weaponFork&&n.kind==='weapon'?' specialization':''),'data-id':n.id");
 js=once(js,"let selected=null;const api=window.parent!==window?window.parent.WandererTreeAPI:null;","let selected=null;const api=null; // intentionally read-only, including when embedded in game preview");
 js=once(js,"document.querySelector('#families').querySelectorAll('button')[4].click();","// Open at full tree, not zoomed into Magic.");
 js=once(js,"Math.max(3800,3800*(viewport.clientHeight>0?viewport.clientWidth/viewport.clientHeight:1))","Math.max(3300,3300*(viewport.clientHeight>0?viewport.clientWidth/viewport.clientHeight:1))");
 js=once(js,"centre(p.x,p.y,(f==='arcane'||f==='radiance')?1850:1150)","centre(p.x,p.y,Math.max(1500,1500*viewport.clientWidth/Math.max(1,viewport.clientHeight)))");
 js=once(js,"const p=polar(angle(f),720);","const p=polar(angle(f),870);");
 js=once(js,"document.querySelector('#description').textContent='Invest in the ✺ node to choose an element. Switching refunds points spent on element-specific skills.';","document.querySelector('#description').textContent='Stage 6.47D • 367 existing nodes + 48 proposal placeholders. Gold dashed nodes are design candidates only. Select a node to inspect its route; no game progress can be changed.';");
 // expose geometry evidence, distinguish hidden alternate elemental modes
 js+="\nwindow.__layout647D={graph,positions,plan:PLAN,slots:SLOTS};\n";
 const html=read('preview/talent-rebuild/index.html');
 const css="<style>.node.proposal circle{stroke:#e6be71!important;stroke-dasharray:5 3;fill:#32271d}.node.proposal.specialization circle{stroke-width:3}.node.specialization:not(.proposal) circle{stroke-width:3;fill:#292426}.proposal-link{stroke:#d6a75d;stroke-dasharray:6 5;opacity:.85}#proposalLegend{font-size:12px;color:#d8b981;white-space:nowrap}header h1{font-size:16px}</style>";
 let result=once(html,'</head>',css+'</head>').replace('WANDERER · TALENT ATLAS','WANDERER · TALENT ATLAS — 6.47D').replace('<div class="controls" id="families"></div>','<span id="proposalLegend">Dashed gold = proposed · read-only</span><div class="controls" id="families"></div>').replace('VISUAL PROTOTYPE · NO POINTS SPENT','LAYOUT STUDY · NO GAMEPLAY CHANGES');
 const out=path.resolve(process.argv[2]||'reports/stage647d-layout');fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'prototype.js'),js);fs.writeFileSync(path.join(out,'index.html'),result);
 // Self-contained file for user to open directly in any browser.
 const iconMap={};for(const family of Object.keys(PLAN)){const file=path.join(ROOT,'assets/affinities/families',family+'.png');iconMap[family]='data:image/png;base64,'+fs.readFileSync(file).toString('base64');}
 const inline=js.replace('href:'+String.fromCharCode(96)+'../../assets/affinities/families/'+String.fromCharCode(36)+'{n.family}.png'+String.fromCharCode(96),'href:('+JSON.stringify(iconMap)+')[n.family]');
 for(const file of ['v012-buildcraft.js','talent-catalog.js','talent-graph-next.js','talent-requirements.js'])result=once(result,'<script src="../../combat/'+file+'"></script>','<script>'+read('combat/'+file).replace(/<\/script/gi,'<\\/script')+'</script>');
 result=once(result,'<script src="prototype.js"></script>','<script>'+inline.replace(/<\/script/gi,'<\\/script')+'</script>');
 fs.writeFileSync(path.join(out,'talent-tree-647d-interactive.html'),result);
 console.log('Stage 6.47D layout files: '+out);
}
if(require.main===module)main();
module.exports={PLAN,SLOTS,build};
