import{j as Ot}from"./index-BImINgzG.js";function Ct(ye,_e){for(var oe=0;oe<_e.length;oe++){const ae=_e[oe];if(typeof ae!="string"&&!Array.isArray(ae)){for(const ce in ae)if(ce!=="default"&&!(ce in ye)){const we=Object.getOwnPropertyDescriptor(ae,ce);we&&Object.defineProperty(ye,ce,we.get?we:{enumerable:!0,get:()=>ae[ce]})}}}return Object.freeze(Object.defineProperty(ye,Symbol.toStringTag,{value:"Module"}))}var He={exports:{}};(function(ye){(_e=>{var oe=Object.defineProperty,ae=Object.getOwnPropertyDescriptor,ce=Object.getOwnPropertyNames,we=Object.prototype.hasOwnProperty,Xe=(e,t)=>{for(var r in t)oe(e,r,{get:t[r],enumerable:!0})},Ke=(e,t,r,a)=>{if(t&&typeof t=="object"||typeof t=="function")for(let g of ce(t))!we.call(e,g)&&g!==r&&oe(e,g,{get:()=>t[g],enumerable:!(a=ae(t,g))||a.enumerable});return e},Ze=e=>Ke(oe({},"__esModule",{value:!0}),e),le=(e,t,r)=>new Promise((a,g)=>{var y=f=>{try{k(r.next(f))}catch(D){g(D)}},h=f=>{try{k(r.throw(f))}catch(D){g(D)}},k=f=>f.done?a(f.value):Promise.resolve(f.value).then(y,h);k((r=r.apply(e,t)).next())}),Ee={};Xe(Ee,{analyzeMetafile:()=>bt,analyzeMetafileSync:()=>Et,build:()=>gt,buildSync:()=>vt,context:()=>pt,default:()=>$t,formatMessages:()=>wt,formatMessagesSync:()=>_t,initialize:()=>St,stop:()=>kt,transform:()=>yt,transformSync:()=>xt,version:()=>mt}),_e.exports=Ze(Ee);function Re(e){let t=a=>{if(a===null)r.write8(0);else if(typeof a=="boolean")r.write8(1),r.write8(+a);else if(typeof a=="number")r.write8(2),r.write32(a|0);else if(typeof a=="string")r.write8(3),r.write(Z(a));else if(a instanceof Uint8Array)r.write8(4),r.write(a);else if(a instanceof Array){r.write8(5),r.write32(a.length);for(let g of a)t(g)}else{let g=Object.keys(a);r.write8(6),r.write32(g.length);for(let y of g)r.write(Z(y)),t(a[y])}},r=new Ue;return r.write32(0),r.write32(e.id<<1|+!e.isRequest),t(e.value),De(r.buf,r.len-4,0),r.buf.subarray(0,r.len)}function et(e){let t=()=>{switch(r.read8()){case 0:return null;case 1:return!!r.read8();case 2:return r.read32();case 3:return he(r.read());case 4:return r.read();case 5:{let h=r.read32(),k=[];for(let f=0;f<h;f++)k.push(t());return k}case 6:{let h=r.read32(),k={};for(let f=0;f<h;f++)k[he(r.read())]=t();return k}default:throw new Error("Invalid packet")}},r=new Ue(e),a=r.read32(),g=(a&1)===0;a>>>=1;let y=t();if(r.ptr!==e.length)throw new Error("Invalid packet");return{id:a,isRequest:g,value:y}}var Ue=class{constructor(e=new Uint8Array(1024)){this.buf=e,this.len=0,this.ptr=0}_write(e){if(this.len+e>this.buf.length){let t=new Uint8Array((this.len+e)*2);t.set(this.buf),this.buf=t}return this.len+=e,this.len-e}write8(e){let t=this._write(1);this.buf[t]=e}write32(e){let t=this._write(4);De(this.buf,e,t)}write(e){let t=this._write(4+e.length);De(this.buf,e.length,t),this.buf.set(e,t+4)}_read(e){if(this.ptr+e>this.buf.length)throw new Error("Invalid packet");return this.ptr+=e,this.ptr-e}read8(){return this.buf[this._read(1)]}read32(){return Ie(this.buf,this._read(4))}read(){let e=this.read32(),t=new Uint8Array(e),r=this._read(t.length);return t.set(this.buf.subarray(r,r+e)),t}},Z,he,Ae;if(typeof TextEncoder<"u"&&typeof TextDecoder<"u"){let e=new TextEncoder,t=new TextDecoder;Z=r=>e.encode(r),he=r=>t.decode(r),Ae='new TextEncoder().encode("")'}else if(typeof Buffer<"u")Z=e=>Buffer.from(e),he=e=>{let{buffer:t,byteOffset:r,byteLength:a}=e;return Buffer.from(t,r,a).toString()},Ae='Buffer.from("")';else throw new Error("No UTF-8 codec found");if(!(Z("")instanceof Uint8Array))throw new Error(`Invariant violation: "${Ae} instanceof Uint8Array" is incorrectly false

This indicates that your JavaScript environment is broken. You cannot use
esbuild in this environment because esbuild relies on this invariant. This
is not a problem with esbuild. You need to fix your environment instead.
`);function Ie(e,t){return e[t++]|e[t++]<<8|e[t++]<<16|e[t++]<<24}function De(e,t,r){e[r++]=t,e[r++]=t>>8,e[r++]=t>>16,e[r++]=t>>24}var J=JSON.stringify,Me="warning",Fe="silent";function me(e,t){const r=[];for(const a of e){if(Y(a,t),a.indexOf(",")>=0)throw new Error(`Invalid ${t}: ${a}`);r.push(a)}return r.join(",")}var ke=()=>null,L=e=>typeof e=="boolean"?null:"a boolean",j=e=>typeof e=="string"?null:"a string",Se=e=>e instanceof RegExp?null:"a RegExp object",ue=e=>typeof e=="number"&&e===(e|0)?null:"an integer",tt=e=>typeof e=="number"&&e===(e|0)&&e>=0&&e<=65535?null:"a valid port number",Ne=e=>typeof e=="function"?null:"a function",te=e=>Array.isArray(e)?null:"an array",q=e=>Array.isArray(e)&&e.every(t=>typeof t=="string")?null:"an array of strings",Q=e=>typeof e=="object"&&e!==null&&!Array.isArray(e)?null:"an object",nt=e=>typeof e=="object"&&e!==null?null:"an array or an object",rt=e=>e instanceof WebAssembly.Module?null:"a WebAssembly.Module",Ve=e=>typeof e=="object"&&!Array.isArray(e)?null:"an object or null",Be=e=>typeof e=="string"||typeof e=="boolean"?null:"a string or a boolean",st=e=>typeof e=="string"||typeof e=="object"&&e!==null&&!Array.isArray(e)?null:"a string or an object",Le=e=>typeof e=="string"||Array.isArray(e)&&e.every(t=>typeof t=="string")?null:"a string or an array of strings",We=e=>typeof e=="string"||e instanceof Uint8Array?null:"a string or a Uint8Array",it=e=>typeof e=="string"||e instanceof URL?null:"a string or a URL";function i(e,t,r,a){let g=e[r];if(t[r+""]=!0,g===void 0)return;let y=a(g);if(y!==null)throw new Error(`${J(r)} must be ${y}`);return g}function z(e,t,r){for(let a in e)if(!(a in t))throw new Error(`Invalid option ${r}: ${J(a)}`)}function lt(e){let t=Object.create(null),r=i(e,t,"wasmURL",it),a=i(e,t,"wasmModule",rt),g=i(e,t,"worker",L);return z(e,t,"in initialize() call"),{wasmURL:r,wasmModule:a,worker:g}}function ze(e){let t;if(e!==void 0){t=Object.create(null);for(let r in e){let a=e[r];if(typeof a=="string"||a===!1)t[r]=a;else throw new Error(`Expected ${J(r)} in mangle cache to map to either a string or false`)}}return t}function Te(e,t,r,a,g){let y=i(t,r,"color",L),h=i(t,r,"logLevel",j),k=i(t,r,"logLimit",ue);y!==void 0?e.push(`--color=${y}`):a&&e.push("--color=true"),e.push(`--log-level=${h||g}`),e.push(`--log-limit=${k||0}`)}function Y(e,t,r){if(typeof e!="string")throw new Error(`Expected value for ${t}${r!==void 0?" "+J(r):""} to be a string, got ${typeof e} instead`);return e}function Ge(e,t,r){let a=i(t,r,"legalComments",j),g=i(t,r,"sourceRoot",j),y=i(t,r,"sourcesContent",L),h=i(t,r,"target",Le),k=i(t,r,"format",j),f=i(t,r,"globalName",j),D=i(t,r,"mangleProps",Se),R=i(t,r,"reserveProps",Se),C=i(t,r,"mangleQuoted",L),V=i(t,r,"minify",L),A=i(t,r,"minifySyntax",L),M=i(t,r,"minifyWhitespace",L),F=i(t,r,"minifyIdentifiers",L),$=i(t,r,"lineLimit",ue),W=i(t,r,"drop",q),T=i(t,r,"dropLabels",q),S=i(t,r,"charset",j),p=i(t,r,"treeShaking",L),u=i(t,r,"ignoreAnnotations",L),s=i(t,r,"jsx",j),o=i(t,r,"jsxFactory",j),d=i(t,r,"jsxFragment",j),v=i(t,r,"jsxImportSource",j),_=i(t,r,"jsxDev",L),c=i(t,r,"jsxSideEffects",L),m=i(t,r,"define",Q),x=i(t,r,"logOverride",Q),n=i(t,r,"supported",Q),l=i(t,r,"pure",q),b=i(t,r,"keepNames",L),w=i(t,r,"platform",j),O=i(t,r,"tsconfigRaw",st),B=i(t,r,"absPaths",q);if(a&&e.push(`--legal-comments=${a}`),g!==void 0&&e.push(`--source-root=${g}`),y!==void 0&&e.push(`--sources-content=${y}`),h&&e.push(`--target=${me(Array.isArray(h)?h:[h],"target")}`),k&&e.push(`--format=${k}`),f&&e.push(`--global-name=${f}`),w&&e.push(`--platform=${w}`),O&&e.push(`--tsconfig-raw=${typeof O=="string"?O:JSON.stringify(O)}`),V&&e.push("--minify"),A&&e.push("--minify-syntax"),M&&e.push("--minify-whitespace"),F&&e.push("--minify-identifiers"),$&&e.push(`--line-limit=${$}`),S&&e.push(`--charset=${S}`),p!==void 0&&e.push(`--tree-shaking=${p}`),u&&e.push("--ignore-annotations"),W)for(let E of W)e.push(`--drop:${Y(E,"drop")}`);if(T&&e.push(`--drop-labels=${me(T,"drop label")}`),B&&e.push(`--abs-paths=${me(B,"abs paths")}`),D&&e.push(`--mangle-props=${Pe(D)}`),R&&e.push(`--reserve-props=${Pe(R)}`),C!==void 0&&e.push(`--mangle-quoted=${C}`),s&&e.push(`--jsx=${s}`),o&&e.push(`--jsx-factory=${o}`),d&&e.push(`--jsx-fragment=${d}`),v&&e.push(`--jsx-import-source=${v}`),_&&e.push("--jsx-dev"),c&&e.push("--jsx-side-effects"),m)for(let E in m){if(E.indexOf("=")>=0)throw new Error(`Invalid define: ${E}`);e.push(`--define:${E}=${Y(m[E],"define",E)}`)}if(x)for(let E in x){if(E.indexOf("=")>=0)throw new Error(`Invalid log override: ${E}`);e.push(`--log-override:${E}=${Y(x[E],"log override",E)}`)}if(n)for(let E in n){if(E.indexOf("=")>=0)throw new Error(`Invalid supported: ${E}`);const N=n[E];if(typeof N!="boolean")throw new Error(`Expected value for supported ${J(E)} to be a boolean, got ${typeof N} instead`);e.push(`--supported:${E}=${N}`)}if(l)for(let E of l)e.push(`--pure:${Y(E,"pure")}`);b&&e.push("--keep-names")}function ot(e,t,r,a,g){var y;let h=[],k=[],f=Object.create(null),D=null,R=null;Te(h,t,f,r,a),Ge(h,t,f);let C=i(t,f,"sourcemap",Be),V=i(t,f,"bundle",L),A=i(t,f,"splitting",L),M=i(t,f,"preserveSymlinks",L),F=i(t,f,"metafile",L),$=i(t,f,"outfile",j),W=i(t,f,"outdir",j),T=i(t,f,"outbase",j),S=i(t,f,"tsconfig",j),p=i(t,f,"resolveExtensions",q),u=i(t,f,"nodePaths",q),s=i(t,f,"mainFields",q),o=i(t,f,"conditions",q),d=i(t,f,"external",q),v=i(t,f,"packages",j),_=i(t,f,"alias",Q),c=i(t,f,"loader",Q),m=i(t,f,"outExtension",Q),x=i(t,f,"publicPath",j),n=i(t,f,"entryNames",j),l=i(t,f,"chunkNames",j),b=i(t,f,"assetNames",j),w=i(t,f,"inject",q),O=i(t,f,"banner",Q),B=i(t,f,"footer",Q),E=i(t,f,"entryPoints",nt),N=i(t,f,"absWorkingDir",j),I=i(t,f,"stdin",Q),U=(y=i(t,f,"write",L))!=null?y:g,H=i(t,f,"allowOverwrite",L),G=i(t,f,"mangleCache",Q);if(f.plugins=!0,z(t,f,`in ${e}() call`),C&&h.push(`--sourcemap${C===!0?"":`=${C}`}`),V&&h.push("--bundle"),H&&h.push("--allow-overwrite"),A&&h.push("--splitting"),M&&h.push("--preserve-symlinks"),F&&h.push("--metafile"),$&&h.push(`--outfile=${$}`),W&&h.push(`--outdir=${W}`),T&&h.push(`--outbase=${T}`),S&&h.push(`--tsconfig=${S}`),v&&h.push(`--packages=${v}`),p&&h.push(`--resolve-extensions=${me(p,"resolve extension")}`),x&&h.push(`--public-path=${x}`),n&&h.push(`--entry-names=${n}`),l&&h.push(`--chunk-names=${l}`),b&&h.push(`--asset-names=${b}`),s&&h.push(`--main-fields=${me(s,"main field")}`),o&&h.push(`--conditions=${me(o,"condition")}`),d)for(let P of d)h.push(`--external:${Y(P,"external")}`);if(_)for(let P in _){if(P.indexOf("=")>=0)throw new Error(`Invalid package name in alias: ${P}`);h.push(`--alias:${P}=${Y(_[P],"alias",P)}`)}if(O)for(let P in O){if(P.indexOf("=")>=0)throw new Error(`Invalid banner file type: ${P}`);h.push(`--banner:${P}=${Y(O[P],"banner",P)}`)}if(B)for(let P in B){if(P.indexOf("=")>=0)throw new Error(`Invalid footer file type: ${P}`);h.push(`--footer:${P}=${Y(B[P],"footer",P)}`)}if(w)for(let P of w)h.push(`--inject:${Y(P,"inject")}`);if(c)for(let P in c){if(P.indexOf("=")>=0)throw new Error(`Invalid loader extension: ${P}`);h.push(`--loader:${P}=${Y(c[P],"loader",P)}`)}if(m)for(let P in m){if(P.indexOf("=")>=0)throw new Error(`Invalid out extension: ${P}`);h.push(`--out-extension:${P}=${Y(m[P],"out extension",P)}`)}if(E)if(Array.isArray(E))for(let P=0,se=E.length;P<se;P++){let X=E[P];if(typeof X=="object"&&X!==null){let ee=Object.create(null),ie=i(X,ee,"in",j),K=i(X,ee,"out",j);if(z(X,ee,"in entry point at index "+P),ie===void 0)throw new Error('Missing property "in" for entry point at index '+P);if(K===void 0)throw new Error('Missing property "out" for entry point at index '+P);k.push([K,ie])}else k.push(["",Y(X,"entry point at index "+P)])}else for(let P in E)k.push([P,Y(E[P],"entry point",P)]);if(I){let P=Object.create(null),se=i(I,P,"contents",We),X=i(I,P,"resolveDir",j),ee=i(I,P,"sourcefile",j),ie=i(I,P,"loader",j);z(I,P,'in "stdin" object'),ee&&h.push(`--sourcefile=${ee}`),ie&&h.push(`--loader=${ie}`),X&&(R=X),typeof se=="string"?D=Z(se):se instanceof Uint8Array&&(D=se)}let re=[];if(u)for(let P of u)P+="",re.push(P);return{entries:k,flags:h,write:U,stdinContents:D,stdinResolveDir:R,absWorkingDir:N,nodePaths:re,mangleCache:ze(G)}}function at(e,t,r,a){let g=[],y=Object.create(null);Te(g,t,y,r,a),Ge(g,t,y);let h=i(t,y,"sourcemap",Be),k=i(t,y,"sourcefile",j),f=i(t,y,"loader",j),D=i(t,y,"banner",j),R=i(t,y,"footer",j),C=i(t,y,"mangleCache",Q);return z(t,y,`in ${e}() call`),h&&g.push(`--sourcemap=${h===!0?"external":h}`),k&&g.push(`--sourcefile=${k}`),f&&g.push(`--loader=${f}`),D&&g.push(`--banner=${D}`),R&&g.push(`--footer=${R}`),{flags:g,mangleCache:ze(C)}}function ct(e){const t={},r={didClose:!1,reason:""};let a={},g=0,y=0,h=new Uint8Array(16*1024),k=0,f=S=>{let p=k+S.length;if(p>h.length){let s=new Uint8Array(p*2);s.set(h),h=s}h.set(S,k),k+=S.length;let u=0;for(;u+4<=k;){let s=Ie(h,u);if(u+4+s>k)break;u+=4,M(h.subarray(u,u+s)),u+=s}u>0&&(h.copyWithin(0,u,k),k-=u)},D=S=>{r.didClose=!0,S&&(r.reason=": "+(S.message||S));const p="The service was stopped"+r.reason;for(let u in a)a[u](p,null);a={}},R=(S,p,u)=>{if(r.didClose)return u("The service is no longer running"+r.reason,null);let s=g++;a[s]=(o,d)=>{try{u(o,d)}finally{S&&S.unref()}},S&&S.ref(),e.writeToStdin(Re({id:s,isRequest:!0,value:p}))},C=(S,p)=>{if(r.didClose)throw new Error("The service is no longer running"+r.reason);e.writeToStdin(Re({id:S,isRequest:!1,value:p}))},V=(S,p)=>le(null,null,function*(){try{if(p.command==="ping"){C(S,{});return}if(typeof p.key=="number"){const u=t[p.key];if(!u)return;const s=u[p.command];if(s){yield s(S,p);return}}throw new Error("Invalid command: "+p.command)}catch(u){const s=[fe(u,e,null,void 0,"")];try{C(S,{errors:s})}catch{}}}),A=!0,M=S=>{if(A){A=!1;let u=String.fromCharCode(...S);if(u!=="0.27.3")throw new Error(`Cannot start service: Host version "0.27.3" does not match binary version ${J(u)}`);return}let p=et(S);if(p.isRequest)V(p.id,p.value);else{let u=a[p.id];delete a[p.id],p.value.error?u(p.value.error,{}):u(null,p.value)}};return{readFromStdout:f,afterClose:D,service:{buildOrContext:({callName:S,refs:p,options:u,isTTY:s,defaultWD:o,callback:d})=>{let v=0;const _=y++,c={},m={ref(){++v===1&&p&&p.ref()},unref(){--v===0&&(delete t[_],p&&p.unref())}};t[_]=c,m.ref(),ut(S,_,R,C,m,e,c,u,s,o,(x,n)=>{try{d(x,n)}finally{m.unref()}})},transform:({callName:S,refs:p,input:u,options:s,isTTY:o,fs:d,callback:v})=>{const _=Je();let c=m=>{try{if(typeof u!="string"&&!(u instanceof Uint8Array))throw new Error('The input to "transform" must be a string or a Uint8Array');let{flags:x,mangleCache:n}=at(S,s,o,Fe),l={command:"transform",flags:x,inputFS:m!==null,input:m!==null?Z(m):typeof u=="string"?Z(u):u};n&&(l.mangleCache=n),R(p,l,(b,w)=>{if(b)return v(new Error(b),null);let O=ge(w.errors,_),B=ge(w.warnings,_),E=1,N=()=>{if(--E===0){let I={warnings:B,code:w.code,map:w.map,mangleCache:void 0,legalComments:void 0};"legalComments"in w&&(I.legalComments=w?.legalComments),w.mangleCache&&(I.mangleCache=w?.mangleCache),v(null,I)}};if(O.length>0)return v(be("Transform failed",O,B),null);w.codeFS&&(E++,d.readFile(w.code,(I,U)=>{I!==null?v(I,null):(w.code=U,N())})),w.mapFS&&(E++,d.readFile(w.map,(I,U)=>{I!==null?v(I,null):(w.map=U,N())})),N()})}catch(x){let n=[];try{Te(n,s,{},o,Fe)}catch{}const l=fe(x,e,_,void 0,"");R(p,{command:"error",flags:n,error:l},()=>{l.detail=_.load(l.detail),v(be("Transform failed",[l],[]),null)})}};if((typeof u=="string"||u instanceof Uint8Array)&&u.length>1024*1024){let m=c;c=()=>d.writeFile(u,m)}c(null)},formatMessages:({callName:S,refs:p,messages:u,options:s,callback:o})=>{if(!s)throw new Error(`Missing second argument in ${S}() call`);let d={},v=i(s,d,"kind",j),_=i(s,d,"color",L),c=i(s,d,"terminalWidth",ue);if(z(s,d,`in ${S}() call`),v===void 0)throw new Error(`Missing "kind" in ${S}() call`);if(v!=="error"&&v!=="warning")throw new Error(`Expected "kind" to be "error" or "warning" in ${S}() call`);let m={command:"format-msgs",messages:ne(u,"messages",null,"",c),isWarning:v==="warning"};_!==void 0&&(m.color=_),c!==void 0&&(m.terminalWidth=c),R(p,m,(x,n)=>{if(x)return o(new Error(x),null);o(null,n.messages)})},analyzeMetafile:({callName:S,refs:p,metafile:u,options:s,callback:o})=>{s===void 0&&(s={});let d={},v=i(s,d,"color",L),_=i(s,d,"verbose",L);z(s,d,`in ${S}() call`);let c={command:"analyze-metafile",metafile:u};v!==void 0&&(c.color=v),_!==void 0&&(c.verbose=_),R(p,c,(m,x)=>{if(m)return o(new Error(m),null);o(null,x.result)})}}}}function ut(e,t,r,a,g,y,h,k,f,D,R){const C=Je(),V=e==="context",A=($,W)=>{const T=[];try{Te(T,k,{},f,Me)}catch{}const S=fe($,y,C,void 0,W);r(g,{command:"error",flags:T,error:S},()=>{S.detail=C.load(S.detail),R(be(V?"Context failed":"Build failed",[S],[]),null)})};let M;if(typeof k=="object"){const $=k.plugins;if($!==void 0){if(!Array.isArray($))return A(new Error('"plugins" must be an array'),"");M=$}}if(M&&M.length>0){if(y.isSync)return A(new Error("Cannot use plugins in synchronous API calls"),"");ft(t,r,a,g,y,h,k,M,C).then($=>{if(!$.ok)return A($.error,$.pluginName);try{F($.requestPlugins,$.runOnEndCallbacks,$.scheduleOnDisposeCallbacks)}catch(W){A(W,"")}},$=>A($,""));return}try{F(null,($,W)=>W([],[]),()=>{})}catch($){A($,"")}function F($,W,T){const S=y.hasFS,{entries:p,flags:u,write:s,stdinContents:o,stdinResolveDir:d,absWorkingDir:v,nodePaths:_,mangleCache:c}=ot(e,k,f,Me,S);if(s&&!y.hasFS)throw new Error('The "write" option is unavailable in this environment');const m={command:"build",key:t,entries:p,flags:u,write:s,stdinContents:o,stdinResolveDir:d,absWorkingDir:v||D,nodePaths:_,context:V};$&&(m.plugins=$),c&&(m.mangleCache=c);const x=(b,w)=>{const O={errors:ge(b.errors,C),warnings:ge(b.warnings,C),outputFiles:void 0,metafile:void 0,mangleCache:void 0},B=O.errors.slice(),E=O.warnings.slice();b.outputFiles&&(O.outputFiles=b.outputFiles.map(ht)),b.metafile&&(O.metafile=JSON.parse(b.metafile)),b.mangleCache&&(O.mangleCache=b.mangleCache),b.writeToStdout!==void 0&&console.log(he(b.writeToStdout).replace(/\n$/,"")),W(O,(N,I)=>{if(B.length>0||N.length>0){const U=be("Build failed",B.concat(N),E.concat(I));return w(U,null,N,I)}w(null,O,N,I)})};let n,l;V&&(h["on-end"]=(b,w)=>new Promise(O=>{x(w,(B,E,N,I)=>{const U={errors:N,warnings:I};l&&l(B,E),n=void 0,l=void 0,a(b,U),O()})})),r(g,m,(b,w)=>{if(b)return R(new Error(b),null);if(!V)return x(w,(E,N)=>(T(),R(E,N)));if(w.errors.length>0)return R(be("Context failed",w.errors,w.warnings),null);let O=!1;const B={rebuild:()=>(n||(n=new Promise((E,N)=>{let I;l=(H,G)=>{I||(I=()=>H?N(H):E(G))};const U=()=>{r(g,{command:"rebuild",key:t},(G,re)=>{G?N(new Error(G)):I?I():U()})};U()})),n),watch:(E={})=>new Promise((N,I)=>{if(!y.hasFS)throw new Error('Cannot use the "watch" API in this environment');const U={},H=i(E,U,"delay",ue);z(E,U,"in watch() call");const G={command:"watch",key:t};H&&(G.delay=H),r(g,G,re=>{re?I(new Error(re)):N(void 0)})}),serve:(E={})=>new Promise((N,I)=>{if(!y.hasFS)throw new Error('Cannot use the "serve" API in this environment');const U={},H=i(E,U,"port",tt),G=i(E,U,"host",j),re=i(E,U,"servedir",j),P=i(E,U,"keyfile",j),se=i(E,U,"certfile",j),X=i(E,U,"fallback",j),ee=i(E,U,"cors",Q),ie=i(E,U,"onRequest",Ne);z(E,U,"in serve() call");const K={command:"serve",key:t,onRequest:!!ie};if(H!==void 0&&(K.port=H),G!==void 0&&(K.host=G),re!==void 0&&(K.servedir=re),P!==void 0&&(K.keyfile=P),se!==void 0&&(K.certfile=se),X!==void 0&&(K.fallback=X),ee){const xe={},pe=i(ee,xe,"origin",Le);z(ee,xe,'on "cors" object'),Array.isArray(pe)?K.corsOrigin=pe:pe!==void 0&&(K.corsOrigin=[pe])}r(g,K,(xe,pe)=>{if(xe)return I(new Error(xe));ie&&(h["serve-request"]=(jt,Pt)=>{ie(Pt.args),a(jt,{})}),N(pe)})}),cancel:()=>new Promise(E=>{if(O)return E();r(g,{command:"cancel",key:t},()=>{E()})}),dispose:()=>new Promise(E=>{if(O)return E();O=!0,r(g,{command:"dispose",key:t},()=>{E(),T(),g.unref()})})};g.ref(),R(null,B)})}}var ft=(e,t,r,a,g,y,h,k,f)=>le(null,null,function*(){let D=[],R=[],C={},V={},A=[],M=0,F=0,$=[],W=!1;k=[...k];for(let p of k){let u={};if(typeof p!="object")throw new Error(`Plugin at index ${F} must be an object`);const s=i(p,u,"name",j);if(typeof s!="string"||s==="")throw new Error(`Plugin at index ${F} is missing a name`);try{let o=i(p,u,"setup",Ne);if(typeof o!="function")throw new Error("Plugin is missing a setup function");z(p,u,`on plugin ${J(s)}`);let d={name:s,onStart:!1,onEnd:!1,onResolve:[],onLoad:[]};F++;let _=o({initialOptions:h,resolve:(c,m={})=>{if(!W)throw new Error('Cannot call "resolve" before plugin setup has completed');if(typeof c!="string")throw new Error("The path to resolve must be a string");let x=Object.create(null),n=i(m,x,"pluginName",j),l=i(m,x,"importer",j),b=i(m,x,"namespace",j),w=i(m,x,"resolveDir",j),O=i(m,x,"kind",j),B=i(m,x,"pluginData",ke),E=i(m,x,"with",Q);return z(m,x,"in resolve() call"),new Promise((N,I)=>{const U={command:"resolve",path:c,key:e,pluginName:s};if(n!=null&&(U.pluginName=n),l!=null&&(U.importer=l),b!=null&&(U.namespace=b),w!=null&&(U.resolveDir=w),O!=null)U.kind=O;else throw new Error('Must specify "kind" when calling "resolve"');B!=null&&(U.pluginData=f.store(B)),E!=null&&(U.with=dt(E,"with")),t(a,U,(H,G)=>{H!==null?I(new Error(H)):N({errors:ge(G.errors,f),warnings:ge(G.warnings,f),path:G.path,external:G.external,sideEffects:G.sideEffects,namespace:G.namespace,suffix:G.suffix,pluginData:f.load(G.pluginData)})})})},onStart(c){let m='This error came from the "onStart" callback registered here:',x=$e(new Error(m),g,"onStart");D.push({name:s,callback:c,note:x}),d.onStart=!0},onEnd(c){let m='This error came from the "onEnd" callback registered here:',x=$e(new Error(m),g,"onEnd");R.push({name:s,callback:c,note:x}),d.onEnd=!0},onResolve(c,m){let x='This error came from the "onResolve" callback registered here:',n=$e(new Error(x),g,"onResolve"),l={},b=i(c,l,"filter",Se),w=i(c,l,"namespace",j);if(z(c,l,`in onResolve() call for plugin ${J(s)}`),b==null)throw new Error("onResolve() call is missing a filter");let O=M++;C[O]={name:s,callback:m,note:n},d.onResolve.push({id:O,filter:Pe(b),namespace:w||""})},onLoad(c,m){let x='This error came from the "onLoad" callback registered here:',n=$e(new Error(x),g,"onLoad"),l={},b=i(c,l,"filter",Se),w=i(c,l,"namespace",j);if(z(c,l,`in onLoad() call for plugin ${J(s)}`),b==null)throw new Error("onLoad() call is missing a filter");let O=M++;V[O]={name:s,callback:m,note:n},d.onLoad.push({id:O,filter:Pe(b),namespace:w||""})},onDispose(c){A.push(c)},esbuild:g.esbuild});_&&(yield _),$.push(d)}catch(o){return{ok:!1,error:o,pluginName:s}}}y["on-start"]=(p,u)=>le(null,null,function*(){f.clear();let s={errors:[],warnings:[]};yield Promise.all(D.map(o=>le(null,[o],function*({name:d,callback:v,note:_}){try{let c=yield v();if(c!=null){if(typeof c!="object")throw new Error(`Expected onStart() callback in plugin ${J(d)} to return an object`);let m={},x=i(c,m,"errors",te),n=i(c,m,"warnings",te);z(c,m,`from onStart() callback in plugin ${J(d)}`),x!=null&&s.errors.push(...ne(x,"errors",f,d,void 0)),n!=null&&s.warnings.push(...ne(n,"warnings",f,d,void 0))}}catch(c){s.errors.push(fe(c,g,f,_&&_(),d))}}))),r(p,s)}),y["on-resolve"]=(p,u)=>le(null,null,function*(){let s={},o="",d,v;for(let _ of u.ids)try{({name:o,callback:d,note:v}=C[_]);let c=yield d({path:u.path,importer:u.importer,namespace:u.namespace,resolveDir:u.resolveDir,kind:u.kind,pluginData:f.load(u.pluginData),with:u.with});if(c!=null){if(typeof c!="object")throw new Error(`Expected onResolve() callback in plugin ${J(o)} to return an object`);let m={},x=i(c,m,"pluginName",j),n=i(c,m,"path",j),l=i(c,m,"namespace",j),b=i(c,m,"suffix",j),w=i(c,m,"external",L),O=i(c,m,"sideEffects",L),B=i(c,m,"pluginData",ke),E=i(c,m,"errors",te),N=i(c,m,"warnings",te),I=i(c,m,"watchFiles",q),U=i(c,m,"watchDirs",q);z(c,m,`from onResolve() callback in plugin ${J(o)}`),s.id=_,x!=null&&(s.pluginName=x),n!=null&&(s.path=n),l!=null&&(s.namespace=l),b!=null&&(s.suffix=b),w!=null&&(s.external=w),O!=null&&(s.sideEffects=O),B!=null&&(s.pluginData=f.store(B)),E!=null&&(s.errors=ne(E,"errors",f,o,void 0)),N!=null&&(s.warnings=ne(N,"warnings",f,o,void 0)),I!=null&&(s.watchFiles=je(I,"watchFiles")),U!=null&&(s.watchDirs=je(U,"watchDirs"));break}}catch(c){s={id:_,errors:[fe(c,g,f,v&&v(),o)]};break}r(p,s)}),y["on-load"]=(p,u)=>le(null,null,function*(){let s={},o="",d,v;for(let _ of u.ids)try{({name:o,callback:d,note:v}=V[_]);let c=yield d({path:u.path,namespace:u.namespace,suffix:u.suffix,pluginData:f.load(u.pluginData),with:u.with});if(c!=null){if(typeof c!="object")throw new Error(`Expected onLoad() callback in plugin ${J(o)} to return an object`);let m={},x=i(c,m,"pluginName",j),n=i(c,m,"contents",We),l=i(c,m,"resolveDir",j),b=i(c,m,"pluginData",ke),w=i(c,m,"loader",j),O=i(c,m,"errors",te),B=i(c,m,"warnings",te),E=i(c,m,"watchFiles",q),N=i(c,m,"watchDirs",q);z(c,m,`from onLoad() callback in plugin ${J(o)}`),s.id=_,x!=null&&(s.pluginName=x),n instanceof Uint8Array?s.contents=n:n!=null&&(s.contents=Z(n)),l!=null&&(s.resolveDir=l),b!=null&&(s.pluginData=f.store(b)),w!=null&&(s.loader=w),O!=null&&(s.errors=ne(O,"errors",f,o,void 0)),B!=null&&(s.warnings=ne(B,"warnings",f,o,void 0)),E!=null&&(s.watchFiles=je(E,"watchFiles")),N!=null&&(s.watchDirs=je(N,"watchDirs"));break}}catch(c){s={id:_,errors:[fe(c,g,f,v&&v(),o)]};break}r(p,s)});let T=(p,u)=>u([],[]);R.length>0&&(T=(p,u)=>{le(null,null,function*(){const s=[],o=[];for(const{name:d,callback:v,note:_}of R){let c,m;try{const x=yield v(p);if(x!=null){if(typeof x!="object")throw new Error(`Expected onEnd() callback in plugin ${J(d)} to return an object`);let n={},l=i(x,n,"errors",te),b=i(x,n,"warnings",te);z(x,n,`from onEnd() callback in plugin ${J(d)}`),l!=null&&(c=ne(l,"errors",f,d,void 0)),b!=null&&(m=ne(b,"warnings",f,d,void 0))}}catch(x){c=[fe(x,g,f,_&&_(),d)]}if(c){s.push(...c);try{p.errors.push(...c)}catch{}}if(m){o.push(...m);try{p.warnings.push(...m)}catch{}}}u(s,o)})});let S=()=>{for(const p of A)setTimeout(()=>p(),0)};return W=!0,{ok:!0,requestPlugins:$,runOnEndCallbacks:T,scheduleOnDisposeCallbacks:S}});function Je(){const e=new Map;let t=0;return{clear(){e.clear()},load(r){return e.get(r)},store(r){if(r===void 0)return-1;const a=t++;return e.set(a,r),a}}}function $e(e,t,r){let a,g=!1;return()=>{if(g)return a;g=!0;try{let y=(e.stack+"").split(`
`);y.splice(1,1);let h=qe(t,y,r);if(h)return a={text:e.message,location:h},a}catch{}}}function fe(e,t,r,a,g){let y="Internal error",h=null;try{y=(e&&e.message||e)+""}catch{}try{h=qe(t,(e.stack+"").split(`
`),"")}catch{}return{id:"",pluginName:g,text:y,location:h,notes:a?[a]:[],detail:r?r.store(e):-1}}function qe(e,t,r){let a="    at ";if(e.readFileSync&&!t[0].startsWith(a)&&t[1].startsWith(a))for(let g=1;g<t.length;g++){let y=t[g];if(y.startsWith(a))for(y=y.slice(a.length);;){let h=/^(?:new |async )?\S+ \((.*)\)$/.exec(y);if(h){y=h[1];continue}if(h=/^eval at \S+ \((.*)\)(?:, \S+:\d+:\d+)?$/.exec(y),h){y=h[1];continue}if(h=/^(\S+):(\d+):(\d+)$/.exec(y),h){let k;try{k=e.readFileSync(h[1],"utf8")}catch{break}let f=k.split(/\r\n|\r|\n|\u2028|\u2029/)[+h[2]-1]||"",D=+h[3]-1,R=f.slice(D,D+r.length)===r?r.length:0;return{file:h[1],namespace:"file",line:+h[2],column:Z(f.slice(0,D)).length,length:Z(f.slice(D,D+R)).length,lineText:f+`
`+t.slice(1).join(`
`),suggestion:""}}break}}return null}function be(e,t,r){let a=5;e+=t.length<1?"":` with ${t.length} error${t.length<2?"":"s"}:`+t.slice(0,a+1).map((y,h)=>{if(h===a)return`
...`;if(!y.location)return`
error: ${y.text}`;let{file:k,line:f,column:D}=y.location,R=y.pluginName?`[plugin: ${y.pluginName}] `:"";return`
${k}:${f}:${D}: ERROR: ${R}${y.text}`}).join("");let g=new Error(e);for(const[y,h]of[["errors",t],["warnings",r]])Object.defineProperty(g,y,{configurable:!0,enumerable:!0,get:()=>h,set:k=>Object.defineProperty(g,y,{configurable:!0,enumerable:!0,value:k})});return g}function ge(e,t){for(const r of e)r.detail=t.load(r.detail);return e}function Ye(e,t,r){if(e==null)return null;let a={},g=i(e,a,"file",j),y=i(e,a,"namespace",j),h=i(e,a,"line",ue),k=i(e,a,"column",ue),f=i(e,a,"length",ue),D=i(e,a,"lineText",j),R=i(e,a,"suggestion",j);if(z(e,a,t),D){const C=D.slice(0,(k&&k>0?k:0)+(f&&f>0?f:0)+(r&&r>0?r:80));!/[\x7F-\uFFFF]/.test(C)&&!/\n/.test(D)&&(D=C)}return{file:g||"",namespace:y||"",line:h||0,column:k||0,length:f||0,lineText:D||"",suggestion:R||""}}function ne(e,t,r,a,g){let y=[],h=0;for(const k of e){let f={},D=i(k,f,"id",j),R=i(k,f,"pluginName",j),C=i(k,f,"text",j),V=i(k,f,"location",Ve),A=i(k,f,"notes",te),M=i(k,f,"detail",ke),F=`in element ${h} of "${t}"`;z(k,f,F);let $=[];if(A)for(const W of A){let T={},S=i(W,T,"text",j),p=i(W,T,"location",Ve);z(W,T,F),$.push({text:S||"",location:Ye(p,F,g)})}y.push({id:D||"",pluginName:R||a,text:C||"",location:Ye(V,F,g),notes:$,detail:r?r.store(M):-1}),h++}return y}function je(e,t){const r=[];for(const a of e){if(typeof a!="string")throw new Error(`${J(t)} must be an array of strings`);r.push(a)}return r}function dt(e,t){const r=Object.create(null);for(const a in e){const g=e[a];if(typeof g!="string")throw new Error(`key ${J(a)} in object ${J(t)} must be a string`);r[a]=g}return r}function ht({path:e,contents:t,hash:r}){let a=null;return{path:e,contents:t,hash:r,get text(){const g=this.contents;return(a===null||g!==t)&&(t=g,a=he(g)),a}}}function Pe(e){let t=e.source;return e.flags&&(t=`(?${e.flags})${t}`),t}var mt="0.27.3",gt=e=>ve().build(e),pt=e=>ve().context(e),yt=(e,t)=>ve().transform(e,t),wt=(e,t)=>ve().formatMessages(e,t),bt=(e,t)=>ve().analyzeMetafile(e,t),vt=()=>{throw new Error('The "buildSync" API only works in node')},xt=()=>{throw new Error('The "transformSync" API only works in node')},_t=()=>{throw new Error('The "formatMessagesSync" API only works in node')},Et=()=>{throw new Error('The "analyzeMetafileSync" API only works in node')},kt=()=>(Oe&&Oe(),Promise.resolve()),de,Oe,Ce,ve=()=>{if(Ce)return Ce;throw de?new Error('You need to wait for the promise returned from "initialize" to be resolved before calling this'):new Error('You need to call "initialize" before calling this')},St=e=>{e=lt(e||{});let t=e.wasmURL,r=e.wasmModule,a=e.worker!==!1;if(!t&&!r)throw new Error('Must provide either the "wasmURL" option or the "wasmModule" option');if(de)throw new Error('Cannot call "initialize" more than once');return de=Tt(t||"",r,a),de.catch(()=>{de=void 0}),de},Tt=(e,t,r)=>le(null,null,function*(){let a,g;const y=new Promise(C=>g=C);if(r){let C=new Blob([`onmessage=((postMessage) => {
      // Copyright 2018 The Go Authors. All rights reserved.
      // Use of this source code is governed by a BSD-style
      // license that can be found in the LICENSE file.
      var __async = (__this, __arguments, generator) => {
        return new Promise((resolve, reject) => {
          var fulfilled = (value) => {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          };
          var rejected = (value) => {
            try {
              step(generator.throw(value));
            } catch (e) {
              reject(e);
            }
          };
          var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
          step((generator = generator.apply(__this, __arguments)).next());
        });
      };
      let onmessage;
      let globalThis = {};
      for (let o = self; o; o = Object.getPrototypeOf(o))
        for (let k of Object.getOwnPropertyNames(o))
          if (!(k in globalThis))
            Object.defineProperty(globalThis, k, { get: () => self[k] });
      "use strict";
      (() => {
        const enosys = () => {
          const err = new Error("not implemented");
          err.code = "ENOSYS";
          return err;
        };
        if (!globalThis.fs) {
          let outputBuf = "";
          globalThis.fs = {
            constants: { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1, O_DIRECTORY: -1 },
            // unused
            writeSync(fd, buf) {
              outputBuf += decoder.decode(buf);
              const nl = outputBuf.lastIndexOf("\\n");
              if (nl != -1) {
                console.log(outputBuf.substring(0, nl));
                outputBuf = outputBuf.substring(nl + 1);
              }
              return buf.length;
            },
            write(fd, buf, offset, length, position, callback) {
              if (offset !== 0 || length !== buf.length || position !== null) {
                callback(enosys());
                return;
              }
              const n = this.writeSync(fd, buf);
              callback(null, n);
            },
            chmod(path, mode, callback) {
              callback(enosys());
            },
            chown(path, uid, gid, callback) {
              callback(enosys());
            },
            close(fd, callback) {
              callback(enosys());
            },
            fchmod(fd, mode, callback) {
              callback(enosys());
            },
            fchown(fd, uid, gid, callback) {
              callback(enosys());
            },
            fstat(fd, callback) {
              callback(enosys());
            },
            fsync(fd, callback) {
              callback(null);
            },
            ftruncate(fd, length, callback) {
              callback(enosys());
            },
            lchown(path, uid, gid, callback) {
              callback(enosys());
            },
            link(path, link, callback) {
              callback(enosys());
            },
            lstat(path, callback) {
              callback(enosys());
            },
            mkdir(path, perm, callback) {
              callback(enosys());
            },
            open(path, flags, mode, callback) {
              callback(enosys());
            },
            read(fd, buffer, offset, length, position, callback) {
              callback(enosys());
            },
            readdir(path, callback) {
              callback(enosys());
            },
            readlink(path, callback) {
              callback(enosys());
            },
            rename(from, to, callback) {
              callback(enosys());
            },
            rmdir(path, callback) {
              callback(enosys());
            },
            stat(path, callback) {
              callback(enosys());
            },
            symlink(path, link, callback) {
              callback(enosys());
            },
            truncate(path, length, callback) {
              callback(enosys());
            },
            unlink(path, callback) {
              callback(enosys());
            },
            utimes(path, atime, mtime, callback) {
              callback(enosys());
            }
          };
        }
        if (!globalThis.process) {
          globalThis.process = {
            getuid() {
              return -1;
            },
            getgid() {
              return -1;
            },
            geteuid() {
              return -1;
            },
            getegid() {
              return -1;
            },
            getgroups() {
              throw enosys();
            },
            pid: -1,
            ppid: -1,
            umask() {
              throw enosys();
            },
            cwd() {
              throw enosys();
            },
            chdir() {
              throw enosys();
            }
          };
        }
        if (!globalThis.path) {
          globalThis.path = {
            resolve(...pathSegments) {
              return pathSegments.join("/");
            }
          };
        }
        if (!globalThis.crypto) {
          throw new Error("globalThis.crypto is not available, polyfill required (crypto.getRandomValues only)");
        }
        if (!globalThis.performance) {
          throw new Error("globalThis.performance is not available, polyfill required (performance.now only)");
        }
        if (!globalThis.TextEncoder) {
          throw new Error("globalThis.TextEncoder is not available, polyfill required");
        }
        if (!globalThis.TextDecoder) {
          throw new Error("globalThis.TextDecoder is not available, polyfill required");
        }
        const encoder = new TextEncoder("utf-8");
        const decoder = new TextDecoder("utf-8");
        globalThis.Go = class {
          constructor() {
            this.argv = ["js"];
            this.env = {};
            this.exit = (code) => {
              if (code !== 0) {
                console.warn("exit code:", code);
              }
            };
            this._exitPromise = new Promise((resolve) => {
              this._resolveExitPromise = resolve;
            });
            this._pendingEvent = null;
            this._scheduledTimeouts = /* @__PURE__ */ new Map();
            this._nextCallbackTimeoutID = 1;
            const setInt64 = (addr, v) => {
              this.mem.setUint32(addr + 0, v, true);
              this.mem.setUint32(addr + 4, Math.floor(v / 4294967296), true);
            };
            const setInt32 = (addr, v) => {
              this.mem.setUint32(addr + 0, v, true);
            };
            const getInt64 = (addr) => {
              const low = this.mem.getUint32(addr + 0, true);
              const high = this.mem.getInt32(addr + 4, true);
              return low + high * 4294967296;
            };
            const loadValue = (addr) => {
              const f = this.mem.getFloat64(addr, true);
              if (f === 0) {
                return void 0;
              }
              if (!isNaN(f)) {
                return f;
              }
              const id = this.mem.getUint32(addr, true);
              return this._values[id];
            };
            const storeValue = (addr, v) => {
              const nanHead = 2146959360;
              if (typeof v === "number" && v !== 0) {
                if (isNaN(v)) {
                  this.mem.setUint32(addr + 4, nanHead, true);
                  this.mem.setUint32(addr, 0, true);
                  return;
                }
                this.mem.setFloat64(addr, v, true);
                return;
              }
              if (v === void 0) {
                this.mem.setFloat64(addr, 0, true);
                return;
              }
              let id = this._ids.get(v);
              if (id === void 0) {
                id = this._idPool.pop();
                if (id === void 0) {
                  id = this._values.length;
                }
                this._values[id] = v;
                this._goRefCounts[id] = 0;
                this._ids.set(v, id);
              }
              this._goRefCounts[id]++;
              let typeFlag = 0;
              switch (typeof v) {
                case "object":
                  if (v !== null) {
                    typeFlag = 1;
                  }
                  break;
                case "string":
                  typeFlag = 2;
                  break;
                case "symbol":
                  typeFlag = 3;
                  break;
                case "function":
                  typeFlag = 4;
                  break;
              }
              this.mem.setUint32(addr + 4, nanHead | typeFlag, true);
              this.mem.setUint32(addr, id, true);
            };
            const loadSlice = (addr) => {
              const array = getInt64(addr + 0);
              const len = getInt64(addr + 8);
              return new Uint8Array(this._inst.exports.mem.buffer, array, len);
            };
            const loadSliceOfValues = (addr) => {
              const array = getInt64(addr + 0);
              const len = getInt64(addr + 8);
              const a = new Array(len);
              for (let i = 0; i < len; i++) {
                a[i] = loadValue(array + i * 8);
              }
              return a;
            };
            const loadString = (addr) => {
              const saddr = getInt64(addr + 0);
              const len = getInt64(addr + 8);
              return decoder.decode(new DataView(this._inst.exports.mem.buffer, saddr, len));
            };
            const testCallExport = (a, b) => {
              this._inst.exports.testExport0();
              return this._inst.exports.testExport(a, b);
            };
            const timeOrigin = Date.now() - performance.now();
            this.importObject = {
              _gotest: {
                add: (a, b) => a + b,
                callExport: testCallExport
              },
              gojs: {
                // Go's SP does not change as long as no Go code is running. Some operations (e.g. calls, getters and setters)
                // may synchronously trigger a Go event handler. This makes Go code get executed in the middle of the imported
                // function. A goroutine can switch to a new stack if the current stack is too small (see morestack function).
                // This changes the SP, thus we have to update the SP used by the imported function.
                // func wasmExit(code int32)
                "runtime.wasmExit": (sp) => {
                  sp >>>= 0;
                  const code = this.mem.getInt32(sp + 8, true);
                  this.exited = true;
                  delete this._inst;
                  delete this._values;
                  delete this._goRefCounts;
                  delete this._ids;
                  delete this._idPool;
                  this.exit(code);
                },
                // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
                "runtime.wasmWrite": (sp) => {
                  sp >>>= 0;
                  const fd = getInt64(sp + 8);
                  const p = getInt64(sp + 16);
                  const n = this.mem.getInt32(sp + 24, true);
                  globalThis.fs.writeSync(fd, new Uint8Array(this._inst.exports.mem.buffer, p, n));
                },
                // func resetMemoryDataView()
                "runtime.resetMemoryDataView": (sp) => {
                  sp >>>= 0;
                  this.mem = new DataView(this._inst.exports.mem.buffer);
                },
                // func nanotime1() int64
                "runtime.nanotime1": (sp) => {
                  sp >>>= 0;
                  setInt64(sp + 8, (timeOrigin + performance.now()) * 1e6);
                },
                // func walltime() (sec int64, nsec int32)
                "runtime.walltime": (sp) => {
                  sp >>>= 0;
                  const msec = (/* @__PURE__ */ new Date()).getTime();
                  setInt64(sp + 8, msec / 1e3);
                  this.mem.setInt32(sp + 16, msec % 1e3 * 1e6, true);
                },
                // func scheduleTimeoutEvent(delay int64) int32
                "runtime.scheduleTimeoutEvent": (sp) => {
                  sp >>>= 0;
                  const id = this._nextCallbackTimeoutID;
                  this._nextCallbackTimeoutID++;
                  this._scheduledTimeouts.set(id, setTimeout(
                    () => {
                      this._resume();
                      while (this._scheduledTimeouts.has(id)) {
                        console.warn("scheduleTimeoutEvent: missed timeout event");
                        this._resume();
                      }
                    },
                    getInt64(sp + 8)
                  ));
                  this.mem.setInt32(sp + 16, id, true);
                },
                // func clearTimeoutEvent(id int32)
                "runtime.clearTimeoutEvent": (sp) => {
                  sp >>>= 0;
                  const id = this.mem.getInt32(sp + 8, true);
                  clearTimeout(this._scheduledTimeouts.get(id));
                  this._scheduledTimeouts.delete(id);
                },
                // func getRandomData(r []byte)
                "runtime.getRandomData": (sp) => {
                  sp >>>= 0;
                  crypto.getRandomValues(loadSlice(sp + 8));
                },
                // func finalizeRef(v ref)
                "syscall/js.finalizeRef": (sp) => {
                  sp >>>= 0;
                  const id = this.mem.getUint32(sp + 8, true);
                  this._goRefCounts[id]--;
                  if (this._goRefCounts[id] === 0) {
                    const v = this._values[id];
                    this._values[id] = null;
                    this._ids.delete(v);
                    this._idPool.push(id);
                  }
                },
                // func stringVal(value string) ref
                "syscall/js.stringVal": (sp) => {
                  sp >>>= 0;
                  storeValue(sp + 24, loadString(sp + 8));
                },
                // func valueGet(v ref, p string) ref
                "syscall/js.valueGet": (sp) => {
                  sp >>>= 0;
                  const result = Reflect.get(loadValue(sp + 8), loadString(sp + 16));
                  sp = this._inst.exports.getsp() >>> 0;
                  storeValue(sp + 32, result);
                },
                // func valueSet(v ref, p string, x ref)
                "syscall/js.valueSet": (sp) => {
                  sp >>>= 0;
                  Reflect.set(loadValue(sp + 8), loadString(sp + 16), loadValue(sp + 32));
                },
                // func valueDelete(v ref, p string)
                "syscall/js.valueDelete": (sp) => {
                  sp >>>= 0;
                  Reflect.deleteProperty(loadValue(sp + 8), loadString(sp + 16));
                },
                // func valueIndex(v ref, i int) ref
                "syscall/js.valueIndex": (sp) => {
                  sp >>>= 0;
                  storeValue(sp + 24, Reflect.get(loadValue(sp + 8), getInt64(sp + 16)));
                },
                // valueSetIndex(v ref, i int, x ref)
                "syscall/js.valueSetIndex": (sp) => {
                  sp >>>= 0;
                  Reflect.set(loadValue(sp + 8), getInt64(sp + 16), loadValue(sp + 24));
                },
                // func valueCall(v ref, m string, args []ref) (ref, bool)
                "syscall/js.valueCall": (sp) => {
                  sp >>>= 0;
                  try {
                    const v = loadValue(sp + 8);
                    const m = Reflect.get(v, loadString(sp + 16));
                    const args = loadSliceOfValues(sp + 32);
                    const result = Reflect.apply(m, v, args);
                    sp = this._inst.exports.getsp() >>> 0;
                    storeValue(sp + 56, result);
                    this.mem.setUint8(sp + 64, 1);
                  } catch (err) {
                    sp = this._inst.exports.getsp() >>> 0;
                    storeValue(sp + 56, err);
                    this.mem.setUint8(sp + 64, 0);
                  }
                },
                // func valueInvoke(v ref, args []ref) (ref, bool)
                "syscall/js.valueInvoke": (sp) => {
                  sp >>>= 0;
                  try {
                    const v = loadValue(sp + 8);
                    const args = loadSliceOfValues(sp + 16);
                    const result = Reflect.apply(v, void 0, args);
                    sp = this._inst.exports.getsp() >>> 0;
                    storeValue(sp + 40, result);
                    this.mem.setUint8(sp + 48, 1);
                  } catch (err) {
                    sp = this._inst.exports.getsp() >>> 0;
                    storeValue(sp + 40, err);
                    this.mem.setUint8(sp + 48, 0);
                  }
                },
                // func valueNew(v ref, args []ref) (ref, bool)
                "syscall/js.valueNew": (sp) => {
                  sp >>>= 0;
                  try {
                    const v = loadValue(sp + 8);
                    const args = loadSliceOfValues(sp + 16);
                    const result = Reflect.construct(v, args);
                    sp = this._inst.exports.getsp() >>> 0;
                    storeValue(sp + 40, result);
                    this.mem.setUint8(sp + 48, 1);
                  } catch (err) {
                    sp = this._inst.exports.getsp() >>> 0;
                    storeValue(sp + 40, err);
                    this.mem.setUint8(sp + 48, 0);
                  }
                },
                // func valueLength(v ref) int
                "syscall/js.valueLength": (sp) => {
                  sp >>>= 0;
                  setInt64(sp + 16, parseInt(loadValue(sp + 8).length));
                },
                // valuePrepareString(v ref) (ref, int)
                "syscall/js.valuePrepareString": (sp) => {
                  sp >>>= 0;
                  const str = encoder.encode(String(loadValue(sp + 8)));
                  storeValue(sp + 16, str);
                  setInt64(sp + 24, str.length);
                },
                // valueLoadString(v ref, b []byte)
                "syscall/js.valueLoadString": (sp) => {
                  sp >>>= 0;
                  const str = loadValue(sp + 8);
                  loadSlice(sp + 16).set(str);
                },
                // func valueInstanceOf(v ref, t ref) bool
                "syscall/js.valueInstanceOf": (sp) => {
                  sp >>>= 0;
                  this.mem.setUint8(sp + 24, loadValue(sp + 8) instanceof loadValue(sp + 16) ? 1 : 0);
                },
                // func copyBytesToGo(dst []byte, src ref) (int, bool)
                "syscall/js.copyBytesToGo": (sp) => {
                  sp >>>= 0;
                  const dst = loadSlice(sp + 8);
                  const src = loadValue(sp + 32);
                  if (!(src instanceof Uint8Array || src instanceof Uint8ClampedArray)) {
                    this.mem.setUint8(sp + 48, 0);
                    return;
                  }
                  const toCopy = src.subarray(0, dst.length);
                  dst.set(toCopy);
                  setInt64(sp + 40, toCopy.length);
                  this.mem.setUint8(sp + 48, 1);
                },
                // func copyBytesToJS(dst ref, src []byte) (int, bool)
                "syscall/js.copyBytesToJS": (sp) => {
                  sp >>>= 0;
                  const dst = loadValue(sp + 8);
                  const src = loadSlice(sp + 16);
                  if (!(dst instanceof Uint8Array || dst instanceof Uint8ClampedArray)) {
                    this.mem.setUint8(sp + 48, 0);
                    return;
                  }
                  const toCopy = src.subarray(0, dst.length);
                  dst.set(toCopy);
                  setInt64(sp + 40, toCopy.length);
                  this.mem.setUint8(sp + 48, 1);
                },
                "debug": (value) => {
                  console.log(value);
                }
              }
            };
          }
          run(instance) {
            return __async(this, null, function* () {
              if (!(instance instanceof WebAssembly.Instance)) {
                throw new Error("Go.run: WebAssembly.Instance expected");
              }
              this._inst = instance;
              this.mem = new DataView(this._inst.exports.mem.buffer);
              this._values = [
                // JS values that Go currently has references to, indexed by reference id
                NaN,
                0,
                null,
                true,
                false,
                globalThis,
                this
              ];
              this._goRefCounts = new Array(this._values.length).fill(Infinity);
              this._ids = /* @__PURE__ */ new Map([
                // mapping from JS values to reference ids
                [0, 1],
                [null, 2],
                [true, 3],
                [false, 4],
                [globalThis, 5],
                [this, 6]
              ]);
              this._idPool = [];
              this.exited = false;
              let offset = 4096;
              const strPtr = (str) => {
                const ptr = offset;
                const bytes = encoder.encode(str + "\\0");
                new Uint8Array(this.mem.buffer, offset, bytes.length).set(bytes);
                offset += bytes.length;
                if (offset % 8 !== 0) {
                  offset += 8 - offset % 8;
                }
                return ptr;
              };
              const argc = this.argv.length;
              const argvPtrs = [];
              this.argv.forEach((arg) => {
                argvPtrs.push(strPtr(arg));
              });
              argvPtrs.push(0);
              const keys = Object.keys(this.env).sort();
              keys.forEach((key) => {
                argvPtrs.push(strPtr(\`\${key}=\${this.env[key]}\`));
              });
              argvPtrs.push(0);
              const argv = offset;
              argvPtrs.forEach((ptr) => {
                this.mem.setUint32(offset, ptr, true);
                this.mem.setUint32(offset + 4, 0, true);
                offset += 8;
              });
              const wasmMinDataAddr = 4096 + 8192;
              if (offset >= wasmMinDataAddr) {
                throw new Error("total length of command line and environment variables exceeds limit");
              }
              this._inst.exports.run(argc, argv);
              if (this.exited) {
                this._resolveExitPromise();
              }
              yield this._exitPromise;
            });
          }
          _resume() {
            if (this.exited) {
              throw new Error("Go program has already exited");
            }
            this._inst.exports.resume();
            if (this.exited) {
              this._resolveExitPromise();
            }
          }
          _makeFuncWrapper(id) {
            const go = this;
            return function() {
              const event = { id, this: this, args: arguments };
              go._pendingEvent = event;
              go._resume();
              return event.result;
            };
          }
        };
      })();
      onmessage = ({ data: wasm }) => {
        let decoder = new TextDecoder();
        let fs = globalThis.fs;
        let stderr = "";
        fs.writeSync = (fd, buffer) => {
          if (fd === 1) {
            postMessage(buffer);
          } else if (fd === 2) {
            stderr += decoder.decode(buffer);
            let parts = stderr.split("\\n");
            if (parts.length > 1) console.log(parts.slice(0, -1).join("\\n"));
            stderr = parts[parts.length - 1];
          } else {
            throw new Error("Bad write");
          }
          return buffer.length;
        };
        let stdin = [];
        let resumeStdin;
        let stdinPos = 0;
        onmessage = ({ data }) => {
          if (data.length > 0) {
            stdin.push(data);
            if (resumeStdin) resumeStdin();
          }
          return go;
        };
        fs.read = (fd, buffer, offset, length, position, callback) => {
          if (fd !== 0 || offset !== 0 || length !== buffer.length || position !== null) {
            throw new Error("Bad read");
          }
          if (stdin.length === 0) {
            resumeStdin = () => fs.read(fd, buffer, offset, length, position, callback);
            return;
          }
          let first = stdin[0];
          let count = Math.max(0, Math.min(length, first.length - stdinPos));
          buffer.set(first.subarray(stdinPos, stdinPos + count), offset);
          stdinPos += count;
          if (stdinPos === first.length) {
            stdin.shift();
            stdinPos = 0;
          }
          callback(null, count);
        };
        let go = new globalThis.Go();
        go.argv = ["", \`--service=\${"0.27.3"}\`];
        tryToInstantiateModule(wasm, go).then(
          (instance) => {
            postMessage(null);
            go.run(instance);
          },
          (error) => {
            postMessage(error);
          }
        );
        return go;
      };
      function tryToInstantiateModule(wasm, go) {
        return __async(this, null, function* () {
          if (wasm instanceof WebAssembly.Module) {
            return WebAssembly.instantiate(wasm, go.importObject);
          }
          const res = yield fetch(wasm);
          if (!res.ok) throw new Error(\`Failed to download \${JSON.stringify(wasm)}\`);
          if ("instantiateStreaming" in WebAssembly && /^application\\/wasm($|;)/i.test(res.headers.get("Content-Type") || "")) {
            const result2 = yield WebAssembly.instantiateStreaming(res, go.importObject);
            return result2.instance;
          }
          const bytes = yield res.arrayBuffer();
          const result = yield WebAssembly.instantiate(bytes, go.importObject);
          return result.instance;
        });
      }
      return (m) => onmessage(m);
    })(postMessage)`],{type:"text/javascript"});a=new Worker(URL.createObjectURL(C))}else{let C=(A=>{var M=(T,S,p)=>new Promise((u,s)=>{var o=_=>{try{v(p.next(_))}catch(c){s(c)}},d=_=>{try{v(p.throw(_))}catch(c){s(c)}},v=_=>_.done?u(_.value):Promise.resolve(_.value).then(o,d);v((p=p.apply(T,S)).next())});let F,$={};for(let T=self;T;T=Object.getPrototypeOf(T))for(let S of Object.getOwnPropertyNames(T))S in $||Object.defineProperty($,S,{get:()=>self[S]});(()=>{const T=()=>{const u=new Error("not implemented");return u.code="ENOSYS",u};if(!$.fs){let u="";$.fs={constants:{O_WRONLY:-1,O_RDWR:-1,O_CREAT:-1,O_TRUNC:-1,O_APPEND:-1,O_EXCL:-1,O_DIRECTORY:-1},writeSync(s,o){u+=p.decode(o);const d=u.lastIndexOf(`
`);return d!=-1&&(console.log(u.substring(0,d)),u=u.substring(d+1)),o.length},write(s,o,d,v,_,c){if(d!==0||v!==o.length||_!==null){c(T());return}const m=this.writeSync(s,o);c(null,m)},chmod(s,o,d){d(T())},chown(s,o,d,v){v(T())},close(s,o){o(T())},fchmod(s,o,d){d(T())},fchown(s,o,d,v){v(T())},fstat(s,o){o(T())},fsync(s,o){o(null)},ftruncate(s,o,d){d(T())},lchown(s,o,d,v){v(T())},link(s,o,d){d(T())},lstat(s,o){o(T())},mkdir(s,o,d){d(T())},open(s,o,d,v){v(T())},read(s,o,d,v,_,c){c(T())},readdir(s,o){o(T())},readlink(s,o){o(T())},rename(s,o,d){d(T())},rmdir(s,o){o(T())},stat(s,o){o(T())},symlink(s,o,d){d(T())},truncate(s,o,d){d(T())},unlink(s,o){o(T())},utimes(s,o,d,v){v(T())}}}if($.process||($.process={getuid(){return-1},getgid(){return-1},geteuid(){return-1},getegid(){return-1},getgroups(){throw T()},pid:-1,ppid:-1,umask(){throw T()},cwd(){throw T()},chdir(){throw T()}}),$.path||($.path={resolve(...u){return u.join("/")}}),!$.crypto)throw new Error("globalThis.crypto is not available, polyfill required (crypto.getRandomValues only)");if(!$.performance)throw new Error("globalThis.performance is not available, polyfill required (performance.now only)");if(!$.TextEncoder)throw new Error("globalThis.TextEncoder is not available, polyfill required");if(!$.TextDecoder)throw new Error("globalThis.TextDecoder is not available, polyfill required");const S=new TextEncoder("utf-8"),p=new TextDecoder("utf-8");$.Go=class{constructor(){this.argv=["js"],this.env={},this.exit=n=>{n!==0&&console.warn("exit code:",n)},this._exitPromise=new Promise(n=>{this._resolveExitPromise=n}),this._pendingEvent=null,this._scheduledTimeouts=new Map,this._nextCallbackTimeoutID=1;const u=(n,l)=>{this.mem.setUint32(n+0,l,!0),this.mem.setUint32(n+4,Math.floor(l/4294967296),!0)},s=n=>{const l=this.mem.getUint32(n+0,!0),b=this.mem.getInt32(n+4,!0);return l+b*4294967296},o=n=>{const l=this.mem.getFloat64(n,!0);if(l===0)return;if(!isNaN(l))return l;const b=this.mem.getUint32(n,!0);return this._values[b]},d=(n,l)=>{if(typeof l=="number"&&l!==0){if(isNaN(l)){this.mem.setUint32(n+4,2146959360,!0),this.mem.setUint32(n,0,!0);return}this.mem.setFloat64(n,l,!0);return}if(l===void 0){this.mem.setFloat64(n,0,!0);return}let w=this._ids.get(l);w===void 0&&(w=this._idPool.pop(),w===void 0&&(w=this._values.length),this._values[w]=l,this._goRefCounts[w]=0,this._ids.set(l,w)),this._goRefCounts[w]++;let O=0;switch(typeof l){case"object":l!==null&&(O=1);break;case"string":O=2;break;case"symbol":O=3;break;case"function":O=4;break}this.mem.setUint32(n+4,2146959360|O,!0),this.mem.setUint32(n,w,!0)},v=n=>{const l=s(n+0),b=s(n+8);return new Uint8Array(this._inst.exports.mem.buffer,l,b)},_=n=>{const l=s(n+0),b=s(n+8),w=new Array(b);for(let O=0;O<b;O++)w[O]=o(l+O*8);return w},c=n=>{const l=s(n+0),b=s(n+8);return p.decode(new DataView(this._inst.exports.mem.buffer,l,b))},m=(n,l)=>(this._inst.exports.testExport0(),this._inst.exports.testExport(n,l)),x=Date.now()-performance.now();this.importObject={_gotest:{add:(n,l)=>n+l,callExport:m},gojs:{"runtime.wasmExit":n=>{n>>>=0;const l=this.mem.getInt32(n+8,!0);this.exited=!0,delete this._inst,delete this._values,delete this._goRefCounts,delete this._ids,delete this._idPool,this.exit(l)},"runtime.wasmWrite":n=>{n>>>=0;const l=s(n+8),b=s(n+16),w=this.mem.getInt32(n+24,!0);$.fs.writeSync(l,new Uint8Array(this._inst.exports.mem.buffer,b,w))},"runtime.resetMemoryDataView":n=>{this.mem=new DataView(this._inst.exports.mem.buffer)},"runtime.nanotime1":n=>{n>>>=0,u(n+8,(x+performance.now())*1e6)},"runtime.walltime":n=>{n>>>=0;const l=new Date().getTime();u(n+8,l/1e3),this.mem.setInt32(n+16,l%1e3*1e6,!0)},"runtime.scheduleTimeoutEvent":n=>{n>>>=0;const l=this._nextCallbackTimeoutID;this._nextCallbackTimeoutID++,this._scheduledTimeouts.set(l,setTimeout(()=>{for(this._resume();this._scheduledTimeouts.has(l);)console.warn("scheduleTimeoutEvent: missed timeout event"),this._resume()},s(n+8))),this.mem.setInt32(n+16,l,!0)},"runtime.clearTimeoutEvent":n=>{n>>>=0;const l=this.mem.getInt32(n+8,!0);clearTimeout(this._scheduledTimeouts.get(l)),this._scheduledTimeouts.delete(l)},"runtime.getRandomData":n=>{n>>>=0,crypto.getRandomValues(v(n+8))},"syscall/js.finalizeRef":n=>{n>>>=0;const l=this.mem.getUint32(n+8,!0);if(this._goRefCounts[l]--,this._goRefCounts[l]===0){const b=this._values[l];this._values[l]=null,this._ids.delete(b),this._idPool.push(l)}},"syscall/js.stringVal":n=>{n>>>=0,d(n+24,c(n+8))},"syscall/js.valueGet":n=>{n>>>=0;const l=Reflect.get(o(n+8),c(n+16));n=this._inst.exports.getsp()>>>0,d(n+32,l)},"syscall/js.valueSet":n=>{n>>>=0,Reflect.set(o(n+8),c(n+16),o(n+32))},"syscall/js.valueDelete":n=>{n>>>=0,Reflect.deleteProperty(o(n+8),c(n+16))},"syscall/js.valueIndex":n=>{n>>>=0,d(n+24,Reflect.get(o(n+8),s(n+16)))},"syscall/js.valueSetIndex":n=>{n>>>=0,Reflect.set(o(n+8),s(n+16),o(n+24))},"syscall/js.valueCall":n=>{n>>>=0;try{const l=o(n+8),b=Reflect.get(l,c(n+16)),w=_(n+32),O=Reflect.apply(b,l,w);n=this._inst.exports.getsp()>>>0,d(n+56,O),this.mem.setUint8(n+64,1)}catch(l){n=this._inst.exports.getsp()>>>0,d(n+56,l),this.mem.setUint8(n+64,0)}},"syscall/js.valueInvoke":n=>{n>>>=0;try{const l=o(n+8),b=_(n+16),w=Reflect.apply(l,void 0,b);n=this._inst.exports.getsp()>>>0,d(n+40,w),this.mem.setUint8(n+48,1)}catch(l){n=this._inst.exports.getsp()>>>0,d(n+40,l),this.mem.setUint8(n+48,0)}},"syscall/js.valueNew":n=>{n>>>=0;try{const l=o(n+8),b=_(n+16),w=Reflect.construct(l,b);n=this._inst.exports.getsp()>>>0,d(n+40,w),this.mem.setUint8(n+48,1)}catch(l){n=this._inst.exports.getsp()>>>0,d(n+40,l),this.mem.setUint8(n+48,0)}},"syscall/js.valueLength":n=>{n>>>=0,u(n+16,parseInt(o(n+8).length))},"syscall/js.valuePrepareString":n=>{n>>>=0;const l=S.encode(String(o(n+8)));d(n+16,l),u(n+24,l.length)},"syscall/js.valueLoadString":n=>{n>>>=0;const l=o(n+8);v(n+16).set(l)},"syscall/js.valueInstanceOf":n=>{n>>>=0,this.mem.setUint8(n+24,o(n+8)instanceof o(n+16)?1:0)},"syscall/js.copyBytesToGo":n=>{n>>>=0;const l=v(n+8),b=o(n+32);if(!(b instanceof Uint8Array||b instanceof Uint8ClampedArray)){this.mem.setUint8(n+48,0);return}const w=b.subarray(0,l.length);l.set(w),u(n+40,w.length),this.mem.setUint8(n+48,1)},"syscall/js.copyBytesToJS":n=>{n>>>=0;const l=o(n+8),b=v(n+16);if(!(l instanceof Uint8Array||l instanceof Uint8ClampedArray)){this.mem.setUint8(n+48,0);return}const w=b.subarray(0,l.length);l.set(w),u(n+40,w.length),this.mem.setUint8(n+48,1)},debug:n=>{console.log(n)}}}}run(u){return M(this,null,function*(){if(!(u instanceof WebAssembly.Instance))throw new Error("Go.run: WebAssembly.Instance expected");this._inst=u,this.mem=new DataView(this._inst.exports.mem.buffer),this._values=[NaN,0,null,!0,!1,$,this],this._goRefCounts=new Array(this._values.length).fill(1/0),this._ids=new Map([[0,1],[null,2],[!0,3],[!1,4],[$,5],[this,6]]),this._idPool=[],this.exited=!1;let s=4096;const o=x=>{const n=s,l=S.encode(x+"\0");return new Uint8Array(this.mem.buffer,s,l.length).set(l),s+=l.length,s%8!==0&&(s+=8-s%8),n},d=this.argv.length,v=[];this.argv.forEach(x=>{v.push(o(x))}),v.push(0),Object.keys(this.env).sort().forEach(x=>{v.push(o(`${x}=${this.env[x]}`))}),v.push(0);const c=s;if(v.forEach(x=>{this.mem.setUint32(s,x,!0),this.mem.setUint32(s+4,0,!0),s+=8}),s>=12288)throw new Error("total length of command line and environment variables exceeds limit");this._inst.exports.run(d,c),this.exited&&this._resolveExitPromise(),yield this._exitPromise})}_resume(){if(this.exited)throw new Error("Go program has already exited");this._inst.exports.resume(),this.exited&&this._resolveExitPromise()}_makeFuncWrapper(u){const s=this;return function(){const o={id:u,this:this,args:arguments};return s._pendingEvent=o,s._resume(),o.result}}}})(),F=({data:T})=>{let S=new TextDecoder,p=$.fs,u="";p.writeSync=(_,c)=>{if(_===1)A(c);else if(_===2){u+=S.decode(c);let m=u.split(`
`);m.length>1&&console.log(m.slice(0,-1).join(`
`)),u=m[m.length-1]}else throw new Error("Bad write");return c.length};let s=[],o,d=0;F=({data:_})=>(_.length>0&&(s.push(_),o&&o()),v),p.read=(_,c,m,x,n,l)=>{if(_!==0||m!==0||x!==c.length||n!==null)throw new Error("Bad read");if(s.length===0){o=()=>p.read(_,c,m,x,n,l);return}let b=s[0],w=Math.max(0,Math.min(x,b.length-d));c.set(b.subarray(d,d+w),m),d+=w,d===b.length&&(s.shift(),d=0),l(null,w)};let v=new $.Go;return v.argv=["","--service=0.27.3"],W(T,v).then(_=>{A(null),v.run(_)},_=>{A(_)}),v};function W(T,S){return M(this,null,function*(){if(T instanceof WebAssembly.Module)return WebAssembly.instantiate(T,S.importObject);const p=yield fetch(T);if(!p.ok)throw new Error(`Failed to download ${JSON.stringify(T)}`);if("instantiateStreaming"in WebAssembly&&/^application\/wasm($|;)/i.test(p.headers.get("Content-Type")||""))return(yield WebAssembly.instantiateStreaming(p,S.importObject)).instance;const u=yield p.arrayBuffer();return(yield WebAssembly.instantiate(u,S.importObject)).instance})}return T=>F(T)})(A=>a.onmessage({data:A})),V;a={onmessage:null,postMessage:A=>setTimeout(()=>{try{V=C({data:A})}catch(M){g(M)}}),terminate(){if(V)for(let A of V._scheduledTimeouts.values())clearTimeout(A)}}}let h,k;const f=new Promise((C,V)=>{h=C,k=V});a.onmessage=({data:C})=>{a.onmessage=({data:V})=>D(V),C?k(C):h()},a.postMessage(t||new URL(e,location.href).toString());let{readFromStdout:D,service:R}=ct({writeToStdin(C){a.postMessage(C)},isSync:!1,hasFS:!1,esbuild:Ee});yield f,Oe=()=>{a.terminate(),de=void 0,Oe=void 0,Ce=void 0},Ce={build:C=>new Promise((V,A)=>{y.then(A),R.buildOrContext({callName:"build",refs:null,options:C,isTTY:!1,defaultWD:"/",callback:(M,F)=>M?A(M):V(F)})}),context:C=>new Promise((V,A)=>{y.then(A),R.buildOrContext({callName:"context",refs:null,options:C,isTTY:!1,defaultWD:"/",callback:(M,F)=>M?A(M):V(F)})}),transform:(C,V)=>new Promise((A,M)=>{y.then(M),R.transform({callName:"transform",refs:null,input:C,options:V||{},isTTY:!1,fs:{readFile(F,$){$(new Error("Internal error"),null)},writeFile(F,$){$(null)}},callback:(F,$)=>F?M(F):A($)})}),formatMessages:(C,V)=>new Promise((A,M)=>{y.then(M),R.formatMessages({callName:"formatMessages",refs:null,messages:C,options:V,callback:(F,$)=>F?M(F):A($)})}),analyzeMetafile:(C,V)=>new Promise((A,M)=>{y.then(M),R.analyzeMetafile({callName:"analyzeMetafile",refs:null,metafile:typeof C=="string"?C:JSON.stringify(C),options:V,callback:(F,$)=>F?M(F):A($)})})}}),$t=Ee})(ye)})(He);var Qe=He.exports;const At=Ot(Qe),Rt=Ct({__proto__:null,default:At},[Qe]);export{Rt as b};
