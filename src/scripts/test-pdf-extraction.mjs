import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";

/**
 * Simple script to test PDF extraction logic in Node.js
 * Usage: node src/scripts/test-pdf-extraction.mjs <pdf-path> <json-setups-path>
 */

const pdfPath = process.argv[2];
const settingsPath = process.argv[3];

if (!pdfPath) {
    console.error("Error: Please provide a path to a PDF file.");
    process.exit(1);
}

async function runTest() {
    try {
        console.log(`\n--- PDF Extraction Test ---\n`);
        console.log(`Loading PDF: ${pdfPath}`);

        const data = new Uint8Array(fs.readFileSync(pdfPath));
        const loadingTask = pdfjs.getDocument({ data });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const textContent = await page.getTextContent();

        console.log(`Successfully loaded. Total pages: ${pdf.numPages}`);
        console.log(`Text items found on page 1: ${textContent.items.length}`);

        if (textContent.items.length === 0) {
            console.warn("WARNING: No text items found. This might be a scanned image.");
        }

        // if settings provide a specific area, we can test it here
        // For now, let's just log a few items
        console.log("\nTop 10 text items Sample:");
        textContent.items.slice(0, 10).forEach((item, i) => {
            console.log(`[${i}] "${item.str}" at x:${Math.round(item.transform[4])}, y:${Math.round(item.transform[5])}`);
        });

        console.log(`\n--- End of Test ---\n`);
    } catch (error) {
        console.error("Test execution failed:", error);
    }
}

runTest();
