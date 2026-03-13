// For Node.js environment, we use the legacy build and standard import
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"

// Set worker source for browser environment
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

// Note: In Node.js environment, we don't necessarily need the worker-loader if we use the legacy build
// but for standard pdfjs-dist, we might need to set it.

export type ExtractionArea = {
    x: number
    y: number
    width: number
    height: number
}

export type ExtractionSettings = {
    documentCode?: ExtractionArea
    documentName?: ExtractionArea
    revision?: ExtractionArea
}

export type ExtractedMetadata = {
    documentCode: string | null
    documentName: string | null
    revision: string | null
    isManualReview: boolean
}

/**
 * Extracts text from a specific area on the first page of a PDF.
 * Coordinates are expected to be in percentages (0-100) of the page width/height.
 */
export async function getTextFromArea(page: any, area: ExtractionArea, debug: boolean = false): Promise<string> {
    const textContent = await page.getTextContent()
    const viewport = page.getViewport({ scale: 1.0 })
    const { width, height } = viewport

    // Convert percentage coordinates to PDF points
    const xMin = (area.x / 100) * width
    const xMax = ((area.x + area.width) / 100) * width
    
    // UI y=0 is top, PDF y=0 is bottom
    const yMin = (1 - (area.y + area.height) / 100) * height 
    const yMax = (1 - (area.y) / 100) * height

    if (debug) {
        console.log(`[PDF Debug] Scanning box: x:${area.x}%, y:${area.y}%, w:${area.width}%, h:${area.height}%`)
        console.log(`[PDF Debug] Page internal size: ${Math.round(width)}x${Math.round(height)}`)
        console.log(`[PDF Debug] Target PDF points: x:[${Math.round(xMin)}-${Math.round(xMax)}], y:[${Math.round(yMin)}-${Math.round(yMax)}]`)
    }

    const items = textContent.items
        .filter((item: any) => {
            const [x, y] = [item.transform[4], item.transform[5]]
            const isInside = x >= xMin && x <= xMax && y >= yMin && y <= yMax
            
            if (debug && !isInside && x >= xMin - 50 && x <= xMax + 50 && y >= yMin - 50 && y <= yMax + 50) {
                // Log items that are near the box if they are not inside
                console.log(`[PDF Debug] Near miss ("${item.str}") at x:${Math.round(x)}, y:${Math.round(y)}`)
            }
            
            return isInside
        })
        .map((item: any) => item.str)

    const result = items.join(" ").trim()
    if (debug) {
        if (result) {
            console.log(`[PDF Debug] SUCCESS: Found text "${result}"`)
        } else {
            console.warn("[PDF Debug] EMPTY: No text found in this area.")
        }
    }
    
    return result
}

export async function extractMetadataFromPDF(
    pdfUrl: string,
    settings: ExtractionSettings,
    debug: boolean = false,
    pageNumber: number = 1
): Promise<ExtractedMetadata> {
    if (debug) console.log(`[PDF Debug] Loading document: ${pdfUrl}`)
    
    try {
        const loadingTask = pdfjs.getDocument(pdfUrl)
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(pageNumber)
        
        if (debug) console.log(`[PDF Debug] Page ${pageNumber} loaded. Total pages: ${pdf.numPages}`)
        
        const metadata = await extractMetadataFromPage(page, settings, debug)
        return metadata
    } catch (error) {
        console.error("[PDF Debug] Extraction Failed:", error)
        return {
            documentCode: null,
            documentName: null,
            revision: null,
            isManualReview: true,
        }
    }
}

/**
 * Enhanced extraction from a single page object (already loaded)
 */
export async function extractMetadataFromPage(
    page: any,
    settings: ExtractionSettings,
    debug: boolean = false
): Promise<ExtractedMetadata> {
    const textContent = await page.getTextContent()

    if (debug) {
        console.log(`[PDF Debug] Processing page ${page.pageNumber}. Items found: ${textContent.items.length}`)
        if (textContent.items.length === 0) {
            console.error(`[PDF Debug] ERROR: No text items on page ${page.pageNumber}. PDF might be scanned/image-only.`)
        }
    }

    let documentCodeValue = null
    let documentNameValue = null
    let revisionValue = null

    if (settings.documentCode) {
        if (debug) console.log(`[PDF Debug] --- Extracting CODE ---`)
        documentCodeValue = await getTextFromArea(page, settings.documentCode, debug)
    }

    if (settings.documentName) {
        if (debug) console.log(`[PDF Debug] --- Extracting TITLE ---`)
        documentNameValue = await getTextFromArea(page, settings.documentName, debug)
    }

    if (settings.revision) {
        if (debug) console.log(`[PDF Debug] --- Extracting REVISION ---`)
        revisionValue = await getTextFromArea(page, settings.revision, debug)
    }

    // Validation for Document Code
    const codeRegex = /[A-Z0-9-]{5,}/
    const isValidCode = documentCodeValue ? codeRegex.test(documentCodeValue) : false

    if (debug && documentCodeValue && !isValidCode) {
        console.warn(`[PDF Debug] WARNING: Code "${documentCodeValue}" failed validation (regex: /[A-Z0-9-]{5,}/)`)
    }

    const finalResult = {
        documentCode: documentCodeValue || null,
        documentName: documentNameValue || null,
        revision: revisionValue || null,
        isManualReview: !isValidCode,
    }

    if (debug) {
        console.log("[PDF Debug] Final Extracted Metadata:", finalResult)
    }

    return finalResult
}

/**
 * Extracts metadata from all pages of a PDF document.
 * Returns an array of metadata objects, one for each page.
 */
export async function extractAllPagesMetadata(
    pdfUrl: string,
    settings: ExtractionSettings,
    debug: boolean = false
): Promise<ExtractedMetadata[]> {
    if (debug) console.log("[PDF Debug] Starting multi-page extraction for:", pdfUrl)
    
    try {
        const loadingTask = pdfjs.getDocument(pdfUrl)
        const pdf = await loadingTask.promise
        const numPages = pdf.numPages
        
        if (debug) console.log(`[PDF Debug] Document has ${numPages} pages.`)
        
        const results: ExtractedMetadata[] = []
        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i)
            const metadata = await extractMetadataFromPage(page, settings, debug)
            results.push(metadata)
        }
        
        return results
    } catch (error) {
        console.error("Multi-page PDF Extraction Error:", error)
        return []
    }
}
