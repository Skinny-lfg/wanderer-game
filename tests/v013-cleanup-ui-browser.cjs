'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert'),{execFileSync}=require('child_process'),{chromium}=require('playwright');
(async()=>{
 const root=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim().replace('Isolated automatic RPG preview: ','');
 // Test-only hook in the temporary build; never written to the game or Pages.
 const entry=path.join(root,'index.html'),boot='phase1Init();\nconst phase3RestoredScroll';let source=fs.readFileSync(entry,'utf8');assert(source.includes(boot));source=source.replace(boot,"globalThis.cleanupAudit={finish(){const r=state.run;r.hp=r.maxhp=100000;for(let i=0;i<30&&r.status==='fight';i++){for(const e of r.enemies||[r.enemy])e.hp=0;phase1WaveWon();}},presentation:phase6EventOptionPresentation,effects:phase6EffectMarkup};\n"+boot);fs.writeFileSync(entry,source);
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname,file=path.join(root,pathname==='/'?'index.html':pathname);fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.gif':'image/gif'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let b;
 try{
 b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port);

 const eventCopy=await p.evaluate(()=>['cursed_chest','forgotten_arsenal','bounty_writ'].map(id=>cleanupAudit.presentation({id},id==='cursed_chest'?1:0,[]).benefit));assert(eventCopy[0].includes('4 Essence'));assert(eventCopy[1].includes('6 Essence'));assert(!/equipment/i.test(eventCopy[2]));
 assert.equal(await p.locator('[data-phase3-expedition-level]').count(),1,'one Expedition selector');
 assert(!/Not tracked/.test(await p.locator('.phase3Journey').innerText()));
 await p.setViewportSize({width:390,height:844});
 fs.mkdirSync('reports/cleanup-stage2',{recursive:true});await p.screenshot({path:'reports/cleanup-stage2/camp-mobile.png',fullPage:true});
 await p.locator('.phase3CampSideStats').scrollIntoViewIfNeeded();await p.locator('.phase3CampStickyStart a').waitFor({state:'visible'});
 await p.locator('.phase3CampStickyStart a').click();
 await p.locator('#phase3Difficulty').waitFor({state:'visible'});
 await p.locator('[data-phase1-expedition]:visible').first().click();
 assert.equal(await p.locator('#phase2EnterRealm').count(),0,'Realm entry belongs to its inspection dialog');
 assert(!/\bwaves?\b/i.test(await p.locator('#screen').innerText()));
 await p.locator('[data-phase1-plane]').first().click();
 await p.getByRole('button',{name:'Enter Realm',exact:true}).click();
 await p.locator('.arenaEnemy').first().waitFor();
 await p.evaluate(()=>cleanupAudit.finish());
 await p.locator('#phase5ExitRealm').click();
 await p.getByRole('tab',{name:'Equipment',exact:true}).waitFor();
 await p.getByRole('tab',{name:'Equipment',exact:true}).click();assert(await p.locator('.phase3BetweenEquipment').isVisible());
 await p.getByRole('tab',{name:'Stats & Abilities',exact:true}).click();assert(await p.locator('.phase3BetweenBuild').isVisible());
 await p.getByRole('tab',{name:'Realm',exact:true}).click();
 assert.equal(await p.locator('#phase2EnterRealm').count(),0);
 assert(await p.locator('#phase4Extract').isVisible());
 assert(!/\bwaves?\b|Choose your Realm passive/i.test(await p.locator('#screen').innerText()));
 await p.screenshot({path:'reports/cleanup-stage2/between-mobile.png',fullPage:true});
 await p.locator('#phase4Extract').click();
 assert(!/\bwaves?\b/i.test(await p.locator('#screen').innerText()));
 await p.setViewportSize({width:1440,height:900});
 assert.deepEqual(errors,[]);
 console.log('PASS: one Expedition selector, mobile shortcut, node-only entry, Between Realms tabs, extraction and no obsolete wave instructions.');
 }finally{if(b)await b.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
