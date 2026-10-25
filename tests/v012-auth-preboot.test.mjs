import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const bootstrap=readFileSync(new URL('../online/v012-auth-bootstrap.js',import.meta.url),'utf8');
const account=readFileSync(new URL('../online/v012-account.mjs',import.meta.url),'utf8');

test('production page uses new versioned Firebase login modules',()=>{
 assert.match(html,/v012-auth-bootstrap\.js\?v=v012-login-hotfix-2/);
 assert.match(html,/v012-account\.mjs\?v=v012-login-hotfix-2/);
 assert.match(html,/v012-required-auth\.css\?v=v012-login-hotfix-2/);
 assert.match(account,/WandererLoginLoaded\?\.\(\)/);
});
function harness(hostname){
 const p={textContent:'Preparing secure sign-in…'};
 const retry={hidden:true,addEventListener(_,cb){this.click=cb}};
 const shell={setAttribute(){},innerHTML:'',querySelector(query){return query.includes('status')?p:retry;},remove(){this.removed=true}};
 const classes={removed:[],remove(...items){this.removed.push(...items)}};
 let timeout;
 const context={location:{hostname,reload(){context.reloaded=true}},console:{error(){}},
  document:{createElement:()=>shell,body:{append(n){this.node=n},classList:classes}},
  setTimeout:cb=>{timeout=cb}
 };
 context.globalThis=context;
 vm.runInNewContext(bootstrap,context);
 return {context,shell,p,retry,classes,timeout:()=>timeout?.()};
}
test('public login bootstrap shows failure and supports reload when account module fails',()=>{
 const h=harness('wanderer-play.web.app');
 assert.equal(h.context.document.body.node,h.shell);
 assert.equal(h.retry.hidden,true);
 h.timeout();
 assert.match(h.p.textContent,/Unable to load sign-in/);
 assert.equal(h.retry.hidden,false);
 h.retry.click();assert.equal(h.context.reloaded,true);
});
test('successful login module replaces the bootstrap without revealing unauthenticated gameplay',()=>{
 const h=harness('wanderer-play.web.app');
 h.context.WandererLoginLoaded();
 assert.equal(h.shell.removed,true);
 assert(h.classes.removed.includes('v012Preboot'));
 h.timeout();
 assert.equal(h.retry.hidden,true);
});
test('isolated preview does not start cloud login bootstrap',()=>{
 const h=harness('localhost');
 assert.equal(h.context.document.body.node,undefined);
 assert.equal(h.context.WandererLoginLoaded,undefined);
});
