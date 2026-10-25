/* v0.12 community ranking and read-only public player cards.
   Scores remain self-reported; private saves and loadouts are NEVER queried. */
import {createBackend} from './firebase-client.mjs?v=v012-public-profiles-1';

let busy=false,reported=0,dialog=null,backendPromise=null;
const getBackend=()=>backendPromise??=(createBackend().catch(error=>{backendPromise=null;throw error;}));
const escapedName=name=>String(name||'Wanderer').slice(0,20);
const validUid=uid=>typeof uid==='string'&&uid.length>0&&uid.length<=128&&!uid.includes('/');
const characterNames=Object.freeze({wanderer:'Paladin',knight:'Warrior',ranger:'Ranger',spellblade:'Wizard',duelist:'Rogue'});
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
 if(dialog){if(!dialog.open)dialog.showModal();return;}
 dialog=document.createElement('dialog');
 const activeDialog=dialog;
 activeDialog.className='itemDialog onlineDialog v012LeaderboardDialog';
 activeDialog.innerHTML=[
  '<h2>Expedition Leaderboard</h2>',
  '<section data-leaderboard-overview>',
  '<p class="small muted">Highest Expedition completed · Community results are self-reported and not server-verified.</p>',
  '<p data-leaderboard-status role="status" aria-live="polite">Loading leaderboard…</p>',
  '<div class="v012RankList" data-leaderboard-list></div>',
  '<div class="buttonRow"><button type="button" data-leaderboard-refresh>Refresh</button></div>',
  '</section>',
  '<section data-leaderboard-player hidden aria-label="Public player profile">',
  '<button type="button" class="v012ProfileBack" data-leaderboard-back>← Back to leaderboard</button>',
  '<div class="v012PublicPlayerCard">',
  '<div class="v012PublicPlayerIdentity">',
  '<img data-player-avatar src="assets/characters/avatars/wanderer.png" width="88" height="88" alt="">',
  '<div><h3 data-player-name>Player</h3><p data-player-character class="small muted"></p></div>',
  '</div>',
  '<div class="v012PublicPlayerStats">',
  '<div><small>Leaderboard rank</small><strong data-player-rank>—</strong></div>',
  '<div><small>Highest Expedition</small><strong data-player-best>—</strong></div>',
  '</div>',
  '<p data-player-message class="small muted" role="status" aria-live="polite"></p>',
  '<p class="small muted v012ProfilePrivacy">Public profile only. Equipment, inventory, build and cloud saves remain private. Ranking scores are not server-verified.</p>',
  '</div></section>',
  '<div class="buttonRow"><button type="button" data-leaderboard-close>Close</button></div>'
 ].join('');
 document.body.append(activeDialog);

 const overview=activeDialog.querySelector('[data-leaderboard-overview]');
 const player=activeDialog.querySelector('[data-leaderboard-player]');
 const status=activeDialog.querySelector('[data-leaderboard-status]');
 const list=activeDialog.querySelector('[data-leaderboard-list]');
 const playerMessage=activeDialog.querySelector('[data-player-message]');
 const back=activeDialog.querySelector('[data-leaderboard-back]');
 let requestSerial=0,lastTrigger=null;

 const returnToLeaderboard=()=>{
  requestSerial++;
  player.hidden=true;overview.hidden=false;
  const focusTarget=lastTrigger?.isConnected?lastTrigger:activeDialog.querySelector('[data-leaderboard-refresh]');
  focusTarget?.focus();
 };

 const showPlayer=async(entry,rank,trigger)=>{
  if(!validUid(entry?.uid)||!Number.isSafeInteger(entry.best)||entry.best<1)return;
  lastTrigger=trigger;
  overview.hidden=true;player.hidden=false;
  const ticket=++requestSerial;
  const name=activeDialog.querySelector('[data-player-name]');
  const avatar=activeDialog.querySelector('[data-player-avatar]');
  const character=activeDialog.querySelector('[data-player-character]');
  name.textContent=escapedName(entry.nickname);
  avatar.hidden=true;avatar.alt='';
  character.textContent='Loading public avatar…';
  activeDialog.querySelector('[data-player-rank]').textContent='#'+rank;
  activeDialog.querySelector('[data-player-best]').textContent='E'+entry.best;
  playerMessage.textContent='Loading public profile…';
  back.focus();
  try{
   const backend=await getBackend();
   if(!backend.currentUser()||backend.currentUser().isAnonymous)throw Error('Sign in to view player profiles.');
   const profile=await backend.readV012PublicProfile(entry.uid);
   if(ticket!==requestSerial||dialog!==activeDialog||!activeDialog.open)return;
   const playerName=typeof profile?.nickname==='string'&&/^[a-z0-9_]{3,20}$/.test(profile.nickname)?profile.nickname:escapedName(entry.nickname);
   name.textContent=playerName;
   if(profile&&Object.hasOwn(characterNames,profile.characterId)){
    const id=profile.characterId;
    avatar.src='assets/characters/avatars/'+id+'.png';
    avatar.alt=characterNames[id]+' avatar';
    avatar.hidden=false;
    character.textContent='Registered profile avatar · '+characterNames[id];
    playerMessage.textContent='Community leaderboard entry · Read-only';
   }else{
    character.textContent='No public character avatar';
    playerMessage.textContent='Limited public profile information available.';
   }
  }catch(error){
   if(ticket!==requestSerial||dialog!==activeDialog||!activeDialog.open)return;
   character.textContent='Public avatar unavailable';
   playerMessage.textContent='Unable to load public profile. Leaderboard result is still shown.';
  }
 };

 const refresh=async()=>{
  if(busy)return;
  busy=true;status.textContent='Loading leaderboard…';list.replaceChildren();
  try{
   const backend=await getBackend();
   if(!backend.currentUser()||backend.currentUser().isAnonymous)throw Error('Sign in to view rankings.');
   await publish();
   const rows=await backend.listV012CommunityScores();
   const entries=rows.filter(entry=>validUid(entry?.uid)&&Number.isSafeInteger(entry.best)&&entry.best>=1&&entry.best<=100000);
   if(!entries.length){status.textContent='No completed Expeditions recorded yet.';return;}
   status.textContent='Top '+entries.length+' · Unverified community rankings · Tap a player to view profile';
   let last=0,rank=0;
   for(let i=0;i<entries.length;i++){
    const entry=entries[i];if(entry.best!==last){rank=i+1;last=entry.best;}
    const row=document.createElement('div');row.className='v012RankRow';
    const ranking=document.createElement('span');ranking.textContent='#'+rank;
    const playerButton=document.createElement('button');
    playerButton.type='button';playerButton.className='v012RankPlayerButton';
    playerButton.textContent=escapedName(entry.nickname);
    playerButton.setAttribute('aria-label','View '+escapedName(entry.nickname)+' public profile');
    const score=document.createElement('span');score.className='v012RankScore';score.textContent='E'+entry.best;
    playerButton.addEventListener('click',()=>{showPlayer(entry,rank,playerButton).catch(console.error);});
    row.append(ranking,playerButton,score);list.append(row);
   }
  }catch(error){status.textContent='Unable to load rankings: '+String(error?.message||error).slice(0,150);}
  finally{busy=false;}
 };
 back.onclick=returnToLeaderboard;
 activeDialog.querySelector('[data-leaderboard-refresh]').onclick=refresh;
 activeDialog.querySelector('[data-leaderboard-close]').onclick=()=>activeDialog.close();
 activeDialog.addEventListener('close',()=>{requestSerial++;activeDialog.remove();if(dialog===activeDialog)dialog=null;});
 activeDialog.showModal();
 refresh();
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
