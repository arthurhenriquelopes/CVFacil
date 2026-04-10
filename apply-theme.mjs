import fs from 'fs';
import path from 'path';

// Define the directories and files to process
const searchDir = process.cwd();
const pagesDir = path.join(searchDir, 'pages');

// Files to process manually inside src
const styleCssPath = path.join(searchDir, 'src', 'style.css');
const layoutJsPath = path.join(searchDir, 'src', 'lib', 'layout.js');
const indexHtmlPath = path.join(searchDir, 'index.html');

console.log('Processing style.css...');
let cssContent = fs.readFileSync(styleCssPath, 'utf8');

// Replace Root CSS variables for dark mode
cssContent = cssContent.replace(/:root {[\s\S]*?--max-width: 64rem;\n}/, `:root {
  --color-primary: #3b82f6;
  --color-primary-light: #1e3a8a;
  --color-primary-dark: #60a5fa;
  --color-success: #22c55e;
  --color-success-light: #064e3b;
  --color-warning: #facc15;
  --color-error: #ef4444;
  --color-gray-50: #0a0a0a;
  --color-gray-100: #121212;
  --color-gray-200: #262626;
  --color-gray-300: #404040;
  --color-gray-400: #737373;
  --color-gray-500: #a3a3a3;
  --color-gray-600: #d4d4d4;
  --color-gray-700: #e5e7eb;
  --color-gray-800: #f3f4f6;
  --color-gray-900: #ffffff;
  --radius-sm: 0.75rem;
  --radius-md: 1rem;
  --radius-lg: 1.5rem;
  --radius-xl: 2rem;
  --shadow-card: 0 4px 20px -2px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.05);
  --shadow-lg: 0 10px 30px -5px rgba(0, 0, 0, 0.9);
  --max-width: 64rem;
}`);

// Inject Space Grotesk
cssContent = cssContent.replace(
  "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');",
  "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');"
);

// Add heading styles for Space Grotesk
if (!cssContent.includes('Space Grotesk')) {
  cssContent = cssContent.replace(
    '-moz-osx-font-smoothing: grayscale;\n}',
    "-moz-osx-font-smoothing: grayscale;\n}\n\nh1, h2, h3, h4, h5, h6, .title {\n  font-family: 'Space Grotesk', system-ui, sans-serif;\n  letter-spacing: -0.03em;\n}"
  );
}

// Replace background: white with background: var(--color-gray-100)
cssContent = cssContent.replace(/background:\s*white;?/g, 'background: var(--color-gray-100);');

// Replace specific background: white declarations without semicolon
cssContent = cssContent.replace(/background:\s*white\n/g, 'background: var(--color-gray-100);\n');

fs.writeFileSync(styleCssPath, cssContent);
console.log('style.css updated.');

console.log('Processing layout.js...');
let layoutContent = fs.readFileSync(layoutJsPath, 'utf8');
layoutContent = layoutContent.replace(/background:\s*rgba\(255,255,255,0\.85\)/g, 'background: rgba(18,18,18,0.85);');
layoutContent = layoutContent.replace(/background:\s*white;?/g, 'background: var(--color-gray-100);');
fs.writeFileSync(layoutJsPath, layoutContent);
console.log('layout.js updated.');

// Replace inline backgrounds in all HTML pages
function processHtmlFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  // Removing background:white and background:var(--color-gray-50) from elements that shouldn't be hardcoded
  html = html.replace(/background:\s*white;?/g, '');
  html = html.replace(/background:\s*var\(--color-gray-50\);?/g, '');
  // Specifically the body tag which has style="background:white;" or similar
  html = html.replace(/<body[^>]*>/, (match) => {
    return match.replace(/style="[^"]*"/, (styleMatch) => {
      let newStyle = styleMatch.replace(/background:\s*(white|var\(--color-gray-50\));?/, '');
      if (newStyle === 'style=""') return '';
      return newStyle;
    });
  });
  
  // also fix some hardcoded borders that use gray-100 assuming white background
  // we leave them because CSS variables map them correctly now. Wait, index.html has a gradient span that needs check
  // ensure we save
  fs.writeFileSync(filePath, html);
  console.log('Updated HTML:', filePath);
}

// Process index.html
processHtmlFile(indexHtmlPath);

// Process pages/*.html
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
for (const page of pages) {
  processHtmlFile(path.join(pagesDir, page));
}

console.log('Done!');
