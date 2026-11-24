'use strict';
// D.2B.2: preview-only alternative progression, following the annotated Aegis screenshot.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const alternatives={focus_branch_aegis_0_1:'proposal_ward_echo',focus_branch_aegis_1_1:'proposal_ward_echo',basic_path_aegis_0_2:'mace_shockwave',basic_path_aegis_1_2:'sword_sweep',focus_branch_aegis_0_2:'mace_shockwave',focus_branch_aegis_1_2:'sword_sweep'};
function transform(s){
 const anchor='const byId=new Map(graph.map(n=>[n.id,n]));',i=s.lastIndexOf(anchor);assert(i>=0);
 const patch='const AEGIS_ALTERNATIVES='+JSON.stringify(alternatives)+';\nfor(let i=0;i<graph.length;i++){const n=graph[i],alt=AEGIS_ALTERNATIVES[n.id];if(alt)graph[i]={...n,requires:null,anyRequires:[...new Set([n.requires,...(n.anyRequires||[]),alt].filter(Boolean))]};}\n';
 s=s.slice(0,i)+patch+s.slice(i);
 const edge="links.append(el('line',{...data,x1:q.x,y1:q.y,x2:p.x,y2:p.y}));";assert.equal(s.split(edge).length,2);
 return s.replace(edge,"links.append(el('line',{...data,...(AEGIS_ALTERNATIVES[n.id]===dep?{class:'alternate-route'}:{}),x1:q.x,y1:q.y,x2:p.x,y2:p.y}));")
 .replaceAll('6.47D.2B.1','6.47D.2B.2').replace('AEGIS TEMPLATE · three standard exits · read-only','AEGIS · alternative routes · read-only')
 .replace('Aegis · symmetric template','Aegis · alternate progression')
 .replace('Central exit: 6 points. Mirror side exits: 7 points each. Both branch from the first lateral stat junction, not from a weapon-specific skill. The skills are temporary labels for the three structural slots. Existing combat and other affinities remain unchanged.','Six new alternative connections. Ward Echo can lead to either tier-1 Focused stat. Sword Sweep and Mace Shockwave can lead into their respective tier-2 Basic or Focused stat. Original routes remain available. Focused gates still require both side stats. Preview only.')
 .replace("['sword_sweep','LEFT · 7',40],['mace_shockwave','RIGHT · 7',40]","['sword_sweep','LEFT · 7',-36],['mace_shockwave','RIGHT · 7',-36]")
 .replace('centre(0,1030,Math.max(1900,2360*viewport.clientWidth/Math.max(1,viewport.clientHeight)))','centre(0,1260,Math.max(1600,1640*viewport.clientWidth/Math.max(1,viewport.clientHeight)))')
 .replace('</head>','<style>.alternate-route{stroke:#e6be71;stroke-width:3.5;stroke-dasharray:8 5;opacity:1}.alternate-route.planned{stroke:#ffe3aa;stroke-width:4;opacity:1}</style></head>');
}
function main(){
 const out=path.resolve(process.argv[2]||'reports/stage647d2b2-layout');
 execFileSync(process.execPath,[path.join(__dirname,'prepare-stage647d2b1-layout.cjs'),out],{stdio:'inherit'});
 fs.writeFileSync(path.join(out,'talent-tree-647d2b2-interactive.html'),transform(fs.readFileSync(path.join(out,'talent-tree-647d2b1-interactive.html'),'utf8')));
 const js=path.join(out,'prototype.js');fs.writeFileSync(js,transform(fs.readFileSync(js,'utf8')));
 const entry=path.join(out,'index.html');fs.writeFileSync(entry,fs.readFileSync(entry,'utf8').replaceAll('6.47D.2B.1','6.47D.2B.2').replace('AEGIS TEMPLATE · three standard exits · read-only','AEGIS · alternative routes · read-only').replace('</head>','<style>.alternate-route{stroke:#e6be71;stroke-width:3.5;stroke-dasharray:8 5;opacity:1}</style></head>'));
}
if(require.main===module)main();module.exports={transform,alternatives};
