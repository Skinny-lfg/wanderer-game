// Build an isolated local-only playtest. This never deploys or reads player data.
import {mkdtemp,mkdir,readFile,readdir,copyFile,writeFile} from 'node:fs/promises';
import {join,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';

const output=await mkdtemp(join(tmpdir(),'wanderer-automatic-preview-'));
const extensions={assets:new Set(['.json','.png','.webp','.jpg','.jpeg','.gif','.svg','.ico','.avif','.woff','.woff2']),online:new Set(['.js','.mjs','.css']),combat:new Set(['.js','.mjs','.json']),economy:new Set(['.js','.mjs','.json'])};
const excluded=new Set(['auth-action.mjs','firebase-client.mjs','firebase-config.mjs','firebase-config-production.mjs','firebase-sdk-cdn.mjs','firebase-sdk-source.mjs','v012-account.mjs','v012-auth-bootstrap.js','v012-cloud-save.mjs','v012-feedback.mjs','v012-leaderboard-ui.mjs','v012-leaderboard.mjs']);
async function copy(dir,relative=''){
 for(const entry of await readdir(join(dir,relative),{withFileTypes:true})){
  if(entry.name.startsWith('.')||dir==='online'&&(entry.name==='vendor'||excluded.has(entry.name)))continue;
  const child=join(relative,entry.name),target=join(output,dir,child);
  if(entry.isDirectory()){await mkdir(target,{recursive:true});await copy(dir,child);}
  else if(entry.isFile()&&extensions[dir].has(extname(entry.name).toLowerCase())){await mkdir(join(output,dir,relative),{recursive:true});await copyFile(join(dir,child),target);}
 }
}
for(const dir of Object.keys(extensions))await copy(dir);
let html=await readFile('index.html','utf8');
function replaceRequired(pattern,replacement,label){if(!pattern.test(html))throw Error('Preview blocked: '+label+' not found');html=html.replace(pattern,replacement);}
replaceRequired(/globalThis\.__WANDERER_CLOUD_ONLY__=[^\n]+;/,'globalThis.__WANDERER_CLOUD_ONLY__=false;','cloud flag');
replaceRequired(/const PHASE5_VALIDATION=[^\n]+;/,'const PHASE5_VALIDATION=true;','isolated save flag');
for(const name of ['v012-auth-bootstrap.js','v012-account.mjs','v012-feedback.mjs','v012-leaderboard-ui.mjs'])replaceRequired(new RegExp('<script[^>]*src="online/'+name.replaceAll('.','\\.')+'(?:\\?[^" ]*)?"[^>]*><\\/script>'),'',name);
// Content-address the changing modules so a previously cached playtest cannot
// mix the old progression engine with the new one after a Pages update.
for(const file of ['economy/v013-crafting.js','combat/automatic-talents.js','combat/v012-combat-core.js','combat/v012-combat-runtime.js','combat/v012-buildcraft.js','combat/v012-gear-stats.js','economy/v012-loot-rules.js','online/v012-expedition-controller.js','online/v012-expedition-events.js','online/v012-expedition-runtime.js','online/v012-persistence-runtime.js','online/v012-uiux-tuning.css','online/v013-combat-arena.css']){
 const hash=createHash('sha256').update(await readFile(join(output,file))).digest('hex').slice(0,12);
 const attr=file.endsWith('.css')?'href':'src';replaceRequired(new RegExp(attr+'="'+file.replaceAll('.','\\.')+'(?:\\?[^" ]*)?"'),attr+'="'+file+'?v='+hash+'"',file);
}
replaceRequired(/<\/head>/,'<style>#onlineBar{display:none!important}</style></head>','head');
await writeFile(join(output,'index.html'),html);
const savePath=join(output,'online/v012-save.js');let save=await readFile(savePath,'utf8');
if(!save.includes("PREFIX='wanderer_v012_endless_v1_'"))throw Error('Preview blocked: unknown save namespace');
save=save.replace("PREFIX='wanderer_v012_endless_v1_'","PREFIX='wanderer_automatic_rpg_preview_v5_'");
await writeFile(savePath,save);
const saveHash=createHash('sha256').update(save).digest('hex').slice(0,12);
let finalHtml=await readFile(join(output,'index.html'),'utf8');
if(!finalHtml.includes('src="online/v012-save.js"'))throw Error('Preview blocked: save script not found');
finalHtml=finalHtml.replace('src="online/v012-save.js"','src="online/v012-save.js?v='+saveHash+'"');
await writeFile(join(output,'index.html'),finalHtml);
console.log('Isolated automatic RPG preview: '+output);
