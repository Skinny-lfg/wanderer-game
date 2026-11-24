'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const N=require('../scripts/v013-natural-progression.cjs'),R=require('../scripts/v013-stage648c1-identity-trigger.cjs');
const item=(subtype,slot='weapon',atk=1)=>({id:subtype,slot,subtype,atk,rarity:'Common',tier:1});
test('identity policy is opt-in, protects specialist mainhand and accepts native fallback before acquisition',()=>{
 const p=R.identityProfile('decay-two-handed'),wanted=item('Two-Handed'),wrong=item('Daggers','weapon',999);
 assert.equal(N.identityMatch(wanted,p,'weapon'),true);assert.equal(N.identityMatch(wrong,p,'weapon'),false);
 assert(N.identityGain(wanted,wrong,p,'weapon')>=10);assert(N.identityGain(wrong,wanted,p,'weapon')<0);
 assert.equal(N.identityMatch(wrong,{...p,strictResearchIdentity:false},'weapon'),null);
 assert.equal(N.identityPurchase(wrong,p,'weapon'),false);
});
test('Dual Daggers correctly recognizes native Off-Hand Dagger alias and prevents shield substitution',()=>{
 const p=R.identityProfile('smart-fury-daggers'),dagger=item('Off-Hand Dagger','offhand'),shield=item('Shield','offhand',999);
 assert.equal(N.identityMatch(dagger,p,'offhand'),true);assert.equal(N.identityMatch(shield,p,'offhand'),false);
 assert(N.identityGain(dagger,shield,p,'offhand')>=10);assert(N.identityGain(shield,dagger,p,'offhand')<0);
});
test('identity upgrade to two-handed weapon can replace an earned shield even if stat score is lower',()=>{
 const p=R.identityProfile('smart-blood-two-handed'),wanted=item('Two-Handed'),s={equip:{weapon:item('Sword','weapon',999),offhand:item('Shield','offhand',999)},stash:[wanted]};
 const a={state:()=>s,equip(id,slot){assert.equal(id,wanted.id);assert.equal(slot,'weapon');s.equip.weapon=wanted;s.equip.offhand=null;return true;}};
 assert.equal(N.equipEarned(a,p,false).length,1);assert.equal(s.equip.weapon.subtype,'Two-Handed');
});
test('identity is strict only for explicitly requested slots and armor classes',()=>{
 const p=R.identityProfile('decay-wand');
 assert.equal(N.identityMatch({armorType:'Cloth'},p,'armor'),true);assert.equal(N.identityMatch({armorType:'Plate'},p,'armor'),false);
 assert.equal(N.identityMatch(item('Ring','ring1'),p,'ring1'),null);
 assert.equal(N.identityMatch(item('Tome','offhand'),p,'offhand'),true);
});
test('Corruption Cycle diagnostic compiles and does not replace original trigger condition',()=>{
 const s=R.diagnosticSource();assert(s.includes("corruptionCycleDiagnostic"));assert(s.includes("e.v012Rot?.length>=3"));new Function(s);
});
