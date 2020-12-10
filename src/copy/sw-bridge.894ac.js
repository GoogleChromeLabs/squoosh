(self.webpackJsonp = self.webpackJsonp || []).push([
  [0],
  {
    54: function (e, t, n) {
      'use strict';
      n.d(t, 'a', function () {
        return o;
      }),
        n.d(t, 'b', function () {
          return s;
        });
      class r {
        constructor(e = 'keyval-store', t = 'keyval') {
          (this.storeName = t),
            (this._dbp = new Promise((n, r) => {
              const a = indexedDB.open(e, 1);
              (a.onerror = () => r(a.error)),
                (a.onsuccess = () => n(a.result)),
                (a.onupgradeneeded = () => {
                  a.result.createObjectStore(t);
                });
            }));
        }
        _withIDBStore(e, t) {
          return this._dbp.then(
            (n) =>
              new Promise((r, a) => {
                const i = n.transaction(this.storeName, e);
                (i.oncomplete = () => r()),
                  (i.onabort = i.onerror = () => a(i.error)),
                  t(i.objectStore(this.storeName));
              }),
          );
        }
      }
      let a;
      function i() {
        return a || (a = new r()), a;
      }
      function o(e, t = i()) {
        let n;
        return t
          ._withIDBStore('readonly', (t) => {
            n = t.get(e);
          })
          .then(() => n.result);
      }
      function s(e, t, n = i()) {
        return n._withIDBStore('readwrite', (n) => {
          n.put(t, e);
        });
      }
    },
    56: function (e, t, n) {
      'use strict';
      n.r(t),
        function (e) {
          n.d(t, 'getSharedImage', function () {
            return i;
          }),
            n.d(t, 'offliner', function () {
              return o;
            }),
            n.d(t, 'mainAppLoaded', function () {
              return s;
            });
          var r = n(54);
          async function a(e) {
            if (e.waiting) return;
            const t = await (async function (e) {
              return e.installing
                ? e.installing
                : new Promise((t) => {
                    e.addEventListener('updatefound', () => t(e.installing), {
                      once: !0,
                    });
                  });
            })(e);
            return new Promise((e) => {
              t.addEventListener('statechange', () => {
                'installed' === t.state && e();
              });
            });
          }
          function i() {
            return new Promise((e) => {
              const t = (n) => {
                'load-image' === n.data.action &&
                  (e(n.data.file),
                  navigator.serviceWorker.removeEventListener('message', t));
              };
              navigator.serviceWorker.addEventListener('message', t),
                navigator.serviceWorker.controller.postMessage('share-ready');
            });
          }
          async function o(t) {
            if ('boolean' == typeof PRERENDER) return;
            navigator.serviceWorker.register(e);
            const n = !!navigator.serviceWorker.controller;
            if (
              (navigator.serviceWorker.addEventListener(
                'controllerchange',
                async () => {
                  n
                    ? location.reload()
                    : t('Ready to work offline', { timeout: 5e3 });
                },
              ),
              !n)
            )
              return;
            const r = await navigator.serviceWorker.getRegistration();
            r &&
              (await a(r),
              'reload' ===
                (await t('Update available', {
                  actions: ['reload', 'dismiss'],
                })) &&
                (async function () {
                  const e = await navigator.serviceWorker.getRegistration();
                  e && e.waiting && e.waiting.postMessage('skip-waiting');
                })());
          }
          async function s() {
            if (await Object(r.a)('user-interacted')) return;
            Object(r.b)('user-interacted', !0);
            const e = await (async function () {
              const e = await navigator.serviceWorker.getRegistration();
              return e ? e.active || e.waiting || e.installing : null;
            })();
            e && e.postMessage('cache-all');
          }
        }.call(this, n.p + 'serviceworker.js');
    },
  },
]);
//# sourceMappingURL=sw-bridge.894ac.js.map
