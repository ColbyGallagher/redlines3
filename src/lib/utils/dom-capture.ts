import html2canvas from "html2canvas-pro"

export async function captureAnnotationSnapshot(
    containerRef: HTMLElement,
    boundingBox: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
    try {
        // 1. Capture the full container with html2canvas-pro
        // This fork natively supports oklch() and modern CSS colors
        const fullCanvas = await html2canvas(containerRef, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            scale: window.devicePixelRatio || 1,
        })

        // 2. Define crop parameters (add 50px padding on each side)
        const PADDING = 50
        // Determine scaled coordinates (html2canvas returns scaled up by devicePixelRatio)
        const scale = fullCanvas.width / containerRef.clientWidth
        
        const cropX = Math.max(0, (boundingBox.x - PADDING) * scale)
        const cropY = Math.max(0, (boundingBox.y - PADDING) * scale)
        const cropWidth = Math.min(fullCanvas.width - cropX, (boundingBox.width + PADDING * 2) * scale)
        const cropHeight = Math.min(fullCanvas.height - cropY, (boundingBox.height + PADDING * 2) * scale)

        if (cropWidth <= 0 || cropHeight <= 0) return null

        // 3. Create a temporary canvas for the cropped image
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = cropWidth
        tempCanvas.height = cropHeight
        const ctx = tempCanvas.getContext("2d")

        if (!ctx) return null

        // 4. Draw the cropped region onto the temp canvas
        ctx.fillStyle = "#ffffff" // Fill background just in case
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        
        ctx.drawImage(
            fullCanvas,
            cropX, cropY, cropWidth, cropHeight, // Source rectangle
            0, 0, cropWidth, cropHeight // Destination rectangle
        )

        // 5. Convert to Blob
        return new Promise((resolve) => {
            tempCanvas.toBlob(
                (blob) => resolve(blob),
                "image/jpeg",
                0.8
            )
        })
    } catch (error) {
        console.error("Failed to capture annotation snapshot:", error)
        return null
    }
}
