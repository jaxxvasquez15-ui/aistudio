// v6：页面 network-first（3 秒超时回退缓存，弱网也能秒开）；图标等静态资源 cache-first；API 请求一律直连不缓存
const C='aistudio-v6';
const SHELL=['./','index.html','manifest.json','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const url=new URL(r.url);
  if(url.origin!==location.origin)return;
  const isPage=r.mode==='navigate'||/\/(index\.html)?$/.test(url.pathname)||/\.(html|js)$/.test(url.pathname);
  if(isPage){
    const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res});
    e.waitUntil(net.then(()=>{},()=>{}));
    e.respondWith((async()=>{
      const timeout=new Promise(ok=>setTimeout(()=>ok(null),3000));
      try{const res=await Promise.race([net,timeout]);if(res)return res}catch{}
      const c=await caches.open(C);
      return (await c.match(r,{ignoreSearch:true}))||(r.mode==='navigate'?await c.match('index.html'):null)||net;
    })());
    return;
  }
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res})));
});
