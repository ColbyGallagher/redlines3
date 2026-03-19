"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const IFCModelViewer = dynamic(
  () => import("./ifc-model-viewer").then((mod) => mod.IFCModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Loading IFC viewer...</span>
        </div>
      </div>
    ),
  }
)

export function IFCModelViewerClient(props: React.ComponentProps<typeof IFCModelViewer>) {
  return <IFCModelViewer {...props} />
}
