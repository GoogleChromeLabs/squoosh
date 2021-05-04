
var jxl_enc = (function() {
  var _scriptDir = import.meta.url;
  
  return (
function(jxl_enc) {
  jxl_enc = jxl_enc || {};


var f;f||(f=typeof jxl_enc !== 'undefined' ? jxl_enc : {});var aa,ba;f.ready=new Promise(function(a,b){aa=a;ba=b});var t={},w;for(w in f)f.hasOwnProperty(w)&&(t[w]=f[w]);var ca="./this.program",y="",da;y=self.location.href;_scriptDir&&(y=_scriptDir);0!==y.indexOf("blob:")?y=y.substr(0,y.lastIndexOf("/")+1):y="";da=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)};
var ea=f.print||console.log.bind(console),z=f.printErr||console.warn.bind(console);for(w in t)t.hasOwnProperty(w)&&(f[w]=t[w]);t=null;f.thisProgram&&(ca=f.thisProgram);var A;f.wasmBinary&&(A=f.wasmBinary);var noExitRuntime;f.noExitRuntime&&(noExitRuntime=f.noExitRuntime);"object"!==typeof WebAssembly&&C("no native wasm support detected");var D,fa=!1,ha=new TextDecoder("utf8");function ia(a,b){if(!a)return"";b=a+b;for(var c=a;!(c>=b)&&E[c];)++c;return ha.decode(E.subarray(a,c))}
function ja(a,b,c,d){if(0<d){d=c+d-1;for(var g=0;g<a.length;++g){var h=a.charCodeAt(g);if(55296<=h&&57343>=h){var m=a.charCodeAt(++g);h=65536+((h&1023)<<10)|m&1023}if(127>=h){if(c>=d)break;b[c++]=h}else{if(2047>=h){if(c+1>=d)break;b[c++]=192|h>>6}else{if(65535>=h){if(c+2>=d)break;b[c++]=224|h>>12}else{if(c+3>=d)break;b[c++]=240|h>>18;b[c++]=128|h>>12&63}b[c++]=128|h>>6&63}b[c++]=128|h&63}}b[c]=0}}
function ka(a){for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);55296<=d&&57343>=d&&(d=65536+((d&1023)<<10)|a.charCodeAt(++c)&1023);127>=d?++b:b=2047>=d?b+2:65535>=d?b+3:b+4}return b}var la=new TextDecoder("utf-16le");function ma(a,b){var c=a>>1;for(b=c+b/2;!(c>=b)&&F[c];)++c;return la.decode(E.subarray(a,c<<1))}function na(a,b,c){void 0===c&&(c=2147483647);if(2>c)return 0;c-=2;var d=b;c=c<2*a.length?c/2:a.length;for(var g=0;g<c;++g)G[b>>1]=a.charCodeAt(g),b+=2;G[b>>1]=0;return b-d}
function oa(a){return 2*a.length}function pa(a,b){for(var c=0,d="";!(c>=b/4);){var g=H[a+4*c>>2];if(0==g)break;++c;65536<=g?(g-=65536,d+=String.fromCharCode(55296|g>>10,56320|g&1023)):d+=String.fromCharCode(g)}return d}function qa(a,b,c){void 0===c&&(c=2147483647);if(4>c)return 0;var d=b;c=d+c-4;for(var g=0;g<a.length;++g){var h=a.charCodeAt(g);if(55296<=h&&57343>=h){var m=a.charCodeAt(++g);h=65536+((h&1023)<<10)|m&1023}H[b>>2]=h;b+=4;if(b+4>c)break}H[b>>2]=0;return b-d}
function ra(a){for(var b=0,c=0;c<a.length;++c){var d=a.charCodeAt(c);55296<=d&&57343>=d&&++c;b+=4}return b}var I,J,E,G,F,H,K,sa,ta;function ua(a){I=a;f.HEAP8=J=new Int8Array(a);f.HEAP16=G=new Int16Array(a);f.HEAP32=H=new Int32Array(a);f.HEAPU8=E=new Uint8Array(a);f.HEAPU16=F=new Uint16Array(a);f.HEAPU32=K=new Uint32Array(a);f.HEAPF32=sa=new Float32Array(a);f.HEAPF64=ta=new Float64Array(a)}var va=f.INITIAL_MEMORY||16777216;f.wasmMemory?D=f.wasmMemory:D=new WebAssembly.Memory({initial:va/65536,maximum:32768});
D&&(I=D.buffer);va=I.byteLength;ua(I);var L,wa=[],xa=[],ya=[],za=[];function Aa(){var a=f.preRun.shift();wa.unshift(a)}var M=0,Ba=null,N=null;f.preloadedImages={};f.preloadedAudios={};function C(a){if(f.onAbort)f.onAbort(a);z(a);fa=!0;a=new WebAssembly.RuntimeError("abort("+a+"). Build with -s ASSERTIONS=1 for more info.");ba(a);throw a;}
function Ca(){var a=O;return String.prototype.startsWith?a.startsWith("data:application/octet-stream;base64,"):0===a.indexOf("data:application/octet-stream;base64,")}var O="jxl_enc.wasm";if(!Ca()){var Da=O;O=f.locateFile?f.locateFile(Da,y):y+Da}function Ea(){try{if(A)return new Uint8Array(A);if(da)return da(O);throw"both async and sync fetching of the wasm failed";}catch(a){C(a)}}
function Fa(){return A||"function"!==typeof fetch?Promise.resolve().then(Ea):fetch(O,{credentials:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+O+"'";return a.arrayBuffer()}).catch(function(){return Ea()})}function P(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b(f);else{var c=b.fa;"number"===typeof c?void 0===b.$?L.get(c)():L.get(c)(b.$):c(void 0===b.$?null:b.$)}}}
function Ga(a){this.V=a-16;this.ra=function(b){H[this.V+8>>2]=b};this.oa=function(b){H[this.V+0>>2]=b};this.pa=function(){H[this.V+4>>2]=0};this.na=function(){J[this.V+12>>0]=0};this.qa=function(){J[this.V+13>>0]=0};this.ka=function(b,c){this.ra(b);this.oa(c);this.pa();this.na();this.qa()}}function Q(){return 0<Q.ca}var Ha={};function Ia(a){for(;a.length;){var b=a.pop();a.pop()(b)}}function Ja(a){return this.fromWireType(K[a>>2])}var R={},S={},Ka={};
function La(a){if(void 0===a)return"_unknown";a=a.replace(/[^a-zA-Z0-9_]/g,"$");var b=a.charCodeAt(0);return 48<=b&&57>=b?"_"+a:a}function Ma(a,b){a=La(a);return(new Function("body","return function "+a+'() {\n    "use strict";    return body.apply(this, arguments);\n};\n'))(b)}
function Na(a){var b=Error,c=Ma(a,function(d){this.name=a;this.message=d;d=Error(d).stack;void 0!==d&&(this.stack=this.toString()+"\n"+d.replace(/^Error(:[^\n]*)?\n/,""))});c.prototype=Object.create(b.prototype);c.prototype.constructor=c;c.prototype.toString=function(){return void 0===this.message?this.name:this.name+": "+this.message};return c}var Oa=void 0;
function Pa(a,b,c){function d(k){k=c(k);if(k.length!==a.length)throw new Oa("Mismatched type converter count");for(var n=0;n<a.length;++n)T(a[n],k[n])}a.forEach(function(k){Ka[k]=b});var g=Array(b.length),h=[],m=0;b.forEach(function(k,n){S.hasOwnProperty(k)?g[n]=S[k]:(h.push(k),R.hasOwnProperty(k)||(R[k]=[]),R[k].push(function(){g[n]=S[k];++m;m===h.length&&d(g)}))});0===h.length&&d(g)}
function Qa(a){switch(a){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+a);}}var Ra=void 0;function U(a){for(var b="";E[a];)b+=Ra[E[a++]];return b}var Sa=void 0;function V(a){throw new Sa(a);}
function T(a,b,c){c=c||{};if(!("argPackAdvance"in b))throw new TypeError("registerType registeredInstance requires argPackAdvance");var d=b.name;a||V('type "'+d+'" must have a positive integer typeid pointer');if(S.hasOwnProperty(a)){if(c.ja)return;V("Cannot register type '"+d+"' twice")}S[a]=b;delete Ka[a];R.hasOwnProperty(a)&&(b=R[a],delete R[a],b.forEach(function(g){g()}))}var Ta=[],X=[{},{value:void 0},{value:null},{value:!0},{value:!1}];
function Ua(a){4<a&&0===--X[a].aa&&(X[a]=void 0,Ta.push(a))}function Va(a){switch(a){case void 0:return 1;case null:return 2;case !0:return 3;case !1:return 4;default:var b=Ta.length?Ta.pop():X.length;X[b]={aa:1,value:a};return b}}function Wa(a){if(null===a)return"null";var b=typeof a;return"object"===b||"array"===b||"function"===b?a.toString():""+a}
function Xa(a,b){switch(b){case 2:return function(c){return this.fromWireType(sa[c>>2])};case 3:return function(c){return this.fromWireType(ta[c>>3])};default:throw new TypeError("Unknown float type: "+a);}}function Ya(a){var b=Function;if(!(b instanceof Function))throw new TypeError("new_ called with constructor type "+typeof b+" which is not a function");var c=Ma(b.name||"unknownFunctionName",function(){});c.prototype=b.prototype;c=new c;a=b.apply(c,a);return a instanceof Object?a:c}
function Za(a,b){var c=f;if(void 0===c[a].S){var d=c[a];c[a]=function(){c[a].S.hasOwnProperty(arguments.length)||V("Function '"+b+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+c[a].S+")!");return c[a].S[arguments.length].apply(this,arguments)};c[a].S=[];c[a].S[d.da]=d}}
function $a(a,b,c){f.hasOwnProperty(a)?((void 0===c||void 0!==f[a].S&&void 0!==f[a].S[c])&&V("Cannot register public name '"+a+"' twice"),Za(a,a),f.hasOwnProperty(c)&&V("Cannot register multiple overloads of a function with the same number of arguments ("+c+")!"),f[a].S[c]=b):(f[a]=b,void 0!==c&&(f[a].Aa=c))}function ab(a,b){for(var c=[],d=0;d<a;d++)c.push(H[(b>>2)+d]);return c}
function bb(a,b){0<=a.indexOf("j")||C("Assertion failed: getDynCaller should only be called with i64 sigs");var c=[];return function(){c.length=arguments.length;for(var d=0;d<arguments.length;d++)c[d]=arguments[d];var g;-1!=a.indexOf("j")?g=c&&c.length?f["dynCall_"+a].apply(null,[b].concat(c)):f["dynCall_"+a].call(null,b):g=L.get(b).apply(null,c);return g}}
function Y(a,b){a=U(a);var c=-1!=a.indexOf("j")?bb(a,b):L.get(b);"function"!==typeof c&&V("unknown function pointer with signature "+a+": "+b);return c}var cb=void 0;function db(a){a=eb(a);var b=U(a);Z(a);return b}function fb(a,b){function c(h){g[h]||S[h]||(Ka[h]?Ka[h].forEach(c):(d.push(h),g[h]=!0))}var d=[],g={};b.forEach(c);throw new cb(a+": "+d.map(db).join([", "]));}
function gb(a,b,c){switch(b){case 0:return c?function(d){return J[d]}:function(d){return E[d]};case 1:return c?function(d){return G[d>>1]}:function(d){return F[d>>1]};case 2:return c?function(d){return H[d>>2]}:function(d){return K[d>>2]};default:throw new TypeError("Unknown integer type: "+a);}}var hb={};function ib(){return"object"===typeof globalThis?globalThis:Function("return this")()}function jb(a,b){var c=S[a];void 0===c&&V(b+" has unknown type "+db(a));return c}var kb={},lb={};
function mb(){if(!nb){var a={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:("object"===typeof navigator&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:ca||"./this.program"},b;for(b in lb)a[b]=lb[b];var c=[];for(b in a)c.push(b+"="+a[b]);nb=c}return nb}var nb,ob=[null,[],[]];function pb(a){return 0===a%4&&(0!==a%100||0===a%400)}function qb(a,b){for(var c=0,d=0;d<=b;c+=a[d++]);return c}
var rb=[31,29,31,30,31,30,31,31,30,31,30,31],sb=[31,28,31,30,31,30,31,31,30,31,30,31];function tb(a,b){for(a=new Date(a.getTime());0<b;){var c=a.getMonth(),d=(pb(a.getFullYear())?rb:sb)[c];if(b>d-a.getDate())b-=d-a.getDate()+1,a.setDate(1),11>c?a.setMonth(c+1):(a.setMonth(0),a.setFullYear(a.getFullYear()+1));else{a.setDate(a.getDate()+b);break}}return a}
function ub(a,b,c,d){function g(e,l,u){for(e="number"===typeof e?e.toString():e||"";e.length<l;)e=u[0]+e;return e}function h(e,l){return g(e,l,"0")}function m(e,l){function u(B){return 0>B?-1:0<B?1:0}var v;0===(v=u(e.getFullYear()-l.getFullYear()))&&0===(v=u(e.getMonth()-l.getMonth()))&&(v=u(e.getDate()-l.getDate()));return v}function k(e){switch(e.getDay()){case 0:return new Date(e.getFullYear()-1,11,29);case 1:return e;case 2:return new Date(e.getFullYear(),0,3);case 3:return new Date(e.getFullYear(),
0,2);case 4:return new Date(e.getFullYear(),0,1);case 5:return new Date(e.getFullYear()-1,11,31);case 6:return new Date(e.getFullYear()-1,11,30)}}function n(e){e=tb(new Date(e.R+1900,0,1),e.Z);var l=new Date(e.getFullYear()+1,0,4),u=k(new Date(e.getFullYear(),0,4));l=k(l);return 0>=m(u,e)?0>=m(l,e)?e.getFullYear()+1:e.getFullYear():e.getFullYear()-1}var p=H[d+40>>2];d={xa:H[d>>2],wa:H[d+4>>2],X:H[d+8>>2],W:H[d+12>>2],U:H[d+16>>2],R:H[d+20>>2],Y:H[d+24>>2],Z:H[d+28>>2],Ba:H[d+32>>2],va:H[d+36>>2],
ya:p?ia(p):""};c=ia(c);p={"%c":"%a %b %d %H:%M:%S %Y","%D":"%m/%d/%y","%F":"%Y-%m-%d","%h":"%b","%r":"%I:%M:%S %p","%R":"%H:%M","%T":"%H:%M:%S","%x":"%m/%d/%y","%X":"%H:%M:%S","%Ec":"%c","%EC":"%C","%Ex":"%m/%d/%y","%EX":"%H:%M:%S","%Ey":"%y","%EY":"%Y","%Od":"%d","%Oe":"%e","%OH":"%H","%OI":"%I","%Om":"%m","%OM":"%M","%OS":"%S","%Ou":"%u","%OU":"%U","%OV":"%V","%Ow":"%w","%OW":"%W","%Oy":"%y"};for(var q in p)c=c.replace(new RegExp(q,"g"),p[q]);var r="Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),
x="January February March April May June July August September October November December".split(" ");p={"%a":function(e){return r[e.Y].substring(0,3)},"%A":function(e){return r[e.Y]},"%b":function(e){return x[e.U].substring(0,3)},"%B":function(e){return x[e.U]},"%C":function(e){return h((e.R+1900)/100|0,2)},"%d":function(e){return h(e.W,2)},"%e":function(e){return g(e.W,2," ")},"%g":function(e){return n(e).toString().substring(2)},"%G":function(e){return n(e)},"%H":function(e){return h(e.X,2)},"%I":function(e){e=
e.X;0==e?e=12:12<e&&(e-=12);return h(e,2)},"%j":function(e){return h(e.W+qb(pb(e.R+1900)?rb:sb,e.U-1),3)},"%m":function(e){return h(e.U+1,2)},"%M":function(e){return h(e.wa,2)},"%n":function(){return"\n"},"%p":function(e){return 0<=e.X&&12>e.X?"AM":"PM"},"%S":function(e){return h(e.xa,2)},"%t":function(){return"\t"},"%u":function(e){return e.Y||7},"%U":function(e){var l=new Date(e.R+1900,0,1),u=0===l.getDay()?l:tb(l,7-l.getDay());e=new Date(e.R+1900,e.U,e.W);return 0>m(u,e)?h(Math.ceil((31-u.getDate()+
(qb(pb(e.getFullYear())?rb:sb,e.getMonth()-1)-31)+e.getDate())/7),2):0===m(u,l)?"01":"00"},"%V":function(e){var l=new Date(e.R+1901,0,4),u=k(new Date(e.R+1900,0,4));l=k(l);var v=tb(new Date(e.R+1900,0,1),e.Z);return 0>m(v,u)?"53":0>=m(l,v)?"01":h(Math.ceil((u.getFullYear()<e.R+1900?e.Z+32-u.getDate():e.Z+1-u.getDate())/7),2)},"%w":function(e){return e.Y},"%W":function(e){var l=new Date(e.R,0,1),u=1===l.getDay()?l:tb(l,0===l.getDay()?1:7-l.getDay()+1);e=new Date(e.R+1900,e.U,e.W);return 0>m(u,e)?h(Math.ceil((31-
u.getDate()+(qb(pb(e.getFullYear())?rb:sb,e.getMonth()-1)-31)+e.getDate())/7),2):0===m(u,l)?"01":"00"},"%y":function(e){return(e.R+1900).toString().substring(2)},"%Y":function(e){return e.R+1900},"%z":function(e){e=e.va;var l=0<=e;e=Math.abs(e)/60;return(l?"+":"-")+String("0000"+(e/60*100+e%60)).slice(-4)},"%Z":function(e){return e.ya},"%%":function(){return"%"}};for(q in p)0<=c.indexOf(q)&&(c=c.replace(new RegExp(q,"g"),p[q](d)));q=vb(c);if(q.length>b)return 0;J.set(q,a);return q.length-1}
Oa=f.InternalError=Na("InternalError");for(var wb=Array(256),xb=0;256>xb;++xb)wb[xb]=String.fromCharCode(xb);Ra=wb;Sa=f.BindingError=Na("BindingError");f.count_emval_handles=function(){for(var a=0,b=5;b<X.length;++b)void 0!==X[b]&&++a;return a};f.get_first_emval=function(){for(var a=5;a<X.length;++a)if(void 0!==X[a])return X[a];return null};cb=f.UnboundTypeError=Na("UnboundTypeError");function vb(a){var b=Array(ka(a)+1);ja(a,b,0,b.length);return b}xa.push({fa:function(){yb()}});
var Ab={q:function(a){return zb(a+16)+16},D:function(){},p:function(a,b,c){(new Ga(a)).ka(b,c);"uncaught_exception"in Q?Q.ca++:Q.ca=1;throw a;},m:function(a){var b=Ha[a];delete Ha[a];var c=b.la,d=b.ma,g=b.ba,h=g.map(function(m){return m.ia}).concat(g.map(function(m){return m.ta}));Pa([a],h,function(m){var k={};g.forEach(function(n,p){var q=m[p],r=n.ga,x=n.ha,e=m[p+g.length],l=n.sa,u=n.ua;k[n.ea]={read:function(v){return q.fromWireType(r(x,v))},write:function(v,B){var W=[];l(u,v,e.toWireType(W,B));
Ia(W)}}});return[{name:b.name,fromWireType:function(n){var p={},q;for(q in k)p[q]=k[q].read(n);d(n);return p},toWireType:function(n,p){for(var q in k)if(!(q in p))throw new TypeError('Missing field:  "'+q+'"');var r=c();for(q in k)k[q].write(r,p[q]);null!==n&&n.push(d,r);return r},argPackAdvance:8,readValueFromPointer:Ja,T:d}]})},z:function(a,b,c,d,g){var h=Qa(c);b=U(b);T(a,{name:b,fromWireType:function(m){return!!m},toWireType:function(m,k){return k?d:g},argPackAdvance:8,readValueFromPointer:function(m){if(1===
c)var k=J;else if(2===c)k=G;else if(4===c)k=H;else throw new TypeError("Unknown boolean type size: "+b);return this.fromWireType(k[m>>h])},T:null})},y:function(a,b){b=U(b);T(a,{name:b,fromWireType:function(c){var d=X[c].value;Ua(c);return d},toWireType:function(c,d){return Va(d)},argPackAdvance:8,readValueFromPointer:Ja,T:null})},j:function(a,b,c){c=Qa(c);b=U(b);T(a,{name:b,fromWireType:function(d){return d},toWireType:function(d,g){if("number"!==typeof g&&"boolean"!==typeof g)throw new TypeError('Cannot convert "'+
Wa(g)+'" to '+this.name);return g},argPackAdvance:8,readValueFromPointer:Xa(b,c),T:null})},l:function(a,b,c,d,g,h){var m=ab(b,c);a=U(a);g=Y(d,g);$a(a,function(){fb("Cannot call "+a+" due to unbound types",m)},b-1);Pa([],m,function(k){var n=a,p=a;k=[k[0],null].concat(k.slice(1));var q=g,r=k.length;2>r&&V("argTypes array size mismatch! Must at least get return value and 'this' types!");for(var x=null!==k[1]&&!1,e=!1,l=1;l<k.length;++l)if(null!==k[l]&&void 0===k[l].T){e=!0;break}var u="void"!==k[0].name,
v="",B="";for(l=0;l<r-2;++l)v+=(0!==l?", ":"")+"arg"+l,B+=(0!==l?", ":"")+"arg"+l+"Wired";p="return function "+La(p)+"("+v+") {\nif (arguments.length !== "+(r-2)+") {\nthrowBindingError('function "+p+" called with ' + arguments.length + ' arguments, expected "+(r-2)+" args!');\n}\n";e&&(p+="var destructors = [];\n");var W=e?"destructors":"null";v="throwBindingError invoker fn runDestructors retType classParam".split(" ");q=[V,q,h,Ia,k[0],k[1]];x&&(p+="var thisWired = classParam.toWireType("+W+", this);\n");
for(l=0;l<r-2;++l)p+="var arg"+l+"Wired = argType"+l+".toWireType("+W+", arg"+l+"); // "+k[l+2].name+"\n",v.push("argType"+l),q.push(k[l+2]);x&&(B="thisWired"+(0<B.length?", ":"")+B);p+=(u?"var rv = ":"")+"invoker(fn"+(0<B.length?", ":"")+B+");\n";if(e)p+="runDestructors(destructors);\n";else for(l=x?1:2;l<k.length;++l)r=1===l?"thisWired":"arg"+(l-2)+"Wired",null!==k[l].T&&(p+=r+"_dtor("+r+"); // "+k[l].name+"\n",v.push(r+"_dtor"),q.push(k[l].T));u&&(p+="var ret = retType.fromWireType(rv);\nreturn ret;\n");
v.push(p+"}\n");k=Ya(v).apply(null,q);l=b-1;if(!f.hasOwnProperty(n))throw new Oa("Replacing nonexistant public symbol");void 0!==f[n].S&&void 0!==l?f[n].S[l]=k:(f[n]=k,f[n].da=l);return[]})},d:function(a,b,c,d,g){function h(p){return p}b=U(b);-1===g&&(g=4294967295);var m=Qa(c);if(0===d){var k=32-8*c;h=function(p){return p<<k>>>k}}var n=-1!=b.indexOf("unsigned");T(a,{name:b,fromWireType:h,toWireType:function(p,q){if("number"!==typeof q&&"boolean"!==typeof q)throw new TypeError('Cannot convert "'+Wa(q)+
'" to '+this.name);if(q<d||q>g)throw new TypeError('Passing a number "'+Wa(q)+'" from JS side to C/C++ side to an argument of type "'+b+'", which is outside the valid range ['+d+", "+g+"]!");return n?q>>>0:q|0},argPackAdvance:8,readValueFromPointer:gb(b,m,0!==d),T:null})},c:function(a,b,c){function d(h){h>>=2;var m=K;return new g(I,m[h+1],m[h])}var g=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array][b];c=U(c);T(a,{name:c,fromWireType:d,argPackAdvance:8,
readValueFromPointer:d},{ja:!0})},k:function(a,b){b=U(b);var c="std::string"===b;T(a,{name:b,fromWireType:function(d){var g=K[d>>2];if(c)for(var h=d+4,m=0;m<=g;++m){var k=d+4+m;if(m==g||0==E[k]){h=ia(h,k-h);if(void 0===n)var n=h;else n+=String.fromCharCode(0),n+=h;h=k+1}}else{n=Array(g);for(m=0;m<g;++m)n[m]=String.fromCharCode(E[d+4+m]);n=n.join("")}Z(d);return n},toWireType:function(d,g){g instanceof ArrayBuffer&&(g=new Uint8Array(g));var h="string"===typeof g;h||g instanceof Uint8Array||g instanceof
Uint8ClampedArray||g instanceof Int8Array||V("Cannot pass non-string to std::string");var m=(c&&h?function(){return ka(g)}:function(){return g.length})(),k=zb(4+m+1);K[k>>2]=m;if(c&&h)ja(g,E,k+4,m+1);else if(h)for(h=0;h<m;++h){var n=g.charCodeAt(h);255<n&&(Z(k),V("String has UTF-16 code units that do not fit in 8 bits"));E[k+4+h]=n}else for(h=0;h<m;++h)E[k+4+h]=g[h];null!==d&&d.push(Z,k);return k},argPackAdvance:8,readValueFromPointer:Ja,T:function(d){Z(d)}})},h:function(a,b,c){c=U(c);if(2===b){var d=
ma;var g=na;var h=oa;var m=function(){return F};var k=1}else 4===b&&(d=pa,g=qa,h=ra,m=function(){return K},k=2);T(a,{name:c,fromWireType:function(n){for(var p=K[n>>2],q=m(),r,x=n+4,e=0;e<=p;++e){var l=n+4+e*b;if(e==p||0==q[l>>k])x=d(x,l-x),void 0===r?r=x:(r+=String.fromCharCode(0),r+=x),x=l+b}Z(n);return r},toWireType:function(n,p){"string"!==typeof p&&V("Cannot pass non-string to C++ string type "+c);var q=h(p),r=zb(4+q+b);K[r>>2]=q>>k;g(p,r+4,q+b);null!==n&&n.push(Z,r);return r},argPackAdvance:8,
readValueFromPointer:Ja,T:function(n){Z(n)}})},n:function(a,b,c,d,g,h){Ha[a]={name:U(b),la:Y(c,d),ma:Y(g,h),ba:[]}},e:function(a,b,c,d,g,h,m,k,n,p){Ha[a].ba.push({ea:U(b),ia:c,ga:Y(d,g),ha:h,ta:m,sa:Y(k,n),ua:p})},A:function(a,b){b=U(b);T(a,{za:!0,name:b,argPackAdvance:0,fromWireType:function(){},toWireType:function(){}})},g:Ua,C:function(a){if(0===a)return Va(ib());var b=hb[a];a=void 0===b?U(a):b;return Va(ib()[a])},B:function(a){4<a&&(X[a].aa+=1)},o:function(a,b,c,d){a||V("Cannot use deleted val. handle = "+
a);a=X[a].value;var g=kb[b];if(!g){g="";for(var h=0;h<b;++h)g+=(0!==h?", ":"")+"arg"+h;var m="return function emval_allocator_"+b+"(constructor, argTypes, args) {\n";for(h=0;h<b;++h)m+="var argType"+h+" = requireRegisteredType(Module['HEAP32'][(argTypes >>> 2) + "+h+'], "parameter '+h+'");\nvar arg'+h+" = argType"+h+".readValueFromPointer(args);\nargs += argType"+h+"['argPackAdvance'];\n";g=(new Function("requireRegisteredType","Module","__emval_register",m+("var obj = new constructor("+g+");\nreturn __emval_register(obj);\n}\n")))(jb,
f,Va);kb[b]=g}return g(a,c,d)},b:function(){C()},t:function(a,b,c){E.copyWithin(a,b,b+c)},f:function(a){a>>>=0;var b=E.length;if(2147483648<a)return!1;for(var c=1;4>=c;c*=2){var d=b*(1+.2/c);d=Math.min(d,a+100663296);d=Math.max(16777216,a,d);0<d%65536&&(d+=65536-d%65536);a:{try{D.grow(Math.min(2147483648,d)-I.byteLength+65535>>>16);ua(D.buffer);var g=1;break a}catch(h){}g=void 0}if(g)return!0}return!1},v:function(a,b){var c=0;mb().forEach(function(d,g){var h=b+c;g=H[a+4*g>>2]=h;for(h=0;h<d.length;++h)J[g++>>
0]=d.charCodeAt(h);J[g>>0]=0;c+=d.length+1});return 0},w:function(a,b){var c=mb();H[a>>2]=c.length;var d=0;c.forEach(function(g){d+=g.length+1});H[b>>2]=d;return 0},x:function(){return 0},r:function(){},i:function(a,b,c,d){for(var g=0,h=0;h<c;h++){for(var m=H[b+8*h>>2],k=H[b+(8*h+4)>>2],n=0;n<k;n++){var p=E[m+n],q=ob[a];if(0===p||10===p){for(p=0;q[p]&&!(NaN<=p);)++p;p=ha.decode(q.subarray?q.subarray(0,p):new Uint8Array(q.slice(0,p)));(1===a?ea:z)(p);q.length=0}else q.push(p)}g+=k}H[d>>2]=g;return 0},
a:D,s:function(){},u:function(a,b,c,d){return ub(a,b,c,d)}};
(function(){function a(g){f.asm=g.exports;L=f.asm.E;M--;f.monitorRunDependencies&&f.monitorRunDependencies(M);0==M&&(null!==Ba&&(clearInterval(Ba),Ba=null),N&&(g=N,N=null,g()))}function b(g){a(g.instance)}function c(g){return Fa().then(function(h){return WebAssembly.instantiate(h,d)}).then(g,function(h){z("failed to asynchronously prepare wasm: "+h);C(h)})}var d={a:Ab};M++;f.monitorRunDependencies&&f.monitorRunDependencies(M);if(f.instantiateWasm)try{return f.instantiateWasm(d,a)}catch(g){return z("Module.instantiateWasm callback failed with error: "+
g),!1}(function(){return A||"function"!==typeof WebAssembly.instantiateStreaming||Ca()||"function"!==typeof fetch?c(b):fetch(O,{credentials:"same-origin"}).then(function(g){return WebAssembly.instantiateStreaming(g,d).then(b,function(h){z("wasm streaming compile failed: "+h);z("falling back to ArrayBuffer instantiation");return c(b)})})})().catch(ba);return{}})();
var yb=f.___wasm_call_ctors=function(){return(yb=f.___wasm_call_ctors=f.asm.F).apply(null,arguments)},zb=f._malloc=function(){return(zb=f._malloc=f.asm.G).apply(null,arguments)},Z=f._free=function(){return(Z=f._free=f.asm.H).apply(null,arguments)},eb=f.___getTypeName=function(){return(eb=f.___getTypeName=f.asm.I).apply(null,arguments)};f.___embind_register_native_and_builtin_types=function(){return(f.___embind_register_native_and_builtin_types=f.asm.J).apply(null,arguments)};
f.dynCall_viijii=function(){return(f.dynCall_viijii=f.asm.K).apply(null,arguments)};f.dynCall_iiji=function(){return(f.dynCall_iiji=f.asm.L).apply(null,arguments)};f.dynCall_jiji=function(){return(f.dynCall_jiji=f.asm.M).apply(null,arguments)};f.dynCall_iiiiiijj=function(){return(f.dynCall_iiiiiijj=f.asm.N).apply(null,arguments)};f.dynCall_iiiiij=function(){return(f.dynCall_iiiiij=f.asm.O).apply(null,arguments)};f.dynCall_iiiiijj=function(){return(f.dynCall_iiiiijj=f.asm.P).apply(null,arguments)};
var Bb;N=function Cb(){Bb||Db();Bb||(N=Cb)};
function Db(){function a(){if(!Bb&&(Bb=!0,f.calledRun=!0,!fa)){P(xa);P(ya);aa(f);if(f.onRuntimeInitialized)f.onRuntimeInitialized();if(f.postRun)for("function"==typeof f.postRun&&(f.postRun=[f.postRun]);f.postRun.length;){var b=f.postRun.shift();za.unshift(b)}P(za)}}if(!(0<M)){if(f.preRun)for("function"==typeof f.preRun&&(f.preRun=[f.preRun]);f.preRun.length;)Aa();P(wa);0<M||(f.setStatus?(f.setStatus("Running..."),setTimeout(function(){setTimeout(function(){f.setStatus("")},1);a()},1)):a())}}
f.run=Db;if(f.preInit)for("function"==typeof f.preInit&&(f.preInit=[f.preInit]);0<f.preInit.length;)f.preInit.pop()();noExitRuntime=!0;Db();


  return jxl_enc.ready
}
);
})();
export default jxl_enc;