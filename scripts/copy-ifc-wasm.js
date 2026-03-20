const fs = require('fs');
const path = require('path');

const publicWasmDir = path.join(process.cwd(), 'public', 'wasm');

// Ensure directory exists
if (!fs.existsSync(publicWasmDir)) {
    fs.mkdirSync(publicWasmDir, { recursive: true });
}

// Files to copy from node_modules to public
const wasmFiles = [
    { 
        src: path.join('node_modules', 'web-ifc', 'web-ifc.wasm'), 
        dest: path.join('public', 'wasm', 'web-ifc.wasm') 
    },
    { 
        src: path.join('node_modules', 'web-ifc', 'web-ifc-mt.wasm'), 
        dest: path.join('public', 'wasm', 'web-ifc-mt.wasm') 
    },
    {
        src: path.join('node_modules', '@thatopen', 'fragments', 'dist', 'Worker', 'worker.mjs'),
        dest: path.join('public', 'wasm', 'worker.mjs')
    }
];

wasmFiles.forEach(file => {
    const srcPath = path.join(process.cwd(), file.src);
    const destPath = path.join(process.cwd(), file.dest);
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file.src} to ${file.dest}`);
    } else {
        console.warn(`Warning: Could not find ${file.src}. You may need to run npm install first.`);
    }
});

console.log('WASM Copy Complete');
