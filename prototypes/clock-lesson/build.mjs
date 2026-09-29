// Builds the single-file forest-depot clock prototype with the game's own gem and resident art inlined.
import {readFileSync,writeFileSync} from 'node:fs';
const here=new URL('.',import.meta.url),assets=new URL('../../src/assets/',import.meta.url);
const uri=p=>`data:image/webp;base64,${readFileSync(new URL(p,assets)).toString('base64')}`;
const gems=[null,...Array.from({length:12},(_,i)=>uri(`gems/${i+1}.webp`))];
const people=[['ふたば','0-0'],['カシじい','0-1'],['さくらばあ','0-2'],['ピンクル','1-0'],['コハク','2-0'],['ワタ','4-0']].map(([name,f])=>({name,img:uri(`residents/${f}.webp`)}));
const art={toto:uri('sky-toto.webp'),depot:uri('depots/0.webp'),plane:uri('delivery-plane.webp')};
const src=readFileSync(new URL('lesson.src.html',here),'utf8');
const out=process.argv[2]||new URL('lesson.html',here);
writeFileSync(out,src.replace('__GEMS__',JSON.stringify(gems)).replace('__PEOPLE__',JSON.stringify(people)).replace('__ART__',JSON.stringify(art)));
console.log('built',out);
