const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/browser-vWDubxDI.js","assets/index-BImINgzG.js","assets/index-ax1X2WPd.css"])))=>i.map(i=>d[i]);
import { _ as u, b as _, d as M, __tla as __tla_0 } from "./index-BImINgzG.js";
import { N as Z, m as $, __tla as __tla_1 } from "./index-BImINgzG.js";
let c, y, O, V, I, C, L;
let __tla = Promise.all([
    (()=>{
        try {
            return __tla_0;
        } catch  {}
    })(),
    (()=>{
        try {
            return __tla_1;
        } catch  {}
    })()
]).then(async ()=>{
    async function k(s) {
        let t = f(await s), [e, i, { QuickJSWASMModule: n }] = await Promise.all([
            t.importModuleLoader().then(f),
            t.importFFI(),
            u(()=>import("./module-6F3E5H7Y-tx0BadV3.js"), []).then(f)
        ]), r = await e();
        r.type = "sync";
        let a = new i(r);
        return new n(r, a);
    }
    function f(s) {
        return s && "default" in s && s.default ? s.default && "default" in s.default && s.default.default ? s.default.default : s.default : s;
    }
    var x = {
        type: "sync",
        importFFI: ()=>u(()=>import("./ffi-DlhRHxHv.js"), []).then((s)=>s.QuickJSFFI),
        importModuleLoader: ()=>u(()=>import("./emscripten-module.browser-CY5t0Vfq.js"), []).then((s)=>s.default)
    }, v = x;
    async function A(s = v) {
        return k(s);
    }
    var p;
    async function E() {
        return p ?? (p = A().then((s)=>s)), await p;
    }
    y = {
        model: !0,
        query: !0,
        viewer: !0,
        mutate: !1,
        lens: !0,
        export: !0,
        files: !0
    };
    c = {
        memoryBytes: 64 * 1024 * 1024,
        timeoutMs: 3e4,
        maxStackBytes: 512 * 1024
    };
    I = function(s, t, e = {}, i) {
        const n = {
            ...y,
            ...e
        }, r = [];
        T(s, r);
        const a = s.newObject();
        return _(s, a, t, n, i), s.setProp(s.global, "bim", a), a.dispose(), {
            logs: r,
            dispose: ()=>{
                M(i);
            }
        };
    };
    function T(s, t) {
        const e = s.newObject();
        for (const i of [
            "log",
            "warn",
            "error",
            "info"
        ]){
            const n = s.newFunction(i, (...r)=>{
                const a = r.map((o)=>s.dump(o));
                t.push({
                    level: i,
                    args: a,
                    timestamp: Date.now()
                });
            });
            s.setProp(e, i, n), n.dispose();
        }
        s.setProp(s.global, "console", e), e.dispose();
    }
    let w = "esbuild", d = !1, m = null;
    function D() {
        return m || (m = (async ()=>{
            try {
                const s = await u(()=>import("./browser-vWDubxDI.js").then((i)=>i.b), __vite__mapDeps([0,1,2])), t = s.default ?? s;
                let e;
                try {
                    e = (await u(()=>import("./esbuild-COv63sf-.js"), [])).default;
                } catch  {
                    e = "https://unpkg.com/esbuild-wasm@0.27.3/esbuild.wasm";
                }
                return await t.initialize({
                    wasmURL: e,
                    worker: !1
                }), t;
            } catch  {
                return null;
            }
        })(), m);
    }
    L = async function(s) {
        let t;
        const e = P(s);
        try {
            const i = await D();
            i ? (t = (await i.transform(s, {
                loader: "ts",
                target: "es2022"
            })).code, w = "esbuild") : (t = e ? g(s) : s, w = e ? "fallback-ts" : "fallback-js", d || (d = !0, console.warn("[ifc-lite/sandbox] esbuild unavailable, using fallback transpiler")));
        } catch  {
            t = e ? g(s) : s, w = e ? "fallback-ts" : "fallback-js", d || (d = !0, console.warn("[ifc-lite/sandbox] esbuild failed, using fallback transpiler"));
        }
        return F(t);
    };
    function P(s) {
        return /\binterface\s+\w+/.test(s) || /\btype\s+\w+\s*=/.test(s) || /\b(?:as)\s+[A-Za-z_]\w*(?:\[\])?/.test(s) || /\b(?:const|let|var)\s+\w+\s*:\s*[A-Za-z_]/.test(s) || /\b(?:async\s+)?(?:function\s+\w+\s*)?\([^()]*\b\w+\s*:\s*[A-Za-z_][\w<>,\s[\]|]*\)\s*(?::\s*[A-Za-z_][\w<>,\s[\]|]*)?\s*(?:=>|\{)/.test(s) || /\([^)]*:\s*(?:string|number|boolean|void|any|unknown|never|Record<|Array<|Map<|Set<)/.test(s) || /\)\s*:\s*[A-Za-z_][\w<>,\s[\]|]*\s*\{/.test(s) || /\w<\w+(?:\s*,\s*\w+)*>\s*\(/.test(s);
    }
    function F(s) {
        let t = s;
        return t = t.replace(/^\s*import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"][^'"]*['"];?\s*$/gm, ""), t = t.replace(/^\s*export\s+(default\s+)?(const|let|var|function|class|async\s+function)\s/gm, "$2 "), t = t.replace(/^\s*export\s+default\s+/gm, ""), t = t.replace(/^\s*export\s+\{[^}]*\}(?:\s+from\s+['"][^'"]*['"])?\s*;?\s*$/gm, ""), t;
    }
    function g(s) {
        let t = s;
        return t = t.replace(/^\s*(?:export\s+)?interface\s+\w+[^{]*\{[^}]*\}/gm, ""), t = t.replace(/^\s*(?:export\s+)?type\s+\w+\s*=\s*[^;]+;/gm, ""), t = R(t), t = t.replace(/([,(]\s*)(\w+)\s*:\s*(?:string|number|boolean|void|any|unknown|never|null|undefined|Record<[^>]+>|Array<[^>]+>|Map<[^>]+>|Set<[^>]+>|\[[^\]]*\](?:\[\])?|[A-Za-z_]\w*(?:\[\])?(?:\s*\|\s*(?:string|number|boolean|null|undefined|[A-Za-z_]\w*))*)\s*(?=[,)])/g, "$1$2"), t = t.replace(/\):\s*[^{]+\{/g, ") {"), t = t.replace(/(?<![{,]\s*\w+\s)\s+as\s+\w+(?:\[\])?/g, ""), t = t.replace(/<\w+(?:\s+extends\s+\w+)?>/g, ""), t;
    }
    function R(s) {
        const t = s.split(`
`);
        for(let e = 0; e < t.length; e++){
            const i = t[e], n = i.match(/^(\s*(?:const|let|var)\s+\w+)\s*:\s*/);
            if (!n) continue;
            const r = n[1];
            let a = n[0].length, o = 0, b = !1;
            for(; a < i.length;){
                const l = i[a];
                if (l === "<" || l === "{" || l === "(" || l === "[") o++;
                else if (l === ">" || l === "}" || l === ")" || l === "]") o--;
                else if (l === "=" && o === 0) {
                    t[e] = r + " " + i.substring(a), b = !0;
                    break;
                }
                a++;
            }
            b || (t[e] = r);
        }
        return t.join(`
`);
    }
    let h = null, S = 1;
    function z() {
        return h || (h = E()), h;
    }
    function j() {
        const s = S;
        return S += 1, `sandbox-${s}`;
    }
    O = class {
        constructor(t, e = {}){
            this.sdk = t, this.config = {
                permissions: {
                    ...y,
                    ...e.permissions
                },
                limits: {
                    ...c,
                    ...e.limits
                }
            };
        }
        runtime = null;
        vm = null;
        logs = [];
        config;
        bridgeDispose = null;
        evalStartTime = 0;
        sessionId = j();
        async init() {
            const t = await z();
            this.runtime = t.newRuntime(), this.runtime.setMemoryLimit(this.config.limits.memoryBytes ?? c.memoryBytes), this.runtime.setMaxStackSize(this.config.limits.maxStackBytes ?? c.maxStackBytes);
            const e = this.config.limits.timeoutMs ?? c.timeoutMs;
            this.runtime.setInterruptHandler(()=>this.evalStartTime > 0 && Date.now() - this.evalStartTime > e), this.vm = this.runtime.newContext();
            const { logs: i, dispose: n } = I(this.vm, this.sdk, this.config.permissions, {
                sandboxSessionId: this.sessionId
            });
            this.logs = i, this.bridgeDispose = n;
        }
        async eval(t, e) {
            if (!this.vm) throw new Error("Sandbox not initialized. Call init() first.");
            this.logs.length = 0;
            let i = t;
            e?.typescript !== !1 && (i = await L(t)), this.evalStartTime = Date.now();
            const n = this.vm.evalCode(i, e?.filename ?? "script.js"), r = Date.now() - this.evalStartTime;
            if (this.evalStartTime = 0, n.error) {
                const o = this.vm.dump(n.error);
                throw n.error.dispose(), new V(typeof o == "object" && o !== null && "message" in o ? String(o.message) : String(o), this.logs, r);
            }
            const a = this.vm.dump(n.value);
            return n.value.dispose(), {
                value: a,
                logs: [
                    ...this.logs
                ],
                durationMs: r
            };
        }
        dispose() {
            this.bridgeDispose && (this.bridgeDispose(), this.bridgeDispose = null), this.vm && (this.vm.dispose(), this.vm = null), this.runtime && (this.runtime.dispose(), this.runtime = null);
        }
    };
    V = class extends Error {
        constructor(t, e, i){
            super(t), this.logs = e, this.durationMs = i, this.name = "ScriptError";
        }
    };
    C = async function(s, t) {
        const e = new O(s, t);
        return await e.init(), e;
    };
});
export { c as DEFAULT_LIMITS, y as DEFAULT_PERMISSIONS, Z as NAMESPACE_SCHEMAS, O as Sandbox, V as ScriptError, I as buildBridge, C as createSandbox, $ as marshalValue, L as transpileTypeScript, __tla };
