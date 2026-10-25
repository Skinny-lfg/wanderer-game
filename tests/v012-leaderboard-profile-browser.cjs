'use strict';
// Isolated public leaderboard -> profile journey. Uses an in-page fake backend;
// no Firebase connection, player saves, or writes are performed.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const leaderboardSource=fs.readFileSync(path.join(root,'online/v012-leaderboard-ui.mjs'),'utf8');
const importLine="import {createBackend} from './firebase-client.mjs?v=v012-public-profiles-1';";
assert.equal(leaderboardSource.split(importLine).length,2,'Leaderboard must share the version-pinned backend');
const fixtureSource=leaderboardSource.replace(importLine,'const createBackend=async()=>globalThis.__fakeBackend;');
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<link rel="stylesheet" href="/online/v012-required-auth.css"></head>'+
 '<body class="phase3IntegratedPreview">'+
 '<div id="onlineBar"><button type="button" data-online-action="leaderboard">Leaderboard</button></div>'+
 '<button id="menuToggle" aria-expanded="true">Menu</button>'+
 '<script type="module" src="/online/v012-leaderboard-ui.mjs"></script></body></html>';
const mime={'.css':'text/css','.mjs':'text/javascript','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const rel=new URL(req.url,'http://local').pathname;
 if(rel==='/'){res.writeHead(200,{'Content-Type':'text/html'});return res.end(html);}
 if(rel==='/online/v012-leaderboard-ui.mjs'){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end(fixtureSource);}
 const file=path.resolve(root,'.'+rel);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(error,data)=>{
  if(error){res.writeHead(404);return res.end('Missing');}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);
 });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(()=>{
    globalThis.__profileAudit={calls:[]};
    globalThis.__fakeBackend={
     currentUser:()=>({uid:'viewer',isAnonymous:false}),
     listV012CommunityScores:async()=>[
      {uid:'user_a',nickname:'alpha',best:18},
      {uid:'user_b',nickname:'beta',best:18},
      {uid:'user_c',nickname:'gamma',best:9},
      {uid:'user_x',nickname:'<img src=x onerror=x>',best:1}
     ],
     readV012PublicProfile:async uid=>{
      globalThis.__profileAudit.calls.push(uid);
      if(uid==='user_a')return {nickname:'alpha',characterId:'ranger'};
      if(uid==='user_b')return {nickname:'beta',characterId:'knight'};
      if(uid==='user_c')throw Error('Permission denied');
      return {nickname:'<img src=x>',characterId:'../../not-allowed'};
     }
    };
   });
   await page.goto('http://127.0.0.1:'+server.address().port+'/');
   await page.locator('[data-online-action="leaderboard"]').click();
   const dialog=page.locator('dialog.v012LeaderboardDialog');
   await dialog.waitFor({state:'visible'});
   await page.waitForFunction(()=>document.querySelectorAll('.v012RankPlayerButton').length===4);
   assert.equal(await page.locator('.v012RankScore').first().textContent(),'E18');
   const buttons=page.locator('.v012RankPlayerButton');
   await buttons.nth(0).click();
   await page.waitForFunction(()=>document.querySelector('[data-player-character]').textContent.includes('Ranger'));
   assert.equal(await page.locator('[data-player-rank]').textContent(),'#1');
   assert.equal(await page.locator('[data-player-best]').textContent(),'E18');
   assert.equal(await page.locator('[data-player-avatar]').getAttribute('src'),'assets/characters/avatars/ranger.png');
   assert.equal(await page.locator('[data-leaderboard-overview]').isHidden(),true);
   await page.locator('[data-leaderboard-back]').click();
   assert.equal(await buttons.nth(0).isFocused(),true,'Back returns focus to selected player');
   await buttons.nth(1).click();
   await page.waitForFunction(()=>document.querySelector('[data-player-character]').textContent.includes('Warrior'));
   assert.equal(await page.locator('[data-player-rank]').textContent(),'#1','tied players share the same position');
   await page.locator('[data-leaderboard-back]').click();
   await buttons.nth(2).click();
   await page.waitForFunction(()=>document.querySelector('[data-player-message]').textContent.includes('Unable to load public profile'));
   assert.equal(await page.locator('[data-player-rank]').textContent(),'#3');
   assert.equal(await page.locator('[data-player-best]').textContent(),'E9');
   await page.locator('[data-leaderboard-back]').click();
   await buttons.nth(3).click();
   await page.waitForFunction(()=>document.querySelector('[data-player-message]').textContent.includes('Limited public'));
   assert.equal(await page.locator('[data-leaderboard-player] img:not([hidden])').count(),0,'Untrusted avatar path must not be rendered');
   assert.equal(await page.locator('[data-leaderboard-player] img[src*="onerror"]').count(),0,'Nickname must never render injected HTML');
   assert.deepEqual(await page.evaluate(()=>globalThis.__profileAudit.calls),['user_a','user_b','user_c','user_x']);
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!document.querySelector('dialog.v012LeaderboardDialog'));
   assert.deepEqual(errors,[],'No uncaught browser errors');
   console.log('PASS read-only leaderboard player profile '+width+'px');
   await page.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
