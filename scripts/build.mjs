import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('src','dist',{recursive:true});
// A single script also permits a file-based preview; production remains fully static.
const sources=await Promise.all(['time.js','levels.js','elements.js','app.js'].map(f=>readFile('src/'+f,'utf8')));
const bundle=sources.map(s=>s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'')).join('\n');
await writeFile('dist/game.js',bundle);
const html=(await readFile('src/index.html','utf8')).replace('<script type="module" src="app.js"></script>','<script src="game.js" defer></script>');
await writeFile('dist/index.html',html);
console.log('Built Miracle Clock → dist/');
