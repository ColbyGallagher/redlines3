"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import * as pdfjs from "pdfjs-dist"
import { Loader2, Crosshair, Save, X, ZoomIn, ZoomOut, Maximize, Hand } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ExtractionSettings, ExtractionArea } from "@/lib/db/types"

if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
    ).toString()
}

type CalibrationType = "documentCode" | "documentName" | "revision"
type ToolType = "draw" | "pan"

type ExtractionCalibrationDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    pdfUrl: string
    projectId: string
    onSave: (setup: { name: string; settings: ExtractionSettings }) => void
    initialSettings?: ExtractionSettings
    initialName?: string
}

export function ExtractionCalibrationDialog({
    open,
    onOpenChange,
    pdfUrl,
    projectId,
    onSave,
    initialSettings,
    initialName = "New Setup",
}: ExtractionCalibrationDialogProps) {
    const [name, setName] = useState(initialName)
    const [activeType, setActiveType] = useState<CalibrationType>("documentCode")
    const [settings, setSettings] = useState<ExtractionSettings>(initialSettings || {})
    const [previews, setPreviews] = useState<Record<string, string>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [numPages, setNumPages] = useState<number | null>(null)
    const [pdfDoc, setPdfDoc] = useState<any>(null)
    const [scale, setScale] = useState(1.0)
    const [tool, setTool] = useState<ToolType>("draw")
    const containerRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const [drawingBox, setDrawingBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null)
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })

    // Sync initial values when opening
    useEffect(() => {
        if (open) {
            setSettings(initialSettings || {})
            setName(initialName || "New Setup")
        }
    }, [open, initialSettings, initialName])

    // Load PDF using pdfjs-dist directly
    useEffect(() => {
        if (!open || !pdfUrl) return

        const loadPdf = async () => {
            try {
                // Set worker path (it's in node_modules/pdfjs-dist/build/pdf.worker.mjs)
                // In Phase 1 we didn't copy this specific worker, but pdfjs-dist typically handles it
                // Or we can use the CDN worker for now if local fails
                pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
                
                const loadingTask = pdfjs.getDocument(pdfUrl)
                const pdf = await loadingTask.promise
                setPdfDoc(pdf)
                setNumPages(pdf.numPages)
            } catch (err) {
                console.error("Error loading PDF in calibration:", err)
                toast.error("Failed to load PDF for calibration")
            }
        }
        loadPdf()
    }, [open, pdfUrl])

    // Render Page 1 to Canvas
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return

        const renderPage = async () => {
            try {
                const page = await pdfDoc.getPage(1)
                const canvas = canvasRef.current!
                const context = canvas.getContext("2d")
                if (!context) return

                const viewport = page.getViewport({ scale: (600 * scale) / page.getViewport({ scale: 1 }).width })
                canvas.height = viewport.height
                canvas.width = viewport.width

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                }
                await page.render(renderContext).promise
            } catch (err) {
                console.error("Error rendering page in calibration:", err)
            }
        }
        renderPage()
    }, [pdfDoc, scale])

    const extractText = useCallback(async (area: ExtractionArea, type: CalibrationType) => {
        if (!pdfDoc) return
        try {
            const page = await pdfDoc.getPage(1)
            const textContent = await page.getTextContent()
            const viewport = page.getViewport({ scale: 1.0 })
            const { width, height } = viewport

            // Convert percentage coordinates to PDF points
            const xMin = (area.x / 100) * width
            const xMax = ((area.x + area.width) / 100) * width
            const yMin = (1 - (area.y + area.height) / 100) * height // PDF coordinates start from bottom
            const yMax = (1 - (area.y) / 100) * height

            const items = textContent.items
                .filter((item: any) => {
                    const [x, y] = [item.transform[4], item.transform[5]]
                    return x >= xMin && x <= xMax && y >= yMin && y <= yMax
                })
                .map((item: any) => item.str)

            const text = items.join(" ").trim()
            setPreviews(prev => ({ ...prev, [type]: text }))
        } catch (err) {
            console.error("Local extraction error:", err)
        }
    }, [pdfDoc])

    // Update previews when settings change
    useEffect(() => {
        if (!pdfDoc) return
        Object.entries(settings).forEach(([type, area]) => {
            if (area) extractText(area as ExtractionArea, type as CalibrationType)
        })
    }, [settings, pdfDoc, extractText])

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (tool === "pan") {
            setIsPanning(true)
            setPanStart({
                x: e.clientX,
                y: e.clientY,
                scrollLeft: scrollRef.current?.scrollLeft || 0,
                scrollTop: scrollRef.current?.scrollTop || 0
            })
            return
        }

        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        setDrawingBox({ startX: x, startY: y, currentX: x, currentY: y })
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning && scrollRef.current) {
            const dx = e.clientX - panStart.x
            const dy = e.clientY - panStart.y
            scrollRef.current.scrollLeft = panStart.scrollLeft - dx
            scrollRef.current.scrollTop = panStart.scrollTop - dy
            return
        }

        if (!drawingBox) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        setDrawingBox(prev => prev ? { ...prev, currentX: x, currentY: y } : null)
    }

    const handleMouseUp = () => {
        setIsPanning(false)
        if (!drawingBox) return

        const x = Math.min(drawingBox.startX, drawingBox.currentX)
        const y = Math.min(drawingBox.startY, drawingBox.currentY)
        const width = Math.abs(drawingBox.currentX - drawingBox.startX)
        const height = Math.abs(drawingBox.currentY - drawingBox.startY)

        if (width > 0.1 && height > 0.1) {
            setSettings(prev => ({
                ...prev,
                [activeType]: { x, y, width, height }
            }))
        }

        setDrawingBox(null)
    }

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Please provide a name for this setup.")
            return
        }
        if (!settings.documentCode && !settings.documentName && !settings.revision) {
            toast.error("Please select at least one area.")
            return
        }

        setIsSaving(true)
        try {
            onSave({ name, settings })
            onOpenChange(false)
        } catch (error) {
            console.error("Save error:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const renderBox = (area: ExtractionArea, type: CalibrationType) => {
        const isActive = activeType === type
        return (
            <div
                key={type}
                className={cn(
                    "absolute border-2 pointer-events-none transition-colors",
                    isActive ? "border-primary bg-primary/20 z-20" : "border-muted-foreground/50 bg-muted/10 z-10"
                )}
                style={{
                    left: `${area.x}%`,
                    top: `${area.y}%`,
                    width: `${area.width}%`,
                    height: `${area.height}%`,
                }}
            >
                <div className="absolute -top-6 left-0 bg-background border px-1 rounded text-[10px] font-medium whitespace-nowrap capitalize shadow-sm">
                    {type.replace(/([A-Z])/g, ' $1')}
                </div>
            </div>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1100px] max-h-[95vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <DialogTitle>Extraction Calibration</DialogTitle>
                            <DialogDescription>
                                Select areas on the first page to extract metadata.
                            </DialogDescription>
                        </div>
                        <div className="flex-1 max-w-sm">
                            <Label className="sr-only">Setup Name</Label>
                            <Input
                                placeholder="Setup Name (e.g. Arup Template)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-9"
                            />
                        </div>
                    </div>
                </DialogHeader>

                {/* Toolbar */}
                <div className="px-6 py-2 border-b bg-muted/20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 p-1 bg-background border rounded-lg">
                        <Button 
                            variant={tool === "draw" ? "secondary" : "ghost"} 
                            size="sm" 
                            className="h-8 px-3"
                            onClick={() => setTool("draw")}
                        >
                            <Crosshair className="size-4 mr-2" />
                            Draw
                        </Button>
                        <Button 
                            variant={tool === "pan" ? "secondary" : "ghost"} 
                            size="sm" 
                            className="h-8 px-3"
                            onClick={() => setTool("pan")}
                        >
                            <Hand className="size-4 mr-2" />
                            Pan
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
                            <ZoomOut className="size-4" />
                        </Button>
                        <span className="text-xs font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.min(3, s + 0.1))}>
                            <ZoomIn className="size-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setScale(1.0)}>
                            <Maximize className="size-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <aside className="w-80 border-r bg-muted/30 p-4 space-y-6 overflow-y-auto">
                        <div className="space-y-4">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Calibration Fields</Label>
                            <div className="grid gap-4">
                                {(["documentCode", "documentName", "revision"] as CalibrationType[]).map((type) => (
                                    <div key={type} className="space-y-2">
                                        <Button
                                            key={type}
                                            variant={activeType === type ? "secondary" : "ghost"}
                                            size="sm"
                                            className={cn(
                                                "w-full justify-start gap-2 h-10 transition-all",
                                                activeType === type && "ring-1 ring-primary"
                                            )}
                                            onClick={() => setActiveType(type)}
                                        >
                                            <div className={cn(
                                                "size-3 rounded-full border",
                                                settings[type] ? "bg-primary border-primary" : "border-muted-foreground"
                                            )} />
                                            <span className="capitalize font-medium">{type.replace(/([A-Z])/g, ' $1')}</span>
                                            {settings[type] && <X className="size-3 ml-auto hover:text-destructive opacity-50 hover:opacity-100" onClick={(e) => {
                                                e.stopPropagation()
                                                setSettings(prev => ({ ...prev, [type]: undefined }))
                                                setPreviews(prev => ({ ...prev, [type]: "" }))
                                            }} />}
                                        </Button>
                                        
                                        {/* Preview Content */}
                                        <div className="ml-5 p-3 rounded-md bg-background border border-muted min-h-[40px] flex items-center">
                                            {previews[type] ? (
                                                <span className="text-sm font-mono break-all text-primary">{previews[type]}</span>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground italic">
                                                    {settings[type] ? "Extracting..." : "No area selected"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground p-3 border rounded-lg bg-background/50 space-y-2 shadow-inner">
                            <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5 text-xs">
                                <Maximize className="size-3" />
                                Pro Tips:
                            </p>
                            <ul className="list-disc ml-4 space-y-1.5">
                                <li>Use <span className="font-bold">Pan</span> tool to move around while zoomed in.</li>
                                <li>The preview updates instantly as you draw.</li>
                                <li>Ensure the box tightly fits the text for better accuracy.</li>
                            </ul>
                        </div>
                    </aside>

                    {/* PDF Viewer */}
                    <div 
                        ref={scrollRef}
                        className={cn(
                            "relative flex-1 bg-[#525659] overflow-auto p-8",
                            tool === "pan" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"
                        )}
                    >
                        <div
                            className="relative mx-auto bg-white shadow-2xl h-fit border border-black/10 origin-top"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            ref={containerRef}
                            style={{ 
                                width: `${600 * scale}px`,
                            }}
                        >
                            <canvas ref={canvasRef} className="block" />

                            {/* Existing Boxes */}
                            <div className="absolute inset-0 pointer-events-none">
                                {settings.documentCode && renderBox(settings.documentCode, "documentCode")}
                                {settings.documentName && renderBox(settings.documentName, "documentName")}
                                {settings.revision && renderBox(settings.revision, "revision")}

                                {/* Drawing Box */}
                                {drawingBox && (
                                    <div
                                        className="absolute border-2 border-primary border-dashed bg-primary/10 pointer-events-none z-30"
                                        style={{
                                            left: `${Math.min(drawingBox.startX, drawingBox.currentX)}%`,
                                            top: `${Math.min(drawingBox.startY, drawingBox.currentY)}%`,
                                            width: `${Math.abs(drawingBox.currentX - drawingBox.startX)}%`,
                                            height: `${Math.abs(drawingBox.currentY - drawingBox.startY)}%`,
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-0 mt-4 border-t bg-muted/10">
                    <div className="flex-1" />
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[140px]">
                        {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                        Save Calibration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

