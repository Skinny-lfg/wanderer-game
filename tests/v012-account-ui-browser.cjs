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
  await page.goto(base,{waitUntil:'domcontentloaded'});
  const gate=page.locator('#v012AuthGate');await gate.waitFor({state:'visible'});
  assert.equal(await page.locator('.container').evaluate(e=>e.inert),true,'game must be inaccessible before authentication');
  assert.equal(await gate.locator('[data-auth-google]').isVisible(),true,'Google sign-in must be visible');
  assert.equal(await gate.locator('input[type=email]').isVisible(),true,'email sign-in must be visible');
  assert.equal(await gate.locator('input[type=password]').isVisible(),true,'password input must be visible');
  assert.equal(await page.locator('[data-guest]').count(),0,'Guest controls must not be rendered');
  assert.equal(await page.locator('.v012AccountDialog').count(),0,'Account area must not open before authentication');
  const box=await gate.locator('.v012GateAuthPanel').boundingBox();
  assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1,'login gate must fit viewport '+width);
  assert.deepEqual(errors,[],'login gate must render without JavaScript errors '+width);
  console.log('PASS required login gate '+width+'px: no Guest, no unauthenticated gameplay');
  await page.close();
 }}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
