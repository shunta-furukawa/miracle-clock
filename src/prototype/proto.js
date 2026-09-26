import {routeLevels,routeSession,routeTick,routeStamp,routePins,routeStars,visitors,nextSlot} from '../route.js';
import {angleDelta,timeText} from '../time.js';

// Rule prototype for the day clock. Plain shapes and emoji only; the real art comes after the rules settle.
const $=id=>document.getElementById(id);
const faces=['🦊','🐰','🐻','🐱','🐭','🐸','🦉','🐹','🐧','🐿️','🦔','🐨'];
const colors=['#e0823d','#d86a8f','#8b6b3d','#c9a227','#7c8fa6','#4c9a57','#7a5ea8','#d4a373','#3f7cac','#b5652b','#8e7d5a','#6c9a8b'];
const look=o=>({face:faces[o.id*5%faces.length],color:colors[o.id*7%colors.length]});
const people=new Map(),tickets=new Map();
let s=null,course=null,speed=1,hand=0,free=null,drag=null,picked=null,pickTimer=0,last=0,paused=true,audio=null;

const snap=v=>Math.min(s.level.close,Math.max(nextSlot(s),Math.round(v/s.level.step)*s.level.step));
const shown=()=>free??hand;
const aimed=()=>snap(shown());
const secondsLeft=o=>(o.target-s.now)*s.level.hourSeconds/60;
const periodText=t=>(t>=1440?'あした ':'')+(t%1440<720?'☀ 午前':'☾ 午後');
const dayText=t=>(t>=1440?'あした':'')+timeText(t,'period');
const restart=(el,cls)=>{el.classList.remove(cls);void el.getBoundingClientRect();el.classList.add(cls);};

// ---------- sound ----------
function tone(freq,dur=.12,type='triangle',gain=.1,slide=0){
 if(!audio)return;const t=audio.currentTime,o=audio.createOscillator(),g=audio.createGain();
 o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(freq*slide,t+dur);
 g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+dur);
}
const scale=[0,2,4,5,7,9,11,12,14,16];
const note=i=>660*2**(scale[Math.min(i,scale.length-1)]/12);

// ---------- clock face ----------
function buildFace(){
 const g=$('ticks');g.innerHTML='';
 for(let i=0;i<60;i++){const a=i*6*Math.PI/180,major=i%5===0,r1=major?116:121;
  g.insertAdjacentHTML('beforeend',`<line class="tick${major?' major':''}" x1="${Math.sin(a)*r1}" y1="${-Math.cos(a)*r1}" x2="${Math.sin(a)*128}" y2="${-Math.cos(a)*128}"/>`);}
 for(let h=1;h<=12;h++){const a=h*30*Math.PI/180;g.insertAdjacentHTML('beforeend',`<text class="num" x="${Math.sin(a)*100}" y="${-Math.cos(a)*100}">${h}</text>`);}
}
const polar=(deg,r)=>[Math.sin(deg*Math.PI/180)*r,-Math.cos(deg*Math.PI/180)*r];
const hourAngle=t=>(t%720)/2;
function arc(from,to,r){
 const span=Math.min(359.9,(to-from)/2);if(span<.5)return '';
 const a=hourAngle(from),[x1,y1]=polar(a,r),[x2,y2]=polar(a+span,r);
 return `M${x1} ${y1} A${r} ${r} 0 ${span>180?1:0} 1 ${x2} ${y2}`;
}

