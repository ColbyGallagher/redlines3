const fs = require('fs');
const path = require('path');

const publicLibDir = path.join(process.cwd(), 'public', 'ej2-pdfviewer-lib');

// Ensure directory exists
if (!fs.existsSync(publicLibDir)) {
    fs.mkdirSync(publicLibDir, { recursive: true });
}

// Files to copy from node_modules to public
const assetFiles = [
    { 
        src: path.join('node_modules', '@syncfusion', 'ej2-pdfviewer', 'dist', 'ej2-pdfviewer-lib', 'pdfium.js'), 
        dest: path.join('public', 'ej2-pdfviewer-lib', 'pdfium.js') 
    },
    { 
        src: path.join('node_modules', '@syncfusion', 'ej2-pdfviewer', 'dist', 'ej2-pdfviewer-lib', 'pdfium.wasm'), 
        dest: path.join('public', 'ej2-pdfviewer-lib', 'pdfium.wasm') 
    }
];

assetFiles.forEach(file => {
    const srcPath = path.join(process.cwd(), file.src);
    const destPath = path.join(process.cwd(), file.dest);
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file.src} to ${file.dest}`);
    } else {
        console.warn(`Warning: Could not find ${file.src}. You may need to run npm install first.`);
    }
});

console.log('Syncfusion Asset Copy Complete');
