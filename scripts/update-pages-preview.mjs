// Build the isolated v0.13 app from the source tree into the existing Pages directory.
import {execFileSync} from 'node:child_process';
import {cp,mkdir,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const output=execFileSync(process.execPath,['scripts/prepare-automatic-preview.mjs'],{encoding:'utf8'}).trim();
const prefix='Isolated automatic RPG preview: ';
if(!output.startsWith(prefix))throw Error('Preview builder returned an unexpected result');
const source=output.slice(prefix.length),target=resolve('docs');
await mkdir(target,{recursive:true});
await cp(join(source,'index.html'),join(target,'index.html'));
for(const dir of ['assets','combat','online','economy'])await cp(join(source,dir),join(target,dir),{recursive:true});
await cp(join(source,'preview/talent-rebuild'),join(target,'preview/talent-rebuild'),{recursive:true});
// Current clean-sheet preview must also remove explicitly retired scripts. cp()
// merges directories and would otherwise keep deleted files available in docs/.
for(const name of ['automatic-talents.js','automatic-talent-layout.js'])
 await rm(join(target,'combat',name),{force:true});
// Older prototype pages were never part of the current game. The only shipped
// talent preview is the real v15 iframe under preview/talent-rebuild.
for(const dir of ['focused-choices-prototype','focused-flex-prototype','magic-arcane-prototype',
 'magic-choice-lateral','magic-context','magic-element-choice','magic-prototype',
 'magic-single-choice','magic-three-axes','talent-choices-prototype'])
 await rm(join(target,'preview',dir),{recursive:true,force:true});
console.log('Updated isolated v0.13 Pages build in '+target);