// ---------- rendering (every frame: "now" is always moving) ----------
function renderClock(){
 const v=shown(),target=aimed();
 $('hour').setAttribute('transform',`rotate(${hourAngle(v)})`);
 $('minute').setAttribute('transform',`rotate(${(v%60)*6})`);
 $('period').textContent=periodText(target);
 $('remaining').setAttribute('d',arc(s.now,Math.min(s.level.close,s.now+719),144));
 $('now-mark').setAttribute('transform',`rotate(${hourAngle(s.now)})`);
 const [nx,ny]=polar(hourAngle(s.now),180);$('now-label').setAttribute('x',nx);$('now-label').setAttribute('y',ny);
 let html='';
 for(const pin of routePins(s)){
  const first=look(pin.orders[0]),[x,y]=polar(hourAngle(pin.target),144),urgent=secondsLeft(pin.orders[0])<=4;
  const cls=['pin',pin.target===target&&'lit',pin.target===picked&&'picked',urgent&&'urgent'].filter(Boolean).join(' ');
  html+=`<g class="${cls}" data-target="${pin.target}" transform="translate(${x} ${y})"><circle class="body" r="13" fill="${first.color}"/><text>${first.face}</text>${pin.orders.length>1?`<circle class="badge" cx="11" cy="-11" r="8"/><text class="badge-text" x="11" y="-11">${pin.orders.length}</text>`:''}</g>`;
 }
 $('pins').innerHTML=html;
 $('ghost').classList.toggle('show',picked!==null);
 if(picked!==null){$('ghost-hour').setAttribute('transform',`rotate(${hourAngle(picked)})`);$('ghost-minute').setAttribute('transform',`rotate(${(picked%60)*6})`);}
 $('seal').classList.toggle('ready',s.queue.some(o=>o.target===target));
 for(const o of s.queue){
  const p=people.get(o.id),t=tickets.get(o.id),left=secondsLeft(o),urgent=left<=4;
  p?.classList.toggle('lit',o.target===target);t?.classList.toggle('lit',o.target===target);
  p?.classList.toggle('picked',o.target===picked);t?.classList.toggle('picked',o.target===picked);
  p?.classList.toggle('urgent',urgent);t?.classList.toggle('urgent',urgent);
  const bar=t?.querySelector('.timer');if(bar)bar.style.width=`${Math.max(0,Math.min(1,left/o.lead))*100}%`;
 }
 $('clock').setAttribute('aria-valuetext',dayText(target));
}
function skyColor(t){
 const h=(t%1440)/60;
 return h<5||h>=20?'#2b3f73':h<7?'#f2a978':h<16?'#8fd0ef':h<18?'#f5c26b':'#e2785a';
}
function renderDay(){
 const {open,close}=s.level,span=close-open,pct=t=>`${(t-open)/span*100}%`,track=$('day-track');
 const stops=[];for(let t=open;t<=close;t+=30)stops.push(`${skyColor(t)} ${pct(t)}`);
 let html=`<div class="sky" style="background:linear-gradient(90deg,${stops.join(',')})"></div><div class="past" style="width:${pct(s.now)}"></div>`;
 for(const [t,label] of [[720,'正午'],[1440,'0時']])if(t>open&&t<close)html+=`<span class="mark" style="left:${pct(t)}">${label}</span>`;
 for(const pin of routePins(s))html+=`<span class="dot" style="left:${pct(pin.target)};background:${look(pin.orders[0]).color}"></span>`;
 html+=`<span class="cursor" style="left:${pct(aimed())}"></span><span class="plane" style="left:${pct(s.now)}">${s.now%1440<360||s.now%1440>=1110?'🌙':'☀️'}</span>`;
 track.innerHTML=html;
}
function renderStats(){
 $('delivered').textContent=s.delivered;$('lost').textContent=`取りこぼし ${s.missed+s.gaveUp}`;
 $('combo').textContent=s.combo>1?`${s.combo} COMBO`:'';
 const n=s.queue.length,cap=s.level.capacity,note=$('line-note');
 note.textContent=n>=cap?'満員！ これ以上は帰っちゃう':n>=cap-1?'もうすぐ満員！':`${n}/${cap}人`;
 note.classList.toggle('full',n>=cap-1);
}
function render(){renderClock();renderDay();renderStats();}

