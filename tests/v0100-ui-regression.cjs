// v0.10.0 UI and boss metadata regression — no Firebase or live saves.
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('<script>'),end=html.indexOf('</script>',start);
assert(start>=0&&end>start);
new Function(html.slice(start+8,end));
for(const needle of ['<title>Wanderer v0.11.0</title>','class="version">v0.11.0','id="menuToggle"','id="onlineActions"','class="headerBottom"','id="heroMpFill"','bossPreviewMarkup(r.tier,upcoming)','Gravebound Bulwark','Bloodscar Ravager','Sanguine Wraith','Voidborne Hexer','The Abyssal Guardian','Rift Harbinger','Ember Sovereign'])assert(html.includes(needle),'Missing feature: '+needle);
assert(html.includes("if(mpBar&&mpFill)"),'Mana bar updates every combat tick');
for(const [slug,boss] of [['abyssal-guardian','The Abyssal Guardian'],['rift-harbinger','Rift Harbinger'],['ember-sovereign','Ember Sovereign']]){
 const path='assets/bosses/'+slug+'.png',png=fs.readFileSync(path);
 assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a',boss+' valid PNG file');
 assert(png.length>100000,boss+' must use real art, not placeholder');
 assert(html.includes("image:'"+path+"'"),boss+' uses its specific portrait');
}

const {harness}=require('../scripts/simulate-v091.cjs');
const sim=harness('index.html',{legendary:true});
for(const level of [10,20,30])assert.equal(sim.inspect.wavesForDungeon(level),5);

const model=fs.readFileSync('online/model.mjs','utf8'),online=fs.readFileSync('online/app.mjs','utf8'),manifest=JSON.parse(fs.readFileSync('assets/characters/manifest.json','utf8'));
assert.deepEqual(manifest.characters.map(c=>c.name),['Paladin','Ranger','Warrior','Wizard','Rogue'],'new labels saved in character catalog');
for(const name of ['Paladin','Ranger','Warrior','Wizard','Rogue'])assert(model.includes("'"+name+"'"),name+' must be exposed by model');
assert(html.includes('online/app.mjs?v=v0101-password-reset-3'),'browser fetches current account module');
assert(online.includes("./model.mjs?v=v0100-character-labels-1"),'account module fetches current character names');
for(const kind of ['tank','caster','vampire','berserker']){
 const file='assets/elites/'+kind+'.webp',bytes=fs.readFileSync(file);
 assert.equal(bytes.toString('ascii',0,4),'RIFF',kind+' valid WebP header');
 assert.equal(bytes.toString('ascii',8,12),'WEBP',kind+' valid image type');
 assert(bytes.length>200000,kind+' actual optimized art');
 assert(html.includes("'"+file+"'"),kind+' mapped to new portrait');
}

const backgrounds=[
 ['dungeon-desktop.webp',1600,900],['dungeon-mobile.webp',960,540],
 ['tavern-desktop.webp',1600,900],['tavern-mobile.webp',960,540]
];
for(const [file,w,h] of backgrounds){
 const path='assets/backgrounds/'+file,webp=fs.readFileSync(path);
 assert.equal(webp.toString('ascii',0,4),'RIFF',file+' RIFF WebP');
 assert.equal(webp.toString('ascii',8,12),'WEBP',file+' WebP signature');
 assert(webp.length>40000,file+' is a non-placeholder image');
 const tag='url(\''+path+'\')';
 assert(html.includes(tag),file+' referenced by responsive CSS');
 if(file.includes('desktop'))assert(w===1600&&h===900);
 else assert(w===960&&h===540);
}
assert(html.includes('body{isolation:isolate;background:transparent}'),'scrolling document never owns the artwork');
assert(html.includes('body::before{'),'page art is a dedicated viewport layer');
assert(html.includes('position:fixed;')&&html.includes('pointer-events:none;'),'background is fixed and ignores pointer input');
assert(!html.includes('background-attachment:scroll,scroll'),'mobile scrolling background removed');
assert(html.includes("url('assets/backgrounds/dungeon-desktop.webp')"),'global desktop image referenced');
assert(html.includes("url('assets/backgrounds/dungeon-mobile.webp')"),'global mobile image referenced');
assert(html.includes('<section class="tavernArt">'),'homepage background is stylesheet controlled');
assert(html.includes('<div class="scene" id="scene">'),'combat background is stylesheet controlled');
assert(!html.includes("background-image:url('${dungeonImage(t)}')"),'old theme-based combat backdrop retired, while dungeon cards retain artwork');

// Release banner and the visual rarity hierarchy must remain on development/main.
const releaseBannerPath='assets/releases/v0110-home-banner.webp';
const banner=fs.readFileSync(releaseBannerPath);
assert.equal(banner.toString('ascii',0,4),'RIFF','v0.11 banner RIFF header');
assert.equal(banner.toString('ascii',8,12),'WEBP','v0.11 banner is optimized WebP');
assert(html.indexOf('<section class="releaseBanner"')>=0&&html.indexOf('<section class="releaseBanner"')<html.indexOf('<details class="panel homeChangelog" open>'),'release banner before homepage changelog');
assert(html.includes('src="'+releaseBannerPath+'"'),'homepage loads v0.11 release art');
assert(html.includes('var(--elite-name)')&&html.includes('var(--boss-name)'),'different Elite/Boss name colors');
assert(html.includes('combatEnemyName')&&html.includes("e.miniboss?' eliteName'"),'Elite styling in live combat');
assert(html.includes("e.boss?' bossName'"),'Boss styling in live combat');
assert(html.includes('elitePreview:not(.bossPreview)>strong')&&html.includes('.bossPreview>strong'),'Elite/Boss name styling in wave previews');
assert(html.includes('bossEncounter')&&html.includes('eliteEncounter'),'Elite/Boss name styling in mobile decision panel');

console.log('PASS v0.10.0 UI, mana, header, elite names, boss preview and responsive backgrounds.');
