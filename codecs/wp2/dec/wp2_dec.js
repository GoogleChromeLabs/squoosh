var wp2_dec = (function () {
  var _scriptDir =
    typeof document !== 'undefined' && document.currentScript
      ? document.currentScript.src
      : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return function (wp2_dec) {
    wp2_dec = wp2_dec || {};

    var d;
    d || (d = typeof wp2_dec !== 'undefined' ? wp2_dec : {});
    var aa, ba;
    d.ready = new Promise(function (a, b) {
      aa = a;
      ba = b;
    });
    var r = {},
      t;
    for (t in d) d.hasOwnProperty(t) && (r[t] = d[t]);
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
      x,
      z,
      ea,
      fa;
    if (ca)
      (w = v ? require('path').dirname(w) + '/' : __dirname + '/'),
        (x = function (a, b) {
          ea || (ea = require('fs'));
          fa || (fa = require('path'));
          a = fa.normalize(a);
          return ea.readFileSync(a, b ? null : 'utf8');
        }),
        (z = function (a) {
          a = x(a, !0);
          a.buffer || (a = new Uint8Array(a));
          a.buffer || A('Assertion failed: undefined');
          return a;
        }),
        1 < process.argv.length && process.argv[1].replace(/\\/g, '/'),
        process.argv.slice(2),
        process.on('uncaughtException', function (a) {
          throw a;
        }),
        process.on('unhandledRejection', A),
        (d.inspect = function () {
          return '[Emscripten Module object]';
        });
    else if (da)
      'undefined' != typeof read &&
        (x = function (a) {
          return read(a);
        }),
        (z = function (a) {
          if ('function' === typeof readbuffer)
            return new Uint8Array(readbuffer(a));
          a = read(a, 'binary');
          'object' === typeof a || A('Assertion failed: undefined');
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
        (x = function (a) {
          var b = new XMLHttpRequest();
          b.open('GET', a, !1);
          b.send(null);
          return b.responseText;
        }),
        v &&
          (z = function (a) {
            var b = new XMLHttpRequest();
            b.open('GET', a, !1);
            b.responseType = 'arraybuffer';
            b.send(null);
            return new Uint8Array(b.response);
          });
    var ha = d.print || console.log.bind(console),
      B = d.printErr || console.warn.bind(console);
    for (t in r) r.hasOwnProperty(t) && (d[t] = r[t]);
    r = null;
    var D;
    d.wasmBinary && (D = d.wasmBinary);
    var noExitRuntime;
    d.noExitRuntime && (noExitRuntime = d.noExitRuntime);
    'object' !== typeof WebAssembly && A('no native wasm support detected');
    var E,
      ia = new WebAssembly.Table({
        initial: 270,
        maximum: 270,
        element: 'anyfunc',
      }),
      ja = !1,
      ka =
        'undefined' !== typeof TextDecoder ? new TextDecoder('utf8') : void 0;
    function la(a, b, c) {
      var e = b + c;
      for (c = b; a[c] && !(c >= e); ) ++c;
      if (16 < c - b && a.subarray && ka) return ka.decode(a.subarray(b, c));
      for (e = ''; b < c; ) {
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
    function ma(a, b, c) {
      var e = F;
      if (0 < c) {
        c = b + c - 1;
        for (var f = 0; f < a.length; ++f) {
          var g = a.charCodeAt(f);
          if (55296 <= g && 57343 >= g) {
            var l = a.charCodeAt(++f);
            g = (65536 + ((g & 1023) << 10)) | (l & 1023);
          }
          if (127 >= g) {
            if (b >= c) break;
            e[b++] = g;
          } else {
            if (2047 >= g) {
              if (b + 1 >= c) break;
              e[b++] = 192 | (g >> 6);
            } else {
              if (65535 >= g) {
                if (b + 2 >= c) break;
                e[b++] = 224 | (g >> 12);
              } else {
                if (b + 3 >= c) break;
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
      var c = a >> 1;
      for (var e = c + b / 2; !(c >= e) && G[c]; ) ++c;
      c <<= 1;
      if (32 < c - a && na) return na.decode(F.subarray(a, c));
      c = 0;
      for (e = ''; ; ) {
        var f = H[(a + 2 * c) >> 1];
        if (0 == f || c == b / 2) return e;
        ++c;
        e += String.fromCharCode(f);
      }
    }
    function pa(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (2 > c) return 0;
      c -= 2;
      var e = b;
      c = c < 2 * a.length ? c / 2 : a.length;
      for (var f = 0; f < c; ++f) (H[b >> 1] = a.charCodeAt(f)), (b += 2);
      H[b >> 1] = 0;
      return b - e;
    }
    function qa(a) {
      return 2 * a.length;
    }
    function ra(a, b) {
      for (var c = 0, e = ''; !(c >= b / 4); ) {
        var f = I[(a + 4 * c) >> 2];
        if (0 == f) break;
        ++c;
        65536 <= f
          ? ((f -= 65536),
            (e += String.fromCharCode(55296 | (f >> 10), 56320 | (f & 1023))))
          : (e += String.fromCharCode(f));
      }
      return e;
    }
    function sa(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (4 > c) return 0;
      var e = b;
      c = e + c - 4;
      for (var f = 0; f < a.length; ++f) {
        var g = a.charCodeAt(f);
        if (55296 <= g && 57343 >= g) {
          var l = a.charCodeAt(++f);
          g = (65536 + ((g & 1023) << 10)) | (l & 1023);
        }
        I[b >> 2] = g;
        b += 4;
        if (b + 4 > c) break;
      }
      I[b >> 2] = 0;
      return b - e;
    }
    function ta(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var e = a.charCodeAt(c);
        55296 <= e && 57343 >= e && ++c;
        b += 4;
      }
      return b;
    }
    var J, ua, F, H, G, I, L, va, wa;
    function xa(a) {
      J = a;
      d.HEAP8 = ua = new Int8Array(a);
      d.HEAP16 = H = new Int16Array(a);
      d.HEAP32 = I = new Int32Array(a);
      d.HEAPU8 = F = new Uint8Array(a);
      d.HEAPU16 = G = new Uint16Array(a);
      d.HEAPU32 = L = new Uint32Array(a);
      d.HEAPF32 = va = new Float32Array(a);
      d.HEAPF64 = wa = new Float64Array(a);
    }
    var ya = d.INITIAL_MEMORY || 16777216;
    d.wasmMemory
      ? (E = d.wasmMemory)
      : (E = new WebAssembly.Memory({ initial: ya / 65536, maximum: 32768 }));
    E && (J = E.buffer);
    ya = J.byteLength;
    xa(J);
    I[32956] = 5374864;
    function M(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ('function' == typeof b) b(d);
        else {
          var c = b.ea;
          'number' === typeof c
            ? void 0 === b.$
              ? d.dynCall_v(c)
              : d.dynCall_vi(c, b.$)
            : c(void 0 === b.$ ? null : b.$);
        }
      }
    }
    var za = [],
      Aa = [],
      Ba = [],
      Ca = [];
    function Da() {
      var a = d.preRun.shift();
      za.unshift(a);
    }
    var Ea = Math.ceil,
      Fa = Math.floor,
      N = 0,
      Ga = null,
      O = null;
    d.preloadedImages = {};
    d.preloadedAudios = {};
    function A(a) {
      if (d.onAbort) d.onAbort(a);
      B(a);
      ja = !0;
      a = new WebAssembly.RuntimeError(
        'abort(' + a + '). Build with -s ASSERTIONS=1 for more info.',
      );
      ba(a);
      throw a;
    }
    function Ha(a) {
      var b = Q;
      return String.prototype.startsWith ? b.startsWith(a) : 0 === b.indexOf(a);
    }
    function Ia() {
      return Ha('data:application/octet-stream;base64,');
    }
    var Q = 'wp2_dec.wasm';
    if (!Ia()) {
      var Ja = Q;
      Q = d.locateFile ? d.locateFile(Ja, w) : w + Ja;
    }
    function Ka() {
      try {
        if (D) return new Uint8Array(D);
        if (z) return z(Q);
        throw 'both async and sync fetching of the wasm failed';
      } catch (a) {
        A(a);
      }
    }
    function La() {
      return D || (!u && !v) || 'function' !== typeof fetch || Ha('file://')
        ? new Promise(function (a) {
            a(Ka());
          })
        : fetch(Q, { credentials: 'same-origin' })
            .then(function (a) {
              if (!a.ok) throw "failed to load wasm binary file at '" + Q + "'";
              return a.arrayBuffer();
            })
            .catch(function () {
              return Ka();
            });
    }
    Aa.push({
      ea: function () {
        Ma();
      },
    });
    function R() {
      return 0 < R.ba;
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
    function S(a) {
      for (var b = ''; F[a]; ) b += Oa[F[a++]];
      return b;
    }
    var T = {},
      U = {},
      V = {};
    function Pa(a) {
      if (void 0 === a) return '_unknown';
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return 48 <= b && 57 >= b ? '_' + a : a;
    }
    function Qa(a, b) {
      a = Pa(a);
      return new Function(
        'body',
        'return function ' +
          a +
          '() {\n    "use strict";    return body.apply(this, arguments);\n};\n',
      )(b);
    }
    function Ra(a) {
      var b = Error,
        c = Qa(a, function (e) {
          this.name = a;
          this.message = e;
          e = Error(e).stack;
          void 0 !== e &&
            (this.stack =
              this.toString() + '\n' + e.replace(/^Error(:[^\n]*)?\n/, ''));
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
    var Sa = void 0;
    function W(a) {
      throw new Sa(a);
    }
    var Ta = void 0;
    function Ua(a, b) {
      function c(k) {
        k = b(k);
        if (k.length !== e.length)
          throw new Ta('Mismatched type converter count');
        for (var h = 0; h < e.length; ++h) X(e[h], k[h]);
      }
      var e = [];
      e.forEach(function (k) {
        V[k] = a;
      });
      var f = Array(a.length),
        g = [],
        l = 0;
      a.forEach(function (k, h) {
        U.hasOwnProperty(k)
          ? (f[h] = U[k])
          : (g.push(k),
            T.hasOwnProperty(k) || (T[k] = []),
            T[k].push(function () {
              f[h] = U[k];
              ++l;
              l === g.length && c(f);
            }));
      });
      0 === g.length && c(f);
    }
    function X(a, b, c) {
      c = c || {};
      if (!('argPackAdvance' in b))
        throw new TypeError(
          'registerType registeredInstance requires argPackAdvance',
        );
      var e = b.name;
      a || W('type "' + e + '" must have a positive integer typeid pointer');
      if (U.hasOwnProperty(a)) {
        if (c.fa) return;
        W("Cannot register type '" + e + "' twice");
      }
      U[a] = b;
      delete V[a];
      T.hasOwnProperty(a) &&
        ((b = T[a]),
        delete T[a],
        b.forEach(function (f) {
          f();
        }));
    }
    var Va = [],
      Y = [
        {},
        { value: void 0 },
        { value: null },
        { value: !0 },
        { value: !1 },
      ];
    function Wa(a) {
      4 < a && 0 === --Y[a].aa && ((Y[a] = void 0), Va.push(a));
    }
    function Za(a) {
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
          var b = Va.length ? Va.pop() : Y.length;
          Y[b] = { aa: 1, value: a };
          return b;
      }
    }
    function $a(a) {
      return this.fromWireType(L[a >> 2]);
    }
    function ab(a) {
      if (null === a) return 'null';
      var b = typeof a;
      return 'object' === b || 'array' === b || 'function' === b
        ? a.toString()
        : '' + a;
    }
    function bb(a, b) {
      switch (b) {
        case 2:
          return function (c) {
            return this.fromWireType(va[c >> 2]);
          };
        case 3:
          return function (c) {
            return this.fromWireType(wa[c >> 3]);
          };
        default:
          throw new TypeError('Unknown float type: ' + a);
      }
    }
    function cb(a) {
      var b = Function;
      if (!(b instanceof Function))
        throw new TypeError(
          'new_ called with constructor type ' +
            typeof b +
            ' which is not a function',
        );
      var c = Qa(b.name || 'unknownFunctionName', function () {});
      c.prototype = b.prototype;
      c = new c();
      a = b.apply(c, a);
      return a instanceof Object ? a : c;
    }
    function db(a) {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    }
    function eb(a, b) {
      var c = d;
      if (void 0 === c[a].Y) {
        var e = c[a];
        c[a] = function () {
          c[a].Y.hasOwnProperty(arguments.length) ||
            W(
              "Function '" +
                b +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ') - expects one of (' +
                c[a].Y +
                ')!',
            );
          return c[a].Y[arguments.length].apply(this, arguments);
        };
        c[a].Y = [];
        c[a].Y[e.da] = e;
      }
    }
    function fb(a, b, c) {
      d.hasOwnProperty(a)
        ? ((void 0 === c || (void 0 !== d[a].Y && void 0 !== d[a].Y[c])) &&
            W("Cannot register public name '" + a + "' twice"),
          eb(a, a),
          d.hasOwnProperty(c) &&
            W(
              'Cannot register multiple overloads of a function with the same number of arguments (' +
                c +
                ')!',
            ),
          (d[a].Y[c] = b))
        : ((d[a] = b), void 0 !== c && (d[a].ha = c));
    }
    function gb(a, b) {
      for (var c = [], e = 0; e < a; e++) c.push(I[(b >> 2) + e]);
      return c;
    }
    function hb(a, b) {
      a = S(a);
      var c = d['dynCall_' + a];
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
      c = new Function('dynCall', 'rawFunction', f + '};\n')(c, b);
      'function' !== typeof c &&
        W('unknown function pointer with signature ' + a + ': ' + b);
      return c;
    }
    var ib = void 0;
    function jb(a) {
      a = kb(a);
      var b = S(a);
      Z(a);
      return b;
    }
    function lb(a, b) {
      function c(g) {
        f[g] || U[g] || (V[g] ? V[g].forEach(c) : (e.push(g), (f[g] = !0)));
      }
      var e = [],
        f = {};
      b.forEach(c);
      throw new ib(a + ': ' + e.map(jb).join([', ']));
    }
    function mb(a, b, c) {
      switch (b) {
        case 0:
          return c
            ? function (e) {
                return ua[e];
              }
            : function (e) {
                return F[e];
              };
        case 1:
          return c
            ? function (e) {
                return H[e >> 1];
              }
            : function (e) {
                return G[e >> 1];
              };
        case 2:
          return c
            ? function (e) {
                return I[e >> 2];
              }
            : function (e) {
                return L[e >> 2];
              };
        default:
          throw new TypeError('Unknown integer type: ' + a);
      }
    }
    var nb = {};
    function ob() {
      return 'object' === typeof globalThis
        ? globalThis
        : Function('return this')();
    }
    function pb(a, b) {
      var c = U[a];
      void 0 === c && W(b + ' has unknown type ' + jb(a));
      return c;
    }
    for (
      var qb = {}, rb = [null, [], []], sb = Array(256), tb = 0;
      256 > tb;
      ++tb
    )
      sb[tb] = String.fromCharCode(tb);
    Oa = sb;
    Sa = d.BindingError = Ra('BindingError');
    Ta = d.InternalError = Ra('InternalError');
    d.count_emval_handles = function () {
      for (var a = 0, b = 5; b < Y.length; ++b) void 0 !== Y[b] && ++a;
      return a;
    };
    d.get_first_emval = function () {
      for (var a = 5; a < Y.length; ++a) if (void 0 !== Y[a]) return Y[a];
      return null;
    };
    ib = d.UnboundTypeError = Ra('UnboundTypeError');
    var vb = {
      t: function (a) {
        return ub(a);
      },
      g: function () {},
      s: function (a) {
        'uncaught_exception' in R ? R.ba++ : (R.ba = 1);
        throw a;
      },
      y: function (a, b, c, e, f) {
        var g = Na(c);
        b = S(b);
        X(a, {
          name: b,
          fromWireType: function (l) {
            return !!l;
          },
          toWireType: function (l, k) {
            return k ? e : f;
          },
          argPackAdvance: 8,
          readValueFromPointer: function (l) {
            if (1 === c) var k = ua;
            else if (2 === c) k = H;
            else if (4 === c) k = I;
            else throw new TypeError('Unknown boolean type size: ' + b);
            return this.fromWireType(k[l >> g]);
          },
          Z: null,
        });
      },
      x: function (a, b) {
        b = S(b);
        X(a, {
          name: b,
          fromWireType: function (c) {
            var e = Y[c].value;
            Wa(c);
            return e;
          },
          toWireType: function (c, e) {
            return Za(e);
          },
          argPackAdvance: 8,
          readValueFromPointer: $a,
          Z: null,
        });
      },
      n: function (a, b, c) {
        c = Na(c);
        b = S(b);
        X(a, {
          name: b,
          fromWireType: function (e) {
            return e;
          },
          toWireType: function (e, f) {
            if ('number' !== typeof f && 'boolean' !== typeof f)
              throw new TypeError(
                'Cannot convert "' + ab(f) + '" to ' + this.name,
              );
            return f;
          },
          argPackAdvance: 8,
          readValueFromPointer: bb(b, c),
          Z: null,
        });
      },
      u: function (a, b, c, e, f, g) {
        var l = gb(b, c);
        a = S(a);
        f = hb(e, f);
        fb(
          a,
          function () {
            lb('Cannot call ' + a + ' due to unbound types', l);
          },
          b - 1,
        );
        Ua(l, function (k) {
          var h = [k[0], null].concat(k.slice(1)),
            n = (k = a),
            p = f,
            q = h.length;
          2 > q &&
            W(
              "argTypes array size mismatch! Must at least get return value and 'this' types!",
            );
          for (var y = null !== h[1] && !1, C = !1, m = 1; m < h.length; ++m)
            if (null !== h[m] && void 0 === h[m].Z) {
              C = !0;
              break;
            }
          var Xa = 'void' !== h[0].name,
            K = '',
            P = '';
          for (m = 0; m < q - 2; ++m)
            (K += (0 !== m ? ', ' : '') + 'arg' + m),
              (P += (0 !== m ? ', ' : '') + 'arg' + m + 'Wired');
          n =
            'return function ' +
            Pa(n) +
            '(' +
            K +
            ') {\nif (arguments.length !== ' +
            (q - 2) +
            ") {\nthrowBindingError('function " +
            n +
            " called with ' + arguments.length + ' arguments, expected " +
            (q - 2) +
            " args!');\n}\n";
          C && (n += 'var destructors = [];\n');
          var Ya = C ? 'destructors' : 'null';
          K = 'throwBindingError invoker fn runDestructors retType classParam'.split(
            ' ',
          );
          p = [W, p, g, db, h[0], h[1]];
          y &&
            (n += 'var thisWired = classParam.toWireType(' + Ya + ', this);\n');
          for (m = 0; m < q - 2; ++m)
            (n +=
              'var arg' +
              m +
              'Wired = argType' +
              m +
              '.toWireType(' +
              Ya +
              ', arg' +
              m +
              '); // ' +
              h[m + 2].name +
              '\n'),
              K.push('argType' + m),
              p.push(h[m + 2]);
          y && (P = 'thisWired' + (0 < P.length ? ', ' : '') + P);
          n +=
            (Xa ? 'var rv = ' : '') +
            'invoker(fn' +
            (0 < P.length ? ', ' : '') +
            P +
            ');\n';
          if (C) n += 'runDestructors(destructors);\n';
          else
            for (m = y ? 1 : 2; m < h.length; ++m)
              (q = 1 === m ? 'thisWired' : 'arg' + (m - 2) + 'Wired'),
                null !== h[m].Z &&
                  ((n += q + '_dtor(' + q + '); // ' + h[m].name + '\n'),
                  K.push(q + '_dtor'),
                  p.push(h[m].Z));
          Xa && (n += 'var ret = retType.fromWireType(rv);\nreturn ret;\n');
          K.push(n + '}\n');
          h = cb(K).apply(null, p);
          m = b - 1;
          if (!d.hasOwnProperty(k))
            throw new Ta('Replacing nonexistant public symbol');
          void 0 !== d[k].Y && void 0 !== m
            ? (d[k].Y[m] = h)
            : ((d[k] = h), (d[k].da = m));
          return [];
        });
      },
      b: function (a, b, c, e, f) {
        function g(n) {
          return n;
        }
        b = S(b);
        -1 === f && (f = 4294967295);
        var l = Na(c);
        if (0 === e) {
          var k = 32 - 8 * c;
          g = function (n) {
            return (n << k) >>> k;
          };
        }
        var h = -1 != b.indexOf('unsigned');
        X(a, {
          name: b,
          fromWireType: g,
          toWireType: function (n, p) {
            if ('number' !== typeof p && 'boolean' !== typeof p)
              throw new TypeError(
                'Cannot convert "' + ab(p) + '" to ' + this.name,
              );
            if (p < e || p > f)
              throw new TypeError(
                'Passing a number "' +
                  ab(p) +
                  '" from JS side to C/C++ side to an argument of type "' +
                  b +
                  '", which is outside the valid range [' +
                  e +
                  ', ' +
                  f +
                  ']!',
              );
            return h ? p >>> 0 : p | 0;
          },
          argPackAdvance: 8,
          readValueFromPointer: mb(b, l, 0 !== e),
          Z: null,
        });
      },
      a: function (a, b, c) {
        function e(g) {
          g >>= 2;
          var l = L;
          return new f(J, l[g + 1], l[g]);
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
        c = S(c);
        X(
          a,
          {
            name: c,
            fromWireType: e,
            argPackAdvance: 8,
            readValueFromPointer: e,
          },
          { fa: !0 },
        );
      },
      o: function (a, b) {
        b = S(b);
        var c = 'std::string' === b;
        X(a, {
          name: b,
          fromWireType: function (e) {
            var f = L[e >> 2];
            if (c)
              for (var g = e + 4, l = 0; l <= f; ++l) {
                var k = e + 4 + l;
                if (l == f || 0 == F[k]) {
                  g = g ? la(F, g, k - g) : '';
                  if (void 0 === h) var h = g;
                  else (h += String.fromCharCode(0)), (h += g);
                  g = k + 1;
                }
              }
            else {
              h = Array(f);
              for (l = 0; l < f; ++l) h[l] = String.fromCharCode(F[e + 4 + l]);
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
              W('Cannot pass non-string to std::string');
            var l = (c && g
                ? function () {
                    for (var n = 0, p = 0; p < f.length; ++p) {
                      var q = f.charCodeAt(p);
                      55296 <= q &&
                        57343 >= q &&
                        (q =
                          (65536 + ((q & 1023) << 10)) |
                          (f.charCodeAt(++p) & 1023));
                      127 >= q
                        ? ++n
                        : (n = 2047 >= q ? n + 2 : 65535 >= q ? n + 3 : n + 4);
                    }
                    return n;
                  }
                : function () {
                    return f.length;
                  })(),
              k = ub(4 + l + 1);
            L[k >> 2] = l;
            if (c && g) ma(f, k + 4, l + 1);
            else if (g)
              for (g = 0; g < l; ++g) {
                var h = f.charCodeAt(g);
                255 < h &&
                  (Z(k),
                  W('String has UTF-16 code units that do not fit in 8 bits'));
                F[k + 4 + g] = h;
              }
            else for (g = 0; g < l; ++g) F[k + 4 + g] = f[g];
            null !== e && e.push(Z, k);
            return k;
          },
          argPackAdvance: 8,
          readValueFromPointer: $a,
          Z: function (e) {
            Z(e);
          },
        });
      },
      h: function (a, b, c) {
        c = S(c);
        if (2 === b) {
          var e = oa;
          var f = pa;
          var g = qa;
          var l = function () {
            return G;
          };
          var k = 1;
        } else
          4 === b &&
            ((e = ra),
            (f = sa),
            (g = ta),
            (l = function () {
              return L;
            }),
            (k = 2));
        X(a, {
          name: c,
          fromWireType: function (h) {
            for (var n = L[h >> 2], p = l(), q, y = h + 4, C = 0; C <= n; ++C) {
              var m = h + 4 + C * b;
              if (C == n || 0 == p[m >> k])
                (y = e(y, m - y)),
                  void 0 === q
                    ? (q = y)
                    : ((q += String.fromCharCode(0)), (q += y)),
                  (y = m + b);
            }
            Z(h);
            return q;
          },
          toWireType: function (h, n) {
            'string' !== typeof n &&
              W('Cannot pass non-string to C++ string type ' + c);
            var p = g(n),
              q = ub(4 + p + b);
            L[q >> 2] = p >> k;
            f(n, q + 4, p + b);
            null !== h && h.push(Z, q);
            return q;
          },
          argPackAdvance: 8,
          readValueFromPointer: $a,
          Z: function (h) {
            Z(h);
          },
        });
      },
      z: function (a, b) {
        b = S(b);
        X(a, {
          ga: !0,
          name: b,
          argPackAdvance: 0,
          fromWireType: function () {},
          toWireType: function () {},
        });
      },
      e: Wa,
      f: function (a) {
        if (0 === a) return Za(ob());
        var b = nb[a];
        a = void 0 === b ? S(a) : b;
        return Za(ob()[a]);
      },
      i: function (a) {
        4 < a && (Y[a].aa += 1);
      },
      j: function (a, b, c, e) {
        a || W('Cannot use deleted val. handle = ' + a);
        a = Y[a].value;
        var f = qb[b];
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
          )(pb, d, Za);
          qb[b] = f;
        }
        return f(a, c, e);
      },
      l: function () {
        A();
      },
      w: function (a, b, c) {
        F.copyWithin(a, b, b + c);
      },
      c: function (a) {
        a >>>= 0;
        var b = F.length;
        if (2147483648 < a) return !1;
        for (var c = 1; 4 >= c; c *= 2) {
          var e = b * (1 + 0.2 / c);
          e = Math.min(e, a + 100663296);
          e = Math.max(16777216, a, e);
          0 < e % 65536 && (e += 65536 - (e % 65536));
          a: {
            try {
              E.grow((Math.min(2147483648, e) - J.byteLength + 65535) >>> 16);
              xa(E.buffer);
              var f = 1;
              break a;
            } catch (g) {}
            f = void 0;
          }
          if (f) return !0;
        }
        return !1;
      },
      m: function (a, b, c, e) {
        for (var f = 0, g = 0; g < c; g++) {
          for (
            var l = I[(b + 8 * g) >> 2], k = I[(b + (8 * g + 4)) >> 2], h = 0;
            h < k;
            h++
          ) {
            var n = F[l + h],
              p = rb[a];
            0 === n || 10 === n
              ? ((1 === a ? ha : B)(la(p, 0)), (p.length = 0))
              : p.push(n);
          }
          f += k;
        }
        I[e >> 2] = f;
        return 0;
      },
      memory: E,
      p: function () {
        return 0;
      },
      r: function () {
        return 0;
      },
      q: function () {},
      B: function () {
        return 6;
      },
      A: function () {},
      k: function (a) {
        a = +a;
        return 0 <= a ? +Fa(a + 0.5) : +Ea(a - 0.5);
      },
      d: function (a) {
        a = +a;
        return 0 <= a ? +Fa(a + 0.5) : +Ea(a - 0.5);
      },
      v: function () {},
      table: ia,
    };
    (function () {
      function a(f) {
        d.asm = f.exports;
        N--;
        d.monitorRunDependencies && d.monitorRunDependencies(N);
        0 == N &&
          (null !== Ga && (clearInterval(Ga), (Ga = null)),
          O && ((f = O), (O = null), f()));
      }
      function b(f) {
        a(f.instance);
      }
      function c(f) {
        return La()
          .then(function (g) {
            return WebAssembly.instantiate(g, e);
          })
          .then(f, function (g) {
            B('failed to asynchronously prepare wasm: ' + g);
            A(g);
          });
      }
      var e = { a: vb };
      N++;
      d.monitorRunDependencies && d.monitorRunDependencies(N);
      if (d.instantiateWasm)
        try {
          return d.instantiateWasm(e, a);
        } catch (f) {
          return (
            B('Module.instantiateWasm callback failed with error: ' + f), !1
          );
        }
      (function () {
        if (
          D ||
          'function' !== typeof WebAssembly.instantiateStreaming ||
          Ia() ||
          Ha('file://') ||
          'function' !== typeof fetch
        )
          return c(b);
        fetch(Q, { credentials: 'same-origin' }).then(function (f) {
          return WebAssembly.instantiateStreaming(f, e).then(b, function (g) {
            B('wasm streaming compile failed: ' + g);
            B('falling back to ArrayBuffer instantiation');
            return c(b);
          });
        });
      })();
      return {};
    })();
    var Ma = (d.___wasm_call_ctors = function () {
        return (Ma = d.___wasm_call_ctors = d.asm.C).apply(null, arguments);
      }),
      ub = (d._malloc = function () {
        return (ub = d._malloc = d.asm.D).apply(null, arguments);
      }),
      Z = (d._free = function () {
        return (Z = d._free = d.asm.E).apply(null, arguments);
      }),
      kb = (d.___getTypeName = function () {
        return (kb = d.___getTypeName = d.asm.F).apply(null, arguments);
      });
    d.___embind_register_native_and_builtin_types = function () {
      return (d.___embind_register_native_and_builtin_types = d.asm.G).apply(
        null,
        arguments,
      );
    };
    d.dynCall_iii = function () {
      return (d.dynCall_iii = d.asm.H).apply(null, arguments);
    };
    d.dynCall_vii = function () {
      return (d.dynCall_vii = d.asm.I).apply(null, arguments);
    };
    d.dynCall_vi = function () {
      return (d.dynCall_vi = d.asm.J).apply(null, arguments);
    };
    d.dynCall_viii = function () {
      return (d.dynCall_viii = d.asm.K).apply(null, arguments);
    };
    d.dynCall_viiiiiiii = function () {
      return (d.dynCall_viiiiiiii = d.asm.L).apply(null, arguments);
    };
    d.dynCall_ii = function () {
      return (d.dynCall_ii = d.asm.M).apply(null, arguments);
    };
    d.dynCall_viiiiiii = function () {
      return (d.dynCall_viiiiiii = d.asm.N).apply(null, arguments);
    };
    d.dynCall_viiiiiiiii = function () {
      return (d.dynCall_viiiiiiiii = d.asm.O).apply(null, arguments);
    };
    d.dynCall_viiii = function () {
      return (d.dynCall_viiii = d.asm.P).apply(null, arguments);
    };
    d.dynCall_viiiiii = function () {
      return (d.dynCall_viiiiii = d.asm.Q).apply(null, arguments);
    };
    d.dynCall_iidiiii = function () {
      return (d.dynCall_iidiiii = d.asm.R).apply(null, arguments);
    };
    d.dynCall_v = function () {
      return (d.dynCall_v = d.asm.S).apply(null, arguments);
    };
    d.dynCall_viiiii = function () {
      return (d.dynCall_viiiii = d.asm.T).apply(null, arguments);
    };
    d.dynCall_iiiiii = function () {
      return (d.dynCall_iiiiii = d.asm.U).apply(null, arguments);
    };
    d.dynCall_iiii = function () {
      return (d.dynCall_iiii = d.asm.V).apply(null, arguments);
    };
    d.dynCall_iiiii = function () {
      return (d.dynCall_iiiii = d.asm.W).apply(null, arguments);
    };
    d.dynCall_jiji = function () {
      return (d.dynCall_jiji = d.asm.X).apply(null, arguments);
    };
    var wb;
    O = function xb() {
      wb || yb();
      wb || (O = xb);
    };
    function yb() {
      function a() {
        if (!wb && ((wb = !0), (d.calledRun = !0), !ja)) {
          M(Aa);
          M(Ba);
          aa(d);
          if (d.onRuntimeInitialized) d.onRuntimeInitialized();
          if (d.postRun)
            for (
              'function' == typeof d.postRun && (d.postRun = [d.postRun]);
              d.postRun.length;

            ) {
              var b = d.postRun.shift();
              Ca.unshift(b);
            }
          M(Ca);
        }
      }
      if (!(0 < N)) {
        if (d.preRun)
          for (
            'function' == typeof d.preRun && (d.preRun = [d.preRun]);
            d.preRun.length;

          )
            Da();
        M(za);
        0 < N ||
          (d.setStatus
            ? (d.setStatus('Running...'),
              setTimeout(function () {
                setTimeout(function () {
                  d.setStatus('');
                }, 1);
                a();
              }, 1))
            : a());
      }
    }
    d.run = yb;
    if (d.preInit)
      for (
        'function' == typeof d.preInit && (d.preInit = [d.preInit]);
        0 < d.preInit.length;

      )
        d.preInit.pop()();
    noExitRuntime = !0;
    yb();

    return wp2_dec.ready;
  };
})();
if (typeof exports === 'object' && typeof module === 'object')
  module.exports = wp2_dec;
else if (typeof define === 'function' && define['amd'])
  define([], function () {
    return wp2_dec;
  });
else if (typeof exports === 'object') exports['wp2_dec'] = wp2_dec;
