import fs from 'fs';
import path from 'path';

const searchDir = process.cwd();
const styleCssPath = path.join(searchDir, 'src', 'style.css');
const layoutJsPath = path.join(searchDir, 'src', 'lib', 'layout.js');
const pagesDir = path.join(searchDir, 'pages');

const styleCSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
@import url('https://cdn.jsdelivr.net/npm/primeicons@6.0.1/primeicons.css');

:root {
  --color-primary: #ffffff;
  --color-primary-light: #222222;
  --color-primary-dark: #cccccc;
  --color-success: #22c55e;
  --color-success-light: #052e16;
  --color-warning: #facc15;
  --color-error: #ef4444;
  --color-gray-50: #000000;
  --color-gray-100: #0a0a0a;
  --color-gray-200: #1a1a1a;
  --color-gray-300: #333333;
  --color-gray-400: #666666;
  --color-gray-500: #888888;
  --color-gray-600: #aaaaaa;
  --color-gray-700: #cccccc;
  --color-gray-800: #eeeeee;
  --color-gray-900: #ffffff;
  
  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
  --radius-xl: 0px;
  
  --shadow-card: none;
  --shadow-lg: none;
  --max-width: 64rem;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Space Grotesk', monospace, sans-serif;
  color: var(--color-gray-900);
  background: var(--color-gray-50);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
}

a { text-decoration: none; color: inherit; }
button, input, textarea, select { font-family: inherit; }

.page-container { min-height: 100vh; display: flex; flex-direction: column; }
.page-content { flex: 1; width: 100%; max-width: var(--max-width); margin: 0 auto; padding: 2rem 1rem; }
.step-content { padding-top: 5.5rem; padding-bottom: 7rem; }

/* ============ STEP HEADER ============ */
.step-header {
  position: fixed; top: 0; left: 0; right: 0;
  background: var(--color-gray-50);
  z-index: 50;
  border-bottom: 1px solid var(--color-gray-200);
}

.step-header-inner {
  max-width: var(--max-width); margin: 0 auto; height: 4rem; padding: 0 1rem;
  display: flex; align-items: center; justify-content: space-between;
}

.step-header .back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 2.5rem; height: 2.5rem; border: none; background: transparent; color: var(--color-gray-900);
}

.step-header .back-btn:hover { color: var(--color-gray-500); }
.step-header .title { font-weight: 700; color: var(--color-gray-900); font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; }
.step-header .step-counter { font-size: 0.75rem; font-weight: 700; color: var(--color-gray-600); font-family: monospace; }

.progress-bar { width: 100%; height: 1px; background: var(--color-gray-200); }
.progress-bar-fill { height: 100%; background: var(--color-primary); transition: width 0.6s ease; }

/* ============ STEP FOOTER ============ */
.step-footer {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; padding: 1rem;
  background: var(--color-gray-50); border-top: 1px solid var(--color-gray-200);
}

.btn-continue {
  display: flex; align-items: center; justify-content: center;
  width: 100%; max-width: var(--max-width); margin: 0 auto; height: 3.5rem;
  background: var(--color-gray-900); color: var(--color-gray-50);
  font-weight: 700; font-size: 1rem; border: none; text-transform: uppercase; letter-spacing: 0.15em;
  transition: opacity 0.2s; border-radius: 0;
}
.btn-continue:hover { opacity: 0.8; }
.btn-continue:disabled { opacity: 0.2; cursor: not-allowed; }

/* ============ CARDS ============ */
.card {
  background: transparent;
  border: 1px solid var(--color-gray-300);
  padding: 1.5rem;
  transition: border-color 0.2s, background 0.2s;
  border-radius: 0;
}

.card:hover { border-color: var(--color-gray-500); background: var(--color-gray-100); }
.card.selected {
  border: 1px solid var(--color-primary);
  background: var(--color-primary-light);
}

/* ============ FORM ============ */
.form-label { display: block; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: var(--color-gray-600); margin-bottom: 0.5rem; }
.form-input {
  width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--color-gray-300); background: transparent;
  color: var(--color-gray-900); font-size: 0.9375rem; border-radius: 0; outline: none; transition: border-color 0.2s;
}
.form-input:focus { border-color: var(--color-primary); }
.form-input::placeholder { color: var(--color-gray-500); }
textarea.form-input { resize: vertical; min-height: 8rem; }

