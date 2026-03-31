"use client"

import React, { FormEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"
import { Loader2, AlertCircle, PanelLeft, ListChecks, Filter, Search, User, ChevronDown, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { SyncfusionPdfViewer, SyncfusionPdfViewerHandle } from "@/components/pdf/syncfusion-pdf-viewer"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AnnotationEvent, RealtimeAnnotation, useAnnotationsChannel } from "@/lib/annotations"
import { captureAnnotationSnapshot } from "@/lib/utils/dom-capture"
import { uploadIssueSnapshot } from "@/lib/actions/issues"
import type { ReviewDocument } from "@/lib/data/reviews"
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { logDocumentView, markReviewAsComplete } from "@/lib/actions/review-progress"
import { CheckCircle2 } from "lucide-react"


type PDFMarkupViewerProps = {
  reviewId: string
  document: {
    id: string
    name: string
    code: string
    pdfUrl: string
    projectId: string
  }
  childDocuments?: ReviewDocument[]
  initialAnnotations?: RealtimeAnnotation[]
  initialPage?: number
  initialAnnotationId?: string
}

const COLORS = ["#E11D48", "#4338CA", "#047857", "#F59E0B"]
const DEFAULT_IMPORTANCES = ["Low", "Medium", "High"]
const DEFAULT_DISCIPLINES = ["Architectural", "Mechanical", "Electrical", "Structural", "Interior"]

type ProjectSettings = {
  importances?: { id: string; name: string }[] | null
  disciplines?: { id: string; name: string }[] | null
  statuses?: { id: string; name: string }[] | null
  states?: { id: string; name: string }[] | null
  availableMilestones?: { name: string; description?: string }[] | null
}

type IssueDetails = {
  id: string
  issueNumber: string | null
  discipline: string | null
  importance: string | null
  status: string | null
  createdBy: string | null
  comment: string | null
  dateCreated: string | null
  dateModified: string | null
}

export function PDFMarkupViewer({ reviewId, document, childDocuments = [], initialAnnotations, initialPage, initialAnnotationId }: PDFMarkupViewerProps) {
  const [numPages, setNumPages] = useState(0)
  const [annotations, setAnnotations] = useState<RealtimeAnnotation[]>([])
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [activeColor, setActiveColor] = useState(COLORS[0])
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [discipline, setDiscipline] = useState("")
  const [importance, setImportance] = useState("")
  const [state, setState] = useState("")
  const [status, setStatus] = useState("")
  const [milestone, setMilestone] = useState("")
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
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(1)
  const viewerRef = useRef<SyncfusionPdfViewerHandle>(null)

  // Sidebar & Filtering State
  const [sidebarTab, setSidebarTab] = useState<"issues" | "thumbnails">("issues")
  const [documentIssues, setDocumentIssues] = useState<IssueDetails[]>([])
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [filterAuthor, setFilterAuthor] = useState("all")
  const [filterDiscipline, setFilterDiscipline] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const availableImportances = useMemo(() => {
    const custom = projectSettings?.importances?.filter(i => i?.id)
    return custom?.length ? custom : DEFAULT_IMPORTANCES.map(name => ({ id: name, name }))
  }, [projectSettings])

  const availableDisciplines = useMemo(() => {
    const custom = projectSettings?.disciplines?.filter(d => d?.id)
    return custom?.length ? custom : DEFAULT_DISCIPLINES.map(name => ({ id: name, name }))
  }, [projectSettings])
  const availableStatuses = useMemo(() =>
    projectSettings?.statuses?.filter(s => s?.id) ?? [],
    [projectSettings]
  )
  const availableStates = useMemo(() =>
    projectSettings?.states?.filter(s => s?.id) ?? [],
    [projectSettings]
  )
  const availableMilestones = useMemo(() =>
    projectSettings?.availableMilestones?.filter(m => m?.name) ?? [],
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
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          // Instead of crashing, we gracefully fail if Next.js hasn't compiled the route yet
          throw new Error("API returned non-JSON response (likely still building)")
        }

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
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API returned non-JSON response")
        }

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

  // Bulk Load Issues for Document
  useEffect(() => {
    let isActive = true
    setIssuesLoading(true)

    async function loadDocumentIssues() {
      try {
        const response = await fetch(`/api/issues?documentId=${document.id}`)
        if (!response.ok) throw new Error("Failed to load issues")
        const payload = await response.json()
        if (isActive) {
          setDocumentIssues(payload.issues || [])
        }
      } catch (error) {
        console.error("Failed to load document issues", error)
      } finally {
        if (isActive) setIssuesLoading(false)
      }
    }

    loadDocumentIssues()

    return () => {
      isActive = false
    }
  }, [document.id])

  // Log document view
  useEffect(() => {
    if (reviewId && document.id) {
      logDocumentView(reviewId, document.id)
    }
  }, [reviewId, document.id])

  // Filtering Logic
  const filteredAnnotations = useMemo(() => {
    return (annotations || [])
      .filter(ann => ann && typeof ann === 'object')
      .map((ann) => {
        const issue = documentIssues.find((i) => i.id === ann.issueId)
        return {
          ...ann,
          issue,
        }
      })
      .filter((ann) => {
        if (filterAuthor !== "all" && ann.createdBy !== filterAuthor) return false
        if (filterDiscipline !== "all") {
          const discipline = ann.issue?.discipline || "Unassigned"
          if (discipline !== filterDiscipline) return false
        }
        if (filterStatus !== "all") {
          const status = ann.issue?.status || "Draft"
          if (status !== filterStatus) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [annotations, documentIssues, filterAuthor, filterDiscipline, filterStatus])

  const filterOptions = useMemo(() => {
    const authors = Array.from(new Set(annotations.map((a) => a.createdBy).filter(Boolean)))
    const disciplines = Array.from(new Set(documentIssues.map((i) => i.discipline).filter(Boolean)))
    const statuses = Array.from(new Set(documentIssues.map((i) => i.status).filter(Boolean)))

    return {
      authors,
      disciplines: Array.from(new Set(["Unassigned", ...disciplines])),
      statuses: Array.from(new Set(["Draft", ...statuses])),
    }
  }, [annotations, documentIssues])

  // Syncfusion handles zoom natively, but we track it to scale our custom overlays
  useEffect(() => {
    // Current zoom-to-pointer logic is handled by Syncfusion
  }, [])

  // Navigation handled by Syncfusion
  const hasJumpedToInitialPage = useRef(false)
  useEffect(() => {
    console.log("[PDFMarkupViewer] -> Checking initialPage jump effect. hasJumped:", hasJumpedToInitialPage.current, "initialPage:", initialPage, "numPages:", numPages)
    if (!hasJumpedToInitialPage.current && initialPage && numPages >= initialPage && viewerRef.current) {
      console.log("[PDFMarkupViewer] -> Jumping to initialPage:", initialPage)
      hasJumpedToInitialPage.current = true
      viewerRef.current.goToPage(initialPage)
    }
  }, [initialPage, numPages])

  // Global Escape key listener to cancel tools
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveTool("pan")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleDocumentLoadSuccess = (pageCount: number) => {
    setNumPages(pageCount)
  }

  const handleAddAnnotation = useCallback((event: React.MouseEvent<HTMLDivElement>, page: number) => {
    if (!channel) return

    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    if (activeTool === "issue") {
      setPlacementCoords({ page, x, y })
      setDiscipline(availableDisciplines[0]?.id ?? "")
      setImportance(availableImportances[0]?.id ?? "")
      setState(availableStates[0]?.id ?? "")
      setStatus(availableStatuses[0]?.id ?? "")
      setMilestone(availableMilestones[0]?.name ?? "")
      setIssueComment("")
      setConvertDialogOpen(true)
      setActiveTool("pan")
      return
    }
  }, [channel, activeTool, availableDisciplines, availableImportances])

  const handleDeleteAnnotation = useCallback((annotationId: string) => {
    channel?.deleteAnnotation(annotationId)
    setSelectedAnnotationId((current) => (current === annotationId ? null : current))
  }, [channel])



  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation?.id === selectedAnnotationId),
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

  // Function to jump to annotation
  const jumpToAnnotation = useCallback((annotation: RealtimeAnnotation) => {
    if (viewerRef.current) {
      viewerRef.current.goToPage(annotation.page)
      setSelectedAnnotationId(annotation.id)
      // Highlight the annotation in the Syncfusion viewer ONLY if it's a native syncfusion annotation.
      // Calling this on a custom annotation will crash the viewer on mouse move.
      if (annotation.type === "syncfusion") {
        viewerRef.current.selectAnnotation(annotation.id)
      }
    }
  }, [])

  // Auto-jump to initial annotation
  const hasJumpedToInitialAnnotation = useRef(false)
  useEffect(() => {
    console.log("[PDFMarkupViewer] -> Checking initialAnnotation jump effect. hasJumped:", hasJumpedToInitialAnnotation.current, "initialAnnotationId:", initialAnnotationId, "numPages:", numPages)
    if (!hasJumpedToInitialAnnotation.current && initialAnnotationId && annotations.length > 0 && viewerRef.current && numPages > 0) {
      const ann = annotations.find(a => a.issueId === initialAnnotationId || a.id === initialAnnotationId)
      if (ann) {
        console.log("[PDFMarkupViewer] -> Found initial annotation! Jumping to page:", ann.page)
        hasJumpedToInitialAnnotation.current = true
        // Delay slightly to ensure PDF viewer interior is ready for navigation
        const timer = setTimeout(() => {
          jumpToAnnotation(ann)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [initialAnnotationId, annotations, numPages, jumpToAnnotation])

  const resetConvertForm = useCallback(() => {
    setDiscipline("")
    setImportance("")
    setState("")
    setStatus("")
    setMilestone("")
    setIssueComment("")
    setIsCreatingIssue(false)
    setPlacementCoords(null)
  }, [])

  const handleOpenConvertDialog = useCallback(() => {
    if (!selectedAnnotation || selectedAnnotation.issueId) {
      return
    }

    setDiscipline(availableDisciplines[0]?.id ?? "")
    setImportance(availableImportances[0]?.id ?? "")
    setState(availableStates[0]?.id ?? "")
    setStatus(availableStatuses[0]?.id ?? "")
    setMilestone(availableMilestones[0]?.name ?? "")
    setIssueComment(selectedAnnotation.content)
    setConvertDialogOpen(true)
  }, [selectedAnnotation, availableDisciplines, availableImportances, availableStates, availableStatuses, availableMilestones])

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
    const toastId = toast.loading("Creating issue...")

    try {
      const annotationId = placementCoords ? crypto.randomUUID() : selectedAnnotation!.id
      const pageNumber = placementCoords ? placementCoords.page : selectedAnnotation!.page

      let baseAnnotation: RealtimeAnnotation | undefined = selectedAnnotation
      let finalComment = issueComment

      // If it's a Syncfusion annotation, try to get the very latest content from the viewer
      if (selectedAnnotation?.type === "syncfusion" && viewerRef.current) {
        const syncAnn = viewerRef.current.getAnnotationById(selectedAnnotation.id)
        if (syncAnn) {
          const latestContent = syncAnn.note || syncAnn.subject || syncAnn.author || ""
          if (latestContent && !issueComment) {
            finalComment = latestContent
          }
        }
      }

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
          content: finalComment || "New issue",
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
          state,
          status,
          milestone,
          comment: finalComment,
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
            ann.id === annotationId ? { ...ann, issueId: payload.issue.id, content: finalComment } : ann
          )
        )
        if (baseAnnotation) {
          channel?.broadcastEvent({
            type: "UPDATE",
            annotation: { ...baseAnnotation, issueId: payload.issue.id, content: finalComment }
          })
        }

        // --- NEW SNAPSHOT LOGIC ---
        const pageNum = placementCoords ? placementCoords.page : selectedAnnotation!.page
        const patterns = [
          `syncfusion-pdf-viewer_pageContainer_${pageNum - 1}`,
          `syncfusion-pdf-viewer_pageDiv_${pageNum - 1}`,
          `syncfusion-pdf-viewer_pageView_${pageNum - 1}`
        ]
        let pageElement: HTMLElement | null = null
        for (const pattern of patterns) {
          const el = window.document.getElementById(pattern)
          if (el) {
            pageElement = el
            break
          }
        }

        if (pageElement) {
          // Calculate bounding box using page dimensions
          const rect = pageElement.getBoundingClientRect()
          const xPx = (baseAnnotation?.x || 0) * rect.width / 100
          const yPx = (baseAnnotation?.y || 0) * rect.height / 100
          
          const boxWidth = 400
          const boxHeight = 250
          const boundingBox = {
            x: xPx - boxWidth / 2,
            y: yPx - boxHeight / 2,
            width: boxWidth,
            height: boxHeight
          }

          captureAnnotationSnapshot(pageElement, boundingBox).then((blob) => {
            if (blob) {
              const formData = new FormData()
              formData.append("file", blob, "snapshot.jpg")
              uploadIssueSnapshot(payload.issue.id, document.projectId, reviewId, formData)
                .catch(err => console.error("Snapshot upload error:", err))
            }
          })
        }
      }

      toast.success("Issue created successfully.", { id: toastId })
      setConvertDialogOpen(false)
      resetConvertForm()
      if (placementCoords) {
        setSelectedAnnotationId(annotationId)
      }
    } catch (error) {
      console.error("Annotation conversion failed", error)
      toast.error(error instanceof Error ? error.message : "Failed to create issue.", { id: toastId })
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

  const handleSyncfusionAnnotationAdd = useCallback(async (args: any) => {
    if (!channel || !currentUser) return

    // Syncfusion annotation data
    const syncfusionAnnotation = args.annotation || args.annotationData
    if (!syncfusionAnnotation) return

    const annotationId = syncfusionAnnotation.annotationId || crypto.randomUUID()
    const creator = `${currentUser.first_name} ${currentUser.last_name}`.trim()
    const pageNum = syncfusionAnnotation.pageNumber || currentPage

    // Map Syncfusion coordinates to our percentage-based coordinates
    // Syncfusion coordinates are in points (1/72 inch) relative to the page
    let xPercent = 0
    let yPercent = 0

    if (viewerRef.current) {
      const pageInfo = viewerRef.current.getPageInfo(pageNum)
      if (pageInfo.width > 0 && pageInfo.height > 0) {
        xPercent = (syncfusionAnnotation.left / pageInfo.width) * 100
        yPercent = (syncfusionAnnotation.top / pageInfo.height) * 100
      } else {
        // Fallback if page info not yet available
        xPercent = syncfusionAnnotation.left || 0
        yPercent = syncfusionAnnotation.top || 0
      }
    }

    const content = syncfusionAnnotation.note || syncfusionAnnotation.subject || syncfusionAnnotation.author || "New Comment"

    const newAnnotation: RealtimeAnnotation = {
      id: annotationId,
      reviewId,
      documentId: document.id,
      page: pageNum,
      x: xPercent,
      y: yPercent,
      content,
      color: activeColor,
      type: "syncfusion", // Mark it as coming from Syncfusion
      classification: null,
      priority: null,
      issueId: null,
      createdBy: creator,
      createdAt: new Date().toISOString(),
    }

    // Update local state
    setAnnotations((current) => [...current, newAnnotation])

    // Sync to Supabase
    await channel.createAnnotation({
      ...newAnnotation,
    })
  }, [channel, currentUser, reviewId, document.id, currentPage, activeColor])

  const handleSyncfusionAnnotationSelect = useCallback((args: any) => {
    const annotationId = args.annotation?.annotationId
    if (annotationId) {
      setSelectedAnnotationId(annotationId)
    }
  }, [])

  const handleSyncfusionAnnotationRemove = useCallback(async (args: any) => {
    const annotationId = args.annotation?.annotationId
    if (annotationId && channel) {
      await channel.deleteAnnotation(annotationId)
      setSelectedAnnotationId((current) => (current === annotationId ? null : current))
    }
  }, [channel])

  const handleSyncfusionToolbarClick = useCallback((args: any) => {
    if (args.item && args.item.id === "IssueBtn") {
      setActiveTool("issue")
      toast.info("Issue tool active. Click on the document to place a marker.")
      // Force de-selection in Syncfusion to avoid mode conflict
      viewerRef.current?.setAnnotationMode('None')
    } else if (args.item && (args.item.id.includes("Selection") || args.item.id.includes("Pan"))) {
      // If user clicks the standard selection or pan tools, reset our custom tool
      setActiveTool("pan")
    }
  }, [viewerRef])

  const handleCompleteReview = async () => {
    const toastId = toast.loading("Marking review as complete...")
    try {
      const result = await markReviewAsComplete(reviewId)
      if (result.success) {
        toast.success(result.message, { id: toastId })
      } else {
        toast.error(result.message || "Failed to mark review as complete.", { id: toastId })
      }
    } catch (error) {
      toast.error("An unexpected error occurred", { id: toastId })
    }
  }

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col">

      {/* 2. Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
        <aside className="flex w-80 flex-col border-r bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Issues</h3>
            </div>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {filteredAnnotations.length}
            </Badge>
          </div>
 
          <div className="px-4 py-2">
            <Button 
                onClick={handleCompleteReview}
                className="w-full h-9 gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm text-xs"
            >
                <CheckCircle2 className="size-3.5" />
                I've completed my review
            </Button>
          </div>

          {/* Filters */}
          <div className="border-b bg-muted/5 p-3 space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground font-semibold px-1">Author</Label>
                <Select value={filterAuthor} onValueChange={setFilterAuthor}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="All Authors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Authors</SelectItem>
                    {filterOptions.authors.map((auth) => (
                      <SelectItem key={auth} value={auth}>{auth}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground font-semibold px-1">Discipline</Label>
                  <Select value={filterDiscipline} onValueChange={setFilterDiscipline}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {filterOptions.disciplines.map((d) => (
                        <SelectItem key={d as string} value={d as string}>{d as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground font-semibold px-1">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {filterOptions.statuses.map((s) => (
                        <SelectItem key={s as string} value={s as string}>{s as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-0">
            {issuesLoading ? (
              <div className="flex h-32 flex-col items-center justify-center space-y-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-xs">Loading issues...</p>
              </div>
            ) : filteredAnnotations.length > 0 ? (
              <Accordion type="single" collapsible className="w-full" value={selectedAnnotationId || undefined} onValueChange={(val: string) => val && setSelectedAnnotationId(val)}>
                {filteredAnnotations.map((ann) => (
                  <AccordionItem 
                    key={ann.id} 
                    value={ann.id} 
                    className={cn(
                      "border-b px-0 transition-all duration-200 hover:bg-muted/30 relative",
                      selectedAnnotationId === ann.id ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"
                    )}
                  >
                    <div 
                      className="flex items-start px-3 py-3 group cursor-pointer" 
                      onClick={() => jumpToAnnotation(ann)}
                    >
                      <div className="mt-0.5 mr-3 flex-shrink-0">
                        <Avatar className="h-7 w-7 border-2 border-background shadow-sm ring-1 ring-muted">
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary uppercase">
                            {ann.createdBy?.split(' ').map(n => n[0]).join('') || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => jumpToAnnotation(ann)}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] font-bold text-foreground truncate max-w-[120px]">
                            {ann.createdBy}
                          </span>
                          <div className="flex items-center gap-1">
                            {ann.issue && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-mono font-medium border-primary/20 bg-primary/5 text-primary">
                                {ann.issue.issueNumber}
                              </Badge>
                            )}
                            <Badge className={cn(
                              "text-[9px] px-1 py-0 h-4 font-semibold uppercase tracking-tight",
                              ann.issue?.status === "Open" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                                ann.issue?.status === "Resolved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                  "bg-muted text-muted-foreground"
                            )} variant="outline">
                              {ann.issue?.status || "Draft"}
                            </Badge>
                          </div>
                        </div>
                        <p className={cn(
                          "text-[11px] line-clamp-2 italic leading-relaxed",
                          selectedAnnotationId === ann.id ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          "{ann.content}"
                        </p>
                      </div>
                      <AccordionTrigger className="p-1 hover:no-underline opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <AccordionContent className="px-4 pb-4 pt-1 border-t border-muted/30 bg-background/40">
                      <div className="space-y-4 text-xs mt-2">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Markup Detail</Label>
                            <span className="text-[10px] text-muted-foreground font-medium">Page {ann.page}</span>
                          </div>
                          <div className="p-2.5 rounded-md bg-muted/20 border border-muted/30 text-[11px] leading-relaxed text-foreground/90 font-medium">
                            {ann.content}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Discipline</p>
                            <p className="font-semibold text-foreground flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-primary/40" />
                              {ann.issue?.discipline || "Unassigned"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Importance</p>
                            <p className="font-semibold text-foreground">
                              {ann.issue?.importance || "None"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</p>
                            <p className="font-semibold text-foreground">
                              {ann.issue?.status || "Draft"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Created</p>
                            <p className="font-medium text-muted-foreground/80">
                              {new Date(ann.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 flex items-center gap-2 border-t border-muted/20">
                          {!ann.issueId ? (
                            <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] font-bold uppercase tracking-tight bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary" onClick={handleOpenConvertDialog}>
                              Convert to Issue
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="flex-1 h-7 text-[10px] font-bold uppercase tracking-tight" disabled>
                              Linked to {ann.issue?.issueNumber}
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteAnnotation(ann.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                  <Filter className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">No issues found</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Try adjusting your filters or search to find what you're looking for.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase" onClick={() => {
                  setFilterAuthor("all")
                  setFilterDiscipline("all")
                  setFilterStatus("all")
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </aside>


        {/* PDF Container */}
        <div className="relative flex-1 bg-muted/10 overflow-hidden min-w-0">
          <SyncfusionPdfViewer
            ref={viewerRef}
            documentPath={document.pdfUrl}
            onDocumentLoad={handleDocumentLoadSuccess}
            onPageChange={setCurrentPage}
            onZoomChange={setZoomLevel}
            onAnnotationAdd={handleSyncfusionAnnotationAdd}
            onAnnotationSelect={handleSyncfusionAnnotationSelect}
            onAnnotationRemove={handleSyncfusionAnnotationRemove}
            onToolbarClick={handleSyncfusionToolbarClick}
            height="100%"
            showToolbar={true} // Enable toolbar so user can use annotation tools
            enableAnnotation={true}
            activeTool={activeTool}
          />

          {/* Custom Annotation Overlay Layer — only for pages Syncfusion currently has in the DOM */}
          <VisiblePageOverlays
            containerRef={containerRef}
            annotations={annotations}
            activeTool={activeTool}
            onAddAnnotation={handleAddAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            onSelectAnnotation={setSelectedAnnotationId}
            selectedAnnotationId={selectedAnnotationId}
          />
        </div>
      </div>
      {/* 3. Bottom Bar */}
      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground uppercase tracking-tight">Document</span>
            <code className="rounded bg-background border px-1.5 py-0.5 font-mono text-primary shadow-sm">
              {childDocuments.find(d => d.pageNumber === currentPage)?.documentCode || document.code}
            </code>
            <span className="text-muted-foreground/60">|</span>
            <span>{childDocuments.find(d => d.pageNumber === currentPage)?.documentName || document.name}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground uppercase tracking-tight">Page</span>
            <span className="font-mono text-primary">{currentPage} / {numPages}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span>Connected</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground uppercase tracking-tight">Zoom</span>
            <span className="font-mono text-primary w-12 text-right">{Math.round(zoomLevel * 100)}%</span>
          </div>
        </div>
      </div>

      {/* 4. Convert Dialog */}
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
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
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
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="convert-milestone">Milestone</Label>
                <Select value={milestone} onValueChange={setMilestone}>
                  <SelectTrigger id="convert-milestone">
                    <SelectValue placeholder="Select milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMilestones.length > 0 ? (
                      availableMilestones.map((m) => (
                        <SelectItem key={m.name} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No milestones configured</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="convert-state">State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger id="convert-state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStates.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="convert-status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="convert-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
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
/**
 * VisiblePageOverlays
 *
 * Uses a single MutationObserver to track which Syncfusion page elements are
 * currently in the DOM and only renders overlays for those (typically 2-4 pages).
 * Replaces the old approach of mounting 42+ SyncfusionPageOverlay components
 * each with their own setInterval DOM poll.
 */
function VisiblePageOverlays({
  containerRef,
  annotations,
  activeTool,
  onAddAnnotation,
  onDeleteAnnotation,
  onSelectAnnotation,
  selectedAnnotationId,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  annotations: RealtimeAnnotation[]
  activeTool: "pan" | "issue"
  onAddAnnotation: (event: React.MouseEvent<HTMLDivElement>, page: number) => void
  onDeleteAnnotation: (id: string) => void
  onSelectAnnotation: (id: string | null) => void
  selectedAnnotationId: string | null
}) {
  // Map of pageNumber → DOM element for pages Syncfusion currently has rendered
  const [visiblePages, setVisiblePages] = useState<Map<number, HTMLElement>>(new Map())

  // Pre-index annotations by page so each overlay only receives its own
  const annotationsByPage = useMemo(() => {
    const map = new Map<number, RealtimeAnnotation[]>()
    for (const ann of annotations) {
      if (!ann || typeof ann !== 'object') continue
      const arr = map.get(ann.page)
      if (arr) { arr.push(ann) } else { map.set(ann.page, [ann]) }
    }
    return map
  }, [annotations])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const PAGE_ID_REGEX = /^syncfusion-pdf-viewer_page(?:Container|Div|Canvas|View)_(\d+)$/

    /** Scan the container for Syncfusion page elements and update state */
    const scan = () => {
      const next = new Map<number, HTMLElement>()
      // Syncfusion page containers all have IDs matching the regex above
      const candidates = container.querySelectorAll<HTMLElement>('[id^="syncfusion-pdf-viewer_page"]')
      for (const el of candidates) {
        const match = el.id.match(PAGE_ID_REGEX)
        if (match) {
          const pageNum = parseInt(match[1], 10) + 1 // 0-indexed → 1-indexed
          // Keep the first match per page (Container is preferred)
          if (!next.has(pageNum)) {
            next.set(pageNum, el)
          }
        }
      }
      setVisiblePages(prev => {
        // Only update if the set of visible pages actually changed
        if (prev.size === next.size) {
          let same = true
          for (const [k, v] of next) {
            if (prev.get(k) !== v) { same = false; break }
          }
          if (same) return prev
        }
        return next
      })
    }

    // Initial scan
    scan()

    // Observe mutations — Syncfusion adds/removes page divs as user scrolls
    const observer = new MutationObserver(scan)
    observer.observe(container, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [containerRef])

  return (
    <>
      {Array.from(visiblePages.entries()).map(([pageNumber, element]) => (
        <VisiblePagePortal
          key={pageNumber}
          pageNumber={pageNumber}
          targetElement={element}
          annotations={annotationsByPage.get(pageNumber) ?? EMPTY_ANNOTATIONS}
          activeTool={activeTool}
          onAddAnnotation={onAddAnnotation}
          onDeleteAnnotation={onDeleteAnnotation}
          onSelectAnnotation={onSelectAnnotation}
          selectedAnnotationId={selectedAnnotationId}
        />
      ))}
    </>
  )
}

const EMPTY_ANNOTATIONS: RealtimeAnnotation[] = []

/** Thin portal wrapper — no timers, no polling */
const VisiblePagePortal = React.memo(function VisiblePagePortal({
  pageNumber,
  targetElement,
  annotations,
  activeTool,
  onAddAnnotation,
  onDeleteAnnotation,
  onSelectAnnotation,
  selectedAnnotationId,
}: {
  pageNumber: number
  targetElement: HTMLElement
  annotations: RealtimeAnnotation[]
  activeTool: "pan" | "issue"
  onAddAnnotation: (event: React.MouseEvent<HTMLDivElement>, page: number) => void
  onDeleteAnnotation: (id: string) => void
  onSelectAnnotation: (id: string | null) => void
  selectedAnnotationId: string | null
}) {
  return createPortal(
    <AnnotationLayer
      pageNumber={pageNumber}
      annotations={annotations}
      activeTool={activeTool}
      onAddAnnotation={onAddAnnotation}
      onDeleteAnnotation={onDeleteAnnotation}
      onSelectAnnotation={onSelectAnnotation}
      selectedAnnotationId={selectedAnnotationId}
    />,
    targetElement
  )
})


const AnnotationLayer = React.memo(function AnnotationLayer({
  pageNumber,
  annotations,
  activeTool,
  onAddAnnotation,
  onDeleteAnnotation,
  onSelectAnnotation,
  selectedAnnotationId,
}: {
  pageNumber: number
  annotations: RealtimeAnnotation[]
  activeTool: "pan" | "issue"
  onAddAnnotation: (event: React.MouseEvent<HTMLDivElement>, page: number) => void
  onDeleteAnnotation: (id: string) => void
  onSelectAnnotation: (id: string | null) => void
  selectedAnnotationId: string | null
}) {
  // Annotations are already pre-filtered to this page — no filtering needed here
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Only track mouse position when the issue tool is active
  const handleMouseMove = activeTool === "issue"
    ? (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setMousePos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        })
      }
    : undefined

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === "issue") {
      onAddAnnotation(event, pageNumber)
    } else {
      onSelectAnnotation(null)
    }
  }

  return (
    <div
      id={`annotation-layer-${pageNumber}`}
      className={cn(
        "absolute inset-0 z-[9999] bg-transparent",
        activeTool === "issue" ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
      )}
      onClickCapture={handleClick}
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
      {annotations.map((annotation) => (
        <AnnotationBadge
          key={annotation.id}
          annotation={annotation}
          isSelected={selectedAnnotationId === annotation.id}
          onDelete={onDeleteAnnotation}
          onSelect={() => onSelectAnnotation(annotation.id)}
        />
      ))}
    </div>
  )
})

const AnnotationBadge = React.memo(function AnnotationBadge({
  annotation,
  isSelected,
  onDelete,
  onSelect,
}: {
  annotation: RealtimeAnnotation
  isSelected: boolean
  onDelete: (id: string) => void
  onSelect: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const container = typeof window !== "undefined" ? document.getElementById("annotation-popovers") : null

  return (
    <div
      id={`annotation-badge-${annotation.id}`}
      className="absolute cursor-pointer pointer-events-auto z-[60] group"
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
      {/* Visual Highlight Ring */}
      {isSelected && (
        <div 
          className="absolute inset-0 -m-3 rounded-full animate-pulse bg-primary/20 ring-4 ring-primary/40 pointer-events-none" 
          style={{ animationDuration: '1.5s' }}
        />
      )}
      {(annotation.type === "text" || annotation.issueId) && (
        <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2">
          <AlertCircle className="h-4 w-4 text-destructive drop-shadow-sm" />
        </div>
      )}
      {annotation.type === "text" ? (
        <div
          className="pointer-events-none whitespace-nowrap rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-md ring-1 ring-inset transition-all group-hover:scale-105"
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
          className="pointer-events-none inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold text-white shadow-lg transition-all group-hover:scale-110"
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
})

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
