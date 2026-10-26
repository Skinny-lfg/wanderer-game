import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

function createMcpClient(child){
 const pending=new Map();
 let nextId=1;
 const lines=createInterface({input:child.stdout});
 lines.on('line',line=>{
  let message;try{message=JSON.parse(line);}catch{return;}
  const resolve=pending.get(message.id);if(resolve){pending.delete(message.id);resolve(message);}
 });
 return {
  request(method,params={}){
   const id=nextId++;
   return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`MCP timeout: ${method}`));},15000);
    pending.set(id,message=>{clearTimeout(timer);resolve(message);});
    child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
   });
  },
  close(){lines.close();}
 };
}

test('private plugin package, marketplace and project enablement are valid references',async()=>{
 const manifest=JSON.parse(await readFile(path.join(root,'plugins/wanderer-dev-agent/plugin.json'),'utf8'));
 const marketplace=JSON.parse(await readFile(path.join(root,'.agents/plugins/marketplace.json'),'utf8'));
 const mcp=JSON.parse(await readFile(path.join(root,'plugins/wanderer-dev-agent/mcp.json'),'utf8'));
 const hooks=JSON.parse(await readFile(path.join(root,'plugins/wanderer-dev-agent/hooks/hooks.json'),'utf8'));
 assert.equal(manifest.name,'wanderer-dev-agent');
 assert.equal(marketplace.plugins[0].name,manifest.name);
 assert.equal(marketplace.plugins[0].source.path,'./plugins/wanderer-dev-agent');
 assert.ok(mcp.mcpServers['wanderer-dev-agent']);
 assert.ok(hooks.hooks.UserPromptSubmit);
 assert.match(await readFile(path.join(root,'.codex/config.toml'),'utf8'),/wanderer-dev-agent@wanderer-local/);
});

