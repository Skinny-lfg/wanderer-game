// Isolated v0.12 browser integration: controller -> real events -> draft -> boss.
// Uses artificial gear, in-memory preview only, never logs into a real account.
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();render();';
assert(html.includes(boot),'preview startup anchor');
const fixture=[
 "if(PHASE1_PREVIEW){",
 "phase1Init();state.equip.weapon=makeItem(200,'weapon',null,'loot','Sword','Rare');",
 "for(const slot of ['helm','armor','gloves','boots','amulet','ring1','ring2','belt'])state.equip[slot]=makeItem(200,slot,null,'loot','random','Rare');",
 "state.equip.offhand=makeItem(200,'offhand',null,'loot','Shield','Rare');state.gold=20000;state.fragments=20000;",
 "globalThis.__audit={start:()=>phase1Begin(1),state:()=>({stage:phase1Controller.state.stage,realm:phase1Controller.state.planeIndex,completed:phase1Controller.state.history.length,event:phase1Controller.state.selected?.event||null,active:!!state.run,bag:phase3BagItems().length,overflow:phase3BagOverflow(),capacity:PHASE3_BAG_CAPACITY,unlock:phase1Controller.state.unlocked,reserved:(phase1Controller.state.version===2?Object.values(phase1Controller.state.eventsByRealm):phase1Controller.state.eventIds).filter(Boolean).length,options:document.querySelectorAll('[data-event-choice], [data-phase1-event-choice]').length}),",
 "step:()=>{const g=phase1Controller.state;if(phase1Draft?.step==='element'){phase2ChooseElement('fire');return 'element';}",
 "if(phase1Draft?.step==='passive'){phase2ChoosePassive(phase1Draft.options[0].id);return 'passive';}",
 "if(phase5Results.review==='realm'&&!phase1Draft){phase5ExitResult();return 'exit';}",
 "if(g.stage==='choice'){if(!g.initialFamily){phase2ChooseInitial('blood');return 'initial';}",
 "if(phase3BagItems().length>=6){const item=phase3BagItems()[0];if(item&&phase3CanPrepare()){phase3DiscardLoot(item.id);return 'discard';}}",
 "if(g.offers.length){const choice=g.planeIndex===1?g.offers.find(p=>p.family==='blood'):g.offers[0];phase1Choose(choice.id);phase1Enter();return 'enter';}}",
 "if(g.stage==='combat'&&g.selected?.event&&!state.run){phase6EventChoice(2);return 'event';}",
 "const r=state.run;if(r?.status==='fight'){for(let i=0;i<2500&&state.run===r&&r.status==='fight';i++)updateFight();return 'fight';}",
 "return 'waiting';}};render();",
 "}else{load();if(!state.merchant)rollShop();save();render();}"
].join('\n');
const pageHtml=html.replace(boot,fixture);
const mime={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),p=url.pathname==='/'?path.join(root,'index.html'):path.resolve(root,'.'+url.pathname);
 if(p!==path.join(root,'index.html')&&!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(pageHtml);return;}
 fs.readFile(p,(err,buf)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(err?'missing':buf);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [390,1280]){
   const page=await browser.newPage({viewport:{width,height:900}}),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
   await page.addInitScript(()=>{
    localStorage.setItem('wanderer_browser_proto_v01','LEGACY_SENTINEL_KEEP');
    localStorage.setItem('wanderer_account_browser_fixture','ACCOUNT_SENTINEL_KEEP');
    const old=window.setTimeout;window.setTimeout=(fn,ms,...args)=>old(fn,ms===650?5:ms,...args);
   });
   await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
   await page.goto(origin+'/?expeditionPhase1=1',{waitUntil:'domcontentloaded'});
   await page.evaluate(()=>__audit.start());
   let events=0,drafts=0,discard=0,index=0;
   for(index=0;index<1300;index++){
    const state=await page.evaluate(()=>__audit.state());
    assert.equal(state.capacity,6);
    if(state.stage==='finished')break;
    assert.notEqual(state.stage,'failed','synthetic hero died');
    if(state.event)assert.equal(state.options,3,'two event offers plus refusal');
    const action=await page.evaluate(()=>__audit.step());
    if(action==='event')events++;
    if(action==='passive')drafts++;
    if(action==='discard')discard++;
    if(index%10===0||action==='waiting')await page.waitForTimeout(12);
   }
   const end=await page.evaluate(()=>__audit.state());
   assert(index<1300,'stalled '+JSON.stringify(end));
   assert.equal(end.completed,15);assert.equal(end.unlock,2);
   assert.equal(events,end.reserved);assert([3,4].includes(events));
   assert.equal(drafts,14);
   assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_browser_proto_v01')),'LEGACY_SENTINEL_KEEP');
   assert.equal(await page.evaluate(()=>localStorage.getItem('wanderer_account_browser_fixture')),'ACCOUNT_SENTINEL_KEEP');
   assert(!requests.some(url=>url.includes('/online/app.mjs')),'no account access');
   assert.deepEqual(errors,[],'no JS exceptions');
   console.log('PASS isolated v0.12 Expedition @'+width+'px',JSON.stringify({events,drafts,discard,index}));
   await page.close();
  }
 }finally{await browser.close();await new Promise(done=>server.close(done));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
