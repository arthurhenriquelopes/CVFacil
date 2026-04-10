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
export function injectStepHeader({ step, total = 10, backHref = '#' }) {
  const pct = Math.round((step / total) * 100);
  const header = document.createElement('header');
  header.className = 'step-header';
  header.innerHTML = `
    <div class="step-header-inner">
      <div style="display:flex;align-items:center;gap:1rem;">
        <a href="${backHref}" class="back-btn" aria-label="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg>
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
    <button id="${id}" class="btn-continue" ${disabled ? 'style="pointer-events:none;opacity:0.5;"' : ''}>
      ${label}
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
  const nav = document.createElement('nav');
  nav.style.cssText = `
    position: sticky; top: 0; z-index: 50; background: rgba(18,18,18,0.85);;
    backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-gray-100);
    padding: 0 1rem; height: 4rem; display: flex; align-items: center;
    justify-content: space-between; max-width: var(--max-width); margin: 0 auto; width: 100%;
  `;
  nav.innerHTML = `
    <a href="/" style="font-size:1.5rem;font-weight:700; text-transform:uppercase; letter-spacing:0.1em;;color:var(--color-gray-900);letter-spacing:-0.025em;">
      CvPorVaga<span style="color:var(--color-gray-300)">.</span>
    </a>
    <div style="display:flex;gap:0.75rem;align-items:center;">
      <a href="/pages/dashboard.html" style="padding:0.5rem 1rem;font-weight:500;font-size:0.875rem;transition:background 0.2s;">Entrar</a>
      <a href="/pages/step-goal.html" style="padding:0.5rem 1.25rem;font-weight:700;font-size:0.875rem;background:var(--color-gray-900);color:var(--color-gray-50);border:1px solid var(--color-gray-900); border-radius:0;transition:transform 0.15s;">
        Criar CV →
      </a>
    </div>
  `;
  document.body.prepend(nav);
}
