// Build the isolated v0.13 app from the source tree into the existing Pages directory.
import {execFileSync} from 'node:child_process';
import {cp,mkdir,rm,readdir,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const output=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim();
const prefix='Isolated automatic RPG preview: ';
if(!output.startsWith(prefix))throw Error('Preview builder returned an unexpected result');
const source=output.slice(prefix.length),target=resolve('docs');
await mkdir(target,{recursive:true});
await cp(join(source,'index.html'),join(target,'index.html'));
// Remove stale files only inside directories owned by the isolated builder.
// Keep unrelated Pages content outside those directories.
async function pruneBuiltDirectory(input,output){
 const wanted=new Set(await readdir(input));
 for(const entry of await readdir(output,{withFileTypes:true})){
  const dest=join(output,entry.name);
  if(!wanted.has(entry.name)){
   await rm(dest,{recursive:entry.isDirectory(),force:true});
  }else if(entry.isDirectory()&&(await lstat(join(input,entry.name))).isDirectory()){
   await pruneBuiltDirectory(join(input,entry.name),dest);
  }
 }
}
for(const dir of ['assets','combat','online','economy','preview/talent-rebuild']){
 const input=join(source,dir),dest=join(target,dir);
 await cp(input,dest,{recursive:true});
 await pruneBuiltDirectory(input,dest);
}
// Older prototype pages were never part of the current game. The only shipped
// talent preview is the real v15 iframe under preview/talent-rebuild.
for(const dir of ['arena-prototype','focused-choices-prototype','focused-flex-prototype','magic-arcane-prototype',
 'magic-choice-lateral','magic-context','magic-element-choice','magic-prototype',
 'magic-single-choice','magic-three-axes','talent-choices-prototype'])
 await rm(join(target,'preview',dir),{recursive:true,force:true});
await rm(join(target,'experiments','expedition-lab'),{recursive:true,force:true});
console.log('Updated isolated v0.13 Pages build in '+target);