// ---------- the line ----------
function spots(){
 const w=$('line').clientWidth,front=w-52-24,gap=Math.min(44,(front-56)/Math.max(1,s.level.capacity-1));
 return i=>front-i*gap;
}
function layoutLine(){const x=spots();s.queue.forEach((o,i)=>{const el=people.get(o.id);if(el&&!el.classList.contains('leaving'))el.style.transform=`translateX(${x(i)}px)`;});}
function makePerson(o,cls=''){
 const {face,color}=look(o),el=document.createElement('div');
 el.className=`person ${cls}`;el.textContent=face;el.style.borderColor=color;el.style.transform='translateX(18px)';
 $('line').append(el);return el;
}
function arrive(o){
 o.lead=secondsLeft(o);
 const el=makePerson(o,'walking');people.set(o.id,el);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{layoutLine();setTimeout(()=>el.classList.remove('walking'),480);}));
 const {face,color}=look(o),t=document.createElement('button');
 t.type='button';t.className='ticket';t.style.borderLeftColor=color;
 t.innerHTML=`<span class="who">${face}のちゅうもん</span><strong>${o.label}</strong>${o.kind==='relative'?`<span class="base">受付 ${dayText(o.base)}</span>`:''}<span class="timer"></span>`;
 t.addEventListener('click',()=>pick(o.target));
 $('rail').append(t);tickets.set(o.id,t);tone(1200,.05,'sine',.04);
}
function turnAway(o){
 const el=makePerson(o,'angry');tone(180,.25,'sawtooth',.06,.7);restart($('lost'),'hurt');
 setTimeout(()=>{el.style.transform='translateX(-40px)';el.classList.add('leaving');},700);setTimeout(()=>el.remove(),1200);
}
function leave(o,how,delay){
 const el=people.get(o.id),t=tickets.get(o.id);people.delete(o.id);tickets.delete(o.id);
 setTimeout(()=>{
  if(how==='served'){el?.classList.add('served');t?.classList.add('served');
   setTimeout(()=>{if(el){el.style.transform=`translateX(${$('line').clientWidth+40}px)`;el.classList.add('leaving');}},260);}
  else{el?.classList.add('sad');t?.classList.add('missed');
   setTimeout(()=>{if(el){el.style.transform='translateX(-40px)';el.classList.add('leaving');}},350);}
  setTimeout(()=>{el?.remove();t?.remove();},800);
 },delay);
}
function missed(o){leave(o,'missed',0);tone(330,.4,'sine',.07,.5);restart($('lost'),'hurt');setTimeout(layoutLine,700);}

// ---------- actions ----------
function pick(target){
 picked=target;clearTimeout(pickTimer);pickTimer=setTimeout(()=>{picked=null;},2600);
}
function popText(text,big){const p=$('pop');p.textContent=text;p.className='pop';void p.offsetWidth;p.className=`pop show${big?' big':''}`;}
function stamp(){
 if(!s||s.status!=='playing'||drag)return;
 const r=routeStamp(s,aimed());if(!r)return;
 if(!r.served.length){tone(140,.22,'sawtooth',.07);restart($('clock'),'shake');popText('その時刻のお客さんはいないよ');return;}
 const n=r.served.length;
 r.served.forEach((o,i)=>{leave(o,'served',i*120);setTimeout(()=>tone(note(i),.16,'triangle',.11),i*120);});
 setTimeout(()=>{tone(note(n+1),.3,'sine',.08);layoutLine();},n*120+320);
 popText(n>1?`${n}人まとめて！ +${r.points}`:`+${r.points}`,n>=3);
 restart($('delivered'),'bump');restart($('combo'),'bump');
 if(r.served.some(o=>o.target===picked))picked=null;
}
function move(minutes){if(!s||s.status!=='playing')return;hand=snap(hand+minutes);tone(900,.03,'square',.03);}

// ---------- input ----------
const clock=$('clock');
function point(e){const p=clock.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(clock.getScreenCTM().inverse());}
const bearing=p=>Math.atan2(p.x,-p.y)*180/Math.PI;
clock.addEventListener('pointerdown',e=>{
 if(!s||s.status!=='playing')return;
 const pin=e.target.closest('.pin');if(pin){pick(Number(pin.dataset.target));return;}
 if(e.target.closest('#seal')){stamp();return;}
 drag={angle:bearing(point(e))};free=hand;clock.setPointerCapture(e.pointerId);
});
clock.addEventListener('pointermove',e=>{
 if(!drag)return;const a=bearing(point(e));
 // Only the long hand is dragged; the short hand follows, and each new hour rings a little higher.
 const before=aimed();free=Math.min(s.level.close,Math.max(s.now,free+angleDelta(drag.angle,a)/6));drag.angle=a;const after=aimed();
 if(Math.floor(after/60)!==Math.floor(before/60))tone(1320,.08,'triangle',.06);else if(after!==before)tone(1000,.025,'square',.025);
});
const release=()=>{if(!drag)return;hand=aimed();free=null;drag=null;};
clock.addEventListener('pointerup',release);clock.addEventListener('pointercancel',release);
for(const b of document.querySelectorAll('[data-move]'))b.addEventListener('click',()=>{const m=Number(b.dataset.move);move(Math.abs(m)===1?m*s.level.step:m);});
addEventListener('keydown',e=>{
 if(!s||paused)return;
 if(e.key==='ArrowRight'||e.key==='ArrowUp'){move(s.level.step);e.preventDefault();}
 if(e.key==='ArrowLeft'||e.key==='ArrowDown'){move(-s.level.step);e.preventDefault();}
 if(e.key==='Enter'||e.key===' '){stamp();e.preventDefault();}
});
addEventListener('resize',()=>{if(s)layoutLine();});

