
var webp_dec = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return (
function(webp_dec) {
  webp_dec = webp_dec || {};


var d;d||(d=typeof webp_dec !== 'undefined' ? webp_dec : {});var aa,ba;d.ready=new Promise(function(a,b){aa=a;ba=b});var t={},u;for(u in d)d.hasOwnProperty(u)&&(t[u]=d[u]);var v=!1,w=!1,ca=!1,da=!1;v="object"===typeof window;w="function"===typeof importScripts;ca="object"===typeof process&&"object"===typeof process.versions&&"string"===typeof process.versions.node;da=!v&&!ca&&!w;var x="",z,A,ea,fa;
if(ca)x=w?require("path").dirname(x)+"/":__dirname+"/",z=function(a,b){ea||(ea=require("fs"));fa||(fa=require("path"));a=fa.normalize(a);return ea.readFileSync(a,b?null:"utf8")},A=function(a){a=z(a,!0);a.buffer||(a=new Uint8Array(a));a.buffer||B("Assertion failed: undefined");return a},1<process.argv.length&&process.argv[1].replace(/\\/g,"/"),process.argv.slice(2),process.on("uncaughtException",function(a){throw a;}),process.on("unhandledRejection",B),d.inspect=function(){return"[Emscripten Module object]"};
else if(da)"undefined"!=typeof read&&(z=function(a){return read(a)}),A=function(a){if("function"===typeof readbuffer)return new Uint8Array(readbuffer(a));a=read(a,"binary");"object"===typeof a||B("Assertion failed: undefined");return a},"undefined"!==typeof print&&("undefined"===typeof console&&(console={}),console.log=print,console.warn=console.error="undefined"!==typeof printErr?printErr:print);else if(v||w)w?x=self.location.href:document.currentScript&&(x=document.currentScript.src),_scriptDir&&
(x=_scriptDir),0!==x.indexOf("blob:")?x=x.substr(0,x.lastIndexOf("/")+1):x="",z=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.send(null);return b.responseText},w&&(A=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)});d.print||console.log.bind(console);var C=d.printErr||console.warn.bind(console);for(u in t)t.hasOwnProperty(u)&&(d[u]=t[u]);t=null;var D;d.wasmBinary&&(D=d.wasmBinary);var noExitRuntime;
d.noExitRuntime&&(noExitRuntime=d.noExitRuntime);"object"!==typeof WebAssembly&&B("no native wasm support detected");var E,ha=new WebAssembly.Table({initial:123,maximum:123,element:"anyfunc"}),ia=!1,ja="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0;
function ka(a,b,c){var e=F;if(0<c){c=b+c-1;for(var f=0;f<a.length;++f){var g=a.charCodeAt(f);if(55296<=g&&57343>=g){var n=a.charCodeAt(++f);g=65536+((g&1023)<<10)|n&1023}if(127>=g){if(b>=c)break;e[b++]=g}else{if(2047>=g){if(b+1>=c)break;e[b++]=192|g>>6}else{if(65535>=g){if(b+2>=c)break;e[b++]=224|g>>12}else{if(b+3>=c)break;e[b++]=240|g>>18;e[b++]=128|g>>12&63}e[b++]=128|g>>6&63}e[b++]=128|g&63}}e[b]=0}}var la="undefined"!==typeof TextDecoder?new TextDecoder("utf-16le"):void 0;
function ma(a,b){var c=a>>1;for(var e=c+b/2;!(c>=e)&&G[c];)++c;c<<=1;if(32<c-a&&la)return la.decode(F.subarray(a,c));c=0;for(e="";;){var f=H[a+2*c>>1];if(0==f||c==b/2)return e;++c;e+=String.fromCharCode(f)}}function na(a,b,c){void 0===c&&(c=2147483647);if(2>c)return 0;c-=2;var e=b;c=c<2*a.length?c/2:a.length;for(var f=0;f<c;++f)H[b>>1]=a.charCodeAt(f),b+=2;H[b>>1]=0;return b-e}function oa(a){return 2*a.length}
function pa(a,b){for(var c=0,e="";!(c>=b/4);){var f=I[a+4*c>>2];if(0==f)break;++c;65536<=f?(f-=65536,e+=String.fromCharCode(55296|f>>10,56320|f&1023)):e+=String.fromCharCode(f)}return e}function qa(a,b,c){void 0===c&&(c=2147483647);if(4>c)return 0;var e=b;c=e+c-4;for(var f=0;f<a.length;++f){var g=a.charCodeAt(f);if(55296<=g&&57343>=g){var n=a.charCodeAt(++f);g=65536+((g&1023)<<10)|n&1023}I[b>>2]=g;b+=4;if(b+4>c)break}I[b>>2]=0;return b-e}
function ra(a){for(var b=0,c=0;c<a.length;++c){var e=a.charCodeAt(c);55296<=e&&57343>=e&&++c;b+=4}return b}var J,sa,F,H,G,I,L,ta,ua;function va(a){J=a;d.HEAP8=sa=new Int8Array(a);d.HEAP16=H=new Int16Array(a);d.HEAP32=I=new Int32Array(a);d.HEAPU8=F=new Uint8Array(a);d.HEAPU16=G=new Uint16Array(a);d.HEAPU32=L=new Uint32Array(a);d.HEAPF32=ta=new Float32Array(a);d.HEAPF64=ua=new Float64Array(a)}var wa=d.INITIAL_MEMORY||16777216;d.wasmMemory?E=d.wasmMemory:E=new WebAssembly.Memory({initial:wa/65536,maximum:32768});
E&&(J=E.buffer);wa=J.byteLength;va(J);I[3188]=5255792;function M(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b(d);else{var c=b.M;"number"===typeof c?void 0===b.J?d.dynCall_v(c):d.dynCall_vi(c,b.J):c(void 0===b.J?null:b.J)}}}var xa=[],ya=[],za=[],Aa=[];function Ba(){var a=d.preRun.shift();xa.unshift(a)}var N=0,Ca=null,P=null;d.preloadedImages={};d.preloadedAudios={};
function B(a){if(d.onAbort)d.onAbort(a);C(a);ia=!0;a=new WebAssembly.RuntimeError("abort("+a+"). Build with -s ASSERTIONS=1 for more info.");ba(a);throw a;}function Da(a){var b=Q;return String.prototype.startsWith?b.startsWith(a):0===b.indexOf(a)}function Ea(){return Da("data:application/octet-stream;base64,")}var Q="webp_dec.wasm";if(!Ea()){var Fa=Q;Q=d.locateFile?d.locateFile(Fa,x):x+Fa}
function Ga(){try{if(D)return new Uint8Array(D);if(A)return A(Q);throw"both async and sync fetching of the wasm failed";}catch(a){B(a)}}function Ha(){return D||!v&&!w||"function"!==typeof fetch||Da("file://")?new Promise(function(a){a(Ga())}):fetch(Q,{credentials:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+Q+"'";return a.arrayBuffer()}).catch(function(){return Ga()})}ya.push({M:function(){Ia()}});
function Ja(a){switch(a){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+a);}}var Ka=void 0;function R(a){for(var b="";F[a];)b+=Ka[F[a++]];return b}var S={},T={},U={};function La(a){if(void 0===a)return"_unknown";a=a.replace(/[^a-zA-Z0-9_]/g,"$");var b=a.charCodeAt(0);return 48<=b&&57>=b?"_"+a:a}
function Ma(a,b){a=La(a);return(new Function("body","return function "+a+'() {\n    "use strict";    return body.apply(this, arguments);\n};\n'))(b)}function Na(a){var b=Error,c=Ma(a,function(e){this.name=a;this.message=e;e=Error(e).stack;void 0!==e&&(this.stack=this.toString()+"\n"+e.replace(/^Error(:[^\n]*)?\n/,""))});c.prototype=Object.create(b.prototype);c.prototype.constructor=c;c.prototype.toString=function(){return void 0===this.message?this.name:this.name+": "+this.message};return c}
var Oa=void 0;function V(a){throw new Oa(a);}var Pa=void 0;function Qa(a,b){function c(k){k=b(k);if(k.length!==e.length)throw new Pa("Mismatched type converter count");for(var h=0;h<e.length;++h)W(e[h],k[h])}var e=[];e.forEach(function(k){U[k]=a});var f=Array(a.length),g=[],n=0;a.forEach(function(k,h){T.hasOwnProperty(k)?f[h]=T[k]:(g.push(k),S.hasOwnProperty(k)||(S[k]=[]),S[k].push(function(){f[h]=T[k];++n;n===g.length&&c(f)}))});0===g.length&&c(f)}
function W(a,b,c){c=c||{};if(!("argPackAdvance"in b))throw new TypeError("registerType registeredInstance requires argPackAdvance");var e=b.name;a||V('type "'+e+'" must have a positive integer typeid pointer');if(T.hasOwnProperty(a)){if(c.N)return;V("Cannot register type '"+e+"' twice")}T[a]=b;delete U[a];S.hasOwnProperty(a)&&(b=S[a],delete S[a],b.forEach(function(f){f()}))}var Ra=[],X=[{},{value:void 0},{value:null},{value:!0},{value:!1}];
function Sa(a){4<a&&0===--X[a].K&&(X[a]=void 0,Ra.push(a))}function Y(a){switch(a){case void 0:return 1;case null:return 2;case !0:return 3;case !1:return 4;default:var b=Ra.length?Ra.pop():X.length;X[b]={K:1,value:a};return b}}function Va(a){return this.fromWireType(L[a>>2])}function Wa(a){if(null===a)return"null";var b=typeof a;return"object"===b||"array"===b||"function"===b?a.toString():""+a}
function Xa(a,b){switch(b){case 2:return function(c){return this.fromWireType(ta[c>>2])};case 3:return function(c){return this.fromWireType(ua[c>>3])};default:throw new TypeError("Unknown float type: "+a);}}function Ya(a){var b=Function;if(!(b instanceof Function))throw new TypeError("new_ called with constructor type "+typeof b+" which is not a function");var c=Ma(b.name||"unknownFunctionName",function(){});c.prototype=b.prototype;c=new c;a=b.apply(c,a);return a instanceof Object?a:c}
function Za(a){for(;a.length;){var b=a.pop();a.pop()(b)}}function $a(a,b){var c=d;if(void 0===c[a].H){var e=c[a];c[a]=function(){c[a].H.hasOwnProperty(arguments.length)||V("Function '"+b+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+c[a].H+")!");return c[a].H[arguments.length].apply(this,arguments)};c[a].H=[];c[a].H[e.L]=e}}
function ab(a,b,c){d.hasOwnProperty(a)?((void 0===c||void 0!==d[a].H&&void 0!==d[a].H[c])&&V("Cannot register public name '"+a+"' twice"),$a(a,a),d.hasOwnProperty(c)&&V("Cannot register multiple overloads of a function with the same number of arguments ("+c+")!"),d[a].H[c]=b):(d[a]=b,void 0!==c&&(d[a].P=c))}function bb(a,b){for(var c=[],e=0;e<a;e++)c.push(I[(b>>2)+e]);return c}
function cb(a,b){a=R(a);var c=d["dynCall_"+a];for(var e=[],f=1;f<a.length;++f)e.push("a"+f);f="return function dynCall_"+(a+"_"+b)+"("+e.join(", ")+") {\n";f+="    return dynCall(rawFunction"+(e.length?", ":"")+e.join(", ")+");\n";c=(new Function("dynCall","rawFunction",f+"};\n"))(c,b);"function"!==typeof c&&V("unknown function pointer with signature "+a+": "+b);return c}var db=void 0;function eb(a){a=fb(a);var b=R(a);Z(a);return b}
function gb(a,b){function c(g){f[g]||T[g]||(U[g]?U[g].forEach(c):(e.push(g),f[g]=!0))}var e=[],f={};b.forEach(c);throw new db(a+": "+e.map(eb).join([", "]));}function hb(a,b,c){switch(b){case 0:return c?function(e){return sa[e]}:function(e){return F[e]};case 1:return c?function(e){return H[e>>1]}:function(e){return G[e>>1]};case 2:return c?function(e){return I[e>>2]}:function(e){return L[e>>2]};default:throw new TypeError("Unknown integer type: "+a);}}var ib={};
function jb(){return"object"===typeof globalThis?globalThis:Function("return this")()}function kb(a,b){var c=T[a];void 0===c&&V(b+" has unknown type "+eb(a));return c}for(var lb={},mb=Array(256),nb=0;256>nb;++nb)mb[nb]=String.fromCharCode(nb);Ka=mb;Oa=d.BindingError=Na("BindingError");Pa=d.InternalError=Na("InternalError");d.count_emval_handles=function(){for(var a=0,b=5;b<X.length;++b)void 0!==X[b]&&++a;return a};
d.get_first_emval=function(){for(var a=5;a<X.length;++a)if(void 0!==X[a])return X[a];return null};db=d.UnboundTypeError=Na("UnboundTypeError");
var pb={f:function(){},n:function(a,b,c,e,f){var g=Ja(c);b=R(b);W(a,{name:b,fromWireType:function(n){return!!n},toWireType:function(n,k){return k?e:f},argPackAdvance:8,readValueFromPointer:function(n){if(1===c)var k=sa;else if(2===c)k=H;else if(4===c)k=I;else throw new TypeError("Unknown boolean type size: "+b);return this.fromWireType(k[n>>g])},I:null})},q:function(a,b){b=R(b);W(a,{name:b,fromWireType:function(c){var e=X[c].value;Sa(c);return e},toWireType:function(c,e){return Y(e)},argPackAdvance:8,
readValueFromPointer:Va,I:null})},m:function(a,b,c){c=Ja(c);b=R(b);W(a,{name:b,fromWireType:function(e){return e},toWireType:function(e,f){if("number"!==typeof f&&"boolean"!==typeof f)throw new TypeError('Cannot convert "'+Wa(f)+'" to '+this.name);return f},argPackAdvance:8,readValueFromPointer:Xa(b,c),I:null})},i:function(a,b,c,e,f,g){var n=bb(b,c);a=R(a);f=cb(e,f);ab(a,function(){gb("Cannot call "+a+" due to unbound types",n)},b-1);Qa(n,function(k){var h=[k[0],null].concat(k.slice(1)),p=k=a,q=f,
m=h.length;2>m&&V("argTypes array size mismatch! Must at least get return value and 'this' types!");for(var r=null!==h[1]&&!1,y=!1,l=1;l<h.length;++l)if(null!==h[l]&&void 0===h[l].I){y=!0;break}var Ta="void"!==h[0].name,K="",O="";for(l=0;l<m-2;++l)K+=(0!==l?", ":"")+"arg"+l,O+=(0!==l?", ":"")+"arg"+l+"Wired";p="return function "+La(p)+"("+K+") {\nif (arguments.length !== "+(m-2)+") {\nthrowBindingError('function "+p+" called with ' + arguments.length + ' arguments, expected "+(m-2)+" args!');\n}\n";
y&&(p+="var destructors = [];\n");var Ua=y?"destructors":"null";K="throwBindingError invoker fn runDestructors retType classParam".split(" ");q=[V,q,g,Za,h[0],h[1]];r&&(p+="var thisWired = classParam.toWireType("+Ua+", this);\n");for(l=0;l<m-2;++l)p+="var arg"+l+"Wired = argType"+l+".toWireType("+Ua+", arg"+l+"); // "+h[l+2].name+"\n",K.push("argType"+l),q.push(h[l+2]);r&&(O="thisWired"+(0<O.length?", ":"")+O);p+=(Ta?"var rv = ":"")+"invoker(fn"+(0<O.length?", ":"")+O+");\n";if(y)p+="runDestructors(destructors);\n";
else for(l=r?1:2;l<h.length;++l)m=1===l?"thisWired":"arg"+(l-2)+"Wired",null!==h[l].I&&(p+=m+"_dtor("+m+"); // "+h[l].name+"\n",K.push(m+"_dtor"),q.push(h[l].I));Ta&&(p+="var ret = retType.fromWireType(rv);\nreturn ret;\n");K.push(p+"}\n");h=Ya(K).apply(null,q);l=b-1;if(!d.hasOwnProperty(k))throw new Pa("Replacing nonexistant public symbol");void 0!==d[k].H&&void 0!==l?d[k].H[l]=h:(d[k]=h,d[k].L=l);return[]})},b:function(a,b,c,e,f){function g(p){return p}b=R(b);-1===f&&(f=4294967295);var n=Ja(c);
if(0===e){var k=32-8*c;g=function(p){return p<<k>>>k}}var h=-1!=b.indexOf("unsigned");W(a,{name:b,fromWireType:g,toWireType:function(p,q){if("number"!==typeof q&&"boolean"!==typeof q)throw new TypeError('Cannot convert "'+Wa(q)+'" to '+this.name);if(q<e||q>f)throw new TypeError('Passing a number "'+Wa(q)+'" from JS side to C/C++ side to an argument of type "'+b+'", which is outside the valid range ['+e+", "+f+"]!");return h?q>>>0:q|0},argPackAdvance:8,readValueFromPointer:hb(b,n,0!==e),I:null})},
a:function(a,b,c){function e(g){g>>=2;var n=L;return new f(J,n[g+1],n[g])}var f=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array][b];c=R(c);W(a,{name:c,fromWireType:e,argPackAdvance:8,readValueFromPointer:e},{N:!0})},h:function(a,b){b=R(b);var c="std::string"===b;W(a,{name:b,fromWireType:function(e){var f=L[e>>2];if(c)for(var g=e+4,n=0;n<=f;++n){var k=e+4+n;if(n==f||0==F[k]){if(g){var h=g;var p=F,q=h+(k-g);for(g=h;p[g]&&!(g>=q);)++g;if(16<g-h&&p.subarray&&
ja)h=ja.decode(p.subarray(h,g));else{for(q="";h<g;){var m=p[h++];if(m&128){var r=p[h++]&63;if(192==(m&224))q+=String.fromCharCode((m&31)<<6|r);else{var y=p[h++]&63;m=224==(m&240)?(m&15)<<12|r<<6|y:(m&7)<<18|r<<12|y<<6|p[h++]&63;65536>m?q+=String.fromCharCode(m):(m-=65536,q+=String.fromCharCode(55296|m>>10,56320|m&1023))}}else q+=String.fromCharCode(m)}h=q}}else h="";if(void 0===l)var l=h;else l+=String.fromCharCode(0),l+=h;g=k+1}}else{l=Array(f);for(n=0;n<f;++n)l[n]=String.fromCharCode(F[e+4+n]);
l=l.join("")}Z(e);return l},toWireType:function(e,f){f instanceof ArrayBuffer&&(f=new Uint8Array(f));var g="string"===typeof f;g||f instanceof Uint8Array||f instanceof Uint8ClampedArray||f instanceof Int8Array||V("Cannot pass non-string to std::string");var n=(c&&g?function(){for(var p=0,q=0;q<f.length;++q){var m=f.charCodeAt(q);55296<=m&&57343>=m&&(m=65536+((m&1023)<<10)|f.charCodeAt(++q)&1023);127>=m?++p:p=2047>=m?p+2:65535>=m?p+3:p+4}return p}:function(){return f.length})(),k=ob(4+n+1);L[k>>2]=
n;if(c&&g)ka(f,k+4,n+1);else if(g)for(g=0;g<n;++g){var h=f.charCodeAt(g);255<h&&(Z(k),V("String has UTF-16 code units that do not fit in 8 bits"));F[k+4+g]=h}else for(g=0;g<n;++g)F[k+4+g]=f[g];null!==e&&e.push(Z,k);return k},argPackAdvance:8,readValueFromPointer:Va,I:function(e){Z(e)}})},g:function(a,b,c){c=R(c);if(2===b){var e=ma;var f=na;var g=oa;var n=function(){return G};var k=1}else 4===b&&(e=pa,f=qa,g=ra,n=function(){return L},k=2);W(a,{name:c,fromWireType:function(h){for(var p=L[h>>2],q=n(),
m,r=h+4,y=0;y<=p;++y){var l=h+4+y*b;if(y==p||0==q[l>>k])r=e(r,l-r),void 0===m?m=r:(m+=String.fromCharCode(0),m+=r),r=l+b}Z(h);return m},toWireType:function(h,p){"string"!==typeof p&&V("Cannot pass non-string to C++ string type "+c);var q=g(p),m=ob(4+q+b);L[m>>2]=q>>k;f(p,m+4,q+b);null!==h&&h.push(Z,m);return m},argPackAdvance:8,readValueFromPointer:Va,I:function(h){Z(h)}})},o:function(a,b){b=R(b);W(a,{O:!0,name:b,argPackAdvance:0,fromWireType:function(){},toWireType:function(){}})},d:Sa,e:function(a){if(0===
a)return Y(jb());var b=ib[a];a=void 0===b?R(a):b;return Y(jb()[a])},j:function(a){4<a&&(X[a].K+=1)},k:function(a,b,c,e){a||V("Cannot use deleted val. handle = "+a);a=X[a].value;var f=lb[b];if(!f){f="";for(var g=0;g<b;++g)f+=(0!==g?", ":"")+"arg"+g;var n="return function emval_allocator_"+b+"(constructor, argTypes, args) {\n";for(g=0;g<b;++g)n+="var argType"+g+" = requireRegisteredType(Module['HEAP32'][(argTypes >>> 2) + "+g+'], "parameter '+g+'");\nvar arg'+g+" = argType"+g+".readValueFromPointer(args);\nargs += argType"+
g+"['argPackAdvance'];\n";f=(new Function("requireRegisteredType","Module","__emval_register",n+("var obj = new constructor("+f+");\nreturn __emval_register(obj);\n}\n")))(kb,d,Y);lb[b]=f}return f(a,c,e)},l:function(){B()},p:function(a,b,c){F.copyWithin(a,b,b+c)},c:function(a){a>>>=0;var b=F.length;if(2147483648<a)return!1;for(var c=1;4>=c;c*=2){var e=b*(1+.2/c);e=Math.min(e,a+100663296);e=Math.max(16777216,a,e);0<e%65536&&(e+=65536-e%65536);a:{try{E.grow(Math.min(2147483648,e)-J.byteLength+65535>>>
16);va(E.buffer);var f=1;break a}catch(g){}f=void 0}if(f)return!0}return!1},memory:E,table:ha};
(function(){function a(f){d.asm=f.exports;N--;d.monitorRunDependencies&&d.monitorRunDependencies(N);0==N&&(null!==Ca&&(clearInterval(Ca),Ca=null),P&&(f=P,P=null,f()))}function b(f){a(f.instance)}function c(f){return Ha().then(function(g){return WebAssembly.instantiate(g,e)}).then(f,function(g){C("failed to asynchronously prepare wasm: "+g);B(g)})}var e={a:pb};N++;d.monitorRunDependencies&&d.monitorRunDependencies(N);if(d.instantiateWasm)try{return d.instantiateWasm(e,a)}catch(f){return C("Module.instantiateWasm callback failed with error: "+
f),!1}(function(){if(D||"function"!==typeof WebAssembly.instantiateStreaming||Ea()||Da("file://")||"function"!==typeof fetch)return c(b);fetch(Q,{credentials:"same-origin"}).then(function(f){return WebAssembly.instantiateStreaming(f,e).then(b,function(g){C("wasm streaming compile failed: "+g);C("falling back to ArrayBuffer instantiation");return c(b)})})})();return{}})();
var Ia=d.___wasm_call_ctors=function(){return(Ia=d.___wasm_call_ctors=d.asm.r).apply(null,arguments)},ob=d._malloc=function(){return(ob=d._malloc=d.asm.s).apply(null,arguments)},Z=d._free=function(){return(Z=d._free=d.asm.t).apply(null,arguments)},fb=d.___getTypeName=function(){return(fb=d.___getTypeName=d.asm.u).apply(null,arguments)};d.___embind_register_native_and_builtin_types=function(){return(d.___embind_register_native_and_builtin_types=d.asm.v).apply(null,arguments)};
d.dynCall_iii=function(){return(d.dynCall_iii=d.asm.w).apply(null,arguments)};d.dynCall_vii=function(){return(d.dynCall_vii=d.asm.x).apply(null,arguments)};d.dynCall_ii=function(){return(d.dynCall_ii=d.asm.y).apply(null,arguments)};d.dynCall_i=function(){return(d.dynCall_i=d.asm.z).apply(null,arguments)};d.dynCall_vi=function(){return(d.dynCall_vi=d.asm.A).apply(null,arguments)};d.dynCall_iiiiiii=function(){return(d.dynCall_iiiiiii=d.asm.B).apply(null,arguments)};
d.dynCall_viiiiiiiii=function(){return(d.dynCall_viiiiiiiii=d.asm.C).apply(null,arguments)};d.dynCall_viiiii=function(){return(d.dynCall_viiiii=d.asm.D).apply(null,arguments)};d.dynCall_iiii=function(){return(d.dynCall_iiii=d.asm.E).apply(null,arguments)};d.dynCall_viiii=function(){return(d.dynCall_viiii=d.asm.F).apply(null,arguments)};d.dynCall_viiiiii=function(){return(d.dynCall_viiiiii=d.asm.G).apply(null,arguments)};var qb;P=function rb(){qb||sb();qb||(P=rb)};
function sb(){function a(){if(!qb&&(qb=!0,d.calledRun=!0,!ia)){M(ya);M(za);aa(d);if(d.onRuntimeInitialized)d.onRuntimeInitialized();if(d.postRun)for("function"==typeof d.postRun&&(d.postRun=[d.postRun]);d.postRun.length;){var b=d.postRun.shift();Aa.unshift(b)}M(Aa)}}if(!(0<N)){if(d.preRun)for("function"==typeof d.preRun&&(d.preRun=[d.preRun]);d.preRun.length;)Ba();M(xa);0<N||(d.setStatus?(d.setStatus("Running..."),setTimeout(function(){setTimeout(function(){d.setStatus("")},1);a()},1)):a())}}
d.run=sb;if(d.preInit)for("function"==typeof d.preInit&&(d.preInit=[d.preInit]);0<d.preInit.length;)d.preInit.pop()();noExitRuntime=!0;sb();


  return webp_dec.ready
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
      module.exports = webp_dec;
    else if (typeof define === 'function' && define['amd'])
      define([], function() { return webp_dec; });
    else if (typeof exports === 'object')
      exports["webp_dec"] = webp_dec;
    