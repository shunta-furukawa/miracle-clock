import {routeSession,routeTick,routeStamp,routePins,routeStars,routePace,routeBusy,visitors,winding} from './route.js';
import {dayLevel} from './day.js';
import {parcelSeal} from './stamp.js';
import {Soundtrack,creditsHTML,gameMusicScene} from './soundtrack.js';
import {mod, clockAngles, angleDelta, timeText, durationText, orderHint} from './time.js';
import {levels, depotNames, customers, residents, customerFor, stages, endlessLevel, stageUnlocked, endlessUnlocked, betterRecord, starText, totalStars} from './levels.js';
import {elements, elementMark, elementalNumbers} from './elements.js';
import {freshRecord,loadRecords,saveRecords} from './save.js';
import {showDialogue,closeDialogue} from './dialogue.js';
import {clockPrologue,depotStory,stageStory} from './stories.js';
import {depotThemes,chapterDeliveries,earnedRewards,preparationStep,shopReputation,depotIcon,centralArt} from './depot.js';
import {DialDetents} from './detent.js';
import {victoryEffects} from './celebration.js';
import {postStages,postStories,postQuestion,postCorrect,postTarget,postStars,postParts,postDuration,postHourOf,postMinOf,postMs,postGiftCount} from './post.js';
import {showOpening,closeOpening} from './opening.js';