/* ============ BADGE ============ */
.badge {
  display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; font-size: 0.7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em;
  border: 1px solid var(--color-gray-400); background: transparent; color: var(--color-gray-600); border-radius: 0;
}
.badge-success { border-color: var(--color-success); color: var(--color-success); }

/* ============ UTILITIES ============ */
.text-center { text-align: center; }
.text-primary { color: var(--color-primary); }
.text-muted { color: var(--color-gray-500); }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }
.text-4xl { font-size: 2.25rem; }
.font-bold { font-weight: 700; }
.font-black { font-weight: 700; } /* no 900 for grok look */
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-8 { margin-bottom: 2rem; }
.mt-4 { margin-top: 1rem; }
.gap-2 { gap: 0.5rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.space-y-4 > * + * { margin-top: 1rem; }
.space-y-6 > * + * { margin-top: 1.5rem; }
.space-y-8 > * + * { margin-top: 2rem; }
.grid { display: grid; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1; }
.w-full { width: 100%; }
.max-w-md { max-width: 28rem; }
.max-w-2xl { max-width: 42rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.rounded-full { border-radius: 0; }
.rounded-xl { border-radius: 0; }
.shrink-0 { flex-shrink: 0; }
.hidden { display: none; }
@media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } .md-hide { display: none; } }

/* Fixes for inline SVGs inside icons or bubbles that use heavy background colors */
svg { stroke-width: 1.5 !important; }
`;

fs.writeFileSync(styleCssPath, styleCSS.trim());
console.log('style.css completely rewritten for Grok aesthetic.');

// Replace layout.js content with minimal styling
let layoutContent = fs.readFileSync(layoutJsPath, 'utf8');
layoutContent = layoutContent.replace(/background:\s*rgba\(255,255,255,0\.85\)/g, 'background: var(--color-gray-50); border-bottom: 1px solid var(--color-gray-200);');
layoutContent = layoutContent.replace(/box-shadow:[^;]+;/g, '');
layoutContent = layoutContent.replace(/border-radius:[^;]+;/g, '');
layoutContent = layoutContent.replace(/font-weight:900/g, 'font-weight:700; text-transform:uppercase; letter-spacing:0.1em;');
// Change 'Criar CV' button styles
layoutContent = layoutContent.replace(/background:var\(--color-primary\);color:white;/g, 'background:var(--color-gray-900);color:var(--color-gray-50);border:1px solid var(--color-gray-900); border-radius:0;');
layoutContent = layoutContent.replace(/color:var\(--color-primary\)/g, 'color:var(--color-gray-900)');
fs.writeFileSync(layoutJsPath, layoutContent);
console.log('layout.js updated.');

// Clean up HTML files
function processHtml(filePath) {
    let html = fs.readFileSync(filePath, 'utf8');

    // Remove strong typography weights in inline styles
    html = html.replace(/font-weight:900;/g, 'font-weight:700;');
    html = html.replace(/font-weight:\s*800;/g, 'font-weight:700;');

    // Remove explicit colors from gradients and text-fill
    html = html.replace(/background:linear-gradient[^;]+;/g, '');
    html = html.replace(/-webkit-background-clip:text;/g, '');
    html = html.replace(/-webkit-text-fill-color:transparent;/g, '');
    
    // Convert box shadows
    html = html.replace(/box-shadow:var\(--shadow[^"]*/g, 'border:1px solid var(--color-gray-300)');
    
    // Transform "pill" elements (border-radius: 999px) -> border-radius: 0
    html = html.replace(/border-radius:999px/g, 'border-radius:0');
    // Transform primary backgrounds to outlines
    html = html.replace(/background:var\(--color-primary-light\);color:var\(--color-primary\)/g, 'border:1px solid var(--color-gray-400);color:var(--color-gray-900);background:transparent');

    fs.writeFileSync(filePath, html);
    console.log('Processed HTML: ' + filePath);
}

processHtml(path.join(searchDir, 'index.html'));
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
for (const p of pages) {
    if(p !== 'result.html') {
        processHtml(path.join(pagesDir, p));
    }
}
// For result, handle it carefully
let resultHtml = fs.readFileSync(path.join(pagesDir, 'result.html'), 'utf8');
resultHtml = resultHtml.replace(/font-weight:900;/g, 'font-weight:700;');
resultHtml = resultHtml.replace(/background:var\(--color-primary\);color:white;/g, 'border:1px solid var(--color-gray-300);background:transparent;color:var(--color-gray-900);');
fs.writeFileSync(path.join(pagesDir, 'result.html'), resultHtml);

console.log('Done refactoring code base!');
