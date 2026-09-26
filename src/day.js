import {stages,endlessLevel} from './levels.js';

// Day-clock settings for each of the 36 stages and the endless central post.
// Chapters set how fine the minute reading is; the six stages of a chapter lengthen the day
// and quicken the pace. Tickets always read like "2時30分"; only what customers say varies
// ("午後2時半", "14時30分", "2時間半後").
const opening=[420,540,600,480,900,1200];
const hourPace=[10,12,14,16,16,16];
const firstArrival=[3.4,3.2,3.2,3.4,3.2,3.2];
const horizons=[180,150,120,90,120,150];
function orderKinds(chapter,n){
 if(chapter===0)return n<2?['period']:['period','period','relative'];
 if(chapter===4)return n<2?['period','24']:['period','24','24','relative'];
 if(chapter===5)return ['relative','relative','period','24'];
 return ['period','period','relative'];
}
export const chapterSkills=['正時','30分','15分・45分','5分から1分','5分・夜の便','5分・日付をまたぐ便'];
export function dayLevel(stage){
 if(stage.endless)return {...stage,day:true,open:360,close:Infinity,step:5,hourSeconds:16,lead:8,horizon:150,capacity:8,arrive:[1.9,2.7],kinds:['period','24','relative'],same:.45,maxLost:5,speedUp:{every:12,step:.06,min:.55}};
 const c=stage.id,n=stage.number-1,fine=c===3&&n>=3;
 const step=[60,30,15,fine?1:5,5,5][c],hourSeconds=(fine?22:hourPace[c])*(1-n*.04),seconds=60+n*12;
 const unit=Math.max(step,15),close=opening[c]+Math.round(seconds/hourSeconds*60/unit)*unit;
 const gap=firstArrival[c]-n*.22;
 return {...stage,day:true,skill:fine?'1分刻み':chapterSkills[c],open:opening[c],close,step,hourSeconds,lead:9-n*.3,horizon:horizons[c],
  capacity:6+Math.floor(n/2),arrive:[gap-.4,gap+.4],kinds:orderKinds(c,n),same:.35+n*.02};
}
export const dayStages=stages.map(dayLevel);
export const dayEndless=dayLevel(endlessLevel);
