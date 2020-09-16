var Module = (function () {
  var _scriptDir = import.meta.url;

  return function (Module) {
    Module = Module || {};

    var g;
    g || (g = typeof Module !== 'undefined' ? Module : {});
    var aa, ba;
    g.ready = new Promise(function (a, b) {
      aa = a;
      ba = b;
    });
    var ca = {},
      l;
    for (l in g) g.hasOwnProperty(l) && (ca[l] = g[l]);
    var r = '',
      da;
    r = self.location.href;
    _scriptDir && (r = _scriptDir);
    0 !== r.indexOf('blob:')
      ? (r = r.substr(0, r.lastIndexOf('/') + 1))
      : (r = '');
    da = function (a) {
      var b = new XMLHttpRequest();
      b.open('GET', a, !1);
      b.responseType = 'arraybuffer';
      b.send(null);
      return new Uint8Array(b.response);
    };
    var ea = g.print || console.log.bind(console),
      u = g.printErr || console.warn.bind(console);
    for (l in ca) ca.hasOwnProperty(l) && (g[l] = ca[l]);
    ca = null;
    var fa = 0,
      ha;
    g.wasmBinary && (ha = g.wasmBinary);
    var noExitRuntime;
    g.noExitRuntime && (noExitRuntime = g.noExitRuntime);
    'object' !== typeof WebAssembly && x('no native wasm support detected');
    var z,
      A = new WebAssembly.Table({
        initial: 901,
        maximum: 901,
        element: 'anyfunc',
      }),
      ia = !1,
      ja = new TextDecoder('utf8');
    function ka(a) {
      for (var b = 0; a[b] && !(NaN <= b); ) ++b;
      return ja.decode(
        a.subarray ? a.subarray(0, b) : new Uint8Array(a.slice(0, b)),
      );
    }
    function la(a, b) {
      if (!a) return '';
      b = a + b;
      for (var c = a; !(c >= b) && B[c]; ) ++c;
      return ja.decode(B.subarray(a, c));
    }
    function ma(a, b, c, d) {
      if (!(0 < d)) return 0;
      var e = c;
      d = c + d - 1;
      for (var f = 0; f < a.length; ++f) {
        var h = a.charCodeAt(f);
        if (55296 <= h && 57343 >= h) {
          var k = a.charCodeAt(++f);
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
    function na(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        55296 <= d &&
          57343 >= d &&
          (d = (65536 + ((d & 1023) << 10)) | (a.charCodeAt(++c) & 1023));
        127 >= d ? ++b : (b = 2047 >= d ? b + 2 : 65535 >= d ? b + 3 : b + 4);
      }
      return b;
    }
    var pa = new TextDecoder('utf-16le');
    function qa(a, b) {
      var c = a >> 1;
      for (b = c + b / 2; !(c >= b) && ra[c]; ) ++c;
      return pa.decode(B.subarray(a, c << 1));
    }
    function sa(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (2 > c) return 0;
      c -= 2;
      var d = b;
      c = c < 2 * a.length ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) (C[b >> 1] = a.charCodeAt(e)), (b += 2);
      C[b >> 1] = 0;
      return b - d;
    }
    function ta(a) {
      return 2 * a.length;
    }
    function ua(a, b) {
      for (var c = 0, d = ''; !(c >= b / 4); ) {
        var e = E[(a + 4 * c) >> 2];
        if (0 == e) break;
        ++c;
        65536 <= e
          ? ((e -= 65536),
            (d += String.fromCharCode(55296 | (e >> 10), 56320 | (e & 1023))))
          : (d += String.fromCharCode(e));
      }
      return d;
    }
    function va(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (4 > c) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var f = a.charCodeAt(e);
        if (55296 <= f && 57343 >= f) {
          var h = a.charCodeAt(++e);
          f = (65536 + ((f & 1023) << 10)) | (h & 1023);
        }
        E[b >> 2] = f;
        b += 4;
        if (b + 4 > c) break;
      }
      E[b >> 2] = 0;
      return b - d;
    }
    function wa(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        55296 <= d && 57343 >= d && ++c;
        b += 4;
      }
      return b;
    }
    var F, G, B, C, ra, E, H, xa, ya;
    function za(a) {
      F = a;
      g.HEAP8 = G = new Int8Array(a);
      g.HEAP16 = C = new Int16Array(a);
      g.HEAP32 = E = new Int32Array(a);
      g.HEAPU8 = B = new Uint8Array(a);
      g.HEAPU16 = ra = new Uint16Array(a);
      g.HEAPU32 = H = new Uint32Array(a);
      g.HEAPF32 = xa = new Float32Array(a);
      g.HEAPF64 = ya = new Float64Array(a);
    }
    var Aa = g.INITIAL_MEMORY || 16777216;
    g.wasmMemory
      ? (z = g.wasmMemory)
      : (z = new WebAssembly.Memory({ initial: Aa / 65536, maximum: 32768 }));
    z && (F = z.buffer);
    Aa = F.byteLength;
    za(F);
    var Ba = [],
      Ca = [],
      Da = [],
      Ea = [];
    function Fa() {
      var a = g.preRun.shift();
      Ba.unshift(a);
    }
    var Ga = Math.abs,
      Ha = Math.ceil,
      Ia = Math.floor,
      Ja = Math.min,
      I = 0,
      Ka = null,
      La = null;
    g.preloadedImages = {};
    g.preloadedAudios = {};
    function x(a) {
      if (g.onAbort) g.onAbort(a);
      u(a);
      ia = !0;
      a = new WebAssembly.RuntimeError(
        'abort(' + a + '). Build with -s ASSERTIONS=1 for more info.',
      );
      ba(a);
      throw a;
    }
    function Ma() {
      var a = J;
      return String.prototype.startsWith
        ? a.startsWith('data:application/octet-stream;base64,')
        : 0 === a.indexOf('data:application/octet-stream;base64,');
    }
    var J = 'avif_enc.wasm';
    if (!Ma()) {
      var Na = J;
      J = g.locateFile ? g.locateFile(Na, r) : r + Na;
    }
    function Oa() {
      try {
        if (ha) return new Uint8Array(ha);
        if (da) return da(J);
        throw 'both async and sync fetching of the wasm failed';
      } catch (a) {
        x(a);
      }
    }
    function Pa() {
      return ha || 'function' !== typeof fetch
        ? Promise.resolve().then(Oa)
        : fetch(J, { credentials: 'same-origin' })
            .then(function (a) {
              if (!a.ok) throw "failed to load wasm binary file at '" + J + "'";
              return a.arrayBuffer();
            })
            .catch(function () {
              return Oa();
            });
    }
    var K, Qa;
    Ca.push({
      fb: function () {
        Ra();
      },
    });
    function Sa(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ('function' == typeof b) b(g);
        else {
          var c = b.fb;
          'number' === typeof c
            ? void 0 === b.Ia
              ? A.get(c)()
              : A.get(c)(b.Ia)
            : c(void 0 === b.Ia ? null : b.Ia);
        }
      }
    }
    function Ta(a) {
      this.Ba = a - 16;
      this.wb = function (b) {
        E[(this.Ba + 8) >> 2] = b;
      };
      this.tb = function (b) {
        E[(this.Ba + 0) >> 2] = b;
      };
      this.ub = function () {
        E[(this.Ba + 4) >> 2] = 0;
      };
      this.sb = function () {
        G[(this.Ba + 12) >> 0] = 0;
      };
      this.vb = function () {
        G[(this.Ba + 13) >> 0] = 0;
      };
      this.kb = function (b, c) {
        this.wb(b);
        this.tb(c);
        this.ub();
        this.sb();
        this.vb();
      };
    }
    function Ua() {
      return 0 < Ua.Ua;
    }
    function Va(a, b) {
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
    function Wa(a) {
      var b = '/' === a.charAt(0),
        c = '/' === a.substr(-1);
      (a = Va(
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
    function Xa(a) {
      var b = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/
        .exec(a)
        .slice(1);
      a = b[0];
      b = b[1];
      if (!a && !b) return '.';
      b && (b = b.substr(0, b.length - 1));
      return a + b;
    }
    function Ya(a) {
      if ('/' === a) return '/';
      a = Wa(a);
      a = a.replace(/\/$/, '');
      var b = a.lastIndexOf('/');
      return -1 === b ? a : a.substr(b + 1);
    }
    function Za() {
      for (var a = '', b = !1, c = arguments.length - 1; -1 <= c && !b; c--) {
        b = 0 <= c ? arguments[c] : '/';
        if ('string' !== typeof b)
          throw new TypeError('Arguments to path.resolve must be strings');
        if (!b) return '';
        a = b + '/' + a;
        b = '/' === b.charAt(0);
      }
      a = Va(
        a.split('/').filter(function (d) {
          return !!d;
        }),
        !b,
      ).join('/');
      return (b ? '/' : '') + a || '.';
    }
    var $a = [];
    function ab(a, b) {
      $a[a] = { input: [], pa: [], Aa: b };
      bb(a, cb);
    }
    var cb = {
        open: function (a) {
          var b = $a[a.node.Ga];
          if (!b) throw new L(43);
          a.oa = b;
          a.seekable = !1;
        },
        close: function (a) {
          a.oa.Aa.flush(a.oa);
        },
        flush: function (a) {
          a.oa.Aa.flush(a.oa);
        },
        read: function (a, b, c, d) {
          if (!a.oa || !a.oa.Aa.Ta) throw new L(60);
          for (var e = 0, f = 0; f < d; f++) {
            try {
              var h = a.oa.Aa.Ta(a.oa);
            } catch (k) {
              throw new L(29);
            }
            if (void 0 === h && 0 === e) throw new L(6);
            if (null === h || void 0 === h) break;
            e++;
            b[c + f] = h;
          }
          e && (a.node.timestamp = Date.now());
          return e;
        },
        write: function (a, b, c, d) {
          if (!a.oa || !a.oa.Aa.Ka) throw new L(60);
          try {
            for (var e = 0; e < d; e++) a.oa.Aa.Ka(a.oa, b[c + e]);
          } catch (f) {
            throw new L(29);
          }
          d && (a.node.timestamp = Date.now());
          return e;
        },
      },
      db = {
        Ta: function (a) {
          if (!a.input.length) {
            var b = null;
            'undefined' != typeof window && 'function' == typeof window.prompt
              ? ((b = window.prompt('Input: ')), null !== b && (b += '\n'))
              : 'function' == typeof readline &&
                ((b = readline()), null !== b && (b += '\n'));
            if (!b) return null;
            var c = Array(na(b) + 1);
            b = ma(b, c, 0, c.length);
            c.length = b;
            a.input = c;
          }
          return a.input.shift();
        },
        Ka: function (a, b) {
          null === b || 10 === b
            ? (ea(ka(a.pa)), (a.pa = []))
            : 0 != b && a.pa.push(b);
        },
        flush: function (a) {
          a.pa && 0 < a.pa.length && (ea(ka(a.pa)), (a.pa = []));
        },
      },
      eb = {
        Ka: function (a, b) {
          null === b || 10 === b
            ? (u(ka(a.pa)), (a.pa = []))
            : 0 != b && a.pa.push(b);
        },
        flush: function (a) {
          a.pa && 0 < a.pa.length && (u(ka(a.pa)), (a.pa = []));
        },
      },
      M = {
        qa: null,
        ua: function () {
          return M.createNode(null, '/', 16895, 0);
        },
        createNode: function (a, b, c, d) {
          if (24576 === (c & 61440) || 4096 === (c & 61440)) throw new L(63);
          M.qa ||
            (M.qa = {
              dir: {
                node: {
                  wa: M.la.wa,
                  sa: M.la.sa,
                  Ca: M.la.Ca,
                  Ea: M.la.Ea,
                  Za: M.la.Za,
                  ab: M.la.ab,
                  $a: M.la.$a,
                  Ya: M.la.Ya,
                  Ha: M.la.Ha,
                },
                stream: { za: M.ma.za },
              },
              file: {
                node: { wa: M.la.wa, sa: M.la.sa },
                stream: {
                  za: M.ma.za,
                  read: M.ma.read,
                  write: M.ma.write,
                  Na: M.ma.Na,
                  Va: M.ma.Va,
                  Xa: M.ma.Xa,
                },
              },
              link: {
                node: { wa: M.la.wa, sa: M.la.sa, Da: M.la.Da },
                stream: {},
              },
              Oa: { node: { wa: M.la.wa, sa: M.la.sa }, stream: fb },
            });
          c = gb(a, b, c, d);
          16384 === (c.mode & 61440)
            ? ((c.la = M.qa.dir.node), (c.ma = M.qa.dir.stream), (c.ka = {}))
            : 32768 === (c.mode & 61440)
            ? ((c.la = M.qa.file.node),
              (c.ma = M.qa.file.stream),
              (c.na = 0),
              (c.ka = null))
            : 40960 === (c.mode & 61440)
            ? ((c.la = M.qa.link.node), (c.ma = M.qa.link.stream))
            : 8192 === (c.mode & 61440) &&
              ((c.la = M.qa.Oa.node), (c.ma = M.qa.Oa.stream));
          c.timestamp = Date.now();
          a && (a.ka[b] = c);
          return c;
        },
        Gb: function (a) {
          if (a.ka && a.ka.subarray) {
            for (var b = [], c = 0; c < a.na; ++c) b.push(a.ka[c]);
            return b;
          }
          return a.ka;
        },
        Hb: function (a) {
          return a.ka
            ? a.ka.subarray
              ? a.ka.subarray(0, a.na)
              : new Uint8Array(a.ka)
            : new Uint8Array(0);
        },
        Pa: function (a, b) {
          var c = a.ka ? a.ka.length : 0;
          c >= b ||
            ((b = Math.max(b, (c * (1048576 > c ? 2 : 1.125)) >>> 0)),
            0 != c && (b = Math.max(b, 256)),
            (c = a.ka),
            (a.ka = new Uint8Array(b)),
            0 < a.na && a.ka.set(c.subarray(0, a.na), 0));
        },
        qb: function (a, b) {
          if (a.na != b)
            if (0 == b) (a.ka = null), (a.na = 0);
            else {
              if (!a.ka || a.ka.subarray) {
                var c = a.ka;
                a.ka = new Uint8Array(b);
                c && a.ka.set(c.subarray(0, Math.min(b, a.na)));
              } else if ((a.ka || (a.ka = []), a.ka.length > b))
                a.ka.length = b;
              else for (; a.ka.length < b; ) a.ka.push(0);
              a.na = b;
            }
        },
        la: {
          wa: function (a) {
            var b = {};
            b.Fb = 8192 === (a.mode & 61440) ? a.id : 1;
            b.Jb = a.id;
            b.mode = a.mode;
            b.Mb = 1;
            b.uid = 0;
            b.Ib = 0;
            b.Ga = a.Ga;
            16384 === (a.mode & 61440)
              ? (b.size = 4096)
              : 32768 === (a.mode & 61440)
              ? (b.size = a.na)
              : 40960 === (a.mode & 61440)
              ? (b.size = a.link.length)
              : (b.size = 0);
            b.Cb = new Date(a.timestamp);
            b.Lb = new Date(a.timestamp);
            b.Eb = new Date(a.timestamp);
            b.cb = 4096;
            b.Db = Math.ceil(b.size / b.cb);
            return b;
          },
          sa: function (a, b) {
            void 0 !== b.mode && (a.mode = b.mode);
            void 0 !== b.timestamp && (a.timestamp = b.timestamp);
            void 0 !== b.size && M.qb(a, b.size);
          },
          Ca: function () {
            throw hb[44];
          },
          Ea: function (a, b, c, d) {
            return M.createNode(a, b, c, d);
          },
          Za: function (a, b, c) {
            if (16384 === (a.mode & 61440)) {
              try {
                var d = ib(b, c);
              } catch (f) {}
              if (d) for (var e in d.ka) throw new L(55);
            }
            delete a.parent.ka[a.name];
            a.name = c;
            b.ka[c] = a;
            a.parent = b;
          },
          ab: function (a, b) {
            delete a.ka[b];
          },
          $a: function (a, b) {
            var c = ib(a, b),
              d;
            for (d in c.ka) throw new L(55);
            delete a.ka[b];
          },
          Ya: function (a) {
            var b = ['.', '..'],
              c;
            for (c in a.ka) a.ka.hasOwnProperty(c) && b.push(c);
            return b;
          },
          Ha: function (a, b, c) {
            a = M.createNode(a, b, 41471, 0);
            a.link = c;
            return a;
          },
          Da: function (a) {
            if (40960 !== (a.mode & 61440)) throw new L(28);
            return a.link;
          },
        },
        ma: {
          read: function (a, b, c, d, e) {
            var f = a.node.ka;
            if (e >= a.node.na) return 0;
            a = Math.min(a.node.na - e, d);
            if (8 < a && f.subarray) b.set(f.subarray(e, e + a), c);
            else for (d = 0; d < a; d++) b[c + d] = f[e + d];
            return a;
          },
          write: function (a, b, c, d, e, f) {
            b.buffer === G.buffer && (f = !1);
            if (!d) return 0;
            a = a.node;
            a.timestamp = Date.now();
            if (b.subarray && (!a.ka || a.ka.subarray)) {
              if (f) return (a.ka = b.subarray(c, c + d)), (a.na = d);
              if (0 === a.na && 0 === e)
                return (a.ka = b.slice(c, c + d)), (a.na = d);
              if (e + d <= a.na) return a.ka.set(b.subarray(c, c + d), e), d;
            }
            M.Pa(a, e + d);
            if (a.ka.subarray && b.subarray) a.ka.set(b.subarray(c, c + d), e);
            else for (f = 0; f < d; f++) a.ka[e + f] = b[c + f];
            a.na = Math.max(a.na, e + d);
            return d;
          },
          za: function (a, b, c) {
            1 === c
              ? (b += a.position)
              : 2 === c && 32768 === (a.node.mode & 61440) && (b += a.node.na);
            if (0 > b) throw new L(28);
            return b;
          },
          Na: function (a, b, c) {
            M.Pa(a.node, b + c);
            a.node.na = Math.max(a.node.na, b + c);
          },
          Va: function (a, b, c, d, e, f) {
            0 === b || x('Assertion failed: undefined');
            if (32768 !== (a.node.mode & 61440)) throw new L(43);
            a = a.node.ka;
            if (f & 2 || a.buffer !== F) {
              if (0 < d || d + c < a.length)
                a.subarray
                  ? (a = a.subarray(d, d + c))
                  : (a = Array.prototype.slice.call(a, d, d + c));
              d = !0;
              f = 16384 * Math.ceil(c / 16384);
              for (b = jb(f); c < f; ) G[b + c++] = 0;
              c = b;
              if (!c) throw new L(48);
              G.set(a, c);
            } else (d = !1), (c = a.byteOffset);
            return { Ba: c, Bb: d };
          },
          Xa: function (a, b, c, d, e) {
            if (32768 !== (a.node.mode & 61440)) throw new L(43);
            if (e & 2) return 0;
            M.ma.write(a, b, 0, d, c, !1);
            return 0;
          },
        },
      },
      kb = null,
      lb = {},
      mb = [],
      nb = 1,
      ob = null,
      pb = !0,
      qb = {},
      L = null,
      hb = {};
    function N(a, b) {
      a = Za('/', a);
      b = b || {};
      if (!a) return { path: '', node: null };
      var c = { Sa: !0, La: 0 },
        d;
      for (d in c) void 0 === b[d] && (b[d] = c[d]);
      if (8 < b.La) throw new L(32);
      a = Va(
        a.split('/').filter(function (h) {
          return !!h;
        }),
        !1,
      );
      var e = kb;
      c = '/';
      for (d = 0; d < a.length; d++) {
        var f = d === a.length - 1;
        if (f && b.parent) break;
        e = ib(e, a[d]);
        c = Wa(c + '/' + a[d]);
        e.Fa && (!f || (f && b.Sa)) && (e = e.Fa.root);
        if (!f || b.Ra)
          for (f = 0; 40960 === (e.mode & 61440); )
            if (
              ((e = rb(c)),
              (c = Za(Xa(c), e)),
              (e = N(c, { La: b.La }).node),
              40 < f++)
            )
              throw new L(32);
      }
      return { path: c, node: e };
    }
    function sb(a) {
      for (var b; ; ) {
        if (a === a.parent)
          return (
            (a = a.ua.Wa),
            b ? ('/' !== a[a.length - 1] ? a + '/' + b : a + b) : a
          );
        b = b ? a.name + '/' + b : a.name;
        a = a.parent;
      }
    }
    function tb(a, b) {
      for (var c = 0, d = 0; d < b.length; d++)
        c = ((c << 5) - c + b.charCodeAt(d)) | 0;
      return ((a + c) >>> 0) % ob.length;
    }
    function ib(a, b) {
      var c;
      if ((c = (c = ub(a, 'x')) ? c : a.la.Ca ? 0 : 2)) throw new L(c, a);
      for (c = ob[tb(a.id, b)]; c; c = c.nb) {
        var d = c.name;
        if (c.parent.id === a.id && d === b) return c;
      }
      return a.la.Ca(a, b);
    }
    function gb(a, b, c, d) {
      a = new vb(a, b, c, d);
      b = tb(a.parent.id, a.name);
      a.nb = ob[b];
      return (ob[b] = a);
    }
    var wb = {
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
    function xb(a) {
      var b = ['r', 'w', 'rw'][a & 3];
      a & 512 && (b += 'w');
      return b;
    }
    function ub(a, b) {
      if (pb) return 0;
      if (-1 === b.indexOf('r') || a.mode & 292) {
        if (
          (-1 !== b.indexOf('w') && !(a.mode & 146)) ||
          (-1 !== b.indexOf('x') && !(a.mode & 73))
        )
          return 2;
      } else return 2;
      return 0;
    }
    function yb(a, b) {
      try {
        return ib(a, b), 20;
      } catch (c) {}
      return ub(a, 'wx');
    }
    function zb(a) {
      var b = 4096;
      for (a = a || 0; a <= b; a++) if (!mb[a]) return a;
      throw new L(33);
    }
    function Ab(a, b) {
      Bb || ((Bb = function () {}), (Bb.prototype = {}));
      var c = new Bb(),
        d;
      for (d in a) c[d] = a[d];
      a = c;
      b = zb(b);
      a.va = b;
      return (mb[b] = a);
    }
    var fb = {
      open: function (a) {
        a.ma = lb[a.node.Ga].ma;
        a.ma.open && a.ma.open(a);
      },
      za: function () {
        throw new L(70);
      },
    };
    function bb(a, b) {
      lb[a] = { ma: b };
    }
    function Cb(a, b) {
      var c = '/' === b,
        d = !b;
      if (c && kb) throw new L(10);
      if (!c && !d) {
        var e = N(b, { Sa: !1 });
        b = e.path;
        e = e.node;
        if (e.Fa) throw new L(10);
        if (16384 !== (e.mode & 61440)) throw new L(54);
      }
      b = { type: a, Ob: {}, Wa: b, mb: [] };
      a = a.ua(b);
      a.ua = b;
      b.root = a;
      c ? (kb = a) : e && ((e.Fa = b), e.ua && e.ua.mb.push(b));
    }
    function Db(a, b, c) {
      var d = N(a, { parent: !0 }).node;
      a = Ya(a);
      if (!a || '.' === a || '..' === a) throw new L(28);
      var e = yb(d, a);
      if (e) throw new L(e);
      if (!d.la.Ea) throw new L(63);
      return d.la.Ea(d, a, b, c);
    }
    function O(a) {
      Db(a, 16895, 0);
    }
    function Eb(a, b, c) {
      'undefined' === typeof c && ((c = b), (b = 438));
      Db(a, b | 8192, c);
    }
    function Fb(a, b) {
      if (!Za(a)) throw new L(44);
      var c = N(b, { parent: !0 }).node;
      if (!c) throw new L(44);
      b = Ya(b);
      var d = yb(c, b);
      if (d) throw new L(d);
      if (!c.la.Ha) throw new L(63);
      c.la.Ha(c, b, a);
    }
    function rb(a) {
      a = N(a).node;
      if (!a) throw new L(44);
      if (!a.la.Da) throw new L(28);
      return Za(sb(a.parent), a.la.Da(a));
    }
    function Gb(a, b, c, d) {
      if ('' === a) throw new L(44);
      if ('string' === typeof b) {
        var e = wb[b];
        if ('undefined' === typeof e)
          throw Error('Unknown file open mode: ' + b);
        b = e;
      }
      c = b & 64 ? (('undefined' === typeof c ? 438 : c) & 4095) | 32768 : 0;
      if ('object' === typeof a) var f = a;
      else {
        a = Wa(a);
        try {
          f = N(a, { Ra: !(b & 131072) }).node;
        } catch (k) {}
      }
      e = !1;
      if (b & 64)
        if (f) {
          if (b & 128) throw new L(20);
        } else (f = Db(a, c, 0)), (e = !0);
      if (!f) throw new L(44);
      8192 === (f.mode & 61440) && (b &= -513);
      if (b & 65536 && 16384 !== (f.mode & 61440)) throw new L(54);
      if (
        !e &&
        (c = f
          ? 40960 === (f.mode & 61440)
            ? 32
            : 16384 === (f.mode & 61440) && ('r' !== xb(b) || b & 512)
            ? 31
            : ub(f, xb(b))
          : 44)
      )
        throw new L(c);
      if (b & 512) {
        c = f;
        var h;
        'string' === typeof c ? (h = N(c, { Ra: !0 }).node) : (h = c);
        if (!h.la.sa) throw new L(63);
        if (16384 === (h.mode & 61440)) throw new L(31);
        if (32768 !== (h.mode & 61440)) throw new L(28);
        if ((c = ub(h, 'w'))) throw new L(c);
        h.la.sa(h, { size: 0, timestamp: Date.now() });
      }
      b &= -131713;
      d = Ab(
        {
          node: f,
          path: sb(f),
          flags: b,
          seekable: !0,
          position: 0,
          ma: f.ma,
          Ab: [],
          error: !1,
        },
        d,
      );
      d.ma.open && d.ma.open(d);
      !g.logReadFiles ||
        b & 1 ||
        (Hb || (Hb = {}),
        a in Hb ||
          ((Hb[a] = 1), u('FS.trackingDelegate error on read file: ' + a)));
      try {
        qb.onOpenFile &&
          ((f = 0),
          1 !== (b & 2097155) && (f |= 1),
          0 !== (b & 2097155) && (f |= 2),
          qb.onOpenFile(a, f));
      } catch (k) {
        u(
          "FS.trackingDelegate['onOpenFile']('" +
            a +
            "', flags) threw an exception: " +
            k.message,
        );
      }
      return d;
    }
    function Ib(a, b, c) {
      if (null === a.va) throw new L(8);
      if (!a.seekable || !a.ma.za) throw new L(70);
      if (0 != c && 1 != c && 2 != c) throw new L(28);
      a.position = a.ma.za(a, b, c);
      a.Ab = [];
    }
    function Jb() {
      L ||
        ((L = function (a, b) {
          this.node = b;
          this.rb = function (c) {
            this.ya = c;
          };
          this.rb(a);
          this.message = 'FS error';
        }),
        (L.prototype = Error()),
        (L.prototype.constructor = L),
        [44].forEach(function (a) {
          hb[a] = new L(a);
          hb[a].stack = '<generic error, no stack>';
        }));
    }
    var Kb;
    function Lb(a, b) {
      var c = 0;
      a && (c |= 365);
      b && (c |= 146);
      return c;
    }
    function Mb(a, b, c) {
      a = Wa('/dev/' + a);
      var d = Lb(!!b, !!c);
      Nb || (Nb = 64);
      var e = (Nb++ << 8) | 0;
      bb(e, {
        open: function (f) {
          f.seekable = !1;
        },
        close: function () {
          c && c.buffer && c.buffer.length && c(10);
        },
        read: function (f, h, k, m) {
          for (var n = 0, p = 0; p < m; p++) {
            try {
              var t = b();
            } catch (v) {
              throw new L(29);
            }
            if (void 0 === t && 0 === n) throw new L(6);
            if (null === t || void 0 === t) break;
            n++;
            h[k + p] = t;
          }
          n && (f.node.timestamp = Date.now());
          return n;
        },
        write: function (f, h, k, m) {
          for (var n = 0; n < m; n++)
            try {
              c(h[k + n]);
            } catch (p) {
              throw new L(29);
            }
          m && (f.node.timestamp = Date.now());
          return n;
        },
      });
      Eb(a, d, e);
    }
    var Nb,
      P = {},
      Bb,
      Hb,
      Ob = void 0;
    function Pb() {
      Ob += 4;
      return E[(Ob - 4) >> 2];
    }
    function Qb(a) {
      a = mb[a];
      if (!a) throw new L(8);
      return a;
    }
    var Rb = {};
    function Sb(a) {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    }
    function Tb(a) {
      return this.fromWireType(H[a >> 2]);
    }
    var Ub = {},
      R = {},
      Vb = {};
    function Wb(a) {
      if (void 0 === a) return '_unknown';
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return 48 <= b && 57 >= b ? '_' + a : a;
    }
    function Xb(a, b) {
      a = Wb(a);
      return new Function(
        'body',
        'return function ' +
          a +
          '() {\n    "use strict";    return body.apply(this, arguments);\n};\n',
      )(b);
    }
    function Yb(a) {
      var b = Error,
        c = Xb(a, function (d) {
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
    var Zb = void 0;
    function $b(a, b, c) {
      function d(k) {
        k = c(k);
        if (k.length !== a.length)
          throw new Zb('Mismatched type converter count');
        for (var m = 0; m < a.length; ++m) S(a[m], k[m]);
      }
      a.forEach(function (k) {
        Vb[k] = b;
      });
      var e = Array(b.length),
        f = [],
        h = 0;
      b.forEach(function (k, m) {
        R.hasOwnProperty(k)
          ? (e[m] = R[k])
          : (f.push(k),
            Ub.hasOwnProperty(k) || (Ub[k] = []),
            Ub[k].push(function () {
              e[m] = R[k];
              ++h;
              h === f.length && d(e);
            }));
      });
      0 === f.length && d(e);
    }
    function ac(a) {
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
    var bc = void 0;
    function T(a) {
      for (var b = ''; B[a]; ) b += bc[B[a++]];
      return b;
    }
    var cc = void 0;
    function U(a) {
      throw new cc(a);
    }
    function S(a, b, c) {
      c = c || {};
      if (!('argPackAdvance' in b))
        throw new TypeError(
          'registerType registeredInstance requires argPackAdvance',
        );
      var d = b.name;
      a || U('type "' + d + '" must have a positive integer typeid pointer');
      if (R.hasOwnProperty(a)) {
        if (c.jb) return;
        U("Cannot register type '" + d + "' twice");
      }
      R[a] = b;
      delete Vb[a];
      Ub.hasOwnProperty(a) &&
        ((b = Ub[a]),
        delete Ub[a],
        b.forEach(function (e) {
          e();
        }));
    }
    var dc = [],
      V = [
        {},
        { value: void 0 },
        { value: null },
        { value: !0 },
        { value: !1 },
      ];
    function ec(a) {
      4 < a && 0 === --V[a].Ma && ((V[a] = void 0), dc.push(a));
    }
    function fc(a) {
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
          var b = dc.length ? dc.pop() : V.length;
          V[b] = { Ma: 1, value: a };
          return b;
      }
    }
    function gc(a) {
      if (null === a) return 'null';
      var b = typeof a;
      return 'object' === b || 'array' === b || 'function' === b
        ? a.toString()
        : '' + a;
    }
    function hc(a, b) {
      switch (b) {
        case 2:
          return function (c) {
            return this.fromWireType(xa[c >> 2]);
          };
        case 3:
          return function (c) {
            return this.fromWireType(ya[c >> 3]);
          };
        default:
          throw new TypeError('Unknown float type: ' + a);
      }
    }
    function ic(a) {
      var b = Function;
      if (!(b instanceof Function))
        throw new TypeError(
          'new_ called with constructor type ' +
            typeof b +
            ' which is not a function',
        );
      var c = Xb(b.name || 'unknownFunctionName', function () {});
      c.prototype = b.prototype;
      c = new c();
      a = b.apply(c, a);
      return a instanceof Object ? a : c;
    }
    function jc(a, b) {
      var c = g;
      if (void 0 === c[a].ra) {
        var d = c[a];
        c[a] = function () {
          c[a].ra.hasOwnProperty(arguments.length) ||
            U(
              "Function '" +
                b +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ') - expects one of (' +
                c[a].ra +
                ')!',
            );
          return c[a].ra[arguments.length].apply(this, arguments);
        };
        c[a].ra = [];
        c[a].ra[d.bb] = d;
      }
    }
    function kc(a, b, c) {
      g.hasOwnProperty(a)
        ? ((void 0 === c || (void 0 !== g[a].ra && void 0 !== g[a].ra[c])) &&
            U("Cannot register public name '" + a + "' twice"),
          jc(a, a),
          g.hasOwnProperty(c) &&
            U(
              'Cannot register multiple overloads of a function with the same number of arguments (' +
                c +
                ')!',
            ),
          (g[a].ra[c] = b))
        : ((g[a] = b), void 0 !== c && (g[a].Nb = c));
    }
    function lc(a, b) {
      for (var c = [], d = 0; d < a; d++) c.push(E[(b >> 2) + d]);
      return c;
    }
    function mc(a, b) {
      0 <= a.indexOf('j') ||
        x('Assertion failed: getDynCaller should only be called with i64 sigs');
      var c = [];
      return function () {
        c.length = arguments.length;
        for (var d = 0; d < arguments.length; d++) c[d] = arguments[d];
        var e;
        -1 != a.indexOf('j')
          ? (e =
              c && c.length
                ? g['dynCall_' + a].apply(null, [b].concat(c))
                : g['dynCall_' + a].call(null, b))
          : (e = A.get(b).apply(null, c));
        return e;
      };
    }
    function nc(a, b) {
      a = T(a);
      var c = -1 != a.indexOf('j') ? mc(a, b) : A.get(b);
      'function' !== typeof c &&
        U('unknown function pointer with signature ' + a + ': ' + b);
      return c;
    }
    var oc = void 0;
    function pc(a) {
      a = qc(a);
      var b = T(a);
      W(a);
      return b;
    }
    function rc(a, b) {
      function c(f) {
        e[f] || R[f] || (Vb[f] ? Vb[f].forEach(c) : (d.push(f), (e[f] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new oc(a + ': ' + d.map(pc).join([', ']));
    }
    function sc(a, b, c) {
      switch (b) {
        case 0:
          return c
            ? function (d) {
                return G[d];
              }
            : function (d) {
                return B[d];
              };
        case 1:
          return c
            ? function (d) {
                return C[d >> 1];
              }
            : function (d) {
                return ra[d >> 1];
              };
        case 2:
          return c
            ? function (d) {
                return E[d >> 2];
              }
            : function (d) {
                return H[d >> 2];
              };
        default:
          throw new TypeError('Unknown integer type: ' + a);
      }
    }
    var tc = {};
    function uc() {
      return 'object' === typeof globalThis
        ? globalThis
        : Function('return this')();
    }
    function vc(a, b) {
      var c = R[a];
      void 0 === c && U(b + ' has unknown type ' + pc(a));
      return c;
    }
    var wc = {};
    function vb(a, b, c, d) {
      a || (a = this);
      this.parent = a;
      this.ua = a.ua;
      this.Fa = null;
      this.id = nb++;
      this.name = b;
      this.mode = c;
      this.la = {};
      this.ma = {};
      this.Ga = d;
    }
    Object.defineProperties(vb.prototype, {
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
    Jb();
    ob = Array(4096);
    Cb(M, '/');
    O('/tmp');
    O('/home');
    O('/home/web_user');
    (function () {
      O('/dev');
      bb(259, {
        read: function () {
          return 0;
        },
        write: function (c, d, e, f) {
          return f;
        },
      });
      Eb('/dev/null', 259);
      ab(1280, db);
      ab(1536, eb);
      Eb('/dev/tty', 1280);
      Eb('/dev/tty1', 1536);
      if (
        'object' === typeof crypto &&
        'function' === typeof crypto.getRandomValues
      ) {
        var a = new Uint8Array(1);
        var b = function () {
          crypto.getRandomValues(a);
          return a[0];
        };
      }
      b ||
        (b = function () {
          x('random_device');
        });
      Mb('random', b);
      Mb('urandom', b);
      O('/dev/shm');
      O('/dev/shm/tmp');
    })();
    O('/proc');
    O('/proc/self');
    O('/proc/self/fd');
    Cb(
      {
        ua: function () {
          var a = gb('/proc/self', 'fd', 16895, 73);
          a.la = {
            Ca: function (b, c) {
              var d = mb[+c];
              if (!d) throw new L(8);
              b = {
                parent: null,
                ua: { Wa: 'fake' },
                la: {
                  Da: function () {
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
    Zb = g.InternalError = Yb('InternalError');
    for (var xc = Array(256), yc = 0; 256 > yc; ++yc)
      xc[yc] = String.fromCharCode(yc);
    bc = xc;
    cc = g.BindingError = Yb('BindingError');
    g.count_emval_handles = function () {
      for (var a = 0, b = 5; b < V.length; ++b) void 0 !== V[b] && ++a;
      return a;
    };
    g.get_first_emval = function () {
      for (var a = 5; a < V.length; ++a) if (void 0 !== V[a]) return V[a];
      return null;
    };
    oc = g.UnboundTypeError = Yb('UnboundTypeError');
    var Kc = {
      w: function (a) {
        return jb(a + 16) + 16;
      },
      T: function () {},
      R: function (a, b, c) {
        new Ta(a).kb(b, c);
        'uncaught_exception' in Ua ? Ua.Ua++ : (Ua.Ua = 1);
        throw a;
      },
      b: A,
      p: function (a, b, c) {
        Ob = c;
        try {
          var d = Qb(a);
          switch (b) {
            case 0:
              var e = Pb();
              return 0 > e ? -28 : Gb(d.path, d.flags, 0, e).va;
            case 1:
            case 2:
              return 0;
            case 3:
              return d.flags;
            case 4:
              return (e = Pb()), (d.flags |= e), 0;
            case 12:
              return (e = Pb()), (C[(e + 0) >> 1] = 2), 0;
            case 13:
            case 14:
              return 0;
            case 16:
            case 8:
              return -28;
            case 9:
              return (E[zc() >> 2] = 28), -1;
            default:
              return -28;
          }
        } catch (f) {
          return ('undefined' !== typeof P && f instanceof L) || x(f), -f.ya;
        }
      },
      K: function (a, b, c) {
        Ob = c;
        try {
          var d = Qb(a);
          switch (b) {
            case 21509:
            case 21505:
              return d.oa ? 0 : -59;
            case 21510:
            case 21511:
            case 21512:
            case 21506:
            case 21507:
            case 21508:
              return d.oa ? 0 : -59;
            case 21519:
              if (!d.oa) return -59;
              var e = Pb();
              return (E[e >> 2] = 0);
            case 21520:
              return d.oa ? -28 : -59;
            case 21531:
              a = e = Pb();
              if (!d.ma.lb) throw new L(59);
              return d.ma.lb(d, b, a);
            case 21523:
              return d.oa ? 0 : -59;
            case 21524:
              return d.oa ? 0 : -59;
            default:
              x('bad ioctl syscall ' + b);
          }
        } catch (f) {
          return ('undefined' !== typeof P && f instanceof L) || x(f), -f.ya;
        }
      },
      L: function (a, b, c) {
        Ob = c;
        try {
          var d = la(a),
            e = Pb();
          return Gb(d, b, e).va;
        } catch (f) {
          return ('undefined' !== typeof P && f instanceof L) || x(f), -f.ya;
        }
      },
      A: function (a) {
        var b = Rb[a];
        delete Rb[a];
        var c = b.ob,
          d = b.pb,
          e = b.Qa,
          f = e
            .map(function (h) {
              return h.ib;
            })
            .concat(
              e.map(function (h) {
                return h.yb;
              }),
            );
        $b([a], f, function (h) {
          var k = {};
          e.forEach(function (m, n) {
            var p = h[n],
              t = m.gb,
              v = m.hb,
              w = h[n + e.length],
              q = m.xb,
              D = m.zb;
            k[m.eb] = {
              read: function (y) {
                return p.fromWireType(t(v, y));
              },
              write: function (y, Q) {
                var oa = [];
                q(D, y, w.toWireType(oa, Q));
                Sb(oa);
              },
            };
          });
          return [
            {
              name: b.name,
              fromWireType: function (m) {
                var n = {},
                  p;
                for (p in k) n[p] = k[p].read(m);
                d(m);
                return n;
              },
              toWireType: function (m, n) {
                for (var p in k)
                  if (!(p in n))
                    throw new TypeError('Missing field:  "' + p + '"');
                var t = c();
                for (p in k) k[p].write(t, n[p]);
                null !== m && m.push(d, t);
                return t;
              },
              argPackAdvance: 8,
              readValueFromPointer: Tb,
              ta: d,
            },
          ];
        });
      },
      N: function (a, b, c, d, e) {
        var f = ac(c);
        b = T(b);
        S(a, {
          name: b,
          fromWireType: function (h) {
            return !!h;
          },
          toWireType: function (h, k) {
            return k ? d : e;
          },
          argPackAdvance: 8,
          readValueFromPointer: function (h) {
            if (1 === c) var k = G;
            else if (2 === c) k = C;
            else if (4 === c) k = E;
            else throw new TypeError('Unknown boolean type size: ' + b);
            return this.fromWireType(k[h >> f]);
          },
          ta: null,
        });
      },
      M: function (a, b) {
        b = T(b);
        S(a, {
          name: b,
          fromWireType: function (c) {
            var d = V[c].value;
            ec(c);
            return d;
          },
          toWireType: function (c, d) {
            return fc(d);
          },
          argPackAdvance: 8,
          readValueFromPointer: Tb,
          ta: null,
        });
      },
      s: function (a, b, c) {
        c = ac(c);
        b = T(b);
        S(a, {
          name: b,
          fromWireType: function (d) {
            return d;
          },
          toWireType: function (d, e) {
            if ('number' !== typeof e && 'boolean' !== typeof e)
              throw new TypeError(
                'Cannot convert "' + gc(e) + '" to ' + this.name,
              );
            return e;
          },
          argPackAdvance: 8,
          readValueFromPointer: hc(b, c),
          ta: null,
        });
      },
      y: function (a, b, c, d, e, f) {
        var h = lc(b, c);
        a = T(a);
        e = nc(d, e);
        kc(
          a,
          function () {
            rc('Cannot call ' + a + ' due to unbound types', h);
          },
          b - 1,
        );
        $b([], h, function (k) {
          var m = a,
            n = a;
          k = [k[0], null].concat(k.slice(1));
          var p = e,
            t = k.length;
          2 > t &&
            U(
              "argTypes array size mismatch! Must at least get return value and 'this' types!",
            );
          for (var v = null !== k[1] && !1, w = !1, q = 1; q < k.length; ++q)
            if (null !== k[q] && void 0 === k[q].ta) {
              w = !0;
              break;
            }
          var D = 'void' !== k[0].name,
            y = '',
            Q = '';
          for (q = 0; q < t - 2; ++q)
            (y += (0 !== q ? ', ' : '') + 'arg' + q),
              (Q += (0 !== q ? ', ' : '') + 'arg' + q + 'Wired');
          n =
            'return function ' +
            Wb(n) +
            '(' +
            y +
            ') {\nif (arguments.length !== ' +
            (t - 2) +
            ") {\nthrowBindingError('function " +
            n +
            " called with ' + arguments.length + ' arguments, expected " +
            (t - 2) +
            " args!');\n}\n";
          w && (n += 'var destructors = [];\n');
          var oa = w ? 'destructors' : 'null';
          y = 'throwBindingError invoker fn runDestructors retType classParam'.split(
            ' ',
          );
          p = [U, p, f, Sb, k[0], k[1]];
          v &&
            (n += 'var thisWired = classParam.toWireType(' + oa + ', this);\n');
          for (q = 0; q < t - 2; ++q)
            (n +=
              'var arg' +
              q +
              'Wired = argType' +
              q +
              '.toWireType(' +
              oa +
              ', arg' +
              q +
              '); // ' +
              k[q + 2].name +
              '\n'),
              y.push('argType' + q),
              p.push(k[q + 2]);
          v && (Q = 'thisWired' + (0 < Q.length ? ', ' : '') + Q);
          n +=
            (D ? 'var rv = ' : '') +
            'invoker(fn' +
            (0 < Q.length ? ', ' : '') +
            Q +
            ');\n';
          if (w) n += 'runDestructors(destructors);\n';
          else
            for (q = v ? 1 : 2; q < k.length; ++q)
              (t = 1 === q ? 'thisWired' : 'arg' + (q - 2) + 'Wired'),
                null !== k[q].ta &&
                  ((n += t + '_dtor(' + t + '); // ' + k[q].name + '\n'),
                  y.push(t + '_dtor'),
                  p.push(k[q].ta));
          D && (n += 'var ret = retType.fromWireType(rv);\nreturn ret;\n');
          y.push(n + '}\n');
          k = ic(y).apply(null, p);
          q = b - 1;
          if (!g.hasOwnProperty(m))
            throw new Zb('Replacing nonexistant public symbol');
          void 0 !== g[m].ra && void 0 !== q
            ? (g[m].ra[q] = k)
            : ((g[m] = k), (g[m].bb = q));
          return [];
        });
      },
      i: function (a, b, c, d, e) {
        function f(n) {
          return n;
        }
        b = T(b);
        -1 === e && (e = 4294967295);
        var h = ac(c);
        if (0 === d) {
          var k = 32 - 8 * c;
          f = function (n) {
            return (n << k) >>> k;
          };
        }
        var m = -1 != b.indexOf('unsigned');
        S(a, {
          name: b,
          fromWireType: f,
          toWireType: function (n, p) {
            if ('number' !== typeof p && 'boolean' !== typeof p)
              throw new TypeError(
                'Cannot convert "' + gc(p) + '" to ' + this.name,
              );
            if (p < d || p > e)
              throw new TypeError(
                'Passing a number "' +
                  gc(p) +
                  '" from JS side to C/C++ side to an argument of type "' +
                  b +
                  '", which is outside the valid range [' +
                  d +
                  ', ' +
                  e +
                  ']!',
              );
            return m ? p >>> 0 : p | 0;
          },
          argPackAdvance: 8,
          readValueFromPointer: sc(b, h, 0 !== d),
          ta: null,
        });
      },
      h: function (a, b, c) {
        function d(f) {
          f >>= 2;
          var h = H;
          return new e(F, h[f + 1], h[f]);
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
        c = T(c);
        S(
          a,
          {
            name: c,
            fromWireType: d,
            argPackAdvance: 8,
            readValueFromPointer: d,
          },
          { jb: !0 },
        );
      },
      u: function (a, b) {
        b = T(b);
        var c = 'std::string' === b;
        S(a, {
          name: b,
          fromWireType: function (d) {
            var e = H[d >> 2];
            if (c)
              for (var f = d + 4, h = 0; h <= e; ++h) {
                var k = d + 4 + h;
                if (h == e || 0 == B[k]) {
                  f = la(f, k - f);
                  if (void 0 === m) var m = f;
                  else (m += String.fromCharCode(0)), (m += f);
                  f = k + 1;
                }
              }
            else {
              m = Array(e);
              for (h = 0; h < e; ++h) m[h] = String.fromCharCode(B[d + 4 + h]);
              m = m.join('');
            }
            W(d);
            return m;
          },
          toWireType: function (d, e) {
            e instanceof ArrayBuffer && (e = new Uint8Array(e));
            var f = 'string' === typeof e;
            f ||
              e instanceof Uint8Array ||
              e instanceof Uint8ClampedArray ||
              e instanceof Int8Array ||
              U('Cannot pass non-string to std::string');
            var h = (c && f
                ? function () {
                    return na(e);
                  }
                : function () {
                    return e.length;
                  })(),
              k = jb(4 + h + 1);
            H[k >> 2] = h;
            if (c && f) ma(e, B, k + 4, h + 1);
            else if (f)
              for (f = 0; f < h; ++f) {
                var m = e.charCodeAt(f);
                255 < m &&
                  (W(k),
                  U('String has UTF-16 code units that do not fit in 8 bits'));
                B[k + 4 + f] = m;
              }
            else for (f = 0; f < h; ++f) B[k + 4 + f] = e[f];
            null !== d && d.push(W, k);
            return k;
          },
          argPackAdvance: 8,
          readValueFromPointer: Tb,
          ta: function (d) {
            W(d);
          },
        });
      },
      n: function (a, b, c) {
        c = T(c);
        if (2 === b) {
          var d = qa;
          var e = sa;
          var f = ta;
          var h = function () {
            return ra;
          };
          var k = 1;
        } else
          4 === b &&
            ((d = ua),
            (e = va),
            (f = wa),
            (h = function () {
              return H;
            }),
            (k = 2));
        S(a, {
          name: c,
          fromWireType: function (m) {
            for (var n = H[m >> 2], p = h(), t, v = m + 4, w = 0; w <= n; ++w) {
              var q = m + 4 + w * b;
              if (w == n || 0 == p[q >> k])
                (v = d(v, q - v)),
                  void 0 === t
                    ? (t = v)
                    : ((t += String.fromCharCode(0)), (t += v)),
                  (v = q + b);
            }
            W(m);
            return t;
          },
          toWireType: function (m, n) {
            'string' !== typeof n &&
              U('Cannot pass non-string to C++ string type ' + c);
            var p = f(n),
              t = jb(4 + p + b);
            H[t >> 2] = p >> k;
            e(n, t + 4, p + b);
            null !== m && m.push(W, t);
            return t;
          },
          argPackAdvance: 8,
          readValueFromPointer: Tb,
          ta: function (m) {
            W(m);
          },
        });
      },
      F: function (a, b, c, d, e, f) {
        Rb[a] = { name: T(b), ob: nc(c, d), pb: nc(e, f), Qa: [] };
      },
      z: function (a, b, c, d, e, f, h, k, m, n) {
        Rb[a].Qa.push({
          eb: T(b),
          ib: c,
          gb: nc(d, e),
          hb: f,
          yb: h,
          xb: nc(k, m),
          zb: n,
        });
      },
      O: function (a, b) {
        b = T(b);
        S(a, {
          Kb: !0,
          name: b,
          argPackAdvance: 0,
          fromWireType: function () {},
          toWireType: function () {},
        });
      },
      t: ec,
      S: function (a) {
        if (0 === a) return fc(uc());
        var b = tc[a];
        a = void 0 === b ? T(a) : b;
        return fc(uc()[a]);
      },
      x: function (a) {
        4 < a && (V[a].Ma += 1);
      },
      H: function (a, b, c, d) {
        a || U('Cannot use deleted val. handle = ' + a);
        a = V[a].value;
        var e = wc[b];
        if (!e) {
          e = '';
          for (var f = 0; f < b; ++f) e += (0 !== f ? ', ' : '') + 'arg' + f;
          var h =
            'return function emval_allocator_' +
            b +
            '(constructor, argTypes, args) {\n';
          for (f = 0; f < b; ++f)
            h +=
              'var argType' +
              f +
              " = requireRegisteredType(Module['HEAP32'][(argTypes >>> 2) + " +
              f +
              '], "parameter ' +
              f +
              '");\nvar arg' +
              f +
              ' = argType' +
              f +
              '.readValueFromPointer(args);\nargs += argType' +
              f +
              "['argPackAdvance'];\n";
          e = new Function(
            'requireRegisteredType',
            'Module',
            '__emval_register',
            h +
              ('var obj = new constructor(' +
                e +
                ');\nreturn __emval_register(obj);\n}\n'),
          )(vc, g, fc);
          wc[b] = e;
        }
        return e(a, c, d);
      },
      v: function () {
        x();
      },
      P: function () {
        u('missing function: aom_codec_av1_dx');
        x(-1);
      },
      g: function (a, b) {
        X(a, b || 1);
        throw 'longjmp';
      },
      I: function (a, b, c) {
        B.copyWithin(a, b, b + c);
      },
      j: function (a) {
        a >>>= 0;
        var b = B.length;
        if (2147483648 < a) return !1;
        for (var c = 1; 4 >= c; c *= 2) {
          var d = b * (1 + 0.2 / c);
          d = Math.min(d, a + 100663296);
          d = Math.max(16777216, a, d);
          0 < d % 65536 && (d += 65536 - (d % 65536));
          a: {
            try {
              z.grow((Math.min(2147483648, d) - F.byteLength + 65535) >>> 16);
              za(z.buffer);
              var e = 1;
              break a;
            } catch (f) {}
            e = void 0;
          }
          if (e) return !0;
        }
        return !1;
      },
      r: function (a) {
        try {
          var b = Qb(a);
          if (null === b.va) throw new L(8);
          b.Ja && (b.Ja = null);
          try {
            b.ma.close && b.ma.close(b);
          } catch (c) {
            throw c;
          } finally {
            mb[b.va] = null;
          }
          b.va = null;
          return 0;
        } catch (c) {
          return ('undefined' !== typeof P && c instanceof L) || x(c), c.ya;
        }
      },
      J: function (a, b, c, d) {
        try {
          a: {
            for (var e = Qb(a), f = (a = 0); f < c; f++) {
              var h = E[(b + (8 * f + 4)) >> 2],
                k = e,
                m = E[(b + 8 * f) >> 2],
                n = h,
                p = void 0,
                t = G;
              if (0 > n || 0 > p) throw new L(28);
              if (null === k.va) throw new L(8);
              if (1 === (k.flags & 2097155)) throw new L(8);
              if (16384 === (k.node.mode & 61440)) throw new L(31);
              if (!k.ma.read) throw new L(28);
              var v = 'undefined' !== typeof p;
              if (!v) p = k.position;
              else if (!k.seekable) throw new L(70);
              var w = k.ma.read(k, t, m, n, p);
              v || (k.position += w);
              var q = w;
              if (0 > q) {
                var D = -1;
                break a;
              }
              a += q;
              if (q < h) break;
            }
            D = a;
          }
          E[d >> 2] = D;
          return 0;
        } catch (y) {
          return ('undefined' !== typeof P && y instanceof L) || x(y), y.ya;
        }
      },
      E: function (a, b, c, d, e) {
        try {
          var f = Qb(a);
          a = 4294967296 * c + (b >>> 0);
          if (-9007199254740992 >= a || 9007199254740992 <= a) return -61;
          Ib(f, a, d);
          Qa = [
            f.position >>> 0,
            ((K = f.position),
            1 <= +Ga(K)
              ? 0 < K
                ? (Ja(+Ia(K / 4294967296), 4294967295) | 0) >>> 0
                : ~~+Ha((K - +(~~K >>> 0)) / 4294967296) >>> 0
              : 0),
          ];
          E[e >> 2] = Qa[0];
          E[(e + 4) >> 2] = Qa[1];
          f.Ja && 0 === a && 0 === d && (f.Ja = null);
          return 0;
        } catch (h) {
          return ('undefined' !== typeof P && h instanceof L) || x(h), h.ya;
        }
      },
      q: function (a, b, c, d) {
        try {
          a: {
            for (var e = Qb(a), f = (a = 0); f < c; f++) {
              var h = e,
                k = E[(b + 8 * f) >> 2],
                m = E[(b + (8 * f + 4)) >> 2],
                n = void 0,
                p = G;
              if (0 > m || 0 > n) throw new L(28);
              if (null === h.va) throw new L(8);
              if (0 === (h.flags & 2097155)) throw new L(8);
              if (16384 === (h.node.mode & 61440)) throw new L(31);
              if (!h.ma.write) throw new L(28);
              h.seekable && h.flags & 1024 && Ib(h, 0, 2);
              var t = 'undefined' !== typeof n;
              if (!t) n = h.position;
              else if (!h.seekable) throw new L(70);
              var v = h.ma.write(h, p, k, m, n, void 0);
              t || (h.position += v);
              try {
                if (h.path && qb.onWriteToFile) qb.onWriteToFile(h.path);
              } catch (D) {
                u(
                  "FS.trackingDelegate['onWriteToFile']('" +
                    h.path +
                    "') threw an exception: " +
                    D.message,
                );
              }
              var w = v;
              if (0 > w) {
                var q = -1;
                break a;
              }
              a += w;
            }
            q = a;
          }
          E[d >> 2] = q;
          return 0;
        } catch (D) {
          return ('undefined' !== typeof P && D instanceof L) || x(D), D.ya;
        }
      },
      d: function () {
        return fa | 0;
      },
      k: Ac,
      f: Bc,
      o: Cc,
      G: Dc,
      C: Ec,
      B: Fc,
      D: Gc,
      m: Hc,
      l: Ic,
      e: Jc,
      a: z,
      c: function (a) {
        fa = a | 0;
      },
      Q: function (a) {
        var b = (Date.now() / 1e3) | 0;
        a && (E[a >> 2] = b);
        return b;
      },
    };
    (function () {
      function a(e) {
        g.asm = e.exports;
        I--;
        g.monitorRunDependencies && g.monitorRunDependencies(I);
        0 == I &&
          (null !== Ka && (clearInterval(Ka), (Ka = null)),
          La && ((e = La), (La = null), e()));
      }
      function b(e) {
        a(e.instance);
      }
      function c(e) {
        return Pa()
          .then(function (f) {
            return WebAssembly.instantiate(f, d);
          })
          .then(e, function (f) {
            u('failed to asynchronously prepare wasm: ' + f);
            x(f);
          });
      }
      var d = { a: Kc };
      I++;
      g.monitorRunDependencies && g.monitorRunDependencies(I);
      if (g.instantiateWasm)
        try {
          return g.instantiateWasm(d, a);
        } catch (e) {
          return (
            u('Module.instantiateWasm callback failed with error: ' + e), !1
          );
        }
      (function () {
        if (
          ha ||
          'function' !== typeof WebAssembly.instantiateStreaming ||
          Ma() ||
          'function' !== typeof fetch
        )
          return c(b);
        fetch(J, { credentials: 'same-origin' }).then(function (e) {
          return WebAssembly.instantiateStreaming(e, d).then(b, function (f) {
            u('wasm streaming compile failed: ' + f);
            u('falling back to ArrayBuffer instantiation');
            return c(b);
          });
        });
      })();
      return {};
    })();
    var Ra = (g.___wasm_call_ctors = function () {
        return (Ra = g.___wasm_call_ctors = g.asm.U).apply(null, arguments);
      }),
      jb = (g._malloc = function () {
        return (jb = g._malloc = g.asm.V).apply(null, arguments);
      }),
      W = (g._free = function () {
        return (W = g._free = g.asm.W).apply(null, arguments);
      }),
      qc = (g.___getTypeName = function () {
        return (qc = g.___getTypeName = g.asm.X).apply(null, arguments);
      });
    g.___embind_register_native_and_builtin_types = function () {
      return (g.___embind_register_native_and_builtin_types = g.asm.Y).apply(
        null,
        arguments,
      );
    };
    var zc = (g.___errno_location = function () {
        return (zc = g.___errno_location = g.asm.Z).apply(null, arguments);
      }),
      X = (g._setThrew = function () {
        return (X = g._setThrew = g.asm._).apply(null, arguments);
      }),
      Y = (g.stackSave = function () {
        return (Y = g.stackSave = g.asm.$).apply(null, arguments);
      }),
      Z = (g.stackRestore = function () {
        return (Z = g.stackRestore = g.asm.aa).apply(null, arguments);
      }),
      Lc = (g.dynCall_iiiijj = function () {
        return (Lc = g.dynCall_iiiijj = g.asm.ba).apply(null, arguments);
      }),
      Mc = (g.dynCall_ij = function () {
        return (Mc = g.dynCall_ij = g.asm.ca).apply(null, arguments);
      }),
      Nc = (g.dynCall_jjij = function () {
        return (Nc = g.dynCall_jjij = g.asm.da).apply(null, arguments);
      });
    g.dynCall_jiiiiiiiii = function () {
      return (g.dynCall_jiiiiiiiii = g.asm.ea).apply(null, arguments);
    };
    g.dynCall_jiji = function () {
      return (g.dynCall_jiji = g.asm.fa).apply(null, arguments);
    };
    g.dynCall_jiiiiiiii = function () {
      return (g.dynCall_jiiiiiiii = g.asm.ga).apply(null, arguments);
    };
    g.dynCall_jiiiiii = function () {
      return (g.dynCall_jiiiiii = g.asm.ha).apply(null, arguments);
    };
    g.dynCall_jiiiii = function () {
      return (g.dynCall_jiiiii = g.asm.ia).apply(null, arguments);
    };
    g.dynCall_iiijii = function () {
      return (g.dynCall_iiijii = g.asm.ja).apply(null, arguments);
    };
    function Bc(a, b, c) {
      var d = Y();
      try {
        return A.get(a)(b, c);
      } catch (e) {
        Z(d);
        if (e !== e + 0 && 'longjmp' !== e) throw e;
        X(1, 0);
      }
    }
    function Hc(a, b) {
      var c = Y();
      try {
        A.get(a)(b);
      } catch (d) {
        Z(c);
        if (d !== d + 0 && 'longjmp' !== d) throw d;
        X(1, 0);
      }
    }
    function Jc(a, b, c, d, e) {
      var f = Y();
      try {
        A.get(a)(b, c, d, e);
      } catch (h) {
        Z(f);
        if (h !== h + 0 && 'longjmp' !== h) throw h;
        X(1, 0);
      }
    }
    function Ic(a, b, c) {
      var d = Y();
      try {
        A.get(a)(b, c);
      } catch (e) {
        Z(d);
        if (e !== e + 0 && 'longjmp' !== e) throw e;
        X(1, 0);
      }
    }
    function Ac(a, b) {
      var c = Y();
      try {
        return A.get(a)(b);
      } catch (d) {
        Z(c);
        if (d !== d + 0 && 'longjmp' !== d) throw d;
        X(1, 0);
      }
    }
    function Dc(a, b, c, d, e, f, h, k, m, n) {
      var p = Y();
      try {
        return A.get(a)(b, c, d, e, f, h, k, m, n);
      } catch (t) {
        Z(p);
        if (t !== t + 0 && 'longjmp' !== t) throw t;
        X(1, 0);
      }
    }
    function Cc(a, b, c, d, e, f, h, k, m) {
      var n = Y();
      try {
        return A.get(a)(b, c, d, e, f, h, k, m);
      } catch (p) {
        Z(n);
        if (p !== p + 0 && 'longjmp' !== p) throw p;
        X(1, 0);
      }
    }
    function Gc(a, b, c, d, e, f) {
      var h = Y();
      try {
        return Nc(a, b, c, d, e, f);
      } catch (k) {
        Z(h);
        if (k !== k + 0 && 'longjmp' !== k) throw k;
        X(1, 0);
      }
    }
    function Ec(a, b, c, d, e, f, h, k) {
      var m = Y();
      try {
        return Lc(a, b, c, d, e, f, h, k);
      } catch (n) {
        Z(m);
        if (n !== n + 0 && 'longjmp' !== n) throw n;
        X(1, 0);
      }
    }
    function Fc(a, b, c) {
      var d = Y();
      try {
        return Mc(a, b, c);
      } catch (e) {
        Z(d);
        if (e !== e + 0 && 'longjmp' !== e) throw e;
        X(1, 0);
      }
    }
    var Oc;
    La = function Pc() {
      Oc || Qc();
      Oc || (La = Pc);
    };
    function Qc() {
      function a() {
        if (!Oc && ((Oc = !0), (g.calledRun = !0), !ia)) {
          g.noFSInit ||
            Kb ||
            ((Kb = !0),
            Jb(),
            (g.stdin = g.stdin),
            (g.stdout = g.stdout),
            (g.stderr = g.stderr),
            g.stdin ? Mb('stdin', g.stdin) : Fb('/dev/tty', '/dev/stdin'),
            g.stdout
              ? Mb('stdout', null, g.stdout)
              : Fb('/dev/tty', '/dev/stdout'),
            g.stderr
              ? Mb('stderr', null, g.stderr)
              : Fb('/dev/tty1', '/dev/stderr'),
            Gb('/dev/stdin', 'r'),
            Gb('/dev/stdout', 'w'),
            Gb('/dev/stderr', 'w'));
          Sa(Ca);
          pb = !1;
          Sa(Da);
          aa(g);
          if (g.onRuntimeInitialized) g.onRuntimeInitialized();
          if (g.postRun)
            for (
              'function' == typeof g.postRun && (g.postRun = [g.postRun]);
              g.postRun.length;

            ) {
              var b = g.postRun.shift();
              Ea.unshift(b);
            }
          Sa(Ea);
        }
      }
      if (!(0 < I)) {
        if (g.preRun)
          for (
            'function' == typeof g.preRun && (g.preRun = [g.preRun]);
            g.preRun.length;

          )
            Fa();
        Sa(Ba);
        0 < I ||
          (g.setStatus
            ? (g.setStatus('Running...'),
              setTimeout(function () {
                setTimeout(function () {
                  g.setStatus('');
                }, 1);
                a();
              }, 1))
            : a());
      }
    }
    g.run = Qc;
    if (g.preInit)
      for (
        'function' == typeof g.preInit && (g.preInit = [g.preInit]);
        0 < g.preInit.length;

      )
        g.preInit.pop()();
    noExitRuntime = !0;
    Qc();

    return Module.ready;
  };
})();
export default Module;
