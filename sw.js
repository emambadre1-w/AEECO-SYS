/* ===================================================================
   AEECO — Service Worker
   الغرض: تخزين ملفات الواجهة على الجهاز ليفتح النظام بسرعة ويعمل
   على شبكة ضعيفة أو متقطعة.

   الاستراتيجية: "الشبكة أولاً مع مهلة، ثم النسخة المحفوظة".
   - الشبكة متاحة  → يأخذ أحدث نسخة دائمًا (لا مشكلة نسخ قديمة عالقة)
   - الشبكة بطيئة  → بعد ثانيتين يعرض النسخة المحفوظة فورًا
   - الشبكة مقطوعة → يعمل من النسخة المحفوظة

   ⚠️ لا يتم تخزين أي طلب لقاعدة البيانات (Supabase) إطلاقًا،
   فالبيانات تأتي حيّة دائمًا ولا تُعرض بيانات قديمة أبدًا.
   =================================================================== */

const CACHE = 'aeeco-v1';
const NET_TIMEOUT = 2000; // مهلة الشبكة قبل اللجوء للنسخة المحفوظة

const SHELL = [
  './',
  './index.html',
  './styles.css',
  './core.js',
  './accounting.js',
  './assets.js',
  './admin.js',
  './hr.js',
  './inventory.js',
  './kitchen.js',
  './pm.js',
  './pr.js',
  './pricecatalog.js',
  './reports.js',
  './requests.js',
  './secretary.js',
  './support.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll يفشل كله لو فشل ملف واحد — نضيف كل ملف على حدة
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null))))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// رسالة من الصفحة لتفعيل النسخة الجديدة فورًا
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // لا نتدخّل إلا في طلبات GET من نفس الموقع
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Supabase والخطوط والمكتبات تمرّ مباشرة

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);

    // 1) الشبكة أولاً بمهلة
    const fromNet = fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
      return res;
    });

    const timed = new Promise((resolve) => setTimeout(() => resolve(null), NET_TIMEOUT));

    try {
      const winner = await Promise.race([fromNet.catch(() => null), timed]);
      if (winner) return winner;
    } catch (_) { /* تجاهل */ }

    // 2) النسخة المحفوظة
    const cached = await cache.match(req);
    if (cached) {
      fromNet.catch(() => null);   // التحديث يكمل في الخلفية
      return cached;
    }

    // 3) لا شبكة ولا نسخة محفوظة — ننتظر الشبكة حتى النهاية
    try {
      return await fromNet;
    } catch (_) {
      const fallback = await cache.match('./index.html');
      if (fallback) return fallback;
      return new Response('غير متصل بالإنترنت', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
