import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {parseNicknameCredentials,matchesFirebaseIdentity} from '../functions/nickname-identity.mjs';
const read=p=>readFileSync(p,'utf8');

test('nickname login accepts only normalized nicknames and bounded passwords',()=>{
 assert.deepEqual(parseNicknameCredentials({nickname:'  Knight_8 ',password:'Correct Horse!'}),{nickname:'knight_8',password:'Correct Horse!'});
 for(const item of [{nickname:'ab',password:'pass'},{nickname:'a@b.com',password:'pass'},{nickname:'name',password:''},{nickname:'name',password:'x'.repeat(129)},null,{},[],{nickname:'name',password:12}]) {
  assert.equal(parseNicknameCredentials(item),null);
 }
});

test('server must verify that Firebase password sign-in belongs to nickname uid',()=>{
 assert.equal(matchesFirebaseIdentity({localId:'abc',email:'PERSON@example.com'},'abc','person@example.com'),true);
 assert.equal(matchesFirebaseIdentity({localId:'other',email:'person@example.com'},'abc','person@example.com'),false);
 assert.equal(matchesFirebaseIdentity({localId:'abc',email:'different@example.com'},'abc','person@example.com'),false);
});

test('UI routes email and nickname separately without affecting password reset',()=>{
 const app=read('online/app.mjs'),adapter=read('online/firebase-client.mjs');
 assert(app.includes('Email address or nickname'));
 assert(app.includes("identifier.includes('@')"));
 assert(app.includes('await b.signInWithEmail(identifier,password)'));
 assert(app.includes('await b.signInWithNickname(identifier,password)'));
 assert(app.includes("showPasswordResetForm(hint.includes('@')?hint:'')"));
 assert(adapter.includes("'signInWithNickname'"));
 assert(adapter.includes('signInWithCustomToken(auth,response.data.customToken)'));
});

test('server keeps emails private and rules restrict nickname custom tokens',()=>{
 const func=read('functions/index.mjs'),rules=read('firestore.rules');
 assert(func.includes("getFirestore().doc('nicknames/' + credentials.nickname)"));
 assert(func.includes('signInWithPassword'));
 assert(func.includes('matchesFirebaseIdentity(verified, uid, email)'));
 assert(func.includes('return { customToken }'));
 assert(!func.includes('return { email'));
 assert(func.includes("DEVELOPMENT_PROJECT = 'wanderer-development-8e3ee'"));
 assert(rules.includes("provider == 'custom'"));
 assert(rules.includes("wandererNicknameLogin"));
 assert(rules.includes("email_verified"));
});
