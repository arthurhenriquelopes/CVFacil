import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'pages');
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

// Fix pattern: background:var(--color-primary);color:white → background:var(--color-gray-900);color:var(--color-gray-50)
// This makes buttons white-on-black in dark theme (visible!)
for (const p of pages) {
    const filePath = path.join(pagesDir, p);
    let html = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Fix primary bg + white text buttons (the invisible button bug)
    if (html.includes('background:var(--color-primary);color:white')) {
        html = html.replace(/background:var\(--color-primary\);color:white/g, 'background:var(--color-gray-900);color:var(--color-gray-50)');
        changed = true;
    }

    // Fix hardcoded blue #2563eb in JS (step-ats-scanner.html btn.style.background = '#2563eb')
    if (html.includes("btn.style.background = '#2563eb'")) {
        html = html.replace("btn.style.background = '#2563eb'", "btn.style.background = 'var(--color-gray-900)'");
        changed = true;
    }
    // And the corresponding color:white for that button
    if (html.includes("btn.style.color = 'white'") && p === 'step-ats-scanner.html') {
        html = html.replace("btn.style.color = 'white'", "btn.style.color = 'var(--color-gray-50)'");
        changed = true;
    }

    // Fix any remaining color:white on primary backgrounds in result page CTA
    // These are template literals so we need to be careful - only fix the non-CV-preview areas
    if (p === 'step-ats-result.html') {
        // Fix the CTA boxes that use background:var(--color-primary) with color:white
        html = html.replace(
            /background:var\(--color-primary\); border-radius:1rem; padding:2rem; margin-top:2rem; text-align:center; color:white/g,
            'background:var(--color-gray-200); border:1px solid var(--color-gray-300); border-radius:0; padding:2rem; margin-top:2rem; text-align:center; color:var(--color-gray-900)'
        );
        html = html.replace(
            /background:var\(--color-success\); border-radius:1rem; padding:2rem; margin-top:2rem; text-align:center; color:white/g,
            'background:var(--color-gray-200); border:1px solid var(--color-success); border-radius:0; padding:2rem; margin-top:2rem; text-align:center; color:var(--color-gray-900)'
        );
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, html);
        console.log('Fixed buttons in:', p);
    }
}

// Also fix the index.html hero CTA if needed
const indexPath = path.join(process.cwd(), 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
if (indexHtml.includes('background:var(--color-primary);color:white')) {
    indexHtml = indexHtml.replace(/background:var\(--color-primary\);color:white/g, 'background:var(--color-gray-900);color:var(--color-gray-50)');
    fs.writeFileSync(indexPath, indexHtml);
    console.log('Fixed buttons in: index.html');
}

console.log('All button color fixes applied!');
