'use strict';
// Isolated responsive visual regression for CSS-only UI restoration.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),before=process.env.UI_RESTORE_BEFORE==='1',source=before?execFileSync('git',['show','HEAD:index.html'],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';assert(source.includes(boot));
const fixture=`phase1Init();render();globalThis.__ui4={summary:()=>{state.run=null;view='phase1';phase5Results.review='summary';phase5Results.complete=true;phase5Results.realm={log:[{text:'Final strike',kind:'good'}]};phase5Results.summary={level:2,outcome:'extracted',realms:3,families:['blood'],picks:[],seconds:11.4,gold:31,fragments:15,metrics:{damageDealt:204,damageTaken:88},kept:[],lost:[],discarded:[],treasuresKept:[],treasuresLost:[]};phase5RenderResult();phase3RenderNav();}};`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const screens=path.join(root,'docs/ui-restoration-screenshots',before?'before':'after');fs.mkdirSync(screens,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const [width,height] of [[375,812],[430,932],[768,1024],[1440,900],[1920,1080]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.hostname!=='wanderer.test')return route.abort();const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))return route.fulfill({status:403});let body;try{body=fs.readFileSync(file);if(before&&path.extname(file)==='.css')body=execFileSync('git',['show','HEAD:'+path.relative(root,file)],{cwd:root});}catch{return route.fulfill({status:404});}if(url.pathname==='/')body=Buffer.from(source.replace(boot,fixture+'const phase3RestoredScroll=null;'));return route.fulfill({status:200,contentType:mime[path.extname(file)]||'application/octet-stream',body});});
  await page.goto('http://wanderer.test/?expeditionPhase1=1');
  const frame=await page.locator('.phase3Camp').evaluate(el=>getComputedStyle(el));if(before)assert.match(frame.borderImageSource,/seamless-minimal/);else{assert.equal(frame.borderImageSource,'none');assert.equal(frame.borderStyle,'solid');}
  assert.equal(await page.locator('.phase3HeroColumn .slotTile').count(),10);
  await check(page,'Camp',width);await checkStart(page,width);if([1440,430].includes(width))await page.screenshot({path:path.join(screens,'camp-'+width+'.png'),fullPage:true});
  await page.locator('[data-phase3-nav="equipment"]').click();assert.equal(await page.locator('.equipmentOverview .slotTile').count(),10);
  await check(page,'Inventory',width);if([1440,430].includes(width))await page.screenshot({path:path.join(screens,'inventory-'+width+'.png'),fullPage:true});
  await page.locator('[data-phase3-nav="city-center"]').click();await page.locator('[data-city-tab="merchant"]').click();assert.equal(await page.locator('.merchantCompactCard').count(),4);
  await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.activeElement instanceof HTMLButtonElement&&getComputedStyle(document.activeElement).outlineStyle!=='none'),'focus state missing');
  await page.evaluate(()=>document.activeElement.blur());await check(page,'City Center',width);if([1440,430].includes(width))await page.screenshot({path:path.join(screens,'merchant-'+width+'.png'),fullPage:true});
  await page.evaluate(()=>__ui4.summary());const summaryFrame=await page.locator('.phase5VisualSummary').evaluate(el=>getComputedStyle(el));if(before)assert.match(summaryFrame.borderImageSource,/seamless-minimal/);else{assert.equal(summaryFrame.borderImageSource,'none');assert.equal(summaryFrame.borderStyle,'solid');}
  await check(page,'Extraction',width);if([1440,430].includes(width))await page.screenshot({path:path.join(screens,'extraction-'+width+'.png'),fullPage:true});
  assert.deepEqual(errors,[]);await page.close();console.log('PASS UI restoration '+(before?'before ':'after ')+width+'×'+height);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
async function check(page,label,width){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' horizontal scroll '+width);assert(await page.evaluate(()=>[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length).every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0})),label+' clipped button '+width);}

async function checkStart(page,width){const v=await page.locator('.phase3Camp .phase3Start').evaluate(el=>{const r=el.getBoundingClientRect(),p=getComputedStyle(el,'::before'),b=getComputedStyle(el);return{left:parseFloat(p.left),width:parseFloat(p.width),button:r.width,overflow:b.overflow,image:b.backgroundImage,pattern:p.backgroundImage,borderImage:b.borderImageSource}});assert(v.left>=0&&v.left+v.width<=v.button+1,'Start center pattern escapes caps '+width);assert.equal(await page.locator('.phase3Camp .phase3Start').evaluate(el=>getComputedStyle(el).overflow),'hidden');assert.match(v.image,/expedition_left\.png/);assert.match(v.pattern,/expedition_center_tile\.png/);assert.equal(v.borderImage,'none');const nonCta=await page.locator('button:not(.phase3Start)').evaluateAll(xs=>xs.filter(x=>x.getClientRects().length).every(x=>getComputedStyle(x).borderImageSource==='none'&&!getComputedStyle(x).backgroundImage.includes('ui-kit')));assert(nonCta,'non-CTA control should not use decorative UI art '+width);}
