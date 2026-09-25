import {createHash} from 'node:crypto';
import {cp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('src','dist',{recursive:true});
// A single script also permits a file-based preview; production remains fully static.
const sources=await Promise.all(['soundtrack.js','time.js','levels.js','elements.js','save.js','dialogue.js','stories.js','depot.js','detent.js','celebration.js','opening.js','stamp.js','rush.js','app.js'].map(f=>readFile('src/'+f,'utf8')));
const bundle=sources.map(s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n');
await writeFile('dist/game.js',bundle);
const html=(await readFile('src/index.html','utf8')).replace('<script type="module" src="app.js"></script>','<script src="game.js" defer></script>');
await writeFile('dist/index.html',html);
console.log('Built Miracle Clock → dist/');

async function assetsAt(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?assetsAt(dir+'/'+e.name):dir+'/'+e.name))).flat();}
const files=(await assetsAt('dist')).filter(p=>!p.endsWith('/sw.js')).sort();
const hash=createHash('sha256');for(const file of files){hash.update(file);hash.update(await readFile(file));}
const version=hash.digest('hex').slice(0,16);
await writeFile('dist/index.html',html.replace('__BUILD__',version));
await writeFile('dist/version.json',JSON.stringify({build:version}));
files.push('dist/version.json');
const worker=(await readFile('src/sw.js','utf8')).replace('__VERSION__',version).replace('__ASSETS__',JSON.stringify(files.map(p=>'./'+p.slice(5))));
await writeFile('dist/sw.js',worker);
