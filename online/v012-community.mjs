import {completionCandidate} from './v012-leaderboard.mjs';

const requiresAccountGate=(!['localhost','127.0.0.1'].includes(location.hostname)&&!location.hostname.endsWith('.test'))||new URLSearchParams(location.search).get('testAuthGate')==='1';
if(requiresAccountGate){
 const button=document.querySelector('[data-online-action="leaderboard"]');
 let backendPromise=null,dialog=null,submittedBest=0;
 const getBackend=()=>backendPromise??=(import('./firebase-client.mjs?v=v013-main-parity-1').then(({createBackend})=>createBackend()).catch(error=>{backendPromise=null;throw error;}));
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const closeMenu=()=>{document.getElementById('onlineBar')?.classList.remove('menuOpen');document.getElementById('menuToggle')?.setAttribute('aria-expanded','false');};
 function itemSummary(loadout){
  const equipment=loadout?.equipment||{},slots=['helm','amulet','armor','gloves','weapon','offhand','ring1','ring2','boots','belt'];
  const items=slots.filter(slot=>equipment[slot]).map(slot=>{const item=equipment[slot];return `<li>${esc(slot)}: ${esc(item.name)} · E${item.tier} ${esc(item.rarity)}</li>`;});
  const runes=loadout?.runes||[];
  return `<details class="v012PublicGear"><summary>Currently equipped gear and Runes</summary><h4>Equipped</h4><ul>${items.join('')||'<li>No public equipment snapshot</li>'}</ul><h4>Equipped Runes</h4><ul>${runes.map(r=>`<li>${esc(r.family)} · E${r.tier}</li>`).join('')||'<li>None</li>'}</ul><p class="small muted">Only equipped items and Runes are public. Inventory, currency and saves stay private.</p></details>`;
 }
 async function publicProfile(backend,uid){
  const profile=await backend.readV012PublicProfile(uid);
  if(!profile)return null;
  const loadout=await backend.readV012EquippedEquipment(uid);
  return {uid,profile,loadout};
 }
 function modal(){
  if(dialog){dialog.showModal();return dialog;}
  dialog=document.createElement('dialog');dialog.className='itemDialog onlineDialog v012CommunityDialog';
  dialog.setAttribute('aria-labelledby','v012CommunityTitle');
  dialog.innerHTML='<h2 id="v012CommunityTitle">Expedition Leaderboard</h2><p class="small muted">Highest completed Expedition. Player submitted results are unverified; public data never includes inventory, currency or saves.</p><form data-player-search><label>Find a public profile by full nickname <input name="nickname" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]{3,20}" required></label><button type="submit">Find profile</button></form><p data-community-status role="status" aria-live="polite">Loading public leaderboard…</p><ol data-community-rows></ol><section data-public-profile hidden></section><button type="button" data-community-close>Close</button>';
  document.body.append(dialog);
  const status=dialog.querySelector('[data-community-status]'),rows=dialog.querySelector('[data-community-rows]'),profilePanel=dialog.querySelector('[data-public-profile]');
  const message=(text,error=false)=>{status.textContent=text;status.dataset.error=String(error);};
  dialog.querySelector('[data-community-close]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{dialog.remove();dialog=null;});
  const showProfile=async uid=>{
   profilePanel.hidden=false;profilePanel.innerHTML='<p>Loading public profile…</p>';
   try{const result=await publicProfile(await getBackend(),uid);if(!result)throw Error('Public profile unavailable.');
    profilePanel.innerHTML=`<h3>${esc(result.profile.nickname)}</h3><p>Character: ${esc(result.profile.characterId)}</p>${itemSummary(result.loadout)}`;
   }catch(error){profilePanel.innerHTML=`<p role="alert">${esc(error.message||'Could not load public profile.')}</p>`;}
  };
  dialog.querySelector('[data-player-search]').onsubmit=async event=>{
   event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
   message('Finding public profile…');
   try{const result=await(await getBackend()).findV012Player(form.elements.nickname.value);profilePanel.hidden=false;profilePanel.innerHTML=`<h3>${esc(result.profile.nickname)}</h3><p>Character: ${esc(result.profile.characterId)}</p>${itemSummary(result.loadout)}`;message('Profile loaded.');}
   catch(error){message(error.message||'Could not find that profile.',true);}
  };
  (async()=>{
   try{const api=await getBackend();if(!api.currentUser()||api.currentUser().isAnonymous){rows.replaceChildren();message('Sign in with Google or a verified email account to view community rankings.',true);return;}
    const scores=await api.listV012CommunityScores(),profiles=await Promise.all(scores.slice(0,25).map(row=>publicProfile(api,row.uid).catch(()=>null)));
    const visible=scores.slice(0,25).map((score,index)=>({score,profile:profiles[index]})).filter(row=>row.profile&&row.profile.profile.nickname===row.score.nickname);
    rows.innerHTML=visible.map(({score,profile},index)=>`<li><b>#${index+1} ${esc(profile.profile.nickname)}</b> · ${esc(profile.profile.characterId)} · E${score.best} <span class="small muted">unverified</span> <button type="button" data-profile-uid="${esc(score.uid)}">View profile</button></li>`).join('')||'<li>No public Expedition results yet.</li>';
    rows.querySelectorAll('[data-profile-uid]').forEach(control=>control.onclick=()=>showProfile(control.dataset.profileUid));message(visible.length?'Community scores are player-submitted and unverified.':'No public Expedition results yet.');
   }catch(error){message(error.message||'Leaderboard is unavailable in this Firebase environment.',true);}
  })();
  dialog.showModal();return dialog;
 }
 if(button)button.addEventListener('click',event=>{event.preventDefault();closeMenu();modal();});
 addEventListener('wanderer:save-status',async event=>{
  if(event.detail?.state!=='saved')return;
  try{const api=await getBackend(),user=api.currentUser();if(!user||user.isAnonymous)return;
   const candidate=completionCandidate(globalThis.WandererGame?.cloudSnapshot?.());
   if(!candidate||candidate.cleared<=submittedBest)return;
   await api.publishV012CommunityScore(candidate.cleared,globalThis.WandererNickname||'Wanderer');submittedBest=candidate.cleared;
  }catch(error){console.warn('[Wanderer] Community score not published:',String(error?.message||error));}
 });
}
