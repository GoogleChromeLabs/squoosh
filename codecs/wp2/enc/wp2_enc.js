var wp2_enc = (function () {
  var _scriptDir =
    typeof document !== 'undefined' && document.currentScript
      ? document.currentScript.src
      : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return function (wp2_enc) {
    wp2_enc = wp2_enc || {};

    var c;
    c || (c = typeof wp2_enc !== 'undefined' ? wp2_enc : {});
    var aa, ba;
    c.ready = new Promise(function (a, b) {
      aa = a;
      ba = b;
    });
    var r = {},
      t;
    for (t in c) c.hasOwnProperty(t) && (r[t] = c[t]);
    var u = !1,
      v = !1,
      ca = !1,
      da = !1;
    u = 'object' === typeof window;
    v = 'function' === typeof importScripts;
    ca =
      'object' === typeof process &&
      'object' === typeof process.versions &&
      'string' === typeof process.versions.node;
    da = !u && !ca && !v;
    var w = '',
      y,
      B,
      ea,
      fa;
    if (ca)
      (w = v ? require('path').dirname(w) + '/' : __dirname + '/'),
        (y = function (a, b) {
          ea || (ea = require('fs'));
          fa || (fa = require('path'));
          a = fa.normalize(a);
          return ea.readFileSync(a, b ? null : 'utf8');
        }),
        (B = function (a) {
          a = y(a, !0);
          a.buffer || (a = new Uint8Array(a));
          a.buffer || C('Assertion failed: undefined');
          return a;
        }),
        1 < process.argv.length && process.argv[1].replace(/\\/g, '/'),
        process.argv.slice(2),
        process.on('uncaughtException', function (a) {
          throw a;
        }),
        process.on('unhandledRejection', C),
        (c.inspect = function () {
          return '[Emscripten Module object]';
        });
    else if (da)
      'undefined' != typeof read &&
        (y = function (a) {
          return read(a);
        }),
        (B = function (a) {
          if ('function' === typeof readbuffer)
            return new Uint8Array(readbuffer(a));
          a = read(a, 'binary');
          'object' === typeof a || C('Assertion failed: undefined');
          return a;
        }),
        'undefined' !== typeof print &&
          ('undefined' === typeof console && (console = {}),
          (console.log = print),
          (console.warn = console.error =
            'undefined' !== typeof printErr ? printErr : print));
    else if (u || v)
      v
        ? (w = self.location.href)
        : document.currentScript && (w = document.currentScript.src),
        _scriptDir && (w = _scriptDir),
        0 !== w.indexOf('blob:')
          ? (w = w.substr(0, w.lastIndexOf('/') + 1))
          : (w = ''),
        (y = function (a) {
          var b = new XMLHttpRequest();
          b.open('GET', a, !1);
          b.send(null);
          return b.responseText;
        }),
        v &&
          (B = function (a) {
            var b = new XMLHttpRequest();
            b.open('GET', a, !1);
            b.responseType = 'arraybuffer';
            b.send(null);
            return new Uint8Array(b.response);
          });
    var ha = c.print || console.log.bind(console),
      D = c.printErr || console.warn.bind(console);
    for (t in r) r.hasOwnProperty(t) && (c[t] = r[t]);
    r = null;
    var E;
    c.wasmBinary && (E = c.wasmBinary);
    var noExitRuntime;
    c.noExitRuntime && (noExitRuntime = c.noExitRuntime);
    'object' !== typeof WebAssembly && C('no native wasm support detected');
    var F,
      ia = new WebAssembly.Table({
        initial: 432,
        maximum: 432,
        element: 'anyfunc',
      }),
      ka = !1,
      la =
        'undefined' !== typeof TextDecoder ? new TextDecoder('utf8') : void 0;
    function H(a, b, d) {
      var e = b + d;
      for (d = b; a[d] && !(d >= e); ) ++d;
      if (16 < d - b && a.subarray && la) return la.decode(a.subarray(b, d));
      for (e = ''; b < d; ) {
        var f = a[b++];
        if (f & 128) {
          var g = a[b++] & 63;
          if (192 == (f & 224)) e += String.fromCharCode(((f & 31) << 6) | g);
          else {
            var l = a[b++] & 63;
            f =
              224 == (f & 240)
                ? ((f & 15) << 12) | (g << 6) | l
                : ((f & 7) << 18) | (g << 12) | (l << 6) | (a[b++] & 63);
            65536 > f
              ? (e += String.fromCharCode(f))
              : ((f -= 65536),
                (e += String.fromCharCode(
                  55296 | (f >> 10),
                  56320 | (f & 1023),
                )));
          }
        } else e += String.fromCharCode(f);
      }
      return e;
    }
    function ma(a, b, d) {
      var e = I;
      if (0 < d) {
        d = b + d - 1;
        for (var f = 0; f < a.length; ++f) {
          var g = a.charCodeAt(f);
          if (55296 <= g && 57343 >= g) {
            var l = a.charCodeAt(++f);
            g = (65536 + ((g & 1023) << 10)) | (l & 1023);
          }
          if (127 >= g) {
            if (b >= d) break;
            e[b++] = g;
          } else {
            if (2047 >= g) {
              if (b + 1 >= d) break;
              e[b++] = 192 | (g >> 6);
            } else {
              if (65535 >= g) {
                if (b + 2 >= d) break;
                e[b++] = 224 | (g >> 12);
              } else {
                if (b + 3 >= d) break;
                e[b++] = 240 | (g >> 18);
                e[b++] = 128 | ((g >> 12) & 63);
              }
              e[b++] = 128 | ((g >> 6) & 63);
            }
            e[b++] = 128 | (g & 63);
          }
        }
        e[b] = 0;
      }
    }
    var na =
      'undefined' !== typeof TextDecoder ? new TextDecoder('utf-16le') : void 0;
    function oa(a, b) {
      var d = a >> 1;
      for (var e = d + b / 2; !(d >= e) && J[d]; ) ++d;
      d <<= 1;
      if (32 < d - a && na) return na.decode(I.subarray(a, d));
      d = 0;
      for (e = ''; ; ) {
        var f = K[(a + 2 * d) >> 1];
        if (0 == f || d == b / 2) return e;
        ++d;
        e += String.fromCharCode(f);
      }
    }
    function pa(a, b, d) {
      void 0 === d && (d = 2147483647);
      if (2 > d) return 0;
      d -= 2;
      var e = b;
      d = d < 2 * a.length ? d / 2 : a.length;
      for (var f = 0; f < d; ++f) (K[b >> 1] = a.charCodeAt(f)), (b += 2);
      K[b >> 1] = 0;
      return b - e;
    }
    function qa(a) {
      return 2 * a.length;
    }
    function ra(a, b) {
      for (var d = 0, e = ''; !(d >= b / 4); ) {
        var f = L[(a + 4 * d) >> 2];
        if (0 == f) break;
        ++d;
        65536 <= f
          ? ((f -= 65536),
            (e += String.fromCharCode(55296 | (f >> 10), 56320 | (f & 1023))))
          : (e += String.fromCharCode(f));
      }
      return e;
    }
    function sa(a, b, d) {
      void 0 === d && (d = 2147483647);
      if (4 > d) return 0;
      var e = b;
      d = e + d - 4;
      for (var f = 0; f < a.length; ++f) {
        var g = a.charCodeAt(f);
        if (55296 <= g && 57343 >= g) {
          var l = a.charCodeAt(++f);
          g = (65536 + ((g & 1023) << 10)) | (l & 1023);
        }
        L[b >> 2] = g;
        b += 4;
        if (b + 4 > d) break;
      }
      L[b >> 2] = 0;
      return b - e;
    }
    function ta(a) {
      for (var b = 0, d = 0; d < a.length; ++d) {
        var e = a.charCodeAt(d);
        55296 <= e && 57343 >= e && ++d;
        b += 4;
      }
      return b;
    }
    var M, ua, I, K, J, L, N, va, wa;
    function xa(a) {
      M = a;
      c.HEAP8 = ua = new Int8Array(a);
      c.HEAP16 = K = new Int16Array(a);
      c.HEAP32 = L = new Int32Array(a);
      c.HEAPU8 = I = new Uint8Array(a);
      c.HEAPU16 = J = new Uint16Array(a);
      c.HEAPU32 = N = new Uint32Array(a);
      c.HEAPF32 = va = new Float32Array(a);
      c.HEAPF64 = wa = new Float64Array(a);
    }
    var ya = c.INITIAL_MEMORY || 16777216;
    c.wasmMemory
      ? (F = c.wasmMemory)
      : (F = new WebAssembly.Memory({ initial: ya / 65536, maximum: 32768 }));
    F && (M = F.buffer);
    ya = M.byteLength;
    xa(M);
    L[35016] = 5383104;
    function za(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ('function' == typeof b) b(c);
        else {
          var d = b.pa;
          'number' === typeof d
            ? void 0 === b.ja
              ? c.dynCall_v(d)
              : c.dynCall_vi(d, b.ja)
            : d(void 0 === b.ja ? null : b.ja);
        }
      }
    }
    var Aa = [],
      Ba = [],
      Ca = [],
      Da = [];
    function Ea() {
      var a = c.preRun.shift();
      Aa.unshift(a);
    }
    var Fa = Math.ceil,
      Ga = Math.floor,
      O = 0,
      Ha = null,
      P = null;
    c.preloadedImages = {};
    c.preloadedAudios = {};
    function C(a) {
      if (c.onAbort) c.onAbort(a);
      D(a);
      ka = !0;
      a = new WebAssembly.RuntimeError(
        'abort(' + a + '). Build with -s ASSERTIONS=1 for more info.',
      );
      ba(a);
      throw a;
    }
    function Ia(a) {
      var b = Q;
      return String.prototype.startsWith ? b.startsWith(a) : 0 === b.indexOf(a);
    }
    function Ja() {
      return Ia('data:application/octet-stream;base64,');
    }
    var Q = 'wp2_enc.wasm';
    if (!Ja()) {
      var Ka = Q;
      Q = c.locateFile ? c.locateFile(Ka, w) : w + Ka;
    }
    function La() {
      try {
        if (E) return new Uint8Array(E);
        if (B) return B(Q);
        throw 'both async and sync fetching of the wasm failed';
      } catch (a) {
        C(a);
      }
    }
    function Ma() {
      return E || (!u && !v) || 'function' !== typeof fetch || Ia('file://')
        ? new Promise(function (a) {
            a(La());
          })
        : fetch(Q, { credentials: 'same-origin' })
            .then(function (a) {
              if (!a.ok) throw "failed to load wasm binary file at '" + Q + "'";
              return a.arrayBuffer();
            })
            .catch(function () {
              return La();
            });
    }
    Ba.push({
      pa: function () {
        Na();
      },
    });
    function Oa() {
      return 0 < Oa.ma;
    }
    var Pa = {};
    function Qa(a) {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    }
    function Ra(a) {
      return this.fromWireType(N[a >> 2]);
    }
    var R = {},
      S = {},
      Sa = {};
    function Ta(a) {
      if (void 0 === a) return '_unknown';
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return 48 <= b && 57 >= b ? '_' + a : a;
    }
    function Ua(a, b) {
      a = Ta(a);
      return new Function(
        'body',
        'return function ' +
          a +
          '() {\n    "use strict";    return body.apply(this, arguments);\n};\n',
      )(b);
    }
    function Va(a) {
      var b = Error,
        d = Ua(a, function (e) {
          this.name = a;
          this.message = e;
          e = Error(e).stack;
          void 0 !== e &&
            (this.stack =
              this.toString() + '\n' + e.replace(/^Error(:[^\n]*)?\n/, ''));
        });
      d.prototype = Object.create(b.prototype);
      d.prototype.constructor = d;
      d.prototype.toString = function () {
        return void 0 === this.message
          ? this.name
          : this.name + ': ' + this.message;
      };
      return d;
    }
    var Wa = void 0;
    function Xa(a, b, d) {
      function e(k) {
        k = d(k);
        if (k.length !== a.length)
          throw new Wa('Mismatched type converter count');
        for (var h = 0; h < a.length; ++h) T(a[h], k[h]);
      }
      a.forEach(function (k) {
        Sa[k] = b;
      });
      var f = Array(b.length),
        g = [],
        l = 0;
      b.forEach(function (k, h) {
        S.hasOwnProperty(k)
          ? (f[h] = S[k])
          : (g.push(k),
            R.hasOwnProperty(k) || (R[k] = []),
            R[k].push(function () {
              f[h] = S[k];
              ++l;
              l === g.length && e(f);
            }));
      });
      0 === g.length && e(f);
    }
    function Ya(a) {
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
    var Za = void 0;
    function U(a) {
      for (var b = ''; I[a]; ) b += Za[I[a++]];
      return b;
    }
    var $a = void 0;
    function V(a) {
      throw new $a(a);
    }
    function T(a, b, d) {
      d = d || {};
      if (!('argPackAdvance' in b))
        throw new TypeError(
          'registerType registeredInstance requires argPackAdvance',
        );
      var e = b.name;
      a || V('type "' + e + '" must have a positive integer typeid pointer');
      if (S.hasOwnProperty(a)) {
        if (d.ta) return;
        V("Cannot register type '" + e + "' twice");
      }
      S[a] = b;
      delete Sa[a];
      R.hasOwnProperty(a) &&
        ((b = R[a]),
        delete R[a],
        b.forEach(function (f) {
          f();
        }));
    }
    var ab = [],
      X = [
        {},
        { value: void 0 },
        { value: null },
        { value: !0 },
        { value: !1 },
      ];
    function bb(a) {
      4 < a && 0 === --X[a].ka && ((X[a] = void 0), ab.push(a));
    }
    function cb(a) {
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
          var b = ab.length ? ab.pop() : X.length;
          X[b] = { ka: 1, value: a };
          return b;
      }
    }
    function db(a) {
      if (null === a) return 'null';
      var b = typeof a;
      return 'object' === b || 'array' === b || 'function' === b
        ? a.toString()
        : '' + a;
    }
    function eb(a, b) {
      switch (b) {
        case 2:
          return function (d) {
            return this.fromWireType(va[d >> 2]);
          };
        case 3:
          return function (d) {
            return this.fromWireType(wa[d >> 3]);
          };
        default:
          throw new TypeError('Unknown float type: ' + a);
      }
    }
    function fb(a) {
      var b = Function;
      if (!(b instanceof Function))
        throw new TypeError(
          'new_ called with constructor type ' +
            typeof b +
            ' which is not a function',
        );
      var d = Ua(b.name || 'unknownFunctionName', function () {});
      d.prototype = b.prototype;
      d = new d();
      a = b.apply(d, a);
      return a instanceof Object ? a : d;
    }
    function gb(a, b) {
      var d = c;
      if (void 0 === d[a].ha) {
        var e = d[a];
        d[a] = function () {
          d[a].ha.hasOwnProperty(arguments.length) ||
            V(
              "Function '" +
                b +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ') - expects one of (' +
                d[a].ha +
                ')!',
            );
          return d[a].ha[arguments.length].apply(this, arguments);
        };
        d[a].ha = [];
        d[a].ha[e.na] = e;
      }
    }
    function hb(a, b, d) {
      c.hasOwnProperty(a)
        ? ((void 0 === d || (void 0 !== c[a].ha && void 0 !== c[a].ha[d])) &&
            V("Cannot register public name '" + a + "' twice"),
          gb(a, a),
          c.hasOwnProperty(d) &&
            V(
              'Cannot register multiple overloads of a function with the same number of arguments (' +
                d +
                ')!',
            ),
          (c[a].ha[d] = b))
        : ((c[a] = b), void 0 !== d && (c[a].Aa = d));
    }
    function ib(a, b) {
      for (var d = [], e = 0; e < a; e++) d.push(L[(b >> 2) + e]);
      return d;
    }
    function Y(a, b) {
      a = U(a);
      var d = c['dynCall_' + a];
      for (var e = [], f = 1; f < a.length; ++f) e.push('a' + f);
      f =
        'return function dynCall_' +
        (a + '_' + b) +
        '(' +
        e.join(', ') +
        ') {\n';
      f +=
        '    return dynCall(rawFunction' +
        (e.length ? ', ' : '') +
        e.join(', ') +
        ');\n';
      d = new Function('dynCall', 'rawFunction', f + '};\n')(d, b);
      'function' !== typeof d &&
        V('unknown function pointer with signature ' + a + ': ' + b);
      return d;
    }
    var jb = void 0;
    function kb(a) {
      a = lb(a);
      var b = U(a);
      Z(a);
      return b;
    }
    function mb(a, b) {
      function d(g) {
        f[g] || S[g] || (Sa[g] ? Sa[g].forEach(d) : (e.push(g), (f[g] = !0)));
      }
      var e = [],
        f = {};
      b.forEach(d);
      throw new jb(a + ': ' + e.map(kb).join([', ']));
    }
    function nb(a, b, d) {
      switch (b) {
        case 0:
          return d
            ? function (e) {
                return ua[e];
              }
            : function (e) {
                return I[e];
              };
        case 1:
          return d
            ? function (e) {
                return K[e >> 1];
              }
            : function (e) {
                return J[e >> 1];
              };
        case 2:
          return d
            ? function (e) {
                return L[e >> 2];
              }
            : function (e) {
                return N[e >> 2];
              };
        default:
          throw new TypeError('Unknown integer type: ' + a);
      }
    }
    var ob = {};
    function pb() {
      return 'object' === typeof globalThis
        ? globalThis
        : Function('return this')();
    }
    function qb(a, b) {
      var d = S[a];
      void 0 === d && V(b + ' has unknown type ' + kb(a));
      return d;
    }
    var rb = {},
      sb = [null, [], []];
    Wa = c.InternalError = Va('InternalError');
    for (var tb = Array(256), ub = 0; 256 > ub; ++ub)
      tb[ub] = String.fromCharCode(ub);
    Za = tb;
    $a = c.BindingError = Va('BindingError');
    c.count_emval_handles = function () {
      for (var a = 0, b = 5; b < X.length; ++b) void 0 !== X[b] && ++a;
      return a;
    };
    c.get_first_emval = function () {
      for (var a = 5; a < X.length; ++a) if (void 0 !== X[a]) return X[a];
      return null;
    };
    jb = c.UnboundTypeError = Va('UnboundTypeError');
    var wb = {
      q: function (a, b, d, e) {
        C(
          'Assertion failed: ' +
            (a ? H(I, a, void 0) : '') +
            ', at: ' +
            [
              b ? (b ? H(I, b, void 0) : '') : 'unknown filename',
              d,
              e ? (e ? H(I, e, void 0) : '') : 'unknown function',
            ],
        );
      },
      B: function (a) {
        return vb(a);
      },
      H: function () {},
      A: function (a) {
        'uncaught_exception' in Oa ? Oa.ma++ : (Oa.ma = 1);
        throw a;
      },
      p: function (a) {
        var b = Pa[a];
        delete Pa[a];
        var d = b.ua,
          e = b.va,
          f = b.la,
          g = f
            .map(function (l) {
              return l.sa;
            })
            .concat(
              f.map(function (l) {
                return l.xa;
              }),
            );
        Xa([a], g, function (l) {
          var k = {};
          f.forEach(function (h, m) {
            var n = l[m],
              q = h.qa,
              x = h.ra,
              z = l[m + f.length],
              p = h.wa,
              ja = h.ya;
            k[h.oa] = {
              read: function (A) {
                return n.fromWireType(q(x, A));
              },
              write: function (A, G) {
                var W = [];
                p(ja, A, z.toWireType(W, G));
                Qa(W);
              },
            };
          });
          return [
            {
              name: b.name,
              fromWireType: function (h) {
                var m = {},
                  n;
                for (n in k) m[n] = k[n].read(h);
                e(h);
                return m;
              },
              toWireType: function (h, m) {
                for (var n in k)
                  if (!(n in m))
                    throw new TypeError('Missing field:  "' + n + '"');
                var q = d();
                for (n in k) k[n].write(q, m[n]);
                null !== h && h.push(e, q);
                return q;
              },
              argPackAdvance: 8,
              readValueFromPointer: Ra,
              ia: e,
            },
          ];
        });
      },
      y: function (a, b, d, e, f) {
        var g = Ya(d);
        b = U(b);
        T(a, {
          name: b,
          fromWireType: function (l) {
            return !!l;
          },
          toWireType: function (l, k) {
            return k ? e : f;
          },
          argPackAdvance: 8,
          readValueFromPointer: function (l) {
            if (1 === d) var k = ua;
            else if (2 === d) k = K;
            else if (4 === d) k = L;
            else throw new TypeError('Unknown boolean type size: ' + b);
            return this.fromWireType(k[l >> g]);
          },
          ia: null,
        });
      },
      x: function (a, b) {
        b = U(b);
        T(a, {
          name: b,
          fromWireType: function (d) {
            var e = X[d].value;
            bb(d);
            return e;
          },
          toWireType: function (d, e) {
            return cb(e);
          },
          argPackAdvance: 8,
          readValueFromPointer: Ra,
          ia: null,
        });
      },
      j: function (a, b, d) {
        d = Ya(d);
        b = U(b);
        T(a, {
          name: b,
          fromWireType: function (e) {
            return e;
          },
          toWireType: function (e, f) {
            if ('number' !== typeof f && 'boolean' !== typeof f)
              throw new TypeError(
                'Cannot convert "' + db(f) + '" to ' + this.name,
              );
            return f;
          },
          argPackAdvance: 8,
          readValueFromPointer: eb(b, d),
          ia: null,
        });
      },
      o: function (a, b, d, e, f, g) {
        var l = ib(b, d);
        a = U(a);
        f = Y(e, f);
        hb(
          a,
          function () {
            mb('Cannot call ' + a + ' due to unbound types', l);
          },
          b - 1,
        );
        Xa([], l, function (k) {
          var h = [k[0], null].concat(k.slice(1)),
            m = (k = a),
            n = f,
            q = h.length;
          2 > q &&
            V(
              "argTypes array size mismatch! Must at least get return value and 'this' types!",
            );
          for (var x = null !== h[1] && !1, z = !1, p = 1; p < h.length; ++p)
            if (null !== h[p] && void 0 === h[p].ia) {
              z = !0;
              break;
            }
          var ja = 'void' !== h[0].name,
            A = '',
            G = '';
          for (p = 0; p < q - 2; ++p)
            (A += (0 !== p ? ', ' : '') + 'arg' + p),
              (G += (0 !== p ? ', ' : '') + 'arg' + p + 'Wired');
          m =
            'return function ' +
            Ta(m) +
            '(' +
            A +
            ') {\nif (arguments.length !== ' +
            (q - 2) +
            ") {\nthrowBindingError('function " +
            m +
            " called with ' + arguments.length + ' arguments, expected " +
            (q - 2) +
            " args!');\n}\n";
          z && (m += 'var destructors = [];\n');
          var W = z ? 'destructors' : 'null';
          A = 'throwBindingError invoker fn runDestructors retType classParam'.split(
            ' ',
          );
          n = [V, n, g, Qa, h[0], h[1]];
          x &&
            (m += 'var thisWired = classParam.toWireType(' + W + ', this);\n');
          for (p = 0; p < q - 2; ++p)
            (m +=
              'var arg' +
              p +
              'Wired = argType' +
              p +
              '.toWireType(' +
              W +
              ', arg' +
              p +
              '); // ' +
              h[p + 2].name +
              '\n'),
              A.push('argType' + p),
              n.push(h[p + 2]);
          x && (G = 'thisWired' + (0 < G.length ? ', ' : '') + G);
          m +=
            (ja ? 'var rv = ' : '') +
            'invoker(fn' +
            (0 < G.length ? ', ' : '') +
            G +
            ');\n';
          if (z) m += 'runDestructors(destructors);\n';
          else
            for (p = x ? 1 : 2; p < h.length; ++p)
              (q = 1 === p ? 'thisWired' : 'arg' + (p - 2) + 'Wired'),
                null !== h[p].ia &&
                  ((m += q + '_dtor(' + q + '); // ' + h[p].name + '\n'),
                  A.push(q + '_dtor'),
                  n.push(h[p].ia));
          ja && (m += 'var ret = retType.fromWireType(rv);\nreturn ret;\n');
          A.push(m + '}\n');
          h = fb(A).apply(null, n);
          p = b - 1;
          if (!c.hasOwnProperty(k))
            throw new Wa('Replacing nonexistant public symbol');
          void 0 !== c[k].ha && void 0 !== p
            ? (c[k].ha[p] = h)
            : ((c[k] = h), (c[k].na = p));
          return [];
        });
      },
      b: function (a, b, d, e, f) {
        function g(m) {
          return m;
        }
        b = U(b);
        -1 === f && (f = 4294967295);
        var l = Ya(d);
        if (0 === e) {
          var k = 32 - 8 * d;
          g = function (m) {
            return (m << k) >>> k;
          };
        }
        var h = -1 != b.indexOf('unsigned');
        T(a, {
          name: b,
          fromWireType: g,
          toWireType: function (m, n) {
            if ('number' !== typeof n && 'boolean' !== typeof n)
              throw new TypeError(
                'Cannot convert "' + db(n) + '" to ' + this.name,
              );
            if (n < e || n > f)
              throw new TypeError(
                'Passing a number "' +
                  db(n) +
                  '" from JS side to C/C++ side to an argument of type "' +
                  b +
                  '", which is outside the valid range [' +
                  e +
                  ', ' +
                  f +
                  ']!',
              );
            return h ? n >>> 0 : n | 0;
          },
          argPackAdvance: 8,
          readValueFromPointer: nb(b, l, 0 !== e),
          ia: null,
        });
      },
      a: function (a, b, d) {
        function e(g) {
          g >>= 2;
          var l = N;
          return new f(M, l[g + 1], l[g]);
        }
        var f = [
          Int8Array,
          Uint8Array,
          Int16Array,
          Uint16Array,
          Int32Array,
          Uint32Array,
          Float32Array,
          Float64Array,
        ][b];
        d = U(d);
        T(
          a,
          {
            name: d,
            fromWireType: e,
            argPackAdvance: 8,
            readValueFromPointer: e,
          },
          { ta: !0 },
        );
      },
      l: function (a, b) {
        b = U(b);
        var d = 'std::string' === b;
        T(a, {
          name: b,
          fromWireType: function (e) {
            var f = N[e >> 2];
            if (d)
              for (var g = e + 4, l = 0; l <= f; ++l) {
                var k = e + 4 + l;
                if (l == f || 0 == I[k]) {
                  g = g ? H(I, g, k - g) : '';
                  if (void 0 === h) var h = g;
                  else (h += String.fromCharCode(0)), (h += g);
                  g = k + 1;
                }
              }
            else {
              h = Array(f);
              for (l = 0; l < f; ++l) h[l] = String.fromCharCode(I[e + 4 + l]);
              h = h.join('');
            }
            Z(e);
            return h;
          },
          toWireType: function (e, f) {
            f instanceof ArrayBuffer && (f = new Uint8Array(f));
            var g = 'string' === typeof f;
            g ||
              f instanceof Uint8Array ||
              f instanceof Uint8ClampedArray ||
              f instanceof Int8Array ||
              V('Cannot pass non-string to std::string');
            var l = (d && g
                ? function () {
                    for (var m = 0, n = 0; n < f.length; ++n) {
                      var q = f.charCodeAt(n);
                      55296 <= q &&
                        57343 >= q &&
                        (q =
                          (65536 + ((q & 1023) << 10)) |
                          (f.charCodeAt(++n) & 1023));
                      127 >= q
                        ? ++m
                        : (m = 2047 >= q ? m + 2 : 65535 >= q ? m + 3 : m + 4);
                    }
                    return m;
                  }
                : function () {
                    return f.length;
                  })(),
              k = vb(4 + l + 1);
            N[k >> 2] = l;
            if (d && g) ma(f, k + 4, l + 1);
            else if (g)
              for (g = 0; g < l; ++g) {
                var h = f.charCodeAt(g);
                255 < h &&
                  (Z(k),
                  V('String has UTF-16 code units that do not fit in 8 bits'));
                I[k + 4 + g] = h;
              }
            else for (g = 0; g < l; ++g) I[k + 4 + g] = f[g];
            null !== e && e.push(Z, k);
            return k;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ra,
          ia: function (e) {
            Z(e);
          },
        });
      },
      f: function (a, b, d) {
        d = U(d);
        if (2 === b) {
          var e = oa;
          var f = pa;
          var g = qa;
          var l = function () {
            return J;
          };
          var k = 1;
        } else
          4 === b &&
            ((e = ra),
            (f = sa),
            (g = ta),
            (l = function () {
              return N;
            }),
            (k = 2));
        T(a, {
          name: d,
          fromWireType: function (h) {
            for (var m = N[h >> 2], n = l(), q, x = h + 4, z = 0; z <= m; ++z) {
              var p = h + 4 + z * b;
              if (z == m || 0 == n[p >> k])
                (x = e(x, p - x)),
                  void 0 === q
                    ? (q = x)
                    : ((q += String.fromCharCode(0)), (q += x)),
                  (x = p + b);
            }
            Z(h);
            return q;
          },
          toWireType: function (h, m) {
            'string' !== typeof m &&
              V('Cannot pass non-string to C++ string type ' + d);
            var n = g(m),
              q = vb(4 + n + b);
            N[q >> 2] = n >> k;
            f(m, q + 4, n + b);
            null !== h && h.push(Z, q);
            return q;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ra,
          ia: function (h) {
            Z(h);
          },
        });
      },
      r: function (a, b, d, e, f, g) {
        Pa[a] = { name: U(b), ua: Y(d, e), va: Y(f, g), la: [] };
      },
      e: function (a, b, d, e, f, g, l, k, h, m) {
        Pa[a].la.push({
          oa: U(b),
          sa: d,
          qa: Y(e, f),
          ra: g,
          xa: l,
          wa: Y(k, h),
          ya: m,
        });
      },
      z: function (a, b) {
        b = U(b);
        T(a, {
          za: !0,
          name: b,
          argPackAdvance: 0,
          fromWireType: function () {},
          toWireType: function () {},
        });
      },
      k: bb,
      G: function (a) {
        if (0 === a) return cb(pb());
        var b = ob[a];
        a = void 0 === b ? U(a) : b;
        return cb(pb()[a]);
      },
      n: function (a) {
        4 < a && (X[a].ka += 1);
      },
      u: function (a, b, d, e) {
        a || V('Cannot use deleted val. handle = ' + a);
        a = X[a].value;
        var f = rb[b];
        if (!f) {
          f = '';
          for (var g = 0; g < b; ++g) f += (0 !== g ? ', ' : '') + 'arg' + g;
          var l =
            'return function emval_allocator_' +
            b +
            '(constructor, argTypes, args) {\n';
          for (g = 0; g < b; ++g)
            l +=
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
          f = new Function(
            'requireRegisteredType',
            'Module',
            '__emval_register',
            l +
              ('var obj = new constructor(' +
                f +
                ');\nreturn __emval_register(obj);\n}\n'),
          )(qb, c, cb);
          rb[b] = f;
        }
        return f(a, d, e);
      },
      h: function () {
        C();
      },
      v: function (a, b, d) {
        I.copyWithin(a, b, b + d);
      },
      d: function (a) {
        a >>>= 0;
        var b = I.length;
        if (2147483648 < a) return !1;
        for (var d = 1; 4 >= d; d *= 2) {
          var e = b * (1 + 0.2 / d);
          e = Math.min(e, a + 100663296);
          e = Math.max(16777216, a, e);
          0 < e % 65536 && (e += 65536 - (e % 65536));
          a: {
            try {
              F.grow((Math.min(2147483648, e) - M.byteLength + 65535) >>> 16);
              xa(F.buffer);
              var f = 1;
              break a;
            } catch (g) {}
            f = void 0;
          }
          if (f) return !0;
        }
        return !1;
      },
      w: function () {
        return 0;
      },
      s: function () {},
      i: function (a, b, d, e) {
        for (var f = 0, g = 0; g < d; g++) {
          for (
            var l = L[(b + 8 * g) >> 2], k = L[(b + (8 * g + 4)) >> 2], h = 0;
            h < k;
            h++
          ) {
            var m = I[l + h],
              n = sb[a];
            0 === m || 10 === m
              ? ((1 === a ? ha : D)(H(n, 0)), (n.length = 0))
              : n.push(m);
          }
          f += k;
        }
        L[e >> 2] = f;
        return 0;
      },
      memory: F,
      m: function () {
        return 0;
      },
      F: function () {
        return 0;
      },
      E: function () {},
      D: function () {
        return 6;
      },
      C: function () {},
      g: function (a) {
        a = +a;
        return 0 <= a ? +Ga(a + 0.5) : +Fa(a - 0.5);
      },
      c: function (a) {
        a = +a;
        return 0 <= a ? +Ga(a + 0.5) : +Fa(a - 0.5);
      },
      t: function () {},
      table: ia,
    };
    (function () {
      function a(f) {
        c.asm = f.exports;
        O--;
        c.monitorRunDependencies && c.monitorRunDependencies(O);
        0 == O &&
          (null !== Ha && (clearInterval(Ha), (Ha = null)),
          P && ((f = P), (P = null), f()));
      }
      function b(f) {
        a(f.instance);
      }
      function d(f) {
        return Ma()
          .then(function (g) {
            return WebAssembly.instantiate(g, e);
          })
          .then(f, function (g) {
            D('failed to asynchronously prepare wasm: ' + g);
            C(g);
          });
      }
      var e = { a: wb };
      O++;
      c.monitorRunDependencies && c.monitorRunDependencies(O);
      if (c.instantiateWasm)
        try {
          return c.instantiateWasm(e, a);
        } catch (f) {
          return (
            D('Module.instantiateWasm callback failed with error: ' + f), !1
          );
        }
      (function () {
        if (
          E ||
          'function' !== typeof WebAssembly.instantiateStreaming ||
          Ja() ||
          Ia('file://') ||
          'function' !== typeof fetch
        )
          return d(b);
        fetch(Q, { credentials: 'same-origin' }).then(function (f) {
          return WebAssembly.instantiateStreaming(f, e).then(b, function (g) {
            D('wasm streaming compile failed: ' + g);
            D('falling back to ArrayBuffer instantiation');
            return d(b);
          });
        });
      })();
      return {};
    })();
    var Na = (c.___wasm_call_ctors = function () {
        return (Na = c.___wasm_call_ctors = c.asm.I).apply(null, arguments);
      }),
      vb = (c._malloc = function () {
        return (vb = c._malloc = c.asm.J).apply(null, arguments);
      }),
      Z = (c._free = function () {
        return (Z = c._free = c.asm.K).apply(null, arguments);
      }),
      lb = (c.___getTypeName = function () {
        return (lb = c.___getTypeName = c.asm.L).apply(null, arguments);
      });
    c.___embind_register_native_and_builtin_types = function () {
      return (c.___embind_register_native_and_builtin_types = c.asm.M).apply(
        null,
        arguments,
      );
    };
    c.dynCall_i = function () {
      return (c.dynCall_i = c.asm.N).apply(null, arguments);
    };
    c.dynCall_vi = function () {
      return (c.dynCall_vi = c.asm.O).apply(null, arguments);
    };
    c.dynCall_fii = function () {
      return (c.dynCall_fii = c.asm.P).apply(null, arguments);
    };
    c.dynCall_viif = function () {
      return (c.dynCall_viif = c.asm.Q).apply(null, arguments);
    };
    c.dynCall_iii = function () {
      return (c.dynCall_iii = c.asm.R).apply(null, arguments);
    };
    c.dynCall_viii = function () {
      return (c.dynCall_viii = c.asm.S).apply(null, arguments);
    };
    c.dynCall_iiiiii = function () {
      return (c.dynCall_iiiiii = c.asm.T).apply(null, arguments);
    };
    c.dynCall_viiiii = function () {
      return (c.dynCall_viiiii = c.asm.U).apply(null, arguments);
    };
    c.dynCall_vii = function () {
      return (c.dynCall_vii = c.asm.V).apply(null, arguments);
    };
    c.dynCall_viiiiiii = function () {
      return (c.dynCall_viiiiiii = c.asm.W).apply(null, arguments);
    };
    c.dynCall_viiiiiiiii = function () {
      return (c.dynCall_viiiiiiiii = c.asm.X).apply(null, arguments);
    };
    c.dynCall_ii = function () {
      return (c.dynCall_ii = c.asm.Y).apply(null, arguments);
    };
    c.dynCall_viiiiiiii = function () {
      return (c.dynCall_viiiiiiii = c.asm.Z).apply(null, arguments);
    };
    c.dynCall_viiii = function () {
      return (c.dynCall_viiii = c.asm._).apply(null, arguments);
    };
    c.dynCall_viiiiii = function () {
      return (c.dynCall_viiiiii = c.asm.$).apply(null, arguments);
    };
    c.dynCall_iidiiii = function () {
      return (c.dynCall_iidiiii = c.asm.aa).apply(null, arguments);
    };
    c.dynCall_iiiii = function () {
      return (c.dynCall_iiiii = c.asm.ba).apply(null, arguments);
    };
    c.dynCall_v = function () {
      return (c.dynCall_v = c.asm.ca).apply(null, arguments);
    };
    c.dynCall_fi = function () {
      return (c.dynCall_fi = c.asm.da).apply(null, arguments);
    };
    c.dynCall_iiii = function () {
      return (c.dynCall_iiii = c.asm.ea).apply(null, arguments);
    };
    c.dynCall_iiiiiiiiii = function () {
      return (c.dynCall_iiiiiiiiii = c.asm.fa).apply(null, arguments);
    };
    c.dynCall_jiji = function () {
      return (c.dynCall_jiji = c.asm.ga).apply(null, arguments);
    };
    var xb;
    P = function yb() {
      xb || zb();
      xb || (P = yb);
    };
    function zb() {
      function a() {
        if (!xb && ((xb = !0), (c.calledRun = !0), !ka)) {
          za(Ba);
          za(Ca);
          aa(c);
          if (c.onRuntimeInitialized) c.onRuntimeInitialized();
          if (c.postRun)
            for (
              'function' == typeof c.postRun && (c.postRun = [c.postRun]);
              c.postRun.length;

            ) {
              var b = c.postRun.shift();
              Da.unshift(b);
            }
          za(Da);
        }
      }
      if (!(0 < O)) {
        if (c.preRun)
          for (
            'function' == typeof c.preRun && (c.preRun = [c.preRun]);
            c.preRun.length;

          )
            Ea();
        za(Aa);
        0 < O ||
          (c.setStatus
            ? (c.setStatus('Running...'),
              setTimeout(function () {
                setTimeout(function () {
                  c.setStatus('');
                }, 1);
                a();
              }, 1))
            : a());
      }
    }
    c.run = zb;
    if (c.preInit)
      for (
        'function' == typeof c.preInit && (c.preInit = [c.preInit]);
        0 < c.preInit.length;

      )
        c.preInit.pop()();
    noExitRuntime = !0;
    zb();

    return wp2_enc.ready;
  };
})();
if (typeof exports === 'object' && typeof module === 'object')
  module.exports = wp2_enc;
else if (typeof define === 'function' && define['amd'])
  define([], function () {
    return wp2_enc;
  });
else if (typeof exports === 'object') exports['wp2_enc'] = wp2_enc;
