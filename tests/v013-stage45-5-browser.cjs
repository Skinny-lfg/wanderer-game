'use strict';
// Stage 4.5.5: real Chromium, isolated local-save preview. Never opens a cloud session.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const out=path.resolve('reports/stage45-5-browser');fs.mkdirSync(out,{recursive:true});
const findings=[];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.gif':'image/gif','.woff':'font/woff','.woff2':'font/woff2'};
const hook=String.raw`
window.__stage455={
 snapshot(){const g=phase1Controller.state,d=g.dungeon||null,c=d?.realm?phase1Controller.realmMap():null,r=state.run;
  return {stage:g.stage,expedition:g.expedition,realm:d?.realm??null,steps:d?.steps??null,current:d?.current??null,
   cards:d?.cards?.map(c=>({id:c.id,level:c.risk,name:c.name,objective:c.objective,reliquary:c.reliquaryRoom,oracle:c.nodes.findIndex(n=>n.event==='oracle_of_paths'),boss:c.nodes.length-1,edges:c.edges,nodes:c.nodes.map(n=>({kind:n.kind,event:n.event||null,traitId:n.traitId||null}))}))||[],
   preparation:d?.foundationState?.bossPreparation||null,knownMods:d?.foundationState?.revealedBossModifiers||[],disabledId:d?.disabledBossModifierId||null,scouted:d?.scouted||[],decisions:d?.foundationState?.decisions||[],cleared:d?.cleared||[],unlocked:g.unlocked,modifiers:d?.foundationState?.bossModifierIds||[],
   runStatus:r?.status||null,runModifiers:r?.bossModifierIds||[],runBoss:r?.enemy?.boss||false,runEscorts:r?.totalMobCount?Math.max(0,r.totalMobCount-1):null,
   hp:phase3Vitals()?.hp, maxHp:phase3Vitals()?.maxhp, mp:phase3Vitals()?.mp, maxMp:phase3Vitals()?.maxmp,
   savedTalents:state.automaticTalents?.nodes||[],
   result:phase5Results.summary?.outcome||null};
 },
 pathToRoom(target){
  const c=phase1Controller.realmMap(),d=phase1Controller.state.dungeon;
  const q=[[d.current]],seen=new Set([d.current]);
  for(const currentPath of q){
   const current=currentPath.at(-1);if(current===target)return currentPath;
   for(const next of WandererV013MapIntelligence.neighbors(c,d,current)){
    if(seen.has(next))continue;seen.add(next);q.push([...currentPath,next]);
   }
  }
  return null;
 },
  finishCombat(){const r=state.run;if(!r||r.status!=='fight')return {status:r?.status||null};
  for(let n=0;n<90&&r.status==='fight';n++){
   // Only a test accelerator: preserve actual victory settlement, rewards and phases.
   for(const mob of r.enemies?.length?r.enemies:[r.enemy])if(mob&&mob.hp>0)mob.hp=0;
   phase1WaveWon();
  }
  return {status:r.status,stage:phase1Controller.state.stage};
 }
};
`;
async function main(){
 const root=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8',maxBuffer:2*1024*1024}).trim().replace(/^Isolated automatic RPG preview: /,'');
 const entry=path.join(root,'index.html');let html=fs.readFileSync(entry,'utf8');
 const anchor='phase1Init();\nconst phase3RestoredScroll';assert.equal(html.split(anchor).length,2,'Unknown v0.13 boot; do not inject QA hook into the wrong version');
 html=html.replace(anchor,'phase1Init();\n'+hook+'\nconst phase3RestoredScroll');fs.writeFileSync(entry,html);
 const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.statusCode=400;return res.end();}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(file!==path.join(root,'index.html')&&!file.startsWith(root+path.sep)){res.statusCode=403;return res.end();}
  fs.readFile(file,(err,body)=>{if(err){res.statusCode=404;return res.end();}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(body);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const opts={headless:true,args:['--no-sandbox']};if(process.env.CHROMIUM_PATH)opts.executablePath=process.env.CHROMIUM_PATH;
 let browser;
 try{
  browser=await chromium.launch(opts);
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1}),errors=[];
  page.setDefaultTimeout(12000);page.on('pageerror',err=>errors.push(String(err)));
  page.on('console',msg=>{if(msg.type()==='error'&&!/Failed to load resource/.test(msg.text()))findings.push('Browser console error: '+msg.text().slice(0,300));});

  async function chooseRealm(contextPage,index){
    await contextPage.goto(base+'/',{waitUntil:'domcontentloaded'});
    await contextPage.locator('.phase3Camp').waitFor({state:'visible'});
    await contextPage.locator('[data-phase1-expedition]:visible').first().click();
    const cards=await contextPage.evaluate(()=>__stage455.snapshot().cards);
    assert.equal(cards.length,3);
    await contextPage.locator('[data-realm-card]').nth(index).click();
    return cards[index];
  }
  async function navigate(contextPage,target,options={}){
    const route=await contextPage.evaluate(id=>__stage455.pathToRoom(id),target);
    assert(route?.length>1,'No natural connected route to room '+target);
    console.log('Browser journey '+target+': '+route.join(' -> '));
    for(const node of route.slice(1)){
      const before=await contextPage.evaluate(()=>__stage455.snapshot());
      await contextPage.locator('[data-dungeon-room="'+node+'"]').click();
      const dialog=contextPage.locator('dialog[open]');await dialog.waitFor();
      const button=dialog.getByRole('button',{name:/^(Enter room|Travel here)$/});
      const label=await button.innerText();await button.click();
      if(label==='Travel here')continue;
      const event=await contextPage.locator('.phase6Event').count()>0;
      if(event){
        const name=await contextPage.locator('.phase6Event h2').innerText();
        if(node===target&&options.oracle){
          assert.match(name,/Oracle/i,'Expected natural Oracle event');
          const snapshot=await contextPage.evaluate(()=>__stage455.snapshot());
          await contextPage.locator('[data-event-select="0"]').click();
          assert(await contextPage.locator('#eventConfirm').isEnabled());
          await contextPage.locator('#eventConfirm').click();
          const next=await contextPage.evaluate(()=>__stage455.snapshot());
          assert(next.scouted.length>snapshot.scouted.length||next.knownMods.length>snapshot.knownMods.length,
            'Oracle must reveal rooms or a boss property');
          assert.equal(next.decisions.filter(x=>x.type==='reveal_boss').length-snapshot.decisions.filter(x=>x.type==='reveal_boss').length,
            next.knownMods.length>snapshot.knownMods.length?1:0);
        }else await contextPage.getByRole('button',{name:'Pass without rewards'}).click();
        if(await contextPage.locator('#phase5ExitEvent').count())await contextPage.locator('#phase5ExitEvent').click();
      }else{
        const combat=await contextPage.evaluate(()=>__stage455.snapshot());
        if(node===target&&options.elite){
          assert(combat.runStatus==='fight','Elite must start combat');
          assert.match(await dialog.count()?'':await contextPage.locator('body').innerText(),/Elite|Combat/i);
        }
        assert.equal(combat.runStatus,'fight','Expected normal combat at room '+node);
        if(node===target&&options.boss){
          assert.equal(combat.runBoss,true,'Target must actually spawn a boss');
          assert.deepEqual(combat.runModifiers,options.expectedMods,'Boss properties must reflect preparations');
          assert.equal(combat.runEscorts,options.expectedEscorts,'Marked Elite must remove a boss guard');
          await contextPage.screenshot({path:path.join(out,'stage455-final-boss.png'),fullPage:true});
        }
        const cleared=await contextPage.evaluate(()=>__stage455.finishCombat());
        assert.equal(cleared.status,'cleared','Combat must settle');
        const settled=await contextPage.evaluate(()=>__stage455.snapshot());
        const actions=await contextPage.locator('#phase5ExitResult:visible, #phase5ExitRealm:visible').count();
        console.log('Post-combat:',JSON.stringify({node,stage:settled.stage,result:settled.result,runStatus:settled.runStatus,exitButtons:actions}));
        if(!(options.boss&&settled.stage==='finished')){
          const resultExit=contextPage.locator('#phase5ExitResult:visible');
          const ordinaryExit=contextPage.locator('#phase5ExitRealm:visible');
          if(await resultExit.count())await resultExit.click();
          else if(await ordinaryExit.count())await ordinaryExit.click();
          else throw Error('No visible result/exit after encounter '+node+'; stage='+settled.stage+' status='+settled.runStatus);
        }
      }
      const after=await contextPage.evaluate(()=>__stage455.snapshot());
      assert(before.steps>=after.steps,'No room may refund travel steps');
      if(node!==target||!options.boss)assert.equal(after.current,node,'Current room mismatch');
    }
  }
  // First run: UI-controlled Marked Elite and the final boss on a natural Dangerous card.
  const selected=await chooseRealm(page,1);
  let stateBefore=await page.evaluate(()=>__stage455.snapshot());
  const objective=selected.objective;
  assert(await page.locator('[data-dungeon-room="'+objective+'"]').count()===0||
    (await page.locator('[data-dungeon-room="'+objective+'"]').innerText()).includes('★'),
    'Marked Elite should be visually marked if already visible');
  await navigate(page,objective,{elite:true});
  let elite=await page.evaluate(()=>__stage455.snapshot());
  assert(elite.preparation?.markedElite,'Marked Elite defeat must prepare the boss');
  assert.equal(elite.decisions.filter(x=>x.source==='markedElite').length,1,
    'Marked Elite preparation applied exactly once');
  await page.screenshot({path:path.join(out,'stage455-marked-elite.png'),fullPage:true});
  await page.reload();
  await page.locator('[data-dungeon-room="'+objective+'"]').waitFor();
  const eliteRestored=await page.evaluate(()=>__stage455.snapshot());
  assert(eliteRestored.preparation?.markedElite,'Elite status must persist on reload');
  assert.equal(eliteRestored.decisions.filter(x=>x.source==='markedElite').length,1);
  const expectedMods=eliteRestored.modifiers.slice();
  const expectedEscorts=1+Number(expectedMods.includes('gravebound_retinue'))-1;
  await navigate(page,selected.boss,{boss:true,expectedMods,expectedEscorts});
  const victorious=await page.evaluate(()=>__stage455.snapshot());
  assert.equal(victorious.stage,'finished','Boss completion must finish expedition');
  assert.equal(victorious.unlocked,eliteRestored.unlocked+1,'Boss must unlock one expedition');
  await page.screenshot({path:path.join(out,'stage455-extraction.png'),fullPage:true});
  await page.reload();
  const finishedReload=await page.evaluate(()=>__stage455.snapshot());
  assert.equal(finishedReload.unlocked,victorious.unlocked,'Extraction must persist');
  assert.deepEqual(errors,[],'Uncaught browser errors');

  // Second isolated run: Oracle, chosen only from a naturally generated card.
  // A missing Oracle is explicitly reported rather than fabricated through QA state mutation.
  const oracleContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  const oraclePage=await oracleContext.newPage();
  oraclePage.setDefaultTimeout(12000);
  oraclePage.on('pageerror',e=>errors.push(String(e)));
  await oraclePage.goto(base+'/',{waitUntil:'domcontentloaded'});
  await oraclePage.locator('.phase3Camp').waitFor({state:'visible'});
  await oraclePage.locator('[data-phase1-expedition]:visible').first().click();
  const naturalCards=await oraclePage.evaluate(()=>__stage455.snapshot().cards);
  const oracleChoice=naturalCards.findIndex(c=>c.oracle>=0);
  assert(oracleChoice>=0,'No natural Oracle among the current 3 cards; seed/fixture coverage must be extended, not fake a room');
  await oraclePage.locator('[data-realm-card]').nth(oracleChoice).click();
  await navigate(oraclePage,naturalCards[oracleChoice].oracle,{oracle:true});
  const oracleDone=await oraclePage.evaluate(()=>__stage455.snapshot());
  await oraclePage.screenshot({path:path.join(out,'stage455-oracle-mobile.png'),fullPage:true});
  await oraclePage.reload();
  await oraclePage.locator('[data-dungeon-room="'+naturalCards[oracleChoice].oracle+'"]').waitFor();
  const oracleRestored=await oraclePage.evaluate(()=>__stage455.snapshot());
  assert.deepEqual(oracleRestored.knownMods,oracleDone.knownMods,'Oracle revelation must persist');
  assert.deepEqual(oracleRestored.scouted,oracleDone.scouted,'Oracle scouting must persist');
  assert.deepEqual(oracleRestored.decisions,oracleDone.decisions,'Oracle decision must not duplicate');
  await oracleContext.close();
  console.log('PASS Stage 4.5.5 browser: natural Oracle, Marked Elite, final boss and extraction with persisted checkpoints');
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'passed',oracle:true,markedElite:true,boss:true,extraction:true,viewports:[390,1440],errors,notes:'Natural maps, actual UI clicks; combat HP accelerated in isolated temporary preview only.'},null,2));
 }catch(error){fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({status:'failed',error:String(error),findings},null,2));throw error;}
 finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(err=>{console.error(err);process.exitCode=1});
