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
    var da = f.print || console.log.bind(console),
      v = f.printErr || console.warn.bind(console);
    for (t in r) r.hasOwnProperty(t) && (f[t] = r[t]);
    r = null;
    var ea = 0,
      w;
    f.wasmBinary && (w = f.wasmBinary);
    var noExitRuntime;
    f.noExitRuntime && (noExitRuntime = f.noExitRuntime);
    'object' !== typeof WebAssembly && x('no native wasm support detected');
    var z,
      A = new WebAssembly.Table({
        initial: 675,
        maximum: 675,
        element: 'anyfunc',
      }),
      fa = !1,
      ha = new TextDecoder('utf8');
    function ia(a, b, c) {
      var d = B;
      if (0 < c) {
        c = b + c - 1;
        for (var e = 0; e < a.length; ++e) {
          var g = a.charCodeAt(e);
          if (55296 <= g && 57343 >= g) {
            var k = a.charCodeAt(++e);
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
    var ja = new TextDecoder('utf-16le');
    function ka(a, b) {
      var c = a >> 1;
      for (b = c + b / 2; !(c >= b) && C[c]; ) ++c;
      return ja.decode(B.subarray(a, c << 1));
    }
    function la(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (2 > c) return 0;
      c -= 2;
      var d = b;
      c = c < 2 * a.length ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) (E[b >> 1] = a.charCodeAt(e)), (b += 2);
      E[b >> 1] = 0;
      return b - d;
    }
    function ma(a) {
      return 2 * a.length;
    }
    function na(a, b) {
      for (var c = 0, d = ''; !(c >= b / 4); ) {
        var e = F[(a + 4 * c) >> 2];
        if (0 == e) break;
        ++c;
        65536 <= e
          ? ((e -= 65536),
            (d += String.fromCharCode(55296 | (e >> 10), 56320 | (e & 1023))))
          : (d += String.fromCharCode(e));
      }
      return d;
    }
    function oa(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (4 > c) return 0;
      var d = b;
      c = d + c - 4;
      for (var e = 0; e < a.length; ++e) {
        var g = a.charCodeAt(e);
        if (55296 <= g && 57343 >= g) {
          var k = a.charCodeAt(++e);
          g = (65536 + ((g & 1023) << 10)) | (k & 1023);
        }
        F[b >> 2] = g;
        b += 4;
        if (b + 4 > c) break;
      }
      F[b >> 2] = 0;
      return b - d;
    }
    function pa(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        55296 <= d && 57343 >= d && ++c;
        b += 4;
      }
      return b;
    }
    var G, H, B, E, C, F, I, qa, ra;
    function sa(a) {
      G = a;
      f.HEAP8 = H = new Int8Array(a);
      f.HEAP16 = E = new Int16Array(a);
      f.HEAP32 = F = new Int32Array(a);
      f.HEAPU8 = B = new Uint8Array(a);
      f.HEAPU16 = C = new Uint16Array(a);
      f.HEAPU32 = I = new Uint32Array(a);
      f.HEAPF32 = qa = new Float32Array(a);
      f.HEAPF64 = ra = new Float64Array(a);
    }
    var ta = f.INITIAL_MEMORY || 16777216;
    f.wasmMemory
      ? (z = f.wasmMemory)
      : (z = new WebAssembly.Memory({ initial: ta / 65536, maximum: 32768 }));
    z && (G = z.buffer);
    ta = G.byteLength;
    sa(G);
    var ua = [],
      va = [],
      wa = [],
      xa = [];
    function ya() {
      var a = f.preRun.shift();
      ua.unshift(a);
    }
    var J = 0,
      za = null,
      K = null;
    f.preloadedImages = {};
    f.preloadedAudios = {};
    function x(a) {
      if (f.onAbort) f.onAbort(a);
      v(a);
      fa = !0;
      a = new WebAssembly.RuntimeError(
        'abort(' + a + '). Build with -s ASSERTIONS=1 for more info.',
      );
      ba(a);
      throw a;
    }
    function Aa() {
      var a = M;
      return String.prototype.startsWith
        ? a.startsWith('data:application/octet-stream;base64,')
        : 0 === a.indexOf('data:application/octet-stream;base64,');
    }
    var M = 'avif_dec.wasm';
    if (!Aa()) {
      var Ba = M;
      M = f.locateFile ? f.locateFile(Ba, u) : u + Ba;
    }
    function Ca() {
      try {
        if (w) return new Uint8Array(w);
        if (ca) return ca(M);
        throw 'both async and sync fetching of the wasm failed';
      } catch (a) {
        x(a);
      }
    }
    function Da() {
      return w || 'function' !== typeof fetch
        ? Promise.resolve().then(Ca)
        : fetch(M, { credentials: 'same-origin' })
            .then(function (a) {
              if (!a.ok) throw "failed to load wasm binary file at '" + M + "'";
              return a.arrayBuffer();
            })
            .catch(function () {
              return Ca();
            });
    }
    va.push({
      Y: function () {
        Ea();
      },
    });
    function N(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ('function' == typeof b) b(f);
        else {
          var c = b.Y;
          'number' === typeof c
            ? void 0 === b.U
              ? A.get(c)()
              : A.get(c)(b.U)
            : c(void 0 === b.U ? null : b.U);
        }
      }
    }
    function Fa(a) {
      this.T = a - 16;
      this.ea = function (b) {
        F[(this.T + 8) >> 2] = b;
      };
      this.ba = function (b) {
        F[(this.T + 0) >> 2] = b;
      };
      this.ca = function () {
        F[(this.T + 4) >> 2] = 0;
      };
      this.aa = function () {
        H[(this.T + 12) >> 0] = 0;
      };
      this.da = function () {
        H[(this.T + 13) >> 0] = 0;
      };
      this.$ = function (b, c) {
        this.ea(b);
        this.ba(c);
        this.ca();
        this.aa();
        this.da();
      };
    }
    function O() {
      return 0 < O.W;
    }
    function Ga(a) {
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
    var Ha = void 0;
    function P(a) {
      for (var b = ''; B[a]; ) b += Ha[B[a++]];
      return b;
    }
    var Q = {},
      S = {},
      Ia = {};
    function Ja(a) {
      if (void 0 === a) return '_unknown';
      a = a.replace(/[^a-zA-Z0-9_]/g, '$');
      var b = a.charCodeAt(0);
      return 48 <= b && 57 >= b ? '_' + a : a;
    }
    function Ka(a, b) {
      a = Ja(a);
      return new Function(
        'body',
        'return function ' +
          a +
          '() {\n    "use strict";    return body.apply(this, arguments);\n};\n',
      )(b);
    }
    function La(a) {
      var b = Error,
        c = Ka(a, function (d) {
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
    var Ma = void 0;
    function T(a) {
      throw new Ma(a);
    }
    var Na = void 0;
    function Oa(a, b) {
      function c(h) {
        h = b(h);
        if (h.length !== d.length)
          throw new Na('Mismatched type converter count');
        for (var p = 0; p < d.length; ++p) U(d[p], h[p]);
      }
      var d = [];
      d.forEach(function (h) {
        Ia[h] = a;
      });
      var e = Array(a.length),
        g = [],
        k = 0;
      a.forEach(function (h, p) {
        S.hasOwnProperty(h)
          ? (e[p] = S[h])
          : (g.push(h),
            Q.hasOwnProperty(h) || (Q[h] = []),
            Q[h].push(function () {
              e[p] = S[h];
              ++k;
              k === g.length && c(e);
            }));
      });
      0 === g.length && c(e);
    }
    function U(a, b, c) {
      c = c || {};
      if (!('argPackAdvance' in b))
        throw new TypeError(
          'registerType registeredInstance requires argPackAdvance',
        );
      var d = b.name;
      a || T('type "' + d + '" must have a positive integer typeid pointer');
      if (S.hasOwnProperty(a)) {
        if (c.Z) return;
        T("Cannot register type '" + d + "' twice");
      }
      S[a] = b;
      delete Ia[a];
      Q.hasOwnProperty(a) &&
        ((b = Q[a]),
        delete Q[a],
        b.forEach(function (e) {
          e();
        }));
    }
    var Pa = [],
      V = [
        {},
        { value: void 0 },
        { value: null },
        { value: !0 },
        { value: !1 },
      ];
    function Sa(a) {
      4 < a && 0 === --V[a].V && ((V[a] = void 0), Pa.push(a));
    }
    function Ta(a) {
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
          var b = Pa.length ? Pa.pop() : V.length;
          V[b] = { V: 1, value: a };
          return b;
      }
    }
    function Ua(a) {
      return this.fromWireType(I[a >> 2]);
    }
    function Va(a) {
      if (null === a) return 'null';
      var b = typeof a;
      return 'object' === b || 'array' === b || 'function' === b
        ? a.toString()
        : '' + a;
    }
    function Wa(a, b) {
      switch (b) {
        case 2:
          return function (c) {
            return this.fromWireType(qa[c >> 2]);
          };
        case 3:
          return function (c) {
            return this.fromWireType(ra[c >> 3]);
          };
        default:
          throw new TypeError('Unknown float type: ' + a);
      }
    }
    function Xa(a) {
      var b = Function;
      if (!(b instanceof Function))
        throw new TypeError(
          'new_ called with constructor type ' +
            typeof b +
            ' which is not a function',
        );
      var c = Ka(b.name || 'unknownFunctionName', function () {});
      c.prototype = b.prototype;
      c = new c();
      a = b.apply(c, a);
      return a instanceof Object ? a : c;
    }
    function Ya(a) {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    }
    function Za(a, b) {
      var c = f;
      if (void 0 === c[a].R) {
        var d = c[a];
        c[a] = function () {
          c[a].R.hasOwnProperty(arguments.length) ||
            T(
              "Function '" +
                b +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ') - expects one of (' +
                c[a].R +
                ')!',
            );
          return c[a].R[arguments.length].apply(this, arguments);
        };
        c[a].R = [];
        c[a].R[d.X] = d;
      }
    }
    function $a(a, b, c) {
      f.hasOwnProperty(a)
        ? ((void 0 === c || (void 0 !== f[a].R && void 0 !== f[a].R[c])) &&
            T("Cannot register public name '" + a + "' twice"),
          Za(a, a),
          f.hasOwnProperty(c) &&
            T(
              'Cannot register multiple overloads of a function with the same number of arguments (' +
                c +
                ')!',
            ),
          (f[a].R[c] = b))
        : ((f[a] = b), void 0 !== c && (f[a].ga = c));
    }
    function ab(a, b) {
      for (var c = [], d = 0; d < a; d++) c.push(F[(b >> 2) + d]);
      return c;
    }
    function bb(a, b) {
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
                ? f['dynCall_' + a].apply(null, [b].concat(c))
                : f['dynCall_' + a].call(null, b))
          : (e = A.get(b).apply(null, c));
        return e;
      };
    }
    function cb(a, b) {
      a = P(a);
      var c = -1 != a.indexOf('j') ? bb(a, b) : A.get(b);
      'function' !== typeof c &&
        T('unknown function pointer with signature ' + a + ': ' + b);
      return c;
    }
    var db = void 0;
    function eb(a) {
      a = fb(a);
      var b = P(a);
      W(a);
      return b;
    }
    function gb(a, b) {
      function c(g) {
        e[g] || S[g] || (Ia[g] ? Ia[g].forEach(c) : (d.push(g), (e[g] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new db(a + ': ' + d.map(eb).join([', ']));
    }
    function hb(a, b, c) {
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
                return C[d >> 1];
              };
        case 2:
          return c
            ? function (d) {
                return F[d >> 2];
              }
            : function (d) {
                return I[d >> 2];
              };
        default:
          throw new TypeError('Unknown integer type: ' + a);
      }
    }
    var ib = {};
    function jb() {
      return 'object' === typeof globalThis
        ? globalThis
        : Function('return this')();
    }
    function kb(a, b) {
      var c = S[a];
      void 0 === c && T(b + ' has unknown type ' + eb(a));
      return c;
    }
    for (
      var lb = {}, mb = [null, [], []], nb = Array(256), ob = 0;
      256 > ob;
      ++ob
    )
      nb[ob] = String.fromCharCode(ob);
    Ha = nb;
    Ma = f.BindingError = La('BindingError');
    Na = f.InternalError = La('InternalError');
    f.count_emval_handles = function () {
      for (var a = 0, b = 5; b < V.length; ++b) void 0 !== V[b] && ++a;
      return a;
    };
    f.get_first_emval = function () {
      for (var a = 5; a < V.length; ++a) if (void 0 !== V[a]) return V[a];
      return null;
    };
    db = f.UnboundTypeError = La('UnboundTypeError');
    var wb = {
      w: function (a) {
        return pb(a + 16) + 16;
      },
      t: function () {},
      v: function (a, b, c) {
        new Fa(a).$(b, c);
        'uncaught_exception' in O ? O.W++ : (O.W = 1);
        throw a;
      },
      b: A,
      F: function (a, b, c, d, e) {
        var g = Ga(c);
        b = P(b);
        U(a, {
          name: b,
          fromWireType: function (k) {
            return !!k;
          },
          toWireType: function (k, h) {
            return h ? d : e;
          },
          argPackAdvance: 8,
          readValueFromPointer: function (k) {
            if (1 === c) var h = H;
            else if (2 === c) h = E;
            else if (4 === c) h = F;
            else throw new TypeError('Unknown boolean type size: ' + b);
            return this.fromWireType(h[k >> g]);
          },
          S: null,
        });
      },
      E: function (a, b) {
        b = P(b);
        U(a, {
          name: b,
          fromWireType: function (c) {
            var d = V[c].value;
            Sa(c);
            return d;
          },
          toWireType: function (c, d) {
            return Ta(d);
          },
          argPackAdvance: 8,
          readValueFromPointer: Ua,
          S: null,
        });
      },
      r: function (a, b, c) {
        c = Ga(c);
        b = P(b);
        U(a, {
          name: b,
          fromWireType: function (d) {
            return d;
          },
          toWireType: function (d, e) {
            if ('number' !== typeof e && 'boolean' !== typeof e)
              throw new TypeError(
                'Cannot convert "' + Va(e) + '" to ' + this.name,
              );
            return e;
          },
          argPackAdvance: 8,
          readValueFromPointer: Wa(b, c),
          S: null,
        });
      },
      x: function (a, b, c, d, e, g) {
        var k = ab(b, c);
        a = P(a);
        e = cb(d, e);
        $a(
          a,
          function () {
            gb('Cannot call ' + a + ' due to unbound types', k);
          },
          b - 1,
        );
        Oa(k, function (h) {
          var p = a,
            l = a;
          h = [h[0], null].concat(h.slice(1));
          var m = e,
            q = h.length;
          2 > q &&
            T(
              "argTypes array size mismatch! Must at least get return value and 'this' types!",
            );
          for (var y = null !== h[1] && !1, D = !1, n = 1; n < h.length; ++n)
            if (null !== h[n] && void 0 === h[n].S) {
              D = !0;
              break;
            }
          var Qa = 'void' !== h[0].name,
            L = '',
            R = '';
          for (n = 0; n < q - 2; ++n)
            (L += (0 !== n ? ', ' : '') + 'arg' + n),
              (R += (0 !== n ? ', ' : '') + 'arg' + n + 'Wired');
          l =
            'return function ' +
            Ja(l) +
            '(' +
            L +
            ') {\nif (arguments.length !== ' +
            (q - 2) +
            ") {\nthrowBindingError('function " +
            l +
            " called with ' + arguments.length + ' arguments, expected " +
            (q - 2) +
            " args!');\n}\n";
          D && (l += 'var destructors = [];\n');
          var Ra = D ? 'destructors' : 'null';
          L = 'throwBindingError invoker fn runDestructors retType classParam'.split(
            ' ',
          );
          m = [T, m, g, Ya, h[0], h[1]];
          y &&
            (l += 'var thisWired = classParam.toWireType(' + Ra + ', this);\n');
          for (n = 0; n < q - 2; ++n)
            (l +=
              'var arg' +
              n +
              'Wired = argType' +
              n +
              '.toWireType(' +
              Ra +
              ', arg' +
              n +
              '); // ' +
              h[n + 2].name +
              '\n'),
              L.push('argType' + n),
              m.push(h[n + 2]);
          y && (R = 'thisWired' + (0 < R.length ? ', ' : '') + R);
          l +=
            (Qa ? 'var rv = ' : '') +
            'invoker(fn' +
            (0 < R.length ? ', ' : '') +
            R +
            ');\n';
          if (D) l += 'runDestructors(destructors);\n';
          else
            for (n = y ? 1 : 2; n < h.length; ++n)
              (q = 1 === n ? 'thisWired' : 'arg' + (n - 2) + 'Wired'),
                null !== h[n].S &&
                  ((l += q + '_dtor(' + q + '); // ' + h[n].name + '\n'),
                  L.push(q + '_dtor'),
                  m.push(h[n].S));
          Qa && (l += 'var ret = retType.fromWireType(rv);\nreturn ret;\n');
          L.push(l + '}\n');
          h = Xa(L).apply(null, m);
          n = b - 1;
          if (!f.hasOwnProperty(p))
            throw new Na('Replacing nonexistant public symbol');
          void 0 !== f[p].R && void 0 !== n
            ? (f[p].R[n] = h)
            : ((f[p] = h), (f[p].X = n));
          return [];
        });
      },
      f: function (a, b, c, d, e) {
        function g(l) {
          return l;
        }
        b = P(b);
        -1 === e && (e = 4294967295);
        var k = Ga(c);
        if (0 === d) {
          var h = 32 - 8 * c;
          g = function (l) {
            return (l << h) >>> h;
          };
        }
        var p = -1 != b.indexOf('unsigned');
        U(a, {
          name: b,
          fromWireType: g,
          toWireType: function (l, m) {
            if ('number' !== typeof m && 'boolean' !== typeof m)
              throw new TypeError(
                'Cannot convert "' + Va(m) + '" to ' + this.name,
              );
            if (m < d || m > e)
              throw new TypeError(
                'Passing a number "' +
                  Va(m) +
                  '" from JS side to C/C++ side to an argument of type "' +
                  b +
                  '", which is outside the valid range [' +
                  d +
                  ', ' +
                  e +
                  ']!',
              );
            return p ? m >>> 0 : m | 0;
          },
          argPackAdvance: 8,
          readValueFromPointer: hb(b, k, 0 !== d),
          S: null,
        });
      },
      e: function (a, b, c) {
        function d(g) {
          g >>= 2;
          var k = I;
          return new e(G, k[g + 1], k[g]);
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
        c = P(c);
        U(
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
      s: function (a, b) {
        b = P(b);
        var c = 'std::string' === b;
        U(a, {
          name: b,
          fromWireType: function (d) {
            var e = I[d >> 2];
            if (c)
              for (var g = d + 4, k = 0; k <= e; ++k) {
                var h = d + 4 + k;
                if (k == e || 0 == B[h]) {
                  if (g) {
                    for (var p = g + (h - g), l = g; !(l >= p) && B[l]; ) ++l;
                    g = ha.decode(B.subarray(g, l));
                  } else g = '';
                  if (void 0 === m) var m = g;
                  else (m += String.fromCharCode(0)), (m += g);
                  g = h + 1;
                }
              }
            else {
              m = Array(e);
              for (k = 0; k < e; ++k) m[k] = String.fromCharCode(B[d + 4 + k]);
              m = m.join('');
            }
            W(d);
            return m;
          },
          toWireType: function (d, e) {
            e instanceof ArrayBuffer && (e = new Uint8Array(e));
            var g = 'string' === typeof e;
            g ||
              e instanceof Uint8Array ||
              e instanceof Uint8ClampedArray ||
              e instanceof Int8Array ||
              T('Cannot pass non-string to std::string');
            var k = (c && g
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
              h = pb(4 + k + 1);
            I[h >> 2] = k;
            if (c && g) ia(e, h + 4, k + 1);
            else if (g)
              for (g = 0; g < k; ++g) {
                var p = e.charCodeAt(g);
                255 < p &&
                  (W(h),
                  T('String has UTF-16 code units that do not fit in 8 bits'));
                B[h + 4 + g] = p;
              }
            else for (g = 0; g < k; ++g) B[h + 4 + g] = e[g];
            null !== d && d.push(W, h);
            return h;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ua,
          S: function (d) {
            W(d);
          },
        });
      },
      l: function (a, b, c) {
        c = P(c);
        if (2 === b) {
          var d = ka;
          var e = la;
          var g = ma;
          var k = function () {
            return C;
          };
          var h = 1;
        } else
          4 === b &&
            ((d = na),
            (e = oa),
            (g = pa),
            (k = function () {
              return I;
            }),
            (h = 2));
        U(a, {
          name: c,
          fromWireType: function (p) {
            for (var l = I[p >> 2], m = k(), q, y = p + 4, D = 0; D <= l; ++D) {
              var n = p + 4 + D * b;
              if (D == l || 0 == m[n >> h])
                (y = d(y, n - y)),
                  void 0 === q
                    ? (q = y)
                    : ((q += String.fromCharCode(0)), (q += y)),
                  (y = n + b);
            }
            W(p);
            return q;
          },
          toWireType: function (p, l) {
            'string' !== typeof l &&
              T('Cannot pass non-string to C++ string type ' + c);
            var m = g(l),
              q = pb(4 + m + b);
            I[q >> 2] = m >> h;
            e(l, q + 4, m + b);
            null !== p && p.push(W, q);
            return q;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ua,
          S: function (p) {
            W(p);
          },
        });
      },
      G: function (a, b) {
        b = P(b);
        U(a, {
          fa: !0,
          name: b,
          argPackAdvance: 0,
          fromWireType: function () {},
          toWireType: function () {},
        });
      },
      p: Sa,
      H: function (a) {
        if (0 === a) return Ta(jb());
        var b = ib[a];
        a = void 0 === b ? P(a) : b;
        return Ta(jb()[a]);
      },
      y: function (a) {
        4 < a && (V[a].V += 1);
      },
      n: function (a, b, c, d) {
        a || T('Cannot use deleted val. handle = ' + a);
        a = V[a].value;
        var e = lb[b];
        if (!e) {
          e = '';
          for (var g = 0; g < b; ++g) e += (0 !== g ? ', ' : '') + 'arg' + g;
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
          e = new Function(
            'requireRegisteredType',
            'Module',
            '__emval_register',
            k +
              ('var obj = new constructor(' +
                e +
                ');\nreturn __emval_register(obj);\n}\n'),
          )(kb, f, Ta);
          lb[b] = e;
        }
        return e(a, c, d);
      },
      m: function () {
        x();
      },
      u: function () {
        v('missing function: aom_codec_av1_cx');
        x(-1);
      },
      g: function (a, b) {
        X(a, b || 1);
        throw 'longjmp';
      },
      C: function (a, b, c) {
        B.copyWithin(a, b, b + c);
      },
      h: function (a) {
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
              sa(z.buffer);
              var e = 1;
              break a;
            } catch (g) {}
            e = void 0;
          }
          if (e) return !0;
        }
        return !1;
      },
      D: function () {
        return 0;
      },
      z: function () {},
      q: function (a, b, c, d) {
        for (var e = 0, g = 0; g < c; g++) {
          for (
            var k = F[(b + 8 * g) >> 2], h = F[(b + (8 * g + 4)) >> 2], p = 0;
            p < h;
            p++
          ) {
            var l = B[k + p],
              m = mb[a];
            if (0 === l || 10 === l) {
              for (l = 0; m[l] && !(NaN <= l); ) ++l;
              l = ha.decode(
                m.subarray ? m.subarray(0, l) : new Uint8Array(m.slice(0, l)),
              );
              (1 === a ? da : v)(l);
              m.length = 0;
            } else m.push(l);
          }
          e += h;
        }
        F[d >> 2] = e;
        return 0;
      },
      c: function () {
        return ea | 0;
      },
      j: qb,
      A: rb,
      B: sb,
      i: tb,
      o: ub,
      k: vb,
      a: z,
      d: function (a) {
        ea = a | 0;
      },
    };
    (function () {
      function a(e) {
        f.asm = e.exports;
        J--;
        f.monitorRunDependencies && f.monitorRunDependencies(J);
        0 == J &&
          (null !== za && (clearInterval(za), (za = null)),
          K && ((e = K), (K = null), e()));
      }
      function b(e) {
        a(e.instance);
      }
      function c(e) {
        return Da()
          .then(function (g) {
            return WebAssembly.instantiate(g, d);
          })
          .then(e, function (g) {
            v('failed to asynchronously prepare wasm: ' + g);
            x(g);
          });
      }
      var d = { a: wb };
      J++;
      f.monitorRunDependencies && f.monitorRunDependencies(J);
      if (f.instantiateWasm)
        try {
          return f.instantiateWasm(d, a);
        } catch (e) {
          return (
            v('Module.instantiateWasm callback failed with error: ' + e), !1
          );
        }
      (function () {
        if (
          w ||
          'function' !== typeof WebAssembly.instantiateStreaming ||
          Aa() ||
          'function' !== typeof fetch
        )
          return c(b);
        fetch(M, { credentials: 'same-origin' }).then(function (e) {
          return WebAssembly.instantiateStreaming(e, d).then(b, function (g) {
            v('wasm streaming compile failed: ' + g);
            v('falling back to ArrayBuffer instantiation');
            return c(b);
          });
        });
      })();
      return {};
    })();
    var Ea = (f.___wasm_call_ctors = function () {
        return (Ea = f.___wasm_call_ctors = f.asm.I).apply(null, arguments);
      }),
      pb = (f._malloc = function () {
        return (pb = f._malloc = f.asm.J).apply(null, arguments);
      }),
      W = (f._free = function () {
        return (W = f._free = f.asm.K).apply(null, arguments);
      }),
      fb = (f.___getTypeName = function () {
        return (fb = f.___getTypeName = f.asm.L).apply(null, arguments);
      });
    f.___embind_register_native_and_builtin_types = function () {
      return (f.___embind_register_native_and_builtin_types = f.asm.M).apply(
        null,
        arguments,
      );
    };
    var X = (f._setThrew = function () {
        return (X = f._setThrew = f.asm.N).apply(null, arguments);
      }),
      Y = (f.stackSave = function () {
        return (Y = f.stackSave = f.asm.O).apply(null, arguments);
      }),
      Z = (f.stackRestore = function () {
        return (Z = f.stackRestore = f.asm.P).apply(null, arguments);
      });
    f.dynCall_jiji = function () {
      return (f.dynCall_jiji = f.asm.Q).apply(null, arguments);
    };
    function ub(a, b, c) {
      var d = Y();
      try {
        A.get(a)(b, c);
      } catch (e) {
        Z(d);
        if (e !== e + 0 && 'longjmp' !== e) throw e;
        X(1, 0);
      }
    }
    function vb(a, b, c, d, e) {
      var g = Y();
      try {
        A.get(a)(b, c, d, e);
      } catch (k) {
        Z(g);
        if (k !== k + 0 && 'longjmp' !== k) throw k;
        X(1, 0);
      }
    }
    function qb(a, b, c) {
      var d = Y();
      try {
        return A.get(a)(b, c);
      } catch (e) {
        Z(d);
        if (e !== e + 0 && 'longjmp' !== e) throw e;
        X(1, 0);
      }
    }
    function tb(a, b) {
      var c = Y();
      try {
        A.get(a)(b);
      } catch (d) {
        Z(c);
        if (d !== d + 0 && 'longjmp' !== d) throw d;
        X(1, 0);
      }
    }
    function sb(a) {
      var b = Y();
      try {
        A.get(a)();
      } catch (c) {
        Z(b);
        if (c !== c + 0 && 'longjmp' !== c) throw c;
        X(1, 0);
      }
    }
    function rb(a, b, c, d, e) {
      var g = Y();
      try {
        return A.get(a)(b, c, d, e);
      } catch (k) {
        Z(g);
        if (k !== k + 0 && 'longjmp' !== k) throw k;
        X(1, 0);
      }
    }
    var xb;
    K = function yb() {
      xb || zb();
      xb || (K = yb);
    };
    function zb() {
      function a() {
        if (!xb && ((xb = !0), (f.calledRun = !0), !fa)) {
          N(va);
          N(wa);
          aa(f);
          if (f.onRuntimeInitialized) f.onRuntimeInitialized();
          if (f.postRun)
            for (
              'function' == typeof f.postRun && (f.postRun = [f.postRun]);
              f.postRun.length;

            ) {
              var b = f.postRun.shift();
              xa.unshift(b);
            }
          N(xa);
        }
      }
      if (!(0 < J)) {
        if (f.preRun)
          for (
            'function' == typeof f.preRun && (f.preRun = [f.preRun]);
            f.preRun.length;

          )
            ya();
        N(ua);
        0 < J ||
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
    f.run = zb;
    if (f.preInit)
      for (
        'function' == typeof f.preInit && (f.preInit = [f.preInit]);
        0 < f.preInit.length;

      )
        f.preInit.pop()();
    noExitRuntime = !0;
    zb();

    return Module.ready;
  };
})();
export default Module;
