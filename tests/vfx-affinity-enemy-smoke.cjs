// Asset and routing smoke check for Wanderer VFX (no game state or saves touched).
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const root=path.join(__dirname,'..','assets','combat-vfx');
const physical=['slash_main_hand','smash_main_hand','double_slash_daggers','big_slash_two_hand','arrow_bow','block'];
const affinities=['burn','slow','poison','drain','nature','shock','tide'];
const names=[...physical,...affinities.flatMap(a=>['big_spell_projectile_staff_'+a,'spell_projectile_wand_'+a]),
 'enemy_skirmisher_slash','enemy_bruiser_smash','elite_tank_crushing_blow','elite_berserker_rend',
 'elite_vampire_blood_drain','elite_caster_hex','boss_abyssal_guardian_barrier',
 'boss_rift_harbinger_soul_bolt','boss_ember_sovereign_enrage'];
assert.equal(names.length,29);
for(const name of names){
 const png=fs.readFileSync(path.join(root,name+'.png'));
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',name+' PNG');
 assert.equal(png.readUInt32BE(16),512,name+' width');
 assert.equal(png.readUInt32BE(20),512,name+' height');
 assert.equal(png[25],6,name+' RGBA transparency');
}
const s=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(s,'inline game script');
new (require('node:vm').Script)(s,{filename:'wanderer-vfx.js'});
for(const text of ['function combatVfxAsset(kind,affinity)','MAGIC_COMBAT_AFFINITIES',
 'animateEnemyStrike(enemyAbilityVfx)','combatEffect(\'BossEmber\')','combatEffect(\'BossAbyssal\')',
 'enemyAbilityVfx=\'BossRift\'','enemyAbilityVfx=\'EliteCaster\'','enemyAbilityVfx=\'EliteVampire\'']){
 assert(html.includes(text),'missing VFX hook '+text);
}
assert(html.includes('@keyframes vfxEnemyTravel'),'enemy projectile travels toward player');
assert(html.includes('.combatVfx.vfxEnemyWard'),'boss self-targeted VFX exists');
console.log('PASS: 29 transparent VFX PNGs, 7 Staff/Wand affinity mappings, enemy/boss routing');
