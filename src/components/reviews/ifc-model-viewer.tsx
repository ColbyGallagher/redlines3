"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import * as THREE from "three"
import * as OBC from "@thatopen/components"
import * as FRAGS from "@thatopen/fragments"


type IFCModelViewerProps = {
    document: {
        id: string
        name: string
        code: string
        pdfUrl: string
        projectId: string
    }
}

type TreeNode = {
    id: string
    localId: number | null
    category: string
    label: string
    children: TreeNode[]
}

type SelectedItem = {
    modelId: string
    localId: number
    itemId?: number
}

type PropertyEntry = {
    key: string
    value: string
}

const selectionColor = new THREE.Color("#2563eb")

function isItemAttribute(value: unknown): value is FRAGS.ItemAttribute {
    return !!value && typeof value === "object" && "value" in (value as Record<string, unknown>)
}

function normalizePropertyValue(value: unknown): string {
    if (value === null || value === undefined) return "-"
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value)
    }
    if (Array.isArray(value)) return `${value.length} item(s)`
    try {
        return JSON.stringify(value)
    } catch {
        return String(value)
    }
}

function extractName(item: FRAGS.ItemData | undefined): string | null {
    if (!item) return null
    const candidates = ["LongName", "Name", "ObjectType"] as const
    for (const key of candidates) {
        const raw = item[key]
        if (isItemAttribute(raw) && (typeof raw.value === "string" || typeof raw.value === "number")) {
            const value = String(raw.value).trim()
            if (value) return value
        }
    }
    return null
}

function collectPropertyRows(item: FRAGS.ItemData | null): PropertyEntry[] {
    if (!item) return []

    const rows: PropertyEntry[] = []
    for (const [key, raw] of Object.entries(item)) {
        if (Array.isArray(raw)) continue
        if (!isItemAttribute(raw)) continue
        rows.push({ key, value: normalizePropertyValue(raw.value) })
    }

    const definedBy = item["IsDefinedBy"]
    if (Array.isArray(definedBy)) {
        for (const definition of definedBy) {
            if (!definition || typeof definition !== "object") continue

            const defData = definition as FRAGS.ItemData
            const setNameAttr = defData["Name"]
            const setName =
                isItemAttribute(setNameAttr) && setNameAttr.value
                    ? String(setNameAttr.value)
                    : "Unnamed Property Set"

            const props = Array.isArray(defData["HasProperties"])
                ? (defData["HasProperties"] as FRAGS.ItemData[])
                : []
            const quantities = Array.isArray(defData["Quantities"])
                ? (defData["Quantities"] as FRAGS.ItemData[])
                : []

            const allProps = [...props, ...quantities]
            for (const prop of allProps) {
                const propNameAttr = prop?.["Name"]
                const propName =
                    isItemAttribute(propNameAttr) && propNameAttr.value
                        ? String(propNameAttr.value)
                        : "Property"

                const valueEntry = Object.entries(prop ?? {}).find(([propKey, propValue]) => {
                    if (!isItemAttribute(propValue)) return false
                    return /Value|NominalValue|LengthValue|AreaValue|VolumeValue|CountValue|WeightValue/i.test(propKey)
                })

                if (!valueEntry) continue
                rows.push({
                    key: `${setName} / ${propName}`,
                    value: normalizePropertyValue((valueEntry[1] as FRAGS.ItemAttribute).value)
                })
            }
        }
    }

    return rows
}

