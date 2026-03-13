"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const PDFMarkupViewer = dynamic(
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

export function PDFMarkupViewerClient(props: React.ComponentProps<typeof PDFMarkupViewer>) {
    React.useEffect(() => {
        // Lock the global body scroll so that ONLY the PDF container scrolls
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [])

    return <PDFMarkupViewer {...props} />
}
