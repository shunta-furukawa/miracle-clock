/* Kept separate from game state: updates never interrupt a delivery. */
(()=>{
 let registration,installPrompt,ready=false;
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 function refresh(){
  const install=document.querySelector('#install-app'),status=document.querySelector('#offline-status'),update=document.querySelector('#update-app');
  if(install)install.hidden=standalone();
  if(status)status.textContent=ready?'オフラインでもあそべます':navigator.onLine?'オフラインの準備中…':'ネットにつないで準備してね';
  if(update)update.hidden=!registration?.waiting;
 }
 async function install(){
  if(installPrompt){await installPrompt.prompt();installPrompt=null;return;}
  const dialog=document.createElement('dialog');dialog.className='install-dialog';
  dialog.innerHTML='<h2>空のとけい便をホームへ</h2><p>ブラウザの共有メニューから<br>「ホーム画面に追加」を選んでね。</p><p>「Webアプリとして開く」が表示されたら、オンにして追加します。</p><p>次からはアイコンを押すだけ。記録はこの端末に保存されます。</p><button class="primary">とじる</button>';
  dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
 }
 window.clockPwa={refresh,install,update:()=>{
  // Only the title screen exposes this action; no in-progress game is discarded.
  if(!document.querySelector('.home')||!registration?.waiting)return;
  navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});
  registration.waiting.postMessage({type:'ACTIVATE'});
 }};
 addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;refresh();});
 addEventListener('appinstalled',refresh);addEventListener('online',refresh);addEventListener('offline',refresh);
 if('serviceWorker' in navigator&&location.protocol!=='file:'){
  navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(async r=>{
   registration=r;ready=!!r.active;refresh();
   r.addEventListener('updatefound',()=>{const worker=r.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){ready=true;refresh();}});});
   await navigator.serviceWorker.ready;ready=true;refresh();
  }).catch(()=>{const s=document.querySelector('#offline-status');if(s)s.textContent=navigator.onLine?'オンラインであそべます':'ネットにつないで準備してね';});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)registration?.update().catch(()=>{});});
 }
 refresh();
})();
