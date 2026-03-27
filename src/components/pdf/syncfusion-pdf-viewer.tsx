"use client"

import { useRef, useEffect, forwardRef, useImperativeHandle, useState, useMemo, useCallback, memo } from "react"
import { registerLicense } from "@syncfusion/ej2-base"
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
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import "./syncfusion-pdf-viewer.css"

// Register Syncfusion license key
const licenseKey = process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY
if (licenseKey) {
  registerLicense(licenseKey)
} else if (process.env.NODE_ENV === "production") {
  console.warn("Syncfusion license key is missing. Please set NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY.")
}

export type SyncfusionPdfViewerHandle = {
  goToPage: (page: number) => void
  getPageCount: () => number
  addAnnotation: (annotation: any) => void
  deleteAnnotation: (annotationId: string) => void
  getAnnotations: () => any[]
  getAnnotationById: (id: string) => any
  getPageInfo: (pageNumber: number) => { width: number; height: number }
  selectAnnotation: (annotationId: string) => void
  setAnnotationMode: (mode: 'None' | 'StickyNotes' | 'FreeText' | 'Shape' | 'Ink') => void
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
  /** Enables or disables annotations. Defaults to true. */
  enableAnnotation?: boolean
  /** Called when an annotation is added. */
  onAnnotationAdd?: (args: any) => void
  /** Called when an annotation is selected. */
  onAnnotationSelect?: (args: any) => void
  /** Called when an annotation is removed. */
  onAnnotationRemove?: (args: any) => void
  /** Called when a toolbar item is clicked. */
  onToolbarClick?: (args: any) => void
  /** The current active tool. */
  activeTool?: "pan" | "issue"
}

/**
 * Standalone Syncfusion PDF viewer wrapper.
 * Accepts a documentPath (URL or base64) and exposes imperative navigation via ref.
 */