let closingTimer=null;
const app=document.querySelector('#app');
const $=selector=>app.querySelector(selector);
let screen='home', session=null, paused=false, busy=false, drag=null, timer=null, flightTimer=null;
let skipDelivery=null,chapterMusic=null,stampImpactTimer=null;
let flightView=null, flightLoading=null, launchToken=0;
let settleId=0;
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
function cleanup(){clearTimeout(closingTimer);closingTimer=null;document.querySelectorAll('.farewell-layer').forEach(e=>e.remove());clearTimeout(stampImpactTimer);stampImpactTimer=null;skipDelivery=null;soundtrack.stopEffects();soundtrack.duck('dialog',false);soundtrack.duck('story',false);closeOpening();closeDialogue();launchToken++;settleId++;flightView?.dispose();flightView=null;flightLoading=null;clearInterval(timer);clearTimeout(flightTimer);timer=null;drag=null;cancelAnimationFrame(dayFrame);clearTimeout(pickTimer);picked=null;busy=false;paused=false;document.body.classList.remove('flying','stamping','loading-parcel');delete document.body.dataset.depot;}
function renderHome(){
  cleanup();chapterMusic=null;screen='home';soundtrack.setScene('title');
  const continuing=records.slots.some(Boolean),menuIcon=n=>`<i class="menu-art" aria-hidden="true" style="--icon-x:${n%3*50}%;--icon-y:${Math.floor(n/3)*100}%"></i>`;
  app.innerHTML=`<main class="home scene"><header class="home-header"><p class="home-eyebrow">時をあわせて、せかいをつなぐ</p><button class="icon-button home-music" aria-pressed="${soundtrack.settings.music}">${soundtrack.settings.music?'音楽をとめる':'音楽を再生'}</button></header><div class="title-lockup"><h1><img src="assets/title-logo.webp" alt="Miracle Clock" width="1100" height="733" fetchpriority="high"></h1><p class="subtitle">ミラクルクロック</p></div><div class="home-painting" role="img" aria-label="ルカが荷物に刻印し、トトじいが蒸気飛行機に積み込む空の配送所"></div><div class="home-actions"><button class="primary" id="start">${menuIcon(0)}${continuing?'冒険をつづける':'冒険をはじめる'}</button></div><p class="home-tagline">小さな時刻で、大きな約束を。</p><nav class="home-menu" aria-label="タイトルメニュー"><button class="subtle" id="home-help">${menuIcon(3)}あそびかた</button><button class="subtle sound">${menuIcon(4)}設定</button><button class="subtle" id="home-share">友だちに教える</button></nav><footer class="home-footer"><div class="home-app-tools"><button class="text-button" id="install-app">ホーム画面に追加</button><button class="text-button" id="update-app">更新を確認</button></div><small id="offline-status" role="status"></small><span class="home-version">Ver. 0.8.2</span></footer></main>`;
  $('#start').onclick=renderSlots;$('#install-app').onclick=()=>window.clockPwa?.install();$('#update-app').onclick=()=>window.clockPwa?.update();window.clockPwa?.refresh();bindSound();
  $('.home-music').onclick=()=>{soundtrack.configure({music:!soundtrack.settings.music});soundtrack.unlock();};
  $('#home-help').onclick=()=>openModal('<p class="eyebrow">MIRACLE CLOCK</p><h2>あそびかた</h2><p>島の配送所で、お客さんの荷物をあずかろう。荷札の時刻に時計の針を合わせて刻印すると、飛行機が友だちの島へ飛んでいきます。</p><p>短い針は「時の針」。いる宝石のへやが何時かを教えてくれます。長い針は「分の針」。外がわの数字を読みます。文字盤の真ん中近くをなぞると短い針、外がわをなぞると長い針が動きます。</p><p>帰ってきた便には、おへんじの手紙。時計の時刻を読んで、おかえしを受けとろう。時間せいげんはありません。</p><p>36の便をぜんぶ届けると、閉店のない「空の中央便」がひらきます。こちらは時計がどんどん進む、いそがしい一日です。</p>');
  $('#home-share').onclick=async()=>{const data={title:'Miracle Clock',text:'ルカと空のとけい便。魔法の時計で、浮遊島へ荷物を届けよう。',url:'https://miracle-clock.vercel.app/'};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.url);$('#home-share').textContent='リンクをコピーしました';}}catch(e){if(e.name!=='AbortError')openModal('<h2>友だちに教える</h2><p><a href="https://miracle-clock.vercel.app/">miracle-clock.vercel.app</a></p><p>このリンクをコピーして教えてね。</p>');}};
}
function bindSound(){const b=$('.sound');if(b){b.title='音の設定';b.addEventListener('click',audioSettingsDialog);}}
soundtrack.onChange=()=>{soundOn=soundtrack.settings.music||soundtrack.settings.sound;document.querySelectorAll('.sound').forEach(b=>{if(b.closest('.home'))return;const label=`音 ${soundOn?'ON':'OFF'}`;if(b.textContent!==label)b.textContent=label;b.setAttribute('aria-pressed',soundOn);});const music=$('.home-music');if(music){music.textContent=soundtrack.settings.music?'音楽をとめる':'音楽を再生';music.setAttribute('aria-pressed',soundtrack.settings.music);}};
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>soundtrack.unlock(),{capture:true});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.matches('#seal-button'))return;playSound(b.id==='hint'?'hint':b.matches('[data-select]')?'hand-select':'click');});
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
 app.innerHTML=`<main class="map scene campaign-map"><header class="topbar"><button class="subtle" id="records">← 配達日誌</button><span class="wordmark">配達日誌 ${activeSlot+1}</span><button class="icon-button sound" aria-pressed="${soundOn}">音 ${soundOn?'ON':'OFF'}</button></header><section class="map-heading depot-map-heading"><div><p class="eyebrow">THE JOURNEY TO CENTRAL AIR POST</p><h1>約束をあつめて、中央便へ。</h1></div><div class="map-heading-actions"><button class="subtle" id="replay-story">はじまりの物語</button><button class="primary" id="preparations">中央配送所のしたく <small>${earnedRewards(record).length} / 6</small></button></div></section><div class="chapter-list">${levels.map(ch=>{const list=stages.filter(t=>t.id===ch.id),stars=list.reduce((n,t)=>n+(record.stars[t.stageId]?.stars||0),0),theme=depotThemes[ch.id],done=chapterDeliveries(record,ch.id);return `<article class="chapter parchment compact-chapter" style="--chapter-color:${theme.color}"><div class="chapter-info">${depotIcon(ch.id)}<div><p class="eyebrow">CHAPTER ${ch.id+1} / ${theme.tag}</p><h2>${depotNames[ch.id]}</h2><p class="chapter-reward">${theme.reward} · ${done===6?'獲得済み':'章クリアで獲得'}</p><p class="chapter-star-count">★ ${stars} / 18 ${done===6?'<span class="stamp">配達ずみ</span>':''}</p><small class="shop-reputation">${shopReputation(done)} <span aria-label="繁盛度 ${done} / 6">${'●'.repeat(done)}${'○'.repeat(6-done)}</span></small></div></div><div class="stage-list">${list.map(t=>{const cleared=record.stages.includes(t.stageId),open=stageUnlocked(record,t.stageId),r=record.stars[t.stageId];return `<button class="stage ${cleared?'cleared':open?'next':''}" data-stage="${t.stageId}" ${open?'':'disabled'} aria-label="${ch.id+1}-${t.number} ${t.stageTitle} ${open?'':'未解放'}"><b>${ch.id+1}-${t.number}</b><small>${r?starText(r.stars):cleared?'✓':open?'☆☆☆':'—'}</small></button>`;}).join('')}</div></article>`;}).join('')}</div><section class="special-depot parchment"><div>${toto()}<p class="eyebrow">SPECIAL · ENDLESS</p><h2>トトじいと空の中央便</h2><p>みんなの配送所をつなぐ、新しい受付。<br>全ての島のお客さんと、全ての時計の注文がやってくるぞ。</p><p>最高 ${record.endless.best}人 · 累計 ${record.endless.total}人</p><button class="primary" id="endless" ${endlessUnlocked(record)?'':'disabled'}>${endlessUnlocked(record)?'トトじいと中央便をひらく':'全36ステージをクリアすると開店'}</button><small>閉店のない一日。取りこぼしが5人になったら店じまい。配達するほど時間が速くなります。</small></div></section><p class="save-note">${record.stages.length} / 36 ステージ · ★ ${totalStars(record)} / 108</p><p class="save-warning" role="status">${saveNotice}</p></main>`;
 $('#preparations').onclick=renderPreparations;$('#records').onclick=renderSlots;$('#replay-story').onclick=()=>showStory();bindSound();
 app.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.stage);if(stageUnlocked(record,id))chooseLevel(stages[id]);});
 $('#endless').onclick=()=>{if(endlessUnlocked(record))chooseLevel(endlessLevel);};
}
function chooseLevel(level){
 level=dayLevel(level);
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
// Each resident's measured box in queue-residents.webp ([x,y,w,h] per region and column).
// Sprites overflow a plain 256px grid, so crops use these boxes and never show a neighbour.
const residentBoxes=[[[26,12,228,250],[300,46,170,218],[530,10,208,254],[776,14,232,250]],[[32,268,224,226],[292,278,184,218],[514,272,224,226],[784,272,216,228]],[[16,498,240,230],[284,534,196,194],[500,502,238,228],[770,502,238,228]],[[18,736,254,228],[290,788,194,176],[490,734,252,232],[756,738,258,228]],[[10,972,258,236],[288,1004,200,206],[506,976,246,234],[768,972,244,236]],[[20,1216,248,296],[294,1228,194,282],[520,1222,246,290],[786,1216,228,296]]];
// An inner <svg> sized exactly to the box clips the sheet; the outer one fits it into any frame.
function residentCrop(o,frame='full'){
 const [x,y,w,h]=residentBoxes[o.region][o.variant+1];
 if(frame==='face'){const f=Math.min(w,h)*.8;return `<svg viewBox="${x+(w-f)/2} ${y} ${f} ${f}" width="100%" height="100%" preserveAspectRatio="xMidYMin slice"><image href="assets/queue-residents.webp" width="1024" height="1536"/></svg>`;}
 const S=Math.max(w,h);return `<svg x="${(S-w)/2}" y="${S-h}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}"><image href="assets/queue-residents.webp" width="1024" height="1536"/></svg>`;
}
function residentPortrait(order){const [,,w,h]=residentBoxes[order.region][order.variant+1],S=Math.max(w,h);return `<svg class="portrait queue-resident" role="img" aria-label="${order.name}" viewBox="0 0 ${S} ${S}" preserveAspectRatio="xMidYMax meet">${residentCrop(order)}</svg>`;}
function showElements(){if(busy||paused)return;paused=true;openModal(`<p class="eyebrow">MIRACLE MINE の鉱石</p><h2>12の鉱石と、時の魔法</h2><p>集めた鉱石が魔法時計になったよ。色と紋章に、それぞれの力が宿っている。</p><div class="element-legend">${elements.map((e,i)=>`<div style="--gem:${e.color};color:${e.ink}"><img src="assets/gems/${i===0?12:i}.webp" alt="${i===0?'12（0）':i}の鉱石"><span>${e.name}</span></div>`).join('')}</div><p>12の場所は、0の原石。一周してまた始まる場所だよ。時計の数字は12のまま。お昼の12時と夜中の0時は、午前・午後で見分けよう。</p><button class="primary" id="elements-close">時計にもどる</button>`);$('#elements-close').onclick=()=>{closeModal();paused=false;lastTick=performance.now();};}
// ---------- The day clock: "now" runs by itself; the player only chooses the next flight time. ----------
let hand=0,freeHand=null,dayFrame=0,picked=null,pickTimer=0,hold=null;
// Holding the seal sweeps the flight forward this many minutes per second, up to one lap.
const SWEEP_PER_SECOND=16,TAP_MS=160;
const people=new Map(),tickets=new Map();
const regionColors=['#4f8a3c','#3b8db5','#8759c0','#c4572d','#5b9cc8','#c28a3f'];
const reduceMotion=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
// The long hand rests on any minute after now; no snapping to the stage's order steps.
const nextMinute=()=>Math.floor(session.now+1e-6)+1;
const snapHand=v=>Math.min(session.level.close,Math.max(nextMinute(),Math.round(v)));
const gemColor=t=>elements[Math.floor(mod(t,720)/60)].color;
const aimed=()=>snapHand(freeHand??hand);
const secondsLeft=o=>(o.target-session.now)*session.level.hourSeconds*routePace(session)/60;
const cardText=t=>timeText(t,'12');
const clockLabel=(t,open=session.level.open)=>(Math.floor(t/1440)>Math.floor(open/1440)?'あした':'')+timeText(t,'period');
const stageHeading=level=>level.endless?'特別ステージ · エンドレス':`${level.id+1}-${level.number} · ${depotNames[level.id]}`;
function levelDetails(input){
 const level=dayLevel(input);
 if(!level.endless){postDetails(level);return;}
 openModal(`<p class="eyebrow">${stageHeading(level)}</p><h2>${level.stageTitle}</h2><p class="start-goal">${level.endless?'閉店のない一日 · 5人取りこぼすと店じまい':`${timeText(level.open,'period')} 開店 → ${clockLabel(level.close,level.open)} 閉店`}</p><p class="start-tip">「いま」はどんどん進むよ。注文の時刻が来る前に届けよう！ 刻印を長押しすると、長い針の先から扇形が広がって、その中の注文をまとめて運べる。</p><p class="start-rule">広く囲うほど、飛行機がもどるまで次の刻印はできない。${level.endless?'配達するほど、時間が速くなるぞ。':`練習：${level.skill}`}</p>${level.endless?'':`<p class="start-stars">★ 5割 · ★★ 7割 · ★★★ 9割のお客さんに届けよう</p>`}<button class="primary" id="open-shop">開店する</button>`);
 $('.modal').classList.add('start-modal');$('#open-shop').onclick=()=>{closeModal();startLevel(level);};
}
function dayClockMarkup(){
 // The day meter runs around the outside of the housing: a dark track, the open hours ahead, and a sun (or moon) at "now".
 const overlay=`<circle class="now-track" cx="150" cy="150" r="158"/><path id="day-remaining" class="day-remaining"/><g id="now-sun" class="now-sun"><circle r="13"/><text y="1">☀️</text></g><g id="ghost-hands" class="ghost-hands"><line id="ghost-hour" x1="150" y1="150" x2="150" y2="96"/><line id="ghost-minute" x1="150" y1="150" x2="150" y2="68"/></g><g id="day-pins" class="day-pins"></g>`;
 const flight=`<path id="sweep" class="sweep"/><line id="sweep-end" class="sweep-end" x1="150" y1="150" x2="150" y2="58"/><path id="busy-arc" class="busy-arc"/><g id="plane-back" class="plane-back"><circle r="12"/><text y="1">✈️</text></g>`;
 // The face takes the colour of the hour the long hand is in: Miracle Mine's gem for that number.
 return clockMarkup().replace('<circle class="dial-ring"','<defs><radialGradient id="hour-glow" cx="150" cy="150" r="95" gradientUnits="userSpaceOnUse"><stop offset="0" class="hg0"/><stop offset=".62" class="hg1"/><stop offset="1" class="hg2"/></radialGradient></defs><circle id="hour-tint" class="hour-tint" cx="150" cy="150" r="95"/><circle id="hour-flash" class="hour-flash" cx="150" cy="150" r="95"/><circle class="dial-ring"').replace('<g id="hour-hand"',overlay+flight+'<g id="hour-hand"');
}
function startLevel(input,slow=false){
 const level=dayLevel(input);
 cleanup();screen='play';soundtrack.setScene(gameMusicScene(level.endless?'sky':'story',level.id));playSound('intro');document.body.dataset.depot=level.id;
 const paced=slow?{...level,hourSeconds:level.hourSeconds*1.4,lead:level.lead*1.4,arrive:level.arrive.map(x=>x*1.4)}:level;
 session=routeSession(paced);session.stage=level;session.slow=slow;
 hand=nextMinute();freeHand=null;picked=null;hold=null;people.clear();tickets.clear();
 const place=level.endless?6:level.id,art=level.endless?5:level.id===5?6:level.id;
 app.innerHTML=`<main class="day-game scene" style="--depot-image:url(assets/depots/${art}.webp)"><header class="topbar day-top"><button class="subtle" id="pause" aria-label="一時停止">Ⅱ おやすみ</button><div class="stage-heading"><span class="eyebrow">${stageHeading(level)}</span><strong>${level.stageTitle}</strong></div><div class="day-score"><span id="score" class="score">お届け <b id="delivered">0</b>人</span><span id="lost" class="lost">取りこぼし 0</span></div></header><section class="day-strip" aria-label="今日の営業時間"><div class="day-track" id="day-track"></div><div class="day-labels"><span>${timeText(level.open,'period')} 開店</span><span class="now-time" id="now-time"><svg class="now-clock" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18"/><path id="now-h" d="M20 20V10"/><path id="now-m" d="M20 20V5"/><circle cx="20" cy="20" r="2"/></svg><span>いま <b id="now-text"></b></span></span><span>${level.endless?'閉店なし':clockLabel(level.close)+' 閉店'}</span></div></section><section class="shop-floor" aria-label="受付に並ぶお客さん"><svg class="shop-backdrop" viewBox="${place%2*627} ${Math.floor(place/2)*313.5} 627 313.5" preserveAspectRatio="xMinYMax slice" aria-hidden="true"><image href="assets/queue-places.webp" width="1254" height="1254"/></svg><div class="shop-line" id="shop-line"></div><div class="shop-says" id="shop-says" aria-hidden="true"></div><b id="day-combo" class="day-combo"></b><p class="shop-note" id="shop-note">開店！ お客さんがやってくるよ</p></section><section class="ticket-rail" id="tickets" aria-label="注文票"></section><section class="day-station"><div class="clock-bay"><div class="clock-housing">${dayClockMarkup()}<button class="seal-button" id="seal-button" aria-label="時計の中心で刻印をおす"><svg class="seal-engraving" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="38"/><path d="M50 8l3 6-3 6-3-6zM50 80l3 6-3 6-3-6zM8 50l6-3 6 3-6 3zM80 50l6-3 6 3-6 3zM29 26q21-13 42 0M29 74q21 13 42 0"/></svg><span>刻印</span><small>長押し</small></button><span class="seal-ripple" aria-hidden="true"></span>${spellMarkup()}</div></div><div class="clock-tools"><button class="text-button" id="guide" aria-pressed="${!!level.guide}">分のめもり ${level.guide?'ON':'OFF'}</button><button class="text-button" id="hint">ヒント</button><button class="text-button" id="elements">鉱石</button></div></section><div class="day-effects" aria-hidden="true"></div><p class="day-toast" id="feedback" role="status" aria-live="polite"></p></main>`;
 $('#clock').classList.toggle('show-guide',!!level.guide);$('#pause').onclick=()=>pauseGame();bindSeal();$('#elements').onclick=showElements;
 $('#guide').onclick=e=>{const on=$('#clock').classList.toggle('show-guide');e.currentTarget.textContent=`分のめもり ${on?'ON':'OFF'}`;e.currentTarget.setAttribute('aria-pressed',on);};
 $('#hint').onclick=showHint;
 bindDayDial();layoutLine();renderDay();lastTick=performance.now();dayFrame=requestAnimationFrame(dayLoop);window.scrollTo(0,0);
}
function toast(text){const el=$('#feedback');if(!el)return;el.textContent=text;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
function pickTarget(target){picked=target;clearTimeout(pickTimer);pickTimer=setTimeout(()=>{picked=null;},2600);}
function showHint(){
 if(paused||session.status!=='playing')return;
 const o=session.queue.find(x=>x.target===picked)||[...session.queue].sort((a,b)=>a.target-b.target)[0];
 if(!o){toast('お客さんが来たら、注文の時刻に針を合わせよう。');return;}
 pickTarget(o.target);
 toast(`${orderHint({...o,period:false,duration:0},aimed())} 点線の針が正解だよ。`);
}
function drawHands(){
 const v=freeHand??hand,target=aimed(),angles=clockAngles(v);
 $('#hour-hand').setAttribute('transform',`rotate(${angles.hour} 150 150)`);$('#minute-hand').setAttribute('transform',`rotate(${angles.minute} 150 150)`);
 $('#hour-hand').setAttribute('aria-valuenow',Math.floor(mod(target,720)/60)||12);$('#minute-hand').setAttribute('aria-valuenow',mod(target,60));$('#minute-hand').setAttribute('aria-valuetext',cardText(target));
 app.querySelectorAll('.element-gem').forEach(g=>g.classList.toggle('resonating',Number(g.dataset.element)===Math.floor(mod(v,720)/60)));
}
const polar=(deg,r)=>[150+Math.sin(deg*Math.PI/180)*r,150-Math.cos(deg*Math.PI/180)*r];
const hourAngle=t=>mod(t,720)/2;
function remainingArc(from,to,r){const span=Math.min(359.5,(to-from)/2);if(span<.5)return '';const a=hourAngle(from),[x1,y1]=polar(a,r),[x2,y2]=polar(a+span,r);return `M${x1} ${y1}A${r} ${r} 0 ${span>180?1:0} 1 ${x2} ${y2}`;}
function residentFace(o,cls=''){return `<svg class="resident-face ${cls}" viewBox="0 0 20 20" aria-hidden="true">${residentCrop(o,'face').replace('<svg ','<svg x="0" y="0" ').replace('width="100%" height="100%"','width="20" height="20"')}</svg>`;}
function renderDay(){
 if(!session||screen!=='play')return;
 const target=aimed(),s=session;drawHands();
 // The exact current time, as a small clock and in words, so the minutes left are easy to count.
 const nowMinute=Math.floor(s.now+1e-6),na=clockAngles(s.now);$('#now-h').setAttribute('transform',`rotate(${na.hour} 20 20)`);$('#now-m').setAttribute('transform',`rotate(${na.minute} 20 20)`);
 const nowWords=cardText(nowMinute);if($('#now-text').textContent!==nowWords)$('#now-text').textContent=nowWords;
 $('#day-remaining').setAttribute('d',remainingArc(s.now,Math.min(s.level.close,s.now+719),158));
 const [sx,sy]=polar(hourAngle(s.now),158),night=mod(s.now,1440)<360||mod(s.now,1440)>=1110,sun=$('#now-sun');
 sun.setAttribute('transform',`translate(${sx} ${sy})`);sun.classList.toggle('night',night);const face=night?'🌙':'☀️';if(sun.lastChild.textContent!==face)sun.lastChild.textContent=face;
 $('#ghost-hands').classList.toggle('show',picked!==null);
 if(picked!==null){const a=clockAngles(picked);$('#ghost-hour').setAttribute('transform',`rotate(${a.hour} 150 150)`);$('#ghost-minute').setAttribute('transform',`rotate(${a.minute} 150 150)`);}
 // The flight window: while the seal is held it runs from the hold's start for the swept minutes; otherwise it is the one minute under the hand.
 const flightFrom=hold?hold.start:target,span=hold?hold.span:0,inFlight=o=>o.target>=flightFrom&&o.target<=flightFrom+span;
 // The face glows in the gem colour of the long hand's hour, and flashes when the hand crosses into a new hour.
 const clockEl=$('#clock'),hourKey=String(Math.floor(flightFrom/60));
 if(clockEl.dataset.hour!==hourKey){const first=!clockEl.dataset.hour;clockEl.dataset.hour=hourKey;clockEl.style.setProperty('--hour',gemColor(flightFrom));
  if(!first){const flash=$('#hour-flash');flash.classList.remove('show');void flash.getBoundingClientRect();flash.classList.add('show');playSound('select');}}
 const sweepAngle=mod(flightFrom,60)*6;
 if(span>0){const [x1,y1]=polar(sweepAngle,94),[x2,y2]=polar(sweepAngle+span*6-(span>=60?.01:0),94);$('#sweep').setAttribute('d',`M150 150L${x1} ${y1}A94 94 0 ${span>30?1:0} 1 ${x2} ${y2}Z`);$('#sweep-end').setAttribute('transform',`rotate(${sweepAngle+span*6} 150 150)`);}
 $('#sweep').classList.toggle('show',span>0);$('#sweep-end').classList.toggle('show',span>0);
 // Pins sit where the long hand must point, for the sixty minutes ahead of the hand. Their ring shows the hour's gem colour.
 // Pin elements persist between frames so their face images finish loading.
 const layer=$('#day-pins'),seen=new Set();let lastAngle=-99,lane=0;
 for(const pin of routePins(s)){
  if(pin.target<flightFrom||pin.target>=flightFrom+60)continue;
  const angle=mod(pin.target,60)*6+(pin.target-flightFrom>=60-mod(flightFrom,60)?360:0);lane=angle-lastAngle<14?(lane+1)%3:0;lastAngle=angle;seen.add(String(pin.target));
  const [x,y]=polar(angle,[64,48,32][lane]),o=pin.orders[0],later=Math.floor(pin.target/60)!==Math.floor(flightFrom/60);
  let g=layer.querySelector(`[data-target="${pin.target}"]`);
  if(!g){
   g=document.createElementNS('http://www.w3.org/2000/svg','g');g.dataset.target=pin.target;g.style.setProperty('--tint',regionColors[o.region]);g.style.setProperty('--gem',gemColor(pin.target));
   g.innerHTML=`<circle class="pin-body" r="11.5"/>${residentCrop(o,'face').replace('<svg ','<svg x="-10" y="-10" ').replace('width="100%" height="100%"','width="20" height="20"')}<g class="pin-badge-group"><circle class="pin-badge" cx="9" cy="-9" r="6.5"/><text class="pin-count" x="9" y="-9"></text></g>`;
   layer.append(g);
  }
  g.setAttribute('transform',`translate(${x} ${y})`);
  g.setAttribute('class',`day-pin${pin.orders.some(inFlight)?' matching':''}${pin.target===picked?' picked':''}${later?' later':''}${secondsLeft(o)<=4?' urgent':''}`);
  const count=String(pin.orders.length);if(g.querySelector('.pin-count').textContent!==count)g.querySelector('.pin-count').textContent=count;
  g.querySelector('.pin-badge-group').style.display=pin.orders.length>1?'':'none';
 }
 for(const g of [...layer.children])if(!seen.has(g.dataset.target))g.remove();
 let ready=0;
 for(const o of s.queue){
  const p=people.get(o.id),t=tickets.get(o.id),left=secondsLeft(o),match=inFlight(o);ready+=match;
  for(const el of [p,t]){if(!el)continue;el.classList.toggle('matching',match);el.classList.toggle('picked',o.target===picked);el.classList.toggle('urgent',left<=4);}
  t?.style.setProperty('--left',Math.max(0,Math.min(1,left/o.lead)));
  const mins=Math.max(1,Math.ceil(o.target-s.now-1e-6)),text=`あと${mins}分`;const small=t?.querySelector('.ticket-left');if(small&&small.textContent!==text)small.textContent=text;
 }
 // While the plane is away the seal rests, and the outer ring shows when it comes back.
 const away=routeBusy(s),seal=$('#seal-button');
 seal.classList.toggle('ready',ready>0&&!away);seal.classList.toggle('away',away>0);
 const sealNote=away?`あと${Math.ceil(away)}分`:hold?`${span}分`:'長押し';if(seal.lastChild.textContent!==sealNote)seal.lastChild.textContent=sealNote;
 seal.setAttribute('aria-label',away?`飛行機がもどるまで あと${Math.ceil(away)}分`:ready?`刻印をおす（${ready}人に届く）`:'時計の中心で刻印をおす');
 $('#busy-arc').setAttribute('d',away?remainingArc(s.now,s.busyUntil,158):'');
 const plane=$('#plane-back');plane.style.display=away?'':'none';if(away){const [px,py]=polar(hourAngle(s.busyUntil),158);plane.setAttribute('transform',`translate(${px} ${py})`);}
 const {open,close}=s.level,endless=!Number.isFinite(close),from=endless?Math.max(open,s.now-240):open,to=endless?from+720:close,pct=t=>`${Math.max(0,Math.min(100,(t-from)/(to-from)*100))}%`;
 const sky=t=>{const h=mod(t,1440)/60;return h<5||h>=20?'#2d3f72':h<7?'#f0a878':h<16?'#8ecfee':h<18?'#f3c46e':'#df7a58';};
 const stops=[];for(let t=from;t<=to;t+=30)stops.push(`${sky(t)} ${pct(t)}`);
 let strip=`<span class="sky" style="background:linear-gradient(90deg,${stops.join(',')})"></span><span class="past" style="width:${pct(s.now)}"></span>`;
 for(let d=Math.ceil(from/720)*720;d<to;d+=720)if(d>from)strip+=`<span class="mark" style="left:${pct(d)}">${mod(d,1440)?'正午':'0時'}</span>`;
 for(const pin of routePins(s))strip+=`<span class="dot" style="left:${pct(pin.target)};background:${regionColors[pin.orders[0].region]}"></span>`;
 strip+=`<span class="cursor" style="left:${pct(target)}"></span><span class="sun" style="left:${pct(s.now)}">${mod(s.now,1440)<360||mod(s.now,1440)>=1110?'🌙':'☀️'}</span>`;
 $('#day-track').innerHTML=strip;
}
function renderScore(){
 const s=session;$('#delivered').textContent=s.delivered;$('#lost').textContent=`取りこぼし ${s.missed+s.gaveUp}${s.level.maxLost?` / ${s.level.maxLost}`:''}`;
 $('#day-combo').textContent=s.combo>1?`${s.combo} COMBO`:'';
 const n=s.queue.length,cap=s.level.capacity,note=$('#shop-note');
 note.textContent=n>=cap?'満員！ これ以上は帰っちゃう':n>=cap-1?'もうすぐ満員！':n?`${n} / ${cap}人 並んでいるよ`:s.generated?'次のお客さんを待っているよ':'開店！ お客さんがやってくるよ';
 note.classList.toggle('full',n>=cap-1);
}
// The line runs from the counter on the left toward the door on the right.
// Size people so the whole line fits: neighbours overlap by under half, and alternate ones stand a step back.
function lineMetrics(){const line=$('#shop-line'),w=line.clientWidth,h=line.clientHeight,cap=session.level.capacity,tall=h>260;
 const size=Math.min(h*(tall?.58:.64),tall?170:118,(w*.74)/((cap-1)*.56+1));return {front:w*.22+size*.5,gap:size*.56,size};}
function lineSpot(i){const m=lineMetrics();return m.front+i*m.gap;}
function layoutLine(){const m=lineMetrics();$('.shop-floor').style.setProperty('--size',`${m.size}px`);session.queue.forEach((o,i)=>{const el=people.get(o.id);if(!el||el.classList.contains('leaving'))return;el.style.setProperty('--x',`${m.front+i*m.gap}px`);el.style.setProperty('--depth',i);el.style.setProperty('--lift',i%2?'9%':'0%');el.style.zIndex=20-i;if(o.bubble)for(const [k,v] of [['--x',`${m.front+i*m.gap}px`],['--depth',i],['--lift',i%2?'9%':'0%']])o.bubble.style.setProperty(k,v);});}
function makePerson(o,cls){const el=document.createElement('div');el.className=`shop-person ${cls}`;el.style.setProperty('--tint',regionColors[o.region]);el.style.setProperty('--x',`${$('#shop-line').clientWidth+40}px`);el.style.setProperty('--idle',`-${o.id%5*.6}s`);el.innerHTML=`<span class="person-say"></span>${residentPortrait(o)}<span class="person-name">${o.name}</span>`;$('#shop-line').append(el);return el;}
// Keep the order's own id: the guide character carries an id of its own.
function dress(o){if(o.name)return;const {id,...person}=customerFor(session.stage,o.id);Object.assign(o,person);}
function arrive(o){
 dress(o);o.lead=Math.max(1,secondsLeft(o));
 const p=makePerson(o,'walking');p.dataset.order=o.id;people.set(o.id,p);
 // Customers say it their own way; the ticket below always reads the same plain way.
 // What each customer says floats in its own layer above the line, newest on top, and follows them into place.
 const bubble=document.createElement('span');bubble.className='order-bubble';bubble.style.setProperty('--tint',regionColors[o.region]);bubble.style.setProperty('--x',p.style.getPropertyValue('--x'));
 bubble.textContent=o.kind==='relative'?`${o.label}に届けて！`:`${o.label}にお願い！`;$('#shop-says').append(bubble);o.bubble=bubble;
 setTimeout(()=>{bubble.remove();if(o.bubble===bubble)o.bubble=null;},2400);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{layoutLine();setTimeout(()=>p.classList.remove('walking'),650);}));
 const t=document.createElement('button');t.className='day-ticket entering';t.dataset.order=o.id;t.style.setProperty('--tint',regionColors[o.region]);
 t.innerHTML=`<strong class="ticket-time">${o.card}</strong><span class="ticket-sub">${residentFace(o)}<small class="ticket-left"></small></span><i class="ticket-timer" aria-hidden="true"></i>`;
 t.setAttribute('aria-label',`${o.name}の注文 ${o.card}`);
 t.onclick=()=>pickTarget(o.target);t.addEventListener('animationend',()=>t.classList.remove('entering'),{once:true});
 $('#tickets').append(t);tickets.set(o.id,t);playSound('collect');renderScore();
}
function walkOut(o,how,delay=0){
 const p=people.get(o.id),t=tickets.get(o.id);people.delete(o.id);tickets.delete(o.id);
 setTimeout(()=>{
  if(how==='served'){p?.classList.add('served');t?.classList.add('served');o.bubble?.remove();o.bubble=null;if(p)p.querySelector('.person-say').textContent=['ありがとう！','助かった！','また来るね！','やったー！','お願いね！'][o.id%5];
   setTimeout(()=>{if(p){p.classList.add('leaving');p.style.setProperty('--x','4%');}},reduceMotion()?0:420);}
  else{p?.classList.add('sad');t?.classList.add('missed');o.bubble?.remove();o.bubble=null;if(p)p.querySelector('.person-say').textContent='間に合わなかった…';
   setTimeout(()=>{if(p){p.classList.add('leaving');p.style.setProperty('--x',`${$('#shop-line').clientWidth+60}px`);}},reduceMotion()?0:500);}
  setTimeout(()=>{p?.remove();t?.remove();},reduceMotion()?500:1200);
 },delay);
}
function handleEvent(e){
 if(e.type==='arrive')arrive(e.order);
 else if(e.type==='missed'){dress(e.order);walkOut(e.order,'missed');playSound('discard');toast(`${e.order.name}の便が出てしまった…（${e.order.card}）`);renderScore();setTimeout(layoutLine,900);}
 else if(e.type==='gaveUp'){dress(e.order);const p=makePerson(e.order,'angry');p.querySelector('.person-say').textContent='いっぱいだ…';playSound('wrong');toast(`列がいっぱいで、${e.order.name}が帰ってしまった。`);renderScore();setTimeout(()=>{p.classList.add('leaving');},900);setTimeout(()=>p.remove(),1600);}
 else if(e.type==='closed'){renderScore();toast(session.level.endless?'お客さんが帰りすぎて、今日は店じまい。':'閉店の時間！ 今日の営業おしまい。');playSound('chapter');closingTimer=setTimeout(()=>{closingTimer=null;finish();},reduceMotion()?600:1500);}
}
function dayLoop(t){
 dayFrame=requestAnimationFrame(dayLoop);
 const seconds=Math.min(.25,Math.max(0,(t-lastTick)/1000));lastTick=t;
 if(paused||document.hidden||!session||session.status!=='playing')return;
 for(const e of routeTick(session,seconds))handleEvent(e);
 if(!session.windingShown&&session.status==='playing'&&winding(session)){session.windingShown=true;toast('今日のお客さんはここまで。閉店まで時計を進めるよ。');}
 // "Now" pushes the hands forward when it catches up with them.
 if(drag)freeHand=Math.max(freeHand,session.now);else if(hand<nextMinute())hand=nextMinute();
 if(hold){const span=Math.min(60,Math.max(0,Math.floor((t-hold.t0-TAP_MS)/1000*SWEEP_PER_SECOND)));if(Math.floor(span/5)!==Math.floor(hold.span/5))playSound(span>=60?'dial-hour':'dial-minute');hold.span=span;}
 renderDay();
}
function moveHand(minutes){if(paused||session.status!=='playing')return;const before=hand;hand=snapHand(hand+minutes);if(hand!==before)playSound(Math.floor(hand/60)!==Math.floor(before/60)?'dial-hour':'dial-minute');renderDay();}
function bindDayDial(){
 const clock=$('#clock'),angle=e=>{const b=clock.getBoundingClientRect();return mod(Math.atan2(e.clientX-b.left-b.width/2,-(e.clientY-b.top-b.height/2))*180/Math.PI,360);};
 clock.addEventListener('pointerdown',e=>{
  if(paused||drag||session.status!=='playing')return;
  const pin=e.target.closest('.day-pin');if(pin){pickTarget(Number(pin.dataset.target));return;}
  e.preventDefault();freeHand=hand;drag={pointer:e.pointerId,last:angle(e),detents:new DialDetents('minute',hand)};clock.setPointerCapture(e.pointerId);clock.classList.add('dragging');
 });
 // Only the long hand is turned. The short hand follows, one hour per lap.
 clock.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer||paused)return;e.preventDefault();
  const next=angle(e),before=aimed();freeHand=Math.min(session.level.close,Math.max(session.now,freeHand+angleDelta(drag.last,next)/6));drag.last=next;
  const after=aimed(),mark=drag.detents.move(freeHand);
  if(Math.floor(after/60)!==Math.floor(before/60))playSound('dial-hour');else if(mark!==null)playSound('dial-minute');
  renderDay();
 });
 const end=e=>{if(!drag||e.pointerId!==drag.pointer)return;hand=aimed();freeHand=null;drag=null;clock.classList.remove('dragging');renderDay();};
 clock.addEventListener('pointerup',end);clock.addEventListener('pointercancel',end);clock.addEventListener('lostpointercapture',end);
 app.querySelectorAll('[data-hand]').forEach(h=>h.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp'].includes(e.key)){e.preventDefault();moveHand((['ArrowLeft','ArrowDown'].includes(e.key)?-1:1)*(h.dataset.hand==='hour'?60:session.level.step));}}));
}
// Press and hold the seal: a wedge grows from the long hand into the future. Release to send that flight.
// A quick tap sends a one-minute flight for the minute under the hand. Keyboard activation is a tap.
function bindSeal(){
 const seal=$('#seal-button');
 seal.addEventListener('pointerdown',e=>{
  if(paused||hold||!session||session.status!=='playing')return;e.preventDefault();
  if(drag){hand=aimed();freeHand=null;drag=null;$('#clock').classList.remove('dragging');}
  if(routeBusy(session)>0){toast(`飛行機がもどるまで あと${Math.ceil(routeBusy(session))}分。`);return;}
  seal.setPointerCapture(e.pointerId);hold={pointer:e.pointerId,start:aimed(),t0:performance.now(),span:0};renderDay();
 });
 const release=e=>{if(!hold||e.pointerId!==hold.pointer)return;const {start,span}=hold;hold=null;dispatch(start,span);};
 seal.addEventListener('pointerup',release);seal.addEventListener('lostpointercapture',release);
 seal.addEventListener('pointercancel',e=>{if(hold&&e.pointerId===hold.pointer){hold=null;renderDay();}});
 seal.addEventListener('click',e=>{if(e.detail===0)dispatch(aimed(),0);});
}
function dispatch(from,span=0){
 if(paused||!session||session.status!=='playing')return;
 const r=routeStamp(session,from,span);
 if(!r){if(routeBusy(session)>0)toast(`飛行機がもどるまで あと${Math.ceil(routeBusy(session))}分。`);renderDay();return;}
 const range=r.span?`${cardText(from)}〜${cardText(from+r.span)}の${r.span}分便`:`${cardText(from)}の便`;
 if(!r.served.length){playSound('wrong');toast(`${range}には注文がなかった…`);$('#clock').animate?.([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:260});renderScore();renderDay();return;}
 const n=r.served.length;
 playSound('imprint');if(n>=3||session.combo%5===0)playSound('success');
 r.served.forEach((o,i)=>{walkOut(o,'served',i*110);setTimeout(()=>soundtrack.play('merge',Math.min(2,1+i*.125)),i*110);});
 if(!reduceMotion()){
  document.body.classList.remove('stamping');void document.body.offsetWidth;prepareSpell();document.body.classList.add('stamping');clearTimeout(stampImpactTimer);stampImpactTimer=setTimeout(()=>document.body.classList.remove('stamping'),900);
  const burst=document.createElement('div');burst.className=`day-burst${n>=3?' big':''}`;
  burst.innerHTML=`<strong>${n>1?`${n}人まとめて！`:'お届け！'}</strong><span>${session.combo>1?`${session.combo} COMBO · `:''}+${r.points}</span><div class="rush-parcels">${r.served.slice(0,6).map((o,i)=>`<span class="rush-parcel" style="--parcel:${i}">${parcelSeal(o.target)}</span>`).join('')}</div>`;
  const layer=$('.day-effects');if(layer.children.length>=3)layer.firstChild.remove();layer.append(burst);burst.addEventListener('animationend',e=>{if(e.target===burst)burst.remove();});
 }
 toast(`${range}で${n>1?`${n}人まとめて`:''}届けたよ！${r.span?` 飛行機は${r.span}分後にもどるよ。`:''}`);
 if(r.served.some(o=>o.target===picked))picked=null;
 renderScore();const counter=$('#delivered');counter.classList.remove('bump');void counter.offsetWidth;counter.classList.add('bump');
 setTimeout(()=>{if(screen==='play')layoutLine();},n*110+700);renderDay();
}
function pauseGame(){if(!session||session.status!=='playing'||paused)return;paused=true;hold=null;if(drag){hand=aimed();freeHand=null;drag=null;}openModal(`<p class="eyebrow">MIRACLE CLOCK</p><h2>ひとやすみ</h2><p>時計も、お客さんの行列も止まっています。</p><button class="primary" id="resume">つづける</button><button class="secondary sound" aria-pressed="${soundOn}">音 ${soundOn?'ON':'OFF'}</button><button class="secondary quit-button" id="quit" aria-label="配送所えらびにもどる">配送所へ</button>`,false);$('.modal').classList.add('pause-modal');$('#resume').onclick=()=>{closeModal();paused=false;lastTick=performance.now();};$('#quit').onclick=()=>session.stage.endless?finish():renderMap();bindSound();}
function finish(){
 cancelAnimationFrame(dayFrame);clearTimeout(closingTimer);closingTimer=null;paused=false;
 const l=session.stage,record=records.slots[activeSlot],stars=l.endless?0:routeStars(session),won=l.endless||stars>0;session.status='closed';
 if(l.endless){record.endless.best=Math.max(record.endless.best,session.delivered);record.endless.total+=session.delivered;record.updated=Date.now();persistRecords();}
 else if(won){const id=l.stageId;session.rating={stars,time:Math.round(session.activeTime*10)/10,mistakes:session.missed+session.gaveUp};record.stars[id]=betterRecord(record.stars[id],session.rating);if(!record.stages.includes(id))record.stages.push(id);if(stages.filter(t=>t.id===l.id).every(t=>record.stages.includes(t.stageId))&&!record.cleared.includes(l.id))record.cleared.push(l.id);record.updated=Date.now();persistRecords();syncProgress();}
 else playSound('wrong');
 showResult(won,stars);
}
function showChapterCompletion(level,onDone){
 // Replays and retries still reach the chapter reward after accepting the result.
 const story=depotStory(level,true);
 story.lines.push({who:story.partner,text:depotThemes[level.id].thanks});
 showDialogue(story,()=>showDepotReward(level.id,onDone));
}
function showResult(won,stars){
 const l=session.stage,s=session,n=visitors(s),share=n?Math.round(s.delivered/n*100):0,record=records.slots[activeSlot];if(won)playSound('win');
 openModal(`<div class="result-character">${won?'<img class="victory-luca" src="assets/luka-victory.webp" width="130" height="130" alt="笑顔でガッツポーズするルカ">':toto()}</div><p class="save-warning" role="status">${saveNotice}</p><p class="eyebrow">${l.endless?'CENTRAL AIR POST':won?'SHOP CLOSED':'TAKE A LITTLE BREAK'}</p><h2>${l.endless?'おつかれさま、中央便！':stars===3?'大繁盛の一日！':stars===2?'いい一日だったね！':won?'今日の営業おしまい！':'今日は、ここでひとやすみ。'}</h2><p class="day-result-main">お届け <b>${s.delivered}</b>人 / 来店 ${n}人</p><p class="day-result-lost">乗り遅れ ${s.missed}人 · 帰ってしまった ${s.gaveUp}人</p><p class="rush-result">最大 ${s.maxCombo} COMBO · 最大 ${s.maxBatch}人まとめて · ${s.points}点</p>${l.endless?`<p>最高 ${record.endless.best}人 · 累計 ${record.endless.total}人</p>`:`<div class="star-result" data-stars="${stars}"><strong aria-label="${stars}つ星">${starText(stars)}</strong><p>${share}%のお客さんに届けたよ${s.slow?'（ゆっくりモード）':''}</p><small>★ 5割 · ★★ 7割 · ★★★ 9割${record.stars[l.stageId]?`<br>最高評価 ${starText(record.stars[l.stageId].stars)}`:''}</small></div>`}${won?'':'<p>半分のお客さんに届けたらクリア。ゆっくりモードなら、時間の流れがおだやかになるよ。</p>'}<button class="primary" id="result-main">${won&&!l.endless?(l.number===6?'章クリアへ ▸':'次の便へ'):'もう一度'}</button>${!won?'<button class="secondary" id="retry-slow">ゆっくりモードで挑戦</button>':''}<button class="secondary" id="result-map">配送所えらびにもどる</button>${won&&!l.endless?'<button class="secondary" id="retry-stage">星をふやしに、もう一度</button>':''}`,false);
 if(won){$('.result-modal').classList.add('victory-result');$('.result-modal').insertAdjacentHTML('afterbegin',victoryEffects());}
 const leaveResult=onDone=>{closeModal();if(won&&!l.endless&&l.number===6)showChapterCompletion(l,onDone);else onDone();};
 $('#result-main').onclick=()=>{if(won&&!l.endless)leaveResult(()=>{renderMap();if(l.stageId<35)chooseLevel(stages[l.stageId+1]);else renderPreparations();});else startLevel(l,s.slow);};
 $('#retry-slow')?.addEventListener('click',()=>startLevel(l,true));$('#result-map').onclick=()=>leaveResult(renderMap);$('#retry-stage')?.addEventListener('click',()=>startLevel(l,s.slow));
}
// ---------- The depot puzzle (all 36 stages): send a parcel by setting the hands, then read the time on the reply. ----------
// No clock runs here. Each stage is three short stories told in six steps; the endless central post keeps the day clock.
// The screen reuses the day clock's parts: the depot counter, residents, order tickets, the magic clock and its seal.
const POST_ART=[0,1,2,3,4,6];
const POST_ASKS=['{t}に とどけてね！','{t}に おねがい！','{t}に まにあうかな？','{t}の便に のせてね'];
let post=null;
const postPerson=(c,v)=>({region:c,variant:v,name:v<0?customers[c].name:residents[c][v]});
const postPlace=c=>customers[c].destination;
const postTime=(h,m,p,half,cfg=post.cfg)=>{const {hour,minute}=postParts(h,m,p,half,cfg);return `<span class="t-h">${hour}</span>${minute?`<span class="t-m">${minute}</span>`:''}`;};
const postPlain=s=>s.replace(/<[^>]+>/g,'');
const postAt=(deg,r)=>[150+Math.sin(deg*Math.PI/180)*r,150-Math.cos(deg*Math.PI/180)*r].map(n=>Math.round(n*100)/100);
const postWedge=(a0,a1,r)=>{const [x0,y0]=postAt(a0,r),[x1,y1]=postAt(a1,r);return `M150 150L${x0} ${y0}A${r} ${r} 0 ${a1-a0>180?1:0} 1 ${x1} ${y1}Z`;};
function postDetails(level){
 openModal(`<p class="eyebrow">${stageHeading(level)}</p><h2>${level.stageTitle}</h2><p class="start-goal">3人のお客さん · 荷物を送って、おへんじを読もう</p><p class="start-tip">荷札の時刻に針を合わせて、時計の真ん中の刻印をおすと、飛行機が飛んでいくよ。帰ってきた便は、おへんじの時刻を時計で読もう。</p><p class="start-rule">時間せいげんはないよ。短い針は「時」、長い針は「分」。</p><p class="start-stars">★★★ まちがい・ヒントなし · ★★ 2回まで</p><button class="primary" id="open-shop">受付をはじめる</button>`);
 $('.modal').classList.add('start-modal');$('#open-shop').onclick=()=>{closeModal();startPost(level);};
}
// The magic clock from the day screen, plus twelve gem "rooms" for the short hand, 時/分 tokens on the hands,
// a window for 午前/午後, dashed helper hands and a golden band for "in N minutes".
function postClockMarkup(){
 const rooms=Array.from({length:12},(_,n)=>`<path class="post-room" data-room="${n}" d="${postWedge(n*30,n*30+30,86)}" style="--gem:${elements[n].color}"/>`).join('');
 const plate=`<g id="post-plate" class="post-plate"><rect x="120" y="196" width="60" height="22" rx="7"/><text id="post-plate-text" x="150" y="207.5">午前</text></g>`;
 const target=`<g id="post-target" class="post-target"><line id="post-target-h" x1="150" y1="150" x2="150" y2="92"/><line id="post-target-m" x1="150" y1="150" x2="150" y2="66"/></g>`;
 return dayClockMarkup()
  .replace('<circle class="dial-ring"',`<g class="post-rooms">${rooms}</g><circle class="dial-ring"`)
  .replace('<g id="hour-hand"',plate+target+'<g id="hour-hand"')
  .replace('</g><g id="minute-hand"','<g class="post-token hour-token"><circle cx="150" cy="112" r="8.5"/><text x="150" y="112.5">時</text></g></g><g id="minute-hand"')
  .replace('</g><circle class="pivot-outer"','<g class="post-token minute-token"><circle cx="150" cy="80" r="7.5"/><text x="150" y="80.5">分</text></g></g><circle class="pivot-outer"');
}
function startPost(level){
 cleanup();screen='post';soundtrack.setScene(gameMusicScene('story',level.id));playSound('intro');document.body.dataset.depot=level.id;session=null;
 const c=level.id,{cfg,intro}=postStages[level.stageId],record=records.slots[activeSlot],owned=new Set(record.gifts||[]);
 // Senders are this depot's guide and residents; stories with gifts not yet on the shelf come first.
 const senders=[-1,0,1,2].sort(()=>Math.random()-.5).map(v=>postPerson(c,v)),all=postStories[c].map(([item,what,to,reply,gift,giftName])=>({item,what,to,reply,gift,giftName}));
 const fresh=all.filter(x=>!owned.has(x.gift)).sort(()=>Math.random()-.5),seen=all.filter(x=>owned.has(x.gift)).sort(()=>Math.random()-.5);
 post={level,cfg,intro,qi:0,q:null,t:0,pm:false,mistakes:0,hints:0,tries:0,answered:false,helped:false,leaving:false,results:[],gifts:[],drag:null,ghost:null,started:performance.now(),tales:[...fresh,...seen].slice(0,3).map((x,k)=>({...x,who:senders[k]}))};
 app.innerHTML=`<main class="day-game post-mode scene" style="--depot-image:url(assets/depots/${POST_ART[c]}.webp)"><header class="topbar day-top"><button class="subtle" id="pause" aria-label="一時停止">Ⅱ おやすみ</button><div class="stage-heading"><span class="eyebrow">${stageHeading(level)}</span><strong>${level.stageTitle}</strong></div><div class="day-score"><span class="score">お届け <b id="delivered">0</b>/3</span><span class="post-gifts" id="post-gifts" aria-label="もらったおかえし"></span></div></header>
<section class="shop-floor post-floor" aria-label="配送所の受付"><svg class="shop-backdrop" viewBox="${c%2*627} ${Math.floor(c/2)*313.5} 627 313.5" preserveAspectRatio="xMinYMax slice" aria-hidden="true"><image href="assets/queue-places.webp" width="1254" height="1254"/></svg><img class="post-toto" src="assets/sky-toto.webp" alt="トトじい"><div class="shop-person post-customer" id="post-customer"></div><span class="order-bubble post-bubble" id="post-bubble"></span><img class="post-plane" id="post-plane" src="assets/delivery-plane.webp" alt=""></section>
<div class="post-talk"><img class="toto" src="assets/sky-toto.webp" alt=""><p id="post-say" aria-live="polite"></p></div>
<section class="ticket-rail post-rail" id="post-rail" aria-label="荷札とおへんじ"></section>
<section class="day-station"><div class="clock-bay"><div class="clock-housing">${postClockMarkup()}<button class="seal-button" id="seal-button" aria-label="時計の中心で刻印をおす"><svg class="seal-engraving" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="38"/><path d="M50 8l3 6-3 6-3-6zM50 80l3 6-3 6-3-6zM8 50l6-3 6 3-6 3zM80 50l6-3 6 3-6 3zM29 26q21-13 42 0M29 74q21 13 42 0"/></svg><span>刻印</span><small id="seal-sub">おす</small></button><span class="seal-ripple" aria-hidden="true"></span>${spellMarkup()}</div></div><div class="clock-tools post-tools"><button class="text-button" id="post-hint" type="button">トトじいに聞く</button></div></section>
<div class="day-effects" aria-hidden="true"></div><div class="post-sheet" id="post-sheet" hidden><div class="post-card parchment" id="post-card"></div></div></main>`;
 $('#pause').onclick=postPause;$('#post-hint').onclick=postHint;$('#seal-button').onclick=postSubmit;
 postBindDial();postAsk(true);window.scrollTo(0,0);
}
const postShowHour=()=>post.cfg.mode!=='min',postShowMin=()=>post.cfg.mode!=='room';
const postElapsed=()=>post.q?.mode==='rel'?postMs(post.t-post.q.now):0;
function postDraw(){
 const {t,cfg,q}=post,room=Math.floor(postMs(t)/60),H=postShowHour(),M=postShowMin(),clock=$('#clock');if(!clock)return;
 $('#hour-hand').setAttribute('transform',`rotate(${postMs(t)/2} 150 150)`);$('#minute-hand').setAttribute('transform',`rotate(${postMinOf(t)*6} 150 150)`);
 clock.classList.toggle('no-hour',!H);clock.classList.toggle('no-minute',!M);clock.classList.toggle('show-guide',M);clock.classList.toggle('no-rooms',!H);
 clock.querySelectorAll('.post-room').forEach(r=>r.classList.toggle('on',H&&Number(r.dataset.room)===room));
 app.querySelectorAll('.element-gem').forEach(g=>g.classList.toggle('resonating',H&&Number(g.dataset.element)===room));
 clock.querySelectorAll('.minute-number').forEach((n,i)=>n.classList.toggle('on',M&&(i+1)%12*5===postMinOf(t)));
 // The helper hands where Toto points; the 午前/午後 window; "now" and the band the long hand has swept.
 $('#post-target').classList.toggle('show',post.ghost!==null);
 if(post.ghost!==null){$('#post-target-h').setAttribute('transform',`rotate(${postMs(post.ghost)/2} 150 150)`);$('#post-target-m').setAttribute('transform',`rotate(${postMinOf(post.ghost)*6} 150 150)`);}
 $('#post-plate').classList.toggle('show',!!cfg.period);$('#post-plate-text').textContent=post.pm?'🌙 午後':'☀️ 午前';
 const rel=q?.mode==='rel',e=postElapsed();
 $('#ghost-hands').classList.toggle('show',rel);$('#sweep').classList.toggle('show',rel&&e>0);
 if(rel){$('#ghost-hour').setAttribute('transform',`rotate(${postMs(q.now)/2} 150 150)`);$('#ghost-minute').setAttribute('transform',`rotate(${postMinOf(q.now)*6} 150 150)`);
  if(e){const a0=postMinOf(q.now)*6;$('#sweep').setAttribute('d',e>=60?`M150 55A95 95 0 1 1 149.99 55Z`:postWedge(a0,a0+e*6,95));}}
 $('#hour-hand').setAttribute('aria-valuenow',postHourOf(t));$('#minute-hand').setAttribute('aria-valuenow',postMinOf(t));$('#minute-hand').setAttribute('aria-valuetext',`${postHourOf(t)}時${postMinOf(t)}分`);
 const seal=$('#seal-button');seal.disabled=!q||q.read||post.answered;seal.classList.toggle('away',!!q?.read);$('#seal-sub').textContent=q?.read?'よむ':'おす';
}
// Drag the hand you grab. Either hand can be taken by its own line; otherwise near the centre is the short hand.
function postBindDial(){
 const clock=$('#clock');
 const at=e=>{const b=clock.getBoundingClientRect(),x=(e.clientX-b.left)/b.width*300-150,y=(e.clientY-b.top)/b.height*300-150;return {a:(Math.atan2(x,-y)*180/Math.PI+360)%360,r:Math.hypot(x,y)};};
 const near=(a,b)=>Math.min(Math.abs(a-b),360-Math.abs(a-b));
 clock.addEventListener('pointerdown',e=>{if(!post?.q||post.q.read||post.answered||!$('#post-sheet').hidden)return;const {a,r}=at(e);if(r>100)return;
  let hand=post.cfg.drag;if(hand==='both'){const dh=near(a,postMs(post.t)/2),dm=near(a,postMinOf(post.t)*6);hand=dh<22&&dh<=dm?'hour':dm<22?'minute':r<58?'hour':'minute';}
  e.preventDefault();post.drag={hand,last:a};clock.setPointerCapture?.(e.pointerId);clock.classList.add('dragging');app.querySelector(`#${hand}-hand`)?.classList.add('held');postMove(a);});
 clock.addEventListener('pointermove',e=>{if(post?.drag)postMove(at(e).a);});
 const end=()=>{if(!post?.drag)return;post.drag=null;clock.classList.remove('dragging');app.querySelectorAll('.held').forEach(h=>h.classList.remove('held'));const step=post.cfg.step||60;if(post.cfg.drag!=='hour'||post.cfg.exact)post.t=postMs(Math.round(post.t/step)*step);postDraw();};
 clock.addEventListener('pointerup',end);clock.addEventListener('pointercancel',end);
}
function postMove(a){
 const before=post.t,cfg=post.cfg;
 if(post.drag.hand==='hour'){
  if(cfg.exact)post.t=Math.floor(a/30)*60;              // snaps into a room at "ちょうど"
  else if(cfg.mode==='room')post.t=a*2;                  // the short hand alone glides freely
  else post.t=Math.floor(a/30)*60+postMinOf(post.t);     // keep the minutes, change the room
 }else{let d=a-post.drag.last;if(d>180)d-=360;if(d<-180)d+=360;post.t=postMs(post.t+d/6);}  // the long hand pulls the short hand along
 post.drag.last=a;
 if(Math.floor(postMs(before)/60)!==Math.floor(postMs(post.t)/60))playSound('dial-hour');else if(Math.round(before/5)!==Math.round(post.t/5)&&post.drag.hand==='minute')playSound('dial-minute');
 postDraw();
}
function postTag(q){
 if(q.mode==='min')return `<span class="t-m">${q.m}分</span>`;
 if(q.mode==='room')return `<span class="t-h">${q.h}時</span><small>ごろ</small>`;
 if(q.mode==='rel')return `<small>いまから</small><span class="t-m">${postDuration(q.d)}後</span>`;
 return postTime(q.h,q.m,q.p,q.half);
}
// The customer at the counter, drawn with the same sprites and speech bubbles as the day screen.
function postStand(who,line,mood=''){
 const p=$('#post-customer');p.className=`shop-person post-customer ${mood}`;p.innerHTML=residentPortrait(who);void p.offsetWidth;p.classList.add('arrived');
 const b=$('#post-bubble');b.textContent=line;b.style.setProperty('--tint',regionColors[who.region]);b.classList.toggle('show',!!line);
}
function postAsk(first=false){
 const read=post.qi%2===1,q=postQuestion(post.cfg,read),tale=post.tales[Math.floor(post.qi/2)],who=tale.who,to=customers[tale.to];
 Object.assign(post,{q,tries:0,answered:false,helped:false,leaving:false,ghost:null});q.tale=tale;$('#post-sheet').hidden=true;
 const rail=$('#post-rail');rail.className=`ticket-rail post-rail ${read?'reading':'sending'}`;
 if(read){
  post.t=q.t;if(post.cfg.period)post.pm=q.p;
  postStand(who,q.mode==='rel'?'何分 とんでいたのかな？':`${to.name}から おへんじ！`);
  // Three envelopes, each postmarked with a time: only the dial tells which one the reply was written at.
  rail.innerHTML=q.options.map(o=>{const html=q.mode==='room'?`<span class="t-h">${o.h}時</span><small>ごろ</small>`:q.mode==='min'?`<span class="t-m">${o.m?o.m+'分':'ちょうど'}</span>`:q.mode==='rel'?`<span class="t-m">${postDuration(o.d)}</span>`:postTime(o.h,o.m,o.p,q.half);const n=postPlain(html).length;
   return `<button class="day-ticket post-envelope" data-key="${o.key}" type="button"${q.mode==='room'?` style="--tint:${elements[o.h%12].color}"`:''}><span class="post-postmark" aria-hidden="true"></span><strong class="ticket-time ${n>6?'long':n>4?'mid':''}">${html}</strong></button>`;}).join('');
  rail.querySelectorAll('.post-envelope').forEach(b=>b.onclick=()=>postChoose(b));
  postFly('arriving');
  $('#post-say').innerHTML=q.mode==='rel'?'点線の針が 出発、ふつうの針が 帰ってきた時刻じゃ。分の針は どれだけ進んだかのう？':`${postPlace(tale.to)}の${to.name}が、おへんじを書いた時刻を 時計に刻んでくれたぞ。${q.mode==='min'?'<b class="m">分の針</b>がさす外の数字は？':q.mode==='room'?'<b class="h">時の針</b>は、どの宝石のへやかのう？':post.cfg.period?'針と、午前・午後の窓を よく見るんじゃ。':'時の針のへや、分の針の数字、じゅんばんに読もう。'}`;
  
 }else{
  post.t=q.start;if(post.cfg.period)post.pm=post.cfg.only!==undefined?!!post.cfg.only:Math.random()<.5;
  const when=postPlain(postTag(q)),line=q.mode==='rel'?`${postDuration(q.d)}後に とどけてね！`:POST_ASKS[Math.floor(Math.random()*POST_ASKS.length)].replace('{t}',when);
  postStand(who,line);
  rail.innerHTML=`<div class="day-ticket post-order" style="--tint:${regionColors[who.region]}"><span class="post-order-face">${residentFace(who)}</span><span class="post-order-body"><strong class="ticket-time">${postTag(q)}</strong><small>${tale.item} ${tale.what} → ${postPlace(tale.to)}の${to.name}へ${q.mode==='rel'?` · いま ${postHourOf(q.now)}時${postMinOf(q.now)?postMinOf(q.now)+'分':''}`:''}</small></span></div>${post.cfg.period?'<div class="period-toggle post-ampm" role="group" aria-label="午前か午後"><button type="button" data-pm="0">☀️ 午前</button><button type="button" data-pm="1">🌙 午後</button></div>':''}`;
  rail.querySelectorAll('.post-ampm button').forEach(b=>b.onclick=()=>{post.pm=b.dataset.pm==='1';postPick();postDraw();});postPick();
  $('#post-plane').className='post-plane';
  $('#post-say').innerHTML=first?post.intro:q.mode==='min'?'<b class="m">分の針</b>を、荷札の数字に合わせるんじゃ。':q.mode==='room'?`<b class="h">時の針</b>を <b class="h">${q.h}のへや</b> に入れておくれ。`:q.mode==='rel'?'点線の針が いまの時刻。そこから分の針を すすめるんじゃ。':post.cfg.period?'針を合わせたら、午前か午後かも えらぶんじゃ。':'針を荷札の時刻に合わせたら、真ん中の刻印じゃ！';
  
 }
 postScore();postDraw();
}
function postPick(){app.querySelectorAll('.post-ampm button').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.pm==='1')===post.pm)));}
function postScore(){$('#delivered').textContent=Math.floor((post.qi+(post.answered?1:0))/2);$('#post-gifts').textContent=post.gifts.join('');}
function postFly(kind){const p=$('#post-plane');if(!p)return;p.className='post-plane';void p.offsetWidth;p.classList.add(kind);}
// After a right answer Toto just names the time in the story; explanations are kept for mistakes.
function postNamed(){
 const {t,q,cfg,pm}=post,h=postHourOf(t),m=postMinOf(t);
 if(q.mode==='rel')return `<span class="t-m">${postDuration(q.d)}</span>`;
 if(cfg.mode==='min')return `<span class="t-m">${m?m+'分':'ちょうど'}</span>`;
 if(cfg.mode==='room')return `<span class="t-h">${h}時</span>`;
 return postTime(h,m,pm,q.half);
}
function postSheet(title,body,go,kind='',letter=''){
 $('#post-card').innerHTML=`${letter}<img class="toto post-card-toto" src="assets/sky-toto.webp" alt="トトじい"><div class="post-card-body"><p class="eyebrow">トトじい</p><h2 class="${kind}">${title}</h2><div class="post-steps">${body}</div></div><button class="${kind==='ok'?'primary':'secondary'}" id="post-go" type="button">${go}</button>`;
 $('#post-sheet').hidden=false;$('#post-go').focus({preventScroll:true});
}
function postSubmit(){
 if(!post?.q||post.q.read||post.answered||!$('#post-sheet').hidden)return;const q=post.q;post.tries++;
 if(postCorrect(q,post.t,post.pm,post.cfg)){postDone();return;}
 post.mistakes++;playSound('wrong');$('#clock').animate?.([{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'none'}],{duration:260});
 let why;
 if(q.mode==='rel'){const e=postElapsed();why=`いまは <b class="m">${e?postDuration(e):'0分'}</b> すすんだところじゃ。<b class="m">${postDuration(q.d)}</b> すすめておくれ。${q.d>=60?'1時間は 分の針<b>ひとまわり</b>じゃ。':''}`;}
 else{const t=post.t,wrongHour=postShowHour()&&q.h!==null&&postHourOf(t)!==q.h,wrongMin=postShowMin()&&q.m!==null&&postMinOf(t)!==q.m,wrongPm=post.cfg.period&&post.pm!==q.p;
  why=[wrongHour?`時の針は いま <b class="h">${postHourOf(t)}のへや</b> におるぞ。<b class="h">${q.h}のへや</b>に入れておくれ。`:'',wrongMin?`分の針は いま <b class="m">${postMinOf(t)}分</b> じゃ。<b class="m">${q.m}分</b>の場所を さがそう。`:'',wrongPm?`針は ぴったり！ でも荷札は <b>${q.p?'午後':'午前'}</b>じゃよ。${post.cfg.period==='24'&&q.p?`${q.h%12+12}時は 午後${q.h===12?0:q.h}時じゃ。`:''}`:''].filter(Boolean).join('<br>');}
 if(post.tries>=2){post.ghost=postTarget(q,post.t);post.helped=true;postDraw();}
 postSheet('おっと、まだ飛ばせんぞ',`<p>${why}</p>${post.tries>=2?'<p>点線の針のところに、わしが印をつけておいたぞ。</p>':''}`,'もういちど','ng');
 $('#post-go').onclick=()=>{$('#post-sheet').hidden=true;};
}
function postChoose(b){
 if(post.answered||!$('#post-sheet').hidden)return;const q=post.q;post.tries++;
 if(b.dataset.key===q.answer){b.classList.add('matching');postDone();return;}
 post.mistakes++;b.classList.add('missed');b.disabled=true;playSound('wrong');
 const [hh,,pp]=b.dataset.key.split(':');let why;
 if(q.mode==='room')why=`時の針は、宝石の <b class="h">${q.h}</b> と <b class="h">${q.h%12+1}</b> のあいだ。<b class="h">${q.h}のへや</b>の色を見てごらん。`;
 else if(q.mode==='min')why=q.m%5===0?`分の針がさす数字を見るんじゃ。宝石の <b class="m">${q.m?q.m/5:12}</b> のところは <b class="m">${q.m?q.m+'分':'ちょうど'}</b>じゃよ。`:`分の針は <b class="m">${q.m-q.m%5}</b> から 目もり<b class="m">${q.m%5}</b>つ すすんだところじゃ。`;
 else if(q.mode==='rel')why='点線の分の針から、ふつうの分の針まで 数えてごらん。数字ひとつで<b class="m">5分</b>、ひとまわりで<b class="m">1時間</b>じゃ。';
 else if(post.cfg.period&&pp!==String(q.p))why=`時計の窓を見てごらん。<b>${q.p?'午後':'午前'}</b>と書いてあるぞ。`;
 else if(Number(hh)!==q.h)why=`時の針は、まだ <b class="h">${q.h%12+1}</b> をこえておらん。<b class="h">${q.h}のへや</b>におるのう。`;
 else why=`分の針は数字で読むんじゃ。<b class="m">${q.m?(q.m%5?`${Math.floor(q.m/5)}と目もり${q.m%5}つ`:q.m/5):12}</b> のところは <b class="m">${q.m?q.m+'分':'ちょうど'}</b>。`;
 postSheet(q.mode==='rel'?'その時間じゃないみたい':'この封筒じゃないみたい',`<p>${why}</p>`,'もういちど えらぶ','ng');
 $('#post-go').onclick=()=>{$('#post-sheet').hidden=true;};
}
// The seal's spell burst and the parcel stamp from the day screen, for every right answer.
function postCelebrate(text){
 if(reduceMotion())return;
 document.body.classList.remove('stamping');void document.body.offsetWidth;prepareSpell();document.body.classList.add('stamping');clearTimeout(stampImpactTimer);stampImpactTimer=setTimeout(()=>document.body.classList.remove('stamping'),900);
 const burst=document.createElement('div');burst.className='day-burst';burst.innerHTML=`<strong>${text}</strong>`;$('.day-effects').append(burst);burst.addEventListener('animationend',e=>{if(e.target===burst)burst.remove();});
}
function postDone(){
 const q=post.q,tale=q.tale,to=customers[tale.to],last=post.qi===5,record=records.slots[activeSlot];
 post.answered=true;post.results[post.qi]=post.tries===1&&!post.helped;postDraw();
 const c=$('#delivered');c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump');
 if(q.read){
  // The letter opens: the friend's reply and a gift for the diary's treasure shelf.
  post.gifts.push(tale.gift);record.gifts=record.gifts||[];const isNew=!record.gifts.includes(tale.gift);if(isNew)record.gifts.push(tale.gift);
  playSound('win');postCelebrate(`${tale.gift} ${tale.giftName}！`);postStand(tale.who,'わあ、ありがとう！','served');
  const letter=`<div class="post-letter"><p class="eyebrow">${postPlace(tale.to)}の${to.name}より</p><p>${tale.reply}</p><strong class="post-gift"><span>${tale.gift}</span> ${tale.giftName}${isNew?' <em>NEW!</em>':''}</strong></div>`;
  postSheet(`${tale.who.name}に おへんじを わたしたぞ！`,`<p class="sum">${q.mode==='rel'?`${postNamed()} の空の旅じゃった。`:`${postNamed()}に 書いた手紙じゃ。`}</p>`,last?'今日の日誌をつける':'つぎのお客さん','ok',letter);
  
 }else{
  playSound('imprint');setTimeout(()=>playSound('send'),250);postCelebrate('いってらっしゃい！');postFly('leaving-off');
  postStand(tale.who,`${tale.item} ${postPlace(tale.to)}まで おねがい！`,'served');
  postSheet(`ぴったりじゃ！ 飛んでいけ〜`,`<p class="sum">${postNamed()}の便、${postPlace(tale.to)}へ 出発じゃ！</p>`,'おへんじを まつ ✉️','ok');
  
 }
 postScore();
 $('#post-go').onclick=()=>{if(!post.answered||post.leaving)return;post.leaving=true;$('#post-sheet').hidden=true;post.qi++;$('#post-customer').classList.add('leaving');setTimeout(()=>{if(screen!=='post')return;if(post.qi<6)postAsk();else postFinish();},q.read?300:0);};
}
function postHint(){
 if(!post?.q||post.answered||!$('#post-sheet').hidden)return;const q=post.q,cfg=post.cfg;post.hints++;post.helped=true;
 if(q.read)postSheet('どれ、わしが見てみよう',q.mode==='rel'?'<p>点線の分の針から、数字をひとつずつ数えてごらん。数字ひとつで5分じゃ。</p>':`${postShowHour()?'<p><b class="h">時の針</b>がいる宝石のへやを見るんじゃ。宝石から、つぎの宝石までがひとつのへや。</p>':''}${postShowMin()?'<p><b class="m">分の針</b>は、さしている数字を5、10、15…と読むんじゃ。</p>':''}${cfg.period?'<p>午前か午後かは、時計の<b>窓</b>に書いてあるぞ。</p>':''}`,'わかった！');
 else{post.ghost=postTarget(q,post.t);postDraw();postSheet('どれ、わしが印をつけよう',`<p>点線の針のところに合わせてごらん。${cfg.period?`窓は <b>${q.p?'午後':'午前'}</b>じゃ。`:''}</p>`,'わかった！');}
 $('#post-go').onclick=()=>{$('#post-sheet').hidden=true;};
}
function postPause(){
 openModal(`<p class="eyebrow">MIRACLE CLOCK</p><h2>ひとやすみ</h2><p>お客さんは急がないよ。ゆっくりもどってきてね。</p><button class="primary" id="resume">つづける</button><button class="secondary sound" aria-pressed="${soundOn}">音 ${soundOn?'ON':'OFF'}</button><button class="secondary quit-button" id="quit" aria-label="配送所えらびにもどる">配送所へ</button>`,false);
 $('.modal').classList.add('pause-modal');$('#resume').onclick=closeModal;$('#quit').onclick=renderMap;bindSound();
}
function postFinish(){
 const l=post.level,record=records.slots[activeSlot],id=l.stageId,stars=postStars(post.mistakes,post.hints);
 const rating={stars,time:Math.round((performance.now()-post.started)/100)/10,mistakes:post.mistakes+post.hints};
 const previous=record.stars[id];record.stars[id]=betterRecord(previous,rating);if(!record.stages.includes(id))record.stages.push(id);
 if(stages.filter(t=>t.id===l.id).every(t=>record.stages.includes(t.stageId))&&!record.cleared.includes(l.id))record.cleared.push(l.id);
 record.updated=Date.now();persistRecords();syncProgress();playSound('win');
 const alone=post.results.filter(Boolean).length,shelf=(record.gifts||[]).length;
 openModal(`<div class="result-character"><img class="victory-luca" src="assets/luka-victory.webp" width="130" height="130" alt="笑顔でガッツポーズするルカ"></div><p class="save-warning" role="status">${saveNotice}</p><p class="eyebrow">${stageHeading(l)}</p><h2>${stars===3?'見事な配達じゃ！':stars===2?'よう届けたのう！':'今日の配達、おしまい！'}</h2><p class="post-result-gifts" aria-label="今日のおかえし">${post.gifts.join(' ')}</p><p class="day-result-main">3つの荷物を届けて、3通のおへんじ · ひとりでぴったり ${alone} / 6</p><div class="star-result" data-stars="${stars}"><strong aria-label="${stars}つ星">${starText(stars)}</strong><p>まちがい ${post.mistakes}回 · ヒント ${post.hints}回</p><small>★★★ まちがい・ヒントなし · ★★ 2回まで<br>たからだな ${shelf} / ${postGiftCount()}${record.stars[id]?` · 最高評価 ${starText(record.stars[id].stars)}`:''}</small></div><button class="primary" id="result-main">${l.number===6?'章クリアへ ▸':'次の便へ'}</button><button class="secondary" id="result-map">配送所えらびにもどる</button><button class="secondary" id="retry-stage">星をふやしに、もう一度</button>`,false);
 $('.result-modal').classList.add('victory-result');$('.result-modal').insertAdjacentHTML('afterbegin',victoryEffects());
 const leave=onDone=>{closeModal();if(l.number===6)showChapterCompletion(l,onDone);else onDone();};
 $('#result-main').onclick=()=>leave(()=>{renderMap();if(l.stageId<35)chooseLevel(stages[l.stageId+1]);else renderPreparations();});
 $('#result-map').onclick=()=>leave(renderMap);$('#retry-stage').onclick=()=>{closeModal();startPost(l);};
}
window.addEventListener('resize',()=>{if(screen==='play'&&session)layoutLine();});
document.addEventListener('visibilitychange',()=>{soundtrack.visibility(document.hidden);lastTick=performance.now();if(document.hidden&&screen==='play'&&!paused&&!busy&&session?.status==='playing')pauseGame();});
renderHome();
