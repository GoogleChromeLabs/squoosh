var Module = (function () {
  var _scriptDir = import.meta.url;

  return function (Module) {
    Module = Module || {};

    var f;
    f || (f = typeof Module !== 'undefined' ? Module : {});
    var aa, ba;
    f.ready = new Promise(function (a, b) {
      aa = a;
      ba = b;
    });
    var r = {},
      t;
    for (t in f) f.hasOwnProperty(t) && (r[t] = f[t]);
    var ca = './this.program';
    function ea(a, b) {
      throw b;
    }
    var u = '',
      fa;
    u = self.location.href;
    _scriptDir && (u = _scriptDir);
    0 !== u.indexOf('blob:')
      ? (u = u.substr(0, u.lastIndexOf('/') + 1))
      : (u = '');
    fa = function (a) {
      var b = new XMLHttpRequest();
      b.open('GET', a, !1);
      b.responseType = 'arraybuffer';
      b.send(null);
      return new Uint8Array(b.response);
    };
    var ha = f.print || console.log.bind(console),
      v = f.printErr || console.warn.bind(console);
    for (t in r) r.hasOwnProperty(t) && (f[t] = r[t]);
    r = null;
    f.thisProgram && (ca = f.thisProgram);
    f.quit && (ea = f.quit);
    var w;
    f.wasmBinary && (w = f.wasmBinary);
    var noExitRuntime;
    f.noExitRuntime && (noExitRuntime = f.noExitRuntime);
    'object' !== typeof WebAssembly && A('no native wasm support detected');
    var B,
      ia = !1,
      ja = new TextDecoder('utf8');
    function ka(a, b, c) {
      var d = C;
      if (0 < c) {
        c = b + c - 1;
        for (var e = 0; e < a.length; ++e) {
          var g = a.charCodeAt(e);
          if (55296 <= g && 57343 >= g) {
            var m = a.charCodeAt(++e);
            g = (65536 + ((g & 1023) << 10)) | (m & 1023);
          }
          if (127 >= g) {
            if (b >= c) break;
            d[b++] = g;
          } else {
            if (2047 >= g) {
              if (b + 1 >= c) break;
              d[b++] = 192 | (g >> 6);
            } else {
              if (65535 >= g) {
                if (b + 2 >= c) break;
                d[b++] = 224 | (g >> 12);
              } else {
                if (b + 3 >= c) break;
                d[b++] = 240 | (g >> 18);
                d[b++] = 128 | ((g >> 12) & 63);
              }
              d[b++] = 128 | ((g >> 6) & 63);
            }
            d[b++] = 128 | (g & 63);
          }
        }
        d[b] = 0;
      }
    }
    var la = new TextDecoder('utf-16le');
    function ma(a, b) {
      var c = a >> 1;
      for (b = c + b / 2; !(c >= b) && D[c]; ) ++c;
      return la.decode(C.subarray(a, c << 1));
    }
    function na(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (2 > c) return 0;
      c -= 2;
      var d = b;
      c = c < 2 * a.length ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) (E[b >> 1] = a.charCodeAt(e)), (b += 2);
      E[b >> 1] = 0;
      return b - d;
    }
    function oa(a) {
      return 2 * a.length;
    }
    function pa(a, b) {
      for (var c = 0, d = ''; !(c >= b / 4); ) {
        var e = G[(a + 4 * c) >> 2];
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
        var g = a.charCodeAt(e);
        if (55296 <= g && 57343 >= g) {
          var m = a.charCodeAt(++e);
          g = (65536 + ((g & 1023) << 10)) | (m & 1023);
        }
        G[b >> 2] = g;
        b += 4;
        if (b + 4 > c) break;
      }
      G[b >> 2] = 0;
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
    var H, I, C, E, D, G, J, sa, ta;
    function ua(a) {
      H = a;
      f.HEAP8 = I = new Int8Array(a);
      f.HEAP16 = E = new Int16Array(a);
      f.HEAP32 = G = new Int32Array(a);
      f.HEAPU8 = C = new Uint8Array(a);
      f.HEAPU16 = D = new Uint16Array(a);
      f.HEAPU32 = J = new Uint32Array(a);
      f.HEAPF32 = sa = new Float32Array(a);
      f.HEAPF64 = ta = new Float64Array(a);
    }
    var va = f.INITIAL_MEMORY || 16777216;
    f.wasmMemory
      ? (B = f.wasmMemory)
      : (B = new WebAssembly.Memory({ initial: va / 65536, maximum: 32768 }));
    B && (H = B.buffer);
    va = H.byteLength;
    ua(H);
    var K,
      wa = [],
      xa = [],
      ya = [],
      za = [];
    function Aa() {
      var a = f.preRun.shift();
      wa.unshift(a);
    }
    var L = 0,
      Ba = null,
      M = null;
    f.preloadedImages = {};
    f.preloadedAudios = {};
    function A(a) {
      if (f.onAbort) f.onAbort(a);
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
      N = f.locateFile ? f.locateFile(Da, u) : u + Da;
    }
    function Ea() {
      try {
        if (w) return new Uint8Array(w);
        if (fa) return fa(N);
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
    function O(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ('function' == typeof b) b(f);
        else {
          var c = b.R;
          'number' === typeof c
            ? void 0 === b.L
              ? K.get(c)()
              : K.get(c)(b.L)
            : c(void 0 === b.L ? null : b.L);
        }
      }
    }
    var P = {};
    function Ga(a) {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    }
    function Q(a) {
      return this.fromWireType(J[a >> 2]);
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
        g = [],
        m = 0;
      b.forEach(function (h, n) {
        S.hasOwnProperty(h)
          ? (e[n] = S[h])
          : (g.push(h),
            R.hasOwnProperty(h) || (R[h] = []),
            R[h].push(function () {
              e[n] = S[h];
              ++m;
              m === g.length && d(e);
            }));
      });
      0 === g.length && d(e);
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
      for (var b = ''; C[a]; ) b += Oa[C[a++]];
      return b;
    }
    var Pa = void 0;
    function W(a) {
      throw new Pa(a);
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
        if (c.V) return;
        W("Cannot register type '" + d + "' twice");
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
      4 < a && 0 === --X[a].M && ((X[a] = void 0), Qa.push(a));
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
          X[b] = { M: 1, value: a };
          return b;
      }
    }
    function Ta(a) {
      if (null === a) return 'null';
      var b = typeof a;
      return 'object' === b || 'array' === b || 'function' === b
        ? a.toString()
        : '' + a;
    }
    function Ua(a, b) {
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
    function Va(a) {
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
    function Wa(a, b) {
      var c = f;
      if (void 0 === c[a].J) {
        var d = c[a];
        c[a] = function () {
          c[a].J.hasOwnProperty(arguments.length) ||
            W(
              "Function '" +
                b +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ') - expects one of (' +
                c[a].J +
                ')!',
            );
          return c[a].J[arguments.length].apply(this, arguments);
        };
        c[a].J = [];
        c[a].J[d.O] = d;
      }
    }
    function Xa(a, b, c) {
      f.hasOwnProperty(a)
        ? ((void 0 === c || (void 0 !== f[a].J && void 0 !== f[a].J[c])) &&
            W("Cannot register public name '" + a + "' twice"),
          Wa(a, a),
          f.hasOwnProperty(c) &&
            W(
              'Cannot register multiple overloads of a function with the same number of arguments (' +
                c +
                ')!',
            ),
          (f[a].J[c] = b))
        : ((f[a] = b), void 0 !== c && (f[a].ba = c));
    }
    function Ya(a, b) {
      for (var c = [], d = 0; d < a; d++) c.push(G[(b >> 2) + d]);
      return c;
    }
    function Za(a, b) {
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
                ? f['dynCall_' + a].apply(null, [b].concat(c))
                : f['dynCall_' + a].call(null, b))
          : (e = K.get(b).apply(null, c));
        return e;
      };
    }
    function Y(a, b) {
      a = U(a);
      var c = -1 != a.indexOf('j') ? Za(a, b) : K.get(b);
      'function' !== typeof c &&
        W('unknown function pointer with signature ' + a + ': ' + b);
      return c;
    }
    var $a = void 0;
    function ab(a) {
      a = bb(a);
      var b = U(a);
      Z(a);
      return b;
    }
    function cb(a, b) {
      function c(g) {
        e[g] || S[g] || (Ha[g] ? Ha[g].forEach(c) : (d.push(g), (e[g] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new $a(a + ': ' + d.map(ab).join([', ']));
    }
    function db(a, b, c) {
      switch (b) {
        case 0:
          return c
            ? function (d) {
                return I[d];
              }
            : function (d) {
                return C[d];
              };
        case 1:
          return c
            ? function (d) {
                return E[d >> 1];
              }
            : function (d) {
                return D[d >> 1];
              };
        case 2:
          return c
            ? function (d) {
                return G[d >> 2];
              }
            : function (d) {
                return J[d >> 2];
              };
        default:
          throw new TypeError('Unknown integer type: ' + a);
      }
    }
    var eb = {};
    function fb() {
      return 'object' === typeof globalThis
        ? globalThis
        : Function('return this')();
    }
    function gb(a, b) {
      var c = S[a];
      void 0 === c && W(b + ' has unknown type ' + ab(a));
      return c;
    }
    var hb = {},
      ib = {};
    function jb() {
      if (!kb) {
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
        for (b in ib) a[b] = ib[b];
        var c = [];
        for (b in a) c.push(b + '=' + a[b]);
        kb = c;
      }
      return kb;
    }
    var kb,
      lb = [null, [], []];
    La = f.InternalError = Ka('InternalError');
    for (var mb = Array(256), nb = 0; 256 > nb; ++nb)
      mb[nb] = String.fromCharCode(nb);
    Oa = mb;
    Pa = f.BindingError = Ka('BindingError');
    f.count_emval_handles = function () {
      for (var a = 0, b = 5; b < X.length; ++b) void 0 !== X[b] && ++a;
      return a;
    };
    f.get_first_emval = function () {
      for (var a = 5; a < X.length; ++a) if (void 0 !== X[a]) return X[a];
      return null;
    };
    $a = f.UnboundTypeError = Ka('UnboundTypeError');
    xa.push({
      R: function () {
        ob();
      },
    });
    var rb = {
      B: function () {},
      o: function (a) {
        var b = P[a];
        delete P[a];
        var c = b.W,
          d = b.X,
          e = b.N,
          g = e
            .map(function (m) {
              return m.U;
            })
            .concat(
              e.map(function (m) {
                return m.Z;
              }),
            );
        Ma([a], g, function (m) {
          var h = {};
          e.forEach(function (n, k) {
            var l = m[k],
              q = n.S,
              x = n.T,
              y = m[k + e.length],
              p = n.Y,
              da = n.$;
            h[n.P] = {
              read: function (z) {
                return l.fromWireType(q(x, z));
              },
              write: function (z, F) {
                var V = [];
                p(da, z, y.toWireType(V, F));
                Ga(V);
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
              readValueFromPointer: Q,
              K: d,
            },
          ];
        });
      },
      y: function (a, b, c, d, e) {
        var g = Na(c);
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
            if (1 === c) var h = I;
            else if (2 === c) h = E;
            else if (4 === c) h = G;
            else throw new TypeError('Unknown boolean type size: ' + b);
            return this.fromWireType(h[m >> g]);
          },
          K: null,
        });
      },
      x: function (a, b) {
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
          readValueFromPointer: Q,
          K: null,
        });
      },
      k: function (a, b, c) {
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
                'Cannot convert "' + Ta(e) + '" to ' + this.name,
              );
            return e;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ua(b, c),
          K: null,
        });
      },
      g: function (a, b, c, d, e, g) {
        var m = Ya(b, c);
        a = U(a);
        e = Y(d, e);
        Xa(
          a,
          function () {
            cb('Cannot call ' + a + ' due to unbound types', m);
          },
          b - 1,
        );
        Ma([], m, function (h) {
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
            if (null !== h[p] && void 0 === h[p].K) {
              y = !0;
              break;
            }
          var da = 'void' !== h[0].name,
            z = '',
            F = '';
          for (p = 0; p < q - 2; ++p)
            (z += (0 !== p ? ', ' : '') + 'arg' + p),
              (F += (0 !== p ? ', ' : '') + 'arg' + p + 'Wired');
          k =
            'return function ' +
            Ia(k) +
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
          l = [W, l, g, Ga, h[0], h[1]];
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
            (da ? 'var rv = ' : '') +
            'invoker(fn' +
            (0 < F.length ? ', ' : '') +
            F +
            ');\n';
          if (y) k += 'runDestructors(destructors);\n';
          else
            for (p = x ? 1 : 2; p < h.length; ++p)
              (q = 1 === p ? 'thisWired' : 'arg' + (p - 2) + 'Wired'),
                null !== h[p].K &&
                  ((k += q + '_dtor(' + q + '); // ' + h[p].name + '\n'),
                  z.push(q + '_dtor'),
                  l.push(h[p].K));
          da && (k += 'var ret = retType.fromWireType(rv);\nreturn ret;\n');
          z.push(k + '}\n');
          h = Va(z).apply(null, l);
          p = b - 1;
          if (!f.hasOwnProperty(n))
            throw new La('Replacing nonexistant public symbol');
          void 0 !== f[n].J && void 0 !== p
            ? (f[n].J[p] = h)
            : ((f[n] = h), (f[n].O = p));
          return [];
        });
      },
      d: function (a, b, c, d, e) {
        function g(k) {
          return k;
        }
        b = U(b);
        -1 === e && (e = 4294967295);
        var m = Na(c);
        if (0 === d) {
          var h = 32 - 8 * c;
          g = function (k) {
            return (k << h) >>> h;
          };
        }
        var n = -1 != b.indexOf('unsigned');
        T(a, {
          name: b,
          fromWireType: g,
          toWireType: function (k, l) {
            if ('number' !== typeof l && 'boolean' !== typeof l)
              throw new TypeError(
                'Cannot convert "' + Ta(l) + '" to ' + this.name,
              );
            if (l < d || l > e)
              throw new TypeError(
                'Passing a number "' +
                  Ta(l) +
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
          readValueFromPointer: db(b, m, 0 !== d),
          K: null,
        });
      },
      c: function (a, b, c) {
        function d(g) {
          g >>= 2;
          var m = J;
          return new e(H, m[g + 1], m[g]);
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
          { V: !0 },
        );
      },
      l: function (a, b) {
        b = U(b);
        var c = 'std::string' === b;
        T(a, {
          name: b,
          fromWireType: function (d) {
            var e = J[d >> 2];
            if (c)
              for (var g = d + 4, m = 0; m <= e; ++m) {
                var h = d + 4 + m;
                if (m == e || 0 == C[h]) {
                  if (g) {
                    for (var n = g + (h - g), k = g; !(k >= n) && C[k]; ) ++k;
                    g = ja.decode(C.subarray(g, k));
                  } else g = '';
                  if (void 0 === l) var l = g;
                  else (l += String.fromCharCode(0)), (l += g);
                  g = h + 1;
                }
              }
            else {
              l = Array(e);
              for (m = 0; m < e; ++m) l[m] = String.fromCharCode(C[d + 4 + m]);
              l = l.join('');
            }
            Z(d);
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
            var m = (c && g
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
              h = pb(4 + m + 1);
            J[h >> 2] = m;
            if (c && g) ka(e, h + 4, m + 1);
            else if (g)
              for (g = 0; g < m; ++g) {
                var n = e.charCodeAt(g);
                255 < n &&
                  (Z(h),
                  W('String has UTF-16 code units that do not fit in 8 bits'));
                C[h + 4 + g] = n;
              }
            else for (g = 0; g < m; ++g) C[h + 4 + g] = e[g];
            null !== d && d.push(Z, h);
            return h;
          },
          argPackAdvance: 8,
          readValueFromPointer: Q,
          K: function (d) {
            Z(d);
          },
        });
      },
      f: function (a, b, c) {
        c = U(c);
        if (2 === b) {
          var d = ma;
          var e = na;
          var g = oa;
          var m = function () {
            return D;
          };
          var h = 1;
        } else
          4 === b &&
            ((d = pa),
            (e = qa),
            (g = ra),
            (m = function () {
              return J;
            }),
            (h = 2));
        T(a, {
          name: c,
          fromWireType: function (n) {
            for (var k = J[n >> 2], l = m(), q, x = n + 4, y = 0; y <= k; ++y) {
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
            var l = g(k),
              q = pb(4 + l + b);
            J[q >> 2] = l >> h;
            e(k, q + 4, l + b);
            null !== n && n.push(Z, q);
            return q;
          },
          argPackAdvance: 8,
          readValueFromPointer: Q,
          K: function (n) {
            Z(n);
          },
        });
      },
      p: function (a, b, c, d, e, g) {
        P[a] = { name: U(b), W: Y(c, d), X: Y(e, g), N: [] };
      },
      b: function (a, b, c, d, e, g, m, h, n, k) {
        P[a].N.push({
          P: U(b),
          U: c,
          S: Y(d, e),
          T: g,
          Z: m,
          Y: Y(h, n),
          $: k,
        });
      },
      z: function (a, b) {
        b = U(b);
        T(a, {
          aa: !0,
          name: b,
          argPackAdvance: 0,
          fromWireType: function () {},
          toWireType: function () {},
        });
      },
      i: Ra,
      A: function (a) {
        if (0 === a) return Sa(fb());
        var b = eb[a];
        a = void 0 === b ? U(a) : b;
        return Sa(fb()[a]);
      },
      n: function (a) {
        4 < a && (X[a].M += 1);
      },
      q: function (a, b, c, d) {
        a || W('Cannot use deleted val. handle = ' + a);
        a = X[a].value;
        var e = hb[b];
        if (!e) {
          e = '';
          for (var g = 0; g < b; ++g) e += (0 !== g ? ', ' : '') + 'arg' + g;
          var m =
            'return function emval_allocator_' +
            b +
            '(constructor, argTypes, args) {\n';
          for (g = 0; g < b; ++g)
            m +=
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
            m +
              ('var obj = new constructor(' +
                e +
                ');\nreturn __emval_register(obj);\n}\n'),
          )(gb, f, Sa);
          hb[b] = e;
        }
        return e(a, c, d);
      },
      h: function () {
        A();
      },
      t: function (a, b, c) {
        C.copyWithin(a, b, b + c);
      },
      e: function (a) {
        a >>>= 0;
        var b = C.length;
        if (2147483648 < a) return !1;
        for (var c = 1; 4 >= c; c *= 2) {
          var d = b * (1 + 0.2 / c);
          d = Math.min(d, a + 100663296);
          d = Math.max(16777216, a, d);
          0 < d % 65536 && (d += 65536 - (d % 65536));
          a: {
            try {
              B.grow((Math.min(2147483648, d) - H.byteLength + 65535) >>> 16);
              ua(B.buffer);
              var e = 1;
              break a;
            } catch (g) {}
            e = void 0;
          }
          if (e) return !0;
        }
        return !1;
      },
      u: function (a, b) {
        var c = 0;
        jb().forEach(function (d, e) {
          var g = b + c;
          e = G[(a + 4 * e) >> 2] = g;
          for (g = 0; g < d.length; ++g) I[e++ >> 0] = d.charCodeAt(g);
          I[e >> 0] = 0;
          c += d.length + 1;
        });
        return 0;
      },
      v: function (a, b) {
        var c = jb();
        G[a >> 2] = c.length;
        var d = 0;
        c.forEach(function (e) {
          d += e.length + 1;
        });
        G[b >> 2] = d;
        return 0;
      },
      m: function (a) {
        if (!noExitRuntime) {
          if (f.onExit) f.onExit(a);
          ia = !0;
        }
        ea(a, new qb(a));
      },
      w: function () {
        return 0;
      },
      r: function () {},
      j: function (a, b, c, d) {
        for (var e = 0, g = 0; g < c; g++) {
          for (
            var m = G[(b + 8 * g) >> 2], h = G[(b + (8 * g + 4)) >> 2], n = 0;
            n < h;
            n++
          ) {
            var k = C[m + n],
              l = lb[a];
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
        G[d >> 2] = e;
        return 0;
      },
      a: B,
      s: function () {},
    };
    (function () {
      function a(e) {
        f.asm = e.exports;
        K = f.asm.C;
        L--;
        f.monitorRunDependencies && f.monitorRunDependencies(L);
        0 == L &&
          (null !== Ba && (clearInterval(Ba), (Ba = null)),
          M && ((e = M), (M = null), e()));
      }
      function b(e) {
        a(e.instance);
      }
      function c(e) {
        return Fa()
          .then(function (g) {
            return WebAssembly.instantiate(g, d);
          })
          .then(e, function (g) {
            v('failed to asynchronously prepare wasm: ' + g);
            A(g);
          });
      }
      var d = { a: rb };
      L++;
      f.monitorRunDependencies && f.monitorRunDependencies(L);
      if (f.instantiateWasm)
        try {
          return f.instantiateWasm(d, a);
        } catch (e) {
          return (
            v('Module.instantiateWasm callback failed with error: ' + e), !1
          );
        }
      (function () {
        return w ||
          'function' !== typeof WebAssembly.instantiateStreaming ||
          Ca() ||
          'function' !== typeof fetch
          ? c(b)
          : fetch(N, { credentials: 'same-origin' }).then(function (e) {
              return WebAssembly.instantiateStreaming(e, d).then(b, function (
                g,
              ) {
                v('wasm streaming compile failed: ' + g);
                v('falling back to ArrayBuffer instantiation');
                return c(b);
              });
            });
      })().catch(ba);
      return {};
    })();
    var ob = (f.___wasm_call_ctors = function () {
        return (ob = f.___wasm_call_ctors = f.asm.D).apply(null, arguments);
      }),
      Z = (f._free = function () {
        return (Z = f._free = f.asm.E).apply(null, arguments);
      }),
      pb = (f._malloc = function () {
        return (pb = f._malloc = f.asm.F).apply(null, arguments);
      }),
      bb = (f.___getTypeName = function () {
        return (bb = f.___getTypeName = f.asm.G).apply(null, arguments);
      });
    f.___embind_register_native_and_builtin_types = function () {
      return (f.___embind_register_native_and_builtin_types = f.asm.H).apply(
        null,
        arguments,
      );
    };
    f.dynCall_jiji = function () {
      return (f.dynCall_jiji = f.asm.I).apply(null, arguments);
    };
    var sb;
    function qb(a) {
      this.name = 'ExitStatus';
      this.message = 'Program terminated with exit(' + a + ')';
      this.status = a;
    }
    M = function tb() {
      sb || ub();
      sb || (M = tb);
    };
    function ub() {
      function a() {
        if (!sb && ((sb = !0), (f.calledRun = !0), !ia)) {
          O(xa);
          O(ya);
          aa(f);
          if (f.onRuntimeInitialized) f.onRuntimeInitialized();
          if (f.postRun)
            for (
              'function' == typeof f.postRun && (f.postRun = [f.postRun]);
              f.postRun.length;

            ) {
              var b = f.postRun.shift();
              za.unshift(b);
            }
          O(za);
        }
      }
      if (!(0 < L)) {
        if (f.preRun)
          for (
            'function' == typeof f.preRun && (f.preRun = [f.preRun]);
            f.preRun.length;

          )
            Aa();
        O(wa);
        0 < L ||
          (f.setStatus
            ? (f.setStatus('Running...'),
              setTimeout(function () {
                setTimeout(function () {
                  f.setStatus('');
                }, 1);
                a();
              }, 1))
            : a());
      }
    }
    f.run = ub;
    if (f.preInit)
      for (
        'function' == typeof f.preInit && (f.preInit = [f.preInit]);
        0 < f.preInit.length;

      )
        f.preInit.pop()();
    noExitRuntime = !0;
    ub();

    return Module.ready;
  };
})();
export default Module;