// ---------- flow ----------
function start(level){
 audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume?.();
 course=level;people.clear();tickets.clear();$('line').innerHTML='';$('rail').innerHTML='';picked=null;
 s=routeSession({...level,hourSeconds:level.hourSeconds*speed,lead:level.lead*speed,arrive:level.arrive.map(x=>x*speed)});
 hand=nextSlot(s);free=null;drag=null;
 $('course-title').textContent=level.title;$('course-skill').textContent=level.skill;
 $('day-open').textContent=dayText(level.open)+' 開店';$('day-close').textContent=dayText(level.close)+' 閉店';
 $('menu').hidden=true;$('result').hidden=true;paused=false;last=performance.now();render();
}
function finish(){
 paused=true;const stars=routeStars(s),n=visitors(s);
 $('result-kind').textContent='CLOSED';
 $('result-title').textContent=stars===3?'大繁盛の一日！':stars===2?'いい一日だった！':'おつかれさま！';
 $('result-stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);
 const rows=[['お届け',`${s.delivered} / ${n}人`],['いちばん大きなまとめ便',`${s.maxBatch}人`],['最大コンボ',s.maxCombo],['飛ばした便',s.flights],['1便あたり',s.flights?(s.delivered/s.flights).toFixed(1)+'人':'-'],['乗り遅れ',`${s.missed}人`],['列があふれて帰った',`${s.gaveUp}人`],['空振りの刻印',s.mistakes],['スコア',s.points]];
 $('result-stats').innerHTML=rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')+'<dt>星の目安</dt><dd>★★★ 9割 / ★★ 7割</dd>';
 $('result').hidden=false;
}
function frame(t){
 const dt=Math.min(.1,Math.max(0,(t-last)/1000));last=t;
 if(s&&!paused&&!document.hidden&&s.status==='playing'){
  for(const e of routeTick(s,dt)){
   if(e.type==='arrive')arrive(e.order);else if(e.type==='gaveUp')turnAway(e.order);else if(e.type==='missed')missed(e.order);
   else if(e.type==='closed'){paused=true;popText('閉店！',true);tone(523,.5,'sine',.1);setTimeout(finish,1400);}
  }
  // "Now" pushes the hands forward when it catches up with them.
  if(drag)free=Math.max(free,s.now);else if(hand<nextSlot(s)&&s.status==='playing')hand=nextSlot(s);
  render();
 }
 requestAnimationFrame(frame);
}

const list=$('courses');
routeLevels.forEach(level=>{
 const b=document.createElement('button');b.type='button';
 b.innerHTML=`${level.title}<small>${level.skill}・${dayText(level.open)}〜${dayText(level.close)}・約${Math.round((level.close-level.open)/60*level.hourSeconds/10)*10}秒</small>`;
 b.addEventListener('click',()=>start(level));list.append(b);
});
for(const b of document.querySelectorAll('[data-speed]'))b.addEventListener('click',()=>{speed=Number(b.dataset.speed);for(const x of document.querySelectorAll('[data-speed]'))x.setAttribute('aria-pressed',String(x===b));});
$('back').addEventListener('click',()=>{paused=true;$('menu').hidden=false;$('result').hidden=true;});
$('retry').addEventListener('click',()=>start(course));
$('to-menu').addEventListener('click',()=>{$('result').hidden=true;$('menu').hidden=false;});
buildFace();requestAnimationFrame(frame);
