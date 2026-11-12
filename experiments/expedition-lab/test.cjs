const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true});
 try{for(const [width,build,route] of [[390,'Vanguarda',['Bosque infestado','Caminho das feras']],[1280,'Duelista',['Ruínas antigas','Torre esquecida']]]){
  const page=await browser.newPage({viewport:{width,height:850}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/experiments/expedition-lab/');
  await page.getByRole('button',{name:new RegExp(build)}).click();
  await page.locator('#talents button').first().click();
  for(const node of [...route,'Guardião do portal']){
   await page.getByRole('button',{name:new RegExp(node)}).click();
   await page.waitForFunction(()=>{const img=document.querySelector('#enemies img');return img?.complete&&img.naturalWidth>0;});
   await page.locator('#start').click();
   await page.locator('#next').waitFor({state:'visible',timeout:30000});
   await page.locator('#next').click();
  }
  assert.match(await page.locator('#encounter-title').innerText(),/concluída/);
  assert.match(await page.locator('#progress').innerText(),/Nível [234]/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  await page.locator('#reset').click();
  assert.match(await page.locator('#progress').innerText(),/Nível 1/);
  console.log(`PASS ${width}px: ${build}, rota, XP, talento, boss e reinício`);
  await page.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

