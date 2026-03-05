"use client"

import { useState, useTransition } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus, ZoomIn, ZoomOut } from "lucide-react"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import { Button } from "@/components/ui/button"
import "./pdf-viewer.css"

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
    url: string
}

export function PDFViewer({ url }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [scale, setScale] = useState<number>(1.0)
    const [isLoading, setIsLoading] = useState(true)

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages)
        setIsLoading(false)
    }

    const goToPrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1))
    const goToNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages))

    const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0))
    const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5))

    return (
        <div className="pdf-viewer-container rounded-lg border">
            <div className="pdf-toolbar">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        Page {pageNumber} of {numPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="h-4 w-[1px] bg-border mx-2" />

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-12 text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button variant="ghost" size="icon" onClick={zoomIn} disabled={scale >= 3.0}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="pdf-content">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
                <div className="pdf-page-wrapper">
                    <Document
                        file={url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={null}
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                        />
                        {/* Markup layer will go here */}
                    </Document>
                </div>
            </div>
        </div>
    )
}
