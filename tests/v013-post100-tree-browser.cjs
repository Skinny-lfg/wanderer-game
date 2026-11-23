'use strict';
// Stage 6.27: real browser Talent Atlas UI, disposable local preview and QA-only
// XP fixture. Never mutates production saves or claims that test XP was earned.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const output=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim();
const prefix='Isolated automatic RPG preview: ';
assert(output.startsWith(prefix));
const root=path.resolve(output.slice(prefix.length)),entry=path.join(root,'index.html');
let html=fs.readFileSync(entry,'utf8'),anchor='phase1Init();\nconst phase3RestoredScroll';
assert.equal(html.split(anchor).length,2,'Preview boot injection anchor drifted');
const QA=`globalThis.__post100BrowserQA={
 fund(totalXp){
  if(phase1Controller.state.stage!=='camp'||state.run)throw Error('QA funding only at Camp');
  if(![0,10000,10100,10400].includes(totalXp))throw Error('QA-only XP fixture');
  state.automaticTalents=WandererAutomaticTalents.award(WandererAutomaticTalents.create(),totalXp);
  render();
 },
 snapshot(){const t=WandererAutomaticTalents,p=state.automaticTalents;return {
  xp:p.xp,talents:t.earned(p),statPoints:t.attributeBudget(p),
  available:t.availableAttributes(p),allocated:t.attributes(p),valid:t.valid(p)
 };}
};`;
html=html.replace(anchor,'phase1Init();\n'+QA+'\nconst phase3RestoredScroll');
fs.writeFileSync(entry,html);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://127.0.0.1').pathname,filename=path.resolve(root,name==='/'?'index.html':decodeURIComponent(name.slice(1)));
 if(!filename.startsWith(root+path.sep)&&filename!==entry){res.writeHead(403).end();return;}
 fs.readFile(filename,(err,b)=>{if(err){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});res.end(b);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port;
 const report=path.resolve(process.env.V013_UI_EVIDENCE_DIR||'reports/v013-stage627-browser');
 fs.mkdirSync(report,{recursive:true});let browser;
 try{
  const launch={headless:true};if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
  browser=await chromium.launch(launch);
  for(const [width,height] of [[1280,800],[390,844]]){
   const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   page.on('dialog',dialog=>dialog.accept());
   page.setDefaultTimeout(15000);
   try{
    await page.goto(url,{waitUntil:'load'});
    await page.locator('[data-phase3-nav="talents"]').click();
    const tree=page.frameLocator('iframe[title="Talent tree"]');
    const button=stat=>tree.locator('.post100Choices button[data-attribute="'+stat+'"]');
    await tree.locator('.post100Attributes').waitFor();
    assert.equal(await button('agi').isDisabled(),true,'No stat purchases at Level 1');
    await page.evaluate(()=>__post100BrowserQA.fund(10000));
    await tree.locator('.post100Attributes').waitFor();
    assert.equal(await button('agi').isDisabled(),true,'No stats at exactly 100 Talent points');
    await page.evaluate(()=>__post100BrowserQA.fund(10100));
    await tree.locator('.post100Attributes').waitFor();
    assert.equal(await button('agi').isEnabled(),true);
    await button('agi').click();
    const saved=await page.evaluate(()=>__post100BrowserQA.snapshot());
    assert.equal(saved.xp,10100);assert.equal(saved.talents,100);
    assert.equal(saved.allocated.agi,1);assert.equal(saved.available,0);
    assert(saved.valid,'Real saved Talent progress must remain valid');
    assert.equal(await button('end').isDisabled(),true,'No duplicate attribute point');
    await tree.getByRole('button',{name:'Reset talents'}).click();
    const afterReset=await page.evaluate(()=>__post100BrowserQA.snapshot());
    assert.equal(afterReset.allocated.agi,1,'Talent respec must preserve stats');
    await page.screenshot({path:path.join(report,'talent-post100-'+width+'.png')});
    assert.deepEqual(errors,[],'No browser JS/resource errors');
   }finally{await context.close();}
  }
  fs.writeFileSync(path.join(report,'result.json'),JSON.stringify({stage:'6.27',status:'pass',viewports:['1280x800','390x844'],source:'isolated native browser, synthetic QA XP only'},null,2));
  console.log('STAGE627_BROWSER_OK: Talent Atlas + AGI purchase + save + reset + 2 viewports');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
