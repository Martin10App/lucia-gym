const CACHE_NAME = 'lucia-gym-v15';
const ASSETS = [
  './',
  './index.html',
  './exercise-media.js',
  './sync.js',
  './sync.js?v=5',
  './motivacion.js',
  './motivacion.js?v=2',
  './vendor/firebase/firebase-app.js',
  './vendor/firebase/firebase-auth.js',
  './vendor/firebase/firebase-firestore.js',
  './exercise-media.js?v=9',
  './exercise-media.json',
  './exercise-media.json?v=5',
  './programas.json',
  './manifest.json',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './local/bird-dog.gif',
  './local/bird-dog.jpg',
  './local/cat-cow.gif',
  './local/cat-cow.jpg'
];
const MEDIA_ASSETS = [
  "./photos/L021_1.jpg",
  "./photos/L021_0.jpg",
  "./photos/0058_0.jpg",
  "./photos/0058_1.jpg",
  "./photos/0165_0.jpg",
  "./photos/0165_1.jpg",
  "./photos/0200_0.jpg",
  "./photos/0200_1.jpg",
  "./photos/0203_0.jpg",
  "./photos/0203_1.jpg",
  "./photos/0228_0.jpg",
  "./photos/0228_1.jpg",
  "./photos/0235_0.jpg",
  "./photos/0235_1.jpg",
  "./photos/0238_0.jpg",
  "./photos/0238_1.jpg",
  "./photos/0241_0.jpg",
  "./photos/0241_1.jpg",
  "./photos/0276_0.jpg",
  "./photos/0276_1.jpg",
  "./photos/0285_0.jpg",
  "./photos/0285_1.jpg",
  "./photos/0291_0.jpg",
  "./photos/0291_1.jpg",
  "./photos/0292_0.jpg",
  "./photos/0292_1.jpg",
  "./photos/0313_0.jpg",
  "./photos/0313_1.jpg",
  "./photos/0314_0.jpg",
  "./photos/0314_1.jpg",
  "./photos/0327_0.jpg",
  "./photos/0327_1.jpg",
  "./photos/0334_0.jpg",
  "./photos/0334_1.jpg",
  "./photos/0405_0.jpg",
  "./photos/0405_1.jpg",
  "./photos/0431_0.jpg",
  "./photos/0431_1.jpg",
  "./photos/0493_0.jpg",
  "./photos/0493_1.jpg",
  "./photos/0577_0.jpg",
  "./photos/0577_1.jpg",
  "./photos/0585_0.jpg",
  "./photos/0585_1.jpg",
  "./photos/0586_0.jpg",
  "./photos/0586_1.jpg",
  "./photos/0592_0.jpg",
  "./photos/0592_1.jpg",
  "./photos/0594_0.jpg",
  "./photos/0594_1.jpg",
  "./photos/0596_0.jpg",
  "./photos/0596_1.jpg",
  "./photos/0597_0.jpg",
  "./photos/0597_1.jpg",
  "./photos/0599_0.jpg",
  "./photos/0599_1.jpg",
  "./photos/0602_0.jpg",
  "./photos/0602_1.jpg",
  "./photos/0603_0.jpg",
  "./photos/0603_1.jpg",
  "./photos/0705_0.jpg",
  "./photos/0705_1.jpg",
  "./photos/0868_0.jpg",
  "./photos/0868_1.jpg",
  "./photos/0979_0.jpg",
  "./photos/0979_1.jpg",
  "./photos/1350_0.jpg",
  "./photos/1350_1.jpg",
  "./photos/1564_0.jpg",
  "./photos/1564_1.jpg",
  "./photos/1760_0.jpg",
  "./photos/1760_1.jpg",
  "./photos/2135_0.jpg",
  "./photos/2135_1.jpg",
  "./photos/2330_0.jpg",
  "./photos/2330_1.jpg",
  "./photos/3013_0.jpg",
  "./photos/3013_1.jpg",
  "./photos/L002_0.jpg",
  "./photos/L002_1.jpg",
  "./photos/L011_0.jpg",
  "./photos/L011_1.jpg",
  "./images/0165-HPlPoQA.jpg",
  "./images/0178-goJ6ezq.jpg",
  "./images/0200-dU605di.jpg",
  "./images/0235-FWdVhcW.jpg",
  "./images/0584-dRTfGZT.jpg",
  "./images/0592-b6hQYMb.jpg",
  "./images/0596-v3xmPAR.jpg",
  "./images/0602-myfUsKf.jpg",
  "./images/0868-G08RZcQ.jpg",
  "./images/1015-G7PXMlT.jpg",
  "./videos/0165-HPlPoQA.gif",
  "./videos/0178-goJ6ezq.gif",
  "./videos/0200-dU605di.gif",
  "./videos/0235-FWdVhcW.gif",
  "./videos/0584-dRTfGZT.gif",
  "./videos/0592-b6hQYMb.gif",
  "./videos/0596-v3xmPAR.gif",
  "./videos/0602-myfUsKf.gif",
  "./videos/0868-G08RZcQ.gif",
  "./videos/1015-G7PXMlT.gif",
  "./images/0058-SNFfUff.jpg",
  "./images/0203-wqNPGCg.jpg",
  "./images/0213-pwt0pnM.jpg",
  "./images/0228-Kpajagk.jpg",
  "./images/0238-x69MAlq.jpg",
  "./images/0241-gAwDzB3.jpg",
  "./images/0276-iny3m5y.jpg",
  "./images/0285-BU15nH4.jpg",
  "./images/0291-mnzcrIB.jpg",
  "./images/0292-C0MA9bC.jpg",
  "./images/0313-slDvUAU.jpg",
  "./images/0314-ns0SIbU.jpg",
  "./images/0327-7vG5o25.jpg",
  "./images/0334-DsgkuIt.jpg",
  "./images/0405-znQUdHY.jpg",
  "./images/0431-aXtJhlg.jpg",
  "./images/0493-B1EVP9F.jpg",
  "./images/0577-T0yTjgW.jpg",
  "./images/0585-my33uHU.jpg",
  "./images/0586-17lJ1kr.jpg",
  "./images/0594-bOOdeyc.jpg",
  "./images/0597-CHpahtl.jpg",
  "./images/0599-Zg3XY7P.jpg",
  "./images/0603-67n3r98.jpg",
  "./images/0659-LEH9jxP.jpg",
  "./images/0705-RKjH6Lt.jpg",
  "./images/0710-7WaDzyL.jpg",
  "./images/0739-10Z2DXU.jpg",
  "./images/0974-DptumMx.jpg",
  "./images/0979-9pa4H5m.jpg",
  "./images/1022-tc5dYrf.jpg",
  "./images/1346-f38OEuO.jpg",
  "./images/1350-7I6LNUG.jpg",
  "./images/1564-tFGKm99.jpg",
  "./images/1710-RQNVT10.jpg",
  "./images/1760-yn8yg1r.jpg",
  "./images/2133-qPEzJjA.jpg",
  "./images/2135-VBAWRPG.jpg",
  "./images/2330-LEprlgG.jpg",
  "./images/3006-0xDpB4L.jpg",
  "./images/3013-u0cNiij.jpg",
  "./images/3144-Nu7jqFE.jpg",
  "./images/3147-NKJ8o6x.jpg",
  "./images/3239-h1ezqSu.jpg",
  "./images/3523-aWedzZX.jpg",
  "./images/3561-GibBPPg.jpg",
  "./local/bird-dog.gif",
  "./local/bird-dog.jpg",
  "./local/cat-cow.gif",
  "./local/cat-cow.jpg",
  "./videos/0058-SNFfUff.gif",
  "./videos/0203-wqNPGCg.gif",
  "./videos/0213-pwt0pnM.gif",
  "./videos/0228-Kpajagk.gif",
  "./videos/0238-x69MAlq.gif",
  "./videos/0241-gAwDzB3.gif",
  "./videos/0276-iny3m5y.gif",
  "./videos/0285-BU15nH4.gif",
  "./videos/0291-mnzcrIB.gif",
  "./videos/0292-C0MA9bC.gif",
  "./videos/0313-slDvUAU.gif",
  "./videos/0314-ns0SIbU.gif",
  "./videos/0327-7vG5o25.gif",
  "./videos/0334-DsgkuIt.gif",
  "./videos/0405-znQUdHY.gif",
  "./videos/0431-aXtJhlg.gif",
  "./videos/0493-B1EVP9F.gif",
  "./videos/0577-T0yTjgW.gif",
  "./videos/0585-my33uHU.gif",
  "./videos/0586-17lJ1kr.gif",
  "./videos/0594-bOOdeyc.gif",
  "./videos/0597-CHpahtl.gif",
  "./videos/0599-Zg3XY7P.gif",
  "./videos/0603-67n3r98.gif",
  "./videos/0659-LEH9jxP.gif",
  "./videos/0705-RKjH6Lt.gif",
  "./videos/0710-7WaDzyL.gif",
  "./videos/0739-10Z2DXU.gif",
  "./videos/0974-DptumMx.gif",
  "./videos/0979-9pa4H5m.gif",
  "./videos/1022-tc5dYrf.gif",
  "./videos/1346-f38OEuO.gif",
  "./videos/1350-7I6LNUG.gif",
  "./videos/1564-tFGKm99.gif",
  "./videos/1710-RQNVT10.gif",
  "./videos/1760-yn8yg1r.gif",
  "./videos/2133-qPEzJjA.gif",
  "./videos/2135-VBAWRPG.gif",
  "./videos/2330-LEprlgG.gif",
  "./videos/3006-0xDpB4L.gif",
  "./videos/3013-u0cNiij.gif",
  "./videos/3144-Nu7jqFE.gif",
  "./videos/3147-NKJ8o6x.gif",
  "./videos/3239-h1ezqSu.gif",
  "./videos/3523-aWedzZX.gif",
  "./videos/3561-GibBPPg.gif"
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS).catch(() => {});
    await Promise.allSettled(MEDIA_ASSETS.map(url => cache.add(url).catch(() => {})));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // El shell (HTML, JSON, JS, manifest) va primero a la red: así los cambios
  // publicados llegan en la próxima apertura. Si no hay internet, usa el cache.
  const path = url.pathname;
  const isShell = event.request.mode === 'navigate'
    || path.endsWith('/')
    || /\.(?:html|json|js)$/.test(path);

  if (isShell) {
    event.respondWith((async () => {
      try {
        const resp = await fetch(event.request, { cache: 'no-store' });
        if (resp && resp.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, resp.clone()).catch(() => {});
        }
        return resp;
      } catch (e) {
        return (await caches.match(event.request)) || caches.match('./index.html');
      }
    })());
    return;
  }

  // Fotos y GIFs: cache primero, y se refrescan solos en segundo plano.
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(resp => {
        if (resp && resp.status === 200 && (resp.type === 'basic' || resp.type === 'cors')) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone)).catch(() => {});
        }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});
