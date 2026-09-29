// Builds the single-file air-post clock prototype with the game's own art inlined.
import {readFileSync,writeFileSync} from 'node:fs';
const here=new URL('.',import.meta.url),assets=new URL('../../src/assets/',import.meta.url);
const uri=p=>`data:image/webp;base64,${readFileSync(new URL(p,assets)).toString('base64')}`;
const gems=[null,...Array.from({length:12},(_,i)=>uri(`gems/${i+1}.webp`))];
// Depot art in chapter order; the desert greenhouse is depots/6 and the central post depots/5, as in the game.
const art={toto:uri('sky-toto.webp'),plane:uri('delivery-plane.webp'),luka:uri('luka-victory.webp'),atlas:uri('queue-residents.webp'),central:uri('depots/5.webp'),islands:[0,1,2,3,4,6].map(i=>uri(`depots/${i}.webp`))};
const src=readFileSync(new URL('lesson.src.html',here),'utf8');
const out=process.argv[2]||new URL('lesson.html',here);
writeFileSync(out,src.replace('__GEMS__',JSON.stringify(gems)).replace('__ART__',JSON.stringify(art)));
console.log('built',out);
