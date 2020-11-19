var avif_enc_mt = (function () {
  var _scriptDir = import.meta.url;

  return function (avif_enc_mt) {
    avif_enc_mt = avif_enc_mt || {};

    function f() {
      m.buffer != n && p(m.buffer);
      return aa;
    }
    function t() {
      m.buffer != n && p(m.buffer);
      return ba;
    }
    function ca() {
      m.buffer != n && p(m.buffer);
      return da;
    }
    function ea() {
      m.buffer != n && p(m.buffer);
      return fa;
    }
    function w() {
      m.buffer != n && p(m.buffer);
      return ha;
    }
    function x() {
      m.buffer != n && p(m.buffer);
      return ia;
    }
    function ja() {
      m.buffer != n && p(m.buffer);
      return ka;
    }
    function la() {
      m.buffer != n && p(m.buffer);
      return ma;
    }
    var z;
    z || (z = typeof avif_enc_mt !== 'undefined' ? avif_enc_mt : {});
    var na, oa;
    z.ready = new Promise(function (a, b) {
      na = a;
      oa = b;
    });
    var pa = {},
      A;
    for (A in z) z.hasOwnProperty(A) && (pa[A] = z[A]);
    var D = z.ENVIRONMENT_IS_PTHREAD || !1;
    D && (n = z.buffer);
    var F = '';
    function qa(a) {
      return z.locateFile ? z.locateFile(a, F) : F + a;
    }
    var ra;
    F = self.location.href;
    _scriptDir && (F = _scriptDir);
    0 !== F.indexOf('blob:')
      ? (F = F.substr(0, F.lastIndexOf('/') + 1))
      : (F = '');
    ra = function (a) {
      var b = new XMLHttpRequest();
      b.open('GET', a, !1);
      b.responseType = 'arraybuffer';
      b.send(null);
      return new Uint8Array(b.response);
    };
    var sa = z.print || console.log.bind(console),
      G = z.printErr || console.warn.bind(console);
    for (A in pa) pa.hasOwnProperty(A) && (z[A] = pa[A]);
    pa = null;
    var ta = 0,
      ua;
    z.wasmBinary && (ua = z.wasmBinary);
    var noExitRuntime;
    z.noExitRuntime && (noExitRuntime = z.noExitRuntime);
    'object' !== typeof WebAssembly && H('no native wasm support detected');
    var m,
      wa,
      threadInfoStruct = 0,
      selfThreadId = 0,
      xa = !1;
    function ya(a, b) {
      a || H('Assertion failed: ' + b);
    }
    function za(a, b, c) {
      c = b + c;
      for (var d = ''; !(b >= c); ) {
        var e = a[b++];
        if (!e) break;
        if (e & 128) {
          var g = a[b++] & 63;
          if (192 == (e & 224)) d += String.fromCharCode(((e & 31) << 6) | g);
          else {
            var h = a[b++] & 63;
            e =
              224 == (e & 240)
                ? ((e & 15) << 12) | (g << 6) | h
                : ((e & 7) << 18) | (g << 12) | (h << 6) | (a[b++] & 63);
            65536 > e
              ? (d += String.fromCharCode(e))
              : ((e -= 65536),
                (d += String.fromCharCode(
                  55296 | (e >> 10),
                  56320 | (e & 1023),
                )));
          }
        } else d += String.fromCharCode(e);
      }
      return d;
    }
    function I(a, b) {
      return a ? za(t(), a, b) : '';
    }
    function Aa(a, b, c, d) {
      if (!(0 < d)) return 0;
      var e = c;
      d = c + d - 1;
      for (var g = 0; g < a.length; ++g) {
        var h = a.charCodeAt(g);
        if (55296 <= h && 57343 >= h) {
          var k = a.charCodeAt(++g);
          h = (65536 + ((h & 1023) << 10)) | (k & 1023);
        }
        if (127 >= h) {
          if (c >= d) break;
          b[c++] = h;
        } else {
          if (2047 >= h) {
            if (c + 1 >= d) break;
            b[c++] = 192 | (h >> 6);
          } else {
            if (65535 >= h) {
              if (c + 2 >= d) break;
              b[c++] = 224 | (h >> 12);
            } else {
              if (c + 3 >= d) break;
              b[c++] = 240 | (h >> 18);
              b[c++] = 128 | ((h >> 12) & 63);
            }
            b[c++] = 128 | ((h >> 6) & 63);
          }
          b[c++] = 128 | (h & 63);
        }
      }
      b[c] = 0;
      return c - e;
    }
    function Ba(a, b, c) {
      Aa(a, t(), b, c);
    }
    function Ca(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        55296 <= d &&
          57343 >= d &&
          (d = (65536 + ((d & 1023) << 10)) | (a.charCodeAt(++c) & 1023));
        127 >= d ? ++b : (b = 2047 >= d ? b + 2 : 65535 >= d ? b + 3 : b + 4);
      }
      return b;
    }
    function Da(a, b) {
      for (var c = 0, d = ''; ; ) {
        var e = ca()[(a + 2 * c) >> 1];
        if (0 == e || c == b / 2) return d;
        ++c;
        d += String.fromCharCode(e);
      }
    }
    function Ea(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (2 > c) return 0;
      c -= 2;
      var d = b;
      c = c < 2 * a.length ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) {
        var g = a.charCodeAt(e);
        ca()[b >> 1] = g;
        b += 2;
      }
      ca()[b >> 1] = 0;
      return b - d;
    }
    function Fa(a) {
      return 2 * a.length;
    }
    function Ga(a, b) {
      for (var c = 0, d = ''; !(c >= b / 4); ) {
        var e = w()[(a + 4 * c) >> 2];
        if (0 == e) break;
        ++c;
        65536 <= e
          ? ((e -= 65536),
            (d += String.fromCharCode(55296 | (e >> 10), 56320 | (e & 1023))))
          : (d += String.fromCharCode(e));
      }
      return d;
    }
    function Ha(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (4 > c) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var g = a.charCodeAt(e);
        if (55296 <= g && 57343 >= g) {
          var h = a.charCodeAt(++e);
          g = (65536 + ((g & 1023) << 10)) | (h & 1023);
        }
        w()[b >> 2] = g;
        b += 4;
        if (b + 4 > c) break;
      }
      w()[b >> 2] = 0;
      return b - d;
    }
    function Ia(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        55296 <= d && 57343 >= d && ++c;
        b += 4;
      }
      return b;
    }
    var n, aa, ba, da, fa, ha, ia, ka, ma;
    function p(a) {
      n = a;
      z.HEAP8 = aa = new Int8Array(a);
      z.HEAP16 = da = new Int16Array(a);
      z.HEAP32 = ha = new Int32Array(a);
      z.HEAPU8 = ba = new Uint8Array(a);
      z.HEAPU16 = fa = new Uint16Array(a);
      z.HEAPU32 = ia = new Uint32Array(a);
      z.HEAPF32 = ka = new Float32Array(a);
      z.HEAPF64 = ma = new Float64Array(a);
    }
    var Ja = z.INITIAL_MEMORY || 16777216;
    if (D) (m = z.wasmMemory), (n = z.buffer);
    else if (z.wasmMemory) m = z.wasmMemory;
    else if (
      ((m = new WebAssembly.Memory({
        initial: Ja / 65536,
        maximum: 32768,
        shared: !0,
      })),
      !(m.buffer instanceof SharedArrayBuffer))
    )
      throw (
        (G(
          'requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag',
        ),
        Error('bad memory'))
      );
    m && (n = m.buffer);
    Ja = n.byteLength;
    p(n);
    var J,
      Ka = [],
      La = [],
      Ma = [],
      Na = [];
    function Oa() {
      var a = z.preRun.shift();
      Ka.unshift(a);
    }
    var K = 0,
      Pa = null,
      Qa = null;
    z.preloadedImages = {};
    z.preloadedAudios = {};
    function H(a) {
      if (z.onAbort) z.onAbort(a);
      D && console.error('Pthread aborting at ' + Error().stack);
      G(a);
      xa = !0;
      a = new WebAssembly.RuntimeError(
        'abort(' + a + '). Build with -s ASSERTIONS=1 for more info.',
      );
      oa(a);
      throw a;
    }
    function Ra() {
      var a = Sa;
      return String.prototype.startsWith
        ? a.startsWith('data:application/octet-stream;base64,')
        : 0 === a.indexOf('data:application/octet-stream;base64,');
    }
    var Sa = 'avif_enc_mt.wasm';
    Ra() || (Sa = qa(Sa));
    function Ta() {
      try {
        if (ua) return new Uint8Array(ua);
        if (ra) return ra(Sa);
        throw 'both async and sync fetching of the wasm failed';
      } catch (a) {
        H(a);
      }
    }
    function Ua() {
      return ua || 'function' !== typeof fetch
        ? Promise.resolve().then(Ta)
        : fetch(Sa, { credentials: 'same-origin' })
            .then(function (a) {
              if (!a.ok)
                throw "failed to load wasm binary file at '" + Sa + "'";
              return a.arrayBuffer();
            })
            .catch(function () {
              return Ta();
            });
    }
    var Va,
      Wa,
      Ya = {
        575941: function (a, b) {
          setTimeout(function () {
            Xa(a, b);
          }, 0);
        },
        576019: function () {
          throw 'Canceled!';
        },
      };
    function Za(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ('function' == typeof b) b(z);
        else {
          var c = b.pc;
          'number' === typeof c
            ? void 0 === b.sb
              ? J.get(c)()
              : J.get(c)(b.sb)
            : c(void 0 === b.sb ? null : b.sb);
        }
      }
    }
    function $a(a, b, c) {
      var d;
      -1 != a.indexOf('j')
        ? (d =
            c && c.length
              ? z['dynCall_' + a].apply(null, [b].concat(c))
              : z['dynCall_' + a].call(null, b))
        : (d = J.get(b).apply(null, c));
      return d;
    }
    z.dynCall = $a;
    var ab = 0,
      bb = 0,
      cb = 0;
    function db(a, b, c) {
      ab = a | 0;
      cb = b | 0;
      bb = c | 0;
    }
    z.registerPthreadPtr = db;
    function eb(a, b) {
      if (0 >= a || a > f().length || a & 1 || 0 > b) return -28;
      if (0 == b) return 0;
      2147483647 <= b && (b = Infinity);
      var c = Atomics.load(w(), L.Yb >> 2),
        d = 0;
      if (
        c == a &&
        Atomics.compareExchange(w(), L.Yb >> 2, c, 0) == c &&
        (--b, (d = 1), 0 >= b)
      )
        return 1;
      a = Atomics.notify(w(), a >> 2, b);
      if (0 <= a) return a + d;
      throw 'Atomics.notify returned an unexpected value ' + a;
    }
    z._emscripten_futex_wake = eb;
    function fb(a) {
      if (D)
        throw 'Internal Error! cleanupThread() can only ever be called from main application thread!';
      if (!a) throw 'Internal Error! Null pthread_ptr in cleanupThread!';
      w()[(a + 12) >> 2] = 0;
      (a = L.fb[a]) && L.Cb(a.worker);
    }
    var L = {
      Sc: 1,
      hd: { hc: 0, ic: 0 },
      bb: [],
      lb: [],
      wc: function () {
        for (var a = navigator.hardwareConcurrency, b = 0; b < a; ++b) L.Nb();
      },
      xc: function () {
        L.$a = M(232);
        for (var a = 0; 58 > a; ++a) x()[L.$a / 4 + a] = 0;
        w()[(L.$a + 12) >> 2] = L.$a;
        a = L.$a + 156;
        w()[a >> 2] = a;
        var b = M(512);
        for (a = 0; 128 > a; ++a) x()[b / 4 + a] = 0;
        Atomics.store(x(), (L.$a + 104) >> 2, b);
        Atomics.store(x(), (L.$a + 40) >> 2, L.$a);
        Atomics.store(x(), (L.$a + 44) >> 2, 42);
        L.Wb();
        db(L.$a, !1, 1);
        gb(L.$a);
      },
      yc: function () {
        L.Wb();
        na(z);
        L.receiveObjectTransfer = L.Gc;
        L.setThreadStatus = L.Jc;
        L.threadCancel = L.Oc;
        L.threadExit = L.Pc;
      },
      Wb: function () {
        L.Yb = hb;
      },
      fb: {},
      Eb: [],
      Jc: function () {},
      fc: function () {
        for (; 0 < L.Eb.length; ) L.Eb.pop()();
        D && threadInfoStruct && ib();
      },
      Pc: function (a) {
        var b = ab | 0;
        b &&
          (Atomics.store(x(), (b + 4) >> 2, a),
          Atomics.store(x(), (b + 0) >> 2, 1),
          Atomics.store(x(), (b + 60) >> 2, 1),
          Atomics.store(x(), (b + 64) >> 2, 0),
          L.fc(),
          eb(b + 0, 2147483647),
          db(0, 0, 0),
          (threadInfoStruct = 0),
          D && postMessage({ cmd: 'exit' }));
      },
      Oc: function () {
        L.fc();
        Atomics.store(x(), (threadInfoStruct + 4) >> 2, -1);
        Atomics.store(x(), (threadInfoStruct + 0) >> 2, 1);
        eb(threadInfoStruct + 0, 2147483647);
        threadInfoStruct = selfThreadId = 0;
        db(0, 0, 0);
        postMessage({ cmd: 'cancelDone' });
      },
      td: function () {
        for (var a in L.fb) {
          var b = L.fb[a];
          b && b.worker && L.Cb(b.worker);
        }
        L.fb = {};
        for (a = 0; a < L.bb.length; ++a) {
          var c = L.bb[a];
          c.terminate();
        }
        L.bb = [];
        for (a = 0; a < L.lb.length; ++a)
          (c = L.lb[a]), (b = c.ab), L.Hb(b), c.terminate();
        L.lb = [];
      },
      Hb: function (a) {
        if (a) {
          if (a.threadInfoStruct) {
            var b = w()[(a.threadInfoStruct + 104) >> 2];
            w()[(a.threadInfoStruct + 104) >> 2] = 0;
            O(b);
            O(a.threadInfoStruct);
          }
          a.threadInfoStruct = 0;
          a.Fb && a.ob && O(a.ob);
          a.ob = 0;
          a.worker && (a.worker.ab = null);
        }
      },
      Cb: function (a) {
        delete L.fb[a.ab.jc];
        L.bb.push(a);
        L.lb.splice(L.lb.indexOf(a), 1);
        L.Hb(a.ab);
        a.ab = void 0;
      },
      Gc: function () {},
      Xb: function (a, b) {
        a.onmessage = function (c) {
          var d = c.data,
            e = d.cmd;
          a.ab && (L.Gb = a.ab.threadInfoStruct);
          if (d.targetThread && d.targetThread != (ab | 0)) {
            var g = L.fb[d.sd];
            g
              ? g.worker.postMessage(c.data, d.transferList)
              : console.error(
                  'Internal error! Worker sent a message "' +
                    e +
                    '" to target pthread ' +
                    d.targetThread +
                    ', but that thread no longer exists!',
                );
          } else if ('processQueuedMainThreadWork' === e) jb();
          else if ('spawnThread' === e) kb(c.data);
          else if ('cleanupThread' === e) fb(d.thread);
          else if ('killThread' === e) {
            c = d.thread;
            if (D)
              throw 'Internal Error! killThread() can only ever be called from main application thread!';
            if (!c) throw 'Internal Error! Null pthread_ptr in killThread!';
            w()[(c + 12) >> 2] = 0;
            c = L.fb[c];
            c.worker.terminate();
            L.Hb(c);
            L.lb.splice(L.lb.indexOf(c.worker), 1);
            c.worker.ab = void 0;
          } else if ('cancelThread' === e) {
            c = d.thread;
            if (D)
              throw 'Internal Error! cancelThread() can only ever be called from main application thread!';
            if (!c) throw 'Internal Error! Null pthread_ptr in cancelThread!';
            L.fb[c].worker.postMessage({ cmd: 'cancel' });
          } else
            'loaded' === e
              ? ((a.loaded = !0), b && b(a), a.vb && (a.vb(), delete a.vb))
              : 'print' === e
              ? sa('Thread ' + d.threadId + ': ' + d.text)
              : 'printErr' === e
              ? G('Thread ' + d.threadId + ': ' + d.text)
              : 'alert' === e
              ? alert('Thread ' + d.threadId + ': ' + d.text)
              : 'exit' === e
              ? a.ab && Atomics.load(x(), (a.ab.jc + 68) >> 2) && L.Cb(a)
              : 'cancelDone' === e
              ? L.Cb(a)
              : 'objectTransfer' !== e &&
                ('setimmediate' === c.data.target
                  ? a.postMessage(c.data)
                  : G('worker sent an unknown command ' + e));
          L.Gb = void 0;
        };
        a.onerror = function (c) {
          G(
            'pthread sent an error! ' +
              c.filename +
              ':' +
              c.lineno +
              ': ' +
              c.message,
          );
        };
        a.postMessage({
          cmd: 'load',
          urlOrBlob: z.mainScriptUrlOrBlob || _scriptDir,
          wasmMemory: m,
          wasmModule: wa,
        });
      },
      Nb: function () {
        var a = qa('avif_enc_mt.worker.js');
        L.bb.push(new Worker(a));
      },
      qc: function () {
        0 == L.bb.length && (L.Nb(), L.Xb(L.bb[0]));
        return 0 < L.bb.length ? L.bb.pop() : null;
      },
      Wc: function (a) {
        for (a = performance.now() + a; performance.now() < a; );
      },
    };
    z.establishStackSpace = function (a) {
      P(a);
    };
    z.getNoExitRuntime = function () {
      return noExitRuntime;
    };
    var lb;
    lb = D
      ? function () {
          return performance.now() - z.__performance_now_clock_drift;
        }
      : function () {
          return performance.now();
        };
    function mb(a, b) {
      L.Eb.push(function () {
        J.get(a)(b);
      });
    }
    function nb(a, b) {
      for (var c = 0, d = a.length - 1; 0 <= d; d--) {
        var e = a[d];
        '.' === e
          ? a.splice(d, 1)
          : '..' === e
          ? (a.splice(d, 1), c++)
          : c && (a.splice(d, 1), c--);
      }
      if (b) for (; c; c--) a.unshift('..');
      return a;
    }
    function ob(a) {
      var b = '/' === a.charAt(0),
        c = '/' === a.substr(-1);
      (a = nb(
        a.split('/').filter(function (d) {
          return !!d;
        }),
        !b,
      ).join('/')) ||
        b ||
        (a = '.');
      a && c && (a += '/');
      return (b ? '/' : '') + a;
    }
    function pb(a) {
      var b = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/
        .exec(a)
        .slice(1);
      a = b[0];
      b = b[1];
      if (!a && !b) return '.';
      b && (b = b.substr(0, b.length - 1));
      return a + b;
    }
    function qb(a) {
      if ('/' === a) return '/';
      a = ob(a);
      a = a.replace(/\/$/, '');
      var b = a.lastIndexOf('/');
      return -1 === b ? a : a.substr(b + 1);
    }
    function rb() {
      if (
        'object' === typeof crypto &&
        'function' === typeof crypto.getRandomValues
      ) {
        var a = new Uint8Array(1);
        return function () {
          crypto.getRandomValues(a);
          return a[0];
        };
      }
      return function () {
        H('randomDevice');
      };
    }
    function sb() {
      for (var a = '', b = !1, c = arguments.length - 1; -1 <= c && !b; c--) {
        b = 0 <= c ? arguments[c] : '/';
        if ('string' !== typeof b)
          throw new TypeError('Arguments to path.resolve must be strings');
        if (!b) return '';
        a = b + '/' + a;
        b = '/' === b.charAt(0);
      }
      a = nb(
        a.split('/').filter(function (d) {
          return !!d;
        }),
        !b,
      ).join('/');
      return (b ? '/' : '') + a || '.';
    }
    var tb = [];
    function ub(a, b) {
      tb[a] = { input: [], Za: [], pb: b };
      vb(a, wb);
    }
    var wb = {
        open: function (a) {
          var b = tb[a.node.Bb];
          if (!b) throw new Q(43);
          a.Ya = b;
          a.seekable = !1;
        },
        close: function (a) {
          a.Ya.pb.flush(a.Ya);
        },
        flush: function (a) {
          a.Ya.pb.flush(a.Ya);
        },
        read: function (a, b, c, d) {
          if (!a.Ya || !a.Ya.pb.Vb) throw new Q(60);
          for (var e = 0, g = 0; g < d; g++) {
            try {
              var h = a.Ya.pb.Vb(a.Ya);
            } catch (k) {
              throw new Q(29);
            }
            if (void 0 === h && 0 === e) throw new Q(6);
            if (null === h || void 0 === h) break;
            e++;
            b[c + g] = h;
          }
          e && (a.node.timestamp = Date.now());
          return e;
        },
        write: function (a, b, c, d) {
          if (!a.Ya || !a.Ya.pb.Jb) throw new Q(60);
          try {
            for (var e = 0; e < d; e++) a.Ya.pb.Jb(a.Ya, b[c + e]);
          } catch (g) {
            throw new Q(29);
          }
          d && (a.node.timestamp = Date.now());
          return e;
        },
      },
      xb = {
        Vb: function (a) {
          if (!a.input.length) {
            var b = null;
            'undefined' != typeof window && 'function' == typeof window.prompt
              ? ((b = window.prompt('Input: ')), null !== b && (b += '\n'))
              : 'function' == typeof readline &&
                ((b = readline()), null !== b && (b += '\n'));
            if (!b) return null;
            var c = Array(Ca(b) + 1);
            b = Aa(b, c, 0, c.length);
            c.length = b;
            a.input = c;
          }
          return a.input.shift();
        },
        Jb: function (a, b) {
          null === b || 10 === b
            ? (sa(za(a.Za, 0)), (a.Za = []))
            : 0 != b && a.Za.push(b);
        },
        flush: function (a) {
          a.Za && 0 < a.Za.length && (sa(za(a.Za, 0)), (a.Za = []));
        },
      },
      yb = {
        Jb: function (a, b) {
          null === b || 10 === b
            ? (G(za(a.Za, 0)), (a.Za = []))
            : 0 != b && a.Za.push(b);
        },
        flush: function (a) {
          a.Za && 0 < a.Za.length && (G(za(a.Za, 0)), (a.Za = []));
        },
      },
      R = {
        cb: null,
        ib: function () {
          return R.createNode(null, '/', 16895, 0);
        },
        createNode: function (a, b, c, d) {
          if (24576 === (c & 61440) || 4096 === (c & 61440)) throw new Q(63);
          R.cb ||
            (R.cb = {
              dir: {
                node: {
                  kb: R.Va.kb,
                  gb: R.Va.gb,
                  tb: R.Va.tb,
                  zb: R.Va.zb,
                  dc: R.Va.dc,
                  kc: R.Va.kc,
                  ec: R.Va.ec,
                  cc: R.Va.cc,
                  Db: R.Va.Db,
                },
                stream: { nb: R.Wa.nb },
              },
              file: {
                node: { kb: R.Va.kb, gb: R.Va.gb },
                stream: {
                  nb: R.Wa.nb,
                  read: R.Wa.read,
                  write: R.Wa.write,
                  Mb: R.Wa.Mb,
                  Zb: R.Wa.Zb,
                  ac: R.Wa.ac,
                },
              },
              link: {
                node: { kb: R.Va.kb, gb: R.Va.gb, ub: R.Va.ub },
                stream: {},
              },
              Ob: { node: { kb: R.Va.kb, gb: R.Va.gb }, stream: zb },
            });
          c = Ab(a, b, c, d);
          16384 === (c.mode & 61440)
            ? ((c.Va = R.cb.dir.node), (c.Wa = R.cb.dir.stream), (c.Ua = {}))
            : 32768 === (c.mode & 61440)
            ? ((c.Va = R.cb.file.node),
              (c.Wa = R.cb.file.stream),
              (c.Xa = 0),
              (c.Ua = null))
            : 40960 === (c.mode & 61440)
            ? ((c.Va = R.cb.link.node), (c.Wa = R.cb.link.stream))
            : 8192 === (c.mode & 61440) &&
              ((c.Va = R.cb.Ob.node), (c.Wa = R.cb.Ob.stream));
          c.timestamp = Date.now();
          a && (a.Ua[b] = c);
          return c;
        },
        bd: function (a) {
          if (a.Ua && a.Ua.subarray) {
            for (var b = [], c = 0; c < a.Xa; ++c) b.push(a.Ua[c]);
            return b;
          }
          return a.Ua;
        },
        cd: function (a) {
          return a.Ua
            ? a.Ua.subarray
              ? a.Ua.subarray(0, a.Xa)
              : new Uint8Array(a.Ua)
            : new Uint8Array(0);
        },
        Rb: function (a, b) {
          var c = a.Ua ? a.Ua.length : 0;
          c >= b ||
            ((b = Math.max(b, (c * (1048576 > c ? 2 : 1.125)) >>> 0)),
            0 != c && (b = Math.max(b, 256)),
            (c = a.Ua),
            (a.Ua = new Uint8Array(b)),
            0 < a.Xa && a.Ua.set(c.subarray(0, a.Xa), 0));
        },
        Hc: function (a, b) {
          if (a.Xa != b)
            if (0 == b) (a.Ua = null), (a.Xa = 0);
            else {
              if (!a.Ua || a.Ua.subarray) {
                var c = a.Ua;
                a.Ua = new Uint8Array(b);
                c && a.Ua.set(c.subarray(0, Math.min(b, a.Xa)));
              } else if ((a.Ua || (a.Ua = []), a.Ua.length > b))
                a.Ua.length = b;
              else for (; a.Ua.length < b; ) a.Ua.push(0);
              a.Xa = b;
            }
        },
        Va: {
          kb: function (a) {
            var b = {};
            b.$c = 8192 === (a.mode & 61440) ? a.id : 1;
            b.fd = a.id;
            b.mode = a.mode;
            b.md = 1;
            b.uid = 0;
            b.dd = 0;
            b.Bb = a.Bb;
            16384 === (a.mode & 61440)
              ? (b.size = 4096)
              : 32768 === (a.mode & 61440)
              ? (b.size = a.Xa)
              : 40960 === (a.mode & 61440)
              ? (b.size = a.link.length)
              : (b.size = 0);
            b.Uc = new Date(a.timestamp);
            b.kd = new Date(a.timestamp);
            b.Zc = new Date(a.timestamp);
            b.mc = 4096;
            b.Vc = Math.ceil(b.size / b.mc);
            return b;
          },
          gb: function (a, b) {
            void 0 !== b.mode && (a.mode = b.mode);
            void 0 !== b.timestamp && (a.timestamp = b.timestamp);
            void 0 !== b.size && R.Hc(a, b.size);
          },
          tb: function () {
            throw Bb[44];
          },
          zb: function (a, b, c, d) {
            return R.createNode(a, b, c, d);
          },
          dc: function (a, b, c) {
            if (16384 === (a.mode & 61440)) {
              try {
                var d = Cb(b, c);
              } catch (g) {}
              if (d) for (var e in d.Ua) throw new Q(55);
            }
            delete a.parent.Ua[a.name];
            a.name = c;
            b.Ua[c] = a;
            a.parent = b;
          },
          kc: function (a, b) {
            delete a.Ua[b];
          },
          ec: function (a, b) {
            var c = Cb(a, b),
              d;
            for (d in c.Ua) throw new Q(55);
            delete a.Ua[b];
          },
          cc: function (a) {
            var b = ['.', '..'],
              c;
            for (c in a.Ua) a.Ua.hasOwnProperty(c) && b.push(c);
            return b;
          },
          Db: function (a, b, c) {
            a = R.createNode(a, b, 41471, 0);
            a.link = c;
            return a;
          },
          ub: function (a) {
            if (40960 !== (a.mode & 61440)) throw new Q(28);
            return a.link;
          },
        },
        Wa: {
          read: function (a, b, c, d, e) {
            var g = a.node.Ua;
            if (e >= a.node.Xa) return 0;
            a = Math.min(a.node.Xa - e, d);
            if (8 < a && g.subarray) b.set(g.subarray(e, e + a), c);
            else for (d = 0; d < a; d++) b[c + d] = g[e + d];
            return a;
          },
          write: function (a, b, c, d, e, g) {
            b.buffer === f().buffer && (g = !1);
            if (!d) return 0;
            a = a.node;
            a.timestamp = Date.now();
            if (b.subarray && (!a.Ua || a.Ua.subarray)) {
              if (g) return (a.Ua = b.subarray(c, c + d)), (a.Xa = d);
              if (0 === a.Xa && 0 === e)
                return (a.Ua = b.slice(c, c + d)), (a.Xa = d);
              if (e + d <= a.Xa) return a.Ua.set(b.subarray(c, c + d), e), d;
            }
            R.Rb(a, e + d);
            if (a.Ua.subarray && b.subarray) a.Ua.set(b.subarray(c, c + d), e);
            else for (g = 0; g < d; g++) a.Ua[e + g] = b[c + g];
            a.Xa = Math.max(a.Xa, e + d);
            return d;
          },
          nb: function (a, b, c) {
            1 === c
              ? (b += a.position)
              : 2 === c && 32768 === (a.node.mode & 61440) && (b += a.node.Xa);
            if (0 > b) throw new Q(28);
            return b;
          },
          Mb: function (a, b, c) {
            R.Rb(a.node, b + c);
            a.node.Xa = Math.max(a.node.Xa, b + c);
          },
          Zb: function (a, b, c, d, e, g) {
            ya(0 === b);
            if (32768 !== (a.node.mode & 61440)) throw new Q(43);
            a = a.node.Ua;
            if (g & 2 || a.buffer !== n) {
              if (0 < d || d + c < a.length)
                a.subarray
                  ? (a = a.subarray(d, d + c))
                  : (a = Array.prototype.slice.call(a, d, d + c));
              d = !0;
              g = 16384 * Math.ceil(c / 16384);
              for (b = M(g); c < g; ) f()[b + c++] = 0;
              c = b;
              if (!c) throw new Q(48);
              f().set(a, c);
            } else (d = !1), (c = a.byteOffset);
            return { qd: c, Tc: d };
          },
          ac: function (a, b, c, d, e) {
            if (32768 !== (a.node.mode & 61440)) throw new Q(43);
            if (e & 2) return 0;
            R.Wa.write(a, b, 0, d, c, !1);
            return 0;
          },
        },
      },
      Db = null,
      Eb = {},
      Fb = [],
      Gb = 1,
      Hb = null,
      Ib = !0,
      Jb = {},
      Q = null,
      Bb = {};
    function Kb(a, b) {
      a = sb('/', a);
      b = b || {};
      if (!a) return { path: '', node: null };
      var c = { Ub: !0, Kb: 0 },
        d;
      for (d in c) void 0 === b[d] && (b[d] = c[d]);
      if (8 < b.Kb) throw new Q(32);
      a = nb(
        a.split('/').filter(function (h) {
          return !!h;
        }),
        !1,
      );
      var e = Db;
      c = '/';
      for (d = 0; d < a.length; d++) {
        var g = d === a.length - 1;
        if (g && b.parent) break;
        e = Cb(e, a[d]);
        c = ob(c + '/' + a[d]);
        e.Ab && (!g || (g && b.Ub)) && (e = e.Ab.root);
        if (!g || b.Tb)
          for (g = 0; 40960 === (e.mode & 61440); )
            if (
              ((e = Lb(c)),
              (c = sb(pb(c), e)),
              (e = Kb(c, { Kb: b.Kb }).node),
              40 < g++)
            )
              throw new Q(32);
      }
      return { path: c, node: e };
    }
    function Mb(a) {
      for (var b; ; ) {
        if (a === a.parent)
          return (
            (a = a.ib.$b),
            b ? ('/' !== a[a.length - 1] ? a + '/' + b : a + b) : a
          );
        b = b ? a.name + '/' + b : a.name;
        a = a.parent;
      }
    }
    function Nb(a, b) {
      for (var c = 0, d = 0; d < b.length; d++)
        c = ((c << 5) - c + b.charCodeAt(d)) | 0;
      return ((a + c) >>> 0) % Hb.length;
    }
    function Cb(a, b) {
      var c;
      if ((c = (c = Ob(a, 'x')) ? c : a.Va.tb ? 0 : 2)) throw new Q(c, a);
      for (c = Hb[Nb(a.id, b)]; c; c = c.Cc) {
        var d = c.name;
        if (c.parent.id === a.id && d === b) return c;
      }
      return a.Va.tb(a, b);
    }
    function Ab(a, b, c, d) {
      a = new Pb(a, b, c, d);
      b = Nb(a.parent.id, a.name);
      a.Cc = Hb[b];
      return (Hb[b] = a);
    }
    var Qb = {
      r: 0,
      rs: 1052672,
      'r+': 2,
      w: 577,
      wx: 705,
      xw: 705,
      'w+': 578,
      'wx+': 706,
      'xw+': 706,
      a: 1089,
      ax: 1217,
      xa: 1217,
      'a+': 1090,
      'ax+': 1218,
      'xa+': 1218,
    };
    function Rb(a) {
      var b = ['r', 'w', 'rw'][a & 3];
      a & 512 && (b += 'w');
      return b;
    }
    function Ob(a, b) {
      if (Ib) return 0;
      if (-1 === b.indexOf('r') || a.mode & 292) {
        if (
          (-1 !== b.indexOf('w') && !(a.mode & 146)) ||
          (-1 !== b.indexOf('x') && !(a.mode & 73))
        )
          return 2;
      } else return 2;
      return 0;
    }
    function Sb(a, b) {
      try {
        return Cb(a, b), 20;
      } catch (c) {}
      return Ob(a, 'wx');
    }
    function Tb(a) {
      var b = 4096;
      for (a = a || 0; a <= b; a++) if (!Fb[a]) return a;
      throw new Q(33);
    }
    function Ub(a, b) {
      Vb || ((Vb = function () {}), (Vb.prototype = {}));
      var c = new Vb(),
        d;
      for (d in a) c[d] = a[d];
      a = c;
      b = Tb(b);
      a.jb = b;
      return (Fb[b] = a);
    }
    var zb = {
      open: function (a) {
        a.Wa = Eb[a.node.Bb].Wa;
        a.Wa.open && a.Wa.open(a);
      },
      nb: function () {
        throw new Q(70);
      },
    };
    function vb(a, b) {
      Eb[a] = { Wa: b };
    }
    function Wb(a, b) {
      var c = '/' === b,
        d = !b;
      if (c && Db) throw new Q(10);
      if (!c && !d) {
        var e = Kb(b, { Ub: !1 });
        b = e.path;
        e = e.node;
        if (e.Ab) throw new Q(10);
        if (16384 !== (e.mode & 61440)) throw new Q(54);
      }
      b = { type: a, od: {}, $b: b, Bc: [] };
      a = a.ib(b);
      a.ib = b;
      b.root = a;
      c ? (Db = a) : e && ((e.Ab = b), e.ib && e.ib.Bc.push(b));
    }
    function Xb(a, b, c) {
      var d = Kb(a, { parent: !0 }).node;
      a = qb(a);
      if (!a || '.' === a || '..' === a) throw new Q(28);
      var e = Sb(d, a);
      if (e) throw new Q(e);
      if (!d.Va.zb) throw new Q(63);
      return d.Va.zb(d, a, b, c);
    }
    function S(a) {
      Xb(a, 16895, 0);
    }
    function Yb(a, b, c) {
      'undefined' === typeof c && ((c = b), (b = 438));
      Xb(a, b | 8192, c);
    }
    function Zb(a, b) {
      if (!sb(a)) throw new Q(44);
      var c = Kb(b, { parent: !0 }).node;
      if (!c) throw new Q(44);
      b = qb(b);
      var d = Sb(c, b);
      if (d) throw new Q(d);
      if (!c.Va.Db) throw new Q(63);
      c.Va.Db(c, b, a);
    }
    function Lb(a) {
      a = Kb(a).node;
      if (!a) throw new Q(44);
      if (!a.Va.ub) throw new Q(28);
      return sb(Mb(a.parent), a.Va.ub(a));
    }
    function $b(a, b, c, d) {
      if ('' === a) throw new Q(44);
      if ('string' === typeof b) {
        var e = Qb[b];
        if ('undefined' === typeof e)
          throw Error('Unknown file open mode: ' + b);
        b = e;
      }
      c = b & 64 ? (('undefined' === typeof c ? 438 : c) & 4095) | 32768 : 0;
      if ('object' === typeof a) var g = a;
      else {
        a = ob(a);
        try {
          g = Kb(a, { Tb: !(b & 131072) }).node;
        } catch (k) {}
      }
      e = !1;
      if (b & 64)
        if (g) {
          if (b & 128) throw new Q(20);
        } else (g = Xb(a, c, 0)), (e = !0);
      if (!g) throw new Q(44);
      8192 === (g.mode & 61440) && (b &= -513);
      if (b & 65536 && 16384 !== (g.mode & 61440)) throw new Q(54);
      if (
        !e &&
        (c = g
          ? 40960 === (g.mode & 61440)
            ? 32
            : 16384 === (g.mode & 61440) && ('r' !== Rb(b) || b & 512)
            ? 31
            : Ob(g, Rb(b))
          : 44)
      )
        throw new Q(c);
      if (b & 512) {
        c = g;
        var h;
        'string' === typeof c ? (h = Kb(c, { Tb: !0 }).node) : (h = c);
        if (!h.Va.gb) throw new Q(63);
        if (16384 === (h.mode & 61440)) throw new Q(31);
        if (32768 !== (h.mode & 61440)) throw new Q(28);
        if ((c = Ob(h, 'w'))) throw new Q(c);
        h.Va.gb(h, { size: 0, timestamp: Date.now() });
      }
      b &= -131713;
      d = Ub(
        {
          node: g,
          path: Mb(g),
          flags: b,
          seekable: !0,
          position: 0,
          Wa: g.Wa,
          Rc: [],
          error: !1,
        },
        d,
      );
      d.Wa.open && d.Wa.open(d);
      !z.logReadFiles ||
        b & 1 ||
        (ac || (ac = {}),
        a in ac ||
          ((ac[a] = 1), G('FS.trackingDelegate error on read file: ' + a)));
      try {
        Jb.onOpenFile &&
          ((g = 0),
          1 !== (b & 2097155) && (g |= 1),
          0 !== (b & 2097155) && (g |= 2),
          Jb.onOpenFile(a, g));
      } catch (k) {
        G(
          "FS.trackingDelegate['onOpenFile']('" +
            a +
            "', flags) threw an exception: " +
            k.message,
        );
      }
      return d;
    }
    function bc(a, b, c) {
      if (null === a.jb) throw new Q(8);
      if (!a.seekable || !a.Wa.nb) throw new Q(70);
      if (0 != c && 1 != c && 2 != c) throw new Q(28);
      a.position = a.Wa.nb(a, b, c);
      a.Rc = [];
    }
    function cc() {
      Q ||
        ((Q = function (a, b) {
          this.node = b;
          this.Ic = function (c) {
            this.mb = c;
          };
          this.Ic(a);
          this.message = 'FS error';
        }),
        (Q.prototype = Error()),
        (Q.prototype.constructor = Q),
        [44].forEach(function (a) {
          Bb[a] = new Q(a);
          Bb[a].stack = '<generic error, no stack>';
        }));
    }
    var dc;
    function ec(a, b) {
      var c = 0;
      a && (c |= 365);
      b && (c |= 146);
      return c;
    }
    function fc(a, b, c) {
      a = ob('/dev/' + a);
      var d = ec(!!b, !!c);
      gc || (gc = 64);
      var e = (gc++ << 8) | 0;
      vb(e, {
        open: function (g) {
          g.seekable = !1;
        },
        close: function () {
          c && c.buffer && c.buffer.length && c(10);
        },
        read: function (g, h, k, l) {
          for (var q = 0, r = 0; r < l; r++) {
            try {
              var v = b();
            } catch (y) {
              throw new Q(29);
            }
            if (void 0 === v && 0 === q) throw new Q(6);
            if (null === v || void 0 === v) break;
            q++;
            h[k + r] = v;
          }
          q && (g.node.timestamp = Date.now());
          return q;
        },
        write: function (g, h, k, l) {
          for (var q = 0; q < l; q++)
            try {
              c(h[k + q]);
            } catch (r) {
              throw new Q(29);
            }
          l && (g.node.timestamp = Date.now());
          return q;
        },
      });
      Yb(a, d, e);
    }
    var gc,
      hc = {},
      Vb,
      ac,
      ic = void 0;
    function jc() {
      ic += 4;
      return w()[(ic - 4) >> 2];
    }
    function kc(a) {
      a = Fb[a];
      if (!a) throw new Q(8);
      return a;
    }
    function lc(a, b, c) {
      if (D) return T(1, 1, a, b, c);
      ic = c;
      try {
        var d = kc(a);
        switch (b) {
          case 0:
            var e = jc();
            return 0 > e ? -28 : $b(d.path, d.flags, 0, e).jb;
          case 1:
          case 2:
            return 0;
          case 3:
            return d.flags;
          case 4:
            return (e = jc()), (d.flags |= e), 0;
          case 12:
            return (e = jc()), (ca()[(e + 0) >> 1] = 2), 0;
          case 13:
          case 14:
            return 0;
          case 16:
          case 8:
            return -28;
          case 9:
            return (w()[mc() >> 2] = 28), -1;
          default:
            return -28;
        }
      } catch (g) {
        return ('undefined' !== typeof hc && g instanceof Q) || H(g), -g.mb;
      }
    }
    function nc(a, b, c) {
      if (D) return T(2, 1, a, b, c);
      ic = c;
      try {
        var d = kc(a);
        switch (b) {
          case 21509:
          case 21505:
            return d.Ya ? 0 : -59;
          case 21510:
          case 21511:
          case 21512:
          case 21506:
          case 21507:
          case 21508:
            return d.Ya ? 0 : -59;
          case 21519:
            if (!d.Ya) return -59;
            var e = jc();
            return (w()[e >> 2] = 0);
          case 21520:
            return d.Ya ? -28 : -59;
          case 21531:
            a = e = jc();
            if (!d.Wa.zc) throw new Q(59);
            return d.Wa.zc(d, b, a);
          case 21523:
            return d.Ya ? 0 : -59;
          case 21524:
            return d.Ya ? 0 : -59;
          default:
            H('bad ioctl syscall ' + b);
        }
      } catch (g) {
        return ('undefined' !== typeof hc && g instanceof Q) || H(g), -g.mb;
      }
    }
    function oc(a, b, c) {
      if (D) return T(3, 1, a, b, c);
      ic = c;
      try {
        var d = I(a),
          e = jc();
        return $b(d, b, e).jb;
      } catch (g) {
        return ('undefined' !== typeof hc && g instanceof Q) || H(g), -g.mb;
      }
    }
    var pc = {};
    function qc(a) {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    }
    function rc(a) {
      return this.fromWireType(x()[a >> 2]);
    }
    var sc = {},
      tc = {},
      uc = {};
    function vc(a) {
      if (void 0 === a) return '_unknown';
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return 48 <= b && 57 >= b ? '_' + a : a;
    }
    function wc(a, b) {
      a = vc(a);
      return new Function(
        'body',
        'return function ' +
          a +
          '() {\n    "use strict";    return body.apply(this, arguments);\n};\n',
      )(b);
    }
    function xc(a) {
      var b = Error,
        c = wc(a, function (d) {
          this.name = a;
          this.message = d;
          d = Error(d).stack;
          void 0 !== d &&
            (this.stack =
              this.toString() + '\n' + d.replace(/^Error(:[^\n]*)?\n/, ''));
        });
      c.prototype = Object.create(b.prototype);
      c.prototype.constructor = c;
      c.prototype.toString = function () {
        return void 0 === this.message
          ? this.name
          : this.name + ': ' + this.message;
      };
      return c;
    }
    var yc = void 0;
    function zc(a, b, c) {
      function d(k) {
        k = c(k);
        if (k.length !== a.length)
          throw new yc('Mismatched type converter count');
        for (var l = 0; l < a.length; ++l) U(a[l], k[l]);
      }
      a.forEach(function (k) {
        uc[k] = b;
      });
      var e = Array(b.length),
        g = [],
        h = 0;
      b.forEach(function (k, l) {
        tc.hasOwnProperty(k)
          ? (e[l] = tc[k])
          : (g.push(k),
            sc.hasOwnProperty(k) || (sc[k] = []),
            sc[k].push(function () {
              e[l] = tc[k];
              ++h;
              h === g.length && d(e);
            }));
      });
      0 === g.length && d(e);
    }
    function Ac(a) {
      switch (a) {
        case 1:
          return 0;
        case 2:
          return 1;
        case 4:
          return 2;
        case 8:
          return 3;
        default:
          throw new TypeError('Unknown type size: ' + a);
      }
    }
    var Bc = void 0;
    function V(a) {
      for (var b = ''; t()[a]; ) b += Bc[t()[a++]];
      return b;
    }
    var Cc = void 0;
    function W(a) {
      throw new Cc(a);
    }
    function U(a, b, c) {
      c = c || {};
      if (!('argPackAdvance' in b))
        throw new TypeError(
          'registerType registeredInstance requires argPackAdvance',
        );
      var d = b.name;
      a || W('type "' + d + '" must have a positive integer typeid pointer');
      if (tc.hasOwnProperty(a)) {
        if (c.uc) return;
        W("Cannot register type '" + d + "' twice");
      }
      tc[a] = b;
      delete uc[a];
      sc.hasOwnProperty(a) &&
        ((b = sc[a]),
        delete sc[a],
        b.forEach(function (e) {
          e();
        }));
    }
    var Dc = [],
      X = [
        {},
        { value: void 0 },
        { value: null },
        { value: !0 },
        { value: !1 },
      ];
    function Ec(a) {
      4 < a && 0 === --X[a].Lb && ((X[a] = void 0), Dc.push(a));
    }
    function Fc(a) {
      switch (a) {
        case void 0:
          return 1;
        case null:
          return 2;
        case !0:
          return 3;
        case !1:
          return 4;
        default:
          var b = Dc.length ? Dc.pop() : X.length;
          X[b] = { Lb: 1, value: a };
          return b;
      }
    }
    function Gc(a) {
      if (null === a) return 'null';
      var b = typeof a;
      return 'object' === b || 'array' === b || 'function' === b
        ? a.toString()
        : '' + a;
    }
    function Hc(a, b) {
      switch (b) {
        case 2:
          return function (c) {
            return this.fromWireType(ja()[c >> 2]);
          };
        case 3:
          return function (c) {
            return this.fromWireType(la()[c >> 3]);
          };
        default:
          throw new TypeError('Unknown float type: ' + a);
      }
    }
    function Ic(a) {
      var b = Function;
      if (!(b instanceof Function))
        throw new TypeError(
          'new_ called with constructor type ' +
            typeof b +
            ' which is not a function',
        );
      var c = wc(b.name || 'unknownFunctionName', function () {});
      c.prototype = b.prototype;
      c = new c();
      a = b.apply(c, a);
      return a instanceof Object ? a : c;
    }
    function Jc(a, b) {
      var c = z;
      if (void 0 === c[a].eb) {
        var d = c[a];
        c[a] = function () {
          c[a].eb.hasOwnProperty(arguments.length) ||
            W(
              "Function '" +
                b +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ') - expects one of (' +
                c[a].eb +
                ')!',
            );
          return c[a].eb[arguments.length].apply(this, arguments);
        };
        c[a].eb = [];
        c[a].eb[d.lc] = d;
      }
    }
    function Kc(a, b, c) {
      z.hasOwnProperty(a)
        ? ((void 0 === c || (void 0 !== z[a].eb && void 0 !== z[a].eb[c])) &&
            W("Cannot register public name '" + a + "' twice"),
          Jc(a, a),
          z.hasOwnProperty(c) &&
            W(
              'Cannot register multiple overloads of a function with the same number of arguments (' +
                c +
                ')!',
            ),
          (z[a].eb[c] = b))
        : ((z[a] = b), void 0 !== c && (z[a].nd = c));
    }
    function Lc(a, b) {
      for (var c = [], d = 0; d < a; d++) c.push(w()[(b >> 2) + d]);
      return c;
    }
    function Mc(a, b) {
      ya(
        0 <= a.indexOf('j'),
        'getDynCaller should only be called with i64 sigs',
      );
      var c = [];
      return function () {
        c.length = arguments.length;
        for (var d = 0; d < arguments.length; d++) c[d] = arguments[d];
        return $a(a, b, c);
      };
    }
    function Nc(a, b) {
      a = V(a);
      var c = -1 != a.indexOf('j') ? Mc(a, b) : J.get(b);
      'function' !== typeof c &&
        W('unknown function pointer with signature ' + a + ': ' + b);
      return c;
    }
    var Oc = void 0;
    function Pc(a) {
      a = Qc(a);
      var b = V(a);
      O(a);
      return b;
    }
    function Rc(a, b) {
      function c(g) {
        e[g] || tc[g] || (uc[g] ? uc[g].forEach(c) : (d.push(g), (e[g] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new Oc(a + ': ' + d.map(Pc).join([', ']));
    }
    function Sc(a, b, c) {
      switch (b) {
        case 0:
          return c
            ? function (d) {
                return f()[d];
              }
            : function (d) {
                return t()[d];
              };
        case 1:
          return c
            ? function (d) {
                return ca()[d >> 1];
              }
            : function (d) {
                return ea()[d >> 1];
              };
        case 2:
          return c
            ? function (d) {
                return w()[d >> 2];
              }
            : function (d) {
                return x()[d >> 2];
              };
        default:
          throw new TypeError('Unknown integer type: ' + a);
      }
    }
    var Tc = {};
    function Uc() {
      return 'object' === typeof globalThis
        ? globalThis
        : Function('return this')();
    }
    function Vc(a, b) {
      var c = tc[a];
      void 0 === c && W(b + ' has unknown type ' + Pc(a));
      return c;
    }
    var Wc = {};
    function Xc(a, b, c) {
      if (0 >= a || a > f().length || a & 1) return -28;
      a = Atomics.wait(w(), a >> 2, b, c);
      if ('timed-out' === a) return -73;
      if ('not-equal' === a) return -6;
      if ('ok' === a) return 0;
      throw 'Atomics.wait returned an unexpected value ' + a;
    }
    function T(a, b) {
      for (
        var c = arguments.length - 2, d = Y(), e = Yc(8 * c), g = e >> 3, h = 0;
        h < c;
        h++
      )
        la()[g + h] = arguments[2 + h];
      c = Zc(a, c, e, b);
      P(d);
      return c;
    }
    var $c = [],
      ad = [],
      bd = [
        0,
        'undefined' !== typeof document ? document : 0,
        'undefined' !== typeof window ? window : 0,
      ];
    function cd(a) {
      a = 2 < a ? I(a) : a;
      return (
        bd[a] ||
        ('undefined' !== typeof document ? document.querySelector(a) : void 0)
      );
    }
    function dd(a, b, c) {
      var d = cd(a);
      if (!d) return -4;
      d.yb && ((w()[d.yb >> 2] = b), (w()[(d.yb + 4) >> 2] = c));
      if (d.bc || !d.Yc)
        d.bc && (d = d.bc),
          (a = !1),
          d.xb &&
            d.xb.wb &&
            ((a = d.xb.wb.getParameter(2978)),
            (a =
              0 === a[0] &&
              0 === a[1] &&
              a[2] === d.width &&
              a[3] === d.height)),
          (d.width = b),
          (d.height = c),
          a && d.xb.wb.viewport(0, 0, b, c);
      else {
        if (d.yb) {
          d = w()[(d.yb + 8) >> 2];
          a = a ? I(a) : '';
          var e = Y(),
            g = Yc(12),
            h = 0;
          if (a) {
            h = Ca(a) + 1;
            var k = M(h);
            Ba(a, k, h);
            h = k;
          }
          w()[g >> 2] = h;
          w()[(g + 4) >> 2] = b;
          w()[(g + 8) >> 2] = c;
          ed(0, d, 657457152, 0, h, g);
          P(e);
          return 1;
        }
        return -4;
      }
      return 0;
    }
    function fd(a, b, c) {
      return D ? T(4, 1, a, b, c) : dd(a, b, c);
    }
    function gd(a) {
      var b = a.getExtension('ANGLE_instanced_arrays');
      b &&
        ((a.vertexAttribDivisor = function (c, d) {
          b.vertexAttribDivisorANGLE(c, d);
        }),
        (a.drawArraysInstanced = function (c, d, e, g) {
          b.drawArraysInstancedANGLE(c, d, e, g);
        }),
        (a.drawElementsInstanced = function (c, d, e, g, h) {
          b.drawElementsInstancedANGLE(c, d, e, g, h);
        }));
    }
    function hd(a) {
      var b = a.getExtension('OES_vertex_array_object');
      b &&
        ((a.createVertexArray = function () {
          return b.createVertexArrayOES();
        }),
        (a.deleteVertexArray = function (c) {
          b.deleteVertexArrayOES(c);
        }),
        (a.bindVertexArray = function (c) {
          b.bindVertexArrayOES(c);
        }),
        (a.isVertexArray = function (c) {
          return b.isVertexArrayOES(c);
        }));
    }
    function id(a) {
      var b = a.getExtension('WEBGL_draw_buffers');
      b &&
        (a.drawBuffers = function (c, d) {
          b.drawBuffersWEBGL(c, d);
        });
    }
    function jd(a) {
      a || (a = kd);
      if (!a.vc) {
        a.vc = !0;
        var b = a.wb;
        gd(b);
        hd(b);
        id(b);
        b.ad = b.getExtension('EXT_disjoint_timer_query');
        b.ld = b.getExtension('WEBGL_multi_draw');
        var c = 'OES_texture_float OES_texture_half_float OES_standard_derivatives OES_vertex_array_object WEBGL_compressed_texture_s3tc WEBGL_depth_texture OES_element_index_uint EXT_texture_filter_anisotropic EXT_frag_depth WEBGL_draw_buffers ANGLE_instanced_arrays OES_texture_float_linear OES_texture_half_float_linear EXT_blend_minmax EXT_shader_texture_lod EXT_texture_norm16 WEBGL_compressed_texture_pvrtc EXT_color_buffer_half_float WEBGL_color_buffer_float EXT_sRGB WEBGL_compressed_texture_etc1 EXT_disjoint_timer_query WEBGL_compressed_texture_etc WEBGL_compressed_texture_astc EXT_color_buffer_float WEBGL_compressed_texture_s3tc_srgb EXT_disjoint_timer_query_webgl2 WEBKIT_WEBGL_compressed_texture_pvrtc'.split(
          ' ',
        );
        (b.getSupportedExtensions() || []).forEach(function (d) {
          -1 != c.indexOf(d) && b.getExtension(d);
        });
      }
    }
    var kd,
      ld = ['default', 'low-power', 'high-performance'];
    function md(a) {
      if (D) return T(5, 1, a);
      try {
        var b = kc(a);
        if (null === b.jb) throw new Q(8);
        b.Ib && (b.Ib = null);
        try {
          b.Wa.close && b.Wa.close(b);
        } catch (c) {
          throw c;
        } finally {
          Fb[b.jb] = null;
        }
        b.jb = null;
        return 0;
      } catch (c) {
        return ('undefined' !== typeof hc && c instanceof Q) || H(c), c.mb;
      }
    }
    function nd(a, b, c, d) {
      if (D) return T(6, 1, a, b, c, d);
      try {
        a: {
          for (var e = kc(a), g = (a = 0); g < c; g++) {
            var h = w()[(b + 8 * g) >> 2],
              k = w()[(b + (8 * g + 4)) >> 2],
              l = e,
              q = f(),
              r = h,
              v = k,
              y = void 0;
            if (0 > v || 0 > y) throw new Q(28);
            if (null === l.jb) throw new Q(8);
            if (1 === (l.flags & 2097155)) throw new Q(8);
            if (16384 === (l.node.mode & 61440)) throw new Q(31);
            if (!l.Wa.read) throw new Q(28);
            var B = 'undefined' !== typeof y;
            if (!B) y = l.position;
            else if (!l.seekable) throw new Q(70);
            var u = l.Wa.read(l, q, r, v, y);
            B || (l.position += u);
            var N = u;
            if (0 > N) {
              var E = -1;
              break a;
            }
            a += N;
            if (N < k) break;
          }
          E = a;
        }
        w()[d >> 2] = E;
        return 0;
      } catch (C) {
        return ('undefined' !== typeof hc && C instanceof Q) || H(C), C.mb;
      }
    }
    function od(a, b, c, d, e) {
      if (D) return T(7, 1, a, b, c, d, e);
      try {
        var g = kc(a);
        a = 4294967296 * c + (b >>> 0);
        if (-9007199254740992 >= a || 9007199254740992 <= a) return -61;
        bc(g, a, d);
        Wa = [
          g.position >>> 0,
          ((Va = g.position),
          1 <= +Math.abs(Va)
            ? 0 < Va
              ? (Math.min(+Math.floor(Va / 4294967296), 4294967295) | 0) >>> 0
              : ~~+Math.ceil((Va - +(~~Va >>> 0)) / 4294967296) >>> 0
            : 0),
        ];
        w()[e >> 2] = Wa[0];
        w()[(e + 4) >> 2] = Wa[1];
        g.Ib && 0 === a && 0 === d && (g.Ib = null);
        return 0;
      } catch (h) {
        return ('undefined' !== typeof hc && h instanceof Q) || H(h), h.mb;
      }
    }
    function pd(a, b, c, d) {
      if (D) return T(8, 1, a, b, c, d);
      try {
        a: {
          for (var e = kc(a), g = (a = 0); g < c; g++) {
            var h = w()[(b + 8 * g) >> 2],
              k = w()[(b + (8 * g + 4)) >> 2],
              l = e,
              q = f(),
              r = h,
              v = k,
              y = void 0;
            if (0 > v || 0 > y) throw new Q(28);
            if (null === l.jb) throw new Q(8);
            if (0 === (l.flags & 2097155)) throw new Q(8);
            if (16384 === (l.node.mode & 61440)) throw new Q(31);
            if (!l.Wa.write) throw new Q(28);
            l.seekable && l.flags & 1024 && bc(l, 0, 2);
            var B = 'undefined' !== typeof y;
            if (!B) y = l.position;
            else if (!l.seekable) throw new Q(70);
            var u = l.Wa.write(l, q, r, v, y, void 0);
            B || (l.position += u);
            try {
              if (l.path && Jb.onWriteToFile) Jb.onWriteToFile(l.path);
            } catch (C) {
              G(
                "FS.trackingDelegate['onWriteToFile']('" +
                  l.path +
                  "') threw an exception: " +
                  C.message,
              );
            }
            var N = u;
            if (0 > N) {
              var E = -1;
              break a;
            }
            a += N;
          }
          E = a;
        }
        w()[d >> 2] = E;
        return 0;
      } catch (C) {
        return ('undefined' !== typeof hc && C instanceof Q) || H(C), C.mb;
      }
    }
    function kb(a) {
      if (D)
        throw 'Internal Error! spawnThread() can only ever be called from main application thread!';
      var b = L.qc();
      if (void 0 !== b.ab) throw 'Internal error!';
      if (!a.qb) throw 'Internal error, no pthread ptr!';
      L.lb.push(b);
      for (var c = M(512), d = 0; 128 > d; ++d) w()[(c + 4 * d) >> 2] = 0;
      var e = a.ob + a.rb;
      d = L.fb[a.qb] = {
        worker: b,
        ob: a.ob,
        rb: a.rb,
        Fb: a.Fb,
        jc: a.qb,
        threadInfoStruct: a.qb,
      };
      var g = d.threadInfoStruct >> 2;
      Atomics.store(x(), g, 0);
      Atomics.store(x(), g + 1, 0);
      Atomics.store(x(), g + 2, 0);
      Atomics.store(x(), g + 17, a.Pb);
      Atomics.store(x(), g + 26, c);
      Atomics.store(x(), g + 12, 0);
      Atomics.store(x(), g + 10, d.threadInfoStruct);
      Atomics.store(x(), g + 11, 42);
      Atomics.store(x(), g + 27, a.rb);
      Atomics.store(x(), g + 21, a.rb);
      Atomics.store(x(), g + 20, e);
      Atomics.store(x(), g + 29, e);
      Atomics.store(x(), g + 30, a.Pb);
      Atomics.store(x(), g + 32, a.hc);
      Atomics.store(x(), g + 33, a.ic);
      c = qd() + 40;
      Atomics.store(x(), g + 44, c);
      b.ab = d;
      var h = {
        cmd: 'run',
        start_routine: a.Nc,
        arg: a.sb,
        threadInfoStruct: a.qb,
        selfThreadId: a.qb,
        parentThreadId: a.Dc,
        stackBase: a.ob,
        stackSize: a.rb,
      };
      b.vb = function () {
        h.time = performance.now();
        b.postMessage(h, a.Qc);
      };
      b.loaded && (b.vb(), delete b.vb);
    }
    function rd() {
      return ab | 0;
    }
    z._pthread_self = rd;
    function sd(a, b) {
      if (!a) return G('pthread_join attempted on a null thread pointer!'), 71;
      if (D && selfThreadId == a)
        return G('PThread ' + a + ' is attempting to join to itself!'), 16;
      if (!D && L.$a == a)
        return G('Main thread ' + a + ' is attempting to join to itself!'), 16;
      if (w()[(a + 12) >> 2] !== a)
        return (
          G(
            'pthread_join attempted on thread ' +
              a +
              ', which does not point to a valid thread, or does not exist anymore!',
          ),
          71
        );
      if (Atomics.load(x(), (a + 68) >> 2))
        return (
          G('Attempted to join thread ' + a + ', which was already detached!'),
          28
        );
      for (;;) {
        var c = Atomics.load(x(), (a + 0) >> 2);
        if (1 == c)
          return (
            (c = Atomics.load(x(), (a + 4) >> 2)),
            b && (w()[b >> 2] = c),
            Atomics.store(x(), (a + 68) >> 2, 1),
            D ? postMessage({ cmd: 'cleanupThread', thread: a }) : fb(a),
            0
          );
        if (
          D &&
          threadInfoStruct &&
          !Atomics.load(x(), (threadInfoStruct + 60) >> 2) &&
          2 == Atomics.load(x(), (threadInfoStruct + 0) >> 2)
        )
          throw 'Canceled!';
        D || jb();
        Xc(a + 0, c, D ? 100 : 1);
      }
    }
    D || L.wc();
    function Pb(a, b, c, d) {
      a || (a = this);
      this.parent = a;
      this.ib = a.ib;
      this.Ab = null;
      this.id = Gb++;
      this.name = b;
      this.mode = c;
      this.Va = {};
      this.Wa = {};
      this.Bb = d;
    }
    Object.defineProperties(Pb.prototype, {
      read: {
        get: function () {
          return 365 === (this.mode & 365);
        },
        set: function (a) {
          a ? (this.mode |= 365) : (this.mode &= -366);
        },
      },
      write: {
        get: function () {
          return 146 === (this.mode & 146);
        },
        set: function (a) {
          a ? (this.mode |= 146) : (this.mode &= -147);
        },
      },
    });
    cc();
    Hb = Array(4096);
    Wb(R, '/');
    S('/tmp');
    S('/home');
    S('/home/web_user');
    (function () {
      S('/dev');
      vb(259, {
        read: function () {
          return 0;
        },
        write: function (b, c, d, e) {
          return e;
        },
      });
      Yb('/dev/null', 259);
      ub(1280, xb);
      ub(1536, yb);
      Yb('/dev/tty', 1280);
      Yb('/dev/tty1', 1536);
      var a = rb();
      fc('random', a);
      fc('urandom', a);
      S('/dev/shm');
      S('/dev/shm/tmp');
    })();
    S('/proc');
    S('/proc/self');
    S('/proc/self/fd');
    Wb(
      {
        ib: function () {
          var a = Ab('/proc/self', 'fd', 16895, 73);
          a.Va = {
            tb: function (b, c) {
              var d = Fb[+c];
              if (!d) throw new Q(8);
              b = {
                parent: null,
                ib: { $b: 'fake' },
                Va: {
                  ub: function () {
                    return d.path;
                  },
                },
              };
              return (b.parent = b);
            },
          };
          return a;
        },
      },
      '/proc/self/fd',
    );
    yc = z.InternalError = xc('InternalError');
    for (var td = Array(256), ud = 0; 256 > ud; ++ud)
      td[ud] = String.fromCharCode(ud);
    Bc = td;
    Cc = z.BindingError = xc('BindingError');
    z.count_emval_handles = function () {
      for (var a = 0, b = 5; b < X.length; ++b) void 0 !== X[b] && ++a;
      return a;
    };
    z.get_first_emval = function () {
      for (var a = 5; a < X.length; ++a) if (void 0 !== X[a]) return X[a];
      return null;
    };
    Oc = z.UnboundTypeError = xc('UnboundTypeError');
    var vd = [null, lc, nc, oc, fd, md, nd, od, pd];
    D ||
      La.push({
        pc: function () {
          wd();
        },
      });
    var Gd = {
      m: function (a, b, c, d) {
        H(
          'Assertion failed: ' +
            I(a) +
            ', at: ' +
            [b ? I(b) : 'unknown filename', c, d ? I(d) : 'unknown function'],
        );
      },
      fa: function (a, b) {
        return mb(a, b);
      },
      C: lc,
      Y: nc,
      Z: oc,
      K: function (a) {
        var b = pc[a];
        delete pc[a];
        var c = b.Ec,
          d = b.Fc,
          e = b.Sb,
          g = e
            .map(function (h) {
              return h.tc;
            })
            .concat(
              e.map(function (h) {
                return h.Lc;
              }),
            );
        zc([a], g, function (h) {
          var k = {};
          e.forEach(function (l, q) {
            var r = h[q],
              v = l.rc,
              y = l.sc,
              B = h[q + e.length],
              u = l.Kc,
              N = l.Mc;
            k[l.oc] = {
              read: function (E) {
                return r.fromWireType(v(y, E));
              },
              write: function (E, C) {
                var va = [];
                u(N, E, B.toWireType(va, C));
                qc(va);
              },
            };
          });
          return [
            {
              name: b.name,
              fromWireType: function (l) {
                var q = {},
                  r;
                for (r in k) q[r] = k[r].read(l);
                d(l);
                return q;
              },
              toWireType: function (l, q) {
                for (var r in k)
                  if (!(r in q))
                    throw new TypeError('Missing field:  "' + r + '"');
                var v = c();
                for (r in k) k[r].write(v, q[r]);
                null !== l && l.push(d, v);
                return v;
              },
              argPackAdvance: 8,
              readValueFromPointer: rc,
              hb: d,
            },
          ];
        });
      },
      aa: function (a, b, c, d, e) {
        var g = Ac(c);
        b = V(b);
        U(a, {
          name: b,
          fromWireType: function (h) {
            return !!h;
          },
          toWireType: function (h, k) {
            return k ? d : e;
          },
          argPackAdvance: 8,
          readValueFromPointer: function (h) {
            if (1 === c) var k = f();
            else if (2 === c) k = ca();
            else if (4 === c) k = w();
            else throw new TypeError('Unknown boolean type size: ' + b);
            return this.fromWireType(k[h >> g]);
          },
          hb: null,
        });
      },
      $: function (a, b) {
        b = V(b);
        U(a, {
          name: b,
          fromWireType: function (c) {
            var d = X[c].value;
            Ec(c);
            return d;
          },
          toWireType: function (c, d) {
            return Fc(d);
          },
          argPackAdvance: 8,
          readValueFromPointer: rc,
          hb: null,
        });
      },
      F: function (a, b, c) {
        c = Ac(c);
        b = V(b);
        U(a, {
          name: b,
          fromWireType: function (d) {
            return d;
          },
          toWireType: function (d, e) {
            if ('number' !== typeof e && 'boolean' !== typeof e)
              throw new TypeError(
                'Cannot convert "' + Gc(e) + '" to ' + this.name,
              );
            return e;
          },
          argPackAdvance: 8,
          readValueFromPointer: Hc(b, c),
          hb: null,
        });
      },
      J: function (a, b, c, d, e, g) {
        var h = Lc(b, c);
        a = V(a);
        e = Nc(d, e);
        Kc(
          a,
          function () {
            Rc('Cannot call ' + a + ' due to unbound types', h);
          },
          b - 1,
        );
        zc([], h, function (k) {
          var l = a,
            q = a;
          k = [k[0], null].concat(k.slice(1));
          var r = e,
            v = k.length;
          2 > v &&
            W(
              "argTypes array size mismatch! Must at least get return value and 'this' types!",
            );
          for (var y = null !== k[1] && !1, B = !1, u = 1; u < k.length; ++u)
            if (null !== k[u] && void 0 === k[u].hb) {
              B = !0;
              break;
            }
          var N = 'void' !== k[0].name,
            E = '',
            C = '';
          for (u = 0; u < v - 2; ++u)
            (E += (0 !== u ? ', ' : '') + 'arg' + u),
              (C += (0 !== u ? ', ' : '') + 'arg' + u + 'Wired');
          q =
            'return function ' +
            vc(q) +
            '(' +
            E +
            ') {\nif (arguments.length !== ' +
            (v - 2) +
            ") {\nthrowBindingError('function " +
            q +
            " called with ' + arguments.length + ' arguments, expected " +
            (v - 2) +
            " args!');\n}\n";
          B && (q += 'var destructors = [];\n');
          var va = B ? 'destructors' : 'null';
          E = 'throwBindingError invoker fn runDestructors retType classParam'.split(
            ' ',
          );
          r = [W, r, g, qc, k[0], k[1]];
          y &&
            (q += 'var thisWired = classParam.toWireType(' + va + ', this);\n');
          for (u = 0; u < v - 2; ++u)
            (q +=
              'var arg' +
              u +
              'Wired = argType' +
              u +
              '.toWireType(' +
              va +
              ', arg' +
              u +
              '); // ' +
              k[u + 2].name +
              '\n'),
              E.push('argType' + u),
              r.push(k[u + 2]);
          y && (C = 'thisWired' + (0 < C.length ? ', ' : '') + C);
          q +=
            (N ? 'var rv = ' : '') +
            'invoker(fn' +
            (0 < C.length ? ', ' : '') +
            C +
            ');\n';
          if (B) q += 'runDestructors(destructors);\n';
          else
            for (u = y ? 1 : 2; u < k.length; ++u)
              (v = 1 === u ? 'thisWired' : 'arg' + (u - 2) + 'Wired'),
                null !== k[u].hb &&
                  ((q += v + '_dtor(' + v + '); // ' + k[u].name + '\n'),
                  E.push(v + '_dtor'),
                  r.push(k[u].hb));
          N && (q += 'var ret = retType.fromWireType(rv);\nreturn ret;\n');
          E.push(q + '}\n');
          k = Ic(E).apply(null, r);
          u = b - 1;
          if (!z.hasOwnProperty(l))
            throw new yc('Replacing nonexistant public symbol');
          void 0 !== z[l].eb && void 0 !== u
            ? (z[l].eb[u] = k)
            : ((z[l] = k), (z[l].lc = u));
          return [];
        });
      },
      n: function (a, b, c, d, e) {
        function g(q) {
          return q;
        }
        b = V(b);
        -1 === e && (e = 4294967295);
        var h = Ac(c);
        if (0 === d) {
          var k = 32 - 8 * c;
          g = function (q) {
            return (q << k) >>> k;
          };
        }
        var l = -1 != b.indexOf('unsigned');
        U(a, {
          name: b,
          fromWireType: g,
          toWireType: function (q, r) {
            if ('number' !== typeof r && 'boolean' !== typeof r)
              throw new TypeError(
                'Cannot convert "' + Gc(r) + '" to ' + this.name,
              );
            if (r < d || r > e)
              throw new TypeError(
                'Passing a number "' +
                  Gc(r) +
                  '" from JS side to C/C++ side to an argument of type "' +
                  b +
                  '", which is outside the valid range [' +
                  d +
                  ', ' +
                  e +
                  ']!',
              );
            return l ? r >>> 0 : r | 0;
          },
          argPackAdvance: 8,
          readValueFromPointer: Sc(b, h, 0 !== d),
          hb: null,
        });
      },
      k: function (a, b, c) {
        function d(g) {
          g >>= 2;
          var h = x();
          return new e(n, h[g + 1], h[g]);
        }
        var e = [
          Int8Array,
          Uint8Array,
          Int16Array,
          Uint16Array,
          Int32Array,
          Uint32Array,
          Float32Array,
          Float64Array,
        ][b];
        c = V(c);
        U(
          a,
          {
            name: c,
            fromWireType: d,
            argPackAdvance: 8,
            readValueFromPointer: d,
          },
          { uc: !0 },
        );
      },
      G: function (a, b) {
        b = V(b);
        var c = 'std::string' === b;
        U(a, {
          name: b,
          fromWireType: function (d) {
            var e = x()[d >> 2];
            if (c)
              for (var g = d + 4, h = 0; h <= e; ++h) {
                var k = d + 4 + h;
                if (h == e || 0 == t()[k]) {
                  g = I(g, k - g);
                  if (void 0 === l) var l = g;
                  else (l += String.fromCharCode(0)), (l += g);
                  g = k + 1;
                }
              }
            else {
              l = Array(e);
              for (h = 0; h < e; ++h)
                l[h] = String.fromCharCode(t()[d + 4 + h]);
              l = l.join('');
            }
            O(d);
            return l;
          },
          toWireType: function (d, e) {
            e instanceof ArrayBuffer && (e = new Uint8Array(e));
            var g = 'string' === typeof e;
            g ||
              e instanceof Uint8Array ||
              e instanceof Uint8ClampedArray ||
              e instanceof Int8Array ||
              W('Cannot pass non-string to std::string');
            var h = (c && g
                ? function () {
                    return Ca(e);
                  }
                : function () {
                    return e.length;
                  })(),
              k = M(4 + h + 1);
            x()[k >> 2] = h;
            if (c && g) Ba(e, k + 4, h + 1);
            else if (g)
              for (g = 0; g < h; ++g) {
                var l = e.charCodeAt(g);
                255 < l &&
                  (O(k),
                  W('String has UTF-16 code units that do not fit in 8 bits'));
                t()[k + 4 + g] = l;
              }
            else for (g = 0; g < h; ++g) t()[k + 4 + g] = e[g];
            null !== d && d.push(O, k);
            return k;
          },
          argPackAdvance: 8,
          readValueFromPointer: rc,
          hb: function (d) {
            O(d);
          },
        });
      },
      x: function (a, b, c) {
        c = V(c);
        if (2 === b) {
          var d = Da;
          var e = Ea;
          var g = Fa;
          var h = function () {
            return ea();
          };
          var k = 1;
        } else
          4 === b &&
            ((d = Ga),
            (e = Ha),
            (g = Ia),
            (h = function () {
              return x();
            }),
            (k = 2));
        U(a, {
          name: c,
          fromWireType: function (l) {
            for (
              var q = x()[l >> 2], r = h(), v, y = l + 4, B = 0;
              B <= q;
              ++B
            ) {
              var u = l + 4 + B * b;
              if (B == q || 0 == r[u >> k])
                (y = d(y, u - y)),
                  void 0 === v
                    ? (v = y)
                    : ((v += String.fromCharCode(0)), (v += y)),
                  (y = u + b);
            }
            O(l);
            return v;
          },
          toWireType: function (l, q) {
            'string' !== typeof q &&
              W('Cannot pass non-string to C++ string type ' + c);
            var r = g(q),
              v = M(4 + r + b);
            x()[v >> 2] = r >> k;
            e(q, v + 4, r + b);
            null !== l && l.push(O, v);
            return v;
          },
          argPackAdvance: 8,
          readValueFromPointer: rc,
          hb: function (l) {
            O(l);
          },
        });
      },
      N: function (a, b, c, d, e, g) {
        pc[a] = { name: V(b), Ec: Nc(c, d), Fc: Nc(e, g), Sb: [] };
      },
      p: function (a, b, c, d, e, g, h, k, l, q) {
        pc[a].Sb.push({
          oc: V(b),
          tc: c,
          rc: Nc(d, e),
          sc: g,
          Lc: h,
          Kc: Nc(k, l),
          Mc: q,
        });
      },
      ba: function (a, b) {
        b = V(b);
        U(a, {
          gd: !0,
          name: b,
          argPackAdvance: 0,
          fromWireType: function () {},
          toWireType: function () {},
        });
      },
      T: function (a, b) {
        if (a == b) postMessage({ cmd: 'processQueuedMainThreadWork' });
        else if (D) postMessage({ targetThread: a, cmd: 'processThreadQueue' });
        else {
          a = (a = L.fb[a]) && a.worker;
          if (!a) return;
          a.postMessage({ cmd: 'processThreadQueue' });
        }
        return 1;
      },
      w: Ec,
      _: function (a) {
        if (0 === a) return Fc(Uc());
        var b = Tc[a];
        a = void 0 === b ? V(a) : b;
        return Fc(Uc()[a]);
      },
      I: function (a) {
        4 < a && (X[a].Lb += 1);
      },
      U: function (a, b, c, d) {
        a || W('Cannot use deleted val. handle = ' + a);
        a = X[a].value;
        var e = Wc[b];
        if (!e) {
          e = '';
          for (var g = 0; g < b; ++g) e += (0 !== g ? ', ' : '') + 'arg' + g;
          var h =
            'return function emval_allocator_' +
            b +
            '(constructor, argTypes, args) {\n';
          for (g = 0; g < b; ++g)
            h +=
              'var argType' +
              g +
              " = requireRegisteredType(Module['HEAP32'][(argTypes >>> 2) + " +
              g +
              '], "parameter ' +
              g +
              '");\nvar arg' +
              g +
              ' = argType' +
              g +
              '.readValueFromPointer(args);\nargs += argType' +
              g +
              "['argPackAdvance'];\n";
          e = new Function(
            'requireRegisteredType',
            'Module',
            '__emval_register',
            h +
              ('var obj = new constructor(' +
                e +
                ');\nreturn __emval_register(obj);\n}\n'),
          )(Vc, z, Fc);
          Wc[b] = e;
        }
        return e(a, c, d);
      },
      o: function () {
        H();
      },
      t: function (a, b, c) {
        ad.length = 0;
        var d;
        for (c >>= 2; (d = t()[b++]); )
          (d = 105 > d) && c & 1 && c++,
            ad.push(d ? la()[c++ >> 1] : w()[c]),
            ++c;
        return Ya[a].apply(null, ad);
      },
      W: function () {},
      A: function () {},
      h: Xc,
      i: eb,
      f: lb,
      v: function () {
        return cb | 0;
      },
      u: function () {
        return bb | 0;
      },
      j: function (a, b) {
        Z(a, b || 1);
        throw 'longjmp';
      },
      P: function (a, b, c) {
        t().copyWithin(a, b, b + c);
      },
      ea: function () {
        return navigator.hardwareConcurrency;
      },
      Q: function (a, b, c) {
        $c.length = b;
        c >>= 3;
        for (var d = 0; d < b; d++) $c[d] = la()[c + d];
        return (0 > a ? Ya[-a - 1] : vd[a]).apply(null, $c);
      },
      q: function (a) {
        a >>>= 0;
        var b = t().length;
        if (a <= b || 2147483648 < a) return !1;
        for (var c = 1; 4 >= c; c *= 2) {
          var d = b * (1 + 0.2 / c);
          d = Math.min(d, a + 100663296);
          d = Math.max(16777216, a, d);
          0 < d % 65536 && (d += 65536 - (d % 65536));
          a: {
            try {
              m.grow((Math.min(2147483648, d) - n.byteLength + 65535) >>> 16);
              p(m.buffer);
              var e = 1;
              break a;
            } catch (g) {}
            e = void 0;
          }
          if (e) return !0;
        }
        return !1;
      },
      R: function (a, b, c) {
        return cd(a) ? dd(a, b, c) : fd(a, b, c);
      },
      g: function () {},
      S: function (a, b) {
        var c = {};
        b >>= 2;
        c.alpha = !!w()[b];
        c.depth = !!w()[b + 1];
        c.stencil = !!w()[b + 2];
        c.antialias = !!w()[b + 3];
        c.premultipliedAlpha = !!w()[b + 4];
        c.preserveDrawingBuffer = !!w()[b + 5];
        var d = w()[b + 6];
        c.powerPreference = ld[d];
        c.failIfMajorPerformanceCaveat = !!w()[b + 7];
        c.Ac = w()[b + 8];
        c.jd = w()[b + 9];
        c.Qb = w()[b + 10];
        c.nc = w()[b + 11];
        c.pd = w()[b + 12];
        c.rd = w()[b + 13];
        a = cd(a);
        !a || c.nc
          ? (c = 0)
          : (a = a.getContext('webgl', c))
          ? ((b = M(8)),
            (w()[(b + 4) >> 2] = ab | 0),
            (d = { ed: b, attributes: c, version: c.Ac, wb: a }),
            a.canvas && (a.canvas.xb = d),
            ('undefined' === typeof c.Qb || c.Qb) && jd(d),
            (c = b))
          : (c = 0);
        return c;
      },
      E: md,
      X: nd,
      L: od,
      D: pd,
      c: function () {
        return ta | 0;
      },
      O: function () {
        L.xc();
      },
      z: xd,
      M: yd,
      y: zd,
      r: Ad,
      s: Bd,
      l: Cd,
      d: Dd,
      a: m || z.wasmMemory,
      V: function (a) {
        var b = L.Eb.pop();
        a && b();
      },
      B: mb,
      H: function (a, b, c, d) {
        if ('undefined' === typeof SharedArrayBuffer)
          return (
            G(
              'Current environment does not support SharedArrayBuffer, pthreads are not available!',
            ),
            6
          );
        if (!a)
          return G('pthread_create called with a null thread pointer!'), 28;
        var e = [];
        if (D && 0 === e.length) return Ed(687865856, a, b, c, d);
        var g = 0,
          h = 0,
          k = 0,
          l = 0;
        if (b) {
          var q = w()[b >> 2];
          q += 81920;
          g = w()[(b + 8) >> 2];
          h = 0 !== w()[(b + 12) >> 2];
          if (0 === w()[(b + 16) >> 2]) {
            var r = w()[(b + 20) >> 2],
              v = w()[(b + 24) >> 2];
            k = b + 20;
            l = b + 24;
            var y = L.Gb ? L.Gb : ab | 0;
            if (k || l)
              if (y)
                if (w()[(y + 12) >> 2] !== y)
                  G(
                    'pthread_getschedparam attempted on thread ' +
                      y +
                      ', which does not point to a valid thread, or does not exist anymore!',
                  );
                else {
                  var B = Atomics.load(x(), (y + 108 + 20) >> 2);
                  y = Atomics.load(x(), (y + 108 + 24) >> 2);
                  k && (w()[k >> 2] = B);
                  l && (w()[l >> 2] = y);
                }
              else
                G('pthread_getschedparam called with a null thread pointer!');
            k = w()[(b + 20) >> 2];
            l = w()[(b + 24) >> 2];
            w()[(b + 20) >> 2] = r;
            w()[(b + 24) >> 2] = v;
          } else (k = w()[(b + 20) >> 2]), (l = w()[(b + 24) >> 2]);
        } else q = 2097152;
        (b = 0 == g) ? (g = Fd(16, q)) : ((g -= q), ya(0 < g));
        r = M(232);
        for (v = 0; 58 > v; ++v) x()[(r >> 2) + v] = 0;
        w()[a >> 2] = r;
        w()[(r + 12) >> 2] = r;
        a = r + 156;
        w()[a >> 2] = a;
        c = {
          ob: g,
          rb: q,
          Fb: b,
          hc: k,
          ic: l,
          Pb: h,
          Nc: c,
          qb: r,
          Dc: ab | 0,
          sb: d,
          Qc: e,
        };
        D ? ((c.Xc = 'spawnThread'), postMessage(c, e)) : kb(c);
        return 0;
      },
      ca: function (a, b) {
        return sd(a, b);
      },
      e: rd,
      b: function (a) {
        ta = a | 0;
      },
      da: function (a) {
        var b = (Date.now() / 1e3) | 0;
        a && (w()[a >> 2] = b);
        return b;
      },
    };
    (function () {
      function a(e, g) {
        z.asm = e.exports;
        J = z.asm.ga;
        wa = g;
        if (!D) {
          var h = L.bb.length;
          L.bb.forEach(function (k) {
            L.Xb(k, function () {
              if (
                !--h &&
                (K--,
                z.monitorRunDependencies && z.monitorRunDependencies(K),
                0 == K && (null !== Pa && (clearInterval(Pa), (Pa = null)), Qa))
              ) {
                var l = Qa;
                Qa = null;
                l();
              }
            });
          });
        }
      }
      function b(e) {
        a(e.instance, e.module);
      }
      function c(e) {
        return Ua()
          .then(function (g) {
            return WebAssembly.instantiate(g, d);
          })
          .then(e, function (g) {
            G('failed to asynchronously prepare wasm: ' + g);
            H(g);
          });
      }
      var d = { a: Gd };
      D ||
        (ya(!D, 'addRunDependency cannot be used in a pthread worker'),
        K++,
        z.monitorRunDependencies && z.monitorRunDependencies(K));
      if (z.instantiateWasm)
        try {
          return z.instantiateWasm(d, a);
        } catch (e) {
          return (
            G('Module.instantiateWasm callback failed with error: ' + e), !1
          );
        }
      (function () {
        return ua ||
          'function' !== typeof WebAssembly.instantiateStreaming ||
          Ra() ||
          'function' !== typeof fetch
          ? c(b)
          : fetch(Sa, { credentials: 'same-origin' }).then(function (e) {
              return WebAssembly.instantiateStreaming(e, d).then(b, function (
                g,
              ) {
                G('wasm streaming compile failed: ' + g);
                G('falling back to ArrayBuffer instantiation');
                return c(b);
              });
            });
      })().catch(oa);
      return {};
    })();
    var wd = (z.___wasm_call_ctors = function () {
        return (wd = z.___wasm_call_ctors = z.asm.ha).apply(null, arguments);
      }),
      M = (z._malloc = function () {
        return (M = z._malloc = z.asm.ia).apply(null, arguments);
      }),
      O = (z._free = function () {
        return (O = z._free = z.asm.ja).apply(null, arguments);
      }),
      Qc = (z.___getTypeName = function () {
        return (Qc = z.___getTypeName = z.asm.ka).apply(null, arguments);
      });
    z.___embind_register_native_and_builtin_types = function () {
      return (z.___embind_register_native_and_builtin_types = z.asm.la).apply(
        null,
        arguments,
      );
    };
    var qd = (z._emscripten_get_global_libc = function () {
        return (qd = z._emscripten_get_global_libc = z.asm.ma).apply(
          null,
          arguments,
        );
      }),
      mc = (z.___errno_location = function () {
        return (mc = z.___errno_location = z.asm.na).apply(null, arguments);
      });
    z.___em_js__initPthreadsJS = function () {
      return (z.___em_js__initPthreadsJS = z.asm.oa).apply(null, arguments);
    };
    var Y = (z.stackSave = function () {
        return (Y = z.stackSave = z.asm.pa).apply(null, arguments);
      }),
      P = (z.stackRestore = function () {
        return (P = z.stackRestore = z.asm.qa).apply(null, arguments);
      }),
      Yc = (z.stackAlloc = function () {
        return (Yc = z.stackAlloc = z.asm.ra).apply(null, arguments);
      }),
      Z = (z._setThrew = function () {
        return (Z = z._setThrew = z.asm.sa).apply(null, arguments);
      }),
      Fd = (z._memalign = function () {
        return (Fd = z._memalign = z.asm.ta).apply(null, arguments);
      });
    z._emscripten_main_browser_thread_id = function () {
      return (z._emscripten_main_browser_thread_id = z.asm.ua).apply(
        null,
        arguments,
      );
    };
    var ib = (z.___pthread_tsd_run_dtors = function () {
        return (ib = z.___pthread_tsd_run_dtors = z.asm.va).apply(
          null,
          arguments,
        );
      }),
      jb = (z._emscripten_main_thread_process_queued_calls = function () {
        return (jb = z._emscripten_main_thread_process_queued_calls =
          z.asm.wa).apply(null, arguments);
      });
    z._emscripten_current_thread_process_queued_calls = function () {
      return (z._emscripten_current_thread_process_queued_calls =
        z.asm.xa).apply(null, arguments);
    };
    var gb = (z._emscripten_register_main_browser_thread_id = function () {
        return (gb = z._emscripten_register_main_browser_thread_id =
          z.asm.ya).apply(null, arguments);
      }),
      Xa = (z._do_emscripten_dispatch_to_thread = function () {
        return (Xa = z._do_emscripten_dispatch_to_thread = z.asm.za).apply(
          null,
          arguments,
        );
      });
    z._emscripten_async_run_in_main_thread = function () {
      return (z._emscripten_async_run_in_main_thread = z.asm.Aa).apply(
        null,
        arguments,
      );
    };
    z._emscripten_sync_run_in_main_thread = function () {
      return (z._emscripten_sync_run_in_main_thread = z.asm.Ba).apply(
        null,
        arguments,
      );
    };
    z._emscripten_sync_run_in_main_thread_0 = function () {
      return (z._emscripten_sync_run_in_main_thread_0 = z.asm.Ca).apply(
        null,
        arguments,
      );
    };
    z._emscripten_sync_run_in_main_thread_1 = function () {
      return (z._emscripten_sync_run_in_main_thread_1 = z.asm.Da).apply(
        null,
        arguments,
      );
    };
    z._emscripten_sync_run_in_main_thread_2 = function () {
      return (z._emscripten_sync_run_in_main_thread_2 = z.asm.Ea).apply(
        null,
        arguments,
      );
    };
    z._emscripten_sync_run_in_main_thread_xprintf_varargs = function () {
      return (z._emscripten_sync_run_in_main_thread_xprintf_varargs =
        z.asm.Fa).apply(null, arguments);
    };
    z._emscripten_sync_run_in_main_thread_3 = function () {
      return (z._emscripten_sync_run_in_main_thread_3 = z.asm.Ga).apply(
        null,
        arguments,
      );
    };
    var Ed = (z._emscripten_sync_run_in_main_thread_4 = function () {
      return (Ed = z._emscripten_sync_run_in_main_thread_4 = z.asm.Ha).apply(
        null,
        arguments,
      );
    });
    z._emscripten_sync_run_in_main_thread_5 = function () {
      return (z._emscripten_sync_run_in_main_thread_5 = z.asm.Ia).apply(
        null,
        arguments,
      );
    };
    z._emscripten_sync_run_in_main_thread_6 = function () {
      return (z._emscripten_sync_run_in_main_thread_6 = z.asm.Ja).apply(
        null,
        arguments,
      );
    };
    z._emscripten_sync_run_in_main_thread_7 = function () {
      return (z._emscripten_sync_run_in_main_thread_7 = z.asm.Ka).apply(
        null,
        arguments,
      );
    };
    var Zc = (z._emscripten_run_in_main_runtime_thread_js = function () {
        return (Zc = z._emscripten_run_in_main_runtime_thread_js =
          z.asm.La).apply(null, arguments);
      }),
      ed = (z.__emscripten_call_on_thread = function () {
        return (ed = z.__emscripten_call_on_thread = z.asm.Ma).apply(
          null,
          arguments,
        );
      });
    z._emscripten_tls_init = function () {
      return (z._emscripten_tls_init = z.asm.Na).apply(null, arguments);
    };
    z.dynCall_jiiiiiiiii = function () {
      return (z.dynCall_jiiiiiiiii = z.asm.Oa).apply(null, arguments);
    };
    z.dynCall_jiji = function () {
      return (z.dynCall_jiji = z.asm.Pa).apply(null, arguments);
    };
    z.dynCall_jiiiiiiii = function () {
      return (z.dynCall_jiiiiiiii = z.asm.Qa).apply(null, arguments);
    };
    z.dynCall_jiiiiii = function () {
      return (z.dynCall_jiiiiii = z.asm.Ra).apply(null, arguments);
    };
    z.dynCall_jiiiii = function () {
      return (z.dynCall_jiiiii = z.asm.Sa).apply(null, arguments);
    };
    z.dynCall_iiijii = function () {
      return (z.dynCall_iiijii = z.asm.Ta).apply(null, arguments);
    };
    var hb = (z._main_thread_futex = 877788);
    function Bd(a, b) {
      var c = Y();
      try {
        J.get(a)(b);
      } catch (d) {
        P(c);
        if (d !== d + 0 && 'longjmp' !== d) throw d;
        Z(1, 0);
      }
    }
    function Dd(a, b, c, d, e) {
      var g = Y();
      try {
        J.get(a)(b, c, d, e);
      } catch (h) {
        P(g);
        if (h !== h + 0 && 'longjmp' !== h) throw h;
        Z(1, 0);
      }
    }
    function Cd(a, b, c) {
      var d = Y();
      try {
        J.get(a)(b, c);
      } catch (e) {
        P(d);
        if (e !== e + 0 && 'longjmp' !== e) throw e;
        Z(1, 0);
      }
    }
    function Ad(a, b, c, d, e, g, h, k, l) {
      var q = Y();
      try {
        return J.get(a)(b, c, d, e, g, h, k, l);
      } catch (r) {
        P(q);
        if (r !== r + 0 && 'longjmp' !== r) throw r;
        Z(1, 0);
      }
    }
    function xd(a, b, c) {
      var d = Y();
      try {
        return J.get(a)(b, c);
      } catch (e) {
        P(d);
        if (e !== e + 0 && 'longjmp' !== e) throw e;
        Z(1, 0);
      }
    }
    function zd(a, b, c, d, e) {
      var g = Y();
      try {
        return J.get(a)(b, c, d, e);
      } catch (h) {
        P(g);
        if (h !== h + 0 && 'longjmp' !== h) throw h;
        Z(1, 0);
      }
    }
    function yd(a, b, c, d) {
      var e = Y();
      try {
        return J.get(a)(b, c, d);
      } catch (g) {
        P(e);
        if (g !== g + 0 && 'longjmp' !== g) throw g;
        Z(1, 0);
      }
    }
    z.PThread = L;
    z.PThread = L;
    z._pthread_self = rd;
    z.wasmMemory = m;
    z.ExitStatus = Hd;
    var Id;
    function Hd(a) {
      this.name = 'ExitStatus';
      this.message = 'Program terminated with exit(' + a + ')';
      this.status = a;
    }
    Qa = function Jd() {
      Id || Kd();
      Id || (Qa = Jd);
    };
    function Kd() {
      function a() {
        if (!Id && ((Id = !0), (z.calledRun = !0), !xa)) {
          z.noFSInit ||
            dc ||
            ((dc = !0),
            cc(),
            (z.stdin = z.stdin),
            (z.stdout = z.stdout),
            (z.stderr = z.stderr),
            z.stdin ? fc('stdin', z.stdin) : Zb('/dev/tty', '/dev/stdin'),
            z.stdout
              ? fc('stdout', null, z.stdout)
              : Zb('/dev/tty', '/dev/stdout'),
            z.stderr
              ? fc('stderr', null, z.stderr)
              : Zb('/dev/tty1', '/dev/stderr'),
            $b('/dev/stdin', 'r'),
            $b('/dev/stdout', 'w'),
            $b('/dev/stderr', 'w'));
          Za(La);
          D || ((Ib = !1), Za(Ma));
          na(z);
          if (z.onRuntimeInitialized) z.onRuntimeInitialized();
          if (!D) {
            if (z.postRun)
              for (
                'function' == typeof z.postRun && (z.postRun = [z.postRun]);
                z.postRun.length;

              ) {
                var b = z.postRun.shift();
                Na.unshift(b);
              }
            Za(Na);
          }
        }
      }
      if (!(0 < K)) {
        if (!D) {
          if (z.preRun)
            for (
              'function' == typeof z.preRun && (z.preRun = [z.preRun]);
              z.preRun.length;

            )
              Oa();
          Za(Ka);
        }
        0 < K ||
          (z.setStatus
            ? (z.setStatus('Running...'),
              setTimeout(function () {
                setTimeout(function () {
                  z.setStatus('');
                }, 1);
                a();
              }, 1))
            : a());
      }
    }
    z.run = Kd;
    if (z.preInit)
      for (
        'function' == typeof z.preInit && (z.preInit = [z.preInit]);
        0 < z.preInit.length;

      )
        z.preInit.pop()();
    D || (noExitRuntime = !0);
    D ? L.yc() : Kd();

    return avif_enc_mt.ready;
  };
})();
export default avif_enc_mt;
