// TintPro 离线缓存（v14.15）
const CACHE = 'tintpro-v14.15';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const LIBS = ['cdn.tailwindcss.com', 'unpkg.com'];   // 外部脚本库：缓存起来，没网也能显示样式和图标
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {   // 自己的文件：有网先取最新版（绕过浏览器缓存），没网用缓存
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })
      .catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('./index.html').then(x => x || caches.match('./')) : undefined))));
    return;
  }
  if (LIBS.includes(u.hostname)) {   // 外部库：先用缓存，同时后台更新
    e.respondWith(caches.open(CACHE).then(c => c.match(r).then(m => { const f = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }).catch(() => m); return m || f; })));
  }
});
