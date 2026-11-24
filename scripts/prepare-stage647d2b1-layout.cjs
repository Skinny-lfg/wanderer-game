'use strict';
// 6.47D.2B.1: preview-only structural slots; never used by the combat runtime.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const parents={weapon_path_sword_sweep_1:'basic_path_aegis_1_1',weapon_path_mace_shockwave_1:'basic_path_aegis_0_1',proposal_ward_echo_1:'affinity_aegis'};
const positions={};
for(const [sign,id] of [[-1,'sword_sweep'],[1,'mace_shockwave']]){
 const ids=['weapon_path_'+id+'_1','weapon_path_'+id+'_2','gate_'+id,id];
 [[180,835],[190,915],[210,995],[240,1080]].forEach(([x,y],i)=>positions[ids[i]]={x:sign*x,y});
}
function transform(s){
 const a='const byId=new Map(graph.map(n=>[n.id,n]));';
 const i=s.lastIndexOf(a);assert(i>=0);
 s=s.slice(0,i)+'const AEGIS_FORK_PARENTS='+JSON.stringify(parents)+';\nfor(let i=0;i<graph.length;i++){const n=graph[i];if(AEGIS_FORK_PARENTS[n.id])graph[i]={...n,requires:AEGIS_FORK_PARENTS[n.id]};}\n'+s.slice(i);
 const b='const el=(tag,attrs)=>';assert.equal(s.split(b).length,2);
 return s.replace(b,'Object.assign(positions,'+JSON.stringify(positions)+');\n'+b)
 .replaceAll('6.47D.2A','6.47D.2B.1')
 .replace('AEGIS STUDY · dashed gold = proposed · read-only','AEGIS TEMPLATE · three standard exits · read-only')
 .replace('Aegis · structural fan','Aegis · symmetric template')
 .replace('Symmetric base lanes, central Focused skills, Ward Echo inside the upper diamond, Sword Sweep and Mace Shockwave inside the lateral lanes. Existing unlock routes remain unchanged. Other affinities are still the previous prototype.','Central exit: 6 points. Mirror side exits: 7 points each. Both branch from the first lateral stat junction, not from a weapon-specific skill. The skills are temporary labels for the three structural slots. Existing combat and other affinities remain unchanged.')
 .replace("...(n.proposal?{class:'proposal-link'}:{})","...((n.proposal||n.family==='aegis'&&(n.weaponFork||n.gateFor&&byId.get(n.gateFor)?.weaponFork))?{class:'proposal-link'}:{})")
 .replace("(n.proposal?' proposal':'')","((n.proposal||n.family==='aegis'&&(n.weaponFork||n.gateFor&&byId.get(n.gateFor)?.weaponFork))?' proposal':'')")
 .replace('window.__layout647D={graph,positions,plan:PLAN,slots:SLOTS};',"window.__layout647D={graph,positions,plan:PLAN,slots:SLOTS};\nfor(const [id,label,dy] of [['proposal_ward_echo','INNER · 6',-36],['sword_sweep','LEFT · 7',40],['mace_shockwave','RIGHT · 7',40]]){const p=positions[id],t=el('text',{x:p.x,y:p.y+dy,'text-anchor':'middle','font-size':20,fill:'#e6be71','pointer-events':'none'});t.textContent=label;nodes.append(t);}");
}
function main(){
 const out=path.resolve(process.argv[2]||'reports/stage647d2b1-layout');
 execFileSync(process.execPath,[path.join(__dirname,'prepare-stage647d2a-layout.cjs'),out],{stdio:'inherit'});
 fs.writeFileSync(path.join(out,'talent-tree-647d2b1-interactive.html'),transform(fs.readFileSync(path.join(out,'talent-tree-647d2a-interactive.html'),'utf8')));
 const js=path.join(out,'prototype.js');fs.writeFileSync(js,transform(fs.readFileSync(js,'utf8')));
 const entry=path.join(out,'index.html');fs.writeFileSync(entry,fs.readFileSync(entry,'utf8').replaceAll('6.47D.2A','6.47D.2B.1').replace('AEGIS STUDY · dashed gold = proposed · read-only','AEGIS TEMPLATE · three standard exits · read-only'));
}
if(require.main===module)main();module.exports={transform,parents,positions};
