// 简易 Service Worker：导航请求网络优先（保证打开即最新），静态资源缓存优先
const CACHE = 'vocab-master-v2'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  // 只处理同源请求（跨域的有道发音音频等不缓存）
  if (url.origin !== self.location.origin) return

  const isNav =
    req.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/'

  if (isNav) {
    // 导航（HTML）：网络优先，失败再回退缓存，保证始终拿到最新页面
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/index.html'))),
    )
    return
  }

  // 静态资源（带 hash 的 JS/CSS 等）：缓存优先，后台更新
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(req)
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone())
          return res
        })
        .catch(() => cached)
      return cached || network
    })(),
  )
})
