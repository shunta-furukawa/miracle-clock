import {rushLevel,rushRemaining,rushSession,rushInterval,rushLimit,rushGroups,rushKey,rushMatches,rushStep,rushTick,rushStamp,rushTimeout} from './rush.js';
import {parcelSeal} from './stamp.js';
import {Soundtrack,creditsHTML,gameMusicScene} from './soundtrack.js';
import {mod, normalizeTime, clockAngles, angleDelta, dragMinutes, freeMinutes, settleDelta, matchesTime, timeText, orderHint} from './time.js';
import {levels, makeOrder, createSession, tickSession, completeOrder, depotNames, customerMood, stages, endlessLevel, stageUnlocked, endlessUnlocked, arrivalInterval, starGoal, rateRun, betterRecord, starText, totalStars, prepareDial, recordMistake, patienceLimit} from './levels.js';
import {elements, elementMark, elementalNumbers} from './elements.js';
import {freshRecord,loadRecords,saveRecords} from './save.js';
import {showDialogue,closeDialogue} from './dialogue.js';
import {clockPrologue,depotStory,stageStory} from './stories.js';
import {depotThemes,chapterDeliveries,earnedRewards,preparationStep,shopReputation,depotIcon,centralArt} from './depot.js';
import {DialDetents} from './detent.js';
import {victoryEffects} from './celebration.js';
import {showOpening,closeOpening} from './opening.js';

