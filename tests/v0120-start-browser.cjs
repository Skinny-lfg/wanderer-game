// Isolated functional UI fixture; forced Wave completion, no combat simulation or real-save IO.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();render();';assert(source.includes(boot));
const fixture=`if(PHASE1_PREVIEW){phase1Init();
 globalThis.__realmTest={snapshot:()=>({game:JSON.parse(JSON.stringify(phase1Controller.state)),picks:phase1Build?.picks||[],element:phase1Build?.element||null,draft:phase1Draft?.kind||null,active:!!state.run,status:state.run?.status||null}),
 win:()=>{if(state.run?.status!=='fight')throw Error('No active Wave');state.run.enemy.hp=0;phase1WaveWon();},initial:phase2ChooseInitial,element:phase2ChooseElement,passive:phase2ChoosePassive};render();
}else{load();if(!state.merchant)rollShop();save();render();}`;
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://fixture'),file=path.resolve(root,'.'+u.pathname);
 if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(source.replace(boot,fixture));}
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 fs.readFile(file,(e,body)=>{res.statusCode=e?404:200;res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(e?'Missing':body);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [390,1280])for(const entry of ['blood','decay','vitality','aegis','fury','magic','legacy-choice']){const legacy=entry==='legacy-choice',family=legacy?'blood':entry;
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{localStorage.setItem('wanderer_browser_proto_v01','UNTOUCHED');window.setInterval=()=>0;const native=window.setTimeout;window.setTimeout=(f,ms,...args)=>native(f,ms===650?5:ms,...args);});
 await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const url=base+'/?expeditionPhase1=1&expeditionSave=1&validationSlot=start_'+family;
 const ready=()=>page.waitForFunction(()=>WandererGame.validationStatus().ready),snap=()=>page.evaluate(()=>__realmTest.snapshot());
 await page.goto(url);await ready();await page.locator('[data-phase1-expedition="1"]').click();assert.equal(await page.locator('[data-phase2-initial]').count(),6);
 // Cover fresh players, saved affinity selection and pre-fix first-Realm preparation.
 if(family!=='blood'||legacy){await page.reload();await ready();assert.equal(await page.locator('[data-phase2-initial]').count(),6);}
 if(legacy){await page.evaluate(()=>__realmTest.initial('blood'));assert.equal((await snap()).active,false);await page.reload();await ready();}else await page.locator('[data-phase2-initial="'+family+'"]').click();
 if(family==='magic'){assert.equal((await snap()).picks.length,0);await page.reload();await ready();await page.locator('[data-phase2-element="lightning"]').click();}
 let s=await snap();assert.equal(s.active,true,'initial affinity must enter its first Realm');assert.equal(s.status,'fight');assert.equal(s.game.selected.family,family);assert.equal(s.picks.length,1);
 assert.equal(await page.evaluate(f=>__realmTest.initial(f),family),false);
 await page.reload();await ready();assert.equal((await snap()).picks.length,1);await page.locator('#phase4Resume').click();assert.equal((await snap()).status,'fight');
 const waves=(await snap()).game.selected.waves;for(let n=0;n<waves;n++){await page.waitForFunction(()=>__realmTest.snapshot().status==='fight');await page.evaluate(()=>__realmTest.win());}
 await page.locator('#phase5ExitResult').click();await page.locator('[data-phase2-passive]').first().click();s=await snap();assert.equal(s.game.planeIndex,2);assert.equal(s.picks.length,2);assert.equal(s.active,false);
 await page.locator('[data-phase1-plane]').first().click();assert.equal((await snap()).active,false);assert(await page.locator('#phase2EnterRealm').isEnabled());await page.locator('#phase2EnterRealm').click();if(await page.locator('[data-phase2-element="fire"]').count())await page.locator('[data-phase2-element="fire"]').click();assert.equal((await snap()).status,'fight');
 assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'UNTOUCHED');assert.deepEqual(errors,[]);await context.close();console.log('PASS initial flow '+entry+' '+width+'px: saved selection, starter once, real entry, refresh and explicit Realm 2');
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
