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
  createdBy: string
  createdAt: string
}

export type AnnotationEvent =
  | {
      type: "INSERT" | "UPDATE"
      annotation: RealtimeAnnotation
    }
  | {
      type: "DELETE"
      annotation: { id: string }
    }

type UseAnnotationsChannelOptions = {
  reviewId: string
  documentId: string
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
  createdBy: string
  createdAt: string
}

export function useAnnotationsChannel({
  reviewId,
  documentId,
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
          onEvent?.({ type: "INSERT", annotation: mapDbToRealtime(payload.new as DbAnnotation) })
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: TABLE_NAME, filter: `document_id=eq.${documentId}` },
        (payload) => {
          onEvent?.({ type: "UPDATE", annotation: mapDbToRealtime(payload.new as DbAnnotation) })
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: TABLE_NAME, filter: `document_id=eq.${documentId}` },
        (payload) => {
          onEvent?.({ type: "DELETE", annotation: { id: (payload.old as DbAnnotation).id } })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [channel, documentId, onEvent, supabase])

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
      created_by: input.createdBy,
      created_at: input.createdAt,
    }

    const { error } = await supabase.from(TABLE_NAME).insert(payload)
    if (error) {
      console.error("Failed to create annotation", error)
    }
  }

  const deleteAnnotation = async (id: string) => {
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id)
    if (error) {
      console.error("Failed to delete annotation", error)
    }
  }

  return isReady
    ? {
        createAnnotation,
        deleteAnnotation,
      }
    : null
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
    createdBy: record.created_by,
    createdAt: record.created_at,
  }
}



