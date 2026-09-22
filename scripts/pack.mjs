import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
await import('./build.mjs');
let html=await readFile('dist/index.html','utf8');
let css=await readFile('dist/style.css','utf8');
let js=await readFile('dist/game.js','utf8');
for(const name of await readdir('dist/assets')) {
  if(!name.endsWith('.webp')) continue;
  const uri='data:image/webp;base64,'+(await readFile('dist/assets/'+name)).toString('base64');
  css=css.replaceAll('assets/'+name,uri);
  js=js.replaceAll('assets/'+name,uri);
}
const icon='data:image/svg+xml;base64,'+(await readFile('dist/favicon.svg')).toString('base64');
html=html.replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`)
  .replace('<script src="game.js" defer></script>',`<script>${js}</script>`)
  .replace('href="favicon.svg"',`href="${icon}"`);
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/miracle-clock.html',html);
console.log('Packed self-contained game → artifacts/miracle-clock.html');
