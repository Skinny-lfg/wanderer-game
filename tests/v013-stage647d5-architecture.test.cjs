'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {T,buy}=require('./v013-current-talent-helper.cjs');
require('../combat/talent-requirements.js');
const G=WandererTalentGraph,R=WandererTalentRequirements,graph=T.NODES,byId=new Map(graph.map(n=>[n.id,n]));
const normal={blood:['accelerated_bleeding','cleave_mastery','sanguine_reserve'],fury:['fan_of_blades','bow_pierce','single_target_mastery'],vitality:['vital_pulse','living_force','grasping_roots'],aegis:['ward_echo','sword_sweep','mace_shockwave'],decay:['contagious_touch','corruption_nova','soul_drain']};
const magic={arcane:['arcane_nova','mana_convergence'],fire:['controlled_burn','cinder_focus'],frost:['frost_resonance','glacial_echo'],lightning:['static_focus','storm_conductor']};
const modeGraph=mode=>graph.filter(n=>!n.element||n.element===mode);
function route(g,id){const plan=R.plan(g,{},id);assert(plan,id);let p={points:100,ranks:{}};for(const step of plan.steps){p=G.allocate(g,p,step);assert(p,step);}return plan.steps;}
test('Symmetric normal slots cost 6/7/7 and existing Focused/Mixed costs remain intact',()=>{
 for(const ids of Object.values(normal))assert.deepEqual(ids.map(id=>route(graph,id).length),[6,7,7]);
 for(const family of G.FAMILIES.filter(f=>f!=='magic'))assert.deepEqual(G.FOCUSED[family].map(id=>route(graph,id).length),[8,12,18]);
 for(const pair of G.MIXED)assert.deepEqual(pair.slice(2).map(id=>route(graph,id).length),[12,14,18]);
});
test('Mode-specific six-point branches use the shared side stat and a mode gate',()=>{
 for(const [mode,ids] of Object.entries(magic))for(const [lane,id] of ids.entries()){
  const g=modeGraph(mode),steps=route(g,id);
  assert.equal(steps.length,6);assert(steps.includes('element_choice'));assert(steps.includes('magic_side_'+lane+'_1'));
  assert(steps.every(s=>!byId.get(s).element||byId.get(s).element===mode));
  assert(byId.get('magic_side_'+lane+'_2').anyRequires.includes(id));
  assert.equal(route(g,'magic_side_'+lane+'_2').length,6);
 }
});
test('Pending effects and their stat gates cannot be bought or injected into a valid save',()=>{
 assert.equal(graph.length,419);assert.equal(graph.filter(n=>n.pending).length,44);
 for(const n of graph.filter(n=>n.pending)){
  const mode=n.element||'arcane',p={...T.create(),xp:10000,...(mode==='arcane'?{}:{element:mode})};
  const steps=route(modeGraph(mode),n.id),active=steps.filter(id=>!byId.get(id).pending);
  for(const id of active){const next=T.allocate(p,id);if(next)Object.assign(p,next);}
  assert.equal(T.allocate(p,n.id),null);
  assert(!T.valid({...p,nodes:steps}));
 }
});
test('All pre-existing active nodes remain reachable with the current runtime, correct element, and no pending purchases',()=>{
 for(const n of graph.filter(n=>!n.pending)){
  const mode=n.element||'arcane',g=modeGraph(mode).filter(x=>!x.pending),steps=route(g,n.id);
  let p={...T.create(),xp:10000,...(mode==='arcane'?{}:{element:mode})};
  for(const id of steps){p=T.allocate(p,id);assert(p,id);}
  assert(T.valid(p));
 }
});
test('Mode switching preserves shared progress, refunds previous elemental nodes and never changes XP',()=>{
 let p=buy(['arcane_mastery','affinity_aegis']);
 const xp=p.xp;
 for(const mode of ['fire','frost','lightning','arcane']){
  p=T.selectElement(p,mode);assert(p);assert(T.valid(p));assert.equal(p.xp,xp);assert(p.nodes.includes('affinity_aegis'));
  assert(p.nodes.every(id=>!byId.get(id)?.element||byId.get(id).element===mode));
 }
});
test('All four rendered mode layouts avoid overlaps, proper edge crossings and edge-node intersections',()=>{
 const source=fs.readFileSync('preview/talent-rebuild/prototype.js','utf8'),layout=source.slice(source.indexOf('const angle='),source.indexOf('const el='));
 const context={graph,families:G.FAMILIES,byId};vm.runInNewContext(layout+';globalThis.positions=positions',context);
 const pos=context.positions,rad=n=>n.kind==='affinity'?37:n.kind==='choice'?32:n.kind==='mixed'?29:['basic','focused','element','weapon','extension','adaptive'].includes(n.kind)?23:9;
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const dist=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
 for(const mode of Object.keys(magic)){
  const visible=modeGraph(mode),ids=new Set(visible.map(n=>n.id)),edges=[];
  for(const n of visible)for(const dep of [...new Set([n.requires,...(n.prerequisites||[]),...(n.anyRequires||[])].filter(Boolean))]){
   if(!ids.has(dep))continue;
   if((n.mixedChoice||n.focusChoice||n.elementPrevious||n.gateFor&&byId.get(n.gateFor)?.kind==='mixed'&&n.tier===3)&&n.anyRequires?.includes(dep))continue;
   if(dep==='element_choice'&&(n.adaptive||n.element&&n.gateFor))continue;
   edges.push([dep,n.id]);
  }
  for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){const a=visible[i],b=visible[j],p=pos[a.id],q=pos[b.id];assert(Math.hypot(p.x-q.x,p.y-q.y)>=rad(a)+rad(b)+4,a.id+' overlaps '+b.id);}
  for(let i=0;i<edges.length;i++){
   const [a,b]=edges[i],p=pos[a],q=pos[b];
   for(const n of visible)if(n.id!==a&&n.id!==b)assert(dist(pos[n.id],p,q)>=rad(n)-.001,a+'->'+b+' crosses '+n.id);
   for(let j=i+1;j<edges.length;j++){const [c,d]=edges[j];if([a,b].includes(c)||[a,b].includes(d))continue;const r=pos[c],s=pos[d];assert(!(cross(p,q,r)*cross(p,q,s)<-1e-5&&cross(r,s,p)*cross(r,s,q)<-1e-5),[a,b,c,d].join(' '));}
  }
 }
});
test('Runtime and visual atlas mirrors stay identical',()=>{for(const f of ['combat/talent-graph-next.js','combat/talent-graph-runtime.js','preview/talent-rebuild/prototype.js','preview/talent-rebuild/index.html'])assert.equal(fs.readFileSync(f,'utf8'),fs.readFileSync('docs/'+f,'utf8'));});
