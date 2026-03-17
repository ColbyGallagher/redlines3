"use client"

import { registerLicense } from "@syncfusion/ej2-base"
import { useEffect } from "react"

export function SyncfusionLicense() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY
    if (key) {
      registerLicense(key)
    }
  }, [])

  return null
}
