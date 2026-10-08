/* カフェナビ service worker
   ・画面（HTML）と店舗・駅データ（JSON）：通信を優先し、つながらない／遅いときは保存済みのものを使う
   ・アイコンなど：保存済みを優先
   ・Google Fonts：保存済みを先に返し、裏で更新
   ・ログイン（Firebase）や報告フォームなど外部の通信には関与しない
   画面やデータを更新したときは、このファイルを変えなくても次回の通信で新しいものに入れ替わります。
   このファイル自体の内容を変えたときだけ、VERSION を上げてください。 */
var VERSION = "cafenavi-v1";
var CORE = [
  "./", "index.html", "terms.html", "manifest.webmanifest",
  "stations.json", "cafes.json",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "favicon-32.png"
];
var FONT_CACHE = "cafenavi-fonts";
var NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION)
      .then(function (c) { return c.addAll(CORE.map(function (u) { return new Request(u, { cache: "reload" }); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== FONT_CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function networkFirst(req, fallbackUrl) {
  return caches.open(VERSION).then(function (cache) {
    var net = fetch(req).then(function (res) {
      if (res && res.ok) cache.put(fallbackUrl || req, res.clone());
      return res;
    });
    var cached = function () {
      return cache.match(fallbackUrl || req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        return net; // 保存がなければ通信の結果を待つ
      });
    };
    var timer = new Promise(function (resolve) { setTimeout(resolve, NETWORK_TIMEOUT_MS, "timeout"); });
    return Promise.race([net.catch(function () { return "error"; }), timer]).then(function (r) {
      if (r === "timeout" || r === "error" || !r || !r.ok) return cached();
      return r;
    });
  });
}

function cacheFirst(req) {
  return caches.match(req, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res && res.ok) caches.open(VERSION).then(function (c) { c.put(req, res.clone()); });
      return res;
    });
  });
}

function staleWhileRevalidate(req) {
  return caches.open(FONT_CACHE).then(function (cache) {
    return cache.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    var page = /terms\.html$/.test(url.pathname) ? "terms.html" : "index.html";
    e.respondWith(networkFirst(req, page));
    return;
  }
  if (/\.(json|html|webmanifest)$/.test(url.pathname)) {
    e.respondWith(networkFirst(req));
    return;
  }
  if (/\.(png|svg|ico|webp)$/.test(url.pathname)) {
    e.respondWith(cacheFirst(req));
  }
});
