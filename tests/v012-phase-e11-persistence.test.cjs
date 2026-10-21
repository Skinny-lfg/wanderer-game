'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const create=require('./v012-economy-harness.cjs');
const result=JSON.parse(fs.readFileSync(process.argv[2]||'/tmp/wanderer-e11-results.json','utf8'));
const rows=result.rows;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const tests=[];
function check(name,fn){try{fn();tests.push([name,'PASS']);}catch(e){tests.push([name,'FAIL',e.message]);}}
check('1 — Runas equipadas e início',()=>{for(const r of rows){assert.deepEqual(r.before.runeSlots,r.after.runeSlots);assert.deepEqual(r.before.runes,r.after.runes);}});
check('2 — vitória preserva Runas ou recompensa legítima',()=>{for(const r of rows.filter(x=>x.win)){assert(r.after.runes.length===r.before.runes.length||r.after.runes.length===r.before.runes.length+1);}});
check('3 — derrota preserva Runas',()=>{for(const r of rows.filter(x=>!x.win)){assert.deepEqual(r.before.runes,r.after.runes);assert.deepEqual(r.before.runeSlots,r.after.runeSlots);}});
check('4 — repetição inferior não eleva Runas',()=>{for(const r of rows.filter(x=>x.repeat))assert.deepEqual(r.before.runes,r.after.runes);});
check('5 — E200 para E201 não altera Runas antigas',()=>{for(const r of rows){for(const old of r.before.runes){const now=r.after.runes.find(x=>x.id===old.id);assert.deepEqual(now,old);}}});
check('6 — serialização e restore',()=>{const a=create(9001,undefined,{}, {now:1700000000000}),s=a.state();a.setup(190,'Bow','Epic');s.runes=['vitality','warding','might'].map((f,i)=>a.makeRune(f,190+i*4));s.runeSlots=s.runes.map(r=>r.id);s.gold=4000;s.fragments=3000;a.controller().state.unlocked=200;const before=JSON.parse(JSON.stringify({equip:s.equip,runes:s.runes,runeSlots:s.runeSlots,gold:s.gold,fragments:s.fragments}));const serialized=JSON.stringify(before);const restored=JSON.parse(serialized);assert.deepEqual(restored,before);const normalized=JSON.parse(JSON.stringify(a.safeRunes(restored.runes)));assert.equal(normalized.length,before.runes.length);for(let i=0;i<normalized.length;i++)for(const key of ['id','family','tier','value','progression'])assert.equal(normalized[i][key],before.runes[i][key]);});
check('7 — gear e recursos não são regenerados',()=>{for(const r of rows){assert.deepEqual(r.before.equip,r.after.equip);assert(r.after.gold>=r.before.gold);assert(r.after.fragments>=r.before.fragments);}});
check('8 — mesmo estado e seed reproduzem decisões',()=>{const make=()=>{const a=create(9001,undefined,{}, {now:1700000000000}),s=a.state();a.setup(190,'Bow','Epic');s.runes=['vitality','warding','might'].map((f,i)=>a.makeRune(f,190+i*4));s.runeSlots=s.runes.map(r=>r.id);return JSON.parse(JSON.stringify({equip:s.equip,runes:s.runes,runeSlots:s.runeSlots,stats:a.baseStats(s.equip)}));};assert.deepEqual(make(),make());});
check('paridade de Runas no motor integrado',()=>{const a=create(13),s=a.state();a.setup(190,'Bow','Epic');const rune=a.makeRune('vitality',190);s.runes=[rune];s.runeSlots=[rune.id,null,null];const withRune=a.baseStats(s.equip);s.runeSlots=[null,null,null];const without=a.baseStats(s.equip);assert.equal(withRune.hpFlat-without.hpFlat,a.runeValue('vitality',190));});
for(const row of tests){if(row[0].startsWith('2 —')&&!rows.some(r=>r.win)||row[0].startsWith('4 —')&&!rows.some(r=>r.repeat)||row[0].startsWith('5 —')&&!rows.some(r=>r.level===201)||row[0].startsWith('6 —')||row[0].startsWith('8 —'))row[1]=row[1]==='PASS'?'PARTIAL':row[1];}
for(const [name,status,error] of tests)console.log(`${status} ${name}${error?' — '+error:''}`);
if(tests.some(x=>x[1]==='FAIL'))process.exitCode=1;
