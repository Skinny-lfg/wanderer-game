'use strict';
// 6.47D.2A — geometry-only Aegis fan, derived from the read-only D.1 prototype.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
function coordinates(){
 const c={affinity_aegis:[0,0],root_aegis:[0,-263],gate_steadfast_guard:[0,465],steadfast_guard:[0,555],gate_stored_force:[0,900],stored_force:[0,990],gate_unbreakable:[0,1320],unbreakable:[0,1415],proposal_ward_echo_1:[0,95],proposal_ward_echo_2:[0,175],gate_proposal_ward_echo:[0,255],proposal_ward_echo:[0,345]};
 const rows=[[[220,175],[300,250],[370,335],[145,385]],[[465,530],[515,665],[570,755],[215,810]],[[650,970],[695,1110],[735,1240],[285,1250]]];
 for(const [lane,sign,skills] of [[0,1,['guarded_block','barrier_pulse','brace']],[1,-1,['iron_skin','fortified','retaliation']]]){
  rows.forEach((row,i)=>{const ids=['basic_path_aegis_'+lane+'_'+(i+1),'gate_'+skills[i],skills[i],'focus_branch_aegis_'+lane+'_'+(i+1)];ids.forEach((id,j)=>c[id]=[sign*row[j][0],row[j][1]]);});
  c['focus_bridge_aegis_'+lane+'_2']=[sign*175,610];c['focus_bridge_aegis_'+lane+'_3']=[sign*250,1040];c['basic_detour_aegis_'+lane]=[sign*400,1030];
  c['outer_aegis_'+(lane===0?-1:1)+'_1']=[sign*250,0];c['outer_aegis_'+(lane===0?-1:1)+'_2']=[sign*415,150];
 }
 for(const [ids,points] of [[['weapon_path_sword_sweep_1','weapon_path_sword_sweep_2','gate_sword_sweep','sword_sweep'],[[-320,410],[-285,490],[-255,565],[-255,650]]],[['weapon_path_mace_shockwave_1','weapon_path_mace_shockwave_2','gate_mace_shockwave','mace_shockwave'],[[535,810],[515,865],[495,920],[475,980]]]]){
 ids.forEach((id,i)=>c[id]=points[i]);
 }
 return Object.fromEntries(Object.entries(c).map(([id,[x,y]])=>[id,{x:x*.78,y:y+578}]));
}
function transform(src){
 const anchor='const el=(tag,attrs)=>';assert.equal(src.split(anchor).length,2);
 const tail='window.__layout647D={graph,positions,plan:PLAN,slots:SLOTS};';assert.equal(src.split(tail).length,2);
 const setup=[
 'const selectAegis=()=>{centre(0,1030,Math.max(1900,2360*viewport.clientWidth/Math.max(1,viewport.clientHeight)));};',
 "const aegisButton=[...document.querySelectorAll('#families button')].find(b=>b.textContent==='Aegis');aegisButton.onclick=selectAegis;selectAegis();",
 "document.querySelector('#name').textContent='Aegis · structural fan';document.querySelector('#description').textContent='Symmetric base lanes, central Focused skills, Ward Echo inside the upper diamond, Sword Sweep and Mace Shockwave inside the lateral lanes. Existing unlock routes remain unchanged. Other affinities are still the previous prototype.';"
 ].join('\n');
 return src.replace(anchor,'Object.assign(positions,'+JSON.stringify(coordinates())+');\n'+anchor).replace(tail,tail+'\n'+setup)
 .replace('WANDERER · TALENT ATLAS — 6.47D.1','WANDERER · TALENT ATLAS — 6.47D.2A')
 .replace('Dashed gold = proposed · local branches · read-only','AEGIS STUDY · dashed gold = proposed · read-only')
 .replace('Math.max(4010,4010*','Math.max(4520,4520*')
 .replace('Stage 6.47D.1 • 367 existing nodes + 48 proposal placeholders. Equal-length local forks from their actual prerequisites.','Stage 6.47D.2A • Aegis fan layout only. Original talent requirements are preserved.');
}
function main(){
 const out=path.resolve(process.argv[2]||'reports/stage647d2a-layout');
 execFileSync(process.execPath,[path.join(__dirname,'prepare-stage647d1-layout.cjs'),out],{stdio:'inherit'});
 const html=path.join(out,'talent-tree-647d1-interactive.html');
 fs.writeFileSync(path.join(out,'talent-tree-647d2a-interactive.html'),transform(fs.readFileSync(html,'utf8')));
 const js=path.join(out,'prototype.js');fs.writeFileSync(js,transform(fs.readFileSync(js,'utf8')));
 const entry=path.join(out,'index.html');fs.writeFileSync(entry,fs.readFileSync(entry,'utf8').replace('WANDERER · TALENT ATLAS — 6.47D.1','WANDERER · TALENT ATLAS — 6.47D.2A').replace('Dashed gold = proposed · local branches · read-only','AEGIS STUDY · dashed gold = proposed · read-only'));
}
if(require.main===module)main();module.exports={coordinates,transform};
