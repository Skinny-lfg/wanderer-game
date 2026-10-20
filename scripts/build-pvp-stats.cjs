// Generate the practice arena module from the exact browser formulas; never edit the generated file.
const fs=require('node:fs');const html=fs.readFileSync('index.html','utf8');
const functions=['gearEvasionRating','itemStatValue','setCounts','setBonuses','totalStats'];
const pieces=functions.map(name=>{const start=html.indexOf('function '+name+'('),end=html.indexOf('\nfunction ',start+1);if(start<0||end<0)throw Error(name);return html.slice(start,end).replaceAll('=state.equip','= {}');});
const elements=html.match(/const ELEMENTS=.*?;\n/)[0],fields=html.match(/const FIELDS=.*?;\n/)[0];
const runeFamilies=html.match(/const RUNE_FAMILIES=\[[\s\S]*?\n\];/)[0];
const startRune=html.indexOf('function runeValue('),endRune=html.indexOf('\nfunction ',startRune+10);
if(startRune<0||endRune<0)throw Error('Rune stat helpers unavailable');
const statsContext="const state={runes:[],runeSlots:[]};const PHASE1_PREVIEW=true,phase6Run=null;const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));\n"+html.match(/const RARITY=.*?;\n/)[0]+html.match(/const ARMOR_SLOTS=.*?;\n/)[0];
const gearModule=fs.readFileSync('combat/v012-gear-stats.js','utf8');
if(!gearModule.includes('})(globalThis);'))throw Error('Shared Gear Stats module ending not found');
const isolatedGear=gearModule.replace('})(globalThis);','})(statsModule);');
const output=statsContext+'// Generated from the shared v0.12 Gear Stats module and browser equipment adapters.\n'+elements+fields+"const isTwoHanded=o=>['Two-Handed','Bow','Staff'].includes(o?.subtype);\n"+runeFamilies+'\n'+html.slice(startRune,endRune)+'\n'+'const statsModule={};\n'+isolatedGear+'\nconst WandererV012GearStats=statsModule.WandererV012GearStats;\n'+pieces.join('\n')+'\nexport {totalStats};\n';
if(process.argv.includes('--check')){if(fs.readFileSync('online/pvp-stats.mjs','utf8')!==output)throw Error('Stats changed: run npm run build:pvp');}else fs.writeFileSync('online/pvp-stats.mjs',output);
