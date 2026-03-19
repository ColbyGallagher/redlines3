import { _ as c, __tla as __tla_0 } from "./index-BImINgzG.js";
let m;
let __tla = Promise.all([
    (()=>{
        try {
            return __tla_0;
        } catch  {}
    })()
]).then(async ()=>{
    m = class {
        initialized = !1;
        invoke = null;
        listen = null;
        async init() {
            if (this.initialized) return;
            const i = globalThis;
            if (!i.__TAURI_INTERNALS__?.invoke) throw new Error("Tauri API not available - this bridge should only be used in Tauri apps");
            this.invoke = i.__TAURI_INTERNALS__.invoke;
            try {
                const s = await c(()=>import("./event-DIOks52T.js"), []);
                this.listen = s.listen;
            } catch  {
                console.warn("[NativeBridge] Event API not available, streaming will be limited");
            }
            this.initialized = !0;
        }
        isInitialized() {
            return this.initialized;
        }
        async processGeometry(i) {
            (!this.initialized || !this.invoke) && await this.init();
            const s = new TextEncoder, n = Array.from(s.encode(i)), o = await this.invoke("get_geometry", {
                buffer: n
            }), a = o.meshes.map(l), e = h(o.coordinateInfo);
            return {
                meshes: a,
                totalVertices: o.totalVertices,
                totalTriangles: o.totalTriangles,
                coordinateInfo: e
            };
        }
        async processGeometryStreaming(i, s) {
            if ((!this.initialized || !this.invoke) && await this.init(), !this.listen) {
                console.warn("[NativeBridge] Event API unavailable, falling back to non-streaming mode");
                const e = await this.processGeometry(i), r = {
                    totalMeshes: e.meshes.length,
                    totalVertices: e.totalVertices,
                    totalTriangles: e.totalTriangles,
                    parseTimeMs: 0,
                    geometryTimeMs: 0
                };
                return s.onBatch?.({
                    meshes: e.meshes,
                    progress: {
                        processed: e.meshes.length,
                        total: e.meshes.length,
                        currentType: "complete"
                    }
                }), s.onComplete?.(r), r;
            }
            const n = new TextEncoder, o = Array.from(n.encode(i)), a = await this.listen("geometry-batch", (e)=>{
                const r = {
                    meshes: e.payload.meshes.map(l),
                    progress: {
                        processed: e.payload.progress.processed,
                        total: e.payload.progress.total,
                        currentType: e.payload.progress.currentType
                    }
                };
                s.onBatch?.(r);
            });
            try {
                const e = await this.invoke("get_geometry_streaming", {
                    buffer: o
                }), r = {
                    totalMeshes: e.totalMeshes,
                    totalVertices: e.totalVertices,
                    totalTriangles: e.totalTriangles,
                    parseTimeMs: e.parseTimeMs,
                    geometryTimeMs: e.geometryTimeMs
                };
                return s.onComplete?.(r), r;
            } catch (e) {
                throw s.onError?.(e instanceof Error ? e : new Error(String(e))), e;
            } finally{
                a();
            }
        }
        getApi() {
            return null;
        }
    };
    function l(t) {
        return {
            expressId: t.expressId,
            positions: new Float32Array(t.positions),
            normals: new Float32Array(t.normals),
            indices: new Uint32Array(t.indices),
            color: t.color
        };
    }
    function h(t) {
        return {
            originShift: t.originShift,
            originalBounds: t.originalBounds,
            shiftedBounds: t.shiftedBounds,
            hasLargeCoordinates: t.hasLargeCoordinates
        };
    }
});
export { m as NativeBridge, __tla };
