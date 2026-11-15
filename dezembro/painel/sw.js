// Painel Dezembro de Ouro: guarda a página pra abrir sem internet.
const CACHE = 'ddo-painel-v3';
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Página: tenta a internet primeiro (pega atualizações), cai no guardado se estiver sem sinal.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => { const copia = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copia)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Fontes, ícones e o resto: usa o guardado e atualiza por trás.
  e.respondWith(
    caches.match(req).then(guardado => {
      const rede = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
        return res;
      }).catch(() => guardado);
      return guardado || rede;
    })
  );
});
