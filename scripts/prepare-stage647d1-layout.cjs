'use strict';
// Geometry-only derivative of 6.47D; production graph and prerequisites untouched.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const directions={blood_reservoir:[35,0],cleave_mastery:[20,0],accelerated_bleeding:[0,0],bow_pierce:[-35,0],single_target_mastery:[0,0],fan_of_blades:[0,0],grasping_roots:[35,0],living_force:[0,0],vital_pulse:[10,0],mace_shockwave:[-35,0],sword_sweep:[0,0],ward_echo:[-10,0],arcane_nova:[-150,90],mana_convergence:[-35,0],elemental_resonance:[0,0],soul_drain:[35,0],corruption_nova:[0,0],contagious_touch:[-10,0]};
function transform(s){
 const anchor='for(const n of graph){if(n.weaponFork||n.gateFor&&byId.get(n.gateFor)?.weaponFork)continue;positions[n.id].x*=1.25;positions[n.id].y*=1.25;}';
 const patch='const BRANCH_DIRECTIONS='+JSON.stringify(directions)+';\n'+
"const branchSteps=[82,52,52,65];\nfor(const n of graph){if(n.weaponFork||n.gateFor&&byId.get(n.gateFor)?.weaponFork)continue;positions[n.id].x*=1.75;positions[n.id].y*=1.75;}\nfor(const skill of graph.filter(n=>n.kind==='weapon')){\n const gate=byId.get(skill.requires),second=byId.get(gate.requires),first=byId.get(second.requires),parent=byId.get(first.requires);\n const key=skill.id.replace(/^proposal_/,'');const [direction,bend]=BRANCH_DIRECTIONS[key];\n let a=angle(skill.family)+direction*Math.PI/180,p=positions[parent.id];\n for(const [i,n] of [first,second,gate,skill].entries()){\n  if(i===1)a+=bend*Math.PI/180;\n  p={x:p.x+branchSteps[i]*Math.cos(a),y:p.y+branchSteps[i]*Math.sin(a)};positions[n.id]=p;\n }\n}\n";
 assert.equal(s.split(anchor).length,2,'Unexpected previous layout');
 return s.replace(anchor,patch)
 .replace('WANDERER · TALENT ATLAS — 6.47D','WANDERER · TALENT ATLAS — 6.47D.1')
 .replace('Dashed gold = proposed · read-only','Dashed gold = proposed · local branches · read-only')
 .replace('Stage 6.47D • 367 existing nodes + 48 proposal placeholders.','Stage 6.47D.1 • 367 existing nodes + 48 proposal placeholders. Equal-length local forks from their actual prerequisites.')
 .replace('Math.max(3300,3300*','Math.max(4010,4010*')
 .replace('Math.max(300,Math.min(4800,view.w*f))','Math.max(300,Math.min(10000,view.w*f))')
 .replace('centre(p.x,p.y,Math.max(1500,1500*viewport.clientWidth/Math.max(1,viewport.clientHeight)))','centre(p.x,p.y,Math.max(1950,1950*viewport.clientWidth/Math.max(1,viewport.clientHeight)))')
 .replace('const p=polar(angle(f),870);','const p=polar(angle(f),1190);');
}
function main(){
 const out=path.resolve(process.argv[2]||'reports/stage647d1-layout');
 execFileSync(process.execPath,[path.join(__dirname,'prepare-stage647d-layout.cjs'),out],{stdio:'inherit'});
 const html=path.join(out,'talent-tree-647d-interactive.html');
 fs.writeFileSync(path.join(out,'talent-tree-647d1-interactive.html'),transform(fs.readFileSync(html,'utf8')));
 const js=path.join(out,'prototype.js');fs.writeFileSync(js,transform(fs.readFileSync(js,'utf8')));
 const entry=path.join(out,'index.html');fs.writeFileSync(entry,fs.readFileSync(entry,'utf8').replace('WANDERER · TALENT ATLAS — 6.47D','WANDERER · TALENT ATLAS — 6.47D.1').replace('Dashed gold = proposed · read-only','Dashed gold = proposed · local branches · read-only'));
}
if(require.main===module)main();module.exports={transform,directions};