let rushSelected=null,closingTimer=null;
const app=document.querySelector('#app');
const $=selector=>app.querySelector(selector);
let screen='home', session=null, dial=720, selectedHand='hour', paused=false, busy=false, drag=null, timer=null, flightTimer=null;
let skipDelivery=null,chapterMusic=null,stampImpactTimer=null;
let flightView=null, flightLoading=null, launchToken=0;
let shown=720, settleId=0; // shown: fractional dial position drawn while dragging or settling
const soundtrack=new Soundtrack(false);
new Image().src='assets/luka-victory.webp';
let lastTick=0, soundOn=soundtrack.settings.music||soundtrack.settings.sound;
let recordStorage=null;try{recordStorage=window.localStorage;}catch{}
const loadedRecords=loadRecords(recordStorage);
let records=loadedRecords.data,saveNotice=loadedRecords.error,activeSlot=records.active,progress={};
function syncProgress(){progress=Object.fromEntries((records.slots[activeSlot]?.cleared||[]).map(id=>[id,true]));}
function persistRecords(){const ok=saveRecords(records,recordStorage);saveNotice=ok?'':'記録を保存できませんでした。保存設定や別のタブを確認してね。今の画面では続けて遊べます。';return ok;}
if(records.migrated&&records.revision===0&&!saveNotice)persistRecords();
syncProgress();
const portrait=(id,cls='')=>id===6?`<span class="portrait sunari-art ${cls}" role="img" aria-label="スナリ" style="--sunari-x:0%"></span>`:`<span class="portrait cast-${id} ${cls}" role="img" aria-label="${['ルカ','モス','シェル','クリム','フレア','フウ'][id]}"></span>`;
const toto=(cls='')=>`<img class="toto ${cls}" src="assets/sky-toto.webp" alt="トトじい">`;
const smallClock=(time)=>{const a=clockAngles(time);return `<svg viewBox="0 0 60 60" class="mini-clock" aria-label="${timeText(time,'period')}"><circle cx="30" cy="30" r="27"/><path d="M30 30V15" transform="rotate(${a.hour} 30 30)"/><path d="M30 30V8" transform="rotate(${a.minute} 30 30)" class="mini-minute"/><circle cx="30" cy="30" r="2"/></svg>`;};
function playSound(kind){soundtrack.play(({tap:'select',stamp:'spell',imprint:'assemble',send:'arrival',win:'clear',wrong:'failure'})[kind]||kind);}
function audioSettingsDialog(){
 const fromPlay=screen==='play',wasPaused=paused;if(fromPlay)paused=true;
 const a=soundtrack.settings;
 const dialog=document.createElement('dialog');dialog.className='audio-panel';
 dialog.innerHTML=`<h2>音の設定</h2><p>空のとけい便の音を、お好みで。</p>${[['music','BGM','musicVolume'],['sound','効果音','soundVolume']].map(([key,label,vol])=>`<div class="audio-setting"><label><input type="checkbox" data-audio="${key}" ${a[key]?'checked':''}> ${label}</label><label>${label}の音量 <output id="${vol}-value">${Math.round(a[vol]*100)}%</output><input aria-label="${label}の音量" type="range" min="0" max="100" step="5" value="${Math.round(a[vol]*100)}" data-audio="${vol}"></label></div>`).join('')}<p class="audio-save-status" role="status">設定はこの端末に保存されます。</p>${creditsHTML}<button class="primary" id="audio-done">とじる</button>`;
 dialog.addEventListener('input',e=>{const key=e.target.dataset.audio;if(!key)return;const volume=e.target.type==='range',value=volume?Number(e.target.value)/100:e.target.checked;const ok=soundtrack.configure({[key]:value});soundtrack.unlock();if(volume)dialog.querySelector('#'+key+'-value').textContent=Math.round(value*100)+'%';dialog.querySelector('.audio-save-status').textContent=ok?'音の設定を保存しました。':'この端末では音の設定を保存できません。';if(key==='sound'||key==='soundVolume')soundtrack.play('select');});
 dialog.querySelector('#audio-done').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();if(fromPlay){paused=wasPaused;lastTick=performance.now();}});document.body.append(dialog);dialog.showModal();
}
function cleanup(){clearTimeout(closingTimer);closingTimer=null;document.querySelectorAll('.farewell-layer').forEach(e=>e.remove());clearTimeout(stampImpactTimer);stampImpactTimer=null;skipDelivery=null;soundtrack.stopEffects();soundtrack.duck('dialog',false);soundtrack.duck('story',false);closeOpening();closeDialogue();launchToken++;settleId++;flightView?.dispose();flightView=null;flightLoading=null;clearInterval(timer);clearTimeout(flightTimer);timer=null;drag=null;busy=false;paused=false;document.body.classList.remove('flying','stamping','loading-parcel');delete document.body.dataset.depot;}
function renderHome(){
  cleanup();chapterMusic=null;screen='home';soundtrack.setScene('title');
  const continuing=records.slots.some(Boolean),menuIcon=n=>`<i class="menu-art" aria-hidden="true" style="--icon-x:${n%3*50}%;--icon-y:${Math.floor(n/3)*100}%"></i>`;
  app.innerHTML=`<main class="home scene"><header class="home-header"><p class="home-eyebrow">時をあわせて、せかいをつなぐ</p><button class="icon-button home-music" aria-pressed="${soundtrack.settings.music}">${soundtrack.settings.music?'音楽をとめる':'音楽を再生'}</button></header><div class="title-lockup"><h1><img src="assets/title-logo.webp" alt="Miracle Clock" width="1100" height="733" fetchpriority="high"></h1><p class="subtitle">ミラクルクロック</p></div><div class="home-painting" role="img" aria-label="ルカが荷物に刻印し、トトじいが蒸気飛行機に積み込む空の配送所"></div><div class="home-actions"><button class="primary" id="start">${menuIcon(0)}${continuing?'冒険をつづける':'冒険をはじめる'}</button></div><p class="home-tagline">小さな時刻で、大きな約束を。</p><nav class="home-menu" aria-label="タイトルメニュー"><button class="subtle" id="home-help">${menuIcon(3)}あそびかた</button><button class="subtle sound">${menuIcon(4)}設定</button><button class="subtle" id="home-share">友だちに教える</button></nav><footer class="home-footer"><div class="home-app-tools"><button class="text-button" id="install-app">ホーム画面に追加</button><button class="text-button" id="update-app">更新を確認</button></div><small id="offline-status" role="status"></small><span class="home-version">Ver. 0.5.1</span></footer></main>`;
  $('#start').onclick=renderSlots;$('#install-app').onclick=()=>window.clockPwa?.install();$('#update-app').onclick=()=>window.clockPwa?.update();window.clockPwa?.refresh();bindSound();
  $('.home-music').onclick=()=>{soundtrack.configure({music:!soundtrack.settings.music});soundtrack.unlock();};
  $('#home-help').onclick=()=>openModal('<p class="eyebrow">MIRACLE CLOCK</p><h2>あそびかた</h2><p>お客さんの注文を見て、短い針と長い針を合わせよう。針は指で動かすか、選んで＋・−で動かせます。</p><p>一人ずつ来店するお客さんの吹き出しで時刻を確認。同じ時刻の人を、1回の刻印でまとめて配達できます。配達中も次の操作ができます。</p><p>連続成功でコンボ！ 不正解は注文を残してコンボが0に戻ります。先頭のお客さんの待ちゲージがなくなるとハートが1つ減ります。ハートを残して全員の荷物を届けよう。</p>');
  $('#home-share').onclick=async()=>{const data={title:'Miracle Clock',text:'ルカと空のとけい便。魔法の時計で、浮遊島へ荷物を届けよう。',url:'https://miracle-clock.vercel.app/'};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.url);$('#home-share').textContent='リンクをコピーしました';}}catch(e){if(e.name!=='AbortError')openModal('<h2>友だちに教える</h2><p><a href="https://miracle-clock.vercel.app/">miracle-clock.vercel.app</a></p><p>このリンクをコピーして教えてね。</p>');}};
}
function bindSound(){const b=$('.sound');if(b){b.title='音の設定';b.addEventListener('click',audioSettingsDialog);}}
soundtrack.onChange=()=>{soundOn=soundtrack.settings.music||soundtrack.settings.sound;document.querySelectorAll('.sound').forEach(b=>{if(b.closest('.home'))return;const label=`音 ${soundOn?'ON':'OFF'}`;if(b.textContent!==label)b.textContent=label;b.setAttribute('aria-pressed',soundOn);});const music=$('.home-music');if(music){music.textContent=soundtrack.settings.music?'音楽をとめる':'音楽を再生';music.setAttribute('aria-pressed',soundtrack.settings.music);}};
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>soundtrack.unlock(),{capture:true});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.matches('#seal-button,#plus,#minus'))return;playSound(b.id==='hint'?'hint':b.matches('[data-select]')?'hand-select':'click');});
document.addEventListener('clock:dialogue',e=>soundtrack.duck('story',e.detail));
window.addEventListener('pagehide',()=>soundtrack.visibility(true));window.addEventListener('pageshow',()=>soundtrack.visibility(document.hidden));
function showStory(onDone=()=>soundtrack.setScene(chapterMusic===null?'map':gameMusicScene('story',chapterMusic))){soundtrack.setScene('voyage');showOpening(()=>showDialogue(clockPrologue,onDone,{fadeIn:true}),{dial:clockMarkup()});}
function renderSlots(){
 cleanup();chapterMusic=null;screen='slots';soundtrack.setScene('slots');
 app.innerHTML=`<main class="records-page scene"><header class="topbar"><button class="subtle" id="home">← タイトル</button><span class="wordmark">配達の記録</span><button class="icon-button sound" aria-pressed="${soundOn}">音 ${soundOn?'ON':'OFF'}</button></header><section class="map-heading"><p class="eyebrow">LUCA & TOTO'S LOGBOOK</p><h1>配達日誌をえらぼう</h1><p>3つの記録で、それぞれの空のとけい便。</p></section><div class="records-grid">${records.slots.map((record,i)=>`<article class="record-card"><button class="record-open" data-slot="${i}" aria-label="配達日誌 ${i+1} ${record?'つづきから':'はじめる'}"><span class="record-heading"><span>LOGBOOK 0${i+1}</span><b>${['Ⅰ','Ⅱ','Ⅲ'][i]}</b></span><img src="assets/delivery-plane.webp" alt=""><strong>${record?'空のとけい便':'新しい配達日誌'}</strong><span>${record?`${record.stages.length} / 36 ステージ · ★ ${totalStars(record)} / 108`:'ルカと、ここからはじめよう'}</span><span class="record-stamps" aria-label="配送所の達成状況">${levels.map(l=>`<i class="${record?.cleared.includes(l.id)?'done':''}" aria-label="${depotNames[l.id]} ${record?.cleared.includes(l.id)?'達成':'未達成'}">${l.id+1}</i>`).join('')}</span><small>${record?.updated?'最終記録 '+new Date(record.updated).toLocaleDateString('ja-JP'):''}</small><span class="level-go">${record?'つづきから':'はじめる'} →</span></button>${record?`<button class="text-button record-delete" data-delete-slot="${i}" aria-label="配達日誌 ${i+1} のデータを消す">データを消す</button>`:''}</article>`).join('')}</div><p class="records-note">クリアした配送所を、この端末のブラウザに保存します。<br>配達途中の状態は保存されません。</p>${records.migrated?'<p class="records-note">以前の配達記録は、配達日誌1へ引き継ぎました。</p>':''}<p class="save-warning" role="status">${saveNotice}</p></main>`;
 $('#home').onclick=renderHome;bindSound();app.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>openSlot(Number(b.dataset.slot)));app.querySelectorAll('[data-delete-slot]').forEach(b=>b.onclick=()=>deleteSlot(Number(b.dataset.deleteSlot)));
}
function openSlot(index){
 activeSlot=index;records.active=index;
 if(!records.slots[index])records.slots[index]=freshRecord();
 persistRecords();syncProgress();renderMap();
 if(!records.slots[index].introSeen)showStory(()=>{records.slots[index].introSeen=true;records.slots[index].updated=Date.now();persistRecords();renderMap();});
}
function deleteSlot(index){
 openModal(`<p class="eyebrow">LOGBOOK 0${index+1}</p><h2>この配達日誌を消す？</h2><p>${records.slots[index].stages.length} / 36 ステージの記録を消します。<br>消したデータは元に戻せません。ほかの日誌は残ります。</p><p id="delete-error" role="alert"></p><button class="primary" id="delete-cancel">やめる</button><button class="secondary danger-button" id="delete-confirm">この日誌を消す</button>`,false);
 $('#delete-cancel').onclick=closeModal;$('#delete-confirm').onclick=()=>{const next={...records,migrated:index===0?false:records.migrated,slots:records.slots.map((s,i)=>i===index?null:s)};if(!saveRecords(next,recordStorage)){$('#delete-error').textContent='削除できませんでした。保存設定や別のタブを確認してね。';return;}records=next;saveNotice='';syncProgress();renderSlots();};$('#delete-cancel').focus();
}
function renderMap(){
 const preparationImage=new Image();preparationImage.src='assets/central-construction.webp';
 cleanup();screen='map';soundtrack.setScene(chapterMusic===null?'map':gameMusicScene(chapterMusic===6?'sky':'story',chapterMusic));const record=records.slots[activeSlot];
 app.innerHTML=`<main class="map scene campaign-map"><header class="topbar"><button class="subtle" id="records">← 配達日誌</button><span class="wordmark">配達日誌 ${activeSlot+1}</span><button class="icon-button sound" aria-pressed="${soundOn}">音 ${soundOn?'ON':'OFF'}</button></header><section class="map-heading depot-map-heading"><div><p class="eyebrow">THE JOURNEY TO CENTRAL AIR POST</p><h1>約束をあつめて、中央便へ。</h1></div><div class="map-heading-actions"><button class="subtle" id="replay-story">はじまりの物語</button><button class="primary" id="preparations">中央配送所のしたく <small>${earnedRewards(record).length} / 6</small></button></div></section><div class="chapter-list">${levels.map(ch=>{const list=stages.filter(t=>t.id===ch.id),stars=list.reduce((n,t)=>n+(record.stars[t.stageId]?.stars||0),0),theme=depotThemes[ch.id],done=chapterDeliveries(record,ch.id);return `<article class="chapter parchment compact-chapter" style="--chapter-color:${theme.color}"><div class="chapter-info">${depotIcon(ch.id)}<div><p class="eyebrow">CHAPTER ${ch.id+1} / ${theme.tag}</p><h2>${depotNames[ch.id]}</h2><p class="chapter-reward">${theme.reward} · ${done===6?'獲得済み':'章クリアで獲得'}</p><p class="chapter-star-count">★ ${stars} / 18 ${done===6?'<span class="stamp">配達ずみ</span>':''}</p><small class="shop-reputation">${shopReputation(done)} <span aria-label="繁盛度 ${done} / 6">${'●'.repeat(done)}${'○'.repeat(6-done)}</span></small></div></div><div class="stage-list">${list.map(t=>{const cleared=record.stages.includes(t.stageId),open=stageUnlocked(record,t.stageId),r=record.stars[t.stageId];return `<button class="stage ${cleared?'cleared':open?'next':''}" data-stage="${t.stageId}" ${open?'':'disabled'} aria-label="${ch.id+1}-${t.number} ${t.stageTitle} ${open?'':'未解放'}"><b>${ch.id+1}-${t.number}</b><small>${r?starText(r.stars):cleared?'✓':open?'☆☆☆':'—'}</small></button>`;}).join('')}</div></article>`;}).join('')}</div><section class="special-depot parchment"><div>${toto()}<p class="eyebrow">SPECIAL · ENDLESS</p><h2>トトじいと空の中央便</h2><p>みんなの配送所をつなぐ、新しい受付。<br>全ての島のお客さんと、全ての時計の注文がやってくるぞ。</p><p>最高 ${record.endless.best} 便 · 累計 ${record.endless.total} 便</p><button class="primary" id="endless" ${endlessUnlocked(record)?'':'disabled'}>${endlessUnlocked(record)?'トトじいと中央便をひらく':'全36ステージをクリアすると開店'}</button><small>ライフ3つ。時間切れで ♥ が減り、♥ が0か行列24人で終了。配達するほど来客が速くなります。</small></div></section><p class="save-note">${record.stages.length} / 36 ステージ · ★ ${totalStars(record)} / 108</p><p class="save-warning" role="status">${saveNotice}</p></main>`;
 $('#preparations').onclick=renderPreparations;$('#records').onclick=renderSlots;$('#replay-story').onclick=()=>showStory();bindSound();
 app.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.stage);if(stageUnlocked(record,id))chooseLevel(stages[id]);});
 $('#endless').onclick=()=>{if(endlessUnlocked(record))chooseLevel(endlessLevel);};
}
function chooseLevel(level){
 level=rushLevel(level);
 chapterMusic=level.id;soundtrack.setScene(gameMusicScene(level.endless?'sky':'story',level.id));
 const begin=()=>showDialogue(stageStory(level),()=>levelDetails(level));
 if(level.number!==1||level.endless){begin();return;}
 const theme=depotThemes[level.id];
 openModal(`<div class="chapter-field-window" aria-hidden="true"><div class="chapter-arrival-art" style="background-image:url(assets/depots/${level.id===5?6:level.id}.webp)"></div></div><p class="chapter-location">MIRACLE CLOCK ／ ${theme.tag}</p><div class="chapter-arrival-copy"><p class="eyebrow">CHAPTER ${String(level.id+1).padStart(2,'0')}</p><h1>${depotNames[level.id]}</h1><div class="chapter-rule" aria-hidden="true">✦</div><p>${['森の小さな受付から、最初の約束を。','潮風にのせて、港のみんなの贈り物を。','結晶の明かりが、約束の時刻を照らす。','歯車の響く工房へ。小さな工夫を届けよう。','雲のむこうも、時計でつながっている。','いまから何分後？ 次の約束を育てよう。'][level.id]}</p><small>この章の贈り物 · ${theme.reward}</small></div><button class="primary" id="chapter-begin">物語をはじめる ▸</button>`,false);
 $('.modal').classList.add('chapter-arrival');$('.modal-backdrop').classList.add('chapter-screen');$('#chapter-begin').onclick=()=>{closeModal();begin();};
}

