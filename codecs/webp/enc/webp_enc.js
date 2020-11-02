
var webp_enc = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return (
function(webp_enc) {
  webp_enc = webp_enc || {};


var d;d||(d=typeof webp_enc !== 'undefined' ? webp_enc : {});var aa,ba;d.ready=new Promise(function(a,b){aa=a;ba=b});var r={},u;for(u in d)d.hasOwnProperty(u)&&(r[u]=d[u]);var w=!1,x=!1,ca=!1,da=!1;w="object"===typeof window;x="function"===typeof importScripts;ca="object"===typeof process&&"object"===typeof process.versions&&"string"===typeof process.versions.node;da=!w&&!ca&&!x;var y="",A,B,ea,fa;
if(ca)y=x?require("path").dirname(y)+"/":__dirname+"/",A=function(a,b){ea||(ea=require("fs"));fa||(fa=require("path"));a=fa.normalize(a);return ea.readFileSync(a,b?null:"utf8")},B=function(a){a=A(a,!0);a.buffer||(a=new Uint8Array(a));a.buffer||C("Assertion failed: undefined");return a},1<process.argv.length&&process.argv[1].replace(/\\/g,"/"),process.argv.slice(2),process.on("uncaughtException",function(a){throw a;}),process.on("unhandledRejection",C),d.inspect=function(){return"[Emscripten Module object]"};
else if(da)"undefined"!=typeof read&&(A=function(a){return read(a)}),B=function(a){if("function"===typeof readbuffer)return new Uint8Array(readbuffer(a));a=read(a,"binary");"object"===typeof a||C("Assertion failed: undefined");return a},"undefined"!==typeof print&&("undefined"===typeof console&&(console={}),console.log=print,console.warn=console.error="undefined"!==typeof printErr?printErr:print);else if(w||x)x?y=self.location.href:document.currentScript&&(y=document.currentScript.src),_scriptDir&&
(y=_scriptDir),0!==y.indexOf("blob:")?y=y.substr(0,y.lastIndexOf("/")+1):y="",A=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.send(null);return b.responseText},x&&(B=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)});d.print||console.log.bind(console);var D=d.printErr||console.warn.bind(console);for(u in r)r.hasOwnProperty(u)&&(d[u]=r[u]);r=null;var E;d.wasmBinary&&(E=d.wasmBinary);var noExitRuntime;
d.noExitRuntime&&(noExitRuntime=d.noExitRuntime);"object"!==typeof WebAssembly&&C("no native wasm support detected");var G,ha=new WebAssembly.Table({initial:114,maximum:114,element:"anyfunc"}),ja=!1,ka="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0;
function la(a,b,c){var e=H;if(0<c){c=b+c-1;for(var f=0;f<a.length;++f){var g=a.charCodeAt(f);if(55296<=g&&57343>=g){var l=a.charCodeAt(++f);g=65536+((g&1023)<<10)|l&1023}if(127>=g){if(b>=c)break;e[b++]=g}else{if(2047>=g){if(b+1>=c)break;e[b++]=192|g>>6}else{if(65535>=g){if(b+2>=c)break;e[b++]=224|g>>12}else{if(b+3>=c)break;e[b++]=240|g>>18;e[b++]=128|g>>12&63}e[b++]=128|g>>6&63}e[b++]=128|g&63}}e[b]=0}}var ma="undefined"!==typeof TextDecoder?new TextDecoder("utf-16le"):void 0;
function na(a,b){var c=a>>1;for(var e=c+b/2;!(c>=e)&&I[c];)++c;c<<=1;if(32<c-a&&ma)return ma.decode(H.subarray(a,c));c=0;for(e="";;){var f=J[a+2*c>>1];if(0==f||c==b/2)return e;++c;e+=String.fromCharCode(f)}}function oa(a,b,c){void 0===c&&(c=2147483647);if(2>c)return 0;c-=2;var e=b;c=c<2*a.length?c/2:a.length;for(var f=0;f<c;++f)J[b>>1]=a.charCodeAt(f),b+=2;J[b>>1]=0;return b-e}function pa(a){return 2*a.length}
function qa(a,b){for(var c=0,e="";!(c>=b/4);){var f=K[a+4*c>>2];if(0==f)break;++c;65536<=f?(f-=65536,e+=String.fromCharCode(55296|f>>10,56320|f&1023)):e+=String.fromCharCode(f)}return e}function ra(a,b,c){void 0===c&&(c=2147483647);if(4>c)return 0;var e=b;c=e+c-4;for(var f=0;f<a.length;++f){var g=a.charCodeAt(f);if(55296<=g&&57343>=g){var l=a.charCodeAt(++f);g=65536+((g&1023)<<10)|l&1023}K[b>>2]=g;b+=4;if(b+4>c)break}K[b>>2]=0;return b-e}
function sa(a){for(var b=0,c=0;c<a.length;++c){var e=a.charCodeAt(c);55296<=e&&57343>=e&&++c;b+=4}return b}var L,M,H,J,I,K,N,ta,ua;function va(a){L=a;d.HEAP8=M=new Int8Array(a);d.HEAP16=J=new Int16Array(a);d.HEAP32=K=new Int32Array(a);d.HEAPU8=H=new Uint8Array(a);d.HEAPU16=I=new Uint16Array(a);d.HEAPU32=N=new Uint32Array(a);d.HEAPF32=ta=new Float32Array(a);d.HEAPF64=ua=new Float64Array(a)}var wa=d.INITIAL_MEMORY||16777216;d.wasmMemory?G=d.wasmMemory:G=new WebAssembly.Memory({initial:wa/65536,maximum:32768});
G&&(L=G.buffer);wa=L.byteLength;va(L);K[8588]=5277392;function xa(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b(d);else{var c=b.V;"number"===typeof c?void 0===b.P?d.dynCall_v(c):d.dynCall_vi(c,b.P):c(void 0===b.P?null:b.P)}}}var ya=[],za=[],Aa=[],Ba=[];function Ca(){var a=d.preRun.shift();ya.unshift(a)}var O=0,Da=null,P=null;d.preloadedImages={};d.preloadedAudios={};
function C(a){if(d.onAbort)d.onAbort(a);D(a);ja=!0;a=new WebAssembly.RuntimeError("abort("+a+"). Build with -s ASSERTIONS=1 for more info.");ba(a);throw a;}function Ea(a){var b=Q;return String.prototype.startsWith?b.startsWith(a):0===b.indexOf(a)}function Fa(){return Ea("data:application/octet-stream;base64,")}var Q="webp_enc.wasm";if(!Fa()){var Ga=Q;Q=d.locateFile?d.locateFile(Ga,y):y+Ga}
function Ha(){try{if(E)return new Uint8Array(E);if(B)return B(Q);throw"both async and sync fetching of the wasm failed";}catch(a){C(a)}}function Ia(){return E||!w&&!x||"function"!==typeof fetch||Ea("file://")?new Promise(function(a){a(Ha())}):fetch(Q,{credentials:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+Q+"'";return a.arrayBuffer()}).catch(function(){return Ha()})}za.push({V:function(){Ja()}});var Ka={};
function La(a){for(;a.length;){var b=a.pop();a.pop()(b)}}function Ma(a){return this.fromWireType(N[a>>2])}var R={},S={},Na={};function Oa(a){if(void 0===a)return"_unknown";a=a.replace(/[^a-zA-Z0-9_]/g,"$");var b=a.charCodeAt(0);return 48<=b&&57>=b?"_"+a:a}function Pa(a,b){a=Oa(a);return(new Function("body","return function "+a+'() {\n    "use strict";    return body.apply(this, arguments);\n};\n'))(b)}
function Qa(a){var b=Error,c=Pa(a,function(e){this.name=a;this.message=e;e=Error(e).stack;void 0!==e&&(this.stack=this.toString()+"\n"+e.replace(/^Error(:[^\n]*)?\n/,""))});c.prototype=Object.create(b.prototype);c.prototype.constructor=c;c.prototype.toString=function(){return void 0===this.message?this.name:this.name+": "+this.message};return c}var Ra=void 0;
function Sa(a,b,c){function e(k){k=c(k);if(k.length!==a.length)throw new Ra("Mismatched type converter count");for(var h=0;h<a.length;++h)T(a[h],k[h])}a.forEach(function(k){Na[k]=b});var f=Array(b.length),g=[],l=0;b.forEach(function(k,h){S.hasOwnProperty(k)?f[h]=S[k]:(g.push(k),R.hasOwnProperty(k)||(R[k]=[]),R[k].push(function(){f[h]=S[k];++l;l===g.length&&e(f)}))});0===g.length&&e(f)}
function Ta(a){switch(a){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+a);}}var Ua=void 0;function U(a){for(var b="";H[a];)b+=Ua[H[a++]];return b}var Va=void 0;function V(a){throw new Va(a);}
function T(a,b,c){c=c||{};if(!("argPackAdvance"in b))throw new TypeError("registerType registeredInstance requires argPackAdvance");var e=b.name;a||V('type "'+e+'" must have a positive integer typeid pointer');if(S.hasOwnProperty(a)){if(c.Z)return;V("Cannot register type '"+e+"' twice")}S[a]=b;delete Na[a];R.hasOwnProperty(a)&&(b=R[a],delete R[a],b.forEach(function(f){f()}))}var Wa=[],X=[{},{value:void 0},{value:null},{value:!0},{value:!1}];
function Xa(a){4<a&&0===--X[a].R&&(X[a]=void 0,Wa.push(a))}function Ya(a){switch(a){case void 0:return 1;case null:return 2;case !0:return 3;case !1:return 4;default:var b=Wa.length?Wa.pop():X.length;X[b]={R:1,value:a};return b}}
function Za(a,b){var c=d;if(void 0===c[a].O){var e=c[a];c[a]=function(){c[a].O.hasOwnProperty(arguments.length)||V("Function '"+b+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+c[a].O+")!");return c[a].O[arguments.length].apply(this,arguments)};c[a].O=[];c[a].O[e.T]=e}}
function $a(a,b,c){d.hasOwnProperty(a)?((void 0===c||void 0!==d[a].O&&void 0!==d[a].O[c])&&V("Cannot register public name '"+a+"' twice"),Za(a,a),d.hasOwnProperty(c)&&V("Cannot register multiple overloads of a function with the same number of arguments ("+c+")!"),d[a].O[c]=b):(d[a]=b,void 0!==c&&(d[a].ga=c))}
function ab(a,b,c){switch(b){case 0:return function(e){return this.fromWireType((c?M:H)[e])};case 1:return function(e){return this.fromWireType((c?J:I)[e>>1])};case 2:return function(e){return this.fromWireType((c?K:N)[e>>2])};default:throw new TypeError("Unknown integer type: "+a);}}function bb(a){a=cb(a);var b=U(a);Y(a);return b}function db(a,b){var c=S[a];void 0===c&&V(b+" has unknown type "+bb(a));return c}
function eb(a){if(null===a)return"null";var b=typeof a;return"object"===b||"array"===b||"function"===b?a.toString():""+a}function fb(a,b){switch(b){case 2:return function(c){return this.fromWireType(ta[c>>2])};case 3:return function(c){return this.fromWireType(ua[c>>3])};default:throw new TypeError("Unknown float type: "+a);}}
function gb(a){var b=Function;if(!(b instanceof Function))throw new TypeError("new_ called with constructor type "+typeof b+" which is not a function");var c=Pa(b.name||"unknownFunctionName",function(){});c.prototype=b.prototype;c=new c;a=b.apply(c,a);return a instanceof Object?a:c}function hb(a,b){for(var c=[],e=0;e<a;e++)c.push(K[(b>>2)+e]);return c}
function Z(a,b){a=U(a);var c=d["dynCall_"+a];for(var e=[],f=1;f<a.length;++f)e.push("a"+f);f="return function dynCall_"+(a+"_"+b)+"("+e.join(", ")+") {\n";f+="    return dynCall(rawFunction"+(e.length?", ":"")+e.join(", ")+");\n";c=(new Function("dynCall","rawFunction",f+"};\n"))(c,b);"function"!==typeof c&&V("unknown function pointer with signature "+a+": "+b);return c}var ib=void 0;
function jb(a,b){function c(g){f[g]||S[g]||(Na[g]?Na[g].forEach(c):(e.push(g),f[g]=!0))}var e=[],f={};b.forEach(c);throw new ib(a+": "+e.map(bb).join([", "]));}function kb(a,b,c){switch(b){case 0:return c?function(e){return M[e]}:function(e){return H[e]};case 1:return c?function(e){return J[e>>1]}:function(e){return I[e>>1]};case 2:return c?function(e){return K[e>>2]}:function(e){return N[e>>2]};default:throw new TypeError("Unknown integer type: "+a);}}var lb={};
function mb(){return"object"===typeof globalThis?globalThis:Function("return this")()}var nb={};Ra=d.InternalError=Qa("InternalError");for(var ob=Array(256),pb=0;256>pb;++pb)ob[pb]=String.fromCharCode(pb);Ua=ob;Va=d.BindingError=Qa("BindingError");d.count_emval_handles=function(){for(var a=0,b=5;b<X.length;++b)void 0!==X[b]&&++a;return a};d.get_first_emval=function(){for(var a=5;a<X.length;++a)if(void 0!==X[a])return X[a];return null};ib=d.UnboundTypeError=Qa("UnboundTypeError");
var rb={v:function(){},l:function(a){var b=Ka[a];delete Ka[a];var c=b.$,e=b.aa,f=b.S,g=f.map(function(l){return l.Y}).concat(f.map(function(l){return l.da}));Sa([a],g,function(l){var k={};f.forEach(function(h,m){var q=l[m],n=h.W,t=h.X,v=l[m+f.length],p=h.ba,ia=h.ea;k[h.U]={read:function(z){return q.fromWireType(n(t,z))},write:function(z,F){var W=[];p(ia,z,v.toWireType(W,F));La(W)}}});return[{name:b.name,fromWireType:function(h){var m={},q;for(q in k)m[q]=k[q].read(h);e(h);return m},toWireType:function(h,
m){for(var q in k)if(!(q in m))throw new TypeError('Missing field:  "'+q+'"');var n=c();for(q in k)k[q].write(n,m[q]);null!==h&&h.push(e,n);return n},argPackAdvance:8,readValueFromPointer:Ma,N:e}]})},r:function(a,b,c,e,f){var g=Ta(c);b=U(b);T(a,{name:b,fromWireType:function(l){return!!l},toWireType:function(l,k){return k?e:f},argPackAdvance:8,readValueFromPointer:function(l){if(1===c)var k=M;else if(2===c)k=J;else if(4===c)k=K;else throw new TypeError("Unknown boolean type size: "+b);return this.fromWireType(k[l>>
g])},N:null})},q:function(a,b){b=U(b);T(a,{name:b,fromWireType:function(c){var e=X[c].value;Xa(c);return e},toWireType:function(c,e){return Ya(e)},argPackAdvance:8,readValueFromPointer:Ma,N:null})},n:function(a,b,c,e){function f(){}c=Ta(c);b=U(b);f.values={};T(a,{name:b,constructor:f,fromWireType:function(g){return this.constructor.values[g]},toWireType:function(g,l){return l.value},argPackAdvance:8,readValueFromPointer:ab(b,c,e),N:null});$a(b,f)},e:function(a,b,c){var e=db(a,"enum");b=U(b);a=e.constructor;
e=Object.create(e.constructor.prototype,{value:{value:c},constructor:{value:Pa(e.name+"_"+b,function(){})}});a.values[c]=e;a[b]=e},j:function(a,b,c){c=Ta(c);b=U(b);T(a,{name:b,fromWireType:function(e){return e},toWireType:function(e,f){if("number"!==typeof f&&"boolean"!==typeof f)throw new TypeError('Cannot convert "'+eb(f)+'" to '+this.name);return f},argPackAdvance:8,readValueFromPointer:fb(b,c),N:null})},h:function(a,b,c,e,f,g){var l=hb(b,c);a=U(a);f=Z(e,f);$a(a,function(){jb("Cannot call "+a+
" due to unbound types",l)},b-1);Sa([],l,function(k){var h=[k[0],null].concat(k.slice(1)),m=k=a,q=f,n=h.length;2>n&&V("argTypes array size mismatch! Must at least get return value and 'this' types!");for(var t=null!==h[1]&&!1,v=!1,p=1;p<h.length;++p)if(null!==h[p]&&void 0===h[p].N){v=!0;break}var ia="void"!==h[0].name,z="",F="";for(p=0;p<n-2;++p)z+=(0!==p?", ":"")+"arg"+p,F+=(0!==p?", ":"")+"arg"+p+"Wired";m="return function "+Oa(m)+"("+z+") {\nif (arguments.length !== "+(n-2)+") {\nthrowBindingError('function "+
m+" called with ' + arguments.length + ' arguments, expected "+(n-2)+" args!');\n}\n";v&&(m+="var destructors = [];\n");var W=v?"destructors":"null";z="throwBindingError invoker fn runDestructors retType classParam".split(" ");q=[V,q,g,La,h[0],h[1]];t&&(m+="var thisWired = classParam.toWireType("+W+", this);\n");for(p=0;p<n-2;++p)m+="var arg"+p+"Wired = argType"+p+".toWireType("+W+", arg"+p+"); // "+h[p+2].name+"\n",z.push("argType"+p),q.push(h[p+2]);t&&(F="thisWired"+(0<F.length?", ":"")+F);m+=(ia?
"var rv = ":"")+"invoker(fn"+(0<F.length?", ":"")+F+");\n";if(v)m+="runDestructors(destructors);\n";else for(p=t?1:2;p<h.length;++p)n=1===p?"thisWired":"arg"+(p-2)+"Wired",null!==h[p].N&&(m+=n+"_dtor("+n+"); // "+h[p].name+"\n",z.push(n+"_dtor"),q.push(h[p].N));ia&&(m+="var ret = retType.fromWireType(rv);\nreturn ret;\n");z.push(m+"}\n");h=gb(z).apply(null,q);p=b-1;if(!d.hasOwnProperty(k))throw new Ra("Replacing nonexistant public symbol");void 0!==d[k].O&&void 0!==p?d[k].O[p]=h:(d[k]=h,d[k].T=p);
return[]})},c:function(a,b,c,e,f){function g(m){return m}b=U(b);-1===f&&(f=4294967295);var l=Ta(c);if(0===e){var k=32-8*c;g=function(m){return m<<k>>>k}}var h=-1!=b.indexOf("unsigned");T(a,{name:b,fromWireType:g,toWireType:function(m,q){if("number"!==typeof q&&"boolean"!==typeof q)throw new TypeError('Cannot convert "'+eb(q)+'" to '+this.name);if(q<e||q>f)throw new TypeError('Passing a number "'+eb(q)+'" from JS side to C/C++ side to an argument of type "'+b+'", which is outside the valid range ['+
e+", "+f+"]!");return h?q>>>0:q|0},argPackAdvance:8,readValueFromPointer:kb(b,l,0!==e),N:null})},b:function(a,b,c){function e(g){g>>=2;var l=N;return new f(L,l[g+1],l[g])}var f=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array][b];c=U(c);T(a,{name:c,fromWireType:e,argPackAdvance:8,readValueFromPointer:e},{Z:!0})},k:function(a,b){b=U(b);var c="std::string"===b;T(a,{name:b,fromWireType:function(e){var f=N[e>>2];if(c)for(var g=e+4,l=0;l<=f;++l){var k=e+4+l;
if(l==f||0==H[k]){if(g){var h=g;var m=H,q=h+(k-g);for(g=h;m[g]&&!(g>=q);)++g;if(16<g-h&&m.subarray&&ka)h=ka.decode(m.subarray(h,g));else{for(q="";h<g;){var n=m[h++];if(n&128){var t=m[h++]&63;if(192==(n&224))q+=String.fromCharCode((n&31)<<6|t);else{var v=m[h++]&63;n=224==(n&240)?(n&15)<<12|t<<6|v:(n&7)<<18|t<<12|v<<6|m[h++]&63;65536>n?q+=String.fromCharCode(n):(n-=65536,q+=String.fromCharCode(55296|n>>10,56320|n&1023))}}else q+=String.fromCharCode(n)}h=q}}else h="";if(void 0===p)var p=h;else p+=String.fromCharCode(0),
p+=h;g=k+1}}else{p=Array(f);for(l=0;l<f;++l)p[l]=String.fromCharCode(H[e+4+l]);p=p.join("")}Y(e);return p},toWireType:function(e,f){f instanceof ArrayBuffer&&(f=new Uint8Array(f));var g="string"===typeof f;g||f instanceof Uint8Array||f instanceof Uint8ClampedArray||f instanceof Int8Array||V("Cannot pass non-string to std::string");var l=(c&&g?function(){for(var m=0,q=0;q<f.length;++q){var n=f.charCodeAt(q);55296<=n&&57343>=n&&(n=65536+((n&1023)<<10)|f.charCodeAt(++q)&1023);127>=n?++m:m=2047>=n?m+
2:65535>=n?m+3:m+4}return m}:function(){return f.length})(),k=qb(4+l+1);N[k>>2]=l;if(c&&g)la(f,k+4,l+1);else if(g)for(g=0;g<l;++g){var h=f.charCodeAt(g);255<h&&(Y(k),V("String has UTF-16 code units that do not fit in 8 bits"));H[k+4+g]=h}else for(g=0;g<l;++g)H[k+4+g]=f[g];null!==e&&e.push(Y,k);return k},argPackAdvance:8,readValueFromPointer:Ma,N:function(e){Y(e)}})},g:function(a,b,c){c=U(c);if(2===b){var e=na;var f=oa;var g=pa;var l=function(){return I};var k=1}else 4===b&&(e=qa,f=ra,g=sa,l=function(){return N},
k=2);T(a,{name:c,fromWireType:function(h){for(var m=N[h>>2],q=l(),n,t=h+4,v=0;v<=m;++v){var p=h+4+v*b;if(v==m||0==q[p>>k])t=e(t,p-t),void 0===n?n=t:(n+=String.fromCharCode(0),n+=t),t=p+b}Y(h);return n},toWireType:function(h,m){"string"!==typeof m&&V("Cannot pass non-string to C++ string type "+c);var q=g(m),n=qb(4+q+b);N[n>>2]=q>>k;f(m,n+4,q+b);null!==h&&h.push(Y,n);return n},argPackAdvance:8,readValueFromPointer:Ma,N:function(h){Y(h)}})},m:function(a,b,c,e,f,g){Ka[a]={name:U(b),$:Z(c,e),aa:Z(f,g),
S:[]}},a:function(a,b,c,e,f,g,l,k,h,m){Ka[a].S.push({U:U(b),Y:c,W:Z(e,f),X:g,da:l,ba:Z(k,h),ea:m})},s:function(a,b){b=U(b);T(a,{fa:!0,name:b,argPackAdvance:0,fromWireType:function(){},toWireType:function(){}})},f:Xa,u:function(a){if(0===a)return Ya(mb());var b=lb[a];a=void 0===b?U(a):b;return Ya(mb()[a])},t:function(a){4<a&&(X[a].R+=1)},o:function(a,b,c,e){a||V("Cannot use deleted val. handle = "+a);a=X[a].value;var f=nb[b];if(!f){f="";for(var g=0;g<b;++g)f+=(0!==g?", ":"")+"arg"+g;var l="return function emval_allocator_"+
b+"(constructor, argTypes, args) {\n";for(g=0;g<b;++g)l+="var argType"+g+" = requireRegisteredType(Module['HEAP32'][(argTypes >>> 2) + "+g+'], "parameter '+g+'");\nvar arg'+g+" = argType"+g+".readValueFromPointer(args);\nargs += argType"+g+"['argPackAdvance'];\n";f=(new Function("requireRegisteredType","Module","__emval_register",l+("var obj = new constructor("+f+");\nreturn __emval_register(obj);\n}\n")))(db,d,Ya);nb[b]=f}return f(a,c,e)},i:function(){C()},p:function(a,b,c){H.copyWithin(a,b,b+c)},
d:function(a){a>>>=0;var b=H.length;if(2147483648<a)return!1;for(var c=1;4>=c;c*=2){var e=b*(1+.2/c);e=Math.min(e,a+100663296);e=Math.max(16777216,a,e);0<e%65536&&(e+=65536-e%65536);a:{try{G.grow(Math.min(2147483648,e)-L.byteLength+65535>>>16);va(G.buffer);var f=1;break a}catch(g){}f=void 0}if(f)return!0}return!1},memory:G,table:ha};
(function(){function a(f){d.asm=f.exports;O--;d.monitorRunDependencies&&d.monitorRunDependencies(O);0==O&&(null!==Da&&(clearInterval(Da),Da=null),P&&(f=P,P=null,f()))}function b(f){a(f.instance)}function c(f){return Ia().then(function(g){return WebAssembly.instantiate(g,e)}).then(f,function(g){D("failed to asynchronously prepare wasm: "+g);C(g)})}var e={a:rb};O++;d.monitorRunDependencies&&d.monitorRunDependencies(O);if(d.instantiateWasm)try{return d.instantiateWasm(e,a)}catch(f){return D("Module.instantiateWasm callback failed with error: "+
f),!1}(function(){if(E||"function"!==typeof WebAssembly.instantiateStreaming||Fa()||Ea("file://")||"function"!==typeof fetch)return c(b);fetch(Q,{credentials:"same-origin"}).then(function(f){return WebAssembly.instantiateStreaming(f,e).then(b,function(g){D("wasm streaming compile failed: "+g);D("falling back to ArrayBuffer instantiation");return c(b)})})})();return{}})();
var Ja=d.___wasm_call_ctors=function(){return(Ja=d.___wasm_call_ctors=d.asm.w).apply(null,arguments)},qb=d._malloc=function(){return(qb=d._malloc=d.asm.x).apply(null,arguments)},Y=d._free=function(){return(Y=d._free=d.asm.y).apply(null,arguments)},cb=d.___getTypeName=function(){return(cb=d.___getTypeName=d.asm.z).apply(null,arguments)};d.___embind_register_native_and_builtin_types=function(){return(d.___embind_register_native_and_builtin_types=d.asm.A).apply(null,arguments)};
d.dynCall_i=function(){return(d.dynCall_i=d.asm.B).apply(null,arguments)};d.dynCall_vi=function(){return(d.dynCall_vi=d.asm.C).apply(null,arguments)};d.dynCall_iii=function(){return(d.dynCall_iii=d.asm.D).apply(null,arguments)};d.dynCall_viii=function(){return(d.dynCall_viii=d.asm.E).apply(null,arguments)};d.dynCall_fii=function(){return(d.dynCall_fii=d.asm.F).apply(null,arguments)};d.dynCall_viif=function(){return(d.dynCall_viif=d.asm.G).apply(null,arguments)};
d.dynCall_ii=function(){return(d.dynCall_ii=d.asm.H).apply(null,arguments)};d.dynCall_iiiiii=function(){return(d.dynCall_iiiiii=d.asm.I).apply(null,arguments)};d.dynCall_viiiii=function(){return(d.dynCall_viiiii=d.asm.J).apply(null,arguments)};d.dynCall_iiii=function(){return(d.dynCall_iiii=d.asm.K).apply(null,arguments)};d.dynCall_viiii=function(){return(d.dynCall_viiii=d.asm.L).apply(null,arguments)};d.dynCall_viiiiii=function(){return(d.dynCall_viiiiii=d.asm.M).apply(null,arguments)};var sb;
P=function tb(){sb||ub();sb||(P=tb)};
function ub(){function a(){if(!sb&&(sb=!0,d.calledRun=!0,!ja)){xa(za);xa(Aa);aa(d);if(d.onRuntimeInitialized)d.onRuntimeInitialized();if(d.postRun)for("function"==typeof d.postRun&&(d.postRun=[d.postRun]);d.postRun.length;){var b=d.postRun.shift();Ba.unshift(b)}xa(Ba)}}if(!(0<O)){if(d.preRun)for("function"==typeof d.preRun&&(d.preRun=[d.preRun]);d.preRun.length;)Ca();xa(ya);0<O||(d.setStatus?(d.setStatus("Running..."),setTimeout(function(){setTimeout(function(){d.setStatus("")},1);a()},1)):a())}}
d.run=ub;if(d.preInit)for("function"==typeof d.preInit&&(d.preInit=[d.preInit]);0<d.preInit.length;)d.preInit.pop()();noExitRuntime=!0;ub();


  return webp_enc.ready
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
      module.exports = webp_enc;
    else if (typeof define === 'function' && define['amd'])
      define([], function() { return webp_enc; });
    else if (typeof exports === 'object')
      exports["webp_enc"] = webp_enc;
    