// Account dialog viewport smoke test; no login or remote Firebase write is performed.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname,file=path.resolve(root,pathname==='/'?'index.html':'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
 fs.readFile(file,(error,body)=>{if(error){res.statusCode=404;return res.end();}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(body);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const width of [360,390,430,768,1280,1440]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.setDefaultTimeout(7000);page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await page.goto(base,{waitUntil:'domcontentloaded'});if(width<=650)await page.locator('#menuToggle').click();await page.locator('[data-online-action="account"]').click();
  const dialog=page.locator('.v012AccountDialog');await dialog.waitFor({state:'visible'});
  assert.equal(await dialog.evaluate(node=>node.matches(':modal')),true,'the account and email/Google login dialog must be the active modal');
  await page.locator('.v012AccountDialog input[type=email]').waitFor({state:'visible'});await page.locator('.v012AccountDialog [data-google]').waitFor({state:'visible'});
  const box=await dialog.boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1,'account dialog must fit viewport '+width);
  assert.deepEqual(errors,[],'account dialog must render without JavaScript errors '+width);
  await page.locator('.v012AccountDialog [data-close]').click();
  if(width<=650)await page.locator('#menuToggle').click();
  await page.locator('[data-online-action="feedback"]').click();
  const feedback=page.locator('.wandererFeedbackDialog');await feedback.waitFor({state:'visible'});
  assert.equal(await feedback.locator('textarea[name="description"]').isVisible(),true,'feedback form must be visible');
  console.log('PASS Account and feedback dialogs '+width+'px: email/Google controls and report form are visible; no sign-in or report submitted');await page.close();
 }}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
