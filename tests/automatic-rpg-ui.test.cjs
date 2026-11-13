'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('function automaticXpBar(){'),end=html.indexOf('\nfunction expeditionRouteMap(',start);
assert(start>=0&&end>start);
const context={state:{automaticTalents:{xp:150,nodes:['might']}},esc:String,phase2PassiveIcons:()=>'<i>icon</i>',phase2FamilyIcon:()=>'<i>family</i>',WandererV012Expedition:{FAMILY_NAMES:{blood:'Blood',decay:'Decay',vitality:'Vitality',aegis:'Aegis',fury:'Fury',magic:'Magic'}}};
vm.runInNewContext(fs.readFileSync('combat/v012-buildcraft.js','utf8')+'\n'+fs.readFileSync('combat/automatic-talents.js','utf8')+'\n'+html.slice(start,end)+'\nthis.xp=automaticXpBar;this.tree=automaticTalentTree;',context);
test('XP bar shows level and progress accessibly',()=>{const bar=context.xp();assert.match(bar,/Level 2/);assert.match(bar,/50 \/ 100 XP/);assert.match(bar,/role="progressbar"/);assert.match(bar,/aria-valuenow="50"/);});
test('a separate Talents page lists all ability families and uses original icons',()=>{const page=context.tree();assert.match(page,/Talent Tree/);for(const family of ['Blood','Decay','Vitality','Aegis','Fury','Magic'])assert(page.includes(family));assert.match(page,/passive_bleeding_edge/);assert.match(page,/<i>icon<\/i>/);assert.match(html,/view==='talents'\)renderAutomaticTalents/);assert.match(html,/\['talents','Talents'\]/);});
test('talent graph has a clear start, stat icons and no straight lines through unrelated nodes',()=>{
 const page=context.tree();assert.match(page,/talentGraphStart/);assert.match(page,/💪/);assert.match(page,/🏹/);assert.match(page,/🔮/);assert.match(page,/🛡️/);assert.match(page,/additional requirements/i);
 const nodes=[...page.matchAll(/style="left:([\d.]+)px;top:([\d.]+)px" data-auto-talent="([^"]+)"/g)].map(m=>({x:+m[1],y:+m[2],id:m[3]}));assert(nodes.length>100);
 for(let i=0;i<nodes.length;i++)for(let j=0;j<i;j++)assert(Math.hypot(nodes[i].x-nodes[j].x,nodes[i].y-nodes[j].y)>=56,`${nodes[i].id} overlaps ${nodes[j].id}`);
 for(const m of page.matchAll(/<line class="[^"]*" x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/g)){const [x1,y1,x2,y2]=m.slice(1).map(Number),dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy;for(const node of nodes){const t=((node.x-x1)*dx+(node.y-y1)*dy)/len;if(t<=.04||t>=.96)continue;assert(Math.hypot(node.x-x1-t*dx,node.y-y1-t*dy)>=29,`line crosses ${node.id}`);}}
});
