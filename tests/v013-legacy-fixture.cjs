'use strict';
// Historical regression fixture for the retired 15-Realm route and talent graph.
// Never used by the real game, the native simulator, or production saves.
// Current Dungeon and v15 Talent Tree are verified separately by native tests.
const fs=require('node:fs'),path=require('node:path');
const native=require('./v012-economy-harness.cjs');
const runtime=fs.readFileSync(path.join(__dirname,'../online/v012-expedition-runtime.js'),'utf8');
if(!runtime.includes('dungeon:freeBuild'))throw Error('Legacy fixture cannot locate the route switch');
module.exports=(seed,source,overrides={},options={})=>native(seed,source,{
 'online/v012-expedition-runtime.js':runtime.replace('dungeon:freeBuild','dungeon:false'),
 'combat/talent-graph-runtime.js':'// Historical v8 talent runtime preserved for legacy regression tests only.',
 ...overrides
},options);
