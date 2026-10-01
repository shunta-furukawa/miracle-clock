// Six depots x six stages of calm clock puzzles: each customer sends a parcel (set the hands),
// then the plane brings back the friend's reply stamped with the time it was written (read the hands).
// Stage titles, guides and residents come from levels.js; this file holds the puzzle for each stage.

const POST_FIVES=[5,10,15,20,25,30,35,40,45,50,55],POST_ONES=Array.from({length:60},(_,i)=>i).filter(i=>i%5);
// [item, parcel, recipient depot, reply, gift, gift name]
export const postStories=[
 [['🌱','花のたね',1,'たね、ありがとう！ 港の窓辺で育てるわ。お返しに、きれいな貝がらを入れておいたの。','🐚','貝がら'],['🍯','森のはちみつ',2,'甘くて元気が出たよ！ 洞窟で光る石を見つけたから、どうぞ。','💎','光る石'],['🍵','花のお茶',4,'いい香り！ 雲のわたあめを詰めてみたよ。','☁️','雲のわたあめ'],['🍄','きのこスープのレシピ',3,'さっそく作ったよ、おいしかった！ ぜんまい仕掛けのおもちゃをあげる。','⚙️','ぜんまいのおもちゃ'],['🌰','どんぐりクッキー',5,'サクサクだね！ 温室で咲いたサボテンの花を送るよ。','🌵','サボテンの花'],['🧣','手編みのマフラー',4,'ふわふわで暖かい！ 虹のかけらを一つどうぞ。','🌈','虹のかけら']],
 [['🎁','貝がらの贈りもの',0,'森の机に飾ったよ！ 四つ葉を見つけたから、おすそわけ。','🍀','四つ葉'],['🍓','海のジャム',3,'パンに塗って食べたよ！ 小さなスパナを作ったんだ。','🔧','小さなスパナ'],['📿','真珠の飾り',2,'洞窟の中できらきら光ってるよ！ 水晶玉をどうぞ。','🔮','水晶玉'],['🐟','干し魚',5,'温室のみんなで食べたよ。ハーブの束を入れておくね。','🌿','ハーブの束'],['🗺️','海の地図',4,'雲の上から海が見えたよ！ 凧を送るね。','🪁','凧'],['🫧','しゃぼん玉の液',0,'森じゅうがしゃぼん玉だらけ！ 桜のしおりをどうぞ。','🌸','桜のしおり']],
 [['🏮','小さな結晶灯',1,'夜の港が明るくなったわ！ 真珠をひと粒どうぞ。','🦪','真珠'],['🪨','鉱石の標本',3,'いい石だね！ 磨き上げたベルを送るよ。','🛎️','ぴかぴかのベル'],['💠','虹色の結晶',4,'雲に映して遊んだよ！ 流れ星のかけらをどうぞ。','🌠','流れ星のかけら'],['🍄','光るきのこ',0,'森の夜道にぴったりだ！ どんぐりを入れておくね。','🌰','どんぐり'],['🔔','鉱石の鈴',5,'涼しい音だね！ 砂時計を送るよ。','⏳','砂時計'],['🕯️','結晶のろうそく',1,'灯台の絵はがきを描いてみたの。','🖼️','灯台の絵はがき']],
 [['⚙️','真鍮の歯車',2,'洞窟のトロッコが動いたよ！ 結晶の飾りをどうぞ。','💠','結晶の飾り'],['🪔','手作りのランタン',0,'森の夜が暖かくなったよ！ りんごを入れておいた。','🍎','森のりんご'],['🔩','飛行機の部品',4,'雲の飛行機が直ったよ！ きれいな羽根をどうぞ。','🪶','きれいな羽根'],['🕰️','修理した時計',1,'港の時計がまた動き出したわ！ ガラスの魚をどうぞ。','🐠','ガラスの魚'],['🧸','ぜんまい人形',5,'温室で踊ってるよ！ ひまわりを送るね。','🌻','ひまわり'],['🔑','不思議な鍵',2,'洞窟の宝箱が開いたよ！ 結晶の指輪をどうぞ。','💍','結晶の指輪']],
 [['💌','風のたより',0,'森のみんなで読んだよ！ 七夕の笹を送るね。','🎋','七夕の笹'],['🛏️','雲のクッション',2,'ふかふかでよく眠れた！ 月の石をどうぞ。','🌙','月の石'],['🗺️','星の地図',3,'地図で星を探したよ！ 手作りの望遠鏡をどうぞ。','🔭','手作りの望遠鏡'],['🎐','風鈴',1,'涼しい音ね！ 波の音を閉じ込めた瓶を送るわ。','🫙','波音の瓶'],['🪁','雲の凧',5,'砂丘の空に揚がったよ！ すいかをどうぞ。','🍉','すいか'],['⭐','星のかけら',0,'森の夜がきれいになった！ ふくろうの置物を作ったよ。','🦉','ふくろうの置物']],
 [['🫖','砂丘のお茶',4,'雲の上でお茶会をしたよ！ 風船を送るね。','🎈','風船'],['🌱','芽吹いた苗',0,'森に植えたよ！ 木の実を詰めておいたね。','🫐','木の実'],['🌺','香りのたね',1,'港に花が咲いたわ！ イルカの置物をどうぞ。','🐬','イルカの置物'],['🏺','砂のつぼ',3,'工房に飾ったよ！ 小さな置き時計をあげる。','⏰','小さな置き時計'],['🌵','小さなサボテン',2,'洞窟でも元気に育ってるよ！ 星くずの瓶をどうぞ。','✨','星くずの瓶'],['🍪','デーツのお菓子',4,'みんなで食べたよ！ 伝書鳩の手紙を送るね。','🕊️','伝書鳩の手紙']]
];
// Each stage: how the question is asked (cfg) and Toto's opening words (intro, may contain <b> marks).
export const postStages=[
 {cfg:{mode:'room',drag:'hour',labels:true},intro:'森の配送所、開店じゃ！ 短い針は<b class="h">時の針</b>。時の針がいる<b class="h">宝石の部屋</b>で、何時かがわかるんじゃ。'},  // 1-1 短い針を見つけよう
 {cfg:{mode:'room',drag:'hour',labels:true},intro:'部屋は宝石から次の宝石まで。時の針が数字を越えたら、もう次の部屋じゃ。'},  // 1-2 いろんな「時」
 {cfg:{mode:'hm',pool:[0],drag:'hour',exact:true,labels:true,step:60},intro:'長い針は<b class="m">分の針</b>。分の針が真上の12にあれば「<b class="m">ちょうど</b>」の便じゃ。'},  // 1-3 森のおひる便
 {cfg:{mode:'hm',pool:[0],hours:[10,11,12,1,2],drag:'hour',exact:true,labels:true,step:60},intro:'12の部屋は、12から1の間。12時の次は、また1時に戻るんじゃ。'},  // 1-4 12時をこえて
 {cfg:{mode:'hm',pool:[0],drag:'hour',exact:true,labels:true,step:60},intro:'お客さんが増えてきたのう。時の針の部屋を一つずつ確かめるんじゃ。'},  // 1-5 森のにぎわい
 {cfg:{mode:'hm',pool:[0],drag:'hour',exact:true,labels:false,step:60},intro:'今日は部屋の数字を消しておくぞ。宝石の色と時の針を頼りにするんじゃ。'},  // 1-6 森の配達係
 {cfg:{mode:'min',pool:[0,30],drag:'minute',step:30,labels:false},intro:'港では「半」の注文が多いぞ。<b class="m">分の針</b>が真下の<b class="m">6</b>なら<b class="m">30分</b>。6分ではないぞ。'},  // 2-1 長い針は6
 {cfg:{mode:'hm',pool:[30],half:1,drag:'both',step:30,labels:true},intro:'「3時半」は3時30分。分の針が6のとき、<b class="h">時の針</b>は3と4の<b class="h">真ん中</b>におるんじゃ。'},  // 2-2 半の約束
 {cfg:{mode:'hm',pool:[0,30],half:.5,drag:'both',step:30,labels:true},intro:'ちょうどと半が混ざるぞ。分の針は12か6、時の針は部屋の入口か真ん中じゃ。'},  // 2-3 ぴったりと半
 {cfg:{mode:'hm',pool:[0,30],hours:[5,6,7,8,9],half:.5,drag:'both',step:30,labels:true},intro:'港の朝は早い。時の針がどの部屋にいるか、よく見ておくれ。'},  // 2-4 港の朝じたく
 {cfg:{mode:'hm',pool:[0,30],half:.5,drag:'both',step:30,labels:true},intro:'お茶会の注文じゃ。「半」と「30分」は同じ時刻じゃよ。'},  // 2-5 お茶会の便
 {cfg:{mode:'hm',pool:[0,30],half:.5,drag:'both',step:30,labels:false},intro:'部屋の数字を消しておくぞ。港の配達係の腕の見せどころじゃ。'},  // 2-6 港の配達係
 {cfg:{mode:'min',pool:[0,15,30,45],drag:'minute',step:15,labels:false},intro:'文字盤を<b class="m">4つ</b>に分けると、分の針は12、3、6、9。<b class="m">3</b>の位置が<b class="m">15分</b>じゃ。'},  // 3-1 15分の光
 {cfg:{mode:'hm',pool:[15,45],drag:'both',step:15,labels:true},intro:'分の針が<b class="m">9</b>なら<b class="m">45分</b>。このとき時の針は、次の数字にかなり近づいておるぞ。'},  // 3-2 45分の光
 {cfg:{mode:'hm',pool:[0,15,30,45],drag:'both',step:15,labels:true},intro:'12、3、6、9。分の針がどこにあるか、4つから見極めるんじゃ。'},  // 3-3 4つに分けよう
 {cfg:{mode:'hm',pool:[45],drag:'both',step:15,labels:true},intro:'45分は間違えやすいぞ。時の針は次の数字のすぐ手前、<b class="h">まだ前の部屋</b>におるんじゃ。'},  // 3-4 次の時へ
 {cfg:{mode:'hm',pool:[0,15,30,45],drag:'both',step:15,labels:true},intro:'結晶灯の注文が山ほどじゃ。時の針は部屋、分の針は4つの位置。'},  // 3-5 結晶灯の便
 {cfg:{mode:'hm',pool:[0,15,30,45],drag:'both',step:15,labels:false},intro:'部屋の数字を消しておくぞ。結晶の明かりを頼りに、よく見るんじゃ。'},  // 3-6 結晶の配達係
 {cfg:{mode:'min',pool:POST_FIVES,drag:'minute',step:5,labels:false},intro:'分の針は、数字を一つ進むごとに<b class="m">5分</b>。5、10、15…と数えるんじゃ。'},  // 4-1 5分ずつ数えよう
 {cfg:{mode:'hm',pool:POST_FIVES,drag:'both',step:5,labels:true},intro:'時の針が数字と数字の<b class="h">間</b>にあるときは、部屋の数字を読む。次の数字ではないぞ。'},  // 4-2 数字の間を読む
 {cfg:{mode:'hm',pool:POST_FIVES,drag:'both',step:5,labels:true},intro:'工房は大忙しじゃ！ 時の針は部屋、分の針は外周の数字じゃ。'},  // 4-3 工房の5分便
 {cfg:{mode:'min',pool:POST_ONES,drag:'minute',step:1,labels:false},intro:'数字の間の<b class="m">小さな目盛り</b>は1分ずつ。近くの5分から数えるんじゃ。'},  // 4-4 小さな目盛り
 {cfg:{mode:'hm',pool:POST_ONES,drag:'both',step:1,labels:true},intro:'1分刻みの注文じゃ。まず時の針の部屋、次に分の針の目盛り。'},  // 4-5 1分の約束
 {cfg:{mode:'hm',pool:POST_FIVES.concat(POST_ONES),drag:'both',step:1,labels:false},intro:'部屋の数字を消しておくぞ。職人のように、目盛りを一つずつ読むんじゃ。'},  // 4-6 工房の配達係
 {cfg:{mode:'hm',pool:[0,30],period:true,only:0,drag:'both',step:30,labels:true},intro:'同じ針の形でも、一日に2回あるんじゃ。夜の0時から昼の12時までが<b>午前</b>。文字盤の窓を見るんじゃ。'},  // 5-1 午前のお届け
 {cfg:{mode:'hm',pool:[0,30],period:true,only:1,drag:'both',step:30,labels:true},intro:'昼の12時から夜の12時までが<b>午後</b>。刻印の前に「午後」を選ぶんじゃ。'},  // 5-2 午後のお届け
 {cfg:{mode:'hm',pool:POST_FIVES,period:true,drag:'both',step:5,labels:true},intro:'午前か午後か、荷札をよく見るんじゃ。針を合わせたら、窓も確かめるんじゃぞ。'},  // 5-3 朝と夜をえらぶ
 {cfg:{mode:'hm',pool:[0,30],hours:[12,11,1],period:true,drag:'both',step:30,labels:true},intro:'12の部屋は特別じゃ。真夜中は<b>午前0時</b>、昼は<b>午後0時</b>と呼ぶんじゃ。'},  // 5-4 ふたつの12時
 {cfg:{mode:'hm',pool:POST_FIVES,period:'24',drag:'both',step:5,labels:true},intro:'<b>18時</b>は午後6時。午後の時刻は、12を足して呼ぶこともあるんじゃ。'},  // 5-5 24時間の時計
 {cfg:{mode:'hm',pool:POST_FIVES,period:'24',drag:'both',step:5,labels:false},intro:'部屋の数字を消しておくぞ。24時間の荷札も、雲の配達係なら大丈夫じゃ。'},  // 5-6 雲の配達係
 {cfg:{mode:'rel',dur:[15,30],nows:[0],drag:'both',step:15,labels:true},intro:'砂丘の注文は「今から何分後」。<b>点線の針が今の時刻</b>じゃ。そこから分の針を進めるんじゃ。'},  // 6-1 15分後、30分後
 {cfg:{mode:'rel',dur:[30,45,60],nows:[0,15,30],drag:'both',step:15,labels:true},intro:'分の針が<b>一周</b>すると<b>60分</b>、つまり1時間。時の針は隣の部屋に移るぞ。'},  // 6-2 ひとまわり先へ
 {cfg:{mode:'rel',dur:[20,30,40],nows:[40,45,50],drag:'both',step:5,labels:true},intro:'分の針が12を越えると、時の針も次の部屋へ。時をまたいでも慌てるでないぞ。'},  // 6-3 時をまたぐ苗
 {cfg:{mode:'rel',dur:[60,120,180],nows:[0,10,20,30],drag:'both',step:5,labels:true},intro:'「2時間後」なら、時の針が<b class="h">部屋2つ分</b>進む。分の針は同じ位置に戻るんじゃ。'},  // 6-4 何時間後？
 {cfg:{mode:'rel',dur:[15,25,45,90],nows:[0,10,20,30,40,50],drag:'both',step:5,labels:true},intro:'出荷便はいろいろな時間じゃ。今の針から順に進めるんじゃ。'},  // 6-5 温室の出荷便
 {cfg:{mode:'rel',dur:[20,35,50,75,120],nows:[5,15,25,35,45],drag:'both',step:5,labels:false},intro:'部屋の数字を消しておくぞ。今の時刻から考えれば、どんな約束も届けられるんじゃ。'},  // 6-6 明日への約束
];