function rewardArt(id,cls=''){const boxes=['0 0 550 510','550 0 500 510','1050 0 486 510','0 510 580 514','580 510 380 514','960 510 576 514'];return `<svg class="reward-item ${cls}" viewBox="${boxes[id]}" role="img" aria-label="${depotThemes[id].reward}" preserveAspectRatio="xMidYMid meet"><image href="assets/depot-rewards.webp" width="1536" height="1024"/></svg>`;}
function showDepotReward(id,onDone){
 playSound('chapter');
 const theme=depotThemes[id],step=Math.min(id+1,preparationStep(records.slots[activeSlot]));
 openModal(`<p class="eyebrow">A GIFT FOR CENTRAL AIR POST</p><h2>${theme.reward}が届いた！</h2><div class="reward-scene" style="--dock-x:${[50,78,28,23,74,50][id]}%;--dock-y:${[72,64,59,78,23,43][id]}%">${centralArt(step)}<div class="reward-before awaiting-install">${centralArt(Math.max(0,step-1))}</div><div class="reward-incoming">${rewardArt(id)}</div><span class="reward-impact" aria-hidden="true"></span></div><p class="reward-caption" role="status">${theme.gift}</p><p>${step===6?'6つの贈り物がそろった！ トトじいと中央配送所をひらこう。':`中央配送所のしたく ${step} / 6。みんなの約束が、ひとつ形になったね。`}</p><button class="primary" id="reward-install">${theme.reward}を取り付ける</button><button class="primary" id="reward-done" hidden>つづける</button>`,false);
 $('.modal').classList.add('reward-modal');const scene=$('.reward-scene'),incoming=$('.reward-incoming');let installed=false;
 const install=()=>{if(installed||!scene.isConnected)return;installed=true;scene.classList.add('installed');scene.classList.remove('installing');playSound('assemble');$('.reward-caption').textContent=`${theme.reward}がついた！ ${theme.gift}`;$('#reward-done').hidden=false;$('#reward-done').focus();};
 incoming.addEventListener('animationend',e=>{if(e.animationName==='reward-dock')install();});
 $('#reward-install').onclick=()=>{$('#reward-install').hidden=true;$('.reward-caption').textContent=`${theme.reward}をお店へ運んでいるよ…`;if(matchMedia('(prefers-reduced-motion:reduce)').matches)install();else scene.classList.add('installing');};$('#reward-done').onclick=()=>{closeModal();onDone();};
}
function renderPreparations(){
 cleanup();screen='preparations';const record=records.slots[activeSlot],earned=earnedRewards(record),step=preparationStep(record);
 app.innerHTML=`<main class="records-page scene preparations-page"><header class="topbar"><button class="subtle" id="back-map">← 配送所へ</button><span class="wordmark">中央配送所のしたく</span><button class="icon-button sound">音 ${soundOn?'ON':'OFF'}</button></header><section class="preparation-hero"><div class="central-picture">${centralArt(step)}<span class="shop-emblem" data-emblem="${record.shopEmblem||0}" aria-label="お店の紋章"></span></div><div class="parchment preparation-copy"><p class="eyebrow">OUR CENTRAL AIR POST</p><h1>${step===6?'みんなの中央配送所、開所！':'小さな約束が、ひとつの場所に。'}</h1><p>各地で配達を重ねると、お店にお客さんが増えていく。章をクリアしたら、島のみんなが開所の準備を手伝ってくれるよ。</p><fieldset class="shop-design"><legend>お店の紋章をえらぶ</legend>${['空の便','森の約束','月と星'].map((name,i)=>`<button class="emblem-choice" data-shop-emblem="${i}" aria-pressed="${(record.shopEmblem||0)===i}"><span class="shop-emblem" data-emblem="${i}"></span>${name}</button>`).join('')}</fieldset><p class="shop-save" role="status"></p><strong class="preparation-count">準備 ${earned.length} / 6</strong><p>${step===6?'トトじいと、すべての島のお客さんを迎えよう。':`次の贈り物：${depotThemes[step].reward}`}</p>${step===6?'<button class="primary" id="central-open">中央便をひらく</button>':''}</div></section><section class="reward-list" aria-label="開所の贈り物">${depotThemes.map((theme,id)=>`<article class="parchment reward-card ${earned.includes(id)?'earned':''}" style="--chapter-color:${theme.color}">${rewardArt(id)}<div><p class="eyebrow">${depotNames[id]}</p><h2>${theme.reward}</h2><p>${theme.gift}</p><small>${shopReputation(chapterDeliveries(record,id))} · ${chapterDeliveries(record,id)} / 6 便</small><p>${earned.includes(id)?`<button class="text-button" data-reward="${id}">獲得済み · 贈り物を見返す</button>`:'この章の6つの便をクリアしよう'}</p></div></article>`).join('')}</section></main>`;
 app.querySelectorAll('[data-shop-emblem]').forEach(b=>b.onclick=()=>{record.shopEmblem=Number(b.dataset.shopEmblem);record.updated=Date.now();const saved=persistRecords();$('.central-picture .shop-emblem').dataset.emblem=record.shopEmblem;app.querySelectorAll('[data-shop-emblem]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.shopEmblem)===record.shopEmblem)));$('.shop-save').textContent=saved?'この配達日誌に保存しました。':saveNotice;playSound('assemble');});$('#back-map').onclick=renderMap;$('#central-open')?.addEventListener('click',()=>chooseLevel(endlessLevel));bindSound();app.querySelectorAll('[data-reward]').forEach(b=>b.onclick=()=>showDepotReward(Number(b.dataset.reward),()=>{}));window.scrollTo(0,0);
}

function levelDetails(input){const level=rushLevel(input),goal=level.endless?null:starGoal(level);openModal(`<p class="eyebrow">${level.endless?'SPECIAL · ENDLESS':`${level.id+1}-${level.number} · ${depotNames[level.id]}`}</p><h2>${level.stageTitle}</h2><p class="start-goal">${level.endless?'次々やってくる配送ラッシュ':`今日の目標：${level.count}人に届けたら営業完了！`} · ♥♥♥</p><p class="start-tip">お客さんは一人ずつ来店。吹き出しの時刻に合わせて、同じ時刻の人をまとめて配達！</p><p class="start-rule">連続成功でコンボ。不正解はやり直し。先頭で${rushLimit(level)}秒待つと ♥ −1。${level.endless?'行列24人でも終了。':''}</p>${goal?`<p class="start-stars">★★★ ${goal.time}秒以内・ミスなし</p>`:''}<button class="primary" id="open-shop">受付をはじめる</button>`);$('.modal').classList.add('start-modal');$('#open-shop').onclick=()=>{closeModal();startLevel(level);};}
function openModal(content,closable=true){closeModal();soundtrack.duck('dialog',true);const wrapper=document.createElement('div');wrapper.className='modal-backdrop';wrapper.innerHTML=`<section class="modal" role="dialog" aria-modal="true" aria-label="${screen==='play'?'配達のお知らせ':'お知らせ'}">${closable?'<button class="modal-close" aria-label="閉じる">×</button>':''}${content}</section>`;const panel=wrapper.querySelector('.modal');const actions=document.createElement('div');actions.className='dialog-actions';[...panel.children].filter(el=>el.tagName==='BUTTON'&&!el.classList.contains('modal-close')).forEach(el=>actions.append(el));if(actions.children.length)panel.append(actions);app.append(wrapper);$('.modal-close')?.addEventListener('click',()=>{closeModal();if(screen==='play'){paused=false;lastTick=performance.now();}});if(panel.querySelector('.result-character'))panel.classList.add('result-modal');wrapper.querySelector('button')?.focus({preventScroll:true});panel.scrollTop=0;wrapper.addEventListener('keydown',e=>{if(e.key==='Escape'&&closable){e.preventDefault();$('.modal-close')?.click();}if(e.key==='Tab'){const items=[...wrapper.querySelectorAll('button:not(:disabled)')];const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});}
function closeModal(){soundtrack.duck('dialog',false);$('.modal-backdrop')?.remove();}
function spellMarkup(){return `<div class="spell-burst" aria-hidden="true"><svg class="spell-circle" viewBox="0 0 300 300"><circle cx="150" cy="150" r="105"/><circle cx="150" cy="150" r="91"/><path d="M150 45 241 202 59 202ZM150 255 59 98 241 98Z"/>${Array.from({length:12},(_,i)=>`<path transform="rotate(${i*30} 150 150)" d="M150 39l4 8-4 8-4-8Z"/>`).join('')}</svg><span class="spell-core"></span>${Array.from({length:36},(_,i)=>`<i class="spell-spark" style="--spark-delay:${i%6*18}ms;--spark-color:${['#fff0a8','#9cfbea','#ffeac5'][i%3]}" ></i>`).join('')}</div>`;}
function prepareSpell(){const radius=$('.clock-housing').getBoundingClientRect().width*.43;app.querySelectorAll('.spell-spark').forEach((p,i)=>{const angle=i*2.39996,r=radius*(.45+(i%7)/12);p.style.setProperty('--spark-x',`${Math.cos(angle)*r}px`);p.style.setProperty('--spark-y',`${Math.sin(angle)*r}px`);});}
function clockMarkup(){
 let ticks='',numbers=elementalNumbers(),minutes='';
 for(let i=0;i<60;i++){const rad=i*Math.PI/30;const outer=95,inner=i%5===0?88:91;ticks+=`<line x1="${150+inner*Math.sin(rad)}" y1="${150-inner*Math.cos(rad)}" x2="${150+outer*Math.sin(rad)}" y2="${150-outer*Math.cos(rad)}" class="tick ${i%5===0?'major':''}"/>`;}
 for(let i=1;i<=12;i++){const rad=i*Math.PI/6;minutes+=`<text x="${150+78*Math.sin(rad)}" y="${150-78*Math.cos(rad)}" class="minute-number">${i===12?'00':i*5}</text>`;}
 return `<svg id="clock" viewBox="0 0 300 300" aria-label="お届け時刻を合わせる時計"><circle class="dial-ring" cx="150" cy="150" r="96"/>${ticks}${numbers}<g class="minute-guide">${minutes}</g><text x="150" y="207" class="dial-brand">MIRACLE</text><text x="150" y="220" class="dial-caption">AIR POST</text><g id="hour-hand" data-hand="hour" role="slider" tabindex="0" aria-label="短い針・時" aria-valuemin="1" aria-valuemax="12"><line class="hand-hit" x1="150" y1="159" x2="150" y2="73"/><svg class="hand-art hour-art" x="138" y="70" width="24" height="98.3" viewBox="250 40 282 1170" preserveAspectRatio="none"><defs><clipPath id="hour-art-crop"><rect x="250" y="40" width="282" height="1170"/></clipPath></defs><image clip-path="url(#hour-art-crop)" href="assets/clock-hands.webp" width="1254" height="1254"/></svg></g><g id="minute-hand" data-hand="minute" role="slider" tabindex="0" aria-label="長い針・分" aria-valuemin="0" aria-valuemax="59"><line class="hand-hit" x1="150" y1="160" x2="150" y2="59"/><svg class="hand-art minute-art" x="142" y="56.4" width="16" height="115" viewBox="880 40 122 1170" preserveAspectRatio="none"><defs><clipPath id="minute-art-crop"><rect x="880" y="40" width="122" height="1170"/></clipPath></defs><image clip-path="url(#minute-art-crop)" href="assets/clock-hands.webp" width="1254" height="1254"/></svg></g><circle class="pivot-outer" cx="150" cy="150" r="11"/><circle class="pivot" cx="150" cy="150" r="5"/></svg>`;
}
function startLevel(level,lives=3){
 level=rushLevel(level);rushSelected=null;
 cleanup();screen='play';soundtrack.setScene(gameMusicScene(level.endless?'sky':'story',level.id));playSound('intro');document.body.dataset.depot=level.id;session=rushSession(level,lives);selectedHand=level.id===0||level.endless&&rushStep(session)===60?'hour':'minute';dial=720;
 app.innerHTML=`<main class="game scene rush-game" style="--depot-image:url(assets/depots/${level.endless?5:level.id===5?6:level.id}.webp)"><header class="topbar game-top"><button class="subtle" id="pause" aria-label="一時停止">Ⅱ おやすみ</button><div class="stage-heading"><span class="eyebrow">${level.endless?'特別ステージ · エンドレス':`${level.id+1}-${level.number} · ${depotNames[level.id]}`}</span><strong>${level.stageTitle}</strong></div><div class="score-stack"><span id="score" class="score"></span><span id="lives" class="lives" role="status" aria-live="polite"></span></div></header><div class="game-workspace"><section class="queue-area ${!level.endless?'batch-queue':''} ${!level.endless&&level.count>5?'batch-large':''}" aria-label="待っているお客さん"><div class="queue-heading"><span>${level.endless?'荷物の受付':'この便のお客さん'}</span><span id="queue-count"></span></div><div class="queue-track" id="queue"></div><div class="queue-counter"><span>LUCA & TOTO</span><b>空のとけい便</b></div><div class="arrival-track" ><span id="arrival-fill"></span></div></section><div class="play-layout"><aside class="companion-side"><div class="luka-frame">${portrait(0)}<span class="magic-ring"></span></div><div class="luka-note"><b>ルカの 魔法時計</b><p>針を合わせて刻印。<br>次のお客さんを迎えよう。</p></div><div class="plane-dock"><img src="assets/delivery-plane.webp" alt="出発を待つ配送飛行機"></div></aside><section class="clock-station"><div class="order-ticket" id="order"></div><div class="clock-bay"><div class="clock-housing">${clockMarkup()}<button class="seal-button" id="seal-button" aria-label="時計の中心で刻印をおす"><svg class="seal-engraving" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="38"/><path d="M50 8l3 6-3 6-3-6zM50 80l3 6-3 6-3-6zM8 50l6-3 6 3-6 3zM80 50l6-3 6 3-6 3zM29 26q21-13 42 0M29 74q21 13 42 0"/></svg><span>刻印</span><small>おす</small></button><span class="seal-ripple" aria-hidden="true"></span>${spellMarkup()}<div class="clock-status" id="clock-status">お届け時刻を合わせよう</div></div></div><div class="station-controls"><div class="period-toggle" id="period-toggle" hidden><button data-period="0">☀ 午前</button><button data-period="1">☾ 午後</button></div><div class="hand-controls"><button class="hand-select" data-select="hour"><i class="short-swatch"></i><span>短い針<small class="selection-label">えらぶ</small></span></button><button class="adjust" id="minus" aria-label="選んだ針を戻す">−</button><button class="adjust" id="plus" aria-label="選んだ針を進める">＋</button><button class="hand-select" data-select="minute"><i class="long-swatch"></i><span>長い針<small class="selection-label">えらぶ</small></span></button></div><div class="clock-tools"><button class="text-button" id="guide" aria-pressed="${!!level.guide}">分のめもり ${level.guide?'ON':'OFF'}</button><button class="text-button" id="hint">ヒント</button><button class="text-button" id="elements">鉱石</button></div></div></section><aside class="toto-side"><div class="toto-advice">${toto()}<div><b>トトじい</b><p id="advice">${level.lesson}</p></div></div><div class="delivery-log"><span class="eyebrow">TODAY'S FLIGHTS</span><h2>今日のお届け</h2><ol id="flight-log"><li>最初の便を待っています</li></ol></div></aside></div></div><button id="skip-delivery" class="skip-delivery" hidden><span>タップして次のお客さんへ ▸</span></button><div class="flight-layer" aria-hidden="true"><div class="flight-window"><div class="flight-sky"></div><div id="flight-viewport"></div><img class="flight-fallback" src="assets/delivery-plane.webp" alt=""><div class="flight-caption"><small>空のとけい便</small><strong id="flight-destination"></strong><span id="flight-time"></span></div><span class="flight-postmark">時刻の刻印で、約束の空へ</span></div></div><div class="feedback" id="feedback" role="status" aria-live="polite">針を合わせて、時計の真ん中の刻印をおそう。</div></main>`;
 $('#clock').classList.toggle('show-guide',!!level.guide);$('#pause').onclick=()=>pauseGame();$('#seal-button').onclick=dispatch;$('#skip-delivery').onclick=()=>skipDelivery?.();$('#elements').onclick=showElements;
 $('.game-workspace').insertAdjacentHTML('beforeend','<div class="rush-effects" aria-hidden="true"></div>');
 document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{if(busy||paused)return;selectedHand=b.dataset.select;updateDial();});
 $('#minus').onclick=()=>adjust(-1);$('#plus').onclick=()=>adjust(1);
 document.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{if(busy||paused)return;dial=mod(dial,720)+Number(b.dataset.period)*720;updateDial();});
 $('#guide').onclick=e=>{const on=$('#clock').classList.toggle('show-guide');e.currentTarget.textContent=`分のめもり ${on?'ON':'OFF'}`;e.currentTarget.setAttribute('aria-pressed',on);};
 $('#hint').onclick=()=>{if(busy||paused)return;if(!session.queue.length){$('#feedback').textContent='お客さんが来たら、吹き出しの時刻に針を合わせよう。';return;}$('#advice').textContent=orderHint(session.queue.find(o=>o.orderId===rushSelected)||session.queue[0],dial);$('#feedback').textContent=orderHint(session.queue.find(o=>o.orderId===rushSelected)||session.queue[0],dial);};
 const waitingArt=new Image();waitingArt.src='assets/residents-waiting.webp';
 bindDial();updateOrder();updateQueue();updateDial();lastTick=performance.now();timer=setInterval(tick,100);window.scrollTo(0,0);
}
function updateLives(){const el=$('#lives');if(!el)return;el.innerHTML=Array.from({length:session.maxLives},(_,i)=>`<svg class="heart-vessel ${i<session.lives?'full':'empty'}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21S2 15 2 8a5 5 0 0 1 10-3A5 5 0 0 1 22 8c0 7-10 13-10 13Z"/>${i<session.lives?'':'<path class="heart-crack" d="m13 4-3 5 4 3-4 5 2 4"/>'}</svg>`).join('');el.setAttribute('aria-label',`ライフ 残り${session.lives}、最大${session.maxLives}${session.maxLives===6?' おてつだい':''}`);el.classList.toggle('last-life',session.lives===1);}
function updateOrder(){
 updateLives();
 const selected=session.queue.find(o=>o.orderId===rushSelected)||session.queue[0];rushSelected=selected?.orderId??null;
 $('.game').classList.toggle('relative-order',!!selected?.duration);
 if(!$('#customer-floor')){
  const place=session.level.endless?6:session.level.id;
  $('#order').innerHTML=`<div class="rush-heading"><span id="daily-goal"></span><b id="rush-combo"></b></div><div class="customer-floor" id="customer-floor"><svg class="customer-backdrop" viewBox="${place%2*627} ${Math.floor(place/2)*313.5} 627 313.5" preserveAspectRatio="xMinYMax slice" aria-hidden="true"><image href="assets/queue-places.webp" width="1254" height="1254"/></svg><div id="customer-line" class="customer-line" aria-label="お客さんと一人ずつの注文"></div><p class="empty-reception" id="empty-reception"></p></div><div class="rush-detail" id="rush-detail"></div>`;
 }
 $('#daily-goal').textContent=session.level.endless?'空の中央便 · 満員24人で終了':`今日の目標 ${session.level.count}人に届けよう`;
 $('#rush-combo').textContent=`${session.combo} COMBO`;
 $('#rush-detail').innerHTML=selected?`<p class="request"><strong>${selected.label}</strong><span>${selected.duration?'のお届け':'にお届け'}</span></p>${selected.duration?`<span class="reference-time">受付 ${timeText(selected.base,'period')}${selected.nextDay?' · 翌日':''}</span>`:''}<span class="rush-ready" id="rush-ready"></span>`:'<span class="rush-ready" id="rush-ready"></span>';
 $('#period-toggle').hidden=!session.queue.some(o=>o.period);
 $('#score').textContent=session.level.endless?`お届け ${session.delivered}人`:`お届け ${session.delivered} / ${session.level.count}人`;
 $('.clock-status').textContent='同じ時刻をまとめて刻印！';
 updateReception();updateRushMatches();
}
function updateReception(){
 const remaining=rushRemaining(session),empty=!session.queue.length;
 $('#queue-count').innerHTML=`受付中 <strong>${session.queue.length}</strong> 人`;
 $('#queue').textContent=session.level.endless?'一人ずつ、次々来店！':session.status==='cleared'?'本日のお届け完了！':remaining?`これから ${remaining}人が来店`:'これで最後のお客さん！';
 $('#empty-reception').hidden=!empty;
 $('#empty-reception').textContent=session.status==='cleared'?'本日のお届け完了！':session.generated?'次のお客さんがやってきます…':'開店！ お客さんがやってきます…';
}
function updateRushMatches(){
 if(!session||screen!=='play')return;
 const ready=rushMatches(session,dial),ids=new Set(ready.map(o=>o.orderId));
 document.querySelectorAll('.walk-customer[data-order]').forEach(el=>el.classList.toggle('matching',ids.has(Number(el.dataset.order))));
 if($('#rush-ready'))$('#rush-ready').textContent=ready.length?`${ready.length}人まとめて送れる！`:session.queue.length?'吹き出しの時刻に合わせて刻印':'お客さんを迎えよう';
 if($('#seal-button'))$('#seal-button').disabled=session.status!=='playing'||!session.queue.some(o=>o.arriving<=0);
}
function residentPortrait(order){const rows=[0,270,500,735,970,1210,1536],x=(order.variant+1)*256,y=rows[order.region],height=rows[order.region+1]-y;return `<svg class="portrait queue-resident" role="img" aria-label="${order.name}" data-facing="left" viewBox="${x} ${y} 256 ${height}" preserveAspectRatio="xMidYMax meet"><image href="assets/queue-residents.webp" width="1024" height="1536"/></svg>`;}
function updateQueue(){
 const line=$('#customer-line'),q=session.queue,ids=new Set(q.map(o=>String(o.orderId)));
 const positions=new Map([...line.children].map(el=>[el,el.getBoundingClientRect()]));
 for(const el of line.querySelectorAll('[data-order]'))if(!ids.has(el.dataset.order))el.remove();
 for(const o of q){
  let node=line.querySelector(`[data-order="${o.orderId}"]`);
  if(!node){
   node=document.createElement('button');node.className='walk-customer entering';node.dataset.order=o.orderId;node.dataset.region=o.region;
   const key=Number(rushKey(o).split(':')[1]),color=['#27796d','#ad6638','#7660a0','#427da2'][Math.floor(key/60)%4];
   node.style.setProperty('--customer-color',color);node.style.setProperty('--idle-delay',`-${o.orderId%5}s`);
   node.innerHTML=`<span class="personal-order">${timeText(o.target,o.period?'period':'12')}</span><span class="resident-body">${residentPortrait(o)}</span><span class="resident-name">${o.name}</span>`;
   node.setAttribute('aria-label',`${o.name}のお届け ${timeText(o.target,o.period?'period':'12')}`);
   node.onclick=()=>{if(paused||o.arriving>0)return;rushSelected=o.orderId;updateOrder();updateQueue();};
   line.append(node);node.addEventListener('animationend',e=>{if(e.target===node)node.classList.remove('entering');});
  }
  node.setAttribute('aria-pressed',String(o.orderId===rushSelected));node.classList.toggle('arriving',o.arriving>0);
 }
 if(!matchMedia('(prefers-reduced-motion:reduce)').matches)for(const [el,before] of positions){if(!el.isConnected||el.classList.contains('entering'))continue;const after=el.getBoundingClientRect(),x=before.x-after.x,y=before.y-after.y;if(Math.abs(x)+Math.abs(y)>1)el.animate([{transform:`translate(${x}px,${y}px)`},{transform:'translate(0,0)'}],{duration:280,easing:'ease-out'});}
 updateReception();updateWaiting();updateRushMatches();
}
function updateWaiting(){
 for(const o of session.queue){const node=$(`.walk-customer[data-order="${o.orderId}"]`);if(node){node.dataset.mood=customerMood(o);node.classList.toggle('arriving',o.arriving>0);}}
 const order=session.queue[0];let lead=$('#queue-lead');if(!lead){lead=document.createElement('div');lead.id='queue-lead';$('.queue-area').append(lead);}
 lead.innerHTML=order?`<strong>${order.name}</strong><div class="patience ${order.attended>rushLimit(session.level)*.75?'urgent':''}" role="progressbar" aria-label="先頭のお客さんの待ち時間" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(Math.max(0,1-order.attended/rushLimit(session.level))*100)}"><i style="--remaining:${Math.max(0,1-order.attended/rushLimit(session.level))}"></i></div>`:'<strong>開店中</strong>';
 updateRushMatches();
}
function celebrateCustomers(orders){
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const layer=document.createElement('div');layer.className='farewell-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);
 const sayings=['ありがとう！','助かった！','また来るね！','やったー！','お願いね！'];
 for(const [i,o] of orders.entries()){
  const source=$(`.walk-customer[data-order="${o.orderId}"]`);if(!source)continue;
  const box=source.getBoundingClientRect(),floor=$('#customer-floor').getBoundingClientRect();
  if(box.bottom<floor.top||box.top>floor.bottom)continue;
  const ghost=source.cloneNode(true);ghost.removeAttribute('data-order');ghost.removeAttribute('aria-label');ghost.removeAttribute('aria-pressed');ghost.disabled=true;ghost.className='walk-customer farewell';
  Object.assign(ghost.style,{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px'});
  ghost.querySelector('.personal-order').textContent=sayings[o.orderId%sayings.length];
  if(!reduced)ghost.insertAdjacentHTML('beforeend',Array.from({length:Math.min(20,10+orders.length)},(_,j)=>`<i class="farewell-spark" style="--dx:${Math.sin(j*2.4)*40}px;--dy:${-35-j%5*13}px;--delay:${j%4*.04}s"></i>`).join(''));
  layer.append(ghost);
 }
 setTimeout(()=>layer.remove(),reduced?650:1300);
}
function customerLeaves(reason){
 if(paused||session.status!=='playing')return;
 const name=session.queue[0].name;rushTimeout(session);playSound('wrong');
 $('#feedback').textContent=`${name}は待ちきれず帰ってしまった。次のお客さんを迎えよう！`;
 updateLives();if(session.status!=='playing'){finish(session.status==='cleared');return;}
 updateOrder();updateQueue();updateDial();
}
function showElements(){if(busy||paused)return;paused=true;openModal(`<p class="eyebrow">MIRACLE MINE の鉱石</p><h2>12の鉱石と、時の魔法</h2><p>集めた鉱石が魔法時計になったよ。色と紋章に、それぞれの力が宿っている。</p><div class="element-legend">${elements.map((e,i)=>`<div style="--gem:${e.color};color:${e.ink}"><img src="assets/gems/${i===0?12:i}.webp" alt="${i===0?'12（0）':i}の鉱石"><span>${e.name}</span></div>`).join('')}</div><p>12の場所は、0の原石。一周してまた始まる場所だよ。時計の数字は12のまま。お昼の12時と夜中の0時は、午前・午後で見分けよう。</p><button class="primary" id="elements-close">時計にもどる</button>`);$('#elements-close').onclick=()=>{closeModal();paused=false;lastTick=performance.now();};}
// Draw hands at `display` (fractional minutes) while ARIA and buttons reflect the snapped `dial`.
function updateDial(display){if(display===undefined){display=dial;settleId++;}shown=display;const angles=clockAngles(display);document.querySelectorAll('.element-gem').forEach(g=>g.classList.toggle('resonating',Number(g.dataset.element)===Math.floor(mod(display,720)/60)));$('#hour-hand').setAttribute('transform',`rotate(${angles.hour} 150 150)`);$('#minute-hand').setAttribute('transform',`rotate(${angles.minute} 150 150)`);$('#hour-hand').setAttribute('aria-valuenow',Math.floor(mod(dial,720)/60)||12);$('#minute-hand').setAttribute('aria-valuenow',mod(dial,60));$('#hour-hand').setAttribute('aria-valuetext',timeText(dial));$('#minute-hand').setAttribute('aria-valuetext',`${mod(dial,60)}分`);document.querySelectorAll('[data-select]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.select===selectedHand);b.querySelector('.selection-label').textContent=b.dataset.select===selectedHand?'操作中':'えらぶ';});document.querySelectorAll('[data-hand]').forEach(h=>h.classList.toggle('selected-hand',h.dataset.hand===selectedHand));$('.hand-controls').dataset.selected=selectedHand;$('#minus').setAttribute('aria-label',`${selectedHand==='hour'?'短い針':'長い針'}を戻す`);$('#plus').setAttribute('aria-label',`${selectedHand==='hour'?'短い針':'長い針'}を進める`);document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.period)===Math.floor(dial/720)));updateRushMatches();}
// After a drag the hands glide from under the finger to the snapped time.
function settleDial(){const id=++settleId,from=shown,delta=settleDelta(from,dial);if(!delta||matchMedia('(prefers-reduced-motion:reduce)').matches){updateDial();return;}const started=performance.now(),duration=220;const frame=now=>{if(id!==settleId||drag||screen!=='play')return;const p=Math.min(1,(now-started)/duration);if(p===1){updateDial();return;}updateDial(mod(from+delta*(1-(1-p)**3),1440));requestAnimationFrame(frame);};requestAnimationFrame(frame);}
function dialClick(mark,hand){playSound(hand==='hour'?'dial-hour':'dial-minute');const gem=$(`[data-element="${mark}"]`);if(gem&&!matchMedia('(prefers-reduced-motion:reduce)').matches)gem.animate([{filter:'drop-shadow(0 0 4px #fff2ac)'},{filter:'drop-shadow(0 0 0 transparent)'}],{duration:160});}
function adjust(direction){if(paused||busy)return;const next=dial+direction*(selectedHand==='hour'?60:rushStep(session)),mark=new DialDetents(selectedHand,dial).move(next);dial=normalizeTime(next);updateDial();if(mark!==null)dialClick(mark,selectedHand);}
function bindDial(){const clock=$('#clock');const angle=e=>{const b=clock.getBoundingClientRect();return mod(Math.atan2(e.clientX-b.left-b.width/2,-(e.clientY-b.top-b.height/2))*180/Math.PI,360);};
 clock.addEventListener('pointerdown',e=>{if(paused||busy||drag)return;e.preventDefault();let hand=e.target.closest('[data-hand]')?.dataset.hand||selectedHand;const bounds=clock.getBoundingClientRect(),radius=Math.hypot(e.clientX-bounds.left-bounds.width/2,e.clientY-bounds.top-bounds.height/2)*300/bounds.width;const a=clockAngles(dial);if(selectedHand==='hour'&&radius<95&&Math.abs(angleDelta(a.hour,a.minute))<14)hand='hour';selectedHand=hand;drag={pointer:e.pointerId,hand,start:dial,last:angle(e),delta:0,detents:new DialDetents(hand,dial)};clock.setPointerCapture(e.pointerId);clock.classList.add('dragging');updateDial();});
 clock.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer||busy||paused)return;e.preventDefault();const next=angle(e);drag.delta+=angleDelta(drag.last,next);drag.last=next;dial=dragMinutes(drag.start,drag.delta,drag.hand,rushStep(session));const continuous=freeMinutes(drag.start,drag.delta,drag.hand);const mark=drag.detents.move(drag.start+drag.delta*(drag.hand==='hour'?2:1/6));updateDial(continuous);if(mark!==null)dialClick(mark,drag.hand);});
 const end=e=>{if(!drag||e.pointerId!==drag.pointer)return;drag=null;clock.classList.remove('dragging');settleDial();};clock.addEventListener('pointerup',end);clock.addEventListener('pointercancel',end);clock.addEventListener('lostpointercapture',end);
 document.querySelectorAll('[data-hand]').forEach(h=>h.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'].includes(e.key)){e.preventDefault();selectedHand=h.dataset.hand;adjust(['ArrowLeft','ArrowDown'].includes(e.key)?-1:1);}}));
}
function tick(){
 const now=performance.now(),seconds=Math.min(.25,(now-lastTick)/1000);lastTick=now;
 if(paused||document.hidden||session.status!=='playing')return;
 const before=session.generated;rushTick(session,seconds);
 if(before!==session.generated){updateOrder();updateQueue();}
 updateWaiting();
 if(session.status==='playing'&&session.queue[0]?.attended>=rushLimit(session.level)){customerLeaves('timeout');return;}
 $('#arrival-fill').style.width=`${!rushInterval(session)||!rushRemaining(session)?0:session.elapsed/rushInterval(session)*100}%`;
 if(session.status==='over')finish(false);
}
function dispatch(){
 if(paused||session.status!=='playing'||!session.queue.some(o=>o.arriving<=0))return;drag=null;settleId++;
 const orders=rushStamp(session,dial);updateDial();
 if(!orders.length){
  playSound('wrong');$('#feedback').textContent='この時刻の注文はないよ。コンボをもう一度つなごう。';updateOrder();return;
 }
 celebrateCustomers(orders);playSound('imprint');if(orders.length>=3||session.combo===3||session.combo%5===0)playSound('success');
 const message=`${orders.length}件同時配達！ ${session.combo} COMBO`;
 $('#feedback').textContent=message;
 if(!matchMedia('(prefers-reduced-motion:reduce)').matches){
  const burst=document.createElement('div');burst.className='rush-burst';
  burst.innerHTML=`<strong>${orders.length}件同時！</strong><span>${session.combo} COMBO</span><div class="rush-parcels">${orders.slice(0,5).map((o,i)=>`<span class="rush-parcel" style="--parcel:${i}">${parcelSeal(dial)}</span>`).join('')}</div><img src="assets/delivery-plane.webp" alt="">`;
  const layer=$('.rush-effects');if(layer.children.length>=4)layer.firstChild.remove();layer.append(burst);burst.addEventListener('animationend',e=>{if(e.target===burst)burst.remove();});
  $('#seal-button').animate([{transform:'translate(-50%,-50%) scale(.88)'},{transform:'translate(-50%,-50%) scale(1)'}],{duration:160});
 }
 if(session.level.endless){const r=records.slots[activeSlot];r.endless.best=Math.max(r.endless.best,session.delivered);r.endless.total+=orders.length;r.updated=Date.now();persistRecords();}
 const log=$('#flight-log');if(session.combo===1)log.innerHTML='';const li=document.createElement('li');li.innerHTML=`<span>✓ ${orders.length}件まとめて</span><b>${timeText(dial)}</b>`;log.prepend(li);if(log.children.length>5)log.lastChild.remove();
 if(session.status==='cleared'){updateOrder();updateQueue();$('#feedback').textContent='本日のお届け完了！ 全員に届けられたよ！';clearInterval(timer);timer=null;closingTimer=setTimeout(()=>{closingTimer=null;finish(true);},matchMedia('(prefers-reduced-motion:reduce)').matches?650:1300);return;}
 // Keep the dial where the player left it. The next stamp is immediately available.
 updateOrder();updateQueue();updateDial();
}

function pauseGame(){if(busy||session.status!=='playing')return;paused=true;drag=null;openModal(`<p class="eyebrow">MIRACLE CLOCK</p><h2>ひとやすみ</h2><p>時計も、お客さんの行列も止まっています。</p><button class="primary" id="resume">つづける</button><button class="secondary sound" aria-pressed="${soundOn}">音 ${soundOn?'ON':'OFF'}</button><button class="secondary quit-button" id="quit" aria-label="配送所えらびにもどる">配送所へ</button>`,false);$('.modal').classList.add('pause-modal');$('#resume').onclick=()=>{closeModal();paused=false;lastTick=performance.now();};$('#quit').onclick=()=>session.level.endless?finish(false):renderMap();bindSound();}
function finish(won){clearInterval(timer);timer=null;session.status=won?'cleared':'over';if(!won)playSound('wrong');
 if(won&&!session.level.endless){const record=records.slots[activeSlot],id=session.level.stageId;session.rating=rateRun(session.level,session);record.stars[id]=betterRecord(record.stars[id],session.rating);if(!record.stages.includes(id))record.stages.push(id);if(stages.filter(t=>t.id===session.level.id).every(t=>record.stages.includes(t.stageId))&&!record.cleared.includes(session.level.id))record.cleared.push(session.level.id);record.updated=Date.now();persistRecords();syncProgress();}
 showResult(won);
}
function showChapterCompletion(level,onDone){
 // Replays and retries still reach the chapter reward after accepting the result.
 const story=depotStory(level,true);
 story.lines.push({who:story.partner,text:depotThemes[level.id].thanks});
 showDialogue(story,()=>showDepotReward(level.id,onDone));
}
function showResult(won){const l=session.level,r=session.rating,goal=l.endless?null:starGoal(l);if(won)playSound('win');
 openModal(`<div class="result-character">${won?'<img class="victory-luca" src="assets/luka-victory.webp" width="130" height="130" alt="笑顔でガッツポーズするルカ">':toto()}</div><p class="save-warning" role="status">${saveNotice}</p><p class="eyebrow">${l.endless?'CENTRAL AIR POST':won?'DELIVERY COMPLETE':'TAKE A LITTLE BREAK'}</p><h2>${l.endless?'おつかれさま、中央便！':won?(session.departed?'この便の受付が終わったよ！':'みんなの荷物が届いたよ！'):'今日は、ここでひとやすみ。'}</h2><p>${l.endless?`${session.delivered}便お届け · 最高 ${records.slots[activeSlot].endless.best}便`:won?`お届け ${session.delivered}人 · 帰ってしまった ${session.departed}人`:'ライフがなくなったので、この便はおしまい。もう一度やってみよう。おてつだいなら、この便だけライフ6で挑戦できるぞ。'}</p>${l.endless?`<p>${session.lives===0?'ライフがなくなったので、中央便はおしまい。':session.queue.length>=session.capacity?'行列が24人になったので、中央便はおしまい。':'ここまでの配達を記録したよ。'}</p>`:''}<p class="rush-result">最大 ${session.maxCombo} COMBO · 最大 ${session.maxBatch}件同時 · ${session.points}点</p>${r?`<div class="star-result" data-stars="${r.stars}"><strong aria-label="${r.stars}つ星">${starText(r.stars)}</strong><p>${r.time.toFixed(1)}秒 · ミス ${r.mistakes}回</p><small>3つ星：${goal.time}秒以内・ミスなし<br>最高評価 ${starText(records.slots[activeSlot].stars[l.stageId].stars)}</small></div>`:''}<button class="primary" id="result-main">${won&&!l.endless?(l.number===6?'章クリアへ ▸':'次の便へ'):l.endless?'もう一度あそぶ':'もう一度・♥3'}</button>${!won&&!l.endless?'<button class="secondary" id="retry-assisted">おてつだいで挑戦・♥6</button>':''}<button class="secondary" id="result-map">配送所えらびにもどる</button>${won?'<button class="secondary" id="retry-stage">星をふやしに、もう一度</button>':''}`,false);
 if(won){$('.result-modal').classList.add('victory-result');$('.result-modal').insertAdjacentHTML('afterbegin',victoryEffects());}
 const leaveResult=onDone=>{closeModal();if(won&&!l.endless&&l.number===6)showChapterCompletion(l,onDone);else onDone();};
 $('#result-main').onclick=()=>{if(won&&!l.endless)leaveResult(()=>{renderMap();if(l.stageId<35)chooseLevel(stages[l.stageId+1]);else renderPreparations();});else startLevel(l);};$('#retry-assisted')?.addEventListener('click',()=>startLevel(l,6));$('#result-map').onclick=()=>leaveResult(renderMap);$('#retry-stage')?.addEventListener('click',()=>startLevel(l));
}
window.addEventListener('resize',()=>document.querySelectorAll('.farewell-layer').forEach(el=>el.remove()));
document.addEventListener('visibilitychange',()=>{soundtrack.visibility(document.hidden);lastTick=performance.now();if(document.hidden&&screen==='play'&&!paused&&!busy&&session?.status==='playing')pauseGame();});
renderHome();
