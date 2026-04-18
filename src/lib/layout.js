/**
 * Shared layout components injected via JS.
 * Eliminates HTML duplication across step pages.
 */

/**
 * Injects a step header with back button, title, counter, and progress bar.
 * @param {object} opts
 * @param {number} opts.step - Current step number
 * @param {number} opts.total - Total steps (default 10)
 * @param {string} opts.backHref - URL for the back button
 */
export function injectStepHeader({ step, total = 8, backHref = '#' }) {
  const pct = Math.round((step / total) * 100);
  const header = document.createElement('header');
  header.className = 'step-header';
  header.innerHTML = `
    <div class="step-header-inner">
      <div style="display:flex;align-items:center;gap:1rem;">
        <a href="${backHref}" class="back-btn" aria-label="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
        </a>
        <span class="title">Gerar CV</span>
      </div>
      <span class="step-counter">${step}/${total}</span>
    </div>
    <div class="progress-bar">
      <div class="progress-bar-fill" style="width: ${pct}%;"></div>
    </div>
  `;
  document.body.prepend(header);
}

/**
 * Injects a fixed footer with a "Continuar" button.
 * @param {object} opts
 * @param {string} opts.href - Where the button navigates
 * @param {string} [opts.label] - Button text
 * @param {string} [opts.id] - Optional ID for the button
 * @param {boolean} [opts.disabled] - Start disabled
 */
export function injectStepFooter({ label = 'Continuar', id = 'btn-continue', disabled = false } = {}) {
  const footer = document.createElement('footer');
  footer.className = 'step-footer';
  footer.innerHTML = `
    <button id="${id}" class="btn-continue" ${disabled ? 'style="pointer-events:none;opacity:0.15;"' : ''}>
      ${label}
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:0.5rem;"><path d="m9 18 6-6-6-6"></path></svg>
    </button>
  `;
  document.body.appendChild(footer);
}

/**
 * Injects a landing/dashboard navbar.
 * @param {object} opts
 * @param {string} opts.activePage - 'landing' or 'dashboard'
 */
export function injectNavbar({ activePage = 'landing' } = {}) {
  // Gradient mesh background
  const mesh = document.createElement('div');
  mesh.className = 'gradient-mesh';
  document.body.prepend(mesh);

  const nav = document.createElement('nav');
  nav.style.cssText = `
    position: sticky; top: 0; z-index: 50;
    background: rgba(10, 10, 10, 0.75);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid var(--color-border);
    padding: 0 1.5rem; height: 3.75rem; display: flex; align-items: center;
    justify-content: space-between; max-width: var(--max-width); margin: 0 auto; width: 100%;
  `;
  nav.innerHTML = `
    <a href="/" style="font-size:1.125rem;font-weight:700;color:var(--color-text);letter-spacing:0.02em;display:flex;align-items:center;gap:0.5rem;">
      <div style="width:1.75rem;height:1.75rem;background:var(--color-text);border-radius:6px;display:flex;align-items:center;justify-content:center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-bg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
      </div>
      CvPorVaga
    </a>
    <div style="display:flex;gap:0.25rem;align-items:center;">
      <a href="/pages/dashboard.html" style="padding:0.5rem 0.875rem;font-weight:500;font-size:0.8125rem;color:var(--color-text-secondary);border-radius:var(--radius-md);transition:all 150ms ease;">Dashboard</a>
      <a href="/pages/step-goal.html" style="padding:0.5rem 1rem;font-weight:600;font-size:0.8125rem;background:var(--color-text);color:var(--color-bg);border-radius:var(--radius-md);transition:all 150ms ease;display:flex;align-items:center;gap:0.375rem;">
        Criar CV
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>
      </a>
    </div>
  `;
  document.body.prepend(nav);
}