const SyncfusionPdfViewer = memo(forwardRef<SyncfusionPdfViewerHandle, SyncfusionPdfViewerProps>(
  function SyncfusionPdfViewer(
    {
      documentPath,
      onDocumentLoad,
      onPageChange,
      onZoomChange,
      onAnnotationAdd,
      onAnnotationSelect,
      onAnnotationRemove,
      onToolbarClick,
      height = "100%",
      showToolbar = false,
      enableAnnotation = true,
      activeTool = "pan",
    },
    ref
  ) {
    const viewerRef = useRef<PdfViewerComponent>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [stableDocumentPath, setStableDocumentPath] = useState<string | null>(null)

    // Convert HTTP URLs to Blob URLs to prevent Syncfusion from repeatedly re-fetching large documents
    useEffect(() => {
      if (!documentPath) return;

      const isHttp = documentPath.startsWith('http://') || documentPath.startsWith('https://');
      if (!isHttp) {
        setStableDocumentPath(documentPath);
        return;
      }

      let isActive = true;
      let blobUrl: string | null = null;

      const fetchAsBlob = async () => {
        try {
          const response = await fetch(documentPath);
          if (!response.ok) throw new Error("Failed to fetch document: " + response.statusText);
          const blob = await response.blob();
          if (!isActive) return;
          
          blobUrl = URL.createObjectURL(blob);
          setStableDocumentPath(blobUrl);
        } catch (error) {
          console.error("Error creating blob URL for PDF:", error);
          // Fallback to the original URL if fetch fails
          if (isActive) setStableDocumentPath(documentPath);
        }
      };

      fetchAsBlob();

      return () => {
        isActive = false;
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      };
    }, [documentPath]);

    const absoluteResourceUrl = useMemo(() => {
      if (typeof window === "undefined") return "/ej2-pdfviewer-lib"
      return new URL("/ej2-pdfviewer-lib", window.location.origin).toString()
    }, [])

    const [currentZoom, setCurrentZoom] = useState(100)
    const zoomRef = useRef(100)

    useEffect(() => {
      zoomRef.current = currentZoom
    }, [currentZoom])

    useEffect(() => {
      const handleWheel = (event: WheelEvent) => {
        if (event.ctrlKey) {
          const isOverViewer = containerRef.current?.contains(event.target as Node)
          
          if (isOverViewer) {
            // Prevent browser zoom
            event.preventDefault()
            event.stopImmediatePropagation()

            const direction = event.deltaY < 0 ? 1 : -1
            const current = typeof zoomRef.current === 'number' ? zoomRef.current : 100
            
            // Increment by 10% steps
            const nextZoom = Math.round(current / 10) * 10 + (direction * 10)
            const clampedZoom = Math.max(10, Math.min(400, nextZoom))
            
            if (clampedZoom !== current) {
              viewerRef.current?.magnificationModule?.zoomTo(clampedZoom)
            }
          }
        }
      }

      window.addEventListener("wheel", handleWheel, { passive: false, capture: true })
      return () => window.removeEventListener("wheel", handleWheel, { capture: true })
    }, [isMounted])

    // Middle-mouse button panning
    useEffect(() => {
      let isDragging = false
      let startX = 0
      let startY = 0
      let startScrollLeft = 0
      let startScrollTop = 0
      let scrollContainer: HTMLElement | null = null

      const findScrollContainer = (element: HTMLElement): HTMLElement | null => {
        let parent = element
        while (parent && parent !== document.body) {
          const style = window.getComputedStyle(parent)
          const isScrollable = (style.overflow === 'auto' || style.overflow === 'scroll' || 
                               style.overflowY === 'auto' || style.overflowY === 'scroll' ||
                               style.overflowX === 'auto' || style.overflowX === 'scroll')
          if (isScrollable && (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth)) {
            return parent
          }
          parent = parent.parentElement as HTMLElement
        }
        return null
      }

      const handleMouseDown = (event: MouseEvent) => {
        if (event.button === 1) { // Middle button
          const isOverViewer = containerRef.current?.contains(event.target as Node)
          if (isOverViewer) {
            // Prevent Windows auto-scroll icon
            event.preventDefault()
            const target = event.target as HTMLElement
            scrollContainer = findScrollContainer(target)
            
            if (scrollContainer) {
              isDragging = true
              startX = event.clientX
              startY = event.clientY
              startScrollLeft = scrollContainer.scrollLeft
              startScrollTop = scrollContainer.scrollTop
              document.body.style.cursor = 'grabbing'
            }
          }
        }
      }

      const handleMouseMove = (event: MouseEvent) => {
        if (isDragging && scrollContainer) {
          const dx = event.clientX - startX
          const dy = event.clientY - startY
          scrollContainer.scrollLeft = startScrollLeft - dx
          scrollContainer.scrollTop = startScrollTop - dy
        }
      }

      const handleMouseUp = (event: MouseEvent) => {
        if (event.button === 1 && isDragging) {
          isDragging = false
          document.body.style.cursor = ''
        }
      }

      window.addEventListener("mousedown", handleMouseDown)
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)

      return () => {
        window.removeEventListener("mousedown", handleMouseDown)
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ''
      }
    }, [isMounted])

    useImperativeHandle(ref, () => ({
      goToPage(page: number) {
        viewerRef.current?.navigation?.goToPage(page)
      },
      getPageCount() {
        return viewerRef.current?.pageCount ?? 0
      },
      addAnnotation(annotation: any) {
        viewerRef.current?.annotation?.addAnnotation(annotation)
      },
      deleteAnnotation(annotationId: string) {
        // Use annotationModule.deleteAnnotationById to fix lint
        viewerRef.current?.annotationModule?.deleteAnnotationById(annotationId)
      },
      getAnnotations() {
        return (viewerRef.current as any)?.annotationModule?.getAnnotations() ?? []
      },
      getAnnotationById(id: string) {
        return (viewerRef.current as any)?.annotationModule?.getAnnotationById(id)
      },
      getPageInfo(pageNumber: number) {
        const info = viewerRef.current?.getPageInfo(pageNumber - 1)
        return {
          width: info?.width ?? 0,
          height: info?.height ?? 0
        }
      },
      selectAnnotation(annotationId: string) {
        // @ts-ignore - selectAnnotation exists on annotationModule but may not be in types
        viewerRef.current?.annotationModule?.selectAnnotation(annotationId)
      },
      setAnnotationMode(mode: any) {
        viewerRef.current?.annotation?.setAnnotationMode(mode)
      }
    }))

    // Handle active state class for the custom toolbar button
    useEffect(() => {
      const toolbarEl = containerRef.current?.querySelector('.e-toolbar');
      if (!toolbarEl) return;

      const issueBtnItem = toolbarEl.querySelector('#IssueBtn')?.closest('.e-toolbar-item');
      if (!issueBtnItem) return;

      if (activeTool === 'issue') {
        issueBtnItem.classList.add('e-active-tool');
      } else {
        issueBtnItem.classList.remove('e-active-tool');
      }
    }, [activeTool, isMounted])

    // Handle window resize to ensure the viewer container updates correctly
    useEffect(() => {
      const handleResize = () => {
        if (viewerRef.current) {
          viewerRef.current.updateViewerContainer()
        }
      }

      window.addEventListener("resize", handleResize)
      // Call once initially to ensure correct size
      handleResize()

      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }, [isMounted])

    // We no longer manually call viewerRef.current.load() here
    // because PdfViewerComponent handles it when `documentPath` prop changes.
    // Our stabilization effect above ensures it only receives a new prop if the base URL actually changes.

    const viewerStyle = useMemo(() => ({ height: "100%", width: "100%" }), [])
    const toolbarSettings = useMemo<any>(() => ({
      showTooltip: true,
      toolbarItems: [
        "SelectionTool",
        "SearchOption",
        {
          id: "IssueBtn",
          text: "Create New Issue",
          prefixIcon: "e-icons e-plus",
          tooltipText: "Create a new issue on the document",
          align: "Left",
          cssClass: "e-primary-cta",
        },
        "UndoRedoTool",
        "PageNavigationTool",
        "MagnificationTool",
        "DownloadOption",
      ],
    }), [])

    const handleDocumentLoad = useCallback((args: any) => {
      const count = args.pageCount ?? viewerRef.current?.pageCount ?? 0;
      onDocumentLoad?.(count)
    }, [onDocumentLoad])

    const handlePageChange = useCallback((args: any) => {
      onPageChange?.(args.currentPageNumber)
    }, [onPageChange])

    const handleZoomChange = useCallback((args: any) => {
      let zoomVal = args.currentZoomFactor ?? (args as any).zoomFactor ?? viewerRef.current?.magnificationModule?.zoomFactor ?? 1
      if (zoomVal <= 10) {
        zoomVal = zoomVal * 100
      }
      setCurrentZoom(zoomVal)
      onZoomChange?.(zoomVal / 100)
    }, [onZoomChange])

    useEffect(() => {
      setIsMounted(true)
    }, [])

    if (!isMounted) return <div style={{ height }} />

    if (!stableDocumentPath) {
      return (
        <div style={{ height, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }} className="bg-muted/10 text-muted-foreground">
           <div className="flex flex-col items-center gap-3">
             <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
             <span className="text-xs font-semibold uppercase tracking-widest text-primary">Downloading Document...</span>
           </div>
        </div>
      )
    }

    return (
      <div ref={containerRef} style={{ height, width: "100%" }} className="syncfusion-viewer-container">
        <PdfViewerComponent
          ref={viewerRef}
          id="syncfusion-pdf-viewer"
        documentPath={stableDocumentPath}
        resourceUrl={absoluteResourceUrl}
        width="100%"
        height="100%"
        style={viewerStyle}
        enableToolbar={showToolbar}
        enableNavigationToolbar={showToolbar}
        enableDownload={false}
        enablePrint={showToolbar}
        enableTextSearch={true}
        enableAnnotation={enableAnnotation}
        enableFormFields={false}
        minZoom={10}
        maxZoom={400}
        toolbarSettings={toolbarSettings}
        toolbarClick={onToolbarClick}
        documentLoad={handleDocumentLoad}
        pageChange={handlePageChange}
        zoomChange={handleZoomChange}
        annotationAdd={onAnnotationAdd}
        annotationSelect={onAnnotationSelect}
        annotationRemove={onAnnotationRemove}
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
      </div>
    )
  }
))

SyncfusionPdfViewer.displayName = "SyncfusionPdfViewer"

export { SyncfusionPdfViewer }
