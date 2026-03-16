"use client"

import { useRef, useEffect, forwardRef, useImperativeHandle, useState, useMemo } from "react"
import {
  PdfViewerComponent,
  Toolbar,
  Magnification,
  Navigation,
  LinkAnnotation,
  BookmarkView,
  ThumbnailView,
  Print,
  TextSelection,
  TextSearch,
  Annotation,
  FormFields,
  FormDesigner,
  Inject,
} from "@syncfusion/ej2-react-pdfviewer"
import "./syncfusion-pdf-viewer.css"

export type SyncfusionPdfViewerHandle = {
  goToPage: (page: number) => void
  getPageCount: () => number
}

type SyncfusionPdfViewerProps = {
  documentPath: string
  /** Called when the document is loaded. Receives the total page count. */
  onDocumentLoad?: (pageCount: number) => void
  /** Called when the user navigates to a different page. */
  onPageChange?: (currentPage: number) => void
  /** Height of the viewer. Defaults to 100%. */
  height?: string
  /** Whether to show the Syncfusion built-in toolbar. Defaults to false. */
  showToolbar?: boolean
  /** Called when the zoom level changes. Receives the zoom level as a factor (e.g., 1.5 for 150%). */
  onZoomChange?: (zoomLevel: number) => void
}

/**
 * Standalone Syncfusion PDF viewer wrapper.
 * Accepts a documentPath (URL or base64) and exposes imperative navigation via ref.
 */
const SyncfusionPdfViewer = forwardRef<SyncfusionPdfViewerHandle, SyncfusionPdfViewerProps>(
  function SyncfusionPdfViewer(
    {
      documentPath,
      onDocumentLoad,
      onPageChange,
      onZoomChange,
      height = "100%",
      showToolbar = false,
    },
    ref
  ) {
    const viewerRef = useRef<PdfViewerComponent>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
      setIsMounted(true)
    }, [])

    const absoluteResourceUrl = useMemo(() => {
      if (typeof window === "undefined") return "/ej2-pdfviewer-lib"
      return new URL("/ej2-pdfviewer-lib", window.location.origin).toString() + "/"
    }, [])

    useImperativeHandle(ref, () => ({
      goToPage(page: number) {
        viewerRef.current?.navigation?.goToPage(page)
      },
      getPageCount() {
        return viewerRef.current?.pageCount ?? 0
      },
    }))

    // Load a new document when the path changes
    useEffect(() => {
      if (viewerRef.current && documentPath) {
        viewerRef.current.load(documentPath, "")
      }
    }, [documentPath])

    if (!isMounted) return <div style={{ height }} />

    return (
      <PdfViewerComponent
        ref={viewerRef}
        id="syncfusion-pdf-viewer"
        documentPath={documentPath}
        // Point to local WASM resources with absolute URL
        resourceUrl={absoluteResourceUrl}
        style={{ height }}
        enableToolbar={showToolbar}
        enableNavigationToolbar={showToolbar}
        enableDownload={false}
        enablePrint={showToolbar}
        enableTextSearch={true}
        enableAnnotation={false}    // We manage annotations ourselves
        enableFormFields={false}
        documentLoad={(args) => {
          onDocumentLoad?.(args.pageCount)
        }}
        pageChange={(args) => {
          onPageChange?.(args.currentPageNumber)
        }}
        zoomChange={(args) => {
          // Syncfusion magnitude is the zoom percentage (e.g. 100 for 100%)
          // We convert it to a scale factor for consistency with typical web zoom APIs
          onZoomChange?.(args.currentZoomFactor / 100)
        }}
      >
        <Inject
          services={[
            Toolbar,
            Magnification,
            Navigation,
            Annotation,
            LinkAnnotation,
            BookmarkView,
            ThumbnailView,
            Print,
            TextSelection,
            TextSearch,
            FormFields,
            FormDesigner,
          ]}
        />
      </PdfViewerComponent>
    )
  }
)

SyncfusionPdfViewer.displayName = "SyncfusionPdfViewer"

export { SyncfusionPdfViewer }
