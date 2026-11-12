'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8'),start=html.indexOf('function automaticXpBar(){'),end=html.indexOf('\nfunction expeditionRouteMap(',start);
assert(start>=0&&end>start);
const context={state:{automaticTalents:{xp:150,nodes:['might']}},esc:String,phase2PassiveIcons:()=>'<i>icon</i>',phase2FamilyIcon:()=>'<i>family</i>',WandererV012Expedition:{FAMILY_NAMES:{blood:'Blood',decay:'Decay',vitality:'Vitality',aegis:'Aegis',fury:'Fury',magic:'Magic'}}};
vm.runInNewContext(fs.readFileSync('combat/v012-buildcraft.js','utf8')+'\n'+fs.readFileSync('combat/automatic-talents.js','utf8')+'\n'+html.slice(start,end)+'\nthis.xp=automaticXpBar;this.tree=automaticTalentTree;',context);
test('XP bar shows level and progress accessibly',()=>{const bar=context.xp();assert.match(bar,/Level 2/);assert.match(bar,/50 \/ 100 XP/);assert.match(bar,/role="progressbar"/);assert.match(bar,/aria-valuenow="50"/);});
test('a separate Talents page lists all ability families and uses original icons',()=>{const page=context.tree();assert.match(page,/Talent Tree/);for(const family of ['Blood','Decay','Vitality','Aegis','Fury','Magic'])assert(page.includes(family));assert.match(page,/passive_bleeding_edge/);assert.match(page,/<i>icon<\/i>/);assert.match(html,/view==='talents'\)renderAutomaticTalents/);assert.match(html,/\['talents','Talents'\]/);});
