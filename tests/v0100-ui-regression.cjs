// v0.10.0 UI and boss metadata regression — no Firebase or live saves.
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('<script>'),end=html.indexOf('</script>',start);
assert(start>=0&&end>start);
new Function(html.slice(start+8,end));
for(const needle of ['<title>Wanderer v0.10.0</title>','class="version">v0.10.0','id="menuToggle"','id="onlineActions"','class="headerBottom"','id="heroMpFill"','bossPreviewMarkup(r.tier,upcoming)','Gravebound Bulwark','Bloodscar Ravager','Sanguine Wraith','Voidborne Hexer','The Abyssal Guardian','Rift Harbinger','Ember Sovereign'])assert(html.includes(needle),'Missing feature: '+needle);
assert(html.includes("if(mpBar&&mpFill)"),'Mana bar updates every combat tick');
const {harness}=require('../scripts/simulate-v091.cjs');
const sim=harness('index.html',{legendary:true});
for(const level of [10,20,30])assert.equal(sim.inspect.wavesForDungeon(level),5);
console.log('PASS v0.10.0 UI, mana, header, elite names, and boss preview.');
