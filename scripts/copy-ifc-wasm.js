const fs = require('fs');
const path = require('path');

const publicWasmDir = path.join(process.cwd(), 'public', 'wasm');
const publicAssetsDir = path.join(process.cwd(), 'public', 'assets');

// Ensure directories exist
if (!fs.existsSync(publicWasmDir)) fs.mkdirSync(publicWasmDir, { recursive: true });
if (!fs.existsSync(publicAssetsDir)) fs.mkdirSync(publicAssetsDir, { recursive: true });

// Files to copy
const wasmFiles = [
  { src: 'node_modules/@ifc-lite/wasm/pkg/ifc-lite_bg.wasm', dest: 'public/wasm/ifc-lite_bg.wasm' },
  { src: 'node_modules/@ifc-lite/wasm/pkg/ifc-lite.js', dest: 'public/wasm/ifc-lite.js' },
  { src: 'node_modules/parquet-wasm/esm/arrow2_bg.wasm', dest: 'public/wasm/arrow2_bg.wasm' },
  { src: 'node_modules/esbuild-wasm/esbuild.wasm', dest: 'public/wasm/esbuild.wasm' },
];

const assetFiles = [
  { src: 'node_modules/@ifc-lite/viewer/dist/assets/ifc-lite_bg-Bsh9D66i.wasm', dest: 'public/assets/ifc-lite_bg-Bsh9D66i.wasm' },
  { src: 'node_modules/@ifc-lite/viewer/dist/assets/ifc-lite-BeYd5LzZ.js', dest: 'public/assets/ifc-lite-BeYd5LzZ.js' }
];

// Copy WASM files
wasmFiles.forEach(file => {
  const srcPath = path.join(process.cwd(), file.src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(process.cwd(), file.dest));
    console.log(`Copied ${file.src} to ${file.dest}`);
  } else {
    console.warn(`Warning: ${file.src} not found`);
  }
});

// Copy asset files
assetFiles.forEach(file => {
  const srcPath = path.join(process.cwd(), file.src);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(process.cwd(), file.dest));
    console.log(`Copied ${file.src} to ${file.dest}`);
  } else {
    // Try to find by pattern if exact name changed
    if (file.src.includes('ifc-lite')) {
        const dir = path.dirname(srcPath);
        if (fs.existsSync(dir)) {
            const basename = path.basename(file.src).split('-')[0];
            const files = fs.readdirSync(dir);
            const found = files.find(f => f.startsWith(basename) && (f.endsWith('.wasm') || f.endsWith('.js')));
            if (found) {
                fs.copyFileSync(path.join(dir, found), path.join(process.cwd(), file.dest));
                console.log(`Copied ${found} to ${file.dest}`);
                return;
            }
        }
    }
    console.warn(`Warning: ${file.src} not found`);
  }
});

/**
 * Recursively find and fix imports in @ifc-lite packages
 */
