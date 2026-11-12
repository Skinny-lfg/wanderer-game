'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('preview uses a separate local save namespace and does not load account services',()=>{
 const out=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim();
 const dir=out.slice('Isolated automatic RPG preview: '.length),html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),save=fs.readFileSync(path.join(dir,'online/v012-save.js'),'utf8');
 assert(html.includes('globalThis.__WANDERER_CLOUD_ONLY__=false;'));assert(html.includes('const PHASE5_VALIDATION=true;'));
 for(const file of ['v012-auth-bootstrap.js','v012-account.mjs','v012-feedback.mjs','v012-leaderboard-ui.mjs'])assert(!html.includes('src="online/'+file));
 assert(save.includes("PREFIX='wanderer_automatic_rpg_preview_v1_'"));assert(!fs.existsSync(path.join(dir,'online/firebase-client.mjs')));
 assert(fs.existsSync(path.join(dir,'combat/automatic-talents.js')));
 const refs=[...html.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^\"]*)?"/g)].map(x=>x[1]).filter(x=>/^(online|combat|economy|assets)\//.test(x)&&!x.includes("'"));
 assert.deepEqual(refs.filter(x=>!fs.existsSync(path.join(dir,x))),[],'all local entrypoint files are present');
 const storage=new Map([['wanderer_v012_endless_v1_local','untouched production-like data']]);
 const create=require('./v012-economy-harness.cjs'),game=create(17,html,{}, {root:dir,validationStorage:storage});
 assert.equal(game.debug().phase5Ready,true);game.start(1);game.initial('blood');const offer=game.controller().state.offers.find(x=>x.family==='blood');game.select(offer.id);assert.equal(game.enter(),true);
 while(game.controller().state.planeIndex===1){const run=game.state().run;assert(run?.enemy);run.enemy.hp=0;game.win();game.flush();}
 assert.equal(game.state().automaticTalents.xp,30);
 assert.equal(storage.get('wanderer_v012_endless_v1_local'),'untouched production-like data');
 assert(storage.has('wanderer_automatic_rpg_preview_v1_local'));
 const reload=create(17,html,{}, {root:dir,validationStorage:storage});assert.equal(reload.debug().phase5Ready,true);assert.equal(reload.state().automaticTalents.xp,30);
});
