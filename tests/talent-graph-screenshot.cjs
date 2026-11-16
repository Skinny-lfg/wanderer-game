'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const output=path.join(root,'reports/v013-red-diagonal-preview');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  let filename=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(filename!==root&&!filename.startsWith(root+path.sep)){res.writeHead(403).end();return}
  if(fs.existsSync(filename)&&fs.statSync(filename).isDirectory())filename=path.join(filename,'index.html');
  if(!fs.existsSync(filename)){res.writeHead(404).end('Not found');return}
  res.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');
  res.end(fs.readFileSync(filename));
 }catch(e){res.writeHead(500).end(String(e))}
});
const listen=()=>new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
(async()=>{
 await listen();
 fs.mkdirSync(output,{recursive:true});
 const base='http://127.0.0.1:'+server.address().port+'/preview/talent-rebuild/index.html';
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const spec of [
   {name:'desktop',viewport:{width:1920,height:1080},deviceScaleFactor:1},
   {name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:1}
  ]){
   const page=await browser.newPage({viewport:spec.viewport,deviceScaleFactor:spec.deviceScaleFactor});
   const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   const response=await page.goto(base,{waitUntil:'networkidle',timeout:30000});
   assert.equal(response.status(),200);
   await page.waitForFunction(()=>document.querySelectorAll('#nodes > .node').length===375,{timeout:20000});
   assert.equal(await page.locator('#nodes > .node').count(),375,'All talent nodes must render');
   assert.equal(await page.locator('#links > line, #links > polyline').count()>490,true,'Talent prerequisites must be drawn');
   assert.deepEqual(errors,[],spec.name+' JavaScript errors');
   await page.screenshot({path:path.join(output,'atlas-'+spec.name+'.png'),fullPage:true});
   const vitality=page.locator('#families button').filter({hasText:'Vitality'});
   assert.equal(await vitality.count(),1);
   await vitality.click();
   await page.screenshot({path:path.join(output,'vitality-'+spec.name+'.png'),fullPage:true});
   console.log('PASS '+spec.name+': 375 nodes, links rendered, no JS errors, 2 screenshots');
   await page.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
