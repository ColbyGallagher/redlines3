"use client"

import { useEffect, useMemo, useState } from "react"

import { supabase as supabaseClient } from "@/lib/supabase/client"

const TABLE_NAME = "annotations"

type DbAnnotation = {
  id: string
  review_id: string
  document_id: string
  page: number
  x: number
  y: number
  content: string
  color: string
  classification: string | null
  priority: string | null
  type: string
  issue_id: string | null
  created_by: string
  created_at: string
}

export type RealtimeAnnotation = {
  id: string
  reviewId: string
  documentId: string
  page: number
  x: number
  y: number
  content: string
  color: string
  classification: string | null
  priority: string | null
  type: string
  issueId: string | null
  createdBy: string
  createdAt: string
}

export type AnnotationEvent =
  | {
    type: "INSERT"
    annotation: RealtimeAnnotation
  }
  | {
    type: "UPDATE"
    annotation: Partial<RealtimeAnnotation> & { id: string }
  }
  | {
    type: "DELETE"
    annotation: { id: string }
  }

type UseAnnotationsChannelOptions = {
  reviewId: string
  documentId: string
  initialAnnotations?: RealtimeAnnotation[]
  onInitialLoad?: (annotations: RealtimeAnnotation[]) => void
  onEvent?: (event: AnnotationEvent) => void
}

type TextAnnotationInput = {
  id: string
  page: number
  x: number
  y: number
  content: string
  color: string
  classification?: string | null
  priority?: string | null
  type: string
  createdBy: string
  createdAt: string
}

