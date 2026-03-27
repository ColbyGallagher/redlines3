"use client"

import React from "react"

interface ClickToScrollProps {
  targetId: string
  children: React.ReactNode
  className?: string
}

export function ClickToScroll({ targetId, children, className }: ClickToScrollProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div onClick={handleClick} className={className} role="button" tabIndex={0}>
      {children}
    </div>
  )
}
