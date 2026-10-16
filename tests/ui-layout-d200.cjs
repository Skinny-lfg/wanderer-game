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
const equipmentMarkup=html.slice(html.indexOf('function renderStash(){'),html.indexOf('function renderForge(){'));
const leftStart=equipmentMarkup.indexOf('class="equipmentLeft"');
const bonusStart=equipmentMarkup.indexOf('class="panel equipmentBonuses"');
const rightStart=equipmentMarkup.indexOf('class="equipmentRight"');
const stashStart=equipmentMarkup.indexOf('class="panel equipmentInventory"');
const runeStart=equipmentMarkup.indexOf('class="panel equipmentRunes"');
assert(leftStart>=0&&bonusStart>leftStart&&rightStart>bonusStart,'desktop keeps set bonuses in the left column');
assert(stashStart>rightStart&&runeStart>stashStart,'desktop keeps runes below stash on the right');
assert(html.includes('.equipmentLeft,.equipmentRight{display:contents}')&&html.includes('.equipmentInventory{order:1}')&&html.includes('.equipmentRunes{order:2}')&&html.includes('.equipmentBonuses{order:3}'),'mobile orders stash, then runes, then tier bonuses');
assert(html.includes('class="homeMetrics"')&&!html.includes('<div class="hub">'),'home dashboard has no duplicate menu');
const homeMarkup=html.slice(html.indexOf('function renderTavern(){'),html.indexOf('function equipItem('));
assert(homeMarkup.includes('<details class="panel homeChangelog" open>')&&homeMarkup.includes('v0.9.1 → v0.9.2')&&homeMarkup.includes('Fastest D200 leaderboard')&&homeMarkup.includes('all screens'),'homepage release notes visible');
for(const text of ['D200','permanent runes','Tank, Berserker, Vampire and Caster','tier bonuses','responsive Equipment']){
 assert(homeMarkup.includes(text),'v0.9 changelog contains '+text);
}
assert(html.includes('.homeChanges{list-style:none;display:grid')&&html.includes('@media(max-width:650px){.homeChanges{grid-template-columns:1fr'),'compact mobile changelog layout');

assert(html.includes('Number(count>=b)-Number(count>=a)||b-a'),'active high tier bonuses are sorted first');
assert(html.includes('.combatDecisionPanel{display:none}')&&html.includes('.combatDecisionPanel{display:block;margin:8px'),'critical briefing appears at mobile widths only');
assert(html.includes('.combatExpeditionDetails .nextWaveOdds,.combatExpeditionDetails .runLootHeading,.combatExpeditionDetails .combatLoot{display:none}'),'mobile removes redundant lower odds and loot');

assert(html.includes('.merchantEquipped{display:flex;align-items:center;flex-wrap:wrap;min-width:0;'),'merchant equipped name can wrap at mobile widths');
const runeMarkup=html.slice(html.indexOf('function runeLine(r){'),html.indexOf('function runeSectionMarkup(){'));
assert(runeMarkup.includes('<img class="runeIcon"')&&runeMarkup.includes('src="assets/runes/'),'rune markup embeds local PNG icons');
for(const family of ['might','swiftness','wisdom','fortitude','fortune','fury','warding','vitality']){
 const icon=fs.readFileSync(path.join(root,'assets','runes',family+'.png'));
 assert(icon.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')),family+' icon is valid PNG');
 assert.equal(icon.readUInt32BE(16),256,family+' icon width');
 assert.equal(icon.readUInt32BE(20),256,family+' icon height');
 assert(html.includes("id:'"+family+"'"),family+' matches an existing rune family');
}
assert(model.includes('maxDungeon>200')&&model.includes('Math.min(200')&&model.includes('length:20'),'cloud saves, leaderboard, milestones support D200');
assert(loadout.includes('item.tier>200')&&loadout.includes('r.tier<=200'),'public item/rune cap supports D200');
assert(fb.includes("appVersion:'0.9'")&&fb.includes('maxDungeon>200'),'v0.9 feedback with D200');
assert(rules.includes('d.deepest <= 200')&&rules.includes('match /testSeasons/test-open-1/speedruns/{uid}')&&rules.includes('bestMs <= resource.data.bestMs')&&rules.includes("d.appVersion in ['0.8.1','0.9']"),'Firebase rules support current attempts, best D200 and legacy feedback');
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