export function useAnnotationsChannel({
  reviewId,
  documentId,
  initialAnnotations,
  onInitialLoad,
  onEvent,
}: UseAnnotationsChannelOptions) {
  const supabase = supabaseClient
  const [isReady, setIsReady] = useState(false)

  const channel = useMemo(() => {
    return supabase.channel(`annotations:${reviewId}:${documentId}`)
  }, [supabase, reviewId, documentId])

  useEffect(() => {
    if (!supabase) return

    let isActive = true

    async function fetchAnnotations() {
      if (initialAnnotations && initialAnnotations.length > 0) {
        if (onInitialLoad && isActive) {
          onInitialLoad(initialAnnotations);
        }
        setIsReady(true);
        return;
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("review_id", reviewId)
        .eq("document_id", documentId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Failed to load annotations", error)
        return
      }

      if (!isActive) return
      onInitialLoad?.(data.map(mapDbToRealtime))
      setIsReady(true)
    }

    fetchAnnotations()

    return () => {
      isActive = false
    }
  }, [supabase, reviewId, documentId, onInitialLoad])

  useEffect(() => {
    if (!channel) return

    const subscription = channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: TABLE_NAME, filter: `document_id=eq.${documentId}` },
        (payload) => {
          onEvent?.({ type: "INSERT", annotation: mapDbToRealtime(payload.new as DbAnnotation) as RealtimeAnnotation })
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: TABLE_NAME, filter: `document_id=eq.${documentId}` },
        (payload) => {
          onEvent?.({ type: "UPDATE", annotation: mapDbToPartialRealtime(payload.new as Partial<DbAnnotation> & { id: string }) })
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: TABLE_NAME, filter: `document_id=eq.${documentId}` },
        (payload) => {
          onEvent?.({ type: "DELETE", annotation: { id: (payload.old as DbAnnotation).id } })
        }
      )
      .on(
        "broadcast",
        { event: "annotation_event" },
        ({ payload }) => {
          if (onEvent) {
            onEvent(payload as AnnotationEvent)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [channel, documentId, onEvent, supabase])

  const broadcastEvent = async (event: AnnotationEvent) => {
    if (!channel) return
    await channel.send({
      type: "broadcast",
      event: "annotation_event",
      payload: event,
    })
  }

  const createAnnotation = async (input: TextAnnotationInput) => {
    const payload = {
      id: input.id,
      review_id: reviewId,
      document_id: documentId,
      page: input.page,
      x: input.x,
      y: input.y,
      content: input.content,
      color: input.color,
      classification: input.classification || null,
      priority: input.priority || null,
      type: input.type,
      issue_id: null,
      created_by: input.createdBy,
      created_at: input.createdAt,
    }

    const annotationForBroadcast: RealtimeAnnotation = {
      id: input.id,
      reviewId,
      documentId,
      page: input.page,
      x: input.x,
      y: input.y,
      content: input.content,
      color: input.color,
      classification: input.classification || null,
      priority: input.priority || null,
      type: input.type,
      issueId: null,
      createdBy: input.createdBy,
      createdAt: input.createdAt,
    }

    // Instantly notify peers
    await broadcastEvent({ type: "INSERT", annotation: annotationForBroadcast })

    const { error } = await supabase.from(TABLE_NAME).insert(payload)
    if (error) {
      console.error("Failed to create annotation:", error.message)
    }
  }

  const updateAnnotation = async (id: string, updates: Partial<RealtimeAnnotation>, completeAnnotation?: RealtimeAnnotation) => {
    // If completeAnnotation is provided, instantly broadcast it
    if (completeAnnotation) {
      await broadcastEvent({ type: "UPDATE", annotation: completeAnnotation })
    }

    // Map realtime fields back to DB fields
    const payload: any = {}
    if (updates.content !== undefined) payload.content = updates.content
    if (updates.color !== undefined) payload.color = updates.color
    if (updates.classification !== undefined) payload.classification = updates.classification
    if (updates.priority !== undefined) payload.priority = updates.priority
    if (updates.type !== undefined) payload.type = updates.type
    if (updates.issueId !== undefined) payload.issue_id = updates.issueId

    const { error } = await supabase.from(TABLE_NAME).update(payload).eq("id", id)
    if (error) {
      console.error("Failed to update annotation:", error.message)
    }
  }

  const deleteAnnotation = async (id: string) => {
    // Instantly notify peers
    await broadcastEvent({ type: "DELETE", annotation: { id } })

    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id)
    if (error) {
      console.error("Failed to delete annotation", error)
    }
  }

  return isReady
    ? {
      createAnnotation,
      updateAnnotation,
      deleteAnnotation,
      broadcastEvent,
    }
    : null
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
    // If we receive an update for a non-existing annotation, we can't do much if it's partial, so ignore or log
    return current.map((item) => (item.id === event.annotation.id ? { ...item, ...event.annotation } as RealtimeAnnotation : item))
  }

  if (event.type === "DELETE") {
    return current.filter((item) => item.id !== event.annotation.id)
  }

  return current
}

function mapDbToRealtime(record: DbAnnotation): RealtimeAnnotation {
  return {
    id: record.id,
    reviewId: record.review_id,
    documentId: record.document_id,
    page: record.page,
    x: record.x,
    y: record.y,
    content: record.content,
    color: record.color,
    classification: record.classification,
    priority: record.priority,
    type: record.type,
    issueId: record.issue_id,
    createdBy: record.created_by,
    createdAt: record.created_at,
  }
}

function mapDbToPartialRealtime(record: Partial<DbAnnotation> & { id: string }): Partial<RealtimeAnnotation> & { id: string } {
  const result: Partial<RealtimeAnnotation> & { id: string } = { id: record.id }
  if (record.review_id !== undefined) result.reviewId = record.review_id
  if (record.document_id !== undefined) result.documentId = record.document_id
  if (record.page !== undefined) result.page = record.page
  if (record.x !== undefined) result.x = record.x
  if (record.y !== undefined) result.y = record.y
  if (record.content !== undefined) result.content = record.content
  if (record.color !== undefined) result.color = record.color
  if (record.classification !== undefined) result.classification = record.classification
  if (record.priority !== undefined) result.priority = record.priority
  if (record.type !== undefined) result.type = record.type
  if (record.issue_id !== undefined) result.issueId = record.issue_id
  if (record.created_by !== undefined) result.createdBy = record.created_by
  if (record.created_at !== undefined) result.createdAt = record.created_at
  return result
}



