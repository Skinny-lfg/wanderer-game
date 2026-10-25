/* Public v0.12 community ranking. Never claim server-verified combat results. */
import {createBackend} from './firebase-client.mjs?v=v012-production-auth-1';
let busy=false,reported=0,dialog=null,backendPromise=null;
const getBackend=()=>backendPromise??=(createBackend().catch(error=>{backendPromise=null;throw error;}));
const escapedName=name=>String(name||'Wanderer').slice(0,20);
const completed=()=>{try{
 const snap=globalThis.WandererGame?.cloudSnapshot?.();
 const n=Number(snap?.expedition?.completed||0);
 return Number.isSafeInteger(n)&&n>0&&n<=100000?n:0;
 }catch{return 0;}};
async function publish(){
 const backend=await getBackend(),user=backend.currentUser();
 if(!user||user.isAnonymous)return;
 const name=globalThis.WandererNickname;
 const score=completed();
 if(!name||!score||score<=reported)return;
 await backend.publishV012CommunityScore(score,name);
 reported=score;
}
async function open(){
 if(dialog){dialog.showModal();return;}
 dialog=document.createElement('dialog');
 dialog.className='itemDialog onlineDialog v012LeaderboardDialog';
 dialog.innerHTML='<h2>Expedition Leaderboard</h2><p class="small muted">Highest Expedition completed · Community results are self-reported and not server-verified.</p><p data-leaderboard-status role="status" aria-live="polite">Loading leaderboard…</p><div class="v012RankList" data-leaderboard-list></div><div class="buttonRow"><button type="button" data-leaderboard-refresh>Refresh</button><button type="button" data-leaderboard-close>Close</button></div>';
 document.body.append(dialog);
 const status=dialog.querySelector('[data-leaderboard-status]'),list=dialog.querySelector('[data-leaderboard-list]');
 const refresh=async()=>{
  if(busy)return;busy=true;status.textContent='Loading leaderboard…';list.replaceChildren();
  try{
   const backend=await getBackend();if(!backend.currentUser()||backend.currentUser().isAnonymous)throw Error('Sign in to view rankings.');
   await publish();
   const rows=await backend.listV012CommunityScores();
   if(!rows.length){status.textContent='No completed Expeditions recorded yet.';return;}
   status.textContent='Top '+rows.length+' · Unverified community rankings';
   let last=0,rank=0;
   for(let i=0;i<rows.length;i++){
    const item=rows[i];if(item.best!==last){rank=i+1;last=item.best;}
    const row=document.createElement('div');row.className='v012RankRow';
    const r=document.createElement('span');r.textContent='#'+rank;
    const name=document.createElement('strong');name.textContent=escapedName(item.nickname);
    const score=document.createElement('span');score.textContent='E'+item.best;
    row.append(r,name,score);list.append(row);
   }
  }catch(error){status.textContent='Unable to load rankings: '+String(error?.message||error).slice(0,150);}
  finally{busy=false;}
 };
 dialog.querySelector('[data-leaderboard-refresh]').onclick=refresh;
 dialog.querySelector('[data-leaderboard-close]').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{dialog.remove();dialog=null;});
 dialog.showModal();refresh();
}
document.addEventListener('click',event=>{
 const action=event.target?.closest?.('[data-online-action="leaderboard"]');
 if(!action)return;
 event.preventDefault();event.stopImmediatePropagation();
 document.getElementById('onlineBar')?.classList.remove('menuOpen');
 document.getElementById('menuToggle')?.setAttribute('aria-expanded','false');
 open().catch(console.error);
},true);
addEventListener('wanderer:save-status',event=>{
 if(event.detail?.state==='saved')setTimeout(()=>{publish().catch(()=>{});},150);
});
