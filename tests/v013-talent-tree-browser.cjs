'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert'),{execFileSync}=require('child_process'),{chromium}=require('playwright');
(async()=>{
 const root=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim().replace('Isolated automatic RPG preview: ','');
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname,file=path.join(root,pathname==='/'?'index.html':pathname);fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.gif':'image/gif'})[path.extname(file)]||'application/octet-stream');res.end(data);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let b;
 try{
 b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const p=await b.newPage({viewport:{width:1440,height:900},hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:'+server.address().port);

 await p.getByRole('button',{name:'Talents',exact:true}).click();await p.locator('.talentGraphViewport').waitFor();
 const snapshot=()=>p.evaluate(()=>WandererGame.snapshot().automaticTalents);
 assert.equal((await snapshot()).nodes.length,0);
 const clickNode=async node=>{await node.scrollIntoViewIfNeeded();const r=await node.boundingBox();assert(await node.evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return n===hit||n.contains(hit);}));if(p.viewportSize().width<600)await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);else await p.mouse.click(r.x+r.width/2,r.y+r.height/2);};
 await clickNode(p.locator('[data-auto-talent="might"]'));assert.equal((await snapshot()).nodes.length,0,'inspection spends nothing');
 assert(await p.locator('#automaticTalentAllocate').isEnabled());await p.locator('#automaticTalentAllocate').click();assert.deepEqual((await snapshot()).nodes,['might']);
 await p.locator('[data-tree-family="blood"]').click();await clickNode(p.locator('[data-auto-talent="affinity_blood"]').first());assert.deepEqual((await snapshot()).nodes,['might']);await p.locator('#automaticTalentAllocate').click();assert.deepEqual((await snapshot()).nodes,['might','affinity_blood']);assert(await p.locator('#automaticTalentAllocate').isDisabled());
 fs.mkdirSync('reports/talent-stage3',{recursive:true});await p.locator('.automaticTalentTree').screenshot({path:'reports/talent-stage3/blood-desktop.png'});
 const viewport=p.locator('.talentGraphViewport'),box=await viewport.boundingBox(),before=await snapshot();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2+60,box.y+box.height/2+80,{steps:8});await p.mouse.up();assert.deepEqual(await snapshot(),before,'drag spends nothing');
 await p.evaluate(()=>{const L=WandererTalentLayout.create(WandererAutomaticTalents.NODES),a=L.positions.blood_focus,b=L.positions.blood_transfer,v=document.querySelector('.talentGraphViewport'),c=wandererTalentView;c.scale=.8;c.x=v.clientWidth/2-(a.x+b.x)/2*c.scale;c.y=v.clientHeight/2-((a.y+b.y)/2+150)*c.scale;document.querySelector('.talentGraphCanvas').style.transform='translate('+c.x+'px,'+c.y+'px) scale('+c.scale+')';});await clickNode(p.locator('[data-auto-talent="blood_focus"]'));assert(await p.locator('#automaticTalentAllocate').isDisabled());assert.match(await p.locator('#talentInspectorStatus').innerText(),/Path from your build:/);await p.locator('.automaticTalentTree').screenshot({path:'reports/talent-stage3/blood-specializations-desktop.png'});
 await p.locator('[data-tree-zoom="reset"]').click();await p.locator('.automaticTalentTree').screenshot({path:'reports/talent-stage3/overview-desktop.png'});
 await p.locator('[data-tree-zoom="mixed"]').click();await p.locator('.automaticTalentTree').screenshot({path:'reports/talent-stage3/mixed-desktop.png'});
 await p.reload();await p.getByRole('button',{name:'Talents',exact:true}).click();assert.deepEqual((await snapshot()).nodes,['might','affinity_blood']);
 await p.setViewportSize({width:390,height:844});await p.locator('[data-tree-zoom="reset"]').click();
 assert(await p.locator('.talentGraphStart').evaluate(n=>{const a=n.getBoundingClientRect(),b=n.closest('.talentGraphViewport').getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom;}));
 await p.locator('[data-tree-family="blood"]').click();assert(await p.locator('[data-auto-talent="affinity_blood"]').first().evaluate(n=>{const a=n.getBoundingClientRect(),b=n.closest('.talentGraphViewport').getBoundingClientRect();return a.left>=b.left&&a.right<=b.right&&a.top>=b.top&&a.bottom<=b.bottom;}));
 await clickNode(p.locator('[data-auto-talent="affinity_blood"]').first());await p.locator('.automaticTalentTree').screenshot({path:'reports/talent-stage3/blood-mobile.png'});
 assert(await p.locator('#automaticTalentAllocate').isDisabled());assert.equal(await p.locator('.treeGraphNode[tabindex="0"]').count(),1);await p.keyboard.press('ArrowUp');assert.notEqual(await p.locator('.treeGraphNode:focus').getAttribute('data-auto-talent'),'affinity_blood');assert.deepEqual((await snapshot()).nodes,['might','affinity_blood']);assert.deepEqual(errors,[]);console.log('PASS: two starter allocations, inspect before spend, drag, family roots, mixed view, reset, reload, mobile root bounds and single keyboard entry.');
 }finally{if(b)await b.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
