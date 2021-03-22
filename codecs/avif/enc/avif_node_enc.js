
var avif_node_enc = (function() {
  var _scriptDir = import.meta.url;
  
  return (
function(avif_node_enc) {
  avif_node_enc = avif_node_enc || {};


var f;f||(f=typeof avif_node_enc !== 'undefined' ? avif_node_enc : {});var aa,ba;f.ready=new Promise(function(a,b){aa=a;ba=b});var t={},u;for(u in f)f.hasOwnProperty(u)&&(t[u]=f[u]);var ca="",da,fa,ha,ia;ca=__dirname+"/";da=function(a){ha||(ha=require("fs"));ia||(ia=require("path"));a=ia.normalize(a);return ha.readFileSync(a,null)};fa=function(a){a=da(a);a.buffer||(a=new Uint8Array(a));a.buffer||v("Assertion failed: undefined");return a};1<process.argv.length&&process.argv[1].replace(/\\/g,"/");
process.argv.slice(2);process.on("uncaughtException",function(a){throw a;});process.on("unhandledRejection",v);f.inspect=function(){return"[Emscripten Module object]"};var ja=f.print||console.log.bind(console),w=f.printErr||console.warn.bind(console);for(u in t)t.hasOwnProperty(u)&&(f[u]=t[u]);t=null;var ka=0,x;f.wasmBinary&&(x=f.wasmBinary);var noExitRuntime;f.noExitRuntime&&(noExitRuntime=f.noExitRuntime);"object"!==typeof WebAssembly&&v("no native wasm support detected");var y,la=!1,ma=new TextDecoder("utf8");
function na(a,b,c){var d=B;if(0<c){c=b+c-1;for(var e=0;e<a.length;++e){var g=a.charCodeAt(e);if(55296<=g&&57343>=g){var h=a.charCodeAt(++e);g=65536+((g&1023)<<10)|h&1023}if(127>=g){if(b>=c)break;d[b++]=g}else{if(2047>=g){if(b+1>=c)break;d[b++]=192|g>>6}else{if(65535>=g){if(b+2>=c)break;d[b++]=224|g>>12}else{if(b+3>=c)break;d[b++]=240|g>>18;d[b++]=128|g>>12&63}d[b++]=128|g>>6&63}d[b++]=128|g&63}}d[b]=0}}var oa=new TextDecoder("utf-16le");
function pa(a,b){var c=a>>1;for(b=c+b/2;!(c>=b)&&C[c];)++c;return oa.decode(B.subarray(a,c<<1))}function qa(a,b,c){void 0===c&&(c=2147483647);if(2>c)return 0;c-=2;var d=b;c=c<2*a.length?c/2:a.length;for(var e=0;e<c;++e)D[b>>1]=a.charCodeAt(e),b+=2;D[b>>1]=0;return b-d}function ra(a){return 2*a.length}function sa(a,b){for(var c=0,d="";!(c>=b/4);){var e=E[a+4*c>>2];if(0==e)break;++c;65536<=e?(e-=65536,d+=String.fromCharCode(55296|e>>10,56320|e&1023)):d+=String.fromCharCode(e)}return d}
function ta(a,b,c){void 0===c&&(c=2147483647);if(4>c)return 0;var d=b;c=d+c-4;for(var e=0;e<a.length;++e){var g=a.charCodeAt(e);if(55296<=g&&57343>=g){var h=a.charCodeAt(++e);g=65536+((g&1023)<<10)|h&1023}E[b>>2]=g;b+=4;if(b+4>c)break}E[b>>2]=0;return b-d}function ua(a){for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);55296<=d&&57343>=d&&++c;b+=4}return b}var F,va,B,D,C,E,G,wa,xa;
function ya(a){F=a;f.HEAP8=va=new Int8Array(a);f.HEAP16=D=new Int16Array(a);f.HEAP32=E=new Int32Array(a);f.HEAPU8=B=new Uint8Array(a);f.HEAPU16=C=new Uint16Array(a);f.HEAPU32=G=new Uint32Array(a);f.HEAPF32=wa=new Float32Array(a);f.HEAPF64=xa=new Float64Array(a)}var za=f.INITIAL_MEMORY||16777216;f.wasmMemory?y=f.wasmMemory:y=new WebAssembly.Memory({initial:za/65536,maximum:32768});y&&(F=y.buffer);za=F.byteLength;ya(F);var H,Aa=[],Ba=[],Ca=[],Da=[];
function Ea(){var a=f.preRun.shift();Aa.unshift(a)}var J=0,Fa=null,K=null;f.preloadedImages={};f.preloadedAudios={};function v(a){if(f.onAbort)f.onAbort(a);w(a);la=!0;a=new WebAssembly.RuntimeError("abort("+a+"). Build with -s ASSERTIONS=1 for more info.");ba(a);throw a;}function Ga(){var a=L;return String.prototype.startsWith?a.startsWith("data:application/octet-stream;base64,"):0===a.indexOf("data:application/octet-stream;base64,")}var L="avif_node_enc.wasm";
if(!Ga()){var Ha=L;L=f.locateFile?f.locateFile(Ha,ca):ca+Ha}function Ia(){try{if(x)return new Uint8Array(x);if(fa)return fa(L);throw"both async and sync fetching of the wasm failed";}catch(a){v(a)}}function M(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b(f);else{var c=b.ja;"number"===typeof c?void 0===b.ea?H.get(c)():H.get(c)(b.ea):c(void 0===b.ea?null:b.ea)}}}var Ja=[null,[],[]],Ka={},N={};function La(a){for(;a.length;){var b=a.pop();a.pop()(b)}}
function Ma(a){return this.fromWireType(G[a>>2])}var O={},P={},Na={};function Oa(a){if(void 0===a)return"_unknown";a=a.replace(/[^a-zA-Z0-9_]/g,"$");var b=a.charCodeAt(0);return 48<=b&&57>=b?"_"+a:a}function Pa(a,b){a=Oa(a);return(new Function("body","return function "+a+'() {\n    "use strict";    return body.apply(this, arguments);\n};\n'))(b)}
function Qa(a){var b=Error,c=Pa(a,function(d){this.name=a;this.message=d;d=Error(d).stack;void 0!==d&&(this.stack=this.toString()+"\n"+d.replace(/^Error(:[^\n]*)?\n/,""))});c.prototype=Object.create(b.prototype);c.prototype.constructor=c;c.prototype.toString=function(){return void 0===this.message?this.name:this.name+": "+this.message};return c}var Ra=void 0;
function Sa(a,b,c){function d(k){k=c(k);if(k.length!==a.length)throw new Ra("Mismatched type converter count");for(var l=0;l<a.length;++l)Q(a[l],k[l])}a.forEach(function(k){Na[k]=b});var e=Array(b.length),g=[],h=0;b.forEach(function(k,l){P.hasOwnProperty(k)?e[l]=P[k]:(g.push(k),O.hasOwnProperty(k)||(O[k]=[]),O[k].push(function(){e[l]=P[k];++h;h===g.length&&d(e)}))});0===g.length&&d(e)}
function Ta(a){switch(a){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+a);}}var Ua=void 0;function R(a){for(var b="";B[a];)b+=Ua[B[a++]];return b}var Va=void 0;function S(a){throw new Va(a);}
function Q(a,b,c){c=c||{};if(!("argPackAdvance"in b))throw new TypeError("registerType registeredInstance requires argPackAdvance");var d=b.name;a||S('type "'+d+'" must have a positive integer typeid pointer');if(P.hasOwnProperty(a)){if(c.na)return;S("Cannot register type '"+d+"' twice")}P[a]=b;delete Na[a];O.hasOwnProperty(a)&&(b=O[a],delete O[a],b.forEach(function(e){e()}))}var Wa=[],T=[{},{value:void 0},{value:null},{value:!0},{value:!1}];
function Xa(a){4<a&&0===--T[a].fa&&(T[a]=void 0,Wa.push(a))}function Ya(a){switch(a){case void 0:return 1;case null:return 2;case !0:return 3;case !1:return 4;default:var b=Wa.length?Wa.pop():T.length;T[b]={fa:1,value:a};return b}}function Za(a){if(null===a)return"null";var b=typeof a;return"object"===b||"array"===b||"function"===b?a.toString():""+a}
function $a(a,b){switch(b){case 2:return function(c){return this.fromWireType(wa[c>>2])};case 3:return function(c){return this.fromWireType(xa[c>>3])};default:throw new TypeError("Unknown float type: "+a);}}function ab(a){var b=Function;if(!(b instanceof Function))throw new TypeError("new_ called with constructor type "+typeof b+" which is not a function");var c=Pa(b.name||"unknownFunctionName",function(){});c.prototype=b.prototype;c=new c;a=b.apply(c,a);return a instanceof Object?a:c}
function bb(a,b){var c=f;if(void 0===c[a].ba){var d=c[a];c[a]=function(){c[a].ba.hasOwnProperty(arguments.length)||S("Function '"+b+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+c[a].ba+")!");return c[a].ba[arguments.length].apply(this,arguments)};c[a].ba=[];c[a].ba[d.ha]=d}}
function cb(a,b,c){f.hasOwnProperty(a)?((void 0===c||void 0!==f[a].ba&&void 0!==f[a].ba[c])&&S("Cannot register public name '"+a+"' twice"),bb(a,a),f.hasOwnProperty(c)&&S("Cannot register multiple overloads of a function with the same number of arguments ("+c+")!"),f[a].ba[c]=b):(f[a]=b,void 0!==c&&(f[a].wa=c))}function db(a,b){for(var c=[],d=0;d<a;d++)c.push(E[(b>>2)+d]);return c}
function eb(a,b){0<=a.indexOf("j")||v("Assertion failed: getDynCaller should only be called with i64 sigs");var c=[];return function(){c.length=arguments.length;for(var d=0;d<arguments.length;d++)c[d]=arguments[d];var e;-1!=a.indexOf("j")?e=c&&c.length?f["dynCall_"+a].apply(null,[b].concat(c)):f["dynCall_"+a].call(null,b):e=H.get(b).apply(null,c);return e}}
function U(a,b){a=R(a);var c=-1!=a.indexOf("j")?eb(a,b):H.get(b);"function"!==typeof c&&S("unknown function pointer with signature "+a+": "+b);return c}var fb=void 0;function gb(a){a=hb(a);var b=R(a);W(a);return b}function ib(a,b){function c(g){e[g]||P[g]||(Na[g]?Na[g].forEach(c):(d.push(g),e[g]=!0))}var d=[],e={};b.forEach(c);throw new fb(a+": "+d.map(gb).join([", "]));}
function jb(a,b,c){switch(b){case 0:return c?function(d){return va[d]}:function(d){return B[d]};case 1:return c?function(d){return D[d>>1]}:function(d){return C[d>>1]};case 2:return c?function(d){return E[d>>2]}:function(d){return G[d>>2]};default:throw new TypeError("Unknown integer type: "+a);}}var kb={};function lb(){return"object"===typeof globalThis?globalThis:Function("return this")()}function mb(a,b){var c=P[a];void 0===c&&S(b+" has unknown type "+gb(a));return c}var nb={};
Ra=f.InternalError=Qa("InternalError");for(var ob=Array(256),pb=0;256>pb;++pb)ob[pb]=String.fromCharCode(pb);Ua=ob;Va=f.BindingError=Qa("BindingError");f.count_emval_handles=function(){for(var a=0,b=5;b<T.length;++b)void 0!==T[b]&&++a;return a};f.get_first_emval=function(){for(var a=5;a<T.length;++a)if(void 0!==T[a])return T[a];return null};fb=f.UnboundTypeError=Qa("UnboundTypeError");Ba.push({ja:function(){qb()}});
var Ab={N:function(){},t:function(){return 0},G:function(){return 0},H:function(){},z:function(a){var b=N[a];delete N[a];var c=b.oa,d=b.pa,e=b.ga,g=e.map(function(h){return h.ma}).concat(e.map(function(h){return h.ra}));Sa([a],g,function(h){var k={};e.forEach(function(l,n){var m=h[n],p=l.ka,r=l.la,z=h[n+e.length],q=l.qa,ea=l.sa;k[l.ia]={read:function(A){return m.fromWireType(p(r,A))},write:function(A,I){var V=[];q(ea,A,z.toWireType(V,I));La(V)}}});return[{name:b.name,fromWireType:function(l){var n=
{},m;for(m in k)n[m]=k[m].read(l);d(l);return n},toWireType:function(l,n){for(var m in k)if(!(m in n))throw new TypeError('Missing field:  "'+m+'"');var p=c();for(m in k)k[m].write(p,n[m]);null!==l&&l.push(d,p);return p},argPackAdvance:8,readValueFromPointer:Ma,da:d}]})},J:function(a,b,c,d,e){var g=Ta(c);b=R(b);Q(a,{name:b,fromWireType:function(h){return!!h},toWireType:function(h,k){return k?d:e},argPackAdvance:8,readValueFromPointer:function(h){if(1===c)var k=va;else if(2===c)k=D;else if(4===c)k=
E;else throw new TypeError("Unknown boolean type size: "+b);return this.fromWireType(k[h>>g])},da:null})},I:function(a,b){b=R(b);Q(a,{name:b,fromWireType:function(c){var d=T[c].value;Xa(c);return d},toWireType:function(c,d){return Ya(d)},argPackAdvance:8,readValueFromPointer:Ma,da:null})},v:function(a,b,c){c=Ta(c);b=R(b);Q(a,{name:b,fromWireType:function(d){return d},toWireType:function(d,e){if("number"!==typeof e&&"boolean"!==typeof e)throw new TypeError('Cannot convert "'+Za(e)+'" to '+this.name);
return e},argPackAdvance:8,readValueFromPointer:$a(b,c),da:null})},y:function(a,b,c,d,e,g){var h=db(b,c);a=R(a);e=U(d,e);cb(a,function(){ib("Cannot call "+a+" due to unbound types",h)},b-1);Sa([],h,function(k){var l=[k[0],null].concat(k.slice(1)),n=k=a,m=e,p=l.length;2>p&&S("argTypes array size mismatch! Must at least get return value and 'this' types!");for(var r=null!==l[1]&&!1,z=!1,q=1;q<l.length;++q)if(null!==l[q]&&void 0===l[q].da){z=!0;break}var ea="void"!==l[0].name,A="",I="";for(q=0;q<p-2;++q)A+=
(0!==q?", ":"")+"arg"+q,I+=(0!==q?", ":"")+"arg"+q+"Wired";n="return function "+Oa(n)+"("+A+") {\nif (arguments.length !== "+(p-2)+") {\nthrowBindingError('function "+n+" called with ' + arguments.length + ' arguments, expected "+(p-2)+" args!');\n}\n";z&&(n+="var destructors = [];\n");var V=z?"destructors":"null";A="throwBindingError invoker fn runDestructors retType classParam".split(" ");m=[S,m,g,La,l[0],l[1]];r&&(n+="var thisWired = classParam.toWireType("+V+", this);\n");for(q=0;q<p-2;++q)n+=
"var arg"+q+"Wired = argType"+q+".toWireType("+V+", arg"+q+"); // "+l[q+2].name+"\n",A.push("argType"+q),m.push(l[q+2]);r&&(I="thisWired"+(0<I.length?", ":"")+I);n+=(ea?"var rv = ":"")+"invoker(fn"+(0<I.length?", ":"")+I+");\n";if(z)n+="runDestructors(destructors);\n";else for(q=r?1:2;q<l.length;++q)p=1===q?"thisWired":"arg"+(q-2)+"Wired",null!==l[q].da&&(n+=p+"_dtor("+p+"); // "+l[q].name+"\n",A.push(p+"_dtor"),m.push(l[q].da));ea&&(n+="var ret = retType.fromWireType(rv);\nreturn ret;\n");A.push(n+
"}\n");l=ab(A).apply(null,m);q=b-1;if(!f.hasOwnProperty(k))throw new Ra("Replacing nonexistant public symbol");void 0!==f[k].ba&&void 0!==q?f[k].ba[q]=l:(f[k]=l,f[k].ha=q);return[]})},j:function(a,b,c,d,e){function g(n){return n}b=R(b);-1===e&&(e=4294967295);var h=Ta(c);if(0===d){var k=32-8*c;g=function(n){return n<<k>>>k}}var l=-1!=b.indexOf("unsigned");Q(a,{name:b,fromWireType:g,toWireType:function(n,m){if("number"!==typeof m&&"boolean"!==typeof m)throw new TypeError('Cannot convert "'+Za(m)+'" to '+
this.name);if(m<d||m>e)throw new TypeError('Passing a number "'+Za(m)+'" from JS side to C/C++ side to an argument of type "'+b+'", which is outside the valid range ['+d+", "+e+"]!");return l?m>>>0:m|0},argPackAdvance:8,readValueFromPointer:jb(b,h,0!==d),da:null})},f:function(a,b,c){function d(g){g>>=2;var h=G;return new e(F,h[g+1],h[g])}var e=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array][b];c=R(c);Q(a,{name:c,fromWireType:d,argPackAdvance:8,readValueFromPointer:d},
{na:!0})},w:function(a,b){b=R(b);var c="std::string"===b;Q(a,{name:b,fromWireType:function(d){var e=G[d>>2];if(c)for(var g=d+4,h=0;h<=e;++h){var k=d+4+h;if(h==e||0==B[k]){if(g){for(var l=g+(k-g),n=g;!(n>=l)&&B[n];)++n;g=ma.decode(B.subarray(g,n))}else g="";if(void 0===m)var m=g;else m+=String.fromCharCode(0),m+=g;g=k+1}}else{m=Array(e);for(h=0;h<e;++h)m[h]=String.fromCharCode(B[d+4+h]);m=m.join("")}W(d);return m},toWireType:function(d,e){e instanceof ArrayBuffer&&(e=new Uint8Array(e));var g="string"===
typeof e;g||e instanceof Uint8Array||e instanceof Uint8ClampedArray||e instanceof Int8Array||S("Cannot pass non-string to std::string");var h=(c&&g?function(){for(var n=0,m=0;m<e.length;++m){var p=e.charCodeAt(m);55296<=p&&57343>=p&&(p=65536+((p&1023)<<10)|e.charCodeAt(++m)&1023);127>=p?++n:n=2047>=p?n+2:65535>=p?n+3:n+4}return n}:function(){return e.length})(),k=rb(4+h+1);G[k>>2]=h;if(c&&g)na(e,k+4,h+1);else if(g)for(g=0;g<h;++g){var l=e.charCodeAt(g);255<l&&(W(k),S("String has UTF-16 code units that do not fit in 8 bits"));
B[k+4+g]=l}else for(g=0;g<h;++g)B[k+4+g]=e[g];null!==d&&d.push(W,k);return k},argPackAdvance:8,readValueFromPointer:Ma,da:function(d){W(d)}})},p:function(a,b,c){c=R(c);if(2===b){var d=pa;var e=qa;var g=ra;var h=function(){return C};var k=1}else 4===b&&(d=sa,e=ta,g=ua,h=function(){return G},k=2);Q(a,{name:c,fromWireType:function(l){for(var n=G[l>>2],m=h(),p,r=l+4,z=0;z<=n;++z){var q=l+4+z*b;if(z==n||0==m[q>>k])r=d(r,q-r),void 0===p?p=r:(p+=String.fromCharCode(0),p+=r),r=q+b}W(l);return p},toWireType:function(l,
n){"string"!==typeof n&&S("Cannot pass non-string to C++ string type "+c);var m=g(n),p=rb(4+m+b);G[p>>2]=m>>k;e(n,p+4,m+b);null!==l&&l.push(W,p);return p},argPackAdvance:8,readValueFromPointer:Ma,da:function(l){W(l)}})},A:function(a,b,c,d,e,g){N[a]={name:R(b),oa:U(c,d),pa:U(e,g),ga:[]}},i:function(a,b,c,d,e,g,h,k,l,n){N[a].ga.push({ia:R(b),ma:c,ka:U(d,e),la:g,ra:h,qa:U(k,l),sa:n})},K:function(a,b){b=R(b);Q(a,{va:!0,name:b,argPackAdvance:0,fromWireType:function(){},toWireType:function(){}})},m:Xa,
M:function(a){if(0===a)return Ya(lb());var b=kb[a];a=void 0===b?R(a):b;return Ya(lb()[a])},x:function(a){4<a&&(T[a].fa+=1)},D:function(a,b,c,d){a||S("Cannot use deleted val. handle = "+a);a=T[a].value;var e=nb[b];if(!e){e="";for(var g=0;g<b;++g)e+=(0!==g?", ":"")+"arg"+g;var h="return function emval_allocator_"+b+"(constructor, argTypes, args) {\n";for(g=0;g<b;++g)h+="var argType"+g+" = requireRegisteredType(Module['HEAP32'][(argTypes >>> 2) + "+g+'], "parameter '+g+'");\nvar arg'+g+" = argType"+
g+".readValueFromPointer(args);\nargs += argType"+g+"['argPackAdvance'];\n";e=(new Function("requireRegisteredType","Module","__emval_register",h+("var obj = new constructor("+e+");\nreturn __emval_register(obj);\n}\n")))(mb,f,Ya);nb[b]=e}return e(a,c,d)},h:function(){v()},e:function(a,b){X(a,b||1);throw"longjmp";},E:function(a,b,c){B.copyWithin(a,b,b+c)},k:function(a){a>>>=0;var b=B.length;if(2147483648<a)return!1;for(var c=1;4>=c;c*=2){var d=b*(1+.2/c);d=Math.min(d,a+100663296);d=Math.max(16777216,
a,d);0<d%65536&&(d+=65536-d%65536);a:{try{y.grow(Math.min(2147483648,d)-F.byteLength+65535>>>16);ya(y.buffer);var e=1;break a}catch(g){}e=void 0}if(e)return!0}return!1},s:function(){return 0},F:function(a,b,c,d){a=Ka.ua(a);b=Ka.ta(a,b,c);E[d>>2]=b;return 0},B:function(){},u:function(a,b,c,d){for(var e=0,g=0;g<c;g++){for(var h=E[b+8*g>>2],k=E[b+(8*g+4)>>2],l=0;l<k;l++){var n=B[h+l],m=Ja[a];if(0===n||10===n){n=1===a?ja:w;var p;for(p=0;m[p]&&!(NaN<=p);)++p;p=ma.decode(m.subarray?m.subarray(0,p):new Uint8Array(m.slice(0,
p)));n(p);m.length=0}else m.push(n)}e+=k}E[d>>2]=e;return 0},c:function(){return ka|0},r:sb,C:tb,q:ub,l:vb,o:wb,g:xb,d:yb,n:zb,a:y,b:function(a){ka=a|0},L:function(a){var b=Date.now()/1E3|0;a&&(E[a>>2]=b);return b}};
(function(){function a(e){f.asm=e.exports;H=f.asm.O;J--;f.monitorRunDependencies&&f.monitorRunDependencies(J);0==J&&(null!==Fa&&(clearInterval(Fa),Fa=null),K&&(e=K,K=null,e()))}function b(e){a(e.instance)}function c(e){return Promise.resolve().then(Ia).then(function(g){return WebAssembly.instantiate(g,d)}).then(e,function(g){w("failed to asynchronously prepare wasm: "+g);v(g)})}var d={a:Ab};J++;f.monitorRunDependencies&&f.monitorRunDependencies(J);if(f.instantiateWasm)try{return f.instantiateWasm(d,
a)}catch(e){return w("Module.instantiateWasm callback failed with error: "+e),!1}(function(){return x||"function"!==typeof WebAssembly.instantiateStreaming||Ga()||"function"!==typeof fetch?c(b):fetch(L,{credentials:"same-origin"}).then(function(e){return WebAssembly.instantiateStreaming(e,d).then(b,function(g){w("wasm streaming compile failed: "+g);w("falling back to ArrayBuffer instantiation");return c(b)})})})().catch(ba);return{}})();
var qb=f.___wasm_call_ctors=function(){return(qb=f.___wasm_call_ctors=f.asm.P).apply(null,arguments)},rb=f._malloc=function(){return(rb=f._malloc=f.asm.Q).apply(null,arguments)},W=f._free=function(){return(W=f._free=f.asm.R).apply(null,arguments)},hb=f.___getTypeName=function(){return(hb=f.___getTypeName=f.asm.S).apply(null,arguments)};f.___embind_register_native_and_builtin_types=function(){return(f.___embind_register_native_and_builtin_types=f.asm.T).apply(null,arguments)};
var Y=f.stackSave=function(){return(Y=f.stackSave=f.asm.U).apply(null,arguments)},Z=f.stackRestore=function(){return(Z=f.stackRestore=f.asm.V).apply(null,arguments)},X=f._setThrew=function(){return(X=f._setThrew=f.asm.W).apply(null,arguments)};f.dynCall_jiiiiiiiii=function(){return(f.dynCall_jiiiiiiiii=f.asm.X).apply(null,arguments)};f.dynCall_jiji=function(){return(f.dynCall_jiji=f.asm.Y).apply(null,arguments)};f.dynCall_jiiiiiiii=function(){return(f.dynCall_jiiiiiiii=f.asm.Z).apply(null,arguments)};
f.dynCall_jiiiiii=function(){return(f.dynCall_jiiiiii=f.asm._).apply(null,arguments)};f.dynCall_jiiiii=function(){return(f.dynCall_jiiiii=f.asm.$).apply(null,arguments)};f.dynCall_iiijii=function(){return(f.dynCall_iiijii=f.asm.aa).apply(null,arguments)};function wb(a,b){var c=Y();try{H.get(a)(b)}catch(d){Z(c);if(d!==d+0&&"longjmp"!==d)throw d;X(1,0)}}function yb(a,b,c,d,e){var g=Y();try{H.get(a)(b,c,d,e)}catch(h){Z(g);if(h!==h+0&&"longjmp"!==h)throw h;X(1,0)}}
function xb(a,b,c){var d=Y();try{H.get(a)(b,c)}catch(e){Z(d);if(e!==e+0&&"longjmp"!==e)throw e;X(1,0)}}function vb(a,b,c,d,e,g,h,k,l){var n=Y();try{return H.get(a)(b,c,d,e,g,h,k,l)}catch(m){Z(n);if(m!==m+0&&"longjmp"!==m)throw m;X(1,0)}}function sb(a,b,c){var d=Y();try{return H.get(a)(b,c)}catch(e){Z(d);if(e!==e+0&&"longjmp"!==e)throw e;X(1,0)}}function ub(a,b,c,d,e){var g=Y();try{return H.get(a)(b,c,d,e)}catch(h){Z(g);if(h!==h+0&&"longjmp"!==h)throw h;X(1,0)}}
function tb(a,b,c,d){var e=Y();try{return H.get(a)(b,c,d)}catch(g){Z(e);if(g!==g+0&&"longjmp"!==g)throw g;X(1,0)}}function zb(a,b,c,d,e,g,h,k,l,n,m){var p=Y();try{H.get(a)(b,c,d,e,g,h,k,l,n,m)}catch(r){Z(p);if(r!==r+0&&"longjmp"!==r)throw r;X(1,0)}}var Bb;K=function Cb(){Bb||Db();Bb||(K=Cb)};
function Db(){function a(){if(!Bb&&(Bb=!0,f.calledRun=!0,!la)){M(Ba);M(Ca);aa(f);if(f.onRuntimeInitialized)f.onRuntimeInitialized();if(f.postRun)for("function"==typeof f.postRun&&(f.postRun=[f.postRun]);f.postRun.length;){var b=f.postRun.shift();Da.unshift(b)}M(Da)}}if(!(0<J)){if(f.preRun)for("function"==typeof f.preRun&&(f.preRun=[f.preRun]);f.preRun.length;)Ea();M(Aa);0<J||(f.setStatus?(f.setStatus("Running..."),setTimeout(function(){setTimeout(function(){f.setStatus("")},1);a()},1)):a())}}
f.run=Db;if(f.preInit)for("function"==typeof f.preInit&&(f.preInit=[f.preInit]);0<f.preInit.length;)f.preInit.pop()();noExitRuntime=!0;Db();


  return avif_node_enc.ready
}
);
})();
export default avif_node_enc;