// Build the isolated v0.13 app from the source tree into the existing Pages directory.
import {execFileSync} from 'node:child_process';
import {cp,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const output=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim();
const prefix='Isolated automatic RPG preview: ';
if(!output.startsWith(prefix))throw Error('Preview builder returned an unexpected result');
const source=output.slice(prefix.length),target=resolve('docs');
await mkdir(target,{recursive:true});
await cp(join(source,'index.html'),join(target,'index.html'));
for(const dir of ['assets','combat','online','economy'])await cp(join(source,dir),join(target,dir),{recursive:true});
console.log('Updated isolated v0.13 Pages build in '+target);