function TreeNodeView({
    node,
    level,
    selectedLocalId,
    expandedNodeIds,
    onToggle,
    onSelect
}: {
    node: TreeNode
    level: number
    selectedLocalId: number | null
    expandedNodeIds: Set<string>
    onToggle: (nodeId: string) => void
    onSelect: (localId: number | null) => void
}) {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedNodeIds.has(node.id)
    const isSelected = node.localId !== null && node.localId === selectedLocalId

    return (
        <div>
            <div
                className={`flex items-center gap-1 rounded px-1 py-0.5 text-xs ${
                    isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                }`}
                style={{ paddingLeft: `${Math.max(level * 12, 4)}px` }}
            >
                <button
                    type="button"
                    onClick={() => hasChildren && onToggle(node.id)}
                    className="h-5 w-5 shrink-0 rounded text-muted-foreground hover:bg-muted disabled:opacity-30"
                    disabled={!hasChildren}
                    aria-label={hasChildren ? (isExpanded ? "Collapse node" : "Expand node") : "No children"}
                >
                    {hasChildren ? (isExpanded ? "v" : ">") : "*"}
                </button>
                <button
                    type="button"
                    onClick={() => onSelect(node.localId)}
                    className="min-w-0 flex-1 truncate text-left"
                    title={node.label}
                >
                    {node.label}
                </button>
            </div>
            {hasChildren && isExpanded && (
                <div>
                    {node.children.map((child) => (
                        <TreeNodeView
                            key={child.id}
                            node={child}
                            level={level + 1}
                            selectedLocalId={selectedLocalId}
                            expandedNodeIds={expandedNodeIds}
                            onToggle={onToggle}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function IFCModelViewer({ document }: IFCModelViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const componentsRef = useRef<OBC.Components | null>(null)
    const modelRef = useRef<FRAGS.FragmentsModel | null>(null)
    const worldRef = useRef<OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer> | null>(null)
    const fragmentsRef = useRef<OBC.FragmentsManager | null>(null)
    const selectionTokenRef = useRef(0)
    const selectedItemRef = useRef<SelectedItem | null>(null)
    const localIdPathMapRef = useRef<Map<number, string[]>>(new Map())
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState("Initializing engine...")
    const [error, setError] = useState<string | null>(null)
    const [treeRoot, setTreeRoot] = useState<TreeNode | null>(null)
    const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set())
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
    const [selectedProperties, setSelectedProperties] = useState<PropertyEntry[]>([])

    const selectIfcItem = useCallback(async (nextSelection: SelectedItem | null) => {
        const token = ++selectionTokenRef.current
        const fragments = fragmentsRef.current
        const renderer = worldRef.current?.renderer
        if (!fragments) return

        const previousSelection = selectedItemRef.current
        if (previousSelection) {
            const prevModel = fragments.list.get(previousSelection.modelId)
            if (prevModel) {
                const previousIds = new Set<number>([previousSelection.localId])
                if (typeof previousSelection.itemId === "number") {
                    previousIds.add(previousSelection.itemId)
                }
                await prevModel.resetColor([...previousIds])
                await fragments.core.update(true)
                if (renderer) {
                    renderer.needsUpdate = true
                    renderer.update()
                }
            }
        }

        if (!nextSelection) {
            if (token === selectionTokenRef.current) {
                selectedItemRef.current = null
                setSelectedItem(null)
                setSelectedProperties([])
            }
            return
        }

        const model = fragments.list.get(nextSelection.modelId)
        if (!model) return

        const targetIds = new Set<number>([nextSelection.localId])
        if (typeof nextSelection.itemId === "number") {
            targetIds.add(nextSelection.itemId)
        }
        await model.setColor([...targetIds], selectionColor)
        await fragments.core.update(true)
        if (renderer) {
            renderer.needsUpdate = true
            renderer.update()
        }

        const [itemData] = await model.getItemsData([nextSelection.localId], {
            attributesDefault: true,
            relationsDefault: { attributes: false, relations: false },
            relations: {
                IsDefinedBy: { attributes: true, relations: true },
                IsTypedBy: { attributes: true, relations: true },
                HasAssociations: { attributes: true, relations: false }
            }
        })

        if (token !== selectionTokenRef.current) return
        selectedItemRef.current = nextSelection
        setSelectedItem(nextSelection)
        setSelectedProperties(collectPropertyRows(itemData ?? null))
    }, [])

    useEffect(() => {
        if (!containerRef.current) return

        let mounted = true
        let components: OBC.Components | null = null
        let world: OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer> | null = null
        let canvasPointerHandler: ((event: PointerEvent) => void) | null = null
        let canvasElement: HTMLCanvasElement | null = null
        const abortController = new AbortController()
        let fragmentsUpdateInFlight = false
        let pendingFragmentsUpdate = false

        const collectSpatialIds = (node: FRAGS.SpatialTreeItem, collector: Set<number>) => {
            if (typeof node.localId === "number") {
                collector.add(node.localId)
            }
            for (const child of node.children ?? []) {
                collectSpatialIds(child, collector)
            }
        }

        const buildTree = (
            node: FRAGS.SpatialTreeItem,
            namesByLocalId: Map<number, string>,
            path: string
        ): TreeNode => {
            const localId = typeof node.localId === "number" ? node.localId : null
            const category = node.category ?? "Root"
            const name = localId !== null ? namesByLocalId.get(localId) : null
            const label = localId === null
                ? category
                : `${name ? `${name} ` : ""}(${category} #${localId})`

            return {
                id: path,
                localId,
                category,
                label,
                children: (node.children ?? []).map((child, index) => buildTree(child, namesByLocalId, `${path}.${index}`))
            }
        }

        const handleResize = () => {
            if (world && world.renderer) {
                world.renderer.resize()
            }
        }

        const timeoutId = setTimeout(() => {
            if (!mounted) return

            components = new OBC.Components()
            componentsRef.current = components

            const worlds = components.get(OBC.Worlds)
            world = worlds.create<
                OBC.SimpleScene,
                OBC.OrthoPerspectiveCamera,
                OBC.SimpleRenderer
            >()

            world.scene = new OBC.SimpleScene(components)
            world.renderer = new OBC.SimpleRenderer(components, containerRef.current as HTMLDivElement)
            world.camera = new OBC.OrthoPerspectiveCamera(components)
            worldRef.current = world

            components.init()

            world.scene.setup()
            world.scene.three.background = new THREE.Color(0xf8fafd)

            // Add some basic lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
            world.scene.three.add(ambientLight)

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
            directionalLight.position.set(10, 10, 10)
            world.scene.three.add(directionalLight)

            const grids = components.get(OBC.Grids)
            grids.create(world)

            const wasmPath = `${window.location.origin}/wasm/`
            
            const fragments = components.get(OBC.FragmentsManager)
            fragmentsRef.current = fragments
            if (!fragments.initialized) {
                fragments.init(`${wasmPath}worker.mjs`)
            }
            const updateFragments = async (reason: string, force = false, shouldLog = false) => {
                if (!fragments.initialized) return
                if (fragmentsUpdateInFlight) {
                    pendingFragmentsUpdate = true
                    return
                }

                fragmentsUpdateInFlight = true
                try {
                    await fragments.core.update(force)
                    if (shouldLog) {
                        console.log("[IFCModelViewer] Fragments updated", {
                            reason,
                            force,
                            fragmentsLoaded: fragments.list.size
                        })
                    }
                    if (world?.renderer) {
                        world.renderer.needsUpdate = true
                    }
                } catch (err) {
                    console.error("[IFCModelViewer] Error updating fragments:", reason, err)
                } finally {
                    fragmentsUpdateInFlight = false
                    if (pendingFragmentsUpdate) {
                        pendingFragmentsUpdate = false
                        void updateFragments("queued-camera-controls")
                    }
                }
            }
            const fragmentIfcLoader = components.get(OBC.IfcLoader)

            async function initLoader() {
                try {
                    if (!mounted) return
                    const wasmPath = `${window.location.origin}/wasm/`
                    await fragmentIfcLoader.setup({
                        autoSetWasm: false,
                        wasm: {
                            path: wasmPath,
                            absolute: true
                        }
                    })
                    if (mounted) setProgress("Loading IFC file...")
                } catch (err) {
                    console.error("[IFCModelViewer] Error setting up IfcLoader:", err)
                }
            }

            async function loadModel() {
                if (!document.pdfUrl) return
                if (!world?.camera || !world?.scene || !world?.renderer) {
                    return
                }
                 
                try {
                    if (mounted) setLoading(true)
                    if (mounted) setProgress("Downloading 3D model...")
                    console.log("[IFCModelViewer] Starting IFC load", {
                        name: document.name,
                        url: document.pdfUrl
                    })
                    
                    const response = await fetch(document.pdfUrl, {
                        signal: abortController.signal
                    })
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
                    
                    const buffer = await response.arrayBuffer()
                    const data = new Uint8Array(buffer)
                    console.log("[IFCModelViewer] IFC downloaded", {
                        bytes: data.byteLength,
                        contentType: response.headers.get("content-type")
                    })
                    
                    if (!mounted) return
                    setProgress("Processing geometry...")
                    
                    const model = await fragmentIfcLoader.load(data, true, document.name)
                    modelRef.current = model
                    console.log("[IFCModelViewer] IFC processed", {
                        modelId: model.modelId,
                        boxMin: model.box?.min,
                        boxMax: model.box?.max,
                        objectType: model.object?.type,
                        childCount: model.object?.children?.length
                    })
                    
                    if (!mounted) {
                        model.dispose()
                        return
                    }

                    if (typeof model.useCamera === "function") {
                        model.useCamera(world.camera.three)
                        console.log("[IFCModelViewer] Model camera connected", {
                            cameraType: world.camera.three?.type,
                            cameraPosition: world.camera.three?.position
                        })
                    }

                    if (model.onViewUpdated?.add && world.renderer) {
                        const renderer = world.renderer
                        model.onViewUpdated.add(() => {
                            console.log("[IFCModelViewer] Model view updated", {
                                rendererSize: renderer.getSize?.(),
                                fragmentsLoaded: fragments.list.size
                            })
                            renderer.needsUpdate = true
                        })
                    }

                    model.object.visible = true
                    model.object.updateMatrixWorld(true)
                    world.scene.three.add(model.object)
                    console.log("[IFCModelViewer] Model added to scene", {
                        sceneChildren: world.scene.three.children.length,
                        fragmentsLoaded: fragments.list.size,
                        objectVisible: model.object.visible,
                        matrixWorldAutoUpdate: model.object.matrixWorldAutoUpdate
                    })

                    if (world.camera?.fitToItems) {
                        await world.camera.fitToItems()
                        console.log("[IFCModelViewer] Camera fitToItems complete", {
                            cameraPosition: world.camera.three?.position
                        })
                    }

                    if (world.renderer) {
                        world.renderer.needsUpdate = true
                        console.log("[IFCModelViewer] Renderer invalidated", {
                            rendererSize: world.renderer.getSize?.(),
                            needsUpdate: world.renderer.needsUpdate
                        })
                    }

                    await updateFragments("initial-load", true, true)
                    console.log("[IFCModelViewer] Post-update model state", {
                        childCount: model.object?.children?.length,
                        sceneChildren: world.scene.three.children.length
                    })

                    const spatialRoot = await model.getSpatialStructure()
                    const spatialIds = new Set<number>()
                    collectSpatialIds(spatialRoot, spatialIds)

                    const nameByLocalId = new Map<number, string>()
                    const allIds = [...spatialIds]
                    const chunkSize = 300
                    for (let i = 0; i < allIds.length; i += chunkSize) {
                        const chunk = allIds.slice(i, i + chunkSize)
                        const chunkData = await model.getItemsData(chunk, {
                            attributes: ["Name", "LongName", "ObjectType"],
                            attributesDefault: false,
                            relationsDefault: { attributes: false, relations: false }
                        })
                        for (const entry of chunkData) {
                            const localIdRaw = entry?._localId
                            if (!isItemAttribute(localIdRaw) || typeof localIdRaw.value !== "number") continue
                            const localId = localIdRaw.value
                            const name = extractName(entry)
                            if (name) nameByLocalId.set(localId, name)
                        }
                    }

                    const builtTree = buildTree(spatialRoot, nameByLocalId, "root")
                    const pathMap = new Map<number, string[]>()
                    const findAndStorePaths = (node: TreeNode, path: string[] = []) => {
                        const nextPath = [...path, node.id]
                        if (node.localId !== null && !pathMap.has(node.localId)) {
                            pathMap.set(node.localId, nextPath)
                        }
                        for (const child of node.children) findAndStorePaths(child, nextPath)
                    }
                    findAndStorePaths(builtTree)
                    localIdPathMapRef.current = pathMap
                    setTreeRoot(builtTree)
                    setExpandedNodeIds(new Set(["root"]))

                    const canvas = world.renderer.three.domElement
                    canvasElement = canvas
                    canvasPointerHandler = async (event: PointerEvent) => {
                        if (!fragmentsRef.current || !worldRef.current?.camera || !worldRef.current?.renderer) return

                        const mouse = new THREE.Vector2(event.clientX, event.clientY)

                        const hit = await fragmentsRef.current.raycast({
                            camera: worldRef.current.camera.three,
                            mouse,
                            dom: canvas
                        })

                        if (!hit) {
                            await selectIfcItem(null)
                            return
                        }

                        const nextSelection: SelectedItem = {
                            modelId: hit.fragments.modelId,
                            localId: hit.localId,
                            itemId: hit.itemId
                        }
                        await selectIfcItem(nextSelection)

                        setExpandedNodeIds((prev) => {
                            const path = localIdPathMapRef.current.get(nextSelection.localId)
                            if (!path) return prev
                            const next = new Set(prev)
                            for (const nodeId of path) next.add(nodeId)
                            return next
                        })
                    }

                    canvas.addEventListener("pointerdown", canvasPointerHandler)
                     
                    if (mounted) {
                        setLoading(false)
                        setError(null)
                    }
                } catch (err: any) {
                    if (err.name === 'AbortError') {
                        console.log('Fetch aborted')
                        return
                    }
                    console.error("[IFCModelViewer] Error loading IFC model:", err)
                    if (mounted) {
                        setError(err instanceof Error ? err.message : "Failed to load model")
                        setLoading(false)
                    }
                }
            }

            initLoader().then(() => {
                if (mounted) loadModel()
            })

            if (world.camera?.controls) {
                world.camera.controls.addEventListener("update", () => {
                    void updateFragments("camera-controls")
                })
            }

            window.addEventListener("resize", handleResize)
        }, 50)

        return () => {
            mounted = false
            abortController.abort()
            clearTimeout(timeoutId)
            window.removeEventListener("resize", handleResize)
            if (canvasElement && canvasPointerHandler) {
                canvasElement.removeEventListener("pointerdown", canvasPointerHandler)
            }
            modelRef.current = null
            worldRef.current = null
            fragmentsRef.current = null
            selectedItemRef.current = null
            localIdPathMapRef.current = new Map()
            if (components) {
                components.dispose()
            }
        }
    }, [document.pdfUrl, document.name, selectIfcItem])

    const selectedLocalId = selectedItem?.localId ?? null
    const treeNodeCount = useMemo(() => {
        if (!treeRoot) return 0
        let count = 0
        const walk = (node: TreeNode) => {
            count += 1
            for (const child of node.children) walk(child)
        }
        walk(treeRoot)
        return count
    }, [treeRoot])

    const onSelectFromTree = async (localId: number | null) => {
        const model = modelRef.current
        if (!model || localId === null) {
            await selectIfcItem(null)
            return
        }

        await selectIfcItem({
            modelId: model.modelId,
            localId
        })

        setExpandedNodeIds((prev) => {
            const path = localIdPathMapRef.current.get(localId)
            if (!path) return prev
            const next = new Set(prev)
            for (const nodeId of path) next.add(nodeId)
            return next
        })
    }

    return (
        <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col bg-[#f8fafd]">
            <div ref={containerRef} className="absolute inset-0 w-full h-full" />
            
            {loading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
                    <Loader2 className="size-10 animate-spin text-primary mb-4" />
                    <h3 className="text-lg font-medium">{progress}</h3>
                    <p className="text-sm text-muted-foreground mt-2">This may take a moment for large IFC files.</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background border-2 border-dashed border-destructive/50 p-6 rounded-lg m-4">
                    <AlertCircle className="size-10 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Error Loading 3D Model</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Viewer Overlay / HUD could go here */}
            {!loading && !error && (
                <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-sm p-2 rounded-md shadow-sm border text-xs text-muted-foreground">
                    <p>{document.name}</p>
                </div>
            )}

            {!loading && !error && (
                <aside className="absolute right-0 top-0 z-20 flex h-full w-[380px] flex-col border-l bg-background/95 backdrop-blur">
                    <div className="border-b px-3 py-2">
                        <p className="text-sm font-semibold">Model Hierarchy</p>
                        <p className="text-xs text-muted-foreground">{treeNodeCount} nodes</p>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto p-2">
                        {treeRoot ? (
                            <TreeNodeView
                                node={treeRoot}
                                level={0}
                                selectedLocalId={selectedLocalId}
                                expandedNodeIds={expandedNodeIds}
                                onToggle={(nodeId) =>
                                    setExpandedNodeIds((prev) => {
                                        const next = new Set(prev)
                                        if (next.has(nodeId)) next.delete(nodeId)
                                        else next.add(nodeId)
                                        return next
                                    })
                                }
                                onSelect={onSelectFromTree}
                            />
                        ) : (
                            <p className="px-1 py-2 text-xs text-muted-foreground">Hierarchy unavailable for this model.</p>
                        )}
                    </div>

                    <div className="border-t px-3 py-2">
                        <p className="text-sm font-semibold">Selected Object</p>
                        <p className="text-xs text-muted-foreground">
                            {selectedItem ? `#${selectedItem.localId}` : "No object selected"}
                        </p>
                    </div>
                    <div className="max-h-[42%] overflow-auto p-2">
                        {selectedProperties.length > 0 ? (
                            <div className="space-y-1">
                                {selectedProperties.map((entry, index) => (
                                    <div key={`${entry.key}-${index}`} className="rounded border bg-muted/20 p-2">
                                        <p className="truncate text-[11px] font-medium">{entry.key}</p>
                                        <p className="mt-1 break-words text-[11px] text-muted-foreground">{entry.value}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="px-1 py-2 text-xs text-muted-foreground">Click an IFC object or choose one from the tree.</p>
                        )}
                    </div>
                </aside>
            )}
        </div>
    )
}
