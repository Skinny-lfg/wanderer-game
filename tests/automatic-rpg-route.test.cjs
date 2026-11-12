'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('index.html','utf8');
const start=source.indexOf('function expeditionRouteMap(g){');
const end=source.indexOf('\nfunction renderPhase1(){',start);
assert(start>=0&&end>start,'route map source exists');
const context={esc:value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')};
vm.runInNewContext(source.slice(start,end)+'\nthis.route=expeditionRouteMap;',context);
test('map reflects the saved schedule and current realm without inventing paths',()=>{
 const rooms=['combat','event','elite',...Array(11).fill('combat'),'boss'];
 const html=context.route({rooms,planeIndex:3,history:[{name:'Crimson Dominion'},{name:'Verdant Wilds'}]});
 assert.equal((html.match(/class="expeditionRouteNode /g)||[]).length,15);
 assert.equal((html.match(/is-complete/g)||[]).length,2);
 assert.match(html,/Realm 3: Elite, current/);
 assert.match(html,/Realm 15: Boss/);
 assert.match(html,/Crimson Dominion/);
 assert.match(html,/Upcoming encounter types/);
});
test('map escapes realm names from restored state',()=>{
 const html=context.route({rooms:['combat','boss'],planeIndex:2,history:[{name:'<danger>'}]});
 assert(!html.includes('<danger>'));
 assert.match(html,/&lt;danger&gt;/);
});

test('branching map shows paths, encounter types and current options',()=>{
 const rooms=['combat','combat','boss'],routeMap=[['combat','combat','combat'],['combat','elite','combat'],['boss']];
 const html=context.route({rooms,routeMap,planeIndex:2,history:[{lane:0}]});
 assert.match(html,/connected path/);assert.match(html,/Elite/);assert.match(html,/is-chosen/);assert.equal((html.match(/is-available/g)||[]).length,2);
});