function fixPackageImports(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixPackageImports(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // 1. Remove .js extensions from internal imports
      // Matches: import ... from './foo.js' or import('./foo.js') or export ... from './foo.js'
      const jsImportRegex = /((?:import|export)[\s\S]*?from\s+['"]|import\(['"])((\.\/|\.\.\/)[^'"]+)\.js(['"])/g;
      if (jsImportRegex.test(content)) {
        content = content.replace(jsImportRegex, '$1$2$4');
        changed = true;
      }

      // 2. Fix @/ aliases by converting them to relative paths
      // This is crucial for Turbopack which incorrectly resolves @/ against the project root
      if (content.includes('@/')) {
        const parts = fullPath.split(path.sep);
        const srcIndex = parts.indexOf('src');
        if (srcIndex !== -1) {
          // Find root of the package (where 'src' is)
          const packageSrcPath = parts.slice(0, srcIndex + 1).join(path.sep);
          const relativeToSrc = path.relative(path.dirname(fullPath), packageSrcPath);
          
          const aliasRegex = /((?:import|export)[\s\S]*?from\s+['"]|import\(['"])@\/(.*?)(['"])/g;
          content = content.replace(aliasRegex, (match, p1, p2, p3) => {
            let rel = path.join(relativeToSrc, p2).replace(/\\/g, '/');
            if (!rel.startsWith('.')) rel = './' + rel;
            return `${p1}${rel}${p3}`;
          });
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed imports in ${path.relative(process.cwd(), fullPath)}`);
      }
    }
  }
}

// Fix all @ifc-lite packages
const ifcLiteDir = path.join(process.cwd(), 'node_modules', '@ifc-lite');
if (fs.existsSync(ifcLiteDir)) {
  const packages = fs.readdirSync(ifcLiteDir);
  packages.forEach(pkg => {
    console.log(`Processing @ifc-lite/${pkg}...`);
    fixPackageImports(path.join(ifcLiteDir, pkg));
  });
}

/**
 * Patch @ifc-lite/viewer/src/lib/scripts/templates.ts to inline ?raw templates
 * Next.js/Turbopack does not have a raw loader by default.
 */
const templatesTsPath = path.join(process.cwd(), 'node_modules', '@ifc-lite', 'viewer', 'src', 'lib', 'scripts', 'templates.ts');
if (fs.existsSync(templatesTsPath)) {
  let content = fs.readFileSync(templatesTsPath, 'utf8');
  const templateImportRegex = /import\s+(\w+)\s+from\s+'(\.\/templates\/[^']+)\?raw';/g;
  
  let changed = false;
  content = content.replace(templateImportRegex, (match, variableName, relativePath) => {
    const templatePath = path.resolve(path.dirname(templatesTsPath), relativePath);
    if (fs.existsSync(templatePath)) {
      console.log(`Inlining template ${variableName} from ${relativePath}...`);
      const templateContent = fs.readFileSync(templatePath, 'utf8')
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');
      changed = true;
      return `const ${variableName} = \`${templateContent}\`;`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(templatesTsPath, content);
    console.log('Successfully inlined script templates in @ifc-lite/viewer');
  }
}

/**
 * Patch @ifc-lite/viewer source files to tolerate missing import.meta.env in Next.js/Turbopack
 */
const viewerEnvPatches = [
  {
    path: path.join(process.cwd(), 'node_modules', '@ifc-lite', 'viewer', 'src', 'utils', 'ifcConfig.ts'),
    apply(content) {
      let next = content;
      if (!next.includes('const viewerEnv =')) {
        next = next.replace(
          "import type { DynamicBatchConfig } from '@ifc-lite/geometry';",
          "import type { DynamicBatchConfig } from '@ifc-lite/geometry';\n\nconst viewerEnv = (typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string | undefined> }).env : undefined) ?? {};"
        );
      }
      next = next.replace("export const SERVER_URL = import.meta.env.VITE_IFC_SERVER_URL || import.meta.env.VITE_SERVER_URL || '';", "export const SERVER_URL = viewerEnv.VITE_IFC_SERVER_URL || viewerEnv.VITE_SERVER_URL || '';");
      next = next.replace("export const USE_SERVER = SERVER_URL !== '' && import.meta.env.VITE_USE_SERVER === 'true';", "export const USE_SERVER = SERVER_URL !== '' && viewerEnv.VITE_USE_SERVER === 'true';");
      return next;
    },
  },
  {
    path: path.join(process.cwd(), 'node_modules', '@ifc-lite', 'viewer', 'src', 'components', 'viewer', 'ChatPanel.tsx'),
    apply(content) {
      let next = content;
      if (!next.includes('const viewerEnv =')) {
        next = next.replace(
          "import { useSandbox } from '../../hooks/useSandbox';",
          "import { useSandbox } from '../../hooks/useSandbox';\n\nconst viewerEnv = (typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string | undefined | boolean> }).env : undefined) ?? {};"
        );
      }
      next = next.replace("const PROXY_URL = import.meta.env.VITE_LLM_PROXY_URL as string || '/api/chat';", "const PROXY_URL = (viewerEnv.VITE_LLM_PROXY_URL as string | undefined) || '/api/chat';");
      next = next.replace("import.meta.env.DEV", "viewerEnv.DEV");
      return next;
    },
  },
  {
    path: path.join(process.cwd(), 'node_modules', '@ifc-lite', 'viewer', 'src', 'lib', 'llm', 'clerk-auth.ts'),
    apply(content) {
      return content.replace(
        "  return Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);",
        "  const viewerEnv = (typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string | undefined> }).env : undefined) ?? {};\n  return Boolean(viewerEnv.VITE_CLERK_PUBLISHABLE_KEY);"
      );
    },
  },
  {
    path: path.join(process.cwd(), 'node_modules', '@ifc-lite', 'viewer', 'src', 'components', 'viewer', 'StatusBar.tsx'),
    apply(content) {
      let next = content;
      if (!next.includes('const VIEWER_APP_VERSION =')) {
        next = next.replace(
          "import { useWebGPU } from '../../hooks/useWebGPU';",
          "import { useWebGPU } from '../../hooks/useWebGPU';\n\nconst VIEWER_APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';"
        );
      }
      next = next.replace("v{__APP_VERSION__}", "v{VIEWER_APP_VERSION}");
      return next;
    },
  },
  {
    path: path.join(process.cwd(), 'node_modules', '@ifc-lite', 'viewer', 'src', 'components', 'viewer', 'KeyboardShortcutsDialog.tsx'),
    apply(content) {
      let next = content;
      if (!next.includes('const VIEWER_APP_VERSION =')) {
        next = next.replace(
          "const GITHUB_URL = 'https://github.com/louistrue/ifc-lite';",
          "const GITHUB_URL = 'https://github.com/louistrue/ifc-lite';\nconst VIEWER_APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';\nconst VIEWER_BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '';\nconst VIEWER_RELEASE_HISTORY = typeof __RELEASE_HISTORY__ !== 'undefined' ? __RELEASE_HISTORY__ : [];\nconst VIEWER_PACKAGE_VERSIONS = typeof __PACKAGE_VERSIONS__ !== 'undefined' ? __PACKAGE_VERSIONS__ : [];"
        );
      }
      next = next.replace("const packageVersions = __PACKAGE_VERSIONS__;", "const packageVersions = VIEWER_PACKAGE_VERSIONS;");
      next = next.replace("v{__APP_VERSION__} &middot; {formatBuildDate(__BUILD_DATE__)}", "v{VIEWER_APP_VERSION} &middot; {formatBuildDate(VIEWER_BUILD_DATE)}");
      next = next.replace("entries: Array<{ pkg: string; highlights: typeof __RELEASE_HISTORY__[0]['releases'][0]['highlights'] }>;", "entries: Array<{ pkg: string; highlights: Array<{ type: 'feature' | 'fix' | 'perf'; text: string }> }>;");
      next = next.replace("  packageChangelogs: typeof __RELEASE_HISTORY__,", "  packageChangelogs: Array<{ name: string; releases: Array<{ version: string; highlights: Array<{ type: 'feature' | 'fix' | 'perf'; text: string }> }> }>,");
      next = next.replace("  type Highlights = typeof __RELEASE_HISTORY__[0]['releases'][0]['highlights'];", "  type Highlights = Array<{ type: 'feature' | 'fix' | 'perf'; text: string }>;");
      next = next.replace("  const packageChangelogs = __RELEASE_HISTORY__;", "  const packageChangelogs = VIEWER_RELEASE_HISTORY;");
      next = next.replace("  const viewerVersion = __APP_VERSION__;", "  const viewerVersion = VIEWER_APP_VERSION;");
      return next;
    },
  },
];

for (const patch of viewerEnvPatches) {
  if (!fs.existsSync(patch.path)) continue;
  const original = fs.readFileSync(patch.path, 'utf8');
  const updated = patch.apply(original);
  if (updated !== original) {
    fs.writeFileSync(patch.path, updated);
    console.log(`Patched ${path.relative(process.cwd(), patch.path)} for Next.js env compatibility`);
  }
}

/**
 * Patch @ifc-lite/sandbox/dist/transpile.js to use static esbuild WASM URL
 */
const sandboxTranspilePath = path.join(process.cwd(), 'node_modules', '@ifc-lite', 'sandbox', 'dist', 'transpile.js');
if (fs.existsSync(sandboxTranspilePath)) {
  let content = fs.readFileSync(sandboxTranspilePath, 'utf8');
  let changed = false;

  // Replace any direct Vite-style esbuild wasm import with a static public URL.
  const esbuildWasmImport = "const wasmMod = await import('esbuild-wasm/esbuild.wasm?url');";
  if (content.includes(esbuildWasmImport)) {
    content = content.replace(esbuildWasmImport, "wasmURL = '/wasm/' + 'esbuild.' + 'wasm';");
    content = content.replace(/\s*wasmURL = wasmMod\.default;\s*/g, '\n');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(sandboxTranspilePath, content);
    console.log('Patched @ifc-lite/sandbox/dist/transpile.js for Next.js compatibility');
  }
}

/**
 * Patch @ifc-lite/server-client to avoid .wasm?url imports which fail in Turbopack
 */
const parquetDecoderPath = path.join(process.cwd(), 'node_modules', '@ifc-lite', 'server-client', 'dist', 'parquet-decoder.js');
if (fs.existsSync(parquetDecoderPath)) {
  let content = fs.readFileSync(parquetDecoderPath, 'utf8');
  let changed = false;

  // Replace dynamic import of wasm with static url
  const wasmUrlRegex = /const wasmModule = await import\(['"]parquet-wasm\/esm\/arrow2_bg\.wasm\?url['"]\);/g;
  if (wasmUrlRegex.test(content)) {
    content = content.replace(wasmUrlRegex, "const wasmModule = { default: '/wasm/' + 'arrow2_bg.' + 'wasm' };");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(parquetDecoderPath, content);
    console.log('Patched @ifc-lite/server-client/parquet-decoder.js for Next.js compatibility');
  }
}

/**
 * Patch parquet-wasm to avoid Turbopack trying to load .wasm as a module
 */
const arrow2Path = path.join(process.cwd(), 'node_modules', 'parquet-wasm', 'esm', 'arrow2.js');
if (fs.existsSync(arrow2Path)) {
  let content = fs.readFileSync(arrow2Path, 'utf8');
  let changed = false;

  // Prevent Turbopack from picking up this URL and trying to process it as a module
  // By splitting the extension, we hide it from static analysis
  const wasmUrlInitRegex = /input = new URL\(['"]arrow2_bg\.wasm['"], import\.meta\.url\);/g;
  if (wasmUrlInitRegex.test(content)) {
    content = content.replace(wasmUrlInitRegex, "input = '/wasm/' + 'arrow2_bg.' + 'wasm';");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(arrow2Path, content);
    console.log('Patched parquet-wasm/esm/arrow2.js for Next.js compatibility');
  }
}

console.log('IFC WASM and Asset Setup Complete');
