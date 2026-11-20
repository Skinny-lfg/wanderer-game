'use strict';
// Actual Chromium click-through of the live City Center Forge (isolated state).
// No authentication, saved player account, deployment or forged combat results.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const boot='phase1Init();\nconst phase3RestoredScroll=phase3RestoreUILocation(phase3SavedUILocation);\nrender();';
assert(source.includes(boot));
function fixture(){
 globalThis.__forgeProbe={
  setup(){
   phase1Controller.state.stage='camp';phase1Controller.state.unlocked=1;
   state.run=null;state.fragments=1500;state.crafting.essence=500;
   view='city-center';phase3CityTab='blacksmith';render();
   document.body.classList.remove('v012Preboot');
   document.getElementById('screen')?.removeAttribute('inert');
   return {fragments:state.fragments,essence:state.crafting.essence};
  },
  snapshot(){
   const item=state.stash.filter(x=>x.crafted).at(-1);
   return {fragments:state.fragments,essence:state.crafting.essence,
    craft:item?{id:item.id,recipeId:item.recipeId,slot:item.slot,rarity:item.rarity,
     armorType:item.armorType,affixes:item.affixes,profile:item.craftingProfile}:null};
  }
 };
}
const html=source.replace(boot,boot+'\n('+fixture.toString()+')();');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.gif':'image/gif','.mjs':'text/javascript'};
const server=http.createServer((req,res)=>{
 const rel=new URL(req.url,'http://local').pathname==='/'?'index.html':decodeURIComponent(new URL(req.url,'http://local').pathname.slice(1));
 const file=path.resolve(root,rel);
 if(rel!=='index.html'&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 try{const data=rel==='index.html'?Buffer.from(html):fs.readFileSync(file);
  res.writeHead(200,{'Content-Type':types[path.extname(rel)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Missing');}
});
test('v013 native Forge: only randomized crafting, no obsolete upgrade or paid attribute UI (390/1280)',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.WANDERER_BROWSER||process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const out=path.resolve(root,process.env.V013_UI_EVIDENCE_DIR||'reports/v013-forge-ui-evidence');
 fs.mkdirSync(out,{recursive:true});
 try{
  for(const width of [390,1280]){
   const ctx=await browser.newContext({viewport:{width,height:900}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/?expeditionPhase1=1');
   const initial=await page.evaluate(()=>__forgeProbe.setup());
   assert.equal(await page.getByRole('heading',{name:'Forge',exact:true}).count(),1);
   assert.equal(await page.locator('#v013RecipeRarity').count(),1);
   assert.equal(await page.locator('#v013CraftFocus').count(),0);
   assert.equal(await page.locator('#v013UpgradeTier').count(),0);
   assert.equal(await page.locator('#upgradeLegendaryBtn').count(),0);
   assert.equal(await page.locator('[data-blacksmith-operation]').count(),0);
   await page.locator('#v013RecipeSlot').selectOption('gloves');
   await page.locator('#v013Recipe').selectOption('green_gloves_plate');
   assert.match(await page.locator('.v013ForgeHeading').innerText(),/all stat rolls vary/i);
   assert.equal(await page.locator('#v013Craft').isEnabled(),true);
   await page.screenshot({path:path.join(out,'forge-preview-'+width+'.png'),fullPage:true});
   const before=await page.evaluate(()=>__forgeProbe.snapshot());
   await page.locator('#v013Craft').click();
   const after=await page.evaluate(()=>__forgeProbe.snapshot());
   assert(after.craft,'real Forge did not insert a crafted item');
   assert.equal(after.craft.recipeId,'green_gloves_plate');
   assert.equal(after.craft.armorType,'Plate');
   assert.equal(after.craft.slot,'gloves');
   assert.equal(after.craft.rarity,'Uncommon');
   assert.equal(after.craft.affixes.length,2);
   assert(after.fragments<before.fragments&&after.essence<before.essence);
   assert.equal(await page.locator('dialog[open]').count(),1);
   await page.screenshot({path:path.join(out,'forge-crafted-'+width+'.png'),fullPage:true});
   assert.deepEqual(errors,[]);
   console.log('PASS v013 Forge '+width+'px: no obsolete operations, legal random gloves craft, native materials and UI');
   await ctx.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});