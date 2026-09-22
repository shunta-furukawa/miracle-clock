import {normalizeTime, timeText, durationText} from './time.js';
export const customers=[
 {id:1,name:'モス',parcel:'花のたね',destination:'こもれびの森'},
 {id:2,name:'シェル',parcel:'真珠の贈りもの',destination:'しおかぜの港'},
 {id:3,name:'クリム',parcel:'光る結晶',destination:'きらめきの洞窟'},
 {id:4,name:'フレア',parcel:'飛行機の部品',destination:'あかねの工房'},
 {id:5,name:'フウ',parcel:'風のたより',destination:'雲の展望台'},
 {id:6,name:'スナリ',parcel:'温室の苗',destination:'砂丘の温室'}
];
export const residents=[['ふたば','カシじい','さくらばあ'],['ピンクル','ウズ','パールばあ'],['コハク','アメル','ローズじい'],['チロ','ゴン','ガンじい'],['ワタ','ソヨ','シロばあ'],['ポポ','ネム','サフランばあ']];
export const depotNames=['森の配送所','港の配送所','結晶の配送所','工房の配送所','雲の配送所','砂丘の温室配送所','空の中央配送所'];
const parcels=[['花のたね','森のはちみつ','花のお茶'],['貝がらの贈りもの','海のジャム','真珠の飾り'],['小さな結晶灯','鉱石の標本','虹のかけら'],['飛行機の部品','真鍮の歯車','手作りのランタン'],['風のたより','雲のクッション','星の地図'],['砂丘のお茶','芽吹いた苗','香りのたね']];
export function customerFor(level,index){
 const region=level.endless?index%6:level.id;
 const guide=customers[region],variant=level.endless?Math.floor(index/6)%4-1:index===0?-1:(index-1)%3;
 return {...guide,name:variant<0?guide.name:residents[region][variant],region,variant,destination:customers[(region+1+index%5)%6].destination,parcel:variant<0?guide.parcel:parcels[region][variant]};
}
export function customerMood(order){return order.waited>=55?'tired':order.waited>=25?'waiting':'calm';}
export const levels = [
  {id:0,title:'はじめての空の便',place:'こもれびの森',skill:'ぴったりの時刻',step:60,count:5,interval:35,format:'12',times:[180,300,540,720,120],intro:'森の配送所が開店じゃ。モスと森の住民から荷物を預かろう。短い針が「時」、長い針が「分」を教えてくれるぞ。',lesson:'短い針を動かしてみよう。長い針は12に合わせるんじゃ。'},
  {id:1,title:'港のティータイム',place:'しおかぜの港',skill:'30分・「半」',step:30,count:6,interval:33,format:'half',times:[210,450,630,90,690,330],intro:'港の配送所じゃ。シェルと貝の住民のお茶会の荷物を預かろう。「半」は30分。長い針を半周させてみよう。',lesson:'長い針が6なら30分。短い針も、数字と数字の真ん中へ進むぞ。'},
  {id:2,title:'結晶のひかるころ',place:'きらめきの洞窟',skill:'15分・30分・45分',step:15,count:7,interval:31,format:'12',times:[195,345,570,675,135,465,255],intro:'結晶の配送所じゃ。クリムとモグラの住民の灯りを届けよう。時計を4つに分けると、15分ずつになるんじゃ。',lesson:'長い針が3なら15分、6なら30分、9なら45分じゃ。'},
  {id:3,title:'工房はおおいそがし',place:'あかねの工房',skill:'5分刻み → 1分刻み',step:5,count:8,interval:33,format:'12',times:[200,490,655,145,382,527,614,299],intro:'工房の配送所じゃ。フレアと火の住民から細かな注文が来るぞ。まず5分ずつ、後半は小さな目盛りを1分ずつ読もう。',lesson:'数字をひとつ進むと5分。小さな目盛りひとつは1分じゃよ。'},
  {id:4,title:'太陽と月の配達便',place:'雲の展望台',skill:'午前・午後・24時間',step:5,count:8,interval:35,format:'period',times:[570,930,0,720,1095,60,1260,765],intro:'雲の配送所じゃ。フウと風の住民は夜のお届けも頼むぞ。同じ針の形でも、午前と午後を選び分けるんじゃ。',lesson:'午後3時は15時。午前0時は夜中、午後0時はお昼の12時じゃ。'},
  {id:5,title:'砂丘で育つ約束',place:'砂丘の温室',skill:'何分後・何時間後',step:5,count:8,interval:38,format:'relative',times:[45,90,150,30,120,75,150,45],intro:'砂丘の温室では、スナリとトビネズミ族が苗やお茶を送るぞ。「いまから何分後？」の注文じゃ。受付の時計から針を進めて、お届けする時刻を見つけよう。',lesson:'受付時刻は注文票に残るぞ。長い針を一周させると、1時間先になるんじゃ。'}
];
// Six small steps per chapter: early stages introduce one idea, later ones mix it.
const stageTimes=[
 [[180,360,540],[60,120,240,300],[420,480,600,660],[720,180,540,360],[300,660,120,480],[720,60,660,180,420,540]],
 [[210,390,570],[90,270,450,630],[180,210,360,390],[690,30,660,60],[150,330,510,690],[720,30,180,210,540,570]],
 [[195,375,555],[225,405,585],[195,210,225,240],[675,690,705,720],[75,165,345,555],[15,135,270,405,585,705]],
 [[185,190,200],[325,340,350],[55,65,295,605],[181,182,184,187],[322,347,509,614],[59,61,299,382,527,719]],
 [[180,360,540],[900,1080,1260],[210,930,570,1290],[0,720,30,750],[615,975,45,1185],[0,720,570,930,1095,1260]],
 [[15,30],[45,60],[15,45,75],[90,120],[30,60,150],[45,90,150,30,120,75]]
];
const stageNames=[['短い針を見つけよう','いろんな「時」','森のおひる便','12時をこえて','森のにぎわい','森の配達係'],['長い針は6','半の約束','ぴったりと半','港の朝じたく','お茶会の便','港の配達係'],['15分の光','45分の光','4つに分けよう','次の時へ','結晶灯の便','結晶の配達係'],['5分ずつ数えよう','数字の間を読む','工房の5分便','小さな目盛り','1分の約束','工房の配達係'],['午前のお届け','午後のお届け','朝と夜をえらぶ','ふたつの12時','24時間の時計','雲の配達係'],['15分後、30分後','ひとまわり先へ','時をまたぐ苗','何時間後？','温室の出荷便','明日への約束']];
export const stages=levels.flatMap((chapter,c)=>Array.from({length:6},(_,n)=>({...chapter,stageId:c*6+n,number:n+1,stageTitle:stageNames[c][n],count:3+n,interval:n===0||c===0&&n===1?0:[0,58,52,46,40,35][n]+c,step:c===3?(n<3?5:1):chapter.step,times:stageTimes[c][n],format:c===4&&n>=4?'24':chapter.format,bases:c===5?(n===0?[540,600,660]:n===1?[540,600,660]:n===2?[570,645,690]:n===3?[480,600,780]:n===4?[645,690,810]:[570,690,1335,1425,660,810]):undefined,guide:n<2,starPace:[14,17,20,24,26,32][c]})));
export const endlessLevel={id:6,title:'トトじいと空の中央便',stageTitle:'空の中央便',place:'空の中央配送所',skill:'全てのお客さん・全ての時刻',endless:true,count:Infinity,interval:36,step:1,format:'mixed',lesson:'注文ごとに時刻の読み方が変わるぞ。ゆっくり確かめて、島じゅうの荷物を届けよう。'};
export const stageUnlocked=(record,id)=>id===0||record?.stages?.includes(id)||record?.stages?.includes(id-1);
export const endlessUnlocked=record=>stages.every(s=>record?.stages?.includes(s.stageId));
export function makeOrder(level,index){
 const question=level.endless?stages[(index*7+Math.floor(index/36))%36]:level;
 const person=customerFor(level,index),step=question.stageId===undefined&&question.id===3&&index>=4?1:question.step;
 const base=question.format==='relative'?(question.bases||[570,690,1335,1425,660,810,1320,705])[index%(question.bases?.length||8)]:480+index*5;
 const duration=question.format==='relative'?question.times[index%question.times.length]:0;
 const target=normalizeTime(duration?base+duration:question.times[index%question.times.length]);
 const period=['period','24','relative'].includes(question.format);
 const format=question.format==='24'||question.stageId===undefined&&question.id===4&&index>=4?'24':period?'period':'12';
 let label=duration?durationText(duration):timeText(target,format);
 if(question.format==='half'&&index%2===0)label=label.replace('30分','半');
 return {...person,waited:0,origin:depotNames[level.id],orderId:index,characterId:person.id,target,base,duration,period,step,label,questionChapter:question.id,nextDay:!!duration&&base+duration>=1440};
}
export const prepareDial=(order,current=720)=>order.duration?order.base:normalizeTime(Math.round(current/order.step)*order.step);
export const arrivalInterval=s=>s.level.endless?Math.max(10,36-Math.floor(s.delivered/12)*2):s.level.interval;
export function createSession(level){return {level,queue:[makeOrder(level,0)],generated:1,delivered:0,mistakes:0,elapsed:0,activeTime:0,status:'playing',capacity:5};}
export function tickSession(s,seconds){
 if(s.status!=='playing'||!Number.isFinite(seconds)||seconds<0)return;
 s.activeTime+=seconds;for(const order of s.queue)order.waited+=seconds;
 const interval=arrivalInterval(s);if(!interval)return;
 s.elapsed+=seconds;
 while(s.elapsed>=interval&&s.generated<s.level.count){s.elapsed-=interval;if(s.queue.length>=s.capacity){s.status='over';return;}s.queue.push(makeOrder(s.level,s.generated++));if(s.queue.length>=s.capacity){s.status='over';return;}}
}
export function completeOrder(s){if(s.status!=='playing')return;s.queue.shift();s.delivered++;if(s.delivered>=s.level.count){s.status='cleared';return;}if(!s.queue.length)s.queue.push(makeOrder(s.level,s.generated++));}
export const starGoal=stage=>({time:Math.round(stage.count*stage.starPace),twoTime:Math.round(stage.count*stage.starPace*1.6),mistakes:0,twoMistakes:2});
export function rateRun(stage,session){const goal=starGoal(stage),time=Math.round(session.activeTime*10)/10,mistakes=session.mistakes;return {stars:time<=goal.time&&mistakes===0?3:time<=goal.twoTime&&mistakes<=2?2:1,time,mistakes};}
export function betterRecord(a,b){if(!a)return b;if(a.stars!==b.stars)return a.stars>b.stars?a:b;if(a.mistakes!==b.mistakes)return a.mistakes<b.mistakes?a:b;return a.time<=b.time?a:b;}
export const starText=n=>'★'.repeat(n)+'☆'.repeat(3-n);
export const totalStars=r=>Object.values(r?.stars||{}).reduce((n,s)=>n+s.stars,0);
