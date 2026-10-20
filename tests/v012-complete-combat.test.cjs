const {test}=require('node:test'),assert=require('node:assert/strict');require('../combat/v012-buildcraft.js');const B=globalThis.WandererV012Buildcraft;
function ctx(){const effects=[];return {effects,c:{funded:true,base:100,power:100,amp:1,now:0,critical:false,enemy:{hp:10000,maxhp:10000,dots:{},slowTime:0},player:{maxhp:100,hp:50},random:()=>0,dot:(...a)=>effects.push(['dot',...a]),damage:(...a)=>effects.push(['damage',...a]),dotDamage:(...a)=>effects.push(['dotDamage',...a]),heal:n=>(effects.push(['heal',n]),n),mana:n=>effects.push(['mana',n]),barrier:n=>effects.push(['barrier',n]),chill:n=>effects.push(['chill',n]),log:()=>{}}};}
test('six bare families grant no combat effects; explicit starters do',()=>{
 for(const family of B.FAMILIES){const b=B.create();b.families=[family];if(family==='magic')b.element='fire';const {c,effects}=ctx();B.onAttack(b,c);B.onSecond(b,c);B.onCast(b,c);assert.deepEqual(effects,[],family);B.initial(b,family);if(['blood','decay','magic'].includes(family)){B.onAttack(b,{...c,now:10});B.onCast(b,c);assert(effects.length,family);}}
});
test('Static is player state, requires funded casts, survives Waves/JSON and clears at Expedition end',()=>{
 const b=B.create();b.families=['magic'];B.element(b,'lightning');B.initial(b,'magic');const {c,effects}=ctx();
 for(let i=0;i<3;i++)B.onCast(b,c);assert.equal(b.runtime.staticCharges,3);B.resetWave(b,c.enemy);assert.equal(b.runtime.staticCharges,3);const copy=B.validate(JSON.parse(JSON.stringify(b)));B.onCast(copy,{...c,funded:false});assert.equal(copy.runtime.staticCharges,3);B.onCast(copy,c);assert.equal(copy.runtime.staticCharges,0);assert(effects.some(e=>e[2]==='⚡ Static Discharge'&&Math.abs(e[1]-38.4)<.01));assert.equal(c.enemy.v012Shock,0);B.clear(copy);assert.equal(copy.runtime.staticCharges,0);
});
test('Deep Winter caps boss chill and Withering Hex reduces non-healer attacks',()=>{
 const b=B.create();b.families=['magic','decay'];b.element='frost';b.picks=['deep_winter','wither'];const {c,effects}=ctx();c.enemy.boss=true;c.enemy.v012Rot=[{damage:1,remaining:2}];B.onCast(b,c);assert(effects.some(e=>e[0]==='chill'&&e[1]===1.2));assert(B.incoming(b,c,100)<100);
});
