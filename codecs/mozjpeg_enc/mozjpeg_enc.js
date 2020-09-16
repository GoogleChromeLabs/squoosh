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
    var ca = './this.program';
    function da(a, b) {
      throw b;
    }
    var u = '',
      ea;
    u = self.location.href;
    _scriptDir && (u = _scriptDir);
    0 !== u.indexOf('blob:')
      ? (u = u.substr(0, u.lastIndexOf('/') + 1))
      : (u = '');
    ea = function (a) {
      var b = new XMLHttpRequest();
      b.open('GET', a, !1);
      b.responseType = 'arraybuffer';
      b.send(null);
      return new Uint8Array(b.response);
    };
    var ha = g.print || console.log.bind(console),
      v = g.printErr || console.warn.bind(console);
    for (t in r) r.hasOwnProperty(t) && (g[t] = r[t]);
    r = null;
    g.thisProgram && (ca = g.thisProgram);
    g.quit && (da = g.quit);
    var w;
    g.wasmBinary && (w = g.wasmBinary);
    var noExitRuntime;
    g.noExitRuntime && (noExitRuntime = g.noExitRuntime);
    'object' !== typeof WebAssembly && A('no native wasm support detected');
    var B,
      C = new WebAssembly.Table({
        initial: 122,
        maximum: 122,
        element: 'anyfunc',
      }),
      ia = !1,
      ja = new TextDecoder('utf8');
    function ka(a, b, c) {
      var d = D;
      if (0 < c) {
        c = b + c - 1;
        for (var e = 0; e < a.length; ++e) {
          var f = a.charCodeAt(e);
          if (55296 <= f && 57343 >= f) {
            var m = a.charCodeAt(++e);
            f = (65536 + ((f & 1023) << 10)) | (m & 1023);
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
    var la = new TextDecoder('utf-16le');
    function ma(a, b) {
      var c = a >> 1;
      for (b = c + b / 2; !(c >= b) && E[c]; ) ++c;
      return la.decode(D.subarray(a, c << 1));
    }
    function na(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (2 > c) return 0;
      c -= 2;
      var d = b;
      c = c < 2 * a.length ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) (G[b >> 1] = a.charCodeAt(e)), (b += 2);
      G[b >> 1] = 0;
      return b - d;
    }
    function oa(a) {
      return 2 * a.length;
    }
    function pa(a, b) {
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
    function qa(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (4 > c) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var f = a.charCodeAt(e);
        if (55296 <= f && 57343 >= f) {
          var m = a.charCodeAt(++e);
          f = (65536 + ((f & 1023) << 10)) | (m & 1023);
        }
        H[b >> 2] = f;
        b += 4;
        if (b + 4 > c) break;
      }
      H[b >> 2] = 0;
      return b - d;
    }
    function ra(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        55296 <= d && 57343 >= d && ++c;
        b += 4;
      }
      return b;
    }
    var I, J, D, G, E, H, K, sa, ta;
    function ua(a) {
      I = a;
      g.HEAP8 = J = new Int8Array(a);
      g.HEAP16 = G = new Int16Array(a);
      g.HEAP32 = H = new Int32Array(a);
      g.HEAPU8 = D = new Uint8Array(a);
      g.HEAPU16 = E = new Uint16Array(a);
      g.HEAPU32 = K = new Uint32Array(a);
      g.HEAPF32 = sa = new Float32Array(a);
      g.HEAPF64 = ta = new Float64Array(a);
    }
    var va = g.INITIAL_MEMORY || 16777216;
    g.wasmMemory
      ? (B = g.wasmMemory)
      : (B = new WebAssembly.Memory({ initial: va / 65536, maximum: 32768 }));
    B && (I = B.buffer);
    va = I.byteLength;
    ua(I);
    var wa = [],
      xa = [],
      ya = [],
      za = [];
    function Aa() {
      var a = g.preRun.shift();
      wa.unshift(a);
    }
    var L = 0,
      Ba = null,
      M = null;
    g.preloadedImages = {};
    g.preloadedAudios = {};
    function A(a) {
      if (g.onAbort) g.onAbort(a);
      v(a);
      ia = !0;
      a = new WebAssembly.RuntimeError(
        'abort(' + a + '). Build with -s ASSERTIONS=1 for more info.',
      );
      ba(a);
      throw a;
    }
    function Ca() {
      var a = N;
      return String.prototype.startsWith
        ? a.startsWith('data:application/octet-stream;base64,')
        : 0 === a.indexOf('data:application/octet-stream;base64,');
    }
    var N = 'mozjpeg_enc.wasm';
    if (!Ca()) {
      var Da = N;
      N = g.locateFile ? g.locateFile(Da, u) : u + Da;
    }
    function Ea() {
      try {
        if (w) return new Uint8Array(w);
        if (ea) return ea(N);
        throw 'both async and sync fetching of the wasm failed';
      } catch (a) {
        A(a);
      }
    }
    function Fa() {
      return w || 'function' !== typeof fetch
        ? Promise.resolve().then(Ea)
        : fetch(N, { credentials: 'same-origin' })
            .then(function (a) {
              if (!a.ok) throw "failed to load wasm binary file at '" + N + "'";
              return a.arrayBuffer();
            })
            .catch(function () {
              return Ea();
            });
    }
    xa.push({
      V: function () {
        Ga();
      },
    });
    function O(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ('function' == typeof b) b(g);
        else {
          var c = b.V;
          'number' === typeof c
            ? void 0 === b.O
              ? C.get(c)()
              : C.get(c)(b.O)
            : c(void 0 === b.O ? null : b.O);
        }
      }
    }
    function Ha(a) {
      this.N = a - 16;
      this.ga = function (b) {
        H[(this.N + 8) >> 2] = b;
      };
      this.da = function (b) {
        H[(this.N + 0) >> 2] = b;
      };
      this.ea = function () {
        H[(this.N + 4) >> 2] = 0;
      };
      this.ca = function () {
        J[(this.N + 12) >> 0] = 0;
      };
      this.fa = function () {
        J[(this.N + 13) >> 0] = 0;
      };
      this.$ = function (b, c) {
        this.ga(b);
        this.da(c);
        this.ea();
        this.ca();
        this.fa();
      };
    }
    function P() {
      return 0 < P.R;
    }
    var Q = {};
    function Ia(a) {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    }
    function Ja(a) {
      return this.fromWireType(K[a >> 2]);
    }
    var R = {},
      S = {},
      Ka = {};
    function La(a) {
      if (void 0 === a) return '_unknown';
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return 48 <= b && 57 >= b ? '_' + a : a;
    }
    function Ma(a, b) {
      a = La(a);
      return new Function(
        'body',
        'return function ' +
          a +
          '() {\n    "use strict";    return body.apply(this, arguments);\n};\n',
      )(b);
    }
    function Na(a) {
      var b = Error,
        c = Ma(a, function (d) {
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
    var Oa = void 0;
    function Pa(a, b, c) {
      function d(h) {
        h = c(h);
        if (h.length !== a.length)
          throw new Oa('Mismatched type converter count');
        for (var n = 0; n < a.length; ++n) T(a[n], h[n]);
      }
      a.forEach(function (h) {
        Ka[h] = b;
      });
      var e = Array(b.length),
        f = [],
        m = 0;
      b.forEach(function (h, n) {
        S.hasOwnProperty(h)
          ? (e[n] = S[h])
          : (f.push(h),
            R.hasOwnProperty(h) || (R[h] = []),
            R[h].push(function () {
              e[n] = S[h];
              ++m;
              m === f.length && d(e);
            }));
      });
      0 === f.length && d(e);
    }
    function Qa(a) {
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
    var Ra = void 0;
    function U(a) {
      for (var b = ''; D[a]; ) b += Ra[D[a++]];
      return b;
    }
    var Sa = void 0;
    function W(a) {
      throw new Sa(a);
    }
    function T(a, b, c) {
      c = c || {};
      if (!('argPackAdvance' in b))
        throw new TypeError(
          'registerType registeredInstance requires argPackAdvance',
        );
      var d = b.name;
      a || W('type "' + d + '" must have a positive integer typeid pointer');
      if (S.hasOwnProperty(a)) {
        if (c.Z) return;
        W("Cannot register type '" + d + "' twice");
      }
      S[a] = b;
      delete Ka[a];
      R.hasOwnProperty(a) &&
        ((b = R[a]),
        delete R[a],
        b.forEach(function (e) {
          e();
        }));
    }
    var Ta = [],
      X = [
        {},
        { value: void 0 },
        { value: null },
        { value: !0 },
        { value: !1 },
      ];
    function Ua(a) {
      4 < a && 0 === --X[a].P && ((X[a] = void 0), Ta.push(a));
    }
    function Va(a) {
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
          var b = Ta.length ? Ta.pop() : X.length;
          X[b] = { P: 1, value: a };
          return b;
      }
    }
    function Wa(a) {
      if (null === a) return 'null';
      var b = typeof a;
      return 'object' === b || 'array' === b || 'function' === b
        ? a.toString()
        : '' + a;
    }
    function Xa(a, b) {
      switch (b) {
        case 2:
          return function (c) {
            return this.fromWireType(sa[c >> 2]);
          };
        case 3:
          return function (c) {
            return this.fromWireType(ta[c >> 3]);
          };
        default:
          throw new TypeError('Unknown float type: ' + a);
      }
    }
    function Ya(a) {
      var b = Function;
      if (!(b instanceof Function))
        throw new TypeError(
          'new_ called with constructor type ' +
            typeof b +
            ' which is not a function',
        );
      var c = Ma(b.name || 'unknownFunctionName', function () {});
      c.prototype = b.prototype;
      c = new c();
      a = b.apply(c, a);
      return a instanceof Object ? a : c;
    }
    function Za(a, b) {
      var c = g;
      if (void 0 === c[a].L) {
        var d = c[a];
        c[a] = function () {
          c[a].L.hasOwnProperty(arguments.length) ||
            W(
              "Function '" +
                b +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ') - expects one of (' +
                c[a].L +
                ')!',
            );
          return c[a].L[arguments.length].apply(this, arguments);
        };
        c[a].L = [];
        c[a].L[d.T] = d;
      }
    }
    function $a(a, b, c) {
      g.hasOwnProperty(a)
        ? ((void 0 === c || (void 0 !== g[a].L && void 0 !== g[a].L[c])) &&
            W("Cannot register public name '" + a + "' twice"),
          Za(a, a),
          g.hasOwnProperty(c) &&
            W(
              'Cannot register multiple overloads of a function with the same number of arguments (' +
                c +
                ')!',
            ),
          (g[a].L[c] = b))
        : ((g[a] = b), void 0 !== c && (g[a].la = c));
    }
    function ab(a, b) {
      for (var c = [], d = 0; d < a; d++) c.push(H[(b >> 2) + d]);
      return c;
    }
    function bb(a, b) {
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
    function Y(a, b) {
      a = U(a);
      var c = -1 != a.indexOf('j') ? bb(a, b) : C.get(b);
      'function' !== typeof c &&
        W('unknown function pointer with signature ' + a + ': ' + b);
      return c;
    }
    var cb = void 0;
    function db(a) {
      a = eb(a);
      var b = U(a);
      Z(a);
      return b;
    }
    function fb(a, b) {
      function c(f) {
        e[f] || S[f] || (Ka[f] ? Ka[f].forEach(c) : (d.push(f), (e[f] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new cb(a + ': ' + d.map(db).join([', ']));
    }
    function gb(a, b, c) {
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
    var hb = {};
    function ib() {
      return 'object' === typeof globalThis
        ? globalThis
        : Function('return this')();
    }
    function jb(a, b) {
      var c = S[a];
      void 0 === c && W(b + ' has unknown type ' + db(a));
      return c;
    }
    var kb = {},
      lb = {};
    function mb() {
      if (!nb) {
        var a = {
            USER: 'web_user',
            LOGNAME: 'web_user',
            PATH: '/',
            PWD: '/',
            HOME: '/home/web_user',
            LANG:
              (
                ('object' === typeof navigator &&
                  navigator.languages &&
                  navigator.languages[0]) ||
                'C'
              ).replace('-', '_') + '.UTF-8',
            _: ca || './this.program',
          },
          b;
        for (b in lb) a[b] = lb[b];
        var c = [];
        for (b in a) c.push(b + '=' + a[b]);
        nb = c;
      }
      return nb;
    }
    var nb,
      ob = [null, [], []];
    Oa = g.InternalError = Na('InternalError');
    for (var pb = Array(256), qb = 0; 256 > qb; ++qb)
      pb[qb] = String.fromCharCode(qb);
    Ra = pb;
    Sa = g.BindingError = Na('BindingError');
    g.count_emval_handles = function () {
      for (var a = 0, b = 5; b < X.length; ++b) void 0 !== X[b] && ++a;
      return a;
    };
    g.get_first_emval = function () {
      for (var a = 5; a < X.length; ++a) if (void 0 !== X[a]) return X[a];
      return null;
    };
    cb = g.UnboundTypeError = Na('UnboundTypeError');
    var tb = {
      l: function (a) {
        return rb(a + 16) + 16;
      },
      E: function () {},
      C: function (a, b, c) {
        new Ha(a).$(b, c);
        'uncaught_exception' in P ? P.R++ : (P.R = 1);
        throw a;
      },
      b: C,
      n: function (a) {
        var b = Q[a];
        delete Q[a];
        var c = b.aa,
          d = b.ba,
          e = b.S,
          f = e
            .map(function (m) {
              return m.Y;
            })
            .concat(
              e.map(function (m) {
                return m.ia;
              }),
            );
        Pa([a], f, function (m) {
          var h = {};
          e.forEach(function (n, k) {
            var l = m[k],
              q = n.W,
              x = n.X,
              y = m[k + e.length],
              p = n.ha,
              fa = n.ja;
            h[n.U] = {
              read: function (z) {
                return l.fromWireType(q(x, z));
              },
              write: function (z, F) {
                var V = [];
                p(fa, z, y.toWireType(V, F));
                Ia(V);
              },
            };
          });
          return [
            {
              name: b.name,
              fromWireType: function (n) {
                var k = {},
                  l;
                for (l in h) k[l] = h[l].read(n);
                d(n);
                return k;
              },
              toWireType: function (n, k) {
                for (var l in h)
                  if (!(l in k))
                    throw new TypeError('Missing field:  "' + l + '"');
                var q = c();
                for (l in h) h[l].write(q, k[l]);
                null !== n && n.push(d, q);
                return q;
              },
              argPackAdvance: 8,
              readValueFromPointer: Ja,
              M: d,
            },
          ];
        });
      },
      z: function (a, b, c, d, e) {
        var f = Qa(c);
        b = U(b);
        T(a, {
          name: b,
          fromWireType: function (m) {
            return !!m;
          },
          toWireType: function (m, h) {
            return h ? d : e;
          },
          argPackAdvance: 8,
          readValueFromPointer: function (m) {
            if (1 === c) var h = J;
            else if (2 === c) h = G;
            else if (4 === c) h = H;
            else throw new TypeError('Unknown boolean type size: ' + b);
            return this.fromWireType(h[m >> f]);
          },
          M: null,
        });
      },
      y: function (a, b) {
        b = U(b);
        T(a, {
          name: b,
          fromWireType: function (c) {
            var d = X[c].value;
            Ua(c);
            return d;
          },
          toWireType: function (c, d) {
            return Va(d);
          },
          argPackAdvance: 8,
          readValueFromPointer: Ja,
          M: null,
        });
      },
      j: function (a, b, c) {
        c = Qa(c);
        b = U(b);
        T(a, {
          name: b,
          fromWireType: function (d) {
            return d;
          },
          toWireType: function (d, e) {
            if ('number' !== typeof e && 'boolean' !== typeof e)
              throw new TypeError(
                'Cannot convert "' + Wa(e) + '" to ' + this.name,
              );
            return e;
          },
          argPackAdvance: 8,
          readValueFromPointer: Xa(b, c),
          M: null,
        });
      },
      g: function (a, b, c, d, e, f) {
        var m = ab(b, c);
        a = U(a);
        e = Y(d, e);
        $a(
          a,
          function () {
            fb('Cannot call ' + a + ' due to unbound types', m);
          },
          b - 1,
        );
        Pa([], m, function (h) {
          var n = a,
            k = a;
          h = [h[0], null].concat(h.slice(1));
          var l = e,
            q = h.length;
          2 > q &&
            W(
              "argTypes array size mismatch! Must at least get return value and 'this' types!",
            );
          for (var x = null !== h[1] && !1, y = !1, p = 1; p < h.length; ++p)
            if (null !== h[p] && void 0 === h[p].M) {
              y = !0;
              break;
            }
          var fa = 'void' !== h[0].name,
            z = '',
            F = '';
          for (p = 0; p < q - 2; ++p)
            (z += (0 !== p ? ', ' : '') + 'arg' + p),
              (F += (0 !== p ? ', ' : '') + 'arg' + p + 'Wired');
          k =
            'return function ' +
            La(k) +
            '(' +
            z +
            ') {\nif (arguments.length !== ' +
            (q - 2) +
            ") {\nthrowBindingError('function " +
            k +
            " called with ' + arguments.length + ' arguments, expected " +
            (q - 2) +
            " args!');\n}\n";
          y && (k += 'var destructors = [];\n');
          var V = y ? 'destructors' : 'null';
          z = 'throwBindingError invoker fn runDestructors retType classParam'.split(
            ' ',
          );
          l = [W, l, f, Ia, h[0], h[1]];
          x &&
            (k += 'var thisWired = classParam.toWireType(' + V + ', this);\n');
          for (p = 0; p < q - 2; ++p)
            (k +=
              'var arg' +
              p +
              'Wired = argType' +
              p +
              '.toWireType(' +
              V +
              ', arg' +
              p +
              '); // ' +
              h[p + 2].name +
              '\n'),
              z.push('argType' + p),
              l.push(h[p + 2]);
          x && (F = 'thisWired' + (0 < F.length ? ', ' : '') + F);
          k +=
            (fa ? 'var rv = ' : '') +
            'invoker(fn' +
            (0 < F.length ? ', ' : '') +
            F +
            ');\n';
          if (y) k += 'runDestructors(destructors);\n';
          else
            for (p = x ? 1 : 2; p < h.length; ++p)
              (q = 1 === p ? 'thisWired' : 'arg' + (p - 2) + 'Wired'),
                null !== h[p].M &&
                  ((k += q + '_dtor(' + q + '); // ' + h[p].name + '\n'),
                  z.push(q + '_dtor'),
                  l.push(h[p].M));
          fa && (k += 'var ret = retType.fromWireType(rv);\nreturn ret;\n');
          z.push(k + '}\n');
          h = Ya(z).apply(null, l);
          p = b - 1;
          if (!g.hasOwnProperty(n))
            throw new Oa('Replacing nonexistant public symbol');
          void 0 !== g[n].L && void 0 !== p
            ? (g[n].L[p] = h)
            : ((g[n] = h), (g[n].T = p));
          return [];
        });
      },
      d: function (a, b, c, d, e) {
        function f(k) {
          return k;
        }
        b = U(b);
        -1 === e && (e = 4294967295);
        var m = Qa(c);
        if (0 === d) {
          var h = 32 - 8 * c;
          f = function (k) {
            return (k << h) >>> h;
          };
        }
        var n = -1 != b.indexOf('unsigned');
        T(a, {
          name: b,
          fromWireType: f,
          toWireType: function (k, l) {
            if ('number' !== typeof l && 'boolean' !== typeof l)
              throw new TypeError(
                'Cannot convert "' + Wa(l) + '" to ' + this.name,
              );
            if (l < d || l > e)
              throw new TypeError(
                'Passing a number "' +
                  Wa(l) +
                  '" from JS side to C/C++ side to an argument of type "' +
                  b +
                  '", which is outside the valid range [' +
                  d +
                  ', ' +
                  e +
                  ']!',
              );
            return n ? l >>> 0 : l | 0;
          },
          argPackAdvance: 8,
          readValueFromPointer: gb(b, m, 0 !== d),
          M: null,
        });
      },
      c: function (a, b, c) {
        function d(f) {
          f >>= 2;
          var m = K;
          return new e(I, m[f + 1], m[f]);
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
          { Z: !0 },
        );
      },
      k: function (a, b) {
        b = U(b);
        var c = 'std::string' === b;
        T(a, {
          name: b,
          fromWireType: function (d) {
            var e = K[d >> 2];
            if (c)
              for (var f = d + 4, m = 0; m <= e; ++m) {
                var h = d + 4 + m;
                if (m == e || 0 == D[h]) {
                  if (f) {
                    for (var n = f + (h - f), k = f; !(k >= n) && D[k]; ) ++k;
                    f = ja.decode(D.subarray(f, k));
                  } else f = '';
                  if (void 0 === l) var l = f;
                  else (l += String.fromCharCode(0)), (l += f);
                  f = h + 1;
                }
              }
            else {
              l = Array(e);
              for (m = 0; m < e; ++m) l[m] = String.fromCharCode(D[d + 4 + m]);
              l = l.join('');
            }
            Z(d);
            return l;
          },
          toWireType: function (d, e) {
            e instanceof ArrayBuffer && (e = new Uint8Array(e));
            var f = 'string' === typeof e;
            f ||
              e instanceof Uint8Array ||
              e instanceof Uint8ClampedArray ||
              e instanceof Int8Array ||
              W('Cannot pass non-string to std::string');
            var m = (c && f
                ? function () {
                    for (var k = 0, l = 0; l < e.length; ++l) {
                      var q = e.charCodeAt(l);
                      55296 <= q &&
                        57343 >= q &&
                        (q =
                          (65536 + ((q & 1023) << 10)) |
                          (e.charCodeAt(++l) & 1023));
                      127 >= q
                        ? ++k
                        : (k = 2047 >= q ? k + 2 : 65535 >= q ? k + 3 : k + 4);
                    }
                    return k;
                  }
                : function () {
                    return e.length;
                  })(),
              h = rb(4 + m + 1);
            K[h >> 2] = m;
            if (c && f) ka(e, h + 4, m + 1);
            else if (f)
              for (f = 0; f < m; ++f) {
                var n = e.charCodeAt(f);
                255 < n &&
                  (Z(h),
                  W('String has UTF-16 code units that do not fit in 8 bits'));
                D[h + 4 + f] = n;
              }
            else for (f = 0; f < m; ++f) D[h + 4 + f] = e[f];
            null !== d && d.push(Z, h);
            return h;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ja,
          M: function (d) {
            Z(d);
          },
        });
      },
      f: function (a, b, c) {
        c = U(c);
        if (2 === b) {
          var d = ma;
          var e = na;
          var f = oa;
          var m = function () {
            return E;
          };
          var h = 1;
        } else
          4 === b &&
            ((d = pa),
            (e = qa),
            (f = ra),
            (m = function () {
              return K;
            }),
            (h = 2));
        T(a, {
          name: c,
          fromWireType: function (n) {
            for (var k = K[n >> 2], l = m(), q, x = n + 4, y = 0; y <= k; ++y) {
              var p = n + 4 + y * b;
              if (y == k || 0 == l[p >> h])
                (x = d(x, p - x)),
                  void 0 === q
                    ? (q = x)
                    : ((q += String.fromCharCode(0)), (q += x)),
                  (x = p + b);
            }
            Z(n);
            return q;
          },
          toWireType: function (n, k) {
            'string' !== typeof k &&
              W('Cannot pass non-string to C++ string type ' + c);
            var l = f(k),
              q = rb(4 + l + b);
            K[q >> 2] = l >> h;
            e(k, q + 4, l + b);
            null !== n && n.push(Z, q);
            return q;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ja,
          M: function (n) {
            Z(n);
          },
        });
      },
      o: function (a, b, c, d, e, f) {
        Q[a] = { name: U(b), aa: Y(c, d), ba: Y(e, f), S: [] };
      },
      h: function (a, b, c, d, e, f, m, h, n, k) {
        Q[a].S.push({
          U: U(b),
          Y: c,
          W: Y(d, e),
          X: f,
          ia: m,
          ha: Y(h, n),
          ja: k,
        });
      },
      A: function (a, b) {
        b = U(b);
        T(a, {
          ka: !0,
          name: b,
          argPackAdvance: 0,
          fromWireType: function () {},
          toWireType: function () {},
        });
      },
      x: Ua,
      D: function (a) {
        if (0 === a) return Va(ib());
        var b = hb[a];
        a = void 0 === b ? U(a) : b;
        return Va(ib()[a]);
      },
      m: function (a) {
        4 < a && (X[a].P += 1);
      },
      p: function (a, b, c, d) {
        a || W('Cannot use deleted val. handle = ' + a);
        a = X[a].value;
        var e = kb[b];
        if (!e) {
          e = '';
          for (var f = 0; f < b; ++f) e += (0 !== f ? ', ' : '') + 'arg' + f;
          var m =
            'return function emval_allocator_' +
            b +
            '(constructor, argTypes, args) {\n';
          for (f = 0; f < b; ++f)
            m +=
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
            m +
              ('var obj = new constructor(' +
                e +
                ');\nreturn __emval_register(obj);\n}\n'),
          )(jb, g, Va);
          kb[b] = e;
        }
        return e(a, c, d);
      },
      t: function () {
        A();
      },
      s: function (a, b, c) {
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
              ua(B.buffer);
              var e = 1;
              break a;
            } catch (f) {}
            e = void 0;
          }
          if (e) return !0;
        }
        return !1;
      },
      u: function (a, b) {
        var c = 0;
        mb().forEach(function (d, e) {
          var f = b + c;
          e = H[(a + 4 * e) >> 2] = f;
          for (f = 0; f < d.length; ++f) J[e++ >> 0] = d.charCodeAt(f);
          J[e >> 0] = 0;
          c += d.length + 1;
        });
        return 0;
      },
      v: function (a, b) {
        var c = mb();
        H[a >> 2] = c.length;
        var d = 0;
        c.forEach(function (e) {
          d += e.length + 1;
        });
        H[b >> 2] = d;
        return 0;
      },
      B: function (a) {
        if (!noExitRuntime) {
          if (g.onExit) g.onExit(a);
          ia = !0;
        }
        da(a, new sb(a));
      },
      w: function () {
        return 0;
      },
      q: function () {},
      i: function (a, b, c, d) {
        for (var e = 0, f = 0; f < c; f++) {
          for (
            var m = H[(b + 8 * f) >> 2], h = H[(b + (8 * f + 4)) >> 2], n = 0;
            n < h;
            n++
          ) {
            var k = D[m + n],
              l = ob[a];
            if (0 === k || 10 === k) {
              for (k = 0; l[k] && !(NaN <= k); ) ++k;
              k = ja.decode(
                l.subarray ? l.subarray(0, k) : new Uint8Array(l.slice(0, k)),
              );
              (1 === a ? ha : v)(k);
              l.length = 0;
            } else l.push(k);
          }
          e += h;
        }
        H[d >> 2] = e;
        return 0;
      },
      a: B,
      r: function () {},
    };
    (function () {
      function a(e) {
        g.asm = e.exports;
        L--;
        g.monitorRunDependencies && g.monitorRunDependencies(L);
        0 == L &&
          (null !== Ba && (clearInterval(Ba), (Ba = null)),
          M && ((e = M), (M = null), e()));
      }
      function b(e) {
        a(e.instance);
      }
      function c(e) {
        return Fa()
          .then(function (f) {
            return WebAssembly.instantiate(f, d);
          })
          .then(e, function (f) {
            v('failed to asynchronously prepare wasm: ' + f);
            A(f);
          });
      }
      var d = { a: tb };
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
          w ||
          'function' !== typeof WebAssembly.instantiateStreaming ||
          Ca() ||
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
    var Ga = (g.___wasm_call_ctors = function () {
        return (Ga = g.___wasm_call_ctors = g.asm.F).apply(null, arguments);
      }),
      Z = (g._free = function () {
        return (Z = g._free = g.asm.G).apply(null, arguments);
      }),
      rb = (g._malloc = function () {
        return (rb = g._malloc = g.asm.H).apply(null, arguments);
      }),
      eb = (g.___getTypeName = function () {
        return (eb = g.___getTypeName = g.asm.I).apply(null, arguments);
      });
    g.___embind_register_native_and_builtin_types = function () {
      return (g.___embind_register_native_and_builtin_types = g.asm.J).apply(
        null,
        arguments,
      );
    };
    g.dynCall_jiji = function () {
      return (g.dynCall_jiji = g.asm.K).apply(null, arguments);
    };
    var ub;
    function sb(a) {
      this.name = 'ExitStatus';
      this.message = 'Program terminated with exit(' + a + ')';
      this.status = a;
    }
    M = function vb() {
      ub || wb();
      ub || (M = vb);
    };
    function wb() {
      function a() {
        if (!ub && ((ub = !0), (g.calledRun = !0), !ia)) {
          O(xa);
          O(ya);
          aa(g);
          if (g.onRuntimeInitialized) g.onRuntimeInitialized();
          if (g.postRun)
            for (
              'function' == typeof g.postRun && (g.postRun = [g.postRun]);
              g.postRun.length;

            ) {
              var b = g.postRun.shift();
              za.unshift(b);
            }
          O(za);
        }
      }
      if (!(0 < L)) {
        if (g.preRun)
          for (
            'function' == typeof g.preRun && (g.preRun = [g.preRun]);
            g.preRun.length;

          )
            Aa();
        O(wa);
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
    g.run = wb;
    if (g.preInit)
      for (
        'function' == typeof g.preInit && (g.preInit = [g.preInit]);
        0 < g.preInit.length;

      )
        g.preInit.pop()();
    noExitRuntime = !0;
    wb();

    return Module.ready;
  };
})();
export default Module;
