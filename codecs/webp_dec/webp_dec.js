
var webp_dec = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return (
function(webp_dec) {
  webp_dec = webp_dec || {};

var e;e||(e=typeof webp_dec !== 'undefined' ? webp_dec : {});var r={},w;for(w in e)e.hasOwnProperty(w)&&(r[w]=e[w]);var aa=!1,z=!1,ba=!1,ca=!1;aa="object"===typeof window;z="function"===typeof importScripts;ba="object"===typeof process&&"object"===typeof process.versions&&"string"===typeof process.versions.node;ca=!aa&&!ba&&!z;var A="",da,B,ea,ha;
if(ba)A=z?require("path").dirname(A)+"/":__dirname+"/",da=function(a,b){ea||(ea=require("fs"));ha||(ha=require("path"));a=ha.normalize(a);return ea.readFileSync(a,b?null:"utf8")},B=function(a){a=da(a,!0);a.buffer||(a=new Uint8Array(a));a.buffer||D("Assertion failed: undefined");return a},1<process.argv.length&&process.argv[1].replace(/\\/g,"/"),process.argv.slice(2),process.on("uncaughtException",function(a){throw a;}),process.on("unhandledRejection",D),e.inspect=function(){return"[Emscripten Module object]"};
else if(ca)"undefined"!=typeof read&&(da=function(a){return read(a)}),B=function(a){if("function"===typeof readbuffer)return new Uint8Array(readbuffer(a));a=read(a,"binary");"object"===typeof a||D("Assertion failed: undefined");return a},"undefined"!==typeof print&&("undefined"===typeof console&&(console={}),console.log=print,console.warn=console.error="undefined"!==typeof printErr?printErr:print);else if(aa||z)z?A=self.location.href:document.currentScript&&(A=document.currentScript.src),_scriptDir&&
(A=_scriptDir),0!==A.indexOf("blob:")?A=A.substr(0,A.lastIndexOf("/")+1):A="",da=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.send(null);return b.responseText},z&&(B=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)});var ia=e.print||console.log.bind(console),E=e.printErr||console.warn.bind(console);for(w in r)r.hasOwnProperty(w)&&(e[w]=r[w]);r=null;var F;e.wasmBinary&&(F=e.wasmBinary);var noExitRuntime;
e.noExitRuntime&&(noExitRuntime=e.noExitRuntime);"object"!==typeof WebAssembly&&E("no native wasm support detected");var G,ja=new WebAssembly.Table({initial:190,maximum:190,element:"anyfunc"}),ka=!1,la="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0;
function ma(a,b,c){var d=H;if(0<c){c=b+c-1;for(var f=0;f<a.length;++f){var g=a.charCodeAt(f);if(55296<=g&&57343>=g){var q=a.charCodeAt(++f);g=65536+((g&1023)<<10)|q&1023}if(127>=g){if(b>=c)break;d[b++]=g}else{if(2047>=g){if(b+1>=c)break;d[b++]=192|g>>6}else{if(65535>=g){if(b+2>=c)break;d[b++]=224|g>>12}else{if(b+3>=c)break;d[b++]=240|g>>18;d[b++]=128|g>>12&63}d[b++]=128|g>>6&63}d[b++]=128|g&63}}d[b]=0}}var na="undefined"!==typeof TextDecoder?new TextDecoder("utf-16le"):void 0;
function oa(a){var b;for(b=a>>1;I[b];)++b;b<<=1;if(32<b-a&&na)return na.decode(H.subarray(a,b));b=0;for(var c="";;){var d=I[a+2*b>>1];if(0==d)return c;++b;c+=String.fromCharCode(d)}}function pa(a,b,c){void 0===c&&(c=2147483647);if(2>c)return 0;c-=2;var d=b;c=c<2*a.length?c/2:a.length;for(var f=0;f<c;++f)I[b>>1]=a.charCodeAt(f),b+=2;I[b>>1]=0;return b-d}function qa(a){return 2*a.length}
function ra(a){for(var b=0,c="";;){var d=J[a+4*b>>2];if(0==d)return c;++b;65536<=d?(d-=65536,c+=String.fromCharCode(55296|d>>10,56320|d&1023)):c+=String.fromCharCode(d)}}function sa(a,b,c){void 0===c&&(c=2147483647);if(4>c)return 0;var d=b;c=d+c-4;for(var f=0;f<a.length;++f){var g=a.charCodeAt(f);if(55296<=g&&57343>=g){var q=a.charCodeAt(++f);g=65536+((g&1023)<<10)|q&1023}J[b>>2]=g;b+=4;if(b+4>c)break}J[b>>2]=0;return b-d}
function ta(a){for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);55296<=d&&57343>=d&&++c;b+=4}return b}var K,ua,H,I,va,J,L,wa,xa;function ya(a){K=a;e.HEAP8=ua=new Int8Array(a);e.HEAP16=I=new Int16Array(a);e.HEAP32=J=new Int32Array(a);e.HEAPU8=H=new Uint8Array(a);e.HEAPU16=va=new Uint16Array(a);e.HEAPU32=L=new Uint32Array(a);e.HEAPF32=wa=new Float32Array(a);e.HEAPF64=xa=new Float64Array(a)}var za=e.INITIAL_MEMORY||16777216;e.wasmMemory?G=e.wasmMemory:G=new WebAssembly.Memory({initial:za/65536});
G&&(K=G.buffer);za=K.byteLength;ya(K);J[3452]=5256848;function Aa(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b();else{var c=b.la;"number"===typeof c?void 0===b.ba?e.dynCall_v(c):e.dynCall_vi(c,b.ba):c(void 0===b.ba?null:b.ba)}}}var Ba=[],Ca=[],Da=[],Ea=[];function Fa(){var a=e.preRun.shift();Ba.unshift(a)}var M=0,Ga=null,N=null;e.preloadedImages={};e.preloadedAudios={};
function D(a){if(e.onAbort)e.onAbort(a);ia(a);E(a);ka=!0;throw new WebAssembly.RuntimeError("abort("+a+"). Build with -s ASSERTIONS=1 for more info.");}function Ha(){var a=O;return String.prototype.startsWith?a.startsWith("data:application/octet-stream;base64,"):0===a.indexOf("data:application/octet-stream;base64,")}var O="webp_dec.wasm";if(!Ha()){var Ia=O;O=e.locateFile?e.locateFile(Ia,A):A+Ia}
function Ja(){try{if(F)return new Uint8Array(F);if(B)return B(O);throw"both async and sync fetching of the wasm failed";}catch(a){D(a)}}function Ka(){return F||!aa&&!z||"function"!==typeof fetch?new Promise(function(a){a(Ja())}):fetch(O,{credentials:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+O+"'";return a.arrayBuffer()}).catch(function(){return Ja()})}Ca.push({la:function(){La()}});
function Ma(a){switch(a){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+a);}}var Na=void 0;function P(a){for(var b="";H[a];)b+=Na[H[a++]];return b}var Q={},R={},Oa={};function Pa(a){if(void 0===a)return"_unknown";a=a.replace(/[^a-zA-Z0-9_]/g,"$");var b=a.charCodeAt(0);return 48<=b&&57>=b?"_"+a:a}
function Qa(a,b){a=Pa(a);return(new Function("body","return function "+a+'() {\n    "use strict";    return body.apply(this, arguments);\n};\n'))(b)}function Ra(a){var b=Error,c=Qa(a,function(d){this.name=a;this.message=d;d=Error(d).stack;void 0!==d&&(this.stack=this.toString()+"\n"+d.replace(/^Error(:[^\n]*)?\n/,""))});c.prototype=Object.create(b.prototype);c.prototype.constructor=c;c.prototype.toString=function(){return void 0===this.message?this.name:this.name+": "+this.message};return c}
var Sa=void 0;function S(a){throw new Sa(a);}var Ta=void 0;function Ua(a){throw new Ta(a);}function Va(a,b,c){function d(h){h=c(h);h.length!==a.length&&Ua("Mismatched type converter count");for(var l=0;l<a.length;++l)T(a[l],h[l])}a.forEach(function(h){Oa[h]=b});var f=Array(b.length),g=[],q=0;b.forEach(function(h,l){R.hasOwnProperty(h)?f[l]=R[h]:(g.push(h),Q.hasOwnProperty(h)||(Q[h]=[]),Q[h].push(function(){f[l]=R[h];++q;q===g.length&&d(f)}))});0===g.length&&d(f)}
function T(a,b,c){c=c||{};if(!("argPackAdvance"in b))throw new TypeError("registerType registeredInstance requires argPackAdvance");var d=b.name;a||S('type "'+d+'" must have a positive integer typeid pointer');if(R.hasOwnProperty(a)){if(c.oa)return;S("Cannot register type '"+d+"' twice")}R[a]=b;delete Oa[a];Q.hasOwnProperty(a)&&(b=Q[a],delete Q[a],b.forEach(function(f){f()}))}function Wa(a){return{count:a.count,X:a.X,Y:a.Y,M:a.M,O:a.O,P:a.P,R:a.R}}
function Xa(a){S(a.L.O.N.name+" instance already deleted")}var Ya=!1;function Za(){}function $a(a){--a.count.value;0===a.count.value&&(a.P?a.R.W(a.P):a.O.N.W(a.M))}function ab(a){if("undefined"===typeof FinalizationGroup)return ab=function(b){return b},a;Ya=new FinalizationGroup(function(b){for(var c=b.next();!c.done;c=b.next())c=c.value,c.M?$a(c):console.warn("object already deleted: "+c.M)});ab=function(b){Ya.register(b,b.L,b.L);return b};Za=function(b){Ya.unregister(b.L)};return ab(a)}
var bb=void 0,cb=[];function db(){for(;cb.length;){var a=cb.pop();a.L.X=!1;a["delete"]()}}function U(){}var eb={};function fb(a,b){var c=e;if(void 0===c[a].T){var d=c[a];c[a]=function(){c[a].T.hasOwnProperty(arguments.length)||S("Function '"+b+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+c[a].T+")!");return c[a].T[arguments.length].apply(this,arguments)};c[a].T=[];c[a].T[d.ia]=d}}
function gb(a,b,c){e.hasOwnProperty(a)?((void 0===c||void 0!==e[a].T&&void 0!==e[a].T[c])&&S("Cannot register public name '"+a+"' twice"),fb(a,a),e.hasOwnProperty(c)&&S("Cannot register multiple overloads of a function with the same number of arguments ("+c+")!"),e[a].T[c]=b):(e[a]=b,void 0!==c&&(e[a].ua=c))}function hb(a,b,c,d,f,g,q,h){this.name=a;this.constructor=b;this.V=c;this.W=d;this.S=f;this.ma=g;this.Z=q;this.ka=h}
function ib(a,b,c){for(;b!==c;)b.Z||S("Expected null or instance of "+c.name+", got an instance of "+b.name),a=b.Z(a),b=b.S;return a}function jb(a,b){if(null===b)return this.da&&S("null is not a valid "+this.name),0;b.L||S('Cannot pass "'+V(b)+'" as a '+this.name);b.L.M||S("Cannot pass deleted object as a pointer of type "+this.name);return ib(b.L.M,b.L.O.N,this.N)}
function kb(a,b){if(null===b){this.da&&S("null is not a valid "+this.name);if(this.aa){var c=this.qa();null!==a&&a.push(this.W,c);return c}return 0}b.L||S('Cannot pass "'+V(b)+'" as a '+this.name);b.L.M||S("Cannot pass deleted object as a pointer of type "+this.name);!this.$&&b.L.O.$&&S("Cannot convert argument of type "+(b.L.R?b.L.R.name:b.L.O.name)+" to parameter type "+this.name);c=ib(b.L.M,b.L.O.N,this.N);if(this.aa)switch(void 0===b.L.P&&S("Passing raw pointer to smart pointer is illegal"),this.sa){case 0:b.L.R===
this?c=b.L.P:S("Cannot convert argument of type "+(b.L.R?b.L.R.name:b.L.O.name)+" to parameter type "+this.name);break;case 1:c=b.L.P;break;case 2:if(b.L.R===this)c=b.L.P;else{var d=b.clone();c=this.ra(c,lb(function(){d["delete"]()}));null!==a&&a.push(this.W,c)}break;default:S("Unsupporting sharing policy")}return c}
function mb(a,b){if(null===b)return this.da&&S("null is not a valid "+this.name),0;b.L||S('Cannot pass "'+V(b)+'" as a '+this.name);b.L.M||S("Cannot pass deleted object as a pointer of type "+this.name);b.L.O.$&&S("Cannot convert argument of type "+b.L.O.name+" to parameter type "+this.name);return ib(b.L.M,b.L.O.N,this.N)}function ob(a){return this.fromWireType(L[a>>2])}function pb(a,b,c){if(b===c)return a;if(void 0===c.S)return null;a=pb(a,b,c.S);return null===a?null:c.ka(a)}var qb={};
function rb(a,b){for(void 0===b&&S("ptr should not be undefined");a.S;)b=a.Z(b),a=a.S;return qb[b]}function sb(a,b){b.O&&b.M||Ua("makeClassHandle requires ptr and ptrType");!!b.R!==!!b.P&&Ua("Both smartPtrType and smartPtr must be specified");b.count={value:1};return ab(Object.create(a,{L:{value:b}}))}function W(a,b,c,d){this.name=a;this.N=b;this.da=c;this.$=d;this.aa=!1;this.W=this.ra=this.qa=this.ha=this.sa=this.pa=void 0;void 0!==b.S?this.toWireType=kb:(this.toWireType=d?jb:mb,this.U=null)}
function tb(a,b,c){e.hasOwnProperty(a)||Ua("Replacing nonexistant public symbol");void 0!==e[a].T&&void 0!==c?e[a].T[c]=b:(e[a]=b,e[a].ia=c)}
function X(a,b){a=P(a);var c=e["dynCall_"+a];for(var d=[],f=1;f<a.length;++f)d.push("a"+f);f="return function dynCall_"+(a+"_"+b)+"("+d.join(", ")+") {\n";f+="    return dynCall(rawFunction"+(d.length?", ":"")+d.join(", ")+");\n";c=(new Function("dynCall","rawFunction",f+"};\n"))(c,b);"function"!==typeof c&&S("unknown function pointer with signature "+a+": "+b);return c}var ub=void 0;function vb(a){a=wb(a);var b=P(a);Y(a);return b}
function xb(a,b){function c(g){f[g]||R[g]||(Oa[g]?Oa[g].forEach(c):(d.push(g),f[g]=!0))}var d=[],f={};b.forEach(c);throw new ub(a+": "+d.map(vb).join([", "]));}function yb(a){for(;a.length;){var b=a.pop();a.pop()(b)}}function zb(a,b,c){a instanceof Object||S(c+' with invalid "this": '+a);a instanceof b.N.constructor||S(c+' incompatible with "this" of type '+a.constructor.name);a.L.M||S("cannot call emscripten binding method "+c+" on deleted object");return ib(a.L.M,a.L.O.N,b.N)}
var Ab=[],Z=[{},{value:void 0},{value:null},{value:!0},{value:!1}];function Bb(a){4<a&&0===--Z[a].ea&&(Z[a]=void 0,Ab.push(a))}function lb(a){switch(a){case void 0:return 1;case null:return 2;case !0:return 3;case !1:return 4;default:var b=Ab.length?Ab.pop():Z.length;Z[b]={ea:1,value:a};return b}}function V(a){if(null===a)return"null";var b=typeof a;return"object"===b||"array"===b||"function"===b?a.toString():""+a}
function Cb(a,b){switch(b){case 2:return function(c){return this.fromWireType(wa[c>>2])};case 3:return function(c){return this.fromWireType(xa[c>>3])};default:throw new TypeError("Unknown float type: "+a);}}function Db(a){var b=Function;if(!(b instanceof Function))throw new TypeError("new_ called with constructor type "+typeof b+" which is not a function");var c=Qa(b.name||"unknownFunctionName",function(){});c.prototype=b.prototype;c=new c;a=b.apply(c,a);return a instanceof Object?a:c}
function Eb(a,b){for(var c=[],d=0;d<a;d++)c.push(J[(b>>2)+d]);return c}function Fb(a,b,c){switch(b){case 0:return c?function(d){return ua[d]}:function(d){return H[d]};case 1:return c?function(d){return I[d>>1]}:function(d){return va[d>>1]};case 2:return c?function(d){return J[d>>2]}:function(d){return L[d>>2]};default:throw new TypeError("Unknown integer type: "+a);}}for(var Gb=Array(256),Hb=0;256>Hb;++Hb)Gb[Hb]=String.fromCharCode(Hb);Na=Gb;Sa=e.BindingError=Ra("BindingError");
Ta=e.InternalError=Ra("InternalError");U.prototype.isAliasOf=function(a){if(!(this instanceof U&&a instanceof U))return!1;var b=this.L.O.N,c=this.L.M,d=a.L.O.N;for(a=a.L.M;b.S;)c=b.Z(c),b=b.S;for(;d.S;)a=d.Z(a),d=d.S;return b===d&&c===a};U.prototype.clone=function(){this.L.M||Xa(this);if(this.L.Y)return this.L.count.value+=1,this;var a=ab(Object.create(Object.getPrototypeOf(this),{L:{value:Wa(this.L)}}));a.L.count.value+=1;a.L.X=!1;return a};
U.prototype["delete"]=function(){this.L.M||Xa(this);this.L.X&&!this.L.Y&&S("Object already scheduled for deletion");Za(this);$a(this.L);this.L.Y||(this.L.P=void 0,this.L.M=void 0)};U.prototype.isDeleted=function(){return!this.L.M};U.prototype.deleteLater=function(){this.L.M||Xa(this);this.L.X&&!this.L.Y&&S("Object already scheduled for deletion");cb.push(this);1===cb.length&&bb&&bb(db);this.L.X=!0;return this};W.prototype.na=function(a){this.ha&&(a=this.ha(a));return a};
W.prototype.ga=function(a){this.W&&this.W(a)};W.prototype.argPackAdvance=8;W.prototype.readValueFromPointer=ob;W.prototype.deleteObject=function(a){if(null!==a)a["delete"]()};
W.prototype.fromWireType=function(a){function b(){return this.aa?sb(this.N.V,{O:this.pa,M:c,R:this,P:a}):sb(this.N.V,{O:this,M:a})}var c=this.na(a);if(!c)return this.ga(a),null;var d=rb(this.N,c);if(void 0!==d){if(0===d.L.count.value)return d.L.M=c,d.L.P=a,d.clone();d=d.clone();this.ga(a);return d}d=this.N.ma(c);d=eb[d];if(!d)return b.call(this);d=this.$?d.ja:d.pointerType;var f=pb(c,this.N,d.N);return null===f?b.call(this):this.aa?sb(d.N.V,{O:d,M:f,R:this,P:a}):sb(d.N.V,{O:d,M:f})};
e.getInheritedInstanceCount=function(){return Object.keys(qb).length};e.getLiveInheritedInstances=function(){var a=[],b;for(b in qb)qb.hasOwnProperty(b)&&a.push(qb[b]);return a};e.flushPendingDeletes=db;e.setDelayFunction=function(a){bb=a;cb.length&&bb&&bb(db)};ub=e.UnboundTypeError=Ra("UnboundTypeError");e.count_emval_handles=function(){for(var a=0,b=5;b<Z.length;++b)void 0!==Z[b]&&++a;return a};e.get_first_emval=function(){for(var a=5;a<Z.length;++a)if(void 0!==Z[a])return Z[a];return null};
var Jb={j:function(a,b,c,d,f){var g=Ma(c);b=P(b);T(a,{name:b,fromWireType:function(q){return!!q},toWireType:function(q,h){return h?d:f},argPackAdvance:8,readValueFromPointer:function(q){if(1===c)var h=ua;else if(2===c)h=I;else if(4===c)h=J;else throw new TypeError("Unknown boolean type size: "+b);return this.fromWireType(h[q>>g])},U:null})},n:function(a,b,c,d,f,g,q,h,l,m,k,p,t){k=P(k);g=X(f,g);h&&(h=X(q,h));m&&(m=X(l,m));t=X(p,t);var v=Pa(k);gb(v,function(){xb("Cannot construct "+k+" due to unbound types",
[d])});Va([a,b,c],d?[d]:[],function(n){n=n[0];if(d){var u=n.N;var x=u.V}else x=U.prototype;n=Qa(v,function(){if(Object.getPrototypeOf(this)!==y)throw new Sa("Use 'new' to construct "+k);if(void 0===C.fa)throw new Sa(k+" has no accessible constructor");var nb=C.fa[arguments.length];if(void 0===nb)throw new Sa("Tried to invoke ctor of "+k+" with invalid number of parameters ("+arguments.length+") - expected ("+Object.keys(C.fa).toString()+") parameters instead!");return nb.apply(this,arguments)});var y=
Object.create(x,{constructor:{value:n}});n.prototype=y;var C=new hb(k,n,y,t,u,g,h,m);u=new W(k,C,!0,!1);x=new W(k+"*",C,!1,!1);var fa=new W(k+" const*",C,!1,!0);eb[a]={pointerType:x,ja:fa};tb(v,n);return[u,x,fa]})},d:function(a,b,c,d,f,g,q,h,l,m){b=P(b);f=X(d,f);Va([],[a],function(k){k=k[0];var p=k.name+"."+b,t={get:function(){xb("Cannot access "+p+" due to unbound types",[c,q])},enumerable:!0,configurable:!0};l?t.set=function(){xb("Cannot access "+p+" due to unbound types",[c,q])}:t.set=function(){S(p+
" is a read-only property")};Object.defineProperty(k.N.V,b,t);Va([],l?[c,q]:[c],function(v){var n=v[0],u={get:function(){var y=zb(this,k,p+" getter");return n.fromWireType(f(g,y))},enumerable:!0};if(l){l=X(h,l);var x=v[1];u.set=function(y){var C=zb(this,k,p+" setter"),fa=[];l(m,C,x.toWireType(fa,y));yb(fa)}}Object.defineProperty(k.N.V,b,u);return[]});return[]})},r:function(a,b){b=P(b);T(a,{name:b,fromWireType:function(c){var d=Z[c].value;Bb(c);return d},toWireType:function(c,d){return lb(d)},argPackAdvance:8,
readValueFromPointer:ob,U:null})},g:function(a,b,c){c=Ma(c);b=P(b);T(a,{name:b,fromWireType:function(d){return d},toWireType:function(d,f){if("number"!==typeof f&&"boolean"!==typeof f)throw new TypeError('Cannot convert "'+V(f)+'" to '+this.name);return f},argPackAdvance:8,readValueFromPointer:Cb(b,c),U:null})},c:function(a,b,c,d,f,g){var q=Eb(b,c);a=P(a);f=X(d,f);gb(a,function(){xb("Cannot call "+a+" due to unbound types",q)},b-1);Va([],q,function(h){var l=[h[0],null].concat(h.slice(1)),m=h=a,k=
f,p=l.length;2>p&&S("argTypes array size mismatch! Must at least get return value and 'this' types!");for(var t=null!==l[1]&&!1,v=!1,n=1;n<l.length;++n)if(null!==l[n]&&void 0===l[n].U){v=!0;break}var u="void"!==l[0].name,x="",y="";for(n=0;n<p-2;++n)x+=(0!==n?", ":"")+"arg"+n,y+=(0!==n?", ":"")+"arg"+n+"Wired";m="return function "+Pa(m)+"("+x+") {\nif (arguments.length !== "+(p-2)+") {\nthrowBindingError('function "+m+" called with ' + arguments.length + ' arguments, expected "+(p-2)+" args!');\n}\n";
v&&(m+="var destructors = [];\n");var C=v?"destructors":"null";x="throwBindingError invoker fn runDestructors retType classParam".split(" ");k=[S,k,g,yb,l[0],l[1]];t&&(m+="var thisWired = classParam.toWireType("+C+", this);\n");for(n=0;n<p-2;++n)m+="var arg"+n+"Wired = argType"+n+".toWireType("+C+", arg"+n+"); // "+l[n+2].name+"\n",x.push("argType"+n),k.push(l[n+2]);t&&(y="thisWired"+(0<y.length?", ":"")+y);m+=(u?"var rv = ":"")+"invoker(fn"+(0<y.length?", ":"")+y+");\n";if(v)m+="runDestructors(destructors);\n";
else for(n=t?1:2;n<l.length;++n)p=1===n?"thisWired":"arg"+(n-2)+"Wired",null!==l[n].U&&(m+=p+"_dtor("+p+"); // "+l[n].name+"\n",x.push(p+"_dtor"),k.push(l[n].U));u&&(m+="var ret = retType.fromWireType(rv);\nreturn ret;\n");x.push(m+"}\n");l=Db(x).apply(null,k);tb(h,l,b-1);return[]})},b:function(a,b,c,d,f){function g(m){return m}b=P(b);-1===f&&(f=4294967295);var q=Ma(c);if(0===d){var h=32-8*c;g=function(m){return m<<h>>>h}}var l=-1!=b.indexOf("unsigned");T(a,{name:b,fromWireType:g,toWireType:function(m,
k){if("number"!==typeof k&&"boolean"!==typeof k)throw new TypeError('Cannot convert "'+V(k)+'" to '+this.name);if(k<d||k>f)throw new TypeError('Passing a number "'+V(k)+'" from JS side to C/C++ side to an argument of type "'+b+'", which is outside the valid range ['+d+", "+f+"]!");return l?k>>>0:k|0},argPackAdvance:8,readValueFromPointer:Fb(b,q,0!==d),U:null})},a:function(a,b,c){function d(g){g>>=2;var q=L;return new f(K,q[g+1],q[g])}var f=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,
Float32Array,Float64Array][b];c=P(c);T(a,{name:c,fromWireType:d,argPackAdvance:8,readValueFromPointer:d},{oa:!0})},f:function(a,b){b=P(b);var c="std::string"===b;T(a,{name:b,fromWireType:function(d){var f=L[d>>2];if(c){var g=H[d+4+f],q=0;0!=g&&(q=g,H[d+4+f]=0);var h=d+4;for(g=0;g<=f;++g){var l=d+4+g;if(0==H[l]){if(h){for(var m=H,k=h+NaN,p=h;m[p]&&!(p>=k);)++p;if(16<p-h&&m.subarray&&la)h=la.decode(m.subarray(h,p));else{for(k="";h<p;){var t=m[h++];if(t&128){var v=m[h++]&63;if(192==(t&224))k+=String.fromCharCode((t&
31)<<6|v);else{var n=m[h++]&63;t=224==(t&240)?(t&15)<<12|v<<6|n:(t&7)<<18|v<<12|n<<6|m[h++]&63;65536>t?k+=String.fromCharCode(t):(t-=65536,k+=String.fromCharCode(55296|t>>10,56320|t&1023))}}else k+=String.fromCharCode(t)}h=k}}else h="";if(void 0===u)var u=h;else u+=String.fromCharCode(0),u+=h;h=l+1}}0!=q&&(H[d+4+f]=q)}else{u=Array(f);for(g=0;g<f;++g)u[g]=String.fromCharCode(H[d+4+g]);u=u.join("")}Y(d);return u},toWireType:function(d,f){f instanceof ArrayBuffer&&(f=new Uint8Array(f));var g="string"===
typeof f;g||f instanceof Uint8Array||f instanceof Uint8ClampedArray||f instanceof Int8Array||S("Cannot pass non-string to std::string");var q=(c&&g?function(){for(var m=0,k=0;k<f.length;++k){var p=f.charCodeAt(k);55296<=p&&57343>=p&&(p=65536+((p&1023)<<10)|f.charCodeAt(++k)&1023);127>=p?++m:m=2047>=p?m+2:65535>=p?m+3:m+4}return m}:function(){return f.length})(),h=Ib(4+q+1);L[h>>2]=q;if(c&&g)ma(f,h+4,q+1);else if(g)for(g=0;g<q;++g){var l=f.charCodeAt(g);255<l&&(Y(h),S("String has UTF-16 code units that do not fit in 8 bits"));
H[h+4+g]=l}else for(g=0;g<q;++g)H[h+4+g]=f[g];null!==d&&d.push(Y,h);return h},argPackAdvance:8,readValueFromPointer:ob,U:function(d){Y(d)}})},e:function(a,b,c){c=P(c);if(2===b){var d=oa;var f=pa;var g=qa;var q=function(){return va};var h=1}else 4===b&&(d=ra,f=sa,g=ta,q=function(){return L},h=2);T(a,{name:c,fromWireType:function(l){var m=L[l>>2],k=q(),p=k[l+4+m*b>>h],t=0;0!=p&&(t=p,k[l+4+m*b>>h]=0);var v=l+4;for(p=0;p<=m;++p){var n=l+4+p*b;if(0==k[n>>h]){v=d(v);if(void 0===u)var u=v;else u+=String.fromCharCode(0),
u+=v;v=n+b}}0!=t&&(k[l+4+m*b>>h]=t);Y(l);return u},toWireType:function(l,m){"string"!==typeof m&&S("Cannot pass non-string to C++ string type "+c);var k=g(m),p=Ib(4+k+b);L[p>>2]=k>>h;f(m,p+4,k+b);null!==l&&l.push(Y,p);return p},argPackAdvance:8,readValueFromPointer:ob,U:function(l){Y(l)}})},k:function(a,b){b=P(b);T(a,{ta:!0,name:b,argPackAdvance:0,fromWireType:function(){},toWireType:function(){}})},h:Bb,m:function(a){4<a&&(Z[a].ea+=1)},i:function(a,b){var c=R[a];void 0===c&&S("_emval_take_value has unknown type "+
vb(a));a=c.readValueFromPointer(b);return lb(a)},l:function(){D()},p:function(a,b,c){H.copyWithin(a,b,b+c)},q:function(a){var b=H.length;if(2147418112<a)return!1;for(var c=1;4>=c;c*=2){var d=b*(1+.2/c);d=Math.min(d,a+100663296);d=Math.max(16777216,a,d);0<d%65536&&(d+=65536-d%65536);a:{try{G.grow(Math.min(2147418112,d)-K.byteLength+65535>>16);ya(G.buffer);var f=1;break a}catch(g){}f=void 0}if(f)return!0}return!1},memory:G,o:function(){},table:ja},Kb=function(){function a(f){e.asm=f.exports;M--;e.monitorRunDependencies&&
e.monitorRunDependencies(M);0==M&&(null!==Ga&&(clearInterval(Ga),Ga=null),N&&(f=N,N=null,f()))}function b(f){a(f.instance)}function c(f){return Ka().then(function(g){return WebAssembly.instantiate(g,d)}).then(f,function(g){E("failed to asynchronously prepare wasm: "+g);D(g)})}var d={a:Jb};M++;e.monitorRunDependencies&&e.monitorRunDependencies(M);if(e.instantiateWasm)try{return e.instantiateWasm(d,a)}catch(f){return E("Module.instantiateWasm callback failed with error: "+f),!1}(function(){if(F||"function"!==
typeof WebAssembly.instantiateStreaming||Ha()||"function"!==typeof fetch)return c(b);fetch(O,{credentials:"same-origin"}).then(function(f){return WebAssembly.instantiateStreaming(f,d).then(b,function(g){E("wasm streaming compile failed: "+g);E("falling back to ArrayBuffer instantiation");c(b)})})})();return{}}();e.asm=Kb;
var La=e.___wasm_call_ctors=function(){return(La=e.___wasm_call_ctors=e.asm.s).apply(null,arguments)},Y=e._free=function(){return(Y=e._free=e.asm.t).apply(null,arguments)},Ib=e._malloc=function(){return(Ib=e._malloc=e.asm.u).apply(null,arguments)},wb=e.___getTypeName=function(){return(wb=e.___getTypeName=e.asm.v).apply(null,arguments)};e.___embind_register_native_and_builtin_types=function(){return(e.___embind_register_native_and_builtin_types=e.asm.w).apply(null,arguments)};
e.dynCall_ii=function(){return(e.dynCall_ii=e.asm.x).apply(null,arguments)};e.dynCall_vi=function(){return(e.dynCall_vi=e.asm.y).apply(null,arguments)};e.dynCall_iii=function(){return(e.dynCall_iii=e.asm.z).apply(null,arguments)};e.dynCall_viii=function(){return(e.dynCall_viii=e.asm.A).apply(null,arguments)};e.dynCall_vii=function(){return(e.dynCall_vii=e.asm.B).apply(null,arguments)};e.dynCall_i=function(){return(e.dynCall_i=e.asm.C).apply(null,arguments)};
e.dynCall_v=function(){return(e.dynCall_v=e.asm.D).apply(null,arguments)};e.dynCall_iiii=function(){return(e.dynCall_iiii=e.asm.E).apply(null,arguments)};e.dynCall_iiiiiii=function(){return(e.dynCall_iiiiiii=e.asm.F).apply(null,arguments)};e.dynCall_viiii=function(){return(e.dynCall_viiii=e.asm.G).apply(null,arguments)};e.dynCall_viiiiii=function(){return(e.dynCall_viiiiii=e.asm.H).apply(null,arguments)};e.dynCall_viiiii=function(){return(e.dynCall_viiiii=e.asm.I).apply(null,arguments)};
e.dynCall_viiiiiiiii=function(){return(e.dynCall_viiiiiiiii=e.asm.J).apply(null,arguments)};e.dynCall_jiiii=function(){return(e.dynCall_jiiii=e.asm.K).apply(null,arguments)};e.asm=Kb;var Lb;e.then=function(a){if(Lb)a(e);else{var b=e.onRuntimeInitialized;e.onRuntimeInitialized=function(){b&&b();a(e)}}return e};N=function Mb(){Lb||Nb();Lb||(N=Mb)};
function Nb(){function a(){if(!Lb&&(Lb=!0,e.calledRun=!0,!ka)){Aa(Ca);Aa(Da);if(e.onRuntimeInitialized)e.onRuntimeInitialized();if(e.postRun)for("function"==typeof e.postRun&&(e.postRun=[e.postRun]);e.postRun.length;){var b=e.postRun.shift();Ea.unshift(b)}Aa(Ea)}}if(!(0<M)){if(e.preRun)for("function"==typeof e.preRun&&(e.preRun=[e.preRun]);e.preRun.length;)Fa();Aa(Ba);0<M||(e.setStatus?(e.setStatus("Running..."),setTimeout(function(){setTimeout(function(){e.setStatus("")},1);a()},1)):a())}}
e.run=Nb;if(e.preInit)for("function"==typeof e.preInit&&(e.preInit=[e.preInit]);0<e.preInit.length;)e.preInit.pop()();noExitRuntime=!0;Nb();


  return webp_dec
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
      module.exports = webp_dec;
    else if (typeof define === 'function' && define['amd'])
      define([], function() { return webp_dec; });
    else if (typeof exports === 'object')
      exports["webp_dec"] = webp_dec;
    