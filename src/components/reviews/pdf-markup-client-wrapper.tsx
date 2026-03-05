"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

export const PDFMarkupViewerClient = dynamic(
    () => import("./pdf-markup-viewer").then((mod) => mod.PDFMarkupViewer),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full w-full items-center justify-center bg-muted/20">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Loading PDF viewer...</span>
                </div>
            </div>
        )
    }
)
