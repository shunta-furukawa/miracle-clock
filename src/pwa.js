/* Updates are explicit on the title screen and never discard a running delivery. */
(()=>{
 let registration,installPrompt,ready=false,checking=false,installing=false,note='',registrationPromise;
 const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 function refresh(){
  const install=document.querySelector('#install-app'),status=document.querySelector('#offline-status'),update=document.querySelector('#update-app');
  if(install)install.hidden=standalone();
  if(status)status.textContent=registration?.waiting?'新しい版の準備ができました。':installing?'新しい版をダウンロード中…':note||(ready?'オフラインでもあそべます':navigator.onLine?'オフラインの準備中…':'ネットにつないで準備してね');
  if(update){update.hidden=false;update.disabled=checking||installing;update.textContent=registration?.waiting?'新しい版であそぶ':installing?'ダウンロード中…':checking?'確認中…':'更新を確認';}
 }
 function watch(worker){
  if(!worker||worker.state==='activated'||worker.state==='redundant')return;
  installing=worker.state!=='installed';refresh();
  const changed=()=>{if(worker.state==='installed'){installing=false;ready=true;note='';refresh();}else if(worker.state==='redundant'){installing=false;note='更新を取得できませんでした。「更新を確認」で再試行できます。';refresh();}};
  worker.addEventListener('statechange',changed);changed();
 }
 async function check(){
  if(checking||installing)return;checking=true;note='';refresh();
  try{
   if(!navigator.onLine)throw Error('offline');
   registration=registration||await registrationPromise;
   if(!registration)throw Error('unsupported');
   await registration.update();watch(registration.installing);
   if(!registration.waiting&&!registration.installing){
    const response=await fetch('./version.json',{cache:'no-store'});if(!response.ok)throw Error('version');
    const latest=await response.json(),current=document.querySelector('meta[name="app-build"]')?.content;
    note=latest.build===current?'最新版です。': '更新を取得しています。少し待ってからもう一度確認してください。';
   }
  }catch{note=navigator.onLine?'更新を確認できませんでした。時間をおいて再試行してください。':'オフラインです。ネットにつないで更新してください。';}
  finally{checking=false;refresh();}
 }
 async function install(){
  if(installPrompt){await installPrompt.prompt();installPrompt=null;return;}
  const dialog=document.createElement('dialog');dialog.className='install-dialog';
  dialog.innerHTML='<h2>ホーム画面に追加</h2><p>iPhone・iPadでは、Safariの共有メニューから<br>「ホーム画面に追加」を選んでね。</p><p>「Webアプリとして開く」が表示されたら、オンにします。</p><p>すでに追加したアイコンの絵柄は、iOS側ですぐに更新されないことがあります。セーブを守るため、アプリやサイトデータは削除しないでください。</p><button class="primary">とじる</button>';
  dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
 }
 window.clockPwa={refresh,install,update:()=>{
  if(!document.querySelector('.home'))return;
  if(!registration?.waiting){void check();return;}
  navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});
  registration.waiting.postMessage({type:'ACTIVATE'});
 }};
 addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;refresh();});
 addEventListener('appinstalled',refresh);addEventListener('online',refresh);addEventListener('offline',refresh);
 if('serviceWorker' in navigator&&location.protocol!=='file:'){
  registrationPromise=navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>{
   registration=r;ready=!!r.active;
   r.addEventListener('updatefound',()=>watch(r.installing));watch(r.installing);refresh();
   navigator.serviceWorker.ready.then(()=>{ready=true;refresh();});return r;
  }).catch(()=>{note='オフラインの準備ができませんでした。ネットにつないで再読み込みしてください。';refresh();return null;});
  for(const event of ['pageshow','online'])addEventListener(event,()=>{registration?.update().catch(()=>{});});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)registration?.update().catch(()=>{});});
 }
 refresh();
})();