// ---------- questions (pure: no DOM, randomness injectable for tests) ----------
export const postHourOf=t=>Math.floor(postMs(t)/60)||12;
export const postMinOf=t=>((Math.round(t)%60)+60)%60;
export const postMs=t=>(((t%720)+720)%720);
const postNextH=h=>h%12+1,postPrevH=h=>(h+10)%12+1;
export const postDuration=d=>d>=60?`${Math.floor(d/60)}時間${d%60?`${d%60}分`:''}`:`${d}分`;
// A time split into its hour and minute words, so the screen can colour each hand's part.
export function postParts(h,m,p,half,cfg){
 const hour=cfg.period==='24'?`${h%12+(p?12:0)}時`:cfg.period?`${p?'午後':'午前'}${h===12?0:h}時`:`${h}時`;
 const minute=m===0?(cfg.period?'':'ちょうど'):m===30&&half?'半':`${m}分`;
 return {hour,minute};
}
export function postQuestion(cfg,read,rand=Math.random){
 const pick=a=>a[Math.floor(rand()*a.length)],shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const uniq=(list,key)=>{const seen=new Set();return list.filter(o=>{const k=key(o);if(seen.has(k))return false;seen.add(k);return true;});};
 const h=cfg.hours?pick(cfg.hours):1+Math.floor(rand()*12),m=pick(cfg.pool||[0]),p=cfg.period?(cfg.only!==undefined?!!cfg.only:rand()<.5):false;
 const half=cfg.half?rand()<cfg.half:false,away=n=>postMs((h+4+Math.floor(rand()*6))*60+n);
 if(cfg.mode==='room'){
  if(read){const mm=pick([10,20,35,45,50,55]);return {read,mode:'room',h,m:mm,t:h*60+mm,answer:`${h}`,options:shuffle([h,postNextH(h),postPrevH(h)]).map(x=>({key:`${x}`,h:x}))};}
  return {read,mode:'room',h,m:null,start:away(25)};
 }
 if(cfg.mode==='min'){
  if(read){const miss=m%5===0?(m?m/5:12):m-m%5,opts=uniq([m,miss,(m+5)%60,(m+55)%60,(m+15)%60],x=>x).slice(0,3);
   return {read,mode:'min',h:null,m,t:Math.floor(rand()*12)*60+m,answer:`${m}`,options:shuffle(opts).map(x=>({key:`${x}`,m:x}))};}
  return {read,mode:'min',h:null,m,start:postMs(Math.floor(rand()*12)*60+(m+25)%60)};
 }
 if(cfg.mode==='rel'){
  const now=postMs((1+Math.floor(rand()*12))*60+pick(cfg.nows)),d=pick(cfg.dur);
  if(read){const st=d>=60&&d%60===0?60:cfg.step>=15?15:5,opts=uniq([d,d+st,d-st,d+2*st].filter(x=>x>0),x=>x).slice(0,3);
   return {read,mode:'rel',now,d,t:now+d,answer:`${d}`,options:shuffle(opts).map(x=>({key:`${x}`,d:x}))};}
  return {read,mode:'rel',now,d,start:now};
 }
 if(read){
  // Tempting wrong answers: the next hour (short hand already near it), the numeral read as minutes, or the other half of the day.
  const third=cfg.period?{h,m,p:!p}:m%5===0&&m>0?{h,m:m/5,p}:m===0?{h:postPrevH(h),m,p}:{h,m:m-m%5,p};
  const opts=uniq([{h,m,p},{h:postNextH(h),m,p},third],o=>`${o.h}:${o.m}:${o.p}`);
  return {read,mode:'hm',h,m,p,half,t:h*60+m,answer:`${h}:${m}:${p}`,options:shuffle(opts).map(o=>({key:`${o.h}:${o.m}:${o.p}`,...o}))};
 }
 return {read,mode:'hm',h,m,p,half,start:away((m+25)%60)};
}
export function postCorrect(q,t,pm,cfg){
 if(q.mode==='room')return postHourOf(t)===q.h;
 if(q.mode==='min')return postMinOf(t)===q.m;
 if(q.mode==='rel')return postMs(t)===postMs(q.now+q.d);
 return postHourOf(t)===q.h&&postMinOf(t)===q.m&&(!cfg.period||pm===q.p);
}
// Where the dashed helper hands point for a set question, given the hands' current time.
export const postTarget=(q,t)=>q.mode==='min'?Math.floor(postMs(t)/60)*60+q.m:q.mode==='room'?q.h*60+30:q.mode==='rel'?postMs(q.now+q.d):postMs(q.h*60+q.m);
// Stars count only first-try answers: no mistakes and no hints for ★★★, up to two for ★★.
export const postStars=(mistakes,hints)=>{const lost=mistakes+hints;return lost===0?3:lost<=2?2:1;};
export const postGiftCount=()=>postStories.flat().length;
