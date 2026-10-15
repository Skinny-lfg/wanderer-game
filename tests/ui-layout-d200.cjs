// Pre-release v0.9 responsive UI and D200 support.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const model=fs.readFileSync(path.join(root,'online','model.mjs'),'utf8');
const loadout=fs.readFileSync(path.join(root,'online','public-loadout.mjs'),'utf8');
const fb=fs.readFileSync(path.join(root,'online','firebase-client.mjs'),'utf8');
const rules=fs.readFileSync(path.join(root,'firestore.rules'),'utf8');
assert(html.indexOf('id="onlineBar"')<html.indexOf('id="nav"'),'profile/leaderboard/feedback are above tabs');
assert(html.includes('class="panel dungeonSelector"')&&html.includes('.dungeonSelector .levelGrid'),'compact dungeon rail exists');
assert(html.includes('const DUNGEON_CAP=200')&&html.includes('state.maxDungeon<DUNGEON_CAP'),'D200 limit and unlock');
assert(html.includes('n>DUNGEON_CAP')&&html.includes('tier>DUNGEON_CAP'),'dungeon selector and rune caps');
assert(html.includes('class="equipmentRight"')&&html.includes('class="panel equipmentRunes"'),'desktop runes under inventory');
assert(html.includes('class="homeMetrics"')&&!html.includes('<div class="hub">'),'home dashboard has no duplicate menu');
assert(html.includes('Number(count>=b)-Number(count>=a)||b-a'),'active high tier bonuses are sorted first');
assert(model.includes('maxDungeon>200')&&model.includes('Math.min(200')&&model.includes('length:20'),'cloud saves, leaderboard, milestones support D200');
assert(loadout.includes('item.tier>200')&&loadout.includes('r.tier<=200'),'public item/rune cap supports D200');
assert(fb.includes("appVersion:'0.9'")&&fb.includes('maxDungeon>200'),'v0.9 feedback with D200');
assert(rules.includes('d.deepest <= 200')&&rules.includes("'200'")&&rules.includes("d.appVersion in ['0.8.1','0.9']"),'Firebase rules support progress, milestones and legacy feedback');
(async()=>{
 const {validateSave,safeProgress,MILESTONES}=await import('../online/model.mjs');
 const {publicLoadout}=await import('../online/public-loadout.mjs');
 const empty={gold:0,fragments:0,maxDungeon:200,stash:[],equip:{},run:null};
 assert.equal(validateSave(empty).maxDungeon,200,'D200 cloud save accepted');
 assert.equal(safeProgress({...empty,onlineProgress:{deepestCleared:200}}).deepestCleared,200,'D200 leaderboard accepted');
 assert.equal(MILESTONES.at(-1),200,'D200 chapter milestone exists');
 const pub=publicLoadout(empty);assert.equal(pub.maxDungeon,200,'D200 public profile accepted');
 console.log('PASS: v0.9 responsive layout, sorted tiers, all D200 online and game caps');
})().catch(err=>{console.error(err);process.exitCode=1;});
