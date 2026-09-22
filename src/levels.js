import {normalizeTime, timeText, durationText} from './time.js';
export const customers = [
  {id:1,name:'モス',parcel:'花のたね',destination:'こもれびの森'},
  {id:2,name:'シェル',parcel:'真珠の贈りもの',destination:'しおかぜの港'},
  {id:3,name:'クリム',parcel:'光る結晶',destination:'きらめきの洞窟'},
  {id:4,name:'フレア',parcel:'飛行機の部品',destination:'あかねの工房'},
  {id:5,name:'フウ',parcel:'風のたより',destination:'雲の展望台'}
];
export const residents = [
 ['ふたば','カシじい','さくらばあ'], ['ピンクル','ウズ','パールばあ'],
 ['コハク','アメル','ローズじい'], ['チロ','ゴン','ガンじい'], ['ワタ','ソヨ','シロばあ']
];
export const depotNames=['森の配送所','港の配送所','結晶の配送所','工房の配送所','雲の配送所','空の中央配送所'];
const parcels=[['花のたね','森のはちみつ','花のお茶'],['貝がらの贈りもの','海のジャム','真珠の飾り'],['小さな結晶灯','鉱石の標本','虹のかけら'],['飛行機の部品','真鍮の歯車','手作りのランタン'],['風のたより','雲のクッション','星の地図']];
export function customerFor(level,index){
 const region=level.id===5?index%5:level.id;
 const guide=customers[region],variant=index===0?-1:(level.id===5?Math.floor(index/5):index-1)%3;
 const destination=customers[(region+1+index%4)%5].destination;
 return {...guide,name:variant<0?guide.name:residents[region][variant],region,variant,destination,parcel:variant<0?guide.parcel:parcels[region][variant]};
}
export function customerMood(order,practice=false){return practice?'calm':order.waited>=55?'tired':order.waited>=25?'waiting':'calm';}
export const levels = [
  {id:0,title:'はじめての空の便',place:'こもれびの森',skill:'ぴったりの時刻',step:60,count:5,interval:35,format:'12',times:[180,300,540,720,120],intro:'森の配送所が開店じゃ。モスと森の住民から荷物を預かろう。短い針が「時」、長い針が「分」を教えてくれるぞ。',lesson:'短い針を動かしてみよう。長い針は12に合わせるんじゃ。'},
  {id:1,title:'港のティータイム',place:'しおかぜの港',skill:'30分・「半」',step:30,count:6,interval:33,format:'half',times:[210,450,630,90,690,330],intro:'港の配送所じゃ。シェルと貝の住民のお茶会の荷物を預かろう。「半」は30分。長い針を半周させてみよう。',lesson:'長い針が6なら30分。短い針も、数字と数字の真ん中へ進むぞ。'},
  {id:2,title:'結晶のひかるころ',place:'きらめきの洞窟',skill:'15分・30分・45分',step:15,count:7,interval:31,format:'12',times:[195,345,570,675,135,465,255],intro:'結晶の配送所じゃ。クリムとモグラの住民の灯りを届けよう。時計を4つに分けると、15分ずつになるんじゃ。',lesson:'長い針が3なら15分、6なら30分、9なら45分じゃ。'},
  {id:3,title:'工房はおおいそがし',place:'あかねの工房',skill:'5分刻み → 1分刻み',step:5,count:8,interval:33,format:'12',times:[200,490,655,145,382,527,614,299],intro:'工房の配送所じゃ。フレアと火の住民から細かな注文が来るぞ。まず5分ずつ、後半は小さな目盛りを1分ずつ読もう。',lesson:'数字をひとつ進むと5分。小さな目盛りひとつは1分じゃよ。'},
  {id:4,title:'太陽と月の配達便',place:'雲の展望台',skill:'午前・午後・24時間',step:5,count:8,interval:35,format:'period',times:[570,930,0,720,1095,60,1260,765],intro:'雲の配送所じゃ。フウと風の住民は夜のお届けも頼むぞ。同じ針の形でも、午前と午後を選び分けるんじゃ。',lesson:'午後3時は15時。午前0時は夜中、午後0時はお昼の12時じゃ。'},
  {id:5,title:'島をつなぐ中央便',place:'空の中央配送所',skill:'何分後・何時間後',step:5,count:8,interval:38,format:'relative',times:[45,90,150,30,120,75,150,45],intro:'中央配送所には、すべての島の住民が来るぞ。「いまから何分後？」の注文じゃ。受付の時計から針を進めて、お届けする時刻を見つけよう。',lesson:'受付時刻は注文票に残るぞ。長い針を一周させると、1時間先になるんじゃ。'}
];
export function makeOrder(level, index) {
  const person = customerFor(level,index);
  const step = level.id === 3 && index >= 4 ? 1 : level.step;
  const base = level.id === 5 ? [570,690,1335,1425,660,810,1320,705][index % 8] : 480 + index * 5;
  const duration = level.format === 'relative' ? level.times[index % level.times.length] : 0;
  const target = normalizeTime(duration ? base + duration : level.times[index % level.times.length]);
  const period = level.id >= 4;
  const format = level.id === 4 && index >= 4 ? '24' : period ? 'period' : '12';
  let label = duration ? durationText(duration) : timeText(target, format);
  if (level.format === 'half' && index % 2 === 0) label = label.replace('30分','半');
  return {...person,waited:0,origin:depotNames[level.id],orderId:index,characterId:person.id,target,base,duration,period,step,label,nextDay:!!duration && base + duration >= 1440};
}
export function createSession(level, practice=false) {
  return {level,practice,queue:[makeOrder(level,0)],generated:1,delivered:0,mistakes:0,elapsed:0,status:'playing',capacity:5};
}
export function tickSession(session, seconds) {
  if (session.status !== 'playing' || session.practice) return;
  for(const order of session.queue)order.waited+=seconds;
  session.elapsed += seconds;
  while(session.elapsed >= session.level.interval && session.generated < session.level.count) {
    session.elapsed -= session.level.interval;
    if(session.queue.length >= session.capacity) {session.status='over';return;}
    session.queue.push(makeOrder(session.level,session.generated++));
    if(session.queue.length >= session.capacity) {session.status='over';return;}
  }
}
export function completeOrder(session) {
  if(session.status!=='playing') return;
  session.queue.shift();session.delivered++;
  const goal=session.practice?3:session.level.count;
  if(session.delivered>=goal){session.status='cleared';return;}
  if(!session.queue.length) session.queue.push(makeOrder(session.level,session.generated++));
}
