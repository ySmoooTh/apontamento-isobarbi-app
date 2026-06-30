const CACHE_NAME = "apontamento-isobarbi-v3";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );

  self.skipWaiting();

});

self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );

  self.clients.claim();

});

self.addEventListener("fetch", event => {

  if(event.request.method !== "GET"){
    return;
  }

  if(
    event.request.url.includes(
      "script.google.com"
    )
  ){
    event.respondWith(fetch(event.request));
    return;
  }

  const aceitarHtml =
    event.request.mode === "navigate" ||
    (
      event.request.headers.get("accept") || ""
    ).includes("text/html");

  if(aceitarHtml){

    event.respondWith(
      fetch(event.request)
        .then(response => {

          const clone = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });

          return response;

        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => {
              return cached || caches.match("./index.html");
            });
        })
    );

    return;

  }

  event.respondWith(
    caches.match(event.request).then(cached => {

      if(cached){
        return cached;
      }

      return fetch(event.request).then(response => {

        if(
          !response ||
          response.status !== 200 ||
          response.type !== "basic"
        ){
          return response;
        }

        const clone = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });

        return response;

      });

    })
  );

});
