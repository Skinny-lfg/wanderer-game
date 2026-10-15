import {CHARACTERS} from './model.mjs';
const game=globalThis.WandererGame;
document.querySelector('[data-online-action="account"]').onclick=()=>{
 const dialog=document.createElement('dialog');dialog.className='itemDialog';
 dialog.innerHTML='<h2>Choose your character</h2><p>Cosmetic only. All characters have the same attributes.</p>'+CHARACTERS.map(c=>`<button data-character="${c.id}"><img width="64" src="${c.avatar}" alt="${c.name}">${c.name}</button>`).join('')+'<button data-close>Close</button>';
 dialog.querySelectorAll('[data-character]').forEach(b=>b.onclick=()=>{game.setCharacter(b.dataset.character);dialog.close()});dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
};
