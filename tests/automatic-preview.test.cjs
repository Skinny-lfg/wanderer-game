'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
test('preview uses a separate local save namespace and does not load account services',()=>{
 const out=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim();
 const dir=out.slice('Isolated automatic RPG preview: '.length),html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),save=fs.readFileSync(path.join(dir,'online/v012-save.js'),'utf8');
 assert(html.includes('globalThis.__WANDERER_CLOUD_ONLY__=false;'));assert(html.includes('const PHASE5_VALIDATION=true;'));
 for(const file of ['v012-auth-bootstrap.js','v012-account.mjs','v012-feedback.mjs','v012-leaderboard-ui.mjs'])assert(!html.includes('src="online/'+file));
 assert(save.includes("PREFIX='wanderer_automatic_rpg_preview_v1_'"));assert(!fs.existsSync(path.join(dir,'online/firebase-client.mjs')));
 assert(fs.existsSync(path.join(dir,'combat/automatic-talents.js')));
 assert.match(html,/src="combat\/v012-buildcraft\.js\?v=[a-f0-9]{12}"/);assert.match(html,/src="online\/v012-expedition-runtime\.js\?v=[a-f0-9]{12}"/);assert.match(html,/src="combat\/v012-combat-runtime\.js\?v=[a-f0-9]{12}"/);
 const refs=[...html.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^\"]*)?"/g)].map(x=>x[1]).filter(x=>/^(online|combat|economy|assets)\//.test(x)&&!x.includes("'"));
 assert.deepEqual(refs.filter(x=>!fs.existsSync(path.join(dir,x))),[],'all local entrypoint files are present');
 const storage=new Map([['wanderer_v012_endless_v1_local','untouched production-like data']]);
 const create=require('./v012-economy-harness.cjs'),game=create(17,html,{}, {root:dir,validationStorage:storage});
 assert.equal(game.debug().phase5Ready,true);game.start(1);game.initial('blood');const offer=game.controller().state.offers.find(x=>x.family==='blood');game.select(offer.id);assert.equal(game.enter(),true);
 while(game.controller().state.planeIndex===1){const run=game.state().run;assert(run?.enemy);run.enemy.hp=0;game.win();game.flush();}
 const earnedXP=game.state().automaticTalents.xp;assert(earnedXP>0);
 assert.equal(storage.get('wanderer_v012_endless_v1_local'),'untouched production-like data');
 assert(storage.has('wanderer_automatic_rpg_preview_v1_local'));
 const reload=create(17,html,{}, {root:dir,validationStorage:storage});assert.equal(reload.debug().phase5Ready,true);assert.equal(reload.state().automaticTalents.xp,earnedXP);
 const play=reload;
 for(let i=0;i<300&&!['finished','failed'].includes(play.controller().state.stage);i++){
  if(play.draft()?.step==='passive')play.passive(play.draft().options[0]?.id??null);
  else if(play.results().review||play.state().run?.status==='cleared'||play.results().eventExitPending)play.exitResult();
  else if(play.events.run()?.event)assert.equal(play.events.choose(2),true);
  else if(play.state().run?.status==='fight'){play.state().run.enemy.hp=0;play.win();play.flush();}
  else if(play.controller().state.stage==='choice'){
   while(play.bag.items().length>=play.bag.capacity()||play.bag.overflow()){const item=play.bag.items().at(-1);assert(item&&play.bag.discard(item.id));}
   play.select(play.controller().state.offers.find(x=>play.controller().reachable(x)).id);assert.equal(play.enter(),true);
   if(play.draft()?.step==='element')play.element('fire');
  }else throw Error('Unexpected preview state: '+JSON.stringify(play.debug()));
 }
 assert.equal(play.controller().state.stage,'finished');assert.equal(play.controller().state.history.length,15);
 assert.equal(play.state().pendingRuneReward.options.length,3);assert.equal(play.claimRune(play.state().pendingRuneReward.options[0].id),true);
 assert(play.state().automaticTalents.xp>30);assert.equal(storage.get('wanderer_v012_endless_v1_local'),'untouched production-like data');
 const secondStorage=new Map(),talented=create(23,html,{}, {root:dir,validationStorage:secondStorage});talented.state().automaticTalents={xp:200,nodes:['might','passive_bleeding_edge']};
 talented.start(1);talented.initial('blood');const selected=talented.controller().state.offers.find(x=>x.family==='blood');talented.select(selected.id);talented.enter();
 assert.equal(talented.buildcraft.rank(talented.build(),'bleeding_edge'),1);
 while(talented.controller().state.planeIndex===1){talented.state().run.enemy.hp=0;talented.win();talented.flush();}
 assert.equal(talented.draft(),null);const resumed=create(23,html,{}, {root:dir,validationStorage:secondStorage});assert.equal(resumed.draft(),null);assert(resumed.buildcraft.rank(resumed.build(),'bleeding_edge')>=1);
});
