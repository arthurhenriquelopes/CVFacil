import fs from 'fs';
import path from 'path';

const searchDir = process.cwd();
const filePath = path.join(searchDir, 'pages', 'result.html');

console.log('Reading result.html...');
let html = fs.readFileSync(filePath, 'utf8');

// The file might be corrupted.
// If it's corrupted, let's just restore it from git
import { execSync } from 'child_process';
try {
  execSync('git checkout -- pages/result.html');
  console.log('Restored pages/result.html from git');
  html = fs.readFileSync(filePath, 'utf8');
} catch (e) {
  console.error('Failed to git checkout', e);
}

// Now apply our theme changes safely 
html = html.replace(/background:\s*white;?/g, '');
html = html.replace(/background:\s*var\(--color-gray-50\);?/g, '');
html = html.replace(/<body[^>]*>/, (match) => {
  return match.replace(/style="[^"]*"/, (styleMatch) => {
    let newStyle = styleMatch.replace(/background:\s*(white|var\(--color-gray-50\));?/, '');
    if (newStyle === 'style=""') return '';
    return newStyle;
  });
});

// Protect the CV Preview area to stay light for the PDF
html = html.replace(
  '<div id="cv-preview"\r\n            style="box-shadow:var(--shadow-lg),0 0 0 1px var(--color-gray-100);border-radius:var(--radius-xl);padding:2rem;min-height:50rem;position:relative;overflow:hidden;">',
  '<div id="cv-preview"\n            style="background:white;color:black;box-shadow:var(--shadow-lg),0 0 0 1px rgba(255,255,255,0.1);border-radius:var(--radius-xl);padding:2rem;min-height:50rem;position:relative;overflow:hidden;">'
);
// Also match \n instead of \r\n just in case
html = html.replace(
  '<div id="cv-preview"\n            style="box-shadow:var(--shadow-lg),0 0 0 1px var(--color-gray-100);border-radius:var(--radius-xl);padding:2rem;min-height:50rem;position:relative;overflow:hidden;">',
  '<div id="cv-preview"\n            style="background:white;color:black;box-shadow:var(--shadow-lg),0 0 0 1px rgba(255,255,255,0.1);border-radius:var(--radius-xl);padding:2rem;min-height:50rem;position:relative;overflow:hidden;">'
);

fs.writeFileSync(filePath, html);
console.log('result.html fixed.');
