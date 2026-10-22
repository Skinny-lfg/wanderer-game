'use strict';
// Visual regression fixture: state stays in browser memory.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();render();';assert(source.includes(boot));
const fixture=`phase1Init();render();globalThis.__ui4={summary:()=>{state.run=null;view='phase1';phase5Results.review='summary';phase5Results.complete=true;phase5Results.realm={log:[{text:'Final strike',kind:'good'}]};phase5Results.summary={level:2,outcome:'extracted',realms:3,families:['blood'],picks:[],seconds:11.4,gold:31,fragments:15,metrics:{damageDealt:204,damageTaken:88},kept:[],lost:[],discarded:[],treasuresKept:[],treasuresLost:[]};phase5RenderResult();phase3RenderNav();}};`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const screens=path.join(root,'docs/ui4-screenshots');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const [width,height] of [[1440,900],[1280,720],[1024,768],[768,1024],[390,844],[360,800]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.hostname!=='wanderer.test')return route.abort();const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))return route.fulfill({status:403});let body;try{body=fs.readFileSync(file);}catch{return route.fulfill({status:404});}if(url.pathname==='/')body=Buffer.from(source.replace(boot,fixture));return route.fulfill({status:200,contentType:mime[path.extname(file)]||'application/octet-stream',body});});
  await page.goto('http://wanderer.test/?expeditionPhase1=1');
  const frame=await page.locator('.phase3Camp').evaluate(el=>getComputedStyle(el).borderImageSource);assert.match(frame,/gothic-frame.svg/);
  assert.equal(await page.locator('.phase3HeroColumn .slotTile').count(),10);
  await check(page,'Camp',width);if([1280,390].includes(width))await page.screenshot({path:path.join(screens,'camp-after-'+width+'.png'),fullPage:true});
  await page.locator('[data-phase3-nav="equipment"]').click();assert.equal(await page.locator('.equipmentOverview .slotTile').count(),10);
  await check(page,'Inventory',width);if([1280,390].includes(width))await page.screenshot({path:path.join(screens,'inventory-after-'+width+'.png'),fullPage:true});
  await page.locator('[data-phase3-nav="city-center"]').click();await page.locator('[data-city-tab="merchant"]').click();assert.equal(await page.locator('.merchantCompactCard').count(),4);
  await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.activeElement instanceof HTMLButtonElement&&getComputedStyle(document.activeElement).outlineStyle!=='none'),'focus state missing');
  await page.evaluate(()=>document.activeElement.blur());await check(page,'City Center',width);if([1280,390].includes(width))await page.screenshot({path:path.join(screens,'merchant-after-'+width+'.png'),fullPage:true});
  await page.evaluate(()=>__ui4.summary());assert.match(await page.locator('.phase5VisualSummary').evaluate(el=>getComputedStyle(el).borderImageSource),/gothic-frame.svg/);
  await check(page,'Extraction',width);if([1280,390].includes(width))await page.screenshot({path:path.join(screens,'extraction-after-'+width+'.png'),fullPage:true});
  assert.deepEqual(errors,[]);await page.close();console.log('PASS UI.4 '+width+'×'+height);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
async function check(page,label,width){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' horizontal scroll '+width);assert(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length).every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0})),label+' clipped button '+width);}
