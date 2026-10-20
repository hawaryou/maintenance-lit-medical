/* EuroMed maintenance — offline shell and PDF libraries */
const CACHE_NAME="euromed-lit-offline-v1";
const SCOPE=self.registration.scope;
const LOCAL_FILES=[
 SCOPE,SCOPE+"index.html",SCOPE+"style.css?v=20261020-rgpd-v1",SCOPE+"config.js",
 SCOPE+"app.js?v=20261020-mobile-preview-v3",SCOPE+"euromed-logo.jpeg",SCOPE+"scan-success-euromed.jpg"
];
const REMOTE_FILES=[
 "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
 "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
 "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js",
 "https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.4/dist/iife/reader/index.js",
 "https://cdn.jsdelivr.net/npm/@undecaf/barcode-detector-polyfill@0.9.23/dist/main.js"
];
async function cacheRemote(cache,url){
 try{const response=await fetch(url,{mode:"cors",cache:"reload"});if(response.ok && response.type!=="opaque")await cache.put(url,response.clone());}
 catch(error){console.warn("Bibliothèque distante non préparée hors ligne :",url,error);}
}
self.addEventListener("install",event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE_NAME);
 for(const url of LOCAL_FILES){try{const response=await fetch(url,{cache:"reload"});if(response.ok)await cache.put(url,response.clone())}catch(e){console.warn("Ressource locale non mise en cache :",url)}}
 for(const url of REMOTE_FILES)await cacheRemote(cache,url);
 await self.skipWaiting();
})()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith("euromed-lit-offline-")&&k!==CACHE_NAME).map(k=>caches.delete(k)));await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
 const request=event.request;if(request.method!=="GET")return;
 const url=new URL(request.url);
 const local=url.origin===self.location.origin && url.href.startsWith(SCOPE);
 const remote=REMOTE_FILES.includes(url.href);
 if(!local&&!remote)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request,{ignoreSearch:false})||await cache.match(url.href);
  if(cached)return cached;
  try{const response=await fetch(request);if(response.ok&&response.type!=="opaque")cache.put(request,response.clone()).catch(()=>{});return response}
  catch(e){
   if(request.mode==="navigate")return (await cache.match(SCOPE+"index.html"))||new Response("Page non préparée hors connexion. Reconnectez-vous et ouvrez cette page une fois.",{status:503,headers:{"Content-Type":"text/plain;charset=utf-8"}});
   return new Response("Ressource indisponible hors connexion",{status:503,headers:{"Content-Type":"text/plain;charset=utf-8"}});
  }
 })());
});
