var wp2_enc = (function () {
  var _scriptDir = import.meta.url;

  return function (wp2_enc) {
    wp2_enc = wp2_enc || {};

    var f;
    f || (f = typeof wp2_enc !== 'undefined' ? wp2_enc : {});
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
    var w;
    f.wasmBinary && (w = f.wasmBinary);
    var noExitRuntime;
    f.noExitRuntime && (noExitRuntime = f.noExitRuntime);
    'object' !== typeof WebAssembly && A('no native wasm support detected');
    var B,
      ea = !1,
      fa = new TextDecoder('utf8');
    function C(a, b) {
      if (!a) return '';
      b = a + b;
      for (var c = a; !(c >= b) && D[c]; ) ++c;
      return fa.decode(D.subarray(a, c));
    }
    function ia(a, b, c) {
      var d = D;
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
    var ja = new TextDecoder('utf-16le');
    function ka(a, b) {
      var c = a >> 1;
      for (b = c + b / 2; !(c >= b) && E[c]; ) ++c;
      return ja.decode(D.subarray(a, c << 1));
    }
    function la(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (2 > c) return 0;
      c -= 2;
      var d = b;
      c = c < 2 * a.length ? c / 2 : a.length;
      for (var e = 0; e < c; ++e) (G[b >> 1] = a.charCodeAt(e)), (b += 2);
      G[b >> 1] = 0;
      return b - d;
    }
    function ma(a) {
      return 2 * a.length;
    }
    function na(a, b) {
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
    function oa(a, b, c) {
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
        H[b >> 2] = g;
        b += 4;
        if (b + 4 > c) break;
      }
      H[b >> 2] = 0;
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
    var I, J, D, G, E, H, K, qa, ra;
    function sa(a) {
      I = a;
      f.HEAP8 = J = new Int8Array(a);
      f.HEAP16 = G = new Int16Array(a);
      f.HEAP32 = H = new Int32Array(a);
      f.HEAPU8 = D = new Uint8Array(a);
      f.HEAPU16 = E = new Uint16Array(a);
      f.HEAPU32 = K = new Uint32Array(a);
      f.HEAPF32 = qa = new Float32Array(a);
      f.HEAPF64 = ra = new Float64Array(a);
    }
    var ta = f.INITIAL_MEMORY || 16777216;
    f.wasmMemory
      ? (B = f.wasmMemory)
      : (B = new WebAssembly.Memory({ initial: ta / 65536, maximum: 32768 }));
    B && (I = B.buffer);
    ta = I.byteLength;
    sa(I);
    var L,
      ua = [],
      va = [],
      wa = [],
      xa = [];
    function ya() {
      var a = f.preRun.shift();
      ua.unshift(a);
    }
    var M = 0,
      za = null,
      N = null;
    f.preloadedImages = {};
    f.preloadedAudios = {};
    function A(a) {
      if (f.onAbort) f.onAbort(a);
      v(a);
      ea = !0;
      a = new WebAssembly.RuntimeError(
        'abort(' + a + '). Build with -s ASSERTIONS=1 for more info.',
      );
      ba(a);
      throw a;
    }
    function Aa() {
      var a = O;
      return String.prototype.startsWith
        ? a.startsWith('data:application/octet-stream;base64,')
        : 0 === a.indexOf('data:application/octet-stream;base64,');
    }
    var O = 'wp2_enc.wasm';
    if (!Aa()) {
      var Ba = O;
      O = f.locateFile ? f.locateFile(Ba, u) : u + Ba;
    }
    function Ca() {
      try {
        if (w) return new Uint8Array(w);
        if (ca) return ca(O);
        throw 'both async and sync fetching of the wasm failed';
      } catch (a) {
        A(a);
      }
    }
    function Da() {
      return w || 'function' !== typeof fetch
        ? Promise.resolve().then(Ca)
        : fetch(O, { credentials: 'same-origin' })
            .then(function (a) {
              if (!a.ok) throw "failed to load wasm binary file at '" + O + "'";
              return a.arrayBuffer();
            })
            .catch(function () {
              return Ca();
            });
    }
    function P(a) {
      for (; 0 < a.length; ) {
        var b = a.shift();
        if ('function' == typeof b) b(f);
        else {
          var c = b.Y;
          'number' === typeof c
            ? void 0 === b.S
              ? L.get(c)()
              : L.get(c)(b.S)
            : c(void 0 === b.S ? null : b.S);
        }
      }
    }
    function Ea(a) {
      this.R = a - 16;
      this.ja = function (b) {
        H[(this.R + 8) >> 2] = b;
      };
      this.ga = function (b) {
        H[(this.R + 0) >> 2] = b;
      };
      this.ha = function () {
        H[(this.R + 4) >> 2] = 0;
      };
      this.fa = function () {
        J[(this.R + 12) >> 0] = 0;
      };
      this.ia = function () {
        J[(this.R + 13) >> 0] = 0;
      };
      this.ca = function (b, c) {
        this.ja(b);
        this.ga(c);
        this.ha();
        this.fa();
        this.ia();
      };
    }
    function Q() {
      return 0 < Q.V;
    }
    var Fa = {};
    function Ga(a) {
      for (; a.length; ) {
        var b = a.pop();
        a.pop()(b);
      }
    }
    function Ha(a) {
      return this.fromWireType(K[a >> 2]);
    }
    var R = {},
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
    function Na(a, b, c) {
      function d(h) {
        h = c(h);
        if (h.length !== a.length)
          throw new Ma('Mismatched type converter count');
        for (var k = 0; k < a.length; ++k) T(a[k], h[k]);
      }
      a.forEach(function (h) {
        Ia[h] = b;
      });
      var e = Array(b.length),
        g = [],
        m = 0;
      b.forEach(function (h, k) {
        S.hasOwnProperty(h)
          ? (e[k] = S[h])
          : (g.push(h),
            R.hasOwnProperty(h) || (R[h] = []),
            R[h].push(function () {
              e[k] = S[h];
              ++m;
              m === g.length && d(e);
            }));
      });
      0 === g.length && d(e);
    }
    function Oa(a) {
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
    var Pa = void 0;
    function U(a) {
      for (var b = ''; D[a]; ) b += Pa[D[a++]];
      return b;
    }
    var Qa = void 0;
    function W(a) {
      throw new Qa(a);
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
        if (c.ba) return;
        W("Cannot register type '" + d + "' twice");
      }
      S[a] = b;
      delete Ia[a];
      R.hasOwnProperty(a) &&
        ((b = R[a]),
        delete R[a],
        b.forEach(function (e) {
          e();
        }));
    }
    var Ra = [],
      X = [
        {},
        { value: void 0 },
        { value: null },
        { value: !0 },
        { value: !1 },
      ];
    function Sa(a) {
      4 < a && 0 === --X[a].T && ((X[a] = void 0), Ra.push(a));
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
          var b = Ra.length ? Ra.pop() : X.length;
          X[b] = { T: 1, value: a };
          return b;
      }
    }
    function Ua(a) {
      if (null === a) return 'null';
      var b = typeof a;
      return 'object' === b || 'array' === b || 'function' === b
        ? a.toString()
        : '' + a;
    }
    function Va(a, b) {
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
    function Wa(a) {
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
    function Xa(a, b) {
      var c = f;
      if (void 0 === c[a].O) {
        var d = c[a];
        c[a] = function () {
          c[a].O.hasOwnProperty(arguments.length) ||
            W(
              "Function '" +
                b +
                "' called with an invalid number of arguments (" +
                arguments.length +
                ') - expects one of (' +
                c[a].O +
                ')!',
            );
          return c[a].O[arguments.length].apply(this, arguments);
        };
        c[a].O = [];
        c[a].O[d.W] = d;
      }
    }
    function Ya(a, b, c) {
      f.hasOwnProperty(a)
        ? ((void 0 === c || (void 0 !== f[a].O && void 0 !== f[a].O[c])) &&
            W("Cannot register public name '" + a + "' twice"),
          Xa(a, a),
          f.hasOwnProperty(c) &&
            W(
              'Cannot register multiple overloads of a function with the same number of arguments (' +
                c +
                ')!',
            ),
          (f[a].O[c] = b))
        : ((f[a] = b), void 0 !== c && (f[a].oa = c));
    }
    function Za(a, b) {
      for (var c = [], d = 0; d < a; d++) c.push(H[(b >> 2) + d]);
      return c;
    }
    function $a(a, b) {
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
          : (e = L.get(b).apply(null, c));
        return e;
      };
    }
    function Y(a, b) {
      a = U(a);
      var c = -1 != a.indexOf('j') ? $a(a, b) : L.get(b);
      'function' !== typeof c &&
        W('unknown function pointer with signature ' + a + ': ' + b);
      return c;
    }
    var ab = void 0;
    function bb(a) {
      a = cb(a);
      var b = U(a);
      Z(a);
      return b;
    }
    function db(a, b) {
      function c(g) {
        e[g] || S[g] || (Ia[g] ? Ia[g].forEach(c) : (d.push(g), (e[g] = !0)));
      }
      var d = [],
        e = {};
      b.forEach(c);
      throw new ab(a + ': ' + d.map(bb).join([', ']));
    }
    function eb(a, b, c) {
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
    var fb = {};
    function gb() {
      return 'object' === typeof globalThis
        ? globalThis
        : Function('return this')();
    }
    function hb(a, b) {
      var c = S[a];
      void 0 === c && W(b + ' has unknown type ' + bb(a));
      return c;
    }
    var ib = {},
      jb = [null, [], []];
    Ma = f.InternalError = La('InternalError');
    for (var kb = Array(256), lb = 0; 256 > lb; ++lb)
      kb[lb] = String.fromCharCode(lb);
    Pa = kb;
    Qa = f.BindingError = La('BindingError');
    f.count_emval_handles = function () {
      for (var a = 0, b = 5; b < X.length; ++b) void 0 !== X[b] && ++a;
      return a;
    };
    f.get_first_emval = function () {
      for (var a = 5; a < X.length; ++a) if (void 0 !== X[a]) return X[a];
      return null;
    };
    ab = f.UnboundTypeError = La('UnboundTypeError');
    va.push({
      Y: function () {
        mb();
      },
    });
    var ob = {
      t: function (a, b, c, d) {
        A(
          'Assertion failed: ' +
            C(a) +
            ', at: ' +
            [b ? C(b) : 'unknown filename', c, d ? C(d) : 'unknown function'],
        );
      },
      A: function (a) {
        return nb(a + 16) + 16;
      },
      G: function () {},
      z: function (a, b, c) {
        new Ea(a).ca(b, c);
        'uncaught_exception' in Q ? Q.V++ : (Q.V = 1);
        throw a;
      },
      o: function (a) {
        var b = Fa[a];
        delete Fa[a];
        var c = b.da,
          d = b.ea,
          e = b.U,
          g = e
            .map(function (m) {
              return m.aa;
            })
            .concat(
              e.map(function (m) {
                return m.la;
              }),
            );
        Na([a], g, function (m) {
          var h = {};
          e.forEach(function (k, l) {
            var n = m[l],
              q = k.Z,
              x = k.$,
              y = m[l + e.length],
              p = k.ka,
              ha = k.ma;
            h[k.X] = {
              read: function (z) {
                return n.fromWireType(q(x, z));
              },
              write: function (z, F) {
                var V = [];
                p(ha, z, y.toWireType(V, F));
                Ga(V);
              },
            };
          });
          return [
            {
              name: b.name,
              fromWireType: function (k) {
                var l = {},
                  n;
                for (n in h) l[n] = h[n].read(k);
                d(k);
                return l;
              },
              toWireType: function (k, l) {
                for (var n in h)
                  if (!(n in l))
                    throw new TypeError('Missing field:  "' + n + '"');
                var q = c();
                for (n in h) h[n].write(q, l[n]);
                null !== k && k.push(d, q);
                return q;
              },
              argPackAdvance: 8,
              readValueFromPointer: Ha,
              P: d,
            },
          ];
        });
      },
      x: function (a, b, c, d, e) {
        var g = Oa(c);
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
            return this.fromWireType(h[m >> g]);
          },
          P: null,
        });
      },
      w: function (a, b) {
        b = U(b);
        T(a, {
          name: b,
          fromWireType: function (c) {
            var d = X[c].value;
            Sa(c);
            return d;
          },
          toWireType: function (c, d) {
            return Ta(d);
          },
          argPackAdvance: 8,
          readValueFromPointer: Ha,
          P: null,
        });
      },
      i: function (a, b, c) {
        c = Oa(c);
        b = U(b);
        T(a, {
          name: b,
          fromWireType: function (d) {
            return d;
          },
          toWireType: function (d, e) {
            if ('number' !== typeof e && 'boolean' !== typeof e)
              throw new TypeError(
                'Cannot convert "' + Ua(e) + '" to ' + this.name,
              );
            return e;
          },
          argPackAdvance: 8,
          readValueFromPointer: Va(b, c),
          P: null,
        });
      },
      n: function (a, b, c, d, e, g) {
        var m = Za(b, c);
        a = U(a);
        e = Y(d, e);
        Ya(
          a,
          function () {
            db('Cannot call ' + a + ' due to unbound types', m);
          },
          b - 1,
        );
        Na([], m, function (h) {
          var k = a,
            l = a;
          h = [h[0], null].concat(h.slice(1));
          var n = e,
            q = h.length;
          2 > q &&
            W(
              "argTypes array size mismatch! Must at least get return value and 'this' types!",
            );
          for (var x = null !== h[1] && !1, y = !1, p = 1; p < h.length; ++p)
            if (null !== h[p] && void 0 === h[p].P) {
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
            Ja(l) +
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
          var V = y ? 'destructors' : 'null';
          z = 'throwBindingError invoker fn runDestructors retType classParam'.split(
            ' ',
          );
          n = [W, n, g, Ga, h[0], h[1]];
          x &&
            (l += 'var thisWired = classParam.toWireType(' + V + ', this);\n');
          for (p = 0; p < q - 2; ++p)
            (l +=
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
              n.push(h[p + 2]);
          x && (F = 'thisWired' + (0 < F.length ? ', ' : '') + F);
          l +=
            (ha ? 'var rv = ' : '') +
            'invoker(fn' +
            (0 < F.length ? ', ' : '') +
            F +
            ');\n';
          if (y) l += 'runDestructors(destructors);\n';
          else
            for (p = x ? 1 : 2; p < h.length; ++p)
              (q = 1 === p ? 'thisWired' : 'arg' + (p - 2) + 'Wired'),
                null !== h[p].P &&
                  ((l += q + '_dtor(' + q + '); // ' + h[p].name + '\n'),
                  z.push(q + '_dtor'),
                  n.push(h[p].P));
          ha && (l += 'var ret = retType.fromWireType(rv);\nreturn ret;\n');
          z.push(l + '}\n');
          h = Wa(z).apply(null, n);
          p = b - 1;
          if (!f.hasOwnProperty(k))
            throw new Ma('Replacing nonexistant public symbol');
          void 0 !== f[k].O && void 0 !== p
            ? (f[k].O[p] = h)
            : ((f[k] = h), (f[k].W = p));
          return [];
        });
      },
      c: function (a, b, c, d, e) {
        function g(l) {
          return l;
        }
        b = U(b);
        -1 === e && (e = 4294967295);
        var m = Oa(c);
        if (0 === d) {
          var h = 32 - 8 * c;
          g = function (l) {
            return (l << h) >>> h;
          };
        }
        var k = -1 != b.indexOf('unsigned');
        T(a, {
          name: b,
          fromWireType: g,
          toWireType: function (l, n) {
            if ('number' !== typeof n && 'boolean' !== typeof n)
              throw new TypeError(
                'Cannot convert "' + Ua(n) + '" to ' + this.name,
              );
            if (n < d || n > e)
              throw new TypeError(
                'Passing a number "' +
                  Ua(n) +
                  '" from JS side to C/C++ side to an argument of type "' +
                  b +
                  '", which is outside the valid range [' +
                  d +
                  ', ' +
                  e +
                  ']!',
              );
            return k ? n >>> 0 : n | 0;
          },
          argPackAdvance: 8,
          readValueFromPointer: eb(b, m, 0 !== d),
          P: null,
        });
      },
      b: function (a, b, c) {
        function d(g) {
          g >>= 2;
          var m = K;
          return new e(I, m[g + 1], m[g]);
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
          { ba: !0 },
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
              for (var g = d + 4, m = 0; m <= e; ++m) {
                var h = d + 4 + m;
                if (m == e || 0 == D[h]) {
                  g = C(g, h - g);
                  if (void 0 === k) var k = g;
                  else (k += String.fromCharCode(0)), (k += g);
                  g = h + 1;
                }
              }
            else {
              k = Array(e);
              for (m = 0; m < e; ++m) k[m] = String.fromCharCode(D[d + 4 + m]);
              k = k.join('');
            }
            Z(d);
            return k;
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
                    for (var l = 0, n = 0; n < e.length; ++n) {
                      var q = e.charCodeAt(n);
                      55296 <= q &&
                        57343 >= q &&
                        (q =
                          (65536 + ((q & 1023) << 10)) |
                          (e.charCodeAt(++n) & 1023));
                      127 >= q
                        ? ++l
                        : (l = 2047 >= q ? l + 2 : 65535 >= q ? l + 3 : l + 4);
                    }
                    return l;
                  }
                : function () {
                    return e.length;
                  })(),
              h = nb(4 + m + 1);
            K[h >> 2] = m;
            if (c && g) ia(e, h + 4, m + 1);
            else if (g)
              for (g = 0; g < m; ++g) {
                var k = e.charCodeAt(g);
                255 < k &&
                  (Z(h),
                  W('String has UTF-16 code units that do not fit in 8 bits'));
                D[h + 4 + g] = k;
              }
            else for (g = 0; g < m; ++g) D[h + 4 + g] = e[g];
            null !== d && d.push(Z, h);
            return h;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ha,
          P: function (d) {
            Z(d);
          },
        });
      },
      f: function (a, b, c) {
        c = U(c);
        if (2 === b) {
          var d = ka;
          var e = la;
          var g = ma;
          var m = function () {
            return E;
          };
          var h = 1;
        } else
          4 === b &&
            ((d = na),
            (e = oa),
            (g = pa),
            (m = function () {
              return K;
            }),
            (h = 2));
        T(a, {
          name: c,
          fromWireType: function (k) {
            for (var l = K[k >> 2], n = m(), q, x = k + 4, y = 0; y <= l; ++y) {
              var p = k + 4 + y * b;
              if (y == l || 0 == n[p >> h])
                (x = d(x, p - x)),
                  void 0 === q
                    ? (q = x)
                    : ((q += String.fromCharCode(0)), (q += x)),
                  (x = p + b);
            }
            Z(k);
            return q;
          },
          toWireType: function (k, l) {
            'string' !== typeof l &&
              W('Cannot pass non-string to C++ string type ' + c);
            var n = g(l),
              q = nb(4 + n + b);
            K[q >> 2] = n >> h;
            e(l, q + 4, n + b);
            null !== k && k.push(Z, q);
            return q;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ha,
          P: function (k) {
            Z(k);
          },
        });
      },
      p: function (a, b, c, d, e, g) {
        Fa[a] = { name: U(b), da: Y(c, d), ea: Y(e, g), U: [] };
      },
      e: function (a, b, c, d, e, g, m, h, k, l) {
        Fa[a].U.push({
          X: U(b),
          aa: c,
          Z: Y(d, e),
          $: g,
          la: m,
          ka: Y(h, k),
          ma: l,
        });
      },
      y: function (a, b) {
        b = U(b);
        T(a, {
          na: !0,
          name: b,
          argPackAdvance: 0,
          fromWireType: function () {},
          toWireType: function () {},
        });
      },
      j: Sa,
      F: function (a) {
        if (0 === a) return Ta(gb());
        var b = fb[a];
        a = void 0 === b ? U(a) : b;
        return Ta(gb()[a]);
      },
      m: function (a) {
        4 < a && (X[a].T += 1);
      },
      q: function (a, b, c, d) {
        a || W('Cannot use deleted val. handle = ' + a);
        a = X[a].value;
        var e = ib[b];
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
          )(hb, f, Ta);
          ib[b] = e;
        }
        return e(a, c, d);
      },
      g: function () {
        A();
      },
      u: function (a, b, c) {
        D.copyWithin(a, b, b + c);
      },
      d: function (a) {
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
              sa(B.buffer);
              var e = 1;
              break a;
            } catch (g) {}
            e = void 0;
          }
          if (e) return !0;
        }
        return !1;
      },
      v: function () {
        return 0;
      },
      r: function () {},
      h: function (a, b, c, d) {
        for (var e = 0, g = 0; g < c; g++) {
          for (
            var m = H[(b + 8 * g) >> 2], h = H[(b + (8 * g + 4)) >> 2], k = 0;
            k < h;
            k++
          ) {
            var l = D[m + k],
              n = jb[a];
            if (0 === l || 10 === l) {
              for (l = 0; n[l] && !(NaN <= l); ) ++l;
              l = fa.decode(
                n.subarray ? n.subarray(0, l) : new Uint8Array(n.slice(0, l)),
              );
              (1 === a ? da : v)(l);
              n.length = 0;
            } else n.push(l);
          }
          e += h;
        }
        H[d >> 2] = e;
        return 0;
      },
      a: B,
      l: function () {
        return 0;
      },
      E: function () {
        return 0;
      },
      D: function () {},
      C: function () {
        return 6;
      },
      B: function () {},
      s: function () {},
    };
    (function () {
      function a(e) {
        f.asm = e.exports;
        L = f.asm.H;
        M--;
        f.monitorRunDependencies && f.monitorRunDependencies(M);
        0 == M &&
          (null !== za && (clearInterval(za), (za = null)),
          N && ((e = N), (N = null), e()));
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
            A(g);
          });
      }
      var d = { a: ob };
      M++;
      f.monitorRunDependencies && f.monitorRunDependencies(M);
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
          Aa() ||
          'function' !== typeof fetch
          ? c(b)
          : fetch(O, { credentials: 'same-origin' }).then(function (e) {
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
    var mb = (f.___wasm_call_ctors = function () {
        return (mb = f.___wasm_call_ctors = f.asm.I).apply(null, arguments);
      }),
      nb = (f._malloc = function () {
        return (nb = f._malloc = f.asm.J).apply(null, arguments);
      }),
      Z = (f._free = function () {
        return (Z = f._free = f.asm.K).apply(null, arguments);
      }),
      cb = (f.___getTypeName = function () {
        return (cb = f.___getTypeName = f.asm.L).apply(null, arguments);
      });
    f.___embind_register_native_and_builtin_types = function () {
      return (f.___embind_register_native_and_builtin_types = f.asm.M).apply(
        null,
        arguments,
      );
    };
    f.dynCall_jiji = function () {
      return (f.dynCall_jiji = f.asm.N).apply(null, arguments);
    };
    var pb;
    N = function qb() {
      pb || rb();
      pb || (N = qb);
    };
    function rb() {
      function a() {
        if (!pb && ((pb = !0), (f.calledRun = !0), !ea)) {
          P(va);
          P(wa);
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
          P(xa);
        }
      }
      if (!(0 < M)) {
        if (f.preRun)
          for (
            'function' == typeof f.preRun && (f.preRun = [f.preRun]);
            f.preRun.length;

          )
            ya();
        P(ua);
        0 < M ||
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
    f.run = rb;
    if (f.preInit)
      for (
        'function' == typeof f.preInit && (f.preInit = [f.preInit]);
        0 < f.preInit.length;

      )
        f.preInit.pop()();
    noExitRuntime = !0;
    rb();

    return wp2_enc.ready;
  };
})();
export default wp2_enc;
