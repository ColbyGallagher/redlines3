"use client"

import { useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { PDFDocument, rgb } from "pdf-lib"
import { Document, Page, pdfjs } from "react-pdf"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AnnotationEvent, RealtimeAnnotation, useAnnotationsChannel } from "@/lib/annotations"

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

type PDFMarkupViewerProps = {
  reviewId: string
  document: {
    id: string
    name: string
    code: string
    pdfUrl: string
  }
}

type TextAnnotationInput = {
  id: string
  page: number
  x: number
  y: number
  content: string
  color: string
  createdBy: string
  createdAt: string
}

const COLORS = ["#E11D48", "#4338CA", "#047857", "#F59E0B"]

export function PDFMarkupViewer({ reviewId, document }: PDFMarkupViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [annotations, setAnnotations] = useState<RealtimeAnnotation[]>([])
  const [activeColor, setActiveColor] = useState(COLORS[0])
  const [isExporting, setIsExporting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const channel = useAnnotationsChannel({
    reviewId,
    documentId: document.id,
    onInitialLoad(data) {
      setAnnotations(data)
    },
    onEvent(event) {
      setAnnotations((current) => applyRealtimeEvent(current, event))
    },
  })

  const handleDocumentLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const handleAddAnnotation = (event: React.MouseEvent<HTMLDivElement>, page: number) => {
    if (!channel) return

    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    const content = window.prompt("Add note")?.trim()
    if (!content) return

    const newAnnotation: TextAnnotationInput = {
      id: crypto.randomUUID(),
      page,
      x,
      y,
      content,
      color: activeColor,
      createdBy: "demo-user",
      createdAt: new Date().toISOString(),
    }

    channel.createAnnotation(newAnnotation)
  }

  const handleDeleteAnnotation = (annotationId: string) => {
    channel?.deleteAnnotation(annotationId)
  }

  const colorButtons = useMemo(
    () =>
      COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            "h-8 w-8 rounded-full border transition",
            activeColor === color ? "border-primary ring-2 ring-primary" : "border-transparent"
          )}
          style={{ backgroundColor: color }}
          onClick={() => setActiveColor(color)}
          aria-label={`Set color ${color}`}
        />
      )),
    [activeColor]
  )

  const exportAnnotations = async () => {
    setIsExporting(true)
    try {
      const existingPdfBytes = await fetch(document.pdfUrl).then((response) => response.arrayBuffer())
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      const pages = pdfDoc.getPages()

      annotations.forEach((annotation) => {
        const page = pages[annotation.page - 1]
        if (!page) return

        const { width, height } = page.getSize()
        const x = (annotation.x / 100) * width
        const y = height - (annotation.y / 100) * height

        page.drawText(annotation.content, {
          x,
          y,
          size: 12,
          color: rgb(...hexToRgb(annotation.color)),
        })
      })

      const pdfBytes = await pdfDoc.save()
      const pdfBuffer = new Uint8Array(pdfBytes)
      const blob = new Blob([pdfBuffer.buffer], { type: "application/pdf" })
      const downloadUrl = URL.createObjectURL(blob)

      const link = globalThis.document.createElement("a")
      link.href = downloadUrl
      link.download = `${document.name.replace(/\s+/g, "-").toLowerCase()}-marked.pdf`
      link.click()
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Failed to export PDF", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Markup color</span>
          <div className="flex items-center gap-2">{colorButtons}</div>
        </div>
        <Button size="sm" onClick={exportAnnotations} disabled={isExporting}>
          {isExporting ? "Preparing..." : "Export annotated PDF"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-muted/40">
        <Document file={document.pdfUrl} onLoadSuccess={handleDocumentLoad} loading={renderLoading(containerRef.current)}>
          {Array.from({ length: numPages }, (_, index) => (
            <div key={`page_${index + 1}`} className="relative flex justify-center border-b bg-white">
              <Page
                pageNumber={index + 1}
                width={900}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                className="select-none"
              />
              <AnnotationLayer
                pageNumber={index + 1}
                annotations={annotations}
                onAddAnnotation={handleAddAnnotation}
                onDeleteAnnotation={handleDeleteAnnotation}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  )
}

function AnnotationLayer({
  pageNumber,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
}: {
  pageNumber: number
  annotations: RealtimeAnnotation[]
  onAddAnnotation: (event: React.MouseEvent<HTMLDivElement>, page: number) => void
  onDeleteAnnotation: (id: string) => void
}) {
  const pageAnnotations = annotations.filter((annotation) => annotation.page === pageNumber)

  return (
    <div className="absolute inset-0" onDoubleClick={(event) => onAddAnnotation(event, pageNumber)}>
      {pageAnnotations.map((annotation) => (
        <AnnotationBadge key={annotation.id} annotation={annotation} onDelete={onDeleteAnnotation} />
      ))}
    </div>
  )
}

function AnnotationBadge({
  annotation,
  onDelete,
}: {
  annotation: RealtimeAnnotation
  onDelete: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const container = typeof window !== "undefined" ? document.getElementById("annotation-popovers") : null

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        top: `${annotation.y}%`,
        left: `${annotation.x}%`,
        transform: "translate(-50%, -50%)",
      }}
      onClick={() => setIsOpen((prev) => !prev)}
    >
      <span
        className="inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold text-white shadow"
        style={{ backgroundColor: annotation.color }}
      >
        {annotation.createdBy.slice(0, 2).toUpperCase()}
      </span>
      {isOpen && container
        ? createPortal(
            <div
              className="absolute z-50 min-w-[220px] rounded-md border bg-background p-3 text-sm shadow-lg"
              style={{
                top: `${annotation.y}%`,
                left: `${annotation.x}%`,
                transform: "translate(-50%, -120%)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{annotation.createdBy}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(annotation.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(annotation.id)}
                >
                  Delete
                </button>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm">{annotation.content}</p>
            </div>,
            container
          )
        : null}
    </div>
  )
}

function renderLoading(container: HTMLDivElement | null) {
  if (!container) return "Loading..."

  return createPortal(
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-sm text-muted-foreground">
      Loading document…
    </div>,
    container
  )
}

function applyRealtimeEvent(current: RealtimeAnnotation[], event: AnnotationEvent) {
  if (event.type === "INSERT" || event.type === "UPDATE") {
    const existing = current.find((item) => item.id === event.annotation.id)
    if (existing) {
      return current.map((item) => (item.id === event.annotation.id ? event.annotation : item))
    }
    return [...current, event.annotation]
  }

  if (event.type === "DELETE") {
    return current.filter((item) => item.id !== event.annotation.id)
  }

  return current
}

function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace("#", "")
  const bigint = parseInt(sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return [r / 255, g / 255, b / 255]
}


