// One authored day. Requests, delivery windows and receipts share the same facts.
// Afternoon hours use the existing 12-hour puzzle; no elapsed-time arithmetic is introduced.
export const firstMailId='forest-first-mail';
export const firstMailRequests=[
 {id:'harbor-seeds',variant:-1,to:1,recipient:'シェル',what:'花のたね',h:3,received:3*60+15,
  request:'港のシェルが、桟橋の空き箱を花壇にするんだ。午後3時台は土を入れて、種をまく時間。船の仕事に戻る前に、この種を渡してほしい。',
  line:'種まきに使うから、午後3時台にお願い。',reason:'シェルが桟橋で種をまく、午後3時台。',
  letter:'モスへ。桟橋で土を入れていたら、種が届きました。箱のひとつは森の花にしたよ。何色が咲くかは、港に来る日のお楽しみ。シェル',
  outcome:'桟橋の空き箱が、小さな花壇になった。'},
 {id:'harbor-honey',variant:1,to:1,recipient:'ウズ',what:'森のはちみつ',h:4,received:4*60+20,
  request:'港のウズに、はちみつをひと瓶。午後4時台は荷下ろしを休んで、みんなでお茶を飲むんだとさ。その時間なら、桟橋の休憩所で受け取れる。',
  line:'午後4時台の休憩に、間に合うようにな。',reason:'ウズが荷下ろしを休む、午後4時台。',
  letter:'カシじいへ。休憩所で瓶を開けたら、みんな寄ってきたよ。今日は向かい風でくたびれたけど、温かいお茶に助けられた。空き瓶は次の便で返すね。ウズ',
  outcome:'荷下ろしの合間に、森のはちみつでひと休み。'},
 {id:'harbor-scarf',variant:2,to:1,recipient:'パールばあ',what:'手編みのマフラー',h:5,received:5*60+40,
  request:'パールばあに、直したマフラーを届けておくれ。午後5時台は灯台の入口で夜番を待っているよ。灯りをともすと外には出られないから、そのうちにね。',
  line:'灯台に入る前の、午後5時台に頼むよ。',reason:'パールばあが灯台の入口で待つ、午後5時台。',
  letter:'さくらばあへ。灯台に入る前に受け取ったよ。ほどけていたところ、きれいに直してくれてありがとう。今夜は首もとが暖かい。三人へのお礼に、桟橋で拾った貝がらをルカに託します。パールばあ',
  outcome:'日が暮れた港で、今夜も灯台の仕事が始まった。',gift:'🐚',giftName:'港からの貝がら'}
];
export function firstMailStep(index){
 if(!Number.isInteger(index)||index<0||index>=6)throw new RangeError('Unknown first-mail step');
 return {read:index>=3,request:firstMailRequests[index%3]};
}
export function firstMailQuestion(index){
 const {read,request:r}=firstMailStep(index),h=r.h;
 return read?{read,mode:'room',h,m:r.received%60,t:r.received,answer:String(h),options:[h%12+1,(h+10)%12+1,h].map(n=>({key:String(n),h:n}))}
  :{read,mode:'room',h,m:null,start:9*60+20};
}
export const firstMailOpening={title:'森から港へ、最初の便',scene:0,partner:'モス',goal:true,lines:[
 {who:'モス',text:'港のシェルから手紙が来たんだ。桟橋の空き箱に、森の花を植えたいって。'},
 {who:'ルカ',text:'この時計の石、鉱山で見つけたのと同じなんだ。荷札に、届ける時間を覚えてもらえるんだって。'},
 {who:'モス',text:'それなら午後3時台にお願い。シェルが土を入れて種をまく時間なんだ。そのあと船の仕事に戻るから。'},
 {who:'ルカ',text:'種をまいている間に会えるように、3時台を刻むんだね。ほかの荷物も預かって、港へ一便出そう。'}
]};
