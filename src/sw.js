// The build replaces these placeholders with a content hash and complete local asset list.
const CACHE='miracle-clock-__VERSION__';
const ASSETS=__ASSETS__;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 try{await cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})));}catch(error){await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Retain one previous complete release, without accumulating unbounded downloads.
 const old=(await caches.keys()).filter(key=>key.startsWith('miracle-clock-')&&key!==CACHE);
 await Promise.all(old.slice(0,-1).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const key=event.request.mode==='navigate'?'./index.html':url.pathname;
  return await cache.match(key)||fetch(event.request);
 })());
});
