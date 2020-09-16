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
    var r = {},
      t;
    for (t in g) g.hasOwnProperty(t) && (r[t] = g[t]);
    var u = '',
      ca;
    u = self.location.href;
    _scriptDir && (u = _scriptDir);
    0 !== u.indexOf('blob:')
      ? (u = u.substr(0, u.lastIndexOf('/') + 1))
      : (u = '');
    ca = function (a) {
      var b = new XMLHttpRequest();
      b.open('GET', a, !1);
      b.responseType = 'arraybuffer';
      b.send(null);
      return new Uint8Array(b.response);
    };
    var v = g.printErr || console.warn.bind(console);
    for (t in r) r.hasOwnProperty(t) && (g[t] = r[t]);
    r = null;
    var x;
    g.wasmBinary && (x = g.wasmBinary);
    var noExitRuntime;
    g.noExitRuntime && (noExitRuntime = g.noExitRuntime);
    'object' !== typeof WebAssembly && A('no native wasm support detected');
    var B,
      C = new WebAssembly.Table({
        initial: 128,
        maximum: 128,
        element: 'anyfunc',
      }),
      da = !1,
      ea = new TextDecoder('utf8');
    function fa(a, b, c) {
      var d = D;
      if (0 < c) {
        c = b + c - 1;
        for (var e = 0; e < a.length; ++e) {
          var f = a.charCodeAt(e);
          if (55296 <= f && 57343 >= f) {
            var k = a.charCodeAt(++e);
            f = (65536 + ((f & 1023) << 10)) | (k & 1023);
          }
          if (127 >= f) {
            if (b >= c) break;
            d[b++] = f;
          } else {
            if (2047 >= f) {
              if (b + 1 >= c) break;
              d[b++] = 192 | (f >> 6);
            } else {
              if (65535 >= f) {
                if (b + 2 >= c) break;
                d[b++] = 224 | (f >> 12);
              } else {
                if (b + 3 >= c) break;
                d[b++] = 240 | (f >> 18);
                d[b++] = 128 | ((f >> 12) & 63);
              }
              d[b++] = 128 | ((f >> 6) & 63);
            }
            d[b++] = 128 | (f & 63);
          }
        }
        d[b] = 0;
      }
    }
    var ia = new TextDecoder('utf-16le');
    function ja(a, b) {
      var c = a >> 1;
      for (b = c + b / 2; !(c >= b) && E[c]; ) ++c;
      return ia.decode(D.subarray(a, c << 1));
    }
    function ka(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (2 > c) return 0;
      c -= 2;
      var d = b;
      c = c < 2 * a.length ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) (G[b >> 1] = a.charCodeAt(e)), (b += 2);
      G[b >> 1] = 0;
      return b - d;
    }
    function la(a) {
      return 2 * a.length;
    }
    function ma(a, b) {
      for (var c = 0, d = ''; !(c >= b / 4); ) {
        var e = H[(a + 4 * c) >> 2];
        if (0 == e) break;
        ++c;
        65536 <= e
          ? ((e -= 65536),
            (d += String.fromCharCode(55296 | (e >> 10), 56320 | (e & 1023))))
          : (d += String.fromCharCode(e));
      }
      return d;
    }
    function na(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (4 > c) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var f = a.charCodeAt(e);
        if (55296 <= f && 57343 >= f) {
          var k = a.charCodeAt(++e);
          f = (65536 + ((f & 1023) << 10)) | (k & 1023);
        }
        H[b >> 2] = f;
        b += 4;
        if (b + 4 > c) break;
      }
      H[b >> 2] = 0;
      return b - d;
    }
    function oa(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        55296 <= d && 57343 >= d && ++c;
        b += 4;
      }
      return b;
    }
    var I, J, D, G, E, H, K, pa, qa;
    function ra(a) {
      I = a;
      g.HEAP8 = J = new Int8Array(a);
      g.HEAP16 = G = new Int16Array(a);
      g.HEAP32 = H = new Int32Array(a);
      g.HEAPU8 = D = new Uint8Array(a);
      g.HEAPU16 = E = new Uint16Array(a);
      g.HEAPU32 = K = new Uint32Array(a);
      g.HEAPF32 = pa = new Float32Array(a);
      g.HEAPF64 = qa = new Float64Array(a);
    }
    var sa = g.INITIAL_MEMORY || 16777216;
    g.wasmMemory
      ? (B = g.wasmMemory)
      : (B = new WebAssembly.Memory({ initial: sa / 65536, maximum: 32768 }));
    B && (I = B.buffer);
    sa = I.byteLength;
    ra(I);
    var ta = [],
      ua = [],
      va = [],
      wa = [];
    function xa() {
      var a = g.preRun.shift();
      ta.unshift(a);
    }
    var L = 0,
      ya = null,
      M = null;
    g.preloadedImages = {};
    g.preloadedAudios = {};
    function A(a) {
      if (g.onAbort) g.onAbort(a);
      v(a);
      da = !0;
      a = new WebAssembly.RuntimeError(
        'abort(' + a + '). Build with -s ASSERTIONS=1 for more info.',
      );
      ba(a);
      throw a;
    }
    function za() {
      var a = N;
      return String.prototype.startsWith
        ? a.startsWith('data:application/octet-stream;base64,')
        : 0 === a.indexOf('data:application/octet-stream;base64,');
    }
    var N = 'webp_enc.wasm';
    if (!za()) {
      var Aa = N;
      N = g.locateFile ? g.locateFile(Aa, u) : u + Aa;
    }
    function Ba() {
      try {
        if (x) return new Uint8Array(x);
        if (ca) return ca(N);
        throw 'both async and sync fetching of the wasm failed';
      } catch (a) {
        A(a);
      }
    }
    function Ca() {
      return x || 'function' !== typeof fetch
        ? Promise.resolve().then(Ba)
        : fetch(N, { credentials: 'same-origin' })
            .then(function (a) {
              if (!a.ok) throw "failed to load wasm binary file at '" + N + "'";
              return a.arrayBuffer();
            })
            .catch(function () {
              return Ba();
            });
    }
    ua.push({
      O: function () {
        Da();
      },
    });
    function O(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ('function' == typeof b) b(g);
        else {
          var c = b.O;
          'number' === typeof c
            ? void 0 === b.I
              ? C.get(c)()
              : C.get(c)(b.I)
            : c(void 0 === b.I ? null : b.I);
        }
      }
    }
    function Ea(a) {
      this.H = a - 16;
      this.aa = function (b) {
        H[(this.H + 8) >> 2] = b;
      };
      this.Y = function (b) {
        H[(this.H + 0) >> 2] = b;
      };
      this.Z = function () {
        H[(this.H + 4) >> 2] = 0;
      };
      this.X = function () {
        J[(this.H + 12) >> 0] = 0;
      };
      this.$ = function () {
        J[(this.H + 13) >> 0] = 0;
      };
      this.U = function (b, c) {
        this.aa(b);
        this.Y(c);
        this.Z();
        this.X();
        this.$();
      };
    }
    function P() {
      return 0 < P.K;
    }
    var Q = {};
    function Fa(a) {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    }
    function Ga(a) {
      return this.fromWireType(K[a >> 2]);
    }
    var R = {},
      S = {},
      Ha = {};
    function Ia(a) {
      if (void 0 === a) return '_unknown';
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return 48 <= b && 57 >= b ? '_' + a : a;
    }
    function Ja(a, b) {
      a = Ia(a);
      return new Function(
        'body',
        'return function ' +
          a +
          '() {\n    "use strict";    return body.apply(this, arguments);\n};\n',
      )(b);
    }
    function Ka(a) {
      var b = Error,
        c = Ja(a, function (d) {
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
    var La = void 0;
    function Ma(a, b, c) {
      function d(h) {
        h = c(h);
        if (h.length !== a.length)
          throw new La('Mismatched type converter count');
        for (var n = 0; n < a.length; ++n) T(a[n], h[n]);
      }
      a.forEach(function (h) {
        Ha[h] = b;
      });
      var e = Array(b.length),
        f = [],
        k = 0;
      b.forEach(function (h, n) {
        S.hasOwnProperty(h)
          ? (e[n] = S[h])
          : (f.push(h),
            R.hasOwnProperty(h) || (R[h] = []),
            R[h].push(function () {
              e[n] = S[h];
              ++k;
              k === f.length && d(e);
            }));
      });
      0 === f.length && d(e);
    }
    function Na(a) {
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
    var Oa = void 0;
    function U(a) {
      for (var b = ''; D[a]; ) b += Oa[D[a++]];
      return b;
    }
    var Pa = void 0;
    function V(a) {
      throw new Pa(a);
    }
    function T(a, b, c) {
      c = c || {};
      if (!('argPackAdvance' in b))
        throw new TypeError(
          'registerType registeredInstance requires argPackAdvance',
        );
      var d = b.name;
      a || V('type "' + d + '" must have a positive integer typeid pointer');
      if (S.hasOwnProperty(a)) {
        if (c.T) return;
        V("Cannot register type '" + d + "' twice");
      }
      S[a] = b;
      delete Ha[a];
      R.hasOwnProperty(a) &&
        ((b = R[a]),
        delete R[a],
        b.forEach(function (e) {
          e();
        }));
    }
    var Qa = [],
      X = [
        {},
        { value: void 0 },
        { value: null },
        { value: !0 },
        { value: !1 },
      ];
    function Ra(a) {
      4 < a && 0 === --X[a].J && ((X[a] = void 0), Qa.push(a));
    }
    function Sa(a) {
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
          var b = Qa.length ? Qa.pop() : X.length;
          X[b] = { J: 1, value: a };
          return b;
      }
    }
    function Ta(a, b) {
      var c = g;
      if (void 0 === c[a].G) {
        var d = c[a];
        c[a] = function () {
          c[a].G.hasOwnProperty(arguments.length) ||
            V(
              "Function '" +
                b +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ') - expects one of (' +
                c[a].G +
                ')!',
            );
          return c[a].G[arguments.length].apply(this, arguments);
        };
        c[a].G = [];
        c[a].G[d.M] = d;
      }
    }
    function Ua(a, b, c) {
      g.hasOwnProperty(a)
        ? ((void 0 === c || (void 0 !== g[a].G && void 0 !== g[a].G[c])) &&
            V("Cannot register public name '" + a + "' twice"),
          Ta(a, a),
          g.hasOwnProperty(c) &&
            V(
              'Cannot register multiple overloads of a function with the same number of arguments (' +
                c +
                ')!',
            ),
          (g[a].G[c] = b))
        : ((g[a] = b), void 0 !== c && (g[a].fa = c));
    }
    function Va(a, b, c) {
      switch (b) {
        case 0:
          return function (d) {
            return this.fromWireType((c ? J : D)[d]);
          };
        case 1:
          return function (d) {
            return this.fromWireType((c ? G : E)[d >> 1]);
          };
        case 2:
          return function (d) {
            return this.fromWireType((c ? H : K)[d >> 2]);
          };
        default:
          throw new TypeError('Unknown integer type: ' + a);
      }
    }
    function Wa(a) {
      a = Xa(a);
      var b = U(a);
      Y(a);
      return b;
    }
    function Ya(a, b) {
      var c = S[a];
      void 0 === c && V(b + ' has unknown type ' + Wa(a));
      return c;
    }
    function Za(a) {
      if (null === a) return 'null';
      var b = typeof a;
      return 'object' === b || 'array' === b || 'function' === b
        ? a.toString()
        : '' + a;
    }
    function $a(a, b) {
      switch (b) {
        case 2:
          return function (c) {
            return this.fromWireType(pa[c >> 2]);
          };
        case 3:
          return function (c) {
            return this.fromWireType(qa[c >> 3]);
          };
        default:
          throw new TypeError('Unknown float type: ' + a);
      }
    }
    function ab(a) {
      var b = Function;
      if (!(b instanceof Function))
        throw new TypeError(
          'new_ called with constructor type ' +
            typeof b +
            ' which is not a function',
        );
      var c = Ja(b.name || 'unknownFunctionName', function () {});
      c.prototype = b.prototype;
      c = new c();
      a = b.apply(c, a);
      return a instanceof Object ? a : c;
    }
    function bb(a, b) {
      for (var c = [], d = 0; d < a; d++) c.push(H[(b >> 2) + d]);
      return c;
    }
    function cb(a, b) {
      0 <= a.indexOf('j') ||
        A('Assertion failed: getDynCaller should only be called with i64 sigs');
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
          : (e = C.get(b).apply(null, c));
        return e;
      };
    }
    function Z(a, b) {
      a = U(a);
      var c = -1 != a.indexOf('j') ? cb(a, b) : C.get(b);
      'function' !== typeof c &&
        V('unknown function pointer with signature ' + a + ': ' + b);
      return c;
    }
    var db = void 0;
    function eb(a, b) {
      function c(f) {
        e[f] || S[f] || (Ha[f] ? Ha[f].forEach(c) : (d.push(f), (e[f] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new db(a + ': ' + d.map(Wa).join([', ']));
    }
    function fb(a, b, c) {
      switch (b) {
        case 0:
          return c
            ? function (d) {
                return J[d];
              }
            : function (d) {
                return D[d];
              };
        case 1:
          return c
            ? function (d) {
                return G[d >> 1];
              }
            : function (d) {
                return E[d >> 1];
              };
        case 2:
          return c
            ? function (d) {
                return H[d >> 2];
              }
            : function (d) {
                return K[d >> 2];
              };
        default:
          throw new TypeError('Unknown integer type: ' + a);
      }
    }
    var gb = {};
    function hb() {
      return 'object' === typeof globalThis
        ? globalThis
        : Function('return this')();
    }
    var ib = {};
    La = g.InternalError = Ka('InternalError');
    for (var jb = Array(256), kb = 0; 256 > kb; ++kb)
      jb[kb] = String.fromCharCode(kb);
    Oa = jb;
    Pa = g.BindingError = Ka('BindingError');
    g.count_emval_handles = function () {
      for (var a = 0, b = 5; b < X.length; ++b) void 0 !== X[b] && ++a;
      return a;
    };
    g.get_first_emval = function () {
      for (var a = 5; a < X.length; ++a) if (void 0 !== X[a]) return X[a];
      return null;
    };
    db = g.UnboundTypeError = Ka('UnboundTypeError');
    var mb = {
      l: function (a) {
        return lb(a + 16) + 16;
      },
      z: function () {},
      h: function (a, b, c) {
        new Ea(a).U(b, c);
        'uncaught_exception' in P ? P.K++ : (P.K = 1);
        throw a;
      },
      b: C,
      m: function (a) {
        var b = Q[a];
        delete Q[a];
        var c = b.V,
          d = b.W,
          e = b.L,
          f = e
            .map(function (k) {
              return k.S;
            })
            .concat(
              e.map(function (k) {
                return k.ca;
              }),
            );
        Ma([a], f, function (k) {
          var h = {};
          e.forEach(function (n, l) {
            var m = k[l],
              q = n.P,
              w = n.R,
              y = k[l + e.length],
              p = n.ba,
              ha = n.da;
            h[n.N] = {
              read: function (z) {
                return m.fromWireType(q(w, z));
              },
              write: function (z, F) {
                var W = [];
                p(ha, z, y.toWireType(W, F));
                Fa(W);
              },
            };
          });
          return [
            {
              name: b.name,
              fromWireType: function (n) {
                var l = {},
                  m;
                for (m in h) l[m] = h[m].read(n);
                d(n);
                return l;
              },
              toWireType: function (n, l) {
                for (var m in h)
                  if (!(m in l))
                    throw new TypeError('Missing field:  "' + m + '"');
                var q = c();
                for (m in h) h[m].write(q, l[m]);
                null !== n && n.push(d, q);
                return q;
              },
              argPackAdvance: 8,
              readValueFromPointer: Ga,
              F: d,
            },
          ];
        });
      },
      w: function (a, b, c, d, e) {
        var f = Na(c);
        b = U(b);
        T(a, {
          name: b,
          fromWireType: function (k) {
            return !!k;
          },
          toWireType: function (k, h) {
            return h ? d : e;
          },
          argPackAdvance: 8,
          readValueFromPointer: function (k) {
            if (1 === c) var h = J;
            else if (2 === c) h = G;
            else if (4 === c) h = H;
            else throw new TypeError('Unknown boolean type size: ' + b);
            return this.fromWireType(h[k >> f]);
          },
          F: null,
        });
      },
      v: function (a, b) {
        b = U(b);
        T(a, {
          name: b,
          fromWireType: function (c) {
            var d = X[c].value;
            Ra(c);
            return d;
          },
          toWireType: function (c, d) {
            return Sa(d);
          },
          argPackAdvance: 8,
          readValueFromPointer: Ga,
          F: null,
        });
      },
      p: function (a, b, c, d) {
        function e() {}
        c = Na(c);
        b = U(b);
        e.values = {};
        T(a, {
          name: b,
          constructor: e,
          fromWireType: function (f) {
            return this.constructor.values[f];
          },
          toWireType: function (f, k) {
            return k.value;
          },
          argPackAdvance: 8,
          readValueFromPointer: Va(b, c, d),
          F: null,
        });
        Ua(b, e);
      },
      o: function (a, b, c) {
        var d = Ya(a, 'enum');
        b = U(b);
        a = d.constructor;
        d = Object.create(d.constructor.prototype, {
          value: { value: c },
          constructor: { value: Ja(d.name + '_' + b, function () {}) },
        });
        a.values[c] = d;
        a[b] = d;
      },
      i: function (a, b, c) {
        c = Na(c);
        b = U(b);
        T(a, {
          name: b,
          fromWireType: function (d) {
            return d;
          },
          toWireType: function (d, e) {
            if ('number' !== typeof e && 'boolean' !== typeof e)
              throw new TypeError(
                'Cannot convert "' + Za(e) + '" to ' + this.name,
              );
            return e;
          },
          argPackAdvance: 8,
          readValueFromPointer: $a(b, c),
          F: null,
        });
      },
      k: function (a, b, c, d, e, f) {
        var k = bb(b, c);
        a = U(a);
        e = Z(d, e);
        Ua(
          a,
          function () {
            eb('Cannot call ' + a + ' due to unbound types', k);
          },
          b - 1,
        );
        Ma([], k, function (h) {
          var n = a,
            l = a;
          h = [h[0], null].concat(h.slice(1));
          var m = e,
            q = h.length;
          2 > q &&
            V(
              "argTypes array size mismatch! Must at least get return value and 'this' types!",
            );
          for (var w = null !== h[1] && !1, y = !1, p = 1; p < h.length; ++p)
            if (null !== h[p] && void 0 === h[p].F) {
              y = !0;
              break;
            }
          var ha = 'void' !== h[0].name,
            z = '',
            F = '';
          for (p = 0; p < q - 2; ++p)
            (z += (0 !== p ? ', ' : '') + 'arg' + p),
              (F += (0 !== p ? ', ' : '') + 'arg' + p + 'Wired');
          l =
            'return function ' +
            Ia(l) +
            '(' +
            z +
            ') {\nif (arguments.length !== ' +
            (q - 2) +
            ") {\nthrowBindingError('function " +
            l +
            " called with ' + arguments.length + ' arguments, expected " +
            (q - 2) +
            " args!');\n}\n";
          y && (l += 'var destructors = [];\n');
          var W = y ? 'destructors' : 'null';
          z = 'throwBindingError invoker fn runDestructors retType classParam'.split(
            ' ',
          );
          m = [V, m, f, Fa, h[0], h[1]];
          w &&
            (l += 'var thisWired = classParam.toWireType(' + W + ', this);\n');
          for (p = 0; p < q - 2; ++p)
            (l +=
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
              z.push('argType' + p),
              m.push(h[p + 2]);
          w && (F = 'thisWired' + (0 < F.length ? ', ' : '') + F);
          l +=
            (ha ? 'var rv = ' : '') +
            'invoker(fn' +
            (0 < F.length ? ', ' : '') +
            F +
            ');\n';
          if (y) l += 'runDestructors(destructors);\n';
          else
            for (p = w ? 1 : 2; p < h.length; ++p)
              (q = 1 === p ? 'thisWired' : 'arg' + (p - 2) + 'Wired'),
                null !== h[p].F &&
                  ((l += q + '_dtor(' + q + '); // ' + h[p].name + '\n'),
                  z.push(q + '_dtor'),
                  m.push(h[p].F));
          ha && (l += 'var ret = retType.fromWireType(rv);\nreturn ret;\n');
          z.push(l + '}\n');
          h = ab(z).apply(null, m);
          p = b - 1;
          if (!g.hasOwnProperty(n))
            throw new La('Replacing nonexistant public symbol');
          void 0 !== g[n].G && void 0 !== p
            ? (g[n].G[p] = h)
            : ((g[n] = h), (g[n].M = p));
          return [];
        });
      },
      d: function (a, b, c, d, e) {
        function f(l) {
          return l;
        }
        b = U(b);
        -1 === e && (e = 4294967295);
        var k = Na(c);
        if (0 === d) {
          var h = 32 - 8 * c;
          f = function (l) {
            return (l << h) >>> h;
          };
        }
        var n = -1 != b.indexOf('unsigned');
        T(a, {
          name: b,
          fromWireType: f,
          toWireType: function (l, m) {
            if ('number' !== typeof m && 'boolean' !== typeof m)
              throw new TypeError(
                'Cannot convert "' + Za(m) + '" to ' + this.name,
              );
            if (m < d || m > e)
              throw new TypeError(
                'Passing a number "' +
                  Za(m) +
                  '" from JS side to C/C++ side to an argument of type "' +
                  b +
                  '", which is outside the valid range [' +
                  d +
                  ', ' +
                  e +
                  ']!',
              );
            return n ? m >>> 0 : m | 0;
          },
          argPackAdvance: 8,
          readValueFromPointer: fb(b, k, 0 !== d),
          F: null,
        });
      },
      c: function (a, b, c) {
        function d(f) {
          f >>= 2;
          var k = K;
          return new e(I, k[f + 1], k[f]);
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
        c = U(c);
        T(
          a,
          {
            name: c,
            fromWireType: d,
            argPackAdvance: 8,
            readValueFromPointer: d,
          },
          { T: !0 },
        );
      },
      j: function (a, b) {
        b = U(b);
        var c = 'std::string' === b;
        T(a, {
          name: b,
          fromWireType: function (d) {
            var e = K[d >> 2];
            if (c)
              for (var f = d + 4, k = 0; k <= e; ++k) {
                var h = d + 4 + k;
                if (k == e || 0 == D[h]) {
                  if (f) {
                    for (var n = f + (h - f), l = f; !(l >= n) && D[l]; ) ++l;
                    f = ea.decode(D.subarray(f, l));
                  } else f = '';
                  if (void 0 === m) var m = f;
                  else (m += String.fromCharCode(0)), (m += f);
                  f = h + 1;
                }
              }
            else {
              m = Array(e);
              for (k = 0; k < e; ++k) m[k] = String.fromCharCode(D[d + 4 + k]);
              m = m.join('');
            }
            Y(d);
            return m;
          },
          toWireType: function (d, e) {
            e instanceof ArrayBuffer && (e = new Uint8Array(e));
            var f = 'string' === typeof e;
            f ||
              e instanceof Uint8Array ||
              e instanceof Uint8ClampedArray ||
              e instanceof Int8Array ||
              V('Cannot pass non-string to std::string');
            var k = (c && f
                ? function () {
                    for (var l = 0, m = 0; m < e.length; ++m) {
                      var q = e.charCodeAt(m);
                      55296 <= q &&
                        57343 >= q &&
                        (q =
                          (65536 + ((q & 1023) << 10)) |
                          (e.charCodeAt(++m) & 1023));
                      127 >= q
                        ? ++l
                        : (l = 2047 >= q ? l + 2 : 65535 >= q ? l + 3 : l + 4);
                    }
                    return l;
                  }
                : function () {
                    return e.length;
                  })(),
              h = lb(4 + k + 1);
            K[h >> 2] = k;
            if (c && f) fa(e, h + 4, k + 1);
            else if (f)
              for (f = 0; f < k; ++f) {
                var n = e.charCodeAt(f);
                255 < n &&
                  (Y(h),
                  V('String has UTF-16 code units that do not fit in 8 bits'));
                D[h + 4 + f] = n;
              }
            else for (f = 0; f < k; ++f) D[h + 4 + f] = e[f];
            null !== d && d.push(Y, h);
            return h;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ga,
          F: function (d) {
            Y(d);
          },
        });
      },
      f: function (a, b, c) {
        c = U(c);
        if (2 === b) {
          var d = ja;
          var e = ka;
          var f = la;
          var k = function () {
            return E;
          };
          var h = 1;
        } else
          4 === b &&
            ((d = ma),
            (e = na),
            (f = oa),
            (k = function () {
              return K;
            }),
            (h = 2));
        T(a, {
          name: c,
          fromWireType: function (n) {
            for (var l = K[n >> 2], m = k(), q, w = n + 4, y = 0; y <= l; ++y) {
              var p = n + 4 + y * b;
              if (y == l || 0 == m[p >> h])
                (w = d(w, p - w)),
                  void 0 === q
                    ? (q = w)
                    : ((q += String.fromCharCode(0)), (q += w)),
                  (w = p + b);
            }
            Y(n);
            return q;
          },
          toWireType: function (n, l) {
            'string' !== typeof l &&
              V('Cannot pass non-string to C++ string type ' + c);
            var m = f(l),
              q = lb(4 + m + b);
            K[q >> 2] = m >> h;
            e(l, q + 4, m + b);
            null !== n && n.push(Y, q);
            return q;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ga,
          F: function (n) {
            Y(n);
          },
        });
      },
      n: function (a, b, c, d, e, f) {
        Q[a] = { name: U(b), V: Z(c, d), W: Z(e, f), L: [] };
      },
      g: function (a, b, c, d, e, f, k, h, n, l) {
        Q[a].L.push({
          N: U(b),
          S: c,
          P: Z(d, e),
          R: f,
          ca: k,
          ba: Z(h, n),
          da: l,
        });
      },
      x: function (a, b) {
        b = U(b);
        T(a, {
          ea: !0,
          name: b,
          argPackAdvance: 0,
          fromWireType: function () {},
          toWireType: function () {},
        });
      },
      r: Ra,
      s: function (a) {
        if (0 === a) return Sa(hb());
        var b = gb[a];
        a = void 0 === b ? U(a) : b;
        return Sa(hb()[a]);
      },
      y: function (a) {
        4 < a && (X[a].J += 1);
      },
      q: function (a, b, c, d) {
        a || V('Cannot use deleted val. handle = ' + a);
        a = X[a].value;
        var e = ib[b];
        if (!e) {
          e = '';
          for (var f = 0; f < b; ++f) e += (0 !== f ? ', ' : '') + 'arg' + f;
          var k =
            'return function emval_allocator_' +
            b +
            '(constructor, argTypes, args) {\n';
          for (f = 0; f < b; ++f)
            k +=
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
            k +
              ('var obj = new constructor(' +
                e +
                ');\nreturn __emval_register(obj);\n}\n'),
          )(Ya, g, Sa);
          ib[b] = e;
        }
        return e(a, c, d);
      },
      u: function () {
        A();
      },
      t: function (a, b, c) {
        D.copyWithin(a, b, b + c);
      },
      e: function (a) {
        a >>>= 0;
        var b = D.length;
        if (2147483648 < a) return !1;
        for (var c = 1; 4 >= c; c *= 2) {
          var d = b * (1 + 0.2 / c);
          d = Math.min(d, a + 100663296);
          d = Math.max(16777216, a, d);
          0 < d % 65536 && (d += 65536 - (d % 65536));
          a: {
            try {
              B.grow((Math.min(2147483648, d) - I.byteLength + 65535) >>> 16);
              ra(B.buffer);
              var e = 1;
              break a;
            } catch (f) {}
            e = void 0;
          }
          if (e) return !0;
        }
        return !1;
      },
      a: B,
    };
    (function () {
      function a(e) {
        g.asm = e.exports;
        L--;
        g.monitorRunDependencies && g.monitorRunDependencies(L);
        0 == L &&
          (null !== ya && (clearInterval(ya), (ya = null)),
          M && ((e = M), (M = null), e()));
      }
      function b(e) {
        a(e.instance);
      }
      function c(e) {
        return Ca()
          .then(function (f) {
            return WebAssembly.instantiate(f, d);
          })
          .then(e, function (f) {
            v('failed to asynchronously prepare wasm: ' + f);
            A(f);
          });
      }
      var d = { a: mb };
      L++;
      g.monitorRunDependencies && g.monitorRunDependencies(L);
      if (g.instantiateWasm)
        try {
          return g.instantiateWasm(d, a);
        } catch (e) {
          return (
            v('Module.instantiateWasm callback failed with error: ' + e), !1
          );
        }
      (function () {
        if (
          x ||
          'function' !== typeof WebAssembly.instantiateStreaming ||
          za() ||
          'function' !== typeof fetch
        )
          return c(b);
        fetch(N, { credentials: 'same-origin' }).then(function (e) {
          return WebAssembly.instantiateStreaming(e, d).then(b, function (f) {
            v('wasm streaming compile failed: ' + f);
            v('falling back to ArrayBuffer instantiation');
            return c(b);
          });
        });
      })();
      return {};
    })();
    var Da = (g.___wasm_call_ctors = function () {
        return (Da = g.___wasm_call_ctors = g.asm.A).apply(null, arguments);
      }),
      lb = (g._malloc = function () {
        return (lb = g._malloc = g.asm.B).apply(null, arguments);
      }),
      Y = (g._free = function () {
        return (Y = g._free = g.asm.C).apply(null, arguments);
      }),
      Xa = (g.___getTypeName = function () {
        return (Xa = g.___getTypeName = g.asm.D).apply(null, arguments);
      });
    g.___embind_register_native_and_builtin_types = function () {
      return (g.___embind_register_native_and_builtin_types = g.asm.E).apply(
        null,
        arguments,
      );
    };
    var nb;
    M = function ob() {
      nb || pb();
      nb || (M = ob);
    };
    function pb() {
      function a() {
        if (!nb && ((nb = !0), (g.calledRun = !0), !da)) {
          O(ua);
          O(va);
          aa(g);
          if (g.onRuntimeInitialized) g.onRuntimeInitialized();
          if (g.postRun)
            for (
              'function' == typeof g.postRun && (g.postRun = [g.postRun]);
              g.postRun.length;

            ) {
              var b = g.postRun.shift();
              wa.unshift(b);
            }
          O(wa);
        }
      }
      if (!(0 < L)) {
        if (g.preRun)
          for (
            'function' == typeof g.preRun && (g.preRun = [g.preRun]);
            g.preRun.length;

          )
            xa();
        O(ta);
        0 < L ||
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
    g.run = pb;
    if (g.preInit)
      for (
        'function' == typeof g.preInit && (g.preInit = [g.preInit]);
        0 < g.preInit.length;

      )
        g.preInit.pop()();
    noExitRuntime = !0;
    pb();

    return Module.ready;
  };
})();
export default Module;
