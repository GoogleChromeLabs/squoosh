
var wp2_enc_mt_simd = (function() {
  var _scriptDir = import.meta.url;
  
  return (
function(wp2_enc_mt_simd) {
  wp2_enc_mt_simd = wp2_enc_mt_simd || {};


function e(){k.buffer!=m&&p(k.buffer);return aa}function u(){k.buffer!=m&&p(k.buffer);return ca}function w(){k.buffer!=m&&p(k.buffer);return da}function ea(){k.buffer!=m&&p(k.buffer);return fa}function y(){k.buffer!=m&&p(k.buffer);return ha}function z(){k.buffer!=m&&p(k.buffer);return ia}function ja(){k.buffer!=m&&p(k.buffer);return ka}function la(){k.buffer!=m&&p(k.buffer);return ma}var A;A||(A=typeof wp2_enc_mt_simd !== 'undefined' ? wp2_enc_mt_simd : {});var na,oa;
A.ready=new Promise(function(a,b){na=a;oa=b});var B={},C;for(C in A)A.hasOwnProperty(C)&&(B[C]=A[C]);var D=A.ENVIRONMENT_IS_PTHREAD||!1;D&&(m=A.buffer);var F="";function qa(a){return A.locateFile?A.locateFile(a,F):F+a}var ra;F=self.location.href;_scriptDir&&(F=_scriptDir);0!==F.indexOf("blob:")?F=F.substr(0,F.lastIndexOf("/")+1):F="";ra=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)};
var sa=A.print||console.log.bind(console),H=A.printErr||console.warn.bind(console);for(C in B)B.hasOwnProperty(C)&&(A[C]=B[C]);B=null;var I;A.wasmBinary&&(I=A.wasmBinary);var noExitRuntime;A.noExitRuntime&&(noExitRuntime=A.noExitRuntime);"object"!==typeof WebAssembly&&J("no native wasm support detected");var k,ta,threadInfoStruct=0,selfThreadId=0,ua=!1;function va(a,b){a||J("Assertion failed: "+b)}
function wa(a,b,c){c=b+c;for(var d="";!(b>=c);){var f=a[b++];if(!f)break;if(f&128){var g=a[b++]&63;if(192==(f&224))d+=String.fromCharCode((f&31)<<6|g);else{var l=a[b++]&63;f=224==(f&240)?(f&15)<<12|g<<6|l:(f&7)<<18|g<<12|l<<6|a[b++]&63;65536>f?d+=String.fromCharCode(f):(f-=65536,d+=String.fromCharCode(55296|f>>10,56320|f&1023))}}else d+=String.fromCharCode(f)}return d}function K(a,b){return a?wa(u(),a,b):""}
function xa(a,b,c){var d=u();if(0<c){c=b+c-1;for(var f=0;f<a.length;++f){var g=a.charCodeAt(f);if(55296<=g&&57343>=g){var l=a.charCodeAt(++f);g=65536+((g&1023)<<10)|l&1023}if(127>=g){if(b>=c)break;d[b++]=g}else{if(2047>=g){if(b+1>=c)break;d[b++]=192|g>>6}else{if(65535>=g){if(b+2>=c)break;d[b++]=224|g>>12}else{if(b+3>=c)break;d[b++]=240|g>>18;d[b++]=128|g>>12&63}d[b++]=128|g>>6&63}d[b++]=128|g&63}}d[b]=0}}
function ya(a){for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);55296<=d&&57343>=d&&(d=65536+((d&1023)<<10)|a.charCodeAt(++c)&1023);127>=d?++b:b=2047>=d?b+2:65535>=d?b+3:b+4}return b}function za(a,b){for(var c=0,d="";;){var f=w()[a+2*c>>1];if(0==f||c==b/2)return d;++c;d+=String.fromCharCode(f)}}function Aa(a,b,c){void 0===c&&(c=2147483647);if(2>c)return 0;c-=2;var d=b;c=c<2*a.length?c/2:a.length;for(var f=0;f<c;++f){var g=a.charCodeAt(f);w()[b>>1]=g;b+=2}w()[b>>1]=0;return b-d}
function Ba(a){return 2*a.length}function Ca(a,b){for(var c=0,d="";!(c>=b/4);){var f=y()[a+4*c>>2];if(0==f)break;++c;65536<=f?(f-=65536,d+=String.fromCharCode(55296|f>>10,56320|f&1023)):d+=String.fromCharCode(f)}return d}function Da(a,b,c){void 0===c&&(c=2147483647);if(4>c)return 0;var d=b;c=d+c-4;for(var f=0;f<a.length;++f){var g=a.charCodeAt(f);if(55296<=g&&57343>=g){var l=a.charCodeAt(++f);g=65536+((g&1023)<<10)|l&1023}y()[b>>2]=g;b+=4;if(b+4>c)break}y()[b>>2]=0;return b-d}
function Ea(a){for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);55296<=d&&57343>=d&&++c;b+=4}return b}var m,aa,ca,da,fa,ha,ia,ka,ma;function p(a){m=a;A.HEAP8=aa=new Int8Array(a);A.HEAP16=da=new Int16Array(a);A.HEAP32=ha=new Int32Array(a);A.HEAPU8=ca=new Uint8Array(a);A.HEAPU16=fa=new Uint16Array(a);A.HEAPU32=ia=new Uint32Array(a);A.HEAPF32=ka=new Float32Array(a);A.HEAPF64=ma=new Float64Array(a)}var Fa=A.INITIAL_MEMORY||16777216;
if(D)k=A.wasmMemory,m=A.buffer;else if(A.wasmMemory)k=A.wasmMemory;else if(k=new WebAssembly.Memory({initial:Fa/65536,maximum:32768,shared:!0}),!(k.buffer instanceof SharedArrayBuffer))throw H("requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag"),Error("bad memory");k&&(m=k.buffer);Fa=m.byteLength;p(m);var L,Ga=[],Ha=[],Ia=[],Ja=[];
function Ka(){var a=A.preRun.shift();Ga.unshift(a)}var N=0,La=null,O=null;A.preloadedImages={};A.preloadedAudios={};function J(a){if(A.onAbort)A.onAbort(a);D&&console.error("Pthread aborting at "+Error().stack);H(a);ua=!0;a=new WebAssembly.RuntimeError("abort("+a+"). Build with -s ASSERTIONS=1 for more info.");oa(a);throw a;}function Ma(){var a=P;return String.prototype.startsWith?a.startsWith("data:application/octet-stream;base64,"):0===a.indexOf("data:application/octet-stream;base64,")}var P="wp2_enc_mt_simd.wasm";
Ma()||(P=qa(P));function Na(){try{if(I)return new Uint8Array(I);if(ra)return ra(P);throw"both async and sync fetching of the wasm failed";}catch(a){J(a)}}function Oa(){return I||"function"!==typeof fetch?Promise.resolve().then(Na):fetch(P,{credentials:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+P+"'";return a.arrayBuffer()}).catch(function(){return Na()})}var Qa={125045:function(a,b){setTimeout(function(){Pa(a,b)},0)},125123:function(){throw"Canceled!";}};
function Ra(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b(A);else{var c=b.ob;"number"===typeof c?void 0===b.Ma?L.get(c)():L.get(c)(b.Ma):c(void 0===b.Ma?null:b.Ma)}}}function Sa(a,b,c){var d;-1!=a.indexOf("j")?d=c&&c.length?A["dynCall_"+a].apply(null,[b].concat(c)):A["dynCall_"+a].call(null,b):d=L.get(b).apply(null,c);return d}A.dynCall=Sa;var Q=0,Ta=0,Ua=0;function Va(a,b,c){Q=a|0;Ua=b|0;Ta=c|0}A.registerPthreadPtr=Va;
function Wa(a,b){if(0>=a||a>e().length||a&1||0>b)return-28;if(0==b)return 0;2147483647<=b&&(b=Infinity);var c=Atomics.load(y(),R.eb>>2),d=0;if(c==a&&Atomics.compareExchange(y(),R.eb>>2,c,0)==c&&(--b,d=1,0>=b))return 1;a=Atomics.notify(y(),a>>2,b);if(0<=a)return a+d;throw"Atomics.notify returned an unexpected value "+a;}A._emscripten_futex_wake=Wa;
function Xa(a){if(D)throw"Internal Error! cleanupThread() can only ever be called from main application thread!";if(!a)throw"Internal Error! Null pthread_ptr in cleanupThread!";y()[a+12>>2]=0;(a=R.Ga[a])&&R.Sa(a.worker)}
var R={Rb:1,Yb:{hb:0,ib:0},Ea:[],Ia:[],wb:function(){for(var a=navigator.hardwareConcurrency,b=0;b<a;++b)R.Ya()},xb:function(){R.Ca=S(232);for(var a=0;58>a;++a)z()[R.Ca/4+a]=0;y()[R.Ca+12>>2]=R.Ca;a=R.Ca+156;y()[a>>2]=a;var b=S(512);for(a=0;128>a;++a)z()[b/4+a]=0;Atomics.store(z(),R.Ca+104>>2,b);Atomics.store(z(),R.Ca+40>>2,R.Ca);Atomics.store(z(),R.Ca+44>>2,42);R.bb();Va(R.Ca,!1,1);Ya(R.Ca)},yb:function(){R.bb();na(A);R.receiveObjectTransfer=R.Db;R.setThreadStatus=R.Eb;R.threadCancel=R.Ob;R.threadExit=
R.Pb},bb:function(){R.eb=Za},Ga:{},Xa:[],Eb:function(){},gb:function(){for(;0<R.Xa.length;)R.Xa.pop()();D&&threadInfoStruct&&$a()},Pb:function(a){var b=Q|0;b&&(Atomics.store(z(),b+4>>2,a),Atomics.store(z(),b+0>>2,1),Atomics.store(z(),b+60>>2,1),Atomics.store(z(),b+64>>2,0),R.gb(),Wa(b+0,2147483647),Va(0,0,0),threadInfoStruct=0,D&&postMessage({cmd:"exit"}))},Ob:function(){R.gb();Atomics.store(z(),threadInfoStruct+4>>2,-1);Atomics.store(z(),threadInfoStruct+0>>2,1);Wa(threadInfoStruct+0,2147483647);
threadInfoStruct=selfThreadId=0;Va(0,0,0);postMessage({cmd:"cancelDone"})},ec:function(){for(var a in R.Ga){var b=R.Ga[a];b&&b.worker&&R.Sa(b.worker)}R.Ga={};for(a=0;a<R.Ea.length;++a){var c=R.Ea[a];c.terminate()}R.Ea=[];for(a=0;a<R.Ia.length;++a)c=R.Ia[a],b=c.Da,R.Va(b),c.terminate();R.Ia=[]},Va:function(a){if(a){if(a.threadInfoStruct){var b=y()[a.threadInfoStruct+104>>2];y()[a.threadInfoStruct+104>>2]=0;T(b);T(a.threadInfoStruct)}a.threadInfoStruct=0;a.Ta&&a.Ja&&T(a.Ja);a.Ja=0;a.worker&&(a.worker.Da=
null)}},Sa:function(a){delete R.Ga[a.Da.jb];R.Ea.push(a);R.Ia.splice(R.Ia.indexOf(a),1);R.Va(a.Da);a.Da=void 0},Db:function(){},cb:function(a,b){a.onmessage=function(c){var d=c.data,f=d.cmd;a.Da&&(R.Ua=a.Da.threadInfoStruct);if(d.targetThread&&d.targetThread!=(Q|0)){var g=R.Ga[d.dc];g?g.worker.postMessage(c.data,d.transferList):console.error('Internal error! Worker sent a message "'+f+'" to target pthread '+d.targetThread+", but that thread no longer exists!")}else if("processQueuedMainThreadWork"===
f)ab();else if("spawnThread"===f)bb(c.data);else if("cleanupThread"===f)Xa(d.thread);else if("killThread"===f){c=d.thread;if(D)throw"Internal Error! killThread() can only ever be called from main application thread!";if(!c)throw"Internal Error! Null pthread_ptr in killThread!";y()[c+12>>2]=0;c=R.Ga[c];c.worker.terminate();R.Va(c);R.Ia.splice(R.Ia.indexOf(c.worker),1);c.worker.Da=void 0}else if("cancelThread"===f){c=d.thread;if(D)throw"Internal Error! cancelThread() can only ever be called from main application thread!";
if(!c)throw"Internal Error! Null pthread_ptr in cancelThread!";R.Ga[c].worker.postMessage({cmd:"cancel"})}else"loaded"===f?(a.loaded=!0,b&&b(a),a.Oa&&(a.Oa(),delete a.Oa)):"print"===f?sa("Thread "+d.threadId+": "+d.text):"printErr"===f?H("Thread "+d.threadId+": "+d.text):"alert"===f?alert("Thread "+d.threadId+": "+d.text):"exit"===f?a.Da&&Atomics.load(z(),a.Da.jb+68>>2)&&R.Sa(a):"cancelDone"===f?R.Sa(a):"objectTransfer"!==f&&("setimmediate"===c.data.target?a.postMessage(c.data):H("worker sent an unknown command "+
f));R.Ua=void 0};a.onerror=function(c){H("pthread sent an error! "+c.filename+":"+c.lineno+": "+c.message)};a.postMessage({cmd:"load",urlOrBlob:A.mainScriptUrlOrBlob||_scriptDir,wasmMemory:k,wasmModule:ta})},Ya:function(){var a=qa("wp2_enc_mt_simd.worker.js");R.Ea.push(new Worker(a))},pb:function(){0==R.Ea.length&&(R.Ya(),R.cb(R.Ea[0]));return 0<R.Ea.length?R.Ea.pop():null},Sb:function(a){for(a=performance.now()+a;performance.now()<a;);}};A.establishStackSpace=function(a){cb(a)};
A.getNoExitRuntime=function(){return noExitRuntime};var db;db=D?function(){return performance.now()-A.__performance_now_clock_drift}:function(){return performance.now()};function eb(a,b){R.Xa.push(function(){L.get(a)(b)})}
function fb(a){this.Na=a-16;this.Jb=function(b){y()[this.Na+8>>2]=b};this.Gb=function(b){y()[this.Na+0>>2]=b};this.Hb=function(){y()[this.Na+4>>2]=0};this.Fb=function(){var b=0;e()[this.Na+12>>0]=b};this.Ib=function(){var b=0;e()[this.Na+13>>0]=b};this.ub=function(b,c){this.Jb(b);this.Gb(c);this.Hb();this.Fb();this.Ib()}}function gb(){return 0<gb.kb}var hb={};function ib(a){for(;a.length;){var b=a.pop();a.pop()(b)}}function jb(a){return this.fromWireType(z()[a>>2])}var U={},V={},kb={};
function lb(a){if(void 0===a)return"_unknown";a=a.replace(/[^a-zA-Z0-9_]/g,"$");var b=a.charCodeAt(0);return 48<=b&&57>=b?"_"+a:a}function mb(a,b){a=lb(a);return(new Function("body","return function "+a+'() {\n    "use strict";    return body.apply(this, arguments);\n};\n'))(b)}
function nb(a){var b=Error,c=mb(a,function(d){this.name=a;this.message=d;d=Error(d).stack;void 0!==d&&(this.stack=this.toString()+"\n"+d.replace(/^Error(:[^\n]*)?\n/,""))});c.prototype=Object.create(b.prototype);c.prototype.constructor=c;c.prototype.toString=function(){return void 0===this.message?this.name:this.name+": "+this.message};return c}var ob=void 0;
function pb(a,b,c){function d(h){h=c(h);if(h.length!==a.length)throw new ob("Mismatched type converter count");for(var n=0;n<a.length;++n)W(a[n],h[n])}a.forEach(function(h){kb[h]=b});var f=Array(b.length),g=[],l=0;b.forEach(function(h,n){V.hasOwnProperty(h)?f[n]=V[h]:(g.push(h),U.hasOwnProperty(h)||(U[h]=[]),U[h].push(function(){f[n]=V[h];++l;l===g.length&&d(f)}))});0===g.length&&d(f)}
function qb(a){switch(a){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+a);}}var rb=void 0;function X(a){for(var b="";u()[a];)b+=rb[u()[a++]];return b}var sb=void 0;function Y(a){throw new sb(a);}
function W(a,b,c){c=c||{};if(!("argPackAdvance"in b))throw new TypeError("registerType registeredInstance requires argPackAdvance");var d=b.name;a||Y('type "'+d+'" must have a positive integer typeid pointer');if(V.hasOwnProperty(a)){if(c.tb)return;Y("Cannot register type '"+d+"' twice")}V[a]=b;delete kb[a];U.hasOwnProperty(a)&&(b=U[a],delete U[a],b.forEach(function(f){f()}))}var tb=[],Z=[{},{value:void 0},{value:null},{value:!0},{value:!1}];
function ub(a){4<a&&0===--Z[a].Wa&&(Z[a]=void 0,tb.push(a))}function vb(a){switch(a){case void 0:return 1;case null:return 2;case !0:return 3;case !1:return 4;default:var b=tb.length?tb.pop():Z.length;Z[b]={Wa:1,value:a};return b}}function wb(a){if(null===a)return"null";var b=typeof a;return"object"===b||"array"===b||"function"===b?a.toString():""+a}
function xb(a,b){switch(b){case 2:return function(c){return this.fromWireType(ja()[c>>2])};case 3:return function(c){return this.fromWireType(la()[c>>3])};default:throw new TypeError("Unknown float type: "+a);}}function yb(a){var b=Function;if(!(b instanceof Function))throw new TypeError("new_ called with constructor type "+typeof b+" which is not a function");var c=mb(b.name||"unknownFunctionName",function(){});c.prototype=b.prototype;c=new c;a=b.apply(c,a);return a instanceof Object?a:c}
function zb(a,b){var c=A;if(void 0===c[a].Fa){var d=c[a];c[a]=function(){c[a].Fa.hasOwnProperty(arguments.length)||Y("Function '"+b+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+c[a].Fa+")!");return c[a].Fa[arguments.length].apply(this,arguments)};c[a].Fa=[];c[a].Fa[d.lb]=d}}
function Ab(a,b,c){A.hasOwnProperty(a)?((void 0===c||void 0!==A[a].Fa&&void 0!==A[a].Fa[c])&&Y("Cannot register public name '"+a+"' twice"),zb(a,a),A.hasOwnProperty(c)&&Y("Cannot register multiple overloads of a function with the same number of arguments ("+c+")!"),A[a].Fa[c]=b):(A[a]=b,void 0!==c&&(A[a].ac=c))}function Bb(a,b){for(var c=[],d=0;d<a;d++)c.push(y()[(b>>2)+d]);return c}
function Cb(a,b){va(0<=a.indexOf("j"),"getDynCaller should only be called with i64 sigs");var c=[];return function(){c.length=arguments.length;for(var d=0;d<arguments.length;d++)c[d]=arguments[d];return Sa(a,b,c)}}function Db(a,b){a=X(a);var c=-1!=a.indexOf("j")?Cb(a,b):L.get(b);"function"!==typeof c&&Y("unknown function pointer with signature "+a+": "+b);return c}var Eb=void 0;function Fb(a){a=Gb(a);var b=X(a);T(a);return b}
function Hb(a,b){function c(g){f[g]||V[g]||(kb[g]?kb[g].forEach(c):(d.push(g),f[g]=!0))}var d=[],f={};b.forEach(c);throw new Eb(a+": "+d.map(Fb).join([", "]));}function Ib(a,b,c){switch(b){case 0:return c?function(d){return e()[d]}:function(d){return u()[d]};case 1:return c?function(d){return w()[d>>1]}:function(d){return ea()[d>>1]};case 2:return c?function(d){return y()[d>>2]}:function(d){return z()[d>>2]};default:throw new TypeError("Unknown integer type: "+a);}}var Jb={};
function Kb(){return"object"===typeof globalThis?globalThis:Function("return this")()}function Lb(a,b){var c=V[a];void 0===c&&Y(b+" has unknown type "+Fb(a));return c}var Mb={};function Nb(a,b,c){if(0>=a||a>e().length||a&1)return-28;a=Atomics.wait(y(),a>>2,b,c);if("timed-out"===a)return-73;if("not-equal"===a)return-6;if("ok"===a)return 0;throw"Atomics.wait returned an unexpected value "+a;}
function Ob(a,b){for(var c=arguments.length-2,d=Pb(),f=Qb(8*c),g=f>>3,l=0;l<c;l++)la()[g+l]=arguments[2+l];c=Rb(a,c,f,b);cb(d);return c}var Sb=[],Tb=[],Ub=[0,"undefined"!==typeof document?document:0,"undefined"!==typeof window?window:0];function Vb(a){a=2<a?K(a):a;return Ub[a]||("undefined"!==typeof document?document.querySelector(a):void 0)}
function Wb(a,b,c){var d=Vb(a);if(!d)return-4;d.Ra&&(y()[d.Ra>>2]=b,y()[d.Ra+4>>2]=c);if(d.fb||!d.Ub)d.fb&&(d=d.fb),a=!1,d.Qa&&d.Qa.Pa&&(a=d.Qa.Pa.getParameter(2978),a=0===a[0]&&0===a[1]&&a[2]===d.width&&a[3]===d.height),d.width=b,d.height=c,a&&d.Qa.Pa.viewport(0,0,b,c);else{if(d.Ra){d=y()[d.Ra+8>>2];a=a?K(a):"";var f=Pb(),g=Qb(12),l=0;if(a){l=ya(a)+1;var h=S(l);xa(a,h,l);l=h}y()[g>>2]=l;y()[g+4>>2]=b;y()[g+8>>2]=c;Xb(0,d,657457152,0,l,g);cb(f);return 1}return-4}return 0}
function Yb(a,b,c){return D?Ob(1,1,a,b,c):Wb(a,b,c)}function Zb(a){var b=a.getExtension("ANGLE_instanced_arrays");b&&(a.vertexAttribDivisor=function(c,d){b.vertexAttribDivisorANGLE(c,d)},a.drawArraysInstanced=function(c,d,f,g){b.drawArraysInstancedANGLE(c,d,f,g)},a.drawElementsInstanced=function(c,d,f,g,l){b.drawElementsInstancedANGLE(c,d,f,g,l)})}
function $b(a){var b=a.getExtension("OES_vertex_array_object");b&&(a.createVertexArray=function(){return b.createVertexArrayOES()},a.deleteVertexArray=function(c){b.deleteVertexArrayOES(c)},a.bindVertexArray=function(c){b.bindVertexArrayOES(c)},a.isVertexArray=function(c){return b.isVertexArrayOES(c)})}function ac(a){var b=a.getExtension("WEBGL_draw_buffers");b&&(a.drawBuffers=function(c,d){b.drawBuffersWEBGL(c,d)})}
function bc(a){a||(a=cc);if(!a.vb){a.vb=!0;var b=a.Pa;Zb(b);$b(b);ac(b);b.Vb=b.getExtension("EXT_disjoint_timer_query");b.$b=b.getExtension("WEBGL_multi_draw");var c="OES_texture_float OES_texture_half_float OES_standard_derivatives OES_vertex_array_object WEBGL_compressed_texture_s3tc WEBGL_depth_texture OES_element_index_uint EXT_texture_filter_anisotropic EXT_frag_depth WEBGL_draw_buffers ANGLE_instanced_arrays OES_texture_float_linear OES_texture_half_float_linear EXT_blend_minmax EXT_shader_texture_lod EXT_texture_norm16 WEBGL_compressed_texture_pvrtc EXT_color_buffer_half_float WEBGL_color_buffer_float EXT_sRGB WEBGL_compressed_texture_etc1 EXT_disjoint_timer_query WEBGL_compressed_texture_etc WEBGL_compressed_texture_astc EXT_color_buffer_float WEBGL_compressed_texture_s3tc_srgb EXT_disjoint_timer_query_webgl2 WEBKIT_WEBGL_compressed_texture_pvrtc".split(" ");
(b.getSupportedExtensions()||[]).forEach(function(d){-1!=c.indexOf(d)&&b.getExtension(d)})}}var cc,dc=["default","low-power","high-performance"],ec=[null,[],[]];function fc(a){return D?Ob(2,1,a):0}function gc(a,b,c,d,f){if(D)return Ob(3,1,a,b,c,d,f)}function hc(a,b,c,d){if(D)return Ob(4,1,a,b,c,d);for(var f=0,g=0;g<c;g++){for(var l=y()[b+8*g>>2],h=y()[b+(8*g+4)>>2],n=0;n<h;n++){var r=u()[l+n],q=ec[a];0===r||10===r?((1===a?sa:H)(wa(q,0)),q.length=0):q.push(r)}f+=h}y()[d>>2]=f;return 0}
function bb(a){if(D)throw"Internal Error! spawnThread() can only ever be called from main application thread!";var b=R.pb();if(void 0!==b.Da)throw"Internal error!";if(!a.Ka)throw"Internal error, no pthread ptr!";R.Ia.push(b);for(var c=S(512),d=0;128>d;++d)y()[c+4*d>>2]=0;var f=a.Ja+a.La;d=R.Ga[a.Ka]={worker:b,Ja:a.Ja,La:a.La,Ta:a.Ta,jb:a.Ka,threadInfoStruct:a.Ka};var g=d.threadInfoStruct>>2;Atomics.store(z(),g,0);Atomics.store(z(),g+1,0);Atomics.store(z(),g+2,0);Atomics.store(z(),g+17,a.Za);Atomics.store(z(),
g+26,c);Atomics.store(z(),g+12,0);Atomics.store(z(),g+10,d.threadInfoStruct);Atomics.store(z(),g+11,42);Atomics.store(z(),g+27,a.La);Atomics.store(z(),g+21,a.La);Atomics.store(z(),g+20,f);Atomics.store(z(),g+29,f);Atomics.store(z(),g+30,a.Za);Atomics.store(z(),g+32,a.hb);Atomics.store(z(),g+33,a.ib);c=ic()+40;Atomics.store(z(),g+44,c);b.Da=d;var l={cmd:"run",start_routine:a.Nb,arg:a.Ma,threadInfoStruct:a.Ka,selfThreadId:a.Ka,parentThreadId:a.Ab,stackBase:a.Ja,stackSize:a.La};b.Oa=function(){l.time=
performance.now();b.postMessage(l,a.Qb)};b.loaded&&(b.Oa(),delete b.Oa)}function jc(){return Q|0}A._pthread_self=jc;
function kc(a,b){if(!a)return H("pthread_join attempted on a null thread pointer!"),71;if(D&&selfThreadId==a)return H("PThread "+a+" is attempting to join to itself!"),16;if(!D&&R.Ca==a)return H("Main thread "+a+" is attempting to join to itself!"),16;if(y()[a+12>>2]!==a)return H("pthread_join attempted on thread "+a+", which does not point to a valid thread, or does not exist anymore!"),71;if(Atomics.load(z(),a+68>>2))return H("Attempted to join thread "+a+", which was already detached!"),28;for(;;){var c=
Atomics.load(z(),a+0>>2);if(1==c)return c=Atomics.load(z(),a+4>>2),b&&(y()[b>>2]=c),Atomics.store(z(),a+68>>2,1),D?postMessage({cmd:"cleanupThread",thread:a}):Xa(a),0;if(D&&threadInfoStruct&&!Atomics.load(z(),threadInfoStruct+60>>2)&&2==Atomics.load(z(),threadInfoStruct+0>>2))throw"Canceled!";D||ab();Nb(a+0,c,D?100:1)}}D||R.wb();ob=A.InternalError=nb("InternalError");for(var lc=Array(256),mc=0;256>mc;++mc)lc[mc]=String.fromCharCode(mc);rb=lc;sb=A.BindingError=nb("BindingError");
A.count_emval_handles=function(){for(var a=0,b=5;b<Z.length;++b)void 0!==Z[b]&&++a;return a};A.get_first_emval=function(){for(var a=5;a<Z.length;++a)if(void 0!==Z[a])return Z[a];return null};Eb=A.UnboundTypeError=nb("UnboundTypeError");var nc=[null,Yb,fc,gc,hc];D||Ha.push({ob:function(){oc()}});
var rc={h:function(a,b,c,d){J("Assertion failed: "+K(a)+", at: "+[b?K(b):"unknown filename",c,d?K(d):"unknown function"])},Q:function(a){return S(a+16)+16},U:function(a,b){return eb(a,b)},P:function(a,b,c){(new fb(a)).ub(b,c);"uncaught_exception"in gb?gb.kb++:gb.kb=1;throw a;},y:function(a){var b=hb[a];delete hb[a];var c=b.Bb,d=b.Cb,f=b.ab,g=f.map(function(l){return l.sb}).concat(f.map(function(l){return l.Lb}));pb([a],g,function(l){var h={};f.forEach(function(n,r){var q=l[r],v=n.qb,x=n.rb,E=l[r+
f.length],t=n.Kb,pa=n.Mb;h[n.nb]={read:function(G){return q.fromWireType(v(x,G))},write:function(G,M){var ba=[];t(pa,G,E.toWireType(ba,M));ib(ba)}}});return[{name:b.name,fromWireType:function(n){var r={},q;for(q in h)r[q]=h[q].read(n);d(n);return r},toWireType:function(n,r){for(var q in h)if(!(q in r))throw new TypeError('Missing field:  "'+q+'"');var v=c();for(q in h)h[q].write(v,r[q]);null!==n&&n.push(d,v);return v},argPackAdvance:8,readValueFromPointer:jb,Ha:d}]})},N:function(a,b,c,d,f){var g=
qb(c);b=X(b);W(a,{name:b,fromWireType:function(l){return!!l},toWireType:function(l,h){return h?d:f},argPackAdvance:8,readValueFromPointer:function(l){if(1===c)var h=e();else if(2===c)h=w();else if(4===c)h=y();else throw new TypeError("Unknown boolean type size: "+b);return this.fromWireType(h[l>>g])},Ha:null})},M:function(a,b){b=X(b);W(a,{name:b,fromWireType:function(c){var d=Z[c].value;ub(c);return d},toWireType:function(c,d){return vb(d)},argPackAdvance:8,readValueFromPointer:jb,Ha:null})},u:function(a,
b,c){c=qb(c);b=X(b);W(a,{name:b,fromWireType:function(d){return d},toWireType:function(d,f){if("number"!==typeof f&&"boolean"!==typeof f)throw new TypeError('Cannot convert "'+wb(f)+'" to '+this.name);return f},argPackAdvance:8,readValueFromPointer:xb(b,c),Ha:null})},x:function(a,b,c,d,f,g){var l=Bb(b,c);a=X(a);f=Db(d,f);Ab(a,function(){Hb("Cannot call "+a+" due to unbound types",l)},b-1);pb([],l,function(h){var n=a,r=a;h=[h[0],null].concat(h.slice(1));var q=f,v=h.length;2>v&&Y("argTypes array size mismatch! Must at least get return value and 'this' types!");
for(var x=null!==h[1]&&!1,E=!1,t=1;t<h.length;++t)if(null!==h[t]&&void 0===h[t].Ha){E=!0;break}var pa="void"!==h[0].name,G="",M="";for(t=0;t<v-2;++t)G+=(0!==t?", ":"")+"arg"+t,M+=(0!==t?", ":"")+"arg"+t+"Wired";r="return function "+lb(r)+"("+G+") {\nif (arguments.length !== "+(v-2)+") {\nthrowBindingError('function "+r+" called with ' + arguments.length + ' arguments, expected "+(v-2)+" args!');\n}\n";E&&(r+="var destructors = [];\n");var ba=E?"destructors":"null";G="throwBindingError invoker fn runDestructors retType classParam".split(" ");
q=[Y,q,g,ib,h[0],h[1]];x&&(r+="var thisWired = classParam.toWireType("+ba+", this);\n");for(t=0;t<v-2;++t)r+="var arg"+t+"Wired = argType"+t+".toWireType("+ba+", arg"+t+"); // "+h[t+2].name+"\n",G.push("argType"+t),q.push(h[t+2]);x&&(M="thisWired"+(0<M.length?", ":"")+M);r+=(pa?"var rv = ":"")+"invoker(fn"+(0<M.length?", ":"")+M+");\n";if(E)r+="runDestructors(destructors);\n";else for(t=x?1:2;t<h.length;++t)v=1===t?"thisWired":"arg"+(t-2)+"Wired",null!==h[t].Ha&&(r+=v+"_dtor("+v+"); // "+h[t].name+
"\n",G.push(v+"_dtor"),q.push(h[t].Ha));pa&&(r+="var ret = retType.fromWireType(rv);\nreturn ret;\n");G.push(r+"}\n");h=yb(G).apply(null,q);t=b-1;if(!A.hasOwnProperty(n))throw new ob("Replacing nonexistant public symbol");void 0!==A[n].Fa&&void 0!==t?A[n].Fa[t]=h:(A[n]=h,A[n].lb=t);return[]})},j:function(a,b,c,d,f){function g(r){return r}b=X(b);-1===f&&(f=4294967295);var l=qb(c);if(0===d){var h=32-8*c;g=function(r){return r<<h>>>h}}var n=-1!=b.indexOf("unsigned");W(a,{name:b,fromWireType:g,toWireType:function(r,
q){if("number"!==typeof q&&"boolean"!==typeof q)throw new TypeError('Cannot convert "'+wb(q)+'" to '+this.name);if(q<d||q>f)throw new TypeError('Passing a number "'+wb(q)+'" from JS side to C/C++ side to an argument of type "'+b+'", which is outside the valid range ['+d+", "+f+"]!");return n?q>>>0:q|0},argPackAdvance:8,readValueFromPointer:Ib(b,l,0!==d),Ha:null})},g:function(a,b,c){function d(g){g>>=2;var l=z();return new f(m,l[g+1],l[g])}var f=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,
Uint32Array,Float32Array,Float64Array][b];c=X(c);W(a,{name:c,fromWireType:d,argPackAdvance:8,readValueFromPointer:d},{tb:!0})},v:function(a,b){b=X(b);var c="std::string"===b;W(a,{name:b,fromWireType:function(d){var f=z()[d>>2];if(c)for(var g=d+4,l=0;l<=f;++l){var h=d+4+l;if(l==f||0==u()[h]){g=K(g,h-g);if(void 0===n)var n=g;else n+=String.fromCharCode(0),n+=g;g=h+1}}else{n=Array(f);for(l=0;l<f;++l)n[l]=String.fromCharCode(u()[d+4+l]);n=n.join("")}T(d);return n},toWireType:function(d,f){f instanceof
ArrayBuffer&&(f=new Uint8Array(f));var g="string"===typeof f;g||f instanceof Uint8Array||f instanceof Uint8ClampedArray||f instanceof Int8Array||Y("Cannot pass non-string to std::string");var l=(c&&g?function(){return ya(f)}:function(){return f.length})(),h=S(4+l+1);z()[h>>2]=l;if(c&&g)xa(f,h+4,l+1);else if(g)for(g=0;g<l;++g){var n=f.charCodeAt(g);255<n&&(T(h),Y("String has UTF-16 code units that do not fit in 8 bits"));u()[h+4+g]=n}else for(g=0;g<l;++g)u()[h+4+g]=f[g];null!==d&&d.push(T,h);return h},
argPackAdvance:8,readValueFromPointer:jb,Ha:function(d){T(d)}})},p:function(a,b,c){c=X(c);if(2===b){var d=za;var f=Aa;var g=Ba;var l=function(){return ea()};var h=1}else 4===b&&(d=Ca,f=Da,g=Ea,l=function(){return z()},h=2);W(a,{name:c,fromWireType:function(n){for(var r=z()[n>>2],q=l(),v,x=n+4,E=0;E<=r;++E){var t=n+4+E*b;if(E==r||0==q[t>>h])x=d(x,t-x),void 0===v?v=x:(v+=String.fromCharCode(0),v+=x),x=t+b}T(n);return v},toWireType:function(n,r){"string"!==typeof r&&Y("Cannot pass non-string to C++ string type "+
c);var q=g(r),v=S(4+q+b);z()[v>>2]=q>>h;f(r,v+4,q+b);null!==n&&n.push(T,v);return v},argPackAdvance:8,readValueFromPointer:jb,Ha:function(n){T(n)}})},z:function(a,b,c,d,f,g){hb[a]={name:X(b),Bb:Db(c,d),Cb:Db(f,g),ab:[]}},i:function(a,b,c,d,f,g,l,h,n,r){hb[a].ab.push({nb:X(b),sb:c,qb:Db(d,f),rb:g,Lb:l,Kb:Db(h,n),Mb:r})},O:function(a,b){b=X(b);W(a,{Xb:!0,name:b,argPackAdvance:0,fromWireType:function(){},toWireType:function(){}})},I:function(a,b){if(a==b)postMessage({cmd:"processQueuedMainThreadWork"});
else if(D)postMessage({targetThread:a,cmd:"processThreadQueue"});else{a=(a=R.Ga[a])&&a.worker;if(!a)return;a.postMessage({cmd:"processThreadQueue"})}return 1},r:ub,L:function(a){if(0===a)return vb(Kb());var b=Jb[a];a=void 0===b?X(a):b;return vb(Kb()[a])},S:function(a){4<a&&(Z[a].Wa+=1)},A:function(a,b,c,d){a||Y("Cannot use deleted val. handle = "+a);a=Z[a].value;var f=Mb[b];if(!f){f="";for(var g=0;g<b;++g)f+=(0!==g?", ":"")+"arg"+g;var l="return function emval_allocator_"+b+"(constructor, argTypes, args) {\n";
for(g=0;g<b;++g)l+="var argType"+g+" = requireRegisteredType(Module['HEAP32'][(argTypes >>> 2) + "+g+'], "parameter '+g+'");\nvar arg'+g+" = argType"+g+".readValueFromPointer(args);\nargs += argType"+g+"['argPackAdvance'];\n";f=(new Function("requireRegisteredType","Module","__emval_register",l+("var obj = new constructor("+f+");\nreturn __emval_register(obj);\n}\n")))(Lb,A,vb);Mb[b]=f}return f(a,c,d)},s:function(){J()},l:function(a,b,c){Tb.length=0;var d;for(c>>=2;d=u()[b++];)(d=105>d)&&c&1&&c++,
Tb.push(d?la()[c++>>1]:y()[c]),++c;return Qa[a].apply(null,Tb)},J:function(){},q:function(){},e:Nb,f:Wa,b:db,n:function(){return Ua|0},m:function(){return Ta|0},D:function(a,b,c){u().copyWithin(a,b,b+c)},T:function(){return navigator.hardwareConcurrency},F:function(a,b,c){Sb.length=b;c>>=3;for(var d=0;d<b;d++)Sb[d]=la()[c+d];return(0>a?Qa[-a-1]:nc[a]).apply(null,Sb)},k:function(a){a>>>=0;var b=u().length;if(a<=b||2147483648<a)return!1;for(var c=1;4>=c;c*=2){var d=b*(1+.2/c);d=Math.min(d,a+100663296);
d=Math.max(16777216,a,d);0<d%65536&&(d+=65536-d%65536);a:{try{k.grow(Math.min(2147483648,d)-m.byteLength+65535>>>16);p(k.buffer);var f=1;break a}catch(g){}f=void 0}if(f)return!0}return!1},G:function(a,b,c){return Vb(a)?Wb(a,b,c):Yb(a,b,c)},d:function(){},H:function(a,b){var c={};b>>=2;c.alpha=!!y()[b];c.depth=!!y()[b+1];c.stencil=!!y()[b+2];c.antialias=!!y()[b+3];c.premultipliedAlpha=!!y()[b+4];c.preserveDrawingBuffer=!!y()[b+5];var d=y()[b+6];c.powerPreference=dc[d];c.failIfMajorPerformanceCaveat=
!!y()[b+7];c.zb=y()[b+8];c.Zb=y()[b+9];c.$a=y()[b+10];c.mb=y()[b+11];c.bc=y()[b+12];c.cc=y()[b+13];a=Vb(a);!a||c.mb?c=0:(a=a.getContext("webgl",c))?(b=S(8),y()[b+4>>2]=Q|0,d={Wb:b,attributes:c,version:c.zb,Pa:a},a.canvas&&(a.canvas.Qa=d),("undefined"===typeof c.$a||c.$a)&&bc(d),c=b):c=0;return c},K:fc,B:gc,t:hc,C:function(){R.xb()},a:k||A.wasmMemory,E:eb,w:function(a,b,c,d){if("undefined"===typeof SharedArrayBuffer)return H("Current environment does not support SharedArrayBuffer, pthreads are not available!"),
6;if(!a)return H("pthread_create called with a null thread pointer!"),28;var f=[];if(D&&0===f.length)return pc(687865856,a,b,c,d);var g=0,l=0,h=0,n=0;if(b){var r=y()[b>>2];r+=81920;g=y()[b+8>>2];l=0!==y()[b+12>>2];if(0===y()[b+16>>2]){var q=y()[b+20>>2],v=y()[b+24>>2];h=b+20;n=b+24;var x=R.Ua?R.Ua:Q|0;if(h||n)if(x)if(y()[x+12>>2]!==x)H("pthread_getschedparam attempted on thread "+x+", which does not point to a valid thread, or does not exist anymore!");else{var E=Atomics.load(z(),x+108+20>>2);x=Atomics.load(z(),
x+108+24>>2);h&&(y()[h>>2]=E);n&&(y()[n>>2]=x)}else H("pthread_getschedparam called with a null thread pointer!");h=y()[b+20>>2];n=y()[b+24>>2];y()[b+20>>2]=q;y()[b+24>>2]=v}else h=y()[b+20>>2],n=y()[b+24>>2]}else r=2097152;(b=0==g)?g=qc(16,r):(g-=r,va(0<g));q=S(232);for(v=0;58>v;++v)z()[(q>>2)+v]=0;y()[a>>2]=q;y()[q+12>>2]=q;a=q+156;y()[a>>2]=a;c={Ja:g,La:r,Ta:b,hb:h,ib:n,Za:l,Nb:c,Ka:q,Ab:Q|0,Ma:d,Qb:f};D?(c.Tb="spawnThread",postMessage(c,f)):bb(c);return 0},R:function(a,b){return kc(a,b)},c:jc,
o:function(){}};
(function(){function a(f,g){A.asm=f.exports;L=A.asm.V;ta=g;if(!D){var l=R.Ea.length;R.Ea.forEach(function(h){R.cb(h,function(){if(!--l&&(N--,A.monitorRunDependencies&&A.monitorRunDependencies(N),0==N&&(null!==La&&(clearInterval(La),La=null),O))){var n=O;O=null;n()}})})}}function b(f){a(f.instance,f.module)}function c(f){return Oa().then(function(g){return WebAssembly.instantiate(g,d)}).then(f,function(g){H("failed to asynchronously prepare wasm: "+g);J(g)})}var d={a:rc};D||(va(!D,"addRunDependency cannot be used in a pthread worker"),
N++,A.monitorRunDependencies&&A.monitorRunDependencies(N));if(A.instantiateWasm)try{return A.instantiateWasm(d,a)}catch(f){return H("Module.instantiateWasm callback failed with error: "+f),!1}(function(){return I||"function"!==typeof WebAssembly.instantiateStreaming||Ma()||"function"!==typeof fetch?c(b):fetch(P,{credentials:"same-origin"}).then(function(f){return WebAssembly.instantiateStreaming(f,d).then(b,function(g){H("wasm streaming compile failed: "+g);H("falling back to ArrayBuffer instantiation");
return c(b)})})})().catch(oa);return{}})();var oc=A.___wasm_call_ctors=function(){return(oc=A.___wasm_call_ctors=A.asm.W).apply(null,arguments)},S=A._malloc=function(){return(S=A._malloc=A.asm.X).apply(null,arguments)},T=A._free=function(){return(T=A._free=A.asm.Y).apply(null,arguments)},Gb=A.___getTypeName=function(){return(Gb=A.___getTypeName=A.asm.Z).apply(null,arguments)};
A.___embind_register_native_and_builtin_types=function(){return(A.___embind_register_native_and_builtin_types=A.asm._).apply(null,arguments)};var ic=A._emscripten_get_global_libc=function(){return(ic=A._emscripten_get_global_libc=A.asm.$).apply(null,arguments)};A.___em_js__initPthreadsJS=function(){return(A.___em_js__initPthreadsJS=A.asm.aa).apply(null,arguments)};
var Pb=A.stackSave=function(){return(Pb=A.stackSave=A.asm.ba).apply(null,arguments)},cb=A.stackRestore=function(){return(cb=A.stackRestore=A.asm.ca).apply(null,arguments)},Qb=A.stackAlloc=function(){return(Qb=A.stackAlloc=A.asm.da).apply(null,arguments)},qc=A._memalign=function(){return(qc=A._memalign=A.asm.ea).apply(null,arguments)};A._emscripten_main_browser_thread_id=function(){return(A._emscripten_main_browser_thread_id=A.asm.fa).apply(null,arguments)};
var $a=A.___pthread_tsd_run_dtors=function(){return($a=A.___pthread_tsd_run_dtors=A.asm.ga).apply(null,arguments)},ab=A._emscripten_main_thread_process_queued_calls=function(){return(ab=A._emscripten_main_thread_process_queued_calls=A.asm.ha).apply(null,arguments)};A._emscripten_current_thread_process_queued_calls=function(){return(A._emscripten_current_thread_process_queued_calls=A.asm.ia).apply(null,arguments)};
var Ya=A._emscripten_register_main_browser_thread_id=function(){return(Ya=A._emscripten_register_main_browser_thread_id=A.asm.ja).apply(null,arguments)},Pa=A._do_emscripten_dispatch_to_thread=function(){return(Pa=A._do_emscripten_dispatch_to_thread=A.asm.ka).apply(null,arguments)};A._emscripten_async_run_in_main_thread=function(){return(A._emscripten_async_run_in_main_thread=A.asm.la).apply(null,arguments)};
A._emscripten_sync_run_in_main_thread=function(){return(A._emscripten_sync_run_in_main_thread=A.asm.ma).apply(null,arguments)};A._emscripten_sync_run_in_main_thread_0=function(){return(A._emscripten_sync_run_in_main_thread_0=A.asm.na).apply(null,arguments)};A._emscripten_sync_run_in_main_thread_1=function(){return(A._emscripten_sync_run_in_main_thread_1=A.asm.oa).apply(null,arguments)};
A._emscripten_sync_run_in_main_thread_2=function(){return(A._emscripten_sync_run_in_main_thread_2=A.asm.pa).apply(null,arguments)};A._emscripten_sync_run_in_main_thread_xprintf_varargs=function(){return(A._emscripten_sync_run_in_main_thread_xprintf_varargs=A.asm.qa).apply(null,arguments)};A._emscripten_sync_run_in_main_thread_3=function(){return(A._emscripten_sync_run_in_main_thread_3=A.asm.ra).apply(null,arguments)};
var pc=A._emscripten_sync_run_in_main_thread_4=function(){return(pc=A._emscripten_sync_run_in_main_thread_4=A.asm.sa).apply(null,arguments)};A._emscripten_sync_run_in_main_thread_5=function(){return(A._emscripten_sync_run_in_main_thread_5=A.asm.ta).apply(null,arguments)};A._emscripten_sync_run_in_main_thread_6=function(){return(A._emscripten_sync_run_in_main_thread_6=A.asm.ua).apply(null,arguments)};
A._emscripten_sync_run_in_main_thread_7=function(){return(A._emscripten_sync_run_in_main_thread_7=A.asm.va).apply(null,arguments)};var Rb=A._emscripten_run_in_main_runtime_thread_js=function(){return(Rb=A._emscripten_run_in_main_runtime_thread_js=A.asm.wa).apply(null,arguments)},Xb=A.__emscripten_call_on_thread=function(){return(Xb=A.__emscripten_call_on_thread=A.asm.xa).apply(null,arguments)};A._emscripten_tls_init=function(){return(A._emscripten_tls_init=A.asm.ya).apply(null,arguments)};
A.dynCall_jiii=function(){return(A.dynCall_jiii=A.asm.za).apply(null,arguments)};A.dynCall_jiiiiii=function(){return(A.dynCall_jiiiiii=A.asm.Aa).apply(null,arguments)};A.dynCall_jiji=function(){return(A.dynCall_jiji=A.asm.Ba).apply(null,arguments)};var Za=A._main_thread_futex=139852;A.PThread=R;A.PThread=R;A._pthread_self=jc;A.wasmMemory=k;A.ExitStatus=sc;var tc;function sc(a){this.name="ExitStatus";this.message="Program terminated with exit("+a+")";this.status=a}O=function uc(){tc||vc();tc||(O=uc)};
function vc(){function a(){if(!tc&&(tc=!0,A.calledRun=!0,!ua)){Ra(Ha);D||Ra(Ia);na(A);if(A.onRuntimeInitialized)A.onRuntimeInitialized();if(!D){if(A.postRun)for("function"==typeof A.postRun&&(A.postRun=[A.postRun]);A.postRun.length;){var b=A.postRun.shift();Ja.unshift(b)}Ra(Ja)}}}if(!(0<N)){if(!D){if(A.preRun)for("function"==typeof A.preRun&&(A.preRun=[A.preRun]);A.preRun.length;)Ka();Ra(Ga)}0<N||(A.setStatus?(A.setStatus("Running..."),setTimeout(function(){setTimeout(function(){A.setStatus("")},
1);a()},1)):a())}}A.run=vc;if(A.preInit)for("function"==typeof A.preInit&&(A.preInit=[A.preInit]);0<A.preInit.length;)A.preInit.pop()();D||(noExitRuntime=!0);D?R.yb():vc();


  return wp2_enc_mt_simd.ready
}
);
})();
export default wp2_enc_mt_simd;