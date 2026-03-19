"use client"

import { useEffect, useState, useRef } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { BimProvider } from "@ifc-lite/viewer/src/sdk/BimProvider"
import { ViewerLayout } from "@ifc-lite/viewer/src/components/viewer/ViewerLayout"
import { useIfc } from "@ifc-lite/viewer/src/hooks/useIfc"
import { useViewerStore } from "@ifc-lite/viewer/src/store/index"
// Import styles from viewer
import "@ifc-lite/viewer/src/index.css"

type IFCModelViewerProps = {
    document: {
        id: string
        name: string
        code: string
        pdfUrl: string
        projectId: string
    }
}

function IFCModelLoader({ documentUrl, documentName }: { documentUrl: string, documentName: string }) {
    const { loadFile, loading } = useIfc()
    const clearAllModels = useViewerStore(s => s.clearAllModels)
    const resetViewerState = useViewerStore(s => s.resetViewerState)
    const [downloading, setDownloading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const loadedUrlRef = useRef<string | null>(null)

    useEffect(() => {
        let mounted = true

        async function fetchAndLoadFile() {
            if (!documentUrl) return
            if (loadedUrlRef.current === documentUrl) return // Already loaded

            try {
                setDownloading(true)
                setError(null)
                
                // Reset existing viewer state before loading new file
                resetViewerState()
                clearAllModels()

                const response = await fetch(documentUrl)
                if (!response.ok) {
                    throw new Error(`Failed to download IFC file: ${response.status} ${response.statusText}`)
                }
                
                const blob = await response.blob()
                if (!mounted) return

                const filename = documentName.toLowerCase().endsWith('.ifc') ? documentName : `${documentName}.ifc`
                const file = new File([blob], filename, { type: blob.type || 'application/x-step' })
                
                loadedUrlRef.current = documentUrl
                
                // loadFile sets its own loading state in the viewer store
                await loadFile(file)
            } catch (err) {
                console.error("[IFCModelViewer] Error fetching IFC file:", err)
                if (mounted) setError(err instanceof Error ? err.message : "Failed to load model")
            } finally {
                if (mounted) setDownloading(false)
            }
        }

        fetchAndLoadFile()

        return () => {
            mounted = false
        }
    }, [documentUrl, documentName, loadFile, clearAllModels, resetViewerState])

    if (error) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background border-2 border-dashed border-destructive/50 p-6 rounded-lg m-4">
                <AlertCircle className="size-10 text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading 3D Model</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
            </div>
        )
    }

    if (downloading) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                <Loader2 className="size-10 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-medium">Downloading 3D Model...</h3>
                <p className="text-sm text-muted-foreground mt-2">This may take a moment for large IFC files.</p>
            </div>
        )
    }

    // Explicitly show loading state when ifc-lite's internal loader is running but downloading finished
    if (loading) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
                <Loader2 className="size-10 flex-shrink-0 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-medium">Processing Geometry...</h3>
                <p className="text-sm text-muted-foreground mt-2">Parsing IFC data and building 3D meshes.</p>
            </div>
        )
    }

    return null
}

export function IFCModelViewer({ document }: IFCModelViewerProps) {
    return (
        <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
            <BimProvider>
                <IFCModelLoader documentUrl={document.pdfUrl} documentName={document.name} />
                <ViewerLayout />
            </BimProvider>
        </div>
    )
}
