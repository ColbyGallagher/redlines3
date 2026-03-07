"use client"

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { PDFDocument, rgb } from "pdf-lib"
import { Document, Page, pdfjs } from "react-pdf"
import { AlertTriangle, Loader2, Hand, Type, MessageSquare, AlertCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AnnotationEvent, RealtimeAnnotation, useAnnotationsChannel } from "@/lib/annotations"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

type PDFMarkupViewerProps = {
  reviewId: string
  document: {
    id: string
    name: string
    code: string
    pdfUrl: string
    projectId: string
  }
  initialAnnotations?: RealtimeAnnotation[]
}

const COLORS = ["#E11D48", "#4338CA", "#047857", "#F59E0B"]
const DEFAULT_IMPORTANCES = ["Low", "Medium", "High"]
const DEFAULT_DISCIPLINES = ["Architectural", "Mechanical", "Electrical", "Structural", "Interior"]

type ProjectSettings = {
  importances?: string[] | null
  disciplines?: string[] | null
}

type IssueDetails = {
  issueNumber: string | null
  discipline: string | null
  importance: string | null
  status: string | null
  createdBy: string | null
  dateCreated: string | null
  dateModified: string | null
}

export function PDFMarkupViewer({ reviewId, document, initialAnnotations }: PDFMarkupViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [annotations, setAnnotations] = useState<RealtimeAnnotation[]>([])
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [activeColor, setActiveColor] = useState(COLORS[0])
  const [isExporting, setIsExporting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [discipline, setDiscipline] = useState("")
  const [importance, setImportance] = useState("")
  const [issueComment, setIssueComment] = useState("")
  const [isCreatingIssue, setIsCreatingIssue] = useState(false)
  const [issueDetails, setIssueDetails] = useState<IssueDetails | null>(null)
  const [issueLoading, setIssueLoading] = useState(false)
  const [issueError, setIssueError] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<"pan" | "issue">("pan")
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const [currentUser, setCurrentUser] = useState<{ first_name: string; last_name: string } | null>(null)
  const [placementCoords, setPlacementCoords] = useState<{ page: number; x: number; y: number } | null>(null)

  const availableImportances = useMemo(() =>
    projectSettings?.importances?.length ? projectSettings.importances : DEFAULT_IMPORTANCES,
    [projectSettings]
  )
  const availableDisciplines = useMemo(() =>
    projectSettings?.disciplines?.length ? projectSettings.disciplines : DEFAULT_DISCIPLINES,
    [projectSettings]
  )

  const handleInitialLoad = useCallback((data: RealtimeAnnotation[]) => {
    setAnnotations(data)
  }, [])

  const handleEvent = useCallback((event: AnnotationEvent) => {
    setAnnotations((current) => applyRealtimeEvent(current, event))
  }, [])

  const channel = useAnnotationsChannel({
    reviewId,
    documentId: document.id,
    initialAnnotations,
    onInitialLoad: handleInitialLoad,
    onEvent: handleEvent,
  })

  useEffect(() => {
    if (!document.projectId) {
      setProjectSettings(null)
      setSettingsError(null)
      return
    }

    let isActive = true
    setProjectSettings(null)
    setSettingsError(null)
    const encodedProjectId = encodeURIComponent(document.projectId)

    async function loadSettings() {
      try {
        const response = await fetch(`/api/projects/${encodedProjectId}/settings`)
        const payload = await response.json()
        if (!isActive) return

        if (!response.ok) {
          setSettingsError(payload?.error ?? "Failed to load project settings")
          return
        }

        setProjectSettings(payload.settings ?? null)
        setSettingsError(null)
      } catch (error) {
        if (!isActive) return
        console.error("Failed to load project settings", error)
        setSettingsError("Failed to load project settings")
      }
    }

    loadSettings()

    return () => {
      isActive = false
    }
  }, [document.projectId])

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/sidebar")
        const payload = await response.json()
        if (payload.user) {
          setCurrentUser({
            first_name: payload.user.first_name,
            last_name: payload.user.last_name,
          })
        }
      } catch (error) {
        console.error("Failed to load user profile", error)
      }
    }
    loadUser()
  }, [])

  const handleDocumentLoad = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const handleAddAnnotation = useCallback((event: React.MouseEvent<HTMLDivElement>, page: number) => {
    if (!channel) return

    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    if (activeTool === "issue") {
      setPlacementCoords({ page, x, y })
      setDiscipline(availableDisciplines[0] ?? "")
      setImportance(availableImportances[0] ?? "")
      setIssueComment("")
      setConvertDialogOpen(true)
      return
    }
  }, [channel, activeTool, availableDisciplines, availableImportances])

  const handleDeleteAnnotation = useCallback((annotationId: string) => {
    channel?.deleteAnnotation(annotationId)
    setSelectedAnnotationId((current) => (current === annotationId ? null : current))
  }, [channel])

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

  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedAnnotationId),
    [annotations, selectedAnnotationId]
  )

  useEffect(() => {
    const issueId = selectedAnnotation?.issueId
    if (!issueId) {
      setIssueDetails(null)
      setIssueError(null)
      setIssueLoading(false)
      return
    }

    let isActive = true
    setIssueLoading(true)
    setIssueError(null)
    setIssueDetails(null)

    async function loadIssue() {
      try {
        const response = await fetch(`/api/issues/${encodeURIComponent(issueId as string)}`)
        const payload = await response.json()
        if (!isActive) return

        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to load issue details.")
        }

        setIssueDetails(payload.issue ?? null)
      } catch (error) {
        if (!isActive) return
        console.error("Failed to load issue details", error)
        setIssueError("Unable to load issue details.")
      } finally {
        if (isActive) {
          setIssueLoading(false)
        }
      }
    }

    void loadIssue()

    return () => {
      isActive = false
    }
  }, [selectedAnnotation?.issueId])

  const resetConvertForm = useCallback(() => {
    setDiscipline("")
    setImportance("")
    setIssueComment("")
    setIsCreatingIssue(false)
    setPlacementCoords(null)
  }, [])

  const handleOpenConvertDialog = useCallback(() => {
    if (!selectedAnnotation || selectedAnnotation.issueId) {
      return
    }

    setDiscipline(availableDisciplines[0] ?? "")
    setImportance(availableImportances[0] ?? "")
    setIssueComment(selectedAnnotation.content)
    setConvertDialogOpen(true)
  }, [selectedAnnotation, availableDisciplines, availableImportances])

  const handleConvertDialogChange = useCallback((next: boolean) => {
    if (!next) {
      resetConvertForm()
    }
    setConvertDialogOpen(next)
  }, [resetConvertForm])

  const handleConvertToIssue = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedAnnotation && !placementCoords) {
      return
    }

    if (!discipline || !importance) {
      toast.error("Please select a discipline and importance.")
      return
    }

    setIsCreatingIssue(true)
    try {
      const annotationId = placementCoords ? crypto.randomUUID() : selectedAnnotation!.id
      const pageNumber = placementCoords ? placementCoords.page : selectedAnnotation!.page

      let baseAnnotation: RealtimeAnnotation | undefined = selectedAnnotation

      // 1. If new placement, create the annotation first
      if (placementCoords) {
        const creator = currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() : "demo-user"
        baseAnnotation = {
          id: annotationId,
          reviewId,
          documentId: document.id,
          page: placementCoords.page,
          x: placementCoords.x,
          y: placementCoords.y,
          content: issueComment || "New issue",
          color: activeColor,
          type: "text",
          classification: null,
          priority: null,
          issueId: null, // Will be linked shortly
          createdBy: creator,
          createdAt: new Date().toISOString(),
        }

        // Optimistic update
        setAnnotations((current) => [...current, baseAnnotation!])

        await channel?.createAnnotation({
          ...baseAnnotation!,
        })
      }

      // 2. Convert/Link to issue
      const response = await fetch("/api/annotations/convert-to-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: document.projectId,
          reviewId,
          documentId: document.id,
          annotationIds: [annotationId],
          discipline,
          importance,
          comment: issueComment,
          pageNumber,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to convert annotation to issue.")
      }

      // Update local state with the new issue ID so the sidebar can load it
      if (payload.issue?.id) {
        setAnnotations((current) =>
          current.map((ann) =>
            ann.id === annotationId ? { ...ann, issueId: payload.issue.id } : ann
          )
        )
        if (baseAnnotation) {
          channel?.broadcastEvent({
            type: "UPDATE",
            annotation: { ...baseAnnotation, issueId: payload.issue.id }
          })
        }
      }

      toast.success("Issue created successfully.")
      setConvertDialogOpen(false)
      resetConvertForm()
      if (placementCoords) {
        setSelectedAnnotationId(annotationId)
      }
    } catch (error) {
      console.error("Annotation conversion failed", error)
      toast.error(error instanceof Error ? error.message : "Failed to create issue.")
    } finally {
      setIsCreatingIssue(false)
    }
  }, [
    selectedAnnotation,
    placementCoords,
    discipline,
    importance,
    issueComment,
    currentUser,
    activeColor,
    channel,
    document.projectId,
    document.id,
    reviewId,
    resetConvertForm,
  ])

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-1">Tool</span>
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
              <Button
                variant={activeTool === "pan" ? "secondary" : "ghost"}
                size="sm"
                className={cn("h-7 px-2 gap-1.5 text-xs font-medium", activeTool === "pan" && "bg-background shadow-sm")}
                onClick={() => setActiveTool("pan")}
              >
                <Hand className="h-3.5 w-3.5" />
                Pan
              </Button>
              <Button
                variant={activeTool === "issue" ? "secondary" : "ghost"}
                size="sm"
                className={cn("h-7 px-2 gap-1.5 text-xs font-medium", activeTool === "issue" && "bg-background shadow-sm")}
                onClick={() => setActiveTool("issue")}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Issue
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Color</span>
            <div className="flex items-center gap-2">{colorButtons}</div>
          </div>
        </div>

        <Button size="sm" onClick={exportAnnotations} disabled={isExporting}>
          {isExporting ? "Preparing..." : "Export annotated PDF"}
        </Button>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Properties Sidebar */}
        <aside className="flex w-72 flex-col border-r bg-card">
          <div className="border-b p-4">
            <h3 className="text-sm font-semibold">Properties</h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {selectedAnnotation ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Content</p>
                  <p className="text-sm font-medium break-words">{selectedAnnotation.content}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Author</p>
                  <p className="text-sm">{selectedAnnotation.createdBy}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Created</p>
                  <p className="text-sm">{new Date(selectedAnnotation.createdAt).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Color</p>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-5 w-5 rounded-full border"
                      style={{ backgroundColor: selectedAnnotation.color }}
                    />
                    <span className="text-xs text-muted-foreground">{selectedAnnotation.color}</span>
                  </div>
                </div>
                {selectedAnnotation.issueId && (
                  <div className="space-y-2 rounded-md border border-border bg-muted/50 p-3 text-xs">
                    {issueLoading ? (
                      <p className="text-muted-foreground">Loading issue details…</p>
                    ) : issueError ? (
                      <p className="text-destructive">{issueError}</p>
                    ) : issueDetails ? (
                      <div className="space-y-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Linked issue</p>
                        <dl className="space-y-2 text-[11px]">
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Issue #</dt>
                            <dd className="font-medium">{issueDetails.issueNumber ?? "Unknown"}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Discipline</dt>
                            <dd className="font-medium">{issueDetails.discipline ?? "Unknown"}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Importance</dt>
                            <dd className="font-medium">{issueDetails.importance ?? "Unknown"}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Created by</dt>
                            <dd className="font-medium">{issueDetails.createdBy ?? "Unknown"}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Date created</dt>
                            <dd className="font-medium">{formatIssueTimestamp(issueDetails.dateCreated)}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Last modified</dt>
                            <dd className="font-medium">{formatIssueTimestamp(issueDetails.dateModified)}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-muted-foreground">Status</dt>
                            <dd className="font-medium">{issueDetails.status ?? "Unknown"}</dd>
                          </div>
                        </dl>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Issue data not available.</p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleOpenConvertDialog}
                    disabled={Boolean(selectedAnnotation.issueId)}
                  >
                    {selectedAnnotation.issueId ? "Annotation already linked" : "Convert to issue"}
                  </Button>
                  {selectedAnnotation.issueId && (
                    <p className="text-xs text-muted-foreground">This annotation is already linked to an issue.</p>
                  )}
                  {settingsError && (
                    <p className="text-xs text-destructive">{settingsError}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleDeleteAnnotation(selectedAnnotation.id)}
                >
                  Delete Markup
                </Button>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <p>No markup selected</p>
                <p className="text-xs">Select a markup to view details.</p>
              </div>
            )}
          </div>
        </aside>

        {/* PDF Scroll Container */}
        <div
          ref={scrollRef}
          className={cn(
            "flex-1 overflow-auto bg-muted/40 transition-colors",
            activeTool === "pan" && "cursor-grab",
            isPanning && "cursor-grabbing select-none"
          )}
          onMouseDown={(e) => {
            if (activeTool !== "pan") return
            setIsPanning(true)
            panStartRef.current = {
              x: e.clientX,
              y: e.clientY,
              scrollLeft: scrollRef.current?.scrollLeft || 0,
              scrollTop: scrollRef.current?.scrollTop || 0,
            }
          }}
          onMouseMove={(e) => {
            if (!isPanning || !scrollRef.current) return
            const dx = e.clientX - panStartRef.current.x
            const dy = e.clientY - panStartRef.current.y
            scrollRef.current.scrollLeft = panStartRef.current.scrollLeft - dx
            scrollRef.current.scrollTop = panStartRef.current.scrollTop - dy
          }}
          onMouseUp={() => setIsPanning(false)}
          onMouseLeave={() => setIsPanning(false)}
        >
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
                  activeTool={activeTool}
                  onAddAnnotation={handleAddAnnotation}
                  onDeleteAnnotation={handleDeleteAnnotation}
                  onSelectAnnotation={setSelectedAnnotationId}
                />
              </div>
            ))}
          </Document>
        </div>
      </div>

      {/* 3. Convert Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={handleConvertDialogChange}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleConvertToIssue} className="space-y-6">
            <DialogHeader>
              <DialogTitle>{placementCoords ? "Create new issue" : "Convert annotation to issue"}</DialogTitle>
              <DialogDescription>
                {placementCoords
                  ? "Provide the details for the new issue markup."
                  : "Use the selected markup to seed a new issue and link it back to this annotation."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label className="text-muted-foreground text-[11px] uppercase tracking-wider">Reporter</Label>
                <div className="flex items-center gap-2 px-1">
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {currentUser?.first_name?.charAt(0)}{currentUser?.last_name?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">
                    {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : "Loading user..."}
                  </span>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="convert-comment">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="convert-comment"
                  value={issueComment}
                  onChange={(event) => setIssueComment(event.target.value)}
                  placeholder="Summarize the issue clearly"
                  rows={4}
                  className="resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="convert-discipline">
                    Discipline <span className="text-destructive">*</span>
                  </Label>
                  <Select value={discipline} onValueChange={setDiscipline}>
                    <SelectTrigger id="convert-discipline">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDisciplines.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="convert-importance">
                    Importance <span className="text-destructive">*</span>
                  </Label>
                  <Select value={importance} onValueChange={setImportance}>
                    <SelectTrigger id="convert-importance">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableImportances.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setConvertDialogOpen(false)} disabled={isCreatingIssue}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingIssue || !discipline || !importance || !issueComment.trim()}>
                {isCreatingIssue && <Loader2 className="mr-2 size-4 animate-spin" />}
                {placementCoords ? "Place issue markup" : "Convert to issue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <div id="annotation-popovers" />
    </div>
  )
}

function AnnotationLayer({
  pageNumber,
  annotations,
  activeTool,
  onAddAnnotation,
  onDeleteAnnotation,
  onSelectAnnotation,
}: {
  pageNumber: number
  annotations: RealtimeAnnotation[]
  activeTool: "pan" | "issue"
  onAddAnnotation: (event: React.MouseEvent<HTMLDivElement>, page: number) => void
  onDeleteAnnotation: (id: string) => void
  onSelectAnnotation: (id: string | null) => void
}) {
  const pageAnnotations = annotations.filter((annotation) => annotation.page === pageNumber)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setMousePos({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === "issue") {
      onAddAnnotation(event, pageNumber)
    } else {
      onSelectAnnotation(null)
    }
  }

  return (
    <div
      className={cn(
        "absolute inset-0",
        activeTool === "issue" && "cursor-crosshair"
      )}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
    >
      {activeTool === "issue" && (
        <div
          className="pointer-events-none absolute z-[100] whitespace-nowrap rounded-sm bg-primary/90 px-2 py-1 text-[10px] font-medium text-primary-foreground shadow-lg backdrop-blur-sm"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y + 12,
          }}
        >
          Click to create {activeTool}
        </div>
      )}
      {pageAnnotations.map((annotation) => (
        <AnnotationBadge
          key={annotation.id}
          annotation={annotation}
          onDelete={onDeleteAnnotation}
          onSelect={() => onSelectAnnotation(annotation.id)}
        />
      ))}
    </div>
  )
}

function AnnotationBadge({
  annotation,
  onDelete,
  onSelect,
}: {
  annotation: RealtimeAnnotation
  onDelete: (id: string) => void
  onSelect: () => void
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
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
        setIsOpen((prev) => !prev)
      }}
    >
      {(annotation.type === "text" || annotation.issueId) && (
        <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2">
          <AlertCircle className="h-4 w-4 text-destructive drop-shadow-sm" />
        </div>
      )}
      {annotation.type === "text" ? (
        <div
          className="whitespace-nowrap rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-md ring-1 ring-inset transition-all hover:scale-105"
          style={{
            backgroundColor: `${annotation.color}15`, // ~8% opacity
            color: annotation.color,
            boxShadow: `0 0 10px ${annotation.color}20`,
            borderColor: annotation.color,
          }}
        >
          {annotation.content}
        </div>
      ) : (
        <span
          className="inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold text-white shadow-lg transition-all hover:scale-110"
          style={{ backgroundColor: annotation.color }}
        >
          {annotation.createdBy.slice(0, 2).toUpperCase()}
        </span>
      )}
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

function applyRealtimeEvent(current: RealtimeAnnotation[], event: AnnotationEvent): RealtimeAnnotation[] {
  if (event.type === "INSERT") {
    const existing = current.find((item) => item.id === event.annotation.id)
    if (existing) {
      return current.map((item) => (item.id === event.annotation.id ? { ...item, ...event.annotation } as RealtimeAnnotation : item))
    }
    return [...current, event.annotation as RealtimeAnnotation]
  }

  if (event.type === "UPDATE") {
    return current.map((item) => (item.id === event.annotation.id ? { ...item, ...event.annotation } as RealtimeAnnotation : item))
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

function formatIssueTimestamp(value?: string | null) {
  if (!value) return "Unknown"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
