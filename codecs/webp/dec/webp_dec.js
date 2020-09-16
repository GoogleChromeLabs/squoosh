var Module = (function () {
  var _scriptDir = import.meta.url;

  return function (Module) {
    Module = Module || {};

    var e;
    e || (e = typeof Module !== 'undefined' ? Module : {});
    var aa, ba;
    e.ready = new Promise(function (a, b) {
      aa = a;
      ba = b;
    });
    var r = {},
      t;
    for (t in e) e.hasOwnProperty(t) && (r[t] = e[t]);
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
    var v = e.printErr || console.warn.bind(console);
    for (t in r) r.hasOwnProperty(t) && (e[t] = r[t]);
    r = null;
    var w;
    e.wasmBinary && (w = e.wasmBinary);
    var noExitRuntime;
    e.noExitRuntime && (noExitRuntime = e.noExitRuntime);
    'object' !== typeof WebAssembly && y('no native wasm support detected');
    var z,
      A = new WebAssembly.Table({
        initial: 130,
        maximum: 130,
        element: 'anyfunc',
      }),
      da = !1,
      ea = new TextDecoder('utf8');
    function fa(a, b, c) {
      var d = B;
      if (0 < c) {
        c = b + c - 1;
        for (var f = 0; f < a.length; ++f) {
          var g = a.charCodeAt(f);
          if (55296 <= g && 57343 >= g) {
            var k = a.charCodeAt(++f);
            g = (65536 + ((g & 1023) << 10)) | (k & 1023);
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
    var ha = new TextDecoder('utf-16le');
    function ia(a, b) {
      var c = a >> 1;
      for (b = c + b / 2; !(c >= b) && D[c]; ) ++c;
      return ha.decode(B.subarray(a, c << 1));
    }
    function ja(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (2 > c) return 0;
      c -= 2;
      var d = b;
      c = c < 2 * a.length ? c / 2 : a.length;
      for (var f = 0; f < c; ++f) (E[b >> 1] = a.charCodeAt(f)), (b += 2);
      E[b >> 1] = 0;
      return b - d;
    }
    function ka(a) {
      return 2 * a.length;
    }
    function la(a, b) {
      for (var c = 0, d = ''; !(c >= b / 4); ) {
        var f = F[(a + 4 * c) >> 2];
        if (0 == f) break;
        ++c;
        65536 <= f
          ? ((f -= 65536),
            (d += String.fromCharCode(55296 | (f >> 10), 56320 | (f & 1023))))
          : (d += String.fromCharCode(f));
      }
      return d;
    }
    function ma(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (4 > c) return 0;
      var d = b;
      c = d + c - 4;
      for (var f = 0; f < a.length; ++f) {
        var g = a.charCodeAt(f);
        if (55296 <= g && 57343 >= g) {
          var k = a.charCodeAt(++f);
          g = (65536 + ((g & 1023) << 10)) | (k & 1023);
        }
        F[b >> 2] = g;
        b += 4;
        if (b + 4 > c) break;
      }
      F[b >> 2] = 0;
      return b - d;
    }
    function na(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        55296 <= d && 57343 >= d && ++c;
        b += 4;
      }
      return b;
    }
    var G, H, B, E, D, F, J, oa, pa;
    function qa(a) {
      G = a;
      e.HEAP8 = H = new Int8Array(a);
      e.HEAP16 = E = new Int16Array(a);
      e.HEAP32 = F = new Int32Array(a);
      e.HEAPU8 = B = new Uint8Array(a);
      e.HEAPU16 = D = new Uint16Array(a);
      e.HEAPU32 = J = new Uint32Array(a);
      e.HEAPF32 = oa = new Float32Array(a);
      e.HEAPF64 = pa = new Float64Array(a);
    }
    var ra = e.INITIAL_MEMORY || 16777216;
    e.wasmMemory
      ? (z = e.wasmMemory)
      : (z = new WebAssembly.Memory({ initial: ra / 65536, maximum: 32768 }));
    z && (G = z.buffer);
    ra = G.byteLength;
    qa(G);
    var sa = [],
      ta = [],
      ua = [],
      va = [];
    function wa() {
      var a = e.preRun.shift();
      sa.unshift(a);
    }
    var K = 0,
      xa = null,
      M = null;
    e.preloadedImages = {};
    e.preloadedAudios = {};
    function y(a) {
      if (e.onAbort) e.onAbort(a);
      v(a);
      da = !0;
      a = new WebAssembly.RuntimeError(
        'abort(' + a + '). Build with -s ASSERTIONS=1 for more info.',
      );
      ba(a);
      throw a;
    }
    function ya() {
      var a = N;
      return String.prototype.startsWith
        ? a.startsWith('data:application/octet-stream;base64,')
        : 0 === a.indexOf('data:application/octet-stream;base64,');
    }
    var N = 'webp_dec.wasm';
    if (!ya()) {
      var za = N;
      N = e.locateFile ? e.locateFile(za, u) : u + za;
    }
    function Aa() {
      try {
        if (w) return new Uint8Array(w);
        if (ca) return ca(N);
        throw 'both async and sync fetching of the wasm failed';
      } catch (a) {
        y(a);
      }
    }
    function Ba() {
      return w || 'function' !== typeof fetch
        ? Promise.resolve().then(Aa)
        : fetch(N, { credentials: 'same-origin' })
            .then(function (a) {
              if (!a.ok) throw "failed to load wasm binary file at '" + N + "'";
              return a.arrayBuffer();
            })
            .catch(function () {
              return Aa();
            });
    }
    ta.push({
      I: function () {
        Ca();
      },
    });
    function O(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ('function' == typeof b) b(e);
        else {
          var c = b.I;
          'number' === typeof c
            ? void 0 === b.D
              ? A.get(c)()
              : A.get(c)(b.D)
            : c(void 0 === b.D ? null : b.D);
        }
      }
    }
    function Da(a) {
      this.C = a - 16;
      this.P = function (b) {
        F[(this.C + 8) >> 2] = b;
      };
      this.M = function (b) {
        F[(this.C + 0) >> 2] = b;
      };
      this.N = function () {
        F[(this.C + 4) >> 2] = 0;
      };
      this.L = function () {
        H[(this.C + 12) >> 0] = 0;
      };
      this.O = function () {
        H[(this.C + 13) >> 0] = 0;
      };
      this.K = function (b, c) {
        this.P(b);
        this.M(c);
        this.N();
        this.L();
        this.O();
      };
    }
    function P() {
      return 0 < P.G;
    }
    function Ea(a) {
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
    var Fa = void 0;
    function Q(a) {
      for (var b = ''; B[a]; ) b += Fa[B[a++]];
      return b;
    }
    var R = {},
      S = {},
      T = {};
    function Ga(a) {
      if (void 0 === a) return '_unknown';
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return 48 <= b && 57 >= b ? '_' + a : a;
    }
    function Ha(a, b) {
      a = Ga(a);
      return new Function(
        'body',
        'return function ' +
          a +
          '() {\n    "use strict";    return body.apply(this, arguments);\n};\n',
      )(b);
    }
    function Ia(a) {
      var b = Error,
        c = Ha(a, function (d) {
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
    var Ja = void 0;
    function U(a) {
      throw new Ja(a);
    }
    var Ka = void 0;
    function Na(a, b) {
      function c(h) {
        h = b(h);
        if (h.length !== d.length)
          throw new Ka('Mismatched type converter count');
        for (var p = 0; p < d.length; ++p) V(d[p], h[p]);
      }
      var d = [];
      d.forEach(function (h) {
        T[h] = a;
      });
      var f = Array(a.length),
        g = [],
        k = 0;
      a.forEach(function (h, p) {
        S.hasOwnProperty(h)
          ? (f[p] = S[h])
          : (g.push(h),
            R.hasOwnProperty(h) || (R[h] = []),
            R[h].push(function () {
              f[p] = S[h];
              ++k;
              k === g.length && c(f);
            }));
      });
      0 === g.length && c(f);
    }
    function V(a, b, c) {
      c = c || {};
      if (!('argPackAdvance' in b))
        throw new TypeError(
          'registerType registeredInstance requires argPackAdvance',
        );
      var d = b.name;
      a || U('type "' + d + '" must have a positive integer typeid pointer');
      if (S.hasOwnProperty(a)) {
        if (c.J) return;
        U("Cannot register type '" + d + "' twice");
      }
      S[a] = b;
      delete T[a];
      R.hasOwnProperty(a) &&
        ((b = R[a]),
        delete R[a],
        b.forEach(function (f) {
          f();
        }));
    }
    var Oa = [],
      W = [
        {},
        { value: void 0 },
        { value: null },
        { value: !0 },
        { value: !1 },
      ];
    function Pa(a) {
      4 < a && 0 === --W[a].F && ((W[a] = void 0), Oa.push(a));
    }
    function X(a) {
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
          var b = Oa.length ? Oa.pop() : W.length;
          W[b] = { F: 1, value: a };
          return b;
      }
    }
    function Qa(a) {
      return this.fromWireType(J[a >> 2]);
    }
    function Ra(a) {
      if (null === a) return 'null';
      var b = typeof a;
      return 'object' === b || 'array' === b || 'function' === b
        ? a.toString()
        : '' + a;
    }
    function Sa(a, b) {
      switch (b) {
        case 2:
          return function (c) {
            return this.fromWireType(oa[c >> 2]);
          };
        case 3:
          return function (c) {
            return this.fromWireType(pa[c >> 3]);
          };
        default:
          throw new TypeError('Unknown float type: ' + a);
      }
    }
    function Ta(a) {
      var b = Function;
      if (!(b instanceof Function))
        throw new TypeError(
          'new_ called with constructor type ' +
            typeof b +
            ' which is not a function',
        );
      var c = Ha(b.name || 'unknownFunctionName', function () {});
      c.prototype = b.prototype;
      c = new c();
      a = b.apply(c, a);
      return a instanceof Object ? a : c;
    }
    function Ua(a) {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    }
    function Va(a, b) {
      var c = e;
      if (void 0 === c[a].A) {
        var d = c[a];
        c[a] = function () {
          c[a].A.hasOwnProperty(arguments.length) ||
            U(
              "Function '" +
                b +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ') - expects one of (' +
                c[a].A +
                ')!',
            );
          return c[a].A[arguments.length].apply(this, arguments);
        };
        c[a].A = [];
        c[a].A[d.H] = d;
      }
    }
    function Wa(a, b, c) {
      e.hasOwnProperty(a)
        ? ((void 0 === c || (void 0 !== e[a].A && void 0 !== e[a].A[c])) &&
            U("Cannot register public name '" + a + "' twice"),
          Va(a, a),
          e.hasOwnProperty(c) &&
            U(
              'Cannot register multiple overloads of a function with the same number of arguments (' +
                c +
                ')!',
            ),
          (e[a].A[c] = b))
        : ((e[a] = b), void 0 !== c && (e[a].S = c));
    }
    function Xa(a, b) {
      for (var c = [], d = 0; d < a; d++) c.push(F[(b >> 2) + d]);
      return c;
    }
    function Ya(a, b) {
      0 <= a.indexOf('j') ||
        y('Assertion failed: getDynCaller should only be called with i64 sigs');
      var c = [];
      return function () {
        c.length = arguments.length;
        for (var d = 0; d < arguments.length; d++) c[d] = arguments[d];
        var f;
        -1 != a.indexOf('j')
          ? (f =
              c && c.length
                ? e['dynCall_' + a].apply(null, [b].concat(c))
                : e['dynCall_' + a].call(null, b))
          : (f = A.get(b).apply(null, c));
        return f;
      };
    }
    function Za(a, b) {
      a = Q(a);
      var c = -1 != a.indexOf('j') ? Ya(a, b) : A.get(b);
      'function' !== typeof c &&
        U('unknown function pointer with signature ' + a + ': ' + b);
      return c;
    }
    var $a = void 0;
    function ab(a) {
      a = bb(a);
      var b = Q(a);
      Y(a);
      return b;
    }
    function cb(a, b) {
      function c(g) {
        f[g] || S[g] || (T[g] ? T[g].forEach(c) : (d.push(g), (f[g] = !0)));
      }
      var d = [],
        f = {};
      b.forEach(c);
      throw new $a(a + ': ' + d.map(ab).join([', ']));
    }
    function db(a, b, c) {
      switch (b) {
        case 0:
          return c
            ? function (d) {
                return H[d];
              }
            : function (d) {
                return B[d];
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
                return F[d >> 2];
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
      void 0 === c && U(b + ' has unknown type ' + ab(a));
      return c;
    }
    for (var hb = {}, ib = Array(256), Z = 0; 256 > Z; ++Z)
      ib[Z] = String.fromCharCode(Z);
    Fa = ib;
    Ja = e.BindingError = Ia('BindingError');
    Ka = e.InternalError = Ia('InternalError');
    e.count_emval_handles = function () {
      for (var a = 0, b = 5; b < W.length; ++b) void 0 !== W[b] && ++a;
      return a;
    };
    e.get_first_emval = function () {
      for (var a = 5; a < W.length; ++a) if (void 0 !== W[a]) return W[a];
      return null;
    };
    $a = e.UnboundTypeError = Ia('UnboundTypeError');
    var kb = {
      o: function (a) {
        return jb(a + 16) + 16;
      },
      k: function () {},
      n: function (a, b, c) {
        new Da(a).K(b, c);
        'uncaught_exception' in P ? P.G++ : (P.G = 1);
        throw a;
      },
      b: A,
      l: function (a, b, c, d, f) {
        var g = Ea(c);
        b = Q(b);
        V(a, {
          name: b,
          fromWireType: function (k) {
            return !!k;
          },
          toWireType: function (k, h) {
            return h ? d : f;
          },
          argPackAdvance: 8,
          readValueFromPointer: function (k) {
            if (1 === c) var h = H;
            else if (2 === c) h = E;
            else if (4 === c) h = F;
            else throw new TypeError('Unknown boolean type size: ' + b);
            return this.fromWireType(h[k >> g]);
          },
          B: null,
        });
      },
      t: function (a, b) {
        b = Q(b);
        V(a, {
          name: b,
          fromWireType: function (c) {
            var d = W[c].value;
            Pa(c);
            return d;
          },
          toWireType: function (c, d) {
            return X(d);
          },
          argPackAdvance: 8,
          readValueFromPointer: Qa,
          B: null,
        });
      },
      i: function (a, b, c) {
        c = Ea(c);
        b = Q(b);
        V(a, {
          name: b,
          fromWireType: function (d) {
            return d;
          },
          toWireType: function (d, f) {
            if ('number' !== typeof f && 'boolean' !== typeof f)
              throw new TypeError(
                'Cannot convert "' + Ra(f) + '" to ' + this.name,
              );
            return f;
          },
          argPackAdvance: 8,
          readValueFromPointer: Sa(b, c),
          B: null,
        });
      },
      g: function (a, b, c, d, f, g) {
        var k = Xa(b, c);
        a = Q(a);
        f = Za(d, f);
        Wa(
          a,
          function () {
            cb('Cannot call ' + a + ' due to unbound types', k);
          },
          b - 1,
        );
        Na(k, function (h) {
          var p = a,
            m = a;
          h = [h[0], null].concat(h.slice(1));
          var n = f,
            q = h.length;
          2 > q &&
            U(
              "argTypes array size mismatch! Must at least get return value and 'this' types!",
            );
          for (var x = null !== h[1] && !1, C = !1, l = 1; l < h.length; ++l)
            if (null !== h[l] && void 0 === h[l].B) {
              C = !0;
              break;
            }
          var La = 'void' !== h[0].name,
            I = '',
            L = '';
          for (l = 0; l < q - 2; ++l)
            (I += (0 !== l ? ', ' : '') + 'arg' + l),
              (L += (0 !== l ? ', ' : '') + 'arg' + l + 'Wired');
          m =
            'return function ' +
            Ga(m) +
            '(' +
            I +
            ') {\nif (arguments.length !== ' +
            (q - 2) +
            ") {\nthrowBindingError('function " +
            m +
            " called with ' + arguments.length + ' arguments, expected " +
            (q - 2) +
            " args!');\n}\n";
          C && (m += 'var destructors = [];\n');
          var Ma = C ? 'destructors' : 'null';
          I = 'throwBindingError invoker fn runDestructors retType classParam'.split(
            ' ',
          );
          n = [U, n, g, Ua, h[0], h[1]];
          x &&
            (m += 'var thisWired = classParam.toWireType(' + Ma + ', this);\n');
          for (l = 0; l < q - 2; ++l)
            (m +=
              'var arg' +
              l +
              'Wired = argType' +
              l +
              '.toWireType(' +
              Ma +
              ', arg' +
              l +
              '); // ' +
              h[l + 2].name +
              '\n'),
              I.push('argType' + l),
              n.push(h[l + 2]);
          x && (L = 'thisWired' + (0 < L.length ? ', ' : '') + L);
          m +=
            (La ? 'var rv = ' : '') +
            'invoker(fn' +
            (0 < L.length ? ', ' : '') +
            L +
            ');\n';
          if (C) m += 'runDestructors(destructors);\n';
          else
            for (l = x ? 1 : 2; l < h.length; ++l)
              (q = 1 === l ? 'thisWired' : 'arg' + (l - 2) + 'Wired'),
                null !== h[l].B &&
                  ((m += q + '_dtor(' + q + '); // ' + h[l].name + '\n'),
                  I.push(q + '_dtor'),
                  n.push(h[l].B));
          La && (m += 'var ret = retType.fromWireType(rv);\nreturn ret;\n');
          I.push(m + '}\n');
          h = Ta(I).apply(null, n);
          l = b - 1;
          if (!e.hasOwnProperty(p))
            throw new Ka('Replacing nonexistant public symbol');
          void 0 !== e[p].A && void 0 !== l
            ? (e[p].A[l] = h)
            : ((e[p] = h), (e[p].H = l));
          return [];
        });
      },
      d: function (a, b, c, d, f) {
        function g(m) {
          return m;
        }
        b = Q(b);
        -1 === f && (f = 4294967295);
        var k = Ea(c);
        if (0 === d) {
          var h = 32 - 8 * c;
          g = function (m) {
            return (m << h) >>> h;
          };
        }
        var p = -1 != b.indexOf('unsigned');
        V(a, {
          name: b,
          fromWireType: g,
          toWireType: function (m, n) {
            if ('number' !== typeof n && 'boolean' !== typeof n)
              throw new TypeError(
                'Cannot convert "' + Ra(n) + '" to ' + this.name,
              );
            if (n < d || n > f)
              throw new TypeError(
                'Passing a number "' +
                  Ra(n) +
                  '" from JS side to C/C++ side to an argument of type "' +
                  b +
                  '", which is outside the valid range [' +
                  d +
                  ', ' +
                  f +
                  ']!',
              );
            return p ? n >>> 0 : n | 0;
          },
          argPackAdvance: 8,
          readValueFromPointer: db(b, k, 0 !== d),
          B: null,
        });
      },
      c: function (a, b, c) {
        function d(g) {
          g >>= 2;
          var k = J;
          return new f(G, k[g + 1], k[g]);
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
        c = Q(c);
        V(
          a,
          {
            name: c,
            fromWireType: d,
            argPackAdvance: 8,
            readValueFromPointer: d,
          },
          { J: !0 },
        );
      },
      j: function (a, b) {
        b = Q(b);
        var c = 'std::string' === b;
        V(a, {
          name: b,
          fromWireType: function (d) {
            var f = J[d >> 2];
            if (c)
              for (var g = d + 4, k = 0; k <= f; ++k) {
                var h = d + 4 + k;
                if (k == f || 0 == B[h]) {
                  if (g) {
                    for (var p = g + (h - g), m = g; !(m >= p) && B[m]; ) ++m;
                    g = ea.decode(B.subarray(g, m));
                  } else g = '';
                  if (void 0 === n) var n = g;
                  else (n += String.fromCharCode(0)), (n += g);
                  g = h + 1;
                }
              }
            else {
              n = Array(f);
              for (k = 0; k < f; ++k) n[k] = String.fromCharCode(B[d + 4 + k]);
              n = n.join('');
            }
            Y(d);
            return n;
          },
          toWireType: function (d, f) {
            f instanceof ArrayBuffer && (f = new Uint8Array(f));
            var g = 'string' === typeof f;
            g ||
              f instanceof Uint8Array ||
              f instanceof Uint8ClampedArray ||
              f instanceof Int8Array ||
              U('Cannot pass non-string to std::string');
            var k = (c && g
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
              h = jb(4 + k + 1);
            J[h >> 2] = k;
            if (c && g) fa(f, h + 4, k + 1);
            else if (g)
              for (g = 0; g < k; ++g) {
                var p = f.charCodeAt(g);
                255 < p &&
                  (Y(h),
                  U('String has UTF-16 code units that do not fit in 8 bits'));
                B[h + 4 + g] = p;
              }
            else for (g = 0; g < k; ++g) B[h + 4 + g] = f[g];
            null !== d && d.push(Y, h);
            return h;
          },
          argPackAdvance: 8,
          readValueFromPointer: Qa,
          B: function (d) {
            Y(d);
          },
        });
      },
      f: function (a, b, c) {
        c = Q(c);
        if (2 === b) {
          var d = ia;
          var f = ja;
          var g = ka;
          var k = function () {
            return D;
          };
          var h = 1;
        } else
          4 === b &&
            ((d = la),
            (f = ma),
            (g = na),
            (k = function () {
              return J;
            }),
            (h = 2));
        V(a, {
          name: c,
          fromWireType: function (p) {
            for (var m = J[p >> 2], n = k(), q, x = p + 4, C = 0; C <= m; ++C) {
              var l = p + 4 + C * b;
              if (C == m || 0 == n[l >> h])
                (x = d(x, l - x)),
                  void 0 === q
                    ? (q = x)
                    : ((q += String.fromCharCode(0)), (q += x)),
                  (x = l + b);
            }
            Y(p);
            return q;
          },
          toWireType: function (p, m) {
            'string' !== typeof m &&
              U('Cannot pass non-string to C++ string type ' + c);
            var n = g(m),
              q = jb(4 + n + b);
            J[q >> 2] = n >> h;
            f(m, q + 4, n + b);
            null !== p && p.push(Y, q);
            return q;
          },
          argPackAdvance: 8,
          readValueFromPointer: Qa,
          B: function (p) {
            Y(p);
          },
        });
      },
      m: function (a, b) {
        b = Q(b);
        V(a, {
          R: !0,
          name: b,
          argPackAdvance: 0,
          fromWireType: function () {},
          toWireType: function () {},
        });
      },
      q: Pa,
      u: function (a) {
        if (0 === a) return X(fb());
        var b = eb[a];
        a = void 0 === b ? Q(a) : b;
        return X(fb()[a]);
      },
      p: function (a) {
        4 < a && (W[a].F += 1);
      },
      h: function (a, b, c, d) {
        a || U('Cannot use deleted val. handle = ' + a);
        a = W[a].value;
        var f = hb[b];
        if (!f) {
          f = '';
          for (var g = 0; g < b; ++g) f += (0 !== g ? ', ' : '') + 'arg' + g;
          var k =
            'return function emval_allocator_' +
            b +
            '(constructor, argTypes, args) {\n';
          for (g = 0; g < b; ++g)
            k +=
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
            k +
              ('var obj = new constructor(' +
                f +
                ');\nreturn __emval_register(obj);\n}\n'),
          )(gb, e, X);
          hb[b] = f;
        }
        return f(a, c, d);
      },
      s: function () {
        y();
      },
      r: function (a, b, c) {
        B.copyWithin(a, b, b + c);
      },
      e: function (a) {
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
              z.grow((Math.min(2147483648, d) - G.byteLength + 65535) >>> 16);
              qa(z.buffer);
              var f = 1;
              break a;
            } catch (g) {}
            f = void 0;
          }
          if (f) return !0;
        }
        return !1;
      },
      a: z,
    };
    (function () {
      function a(f) {
        e.asm = f.exports;
        K--;
        e.monitorRunDependencies && e.monitorRunDependencies(K);
        0 == K &&
          (null !== xa && (clearInterval(xa), (xa = null)),
          M && ((f = M), (M = null), f()));
      }
      function b(f) {
        a(f.instance);
      }
      function c(f) {
        return Ba()
          .then(function (g) {
            return WebAssembly.instantiate(g, d);
          })
          .then(f, function (g) {
            v('failed to asynchronously prepare wasm: ' + g);
            y(g);
          });
      }
      var d = { a: kb };
      K++;
      e.monitorRunDependencies && e.monitorRunDependencies(K);
      if (e.instantiateWasm)
        try {
          return e.instantiateWasm(d, a);
        } catch (f) {
          return (
            v('Module.instantiateWasm callback failed with error: ' + f), !1
          );
        }
      (function () {
        if (
          w ||
          'function' !== typeof WebAssembly.instantiateStreaming ||
          ya() ||
          'function' !== typeof fetch
        )
          return c(b);
        fetch(N, { credentials: 'same-origin' }).then(function (f) {
          return WebAssembly.instantiateStreaming(f, d).then(b, function (g) {
            v('wasm streaming compile failed: ' + g);
            v('falling back to ArrayBuffer instantiation');
            return c(b);
          });
        });
      })();
      return {};
    })();
    var Ca = (e.___wasm_call_ctors = function () {
        return (Ca = e.___wasm_call_ctors = e.asm.v).apply(null, arguments);
      }),
      jb = (e._malloc = function () {
        return (jb = e._malloc = e.asm.w).apply(null, arguments);
      }),
      Y = (e._free = function () {
        return (Y = e._free = e.asm.x).apply(null, arguments);
      }),
      bb = (e.___getTypeName = function () {
        return (bb = e.___getTypeName = e.asm.y).apply(null, arguments);
      });
    e.___embind_register_native_and_builtin_types = function () {
      return (e.___embind_register_native_and_builtin_types = e.asm.z).apply(
        null,
        arguments,
      );
    };
    var lb;
    M = function mb() {
      lb || nb();
      lb || (M = mb);
    };
    function nb() {
      function a() {
        if (!lb && ((lb = !0), (e.calledRun = !0), !da)) {
          O(ta);
          O(ua);
          aa(e);
          if (e.onRuntimeInitialized) e.onRuntimeInitialized();
          if (e.postRun)
            for (
              'function' == typeof e.postRun && (e.postRun = [e.postRun]);
              e.postRun.length;

            ) {
              var b = e.postRun.shift();
              va.unshift(b);
            }
          O(va);
        }
      }
      if (!(0 < K)) {
        if (e.preRun)
          for (
            'function' == typeof e.preRun && (e.preRun = [e.preRun]);
            e.preRun.length;

          )
            wa();
        O(sa);
        0 < K ||
          (e.setStatus
            ? (e.setStatus('Running...'),
              setTimeout(function () {
                setTimeout(function () {
                  e.setStatus('');
                }, 1);
                a();
              }, 1))
            : a());
      }
    }
    e.run = nb;
    if (e.preInit)
      for (
        'function' == typeof e.preInit && (e.preInit = [e.preInit]);
        0 < e.preInit.length;

      )
        e.preInit.pop()();
    noExitRuntime = !0;
    nb();

    return Module.ready;
  };
})();
export default Module;
