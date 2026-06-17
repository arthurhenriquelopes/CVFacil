/**
 * ATS Result Page — Renders three-panel dashboard from Evolui-CV analysis.
 * Left: CV summary + score gauge
 * Center: Recruiter analysis (issues, strengths, actions)
 * Right: Improvement suggestions (selectable for CV generation)
 */
import { getState, setState, resetJobState } from '/src/lib/store.js';

const state = getState();
const res = state.analysisResult;

// Handle Novo Teste link
document.getElementById('btn-new-test')?.addEventListener('click', (e) => {
    e.preventDefault();
    resetJobState();
    window.location.href = '/pages/step-ats-scanner.html';
});

if (!res || !res.analysis) {
  window.location.href = '/pages/dashboard.html';
}

const analysis = res.analysis;
const improvements = res.improvements;
const suggestions = improvements?.suggestions || [];
const isGeneratorFlow = !!(state.profile && state.profile.name);

// Score classification
const score = analysis.overallScore || 0;
const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
const scoreLabel = score >= 80 ? 'Excelente' : score >= 60 ? 'Competitivo' : score >= 40 ? 'Precisa de ajustes' : 'Requer revisão';

// SVG gauge calculations
const radius = 68;
const circumference = 2 * Math.PI * radius;
const dashOffset = circumference - (score / 100) * circumference;

// ═══════════════════════════════════════
// LEFT PANEL — CV Summary + Score
// ═══════════════════════════════════════
const leftPanel = `
<div class="result-panel" style="position:sticky;top:1rem;">
  <div class="result-panel-title">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
    Currículo Enviado
  </div>

  <!-- Score Gauge -->
  <div class="score-gauge" style="margin-bottom:1.5rem;">
    <svg viewBox="0 0 160 160" width="160" height="160">
      <circle class="score-gauge-track" cx="80" cy="80" r="${radius}"/>
      <circle class="score-gauge-fill" cx="80" cy="80" r="${radius}"
        stroke="${scoreColor}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${dashOffset}"/>
    </svg>
    <div class="score-gauge-value">
      <span class="score-gauge-number" style="color:${scoreColor};">${score}</span>
      <span class="score-gauge-label" style="color:${scoreColor};">${scoreLabel}</span>
    </div>
  </div>

  <!-- Meta info -->
  <div style="display:flex;flex-direction:column;gap:0.75rem;border-top:1px solid var(--color-border);padding-top:1rem;">
    ${state.professionalGoal ? `
    <div>
      <div style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-muted);margin-bottom:0.25rem;">Objetivo</div>
      <div style="font-size:0.8125rem;color:var(--color-text-secondary);line-height:1.4;">${state.professionalGoal}</div>
    </div>` : ''}
    ${state.targetRole ? `
    <div>
      <div style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-muted);margin-bottom:0.25rem;">Cargo Alvo</div>
      <div style="font-size:0.8125rem;color:var(--color-text-secondary);">${state.targetRole}</div>
    </div>` : ''}
    ${state.cvFileName ? `
    <div>
      <div style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-muted);margin-bottom:0.25rem;">Arquivo</div>
      <div style="font-size:0.8125rem;color:var(--color-text-secondary);display:flex;align-items:center;gap:0.5rem;">
        <i class="pi pi-file-pdf" style="color:#ef4444;"></i> ${state.cvFileName}
      </div>
    </div>` : ''}
  </div>

  <!-- Quick Actions -->
  <div style="margin-top:1.25rem;display:flex;flex-direction:column;gap:0.5rem;">
    <a href="/pages/step-ats-scanner.html" style="display:flex;align-items:center;justify-content:center;gap:0.5rem;padding:0.625rem;border:1px solid var(--color-border);border-radius:var(--radius-md);font-size:0.75rem;font-weight:600;color:var(--color-text-secondary);text-decoration:none;transition:all 0.2s;">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
      Novo teste
    </a>
  </div>
</div>`;

// ═══════════════════════════════════════
// CENTER PANEL — Analysis
// ═══════════════════════════════════════
const issuesHtml = (analysis.issues || []).map(issue => `
<div class="issue-card" style="margin-bottom:0.75rem;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.625rem;">
    <span style="font-size:0.75rem;font-weight:700;color:var(--color-text-secondary);">${issue.section || 'Geral'}</span>
    <span class="severity-badge severity-${(issue.severity || 'medium').toLowerCase()}">${issue.severity || 'MEDIUM'}</span>
  </div>
  <p style="font-size:0.8125rem;font-weight:600;color:var(--color-text);margin-bottom:0.375rem;line-height:1.4;">${issue.problem}</p>
  <p style="font-size:0.75rem;color:var(--color-text-tertiary);margin-bottom:0.5rem;line-height:1.4;">
    <strong style="color:var(--color-text-secondary);">Por quê:</strong> ${issue.reason}
  </p>
  ${issue.suggestion ? `<p style="font-size:0.75rem;color:var(--color-success);line-height:1.4;">
    <strong>Sugestão:</strong> ${issue.suggestion}
  </p>` : ''}
</div>`).join('');

const strengthsHtml = (analysis.strengths || []).map(s =>
  `<div class="strength-item">${s}</div>`
).join('');

const actionsHtml = (analysis.recommendedActions || []).map(a =>
  `<div class="action-item">${a}</div>`
).join('');

const centerPanel = `
<div style="display:flex;flex-direction:column;gap:1.25rem;">
  <!-- Executive Summary -->
  <div class="result-panel">
    <div class="result-panel-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      Parecer do Recrutador IA
    </div>
    <p style="font-size:0.875rem;color:var(--color-text-secondary);line-height:1.7;">${analysis.executiveSummary || ''}</p>
  </div>

  <!-- Strengths -->
  ${(analysis.strengths || []).length ? `
  <div class="result-panel">
    <div class="result-panel-title" style="color:var(--color-success);">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
      Pontos Fortes
    </div>
    ${strengthsHtml}
  </div>` : ''}

  <!-- Issues -->
  ${(analysis.issues || []).length ? `
  <div class="result-panel">
    <div class="result-panel-title" style="color:var(--color-error);">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      Problemas Encontrados (${(analysis.issues || []).length})
    </div>
    ${issuesHtml}
  </div>` : ''}

  <!-- Recommended Actions -->
  ${(analysis.recommendedActions || []).length ? `
  <div class="result-panel">
    <div class="result-panel-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"/><path d="m9 12 2 2 4-4"/></svg>
      Próximos Passos
    </div>
    <div class="actions-list">
      ${actionsHtml}
    </div>
  </div>` : ''}
</div>`;

// ═══════════════════════════════════════
// RIGHT PANEL — Improvement Suggestions
// ═══════════════════════════════════════
const actionLabels = { ADD: 'Adicionar', REMOVE: 'Remover', REWRITE: 'Reescrever', IMPROVE: 'Refinar', QUESTION: 'Pergunta da IA' };

const standardSuggestions = suggestions.map((s, i) => ({ ...s, _originalIdx: i })).filter(s => s.action !== 'QUESTION');
const questionSuggestions = suggestions.map((s, i) => ({ ...s, _originalIdx: i })).filter(s => s.action === 'QUESTION');

const suggestionsHtml = standardSuggestions.map(s => {
  const i = s._originalIdx;
  const actionClass = `action-${(s.action || 'improve').toLowerCase()}`;
  const isQuestion = s.action === 'QUESTION';
  
  return `
  <div class="suggestion-card" data-idx="${i}" style="margin-bottom:0.75rem; border-left: 3px solid ${isQuestion ? '#8b5cf6' : 'transparent'};">
    <div class="check-indicator">${isQuestion ? 'Sim' : '✓'}</div>
    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.625rem;flex-wrap:wrap;padding-right:2.5rem;">
      <span class="action-badge ${actionClass}" style="${isQuestion ? 'background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border-color: rgba(139, 92, 246, 0.2);' : ''}">${actionLabels[s.action] || s.action}</span>
      <span style="font-size:0.6875rem;color:var(--color-text-tertiary);">${s.section || ''}</span>
      <span class="severity-badge severity-${(s.impact || 'medium').toLowerCase()}" style="margin-left:auto;">${s.impact || 'MEDIUM'}</span>
    </div>
    ${s.current && !isQuestion ? `<div class="current-text" style="margin-bottom:0.5rem;">${s.current}</div>` : ''}
    ${s.proposed ? `<div class="proposed-text" style="margin-bottom:0.5rem; ${isQuestion ? 'font-style: italic; color: #4b5563;' : ''}">${isQuestion ? '🤔 ' + s.proposed : s.proposed}</div>` : ''}
    ${s.rationale ? `<p style="font-size:0.6875rem;color:var(--color-text-muted);margin-top:0.375rem;line-height:1.4;">${isQuestion ? 'Se você selecionar, adicionaremos isso ao seu CV. Motivo: ' : ''}${s.rationale}</p>` : ''}
  </div>`;
}).join('');

const rightPanel = `
<div style="display:flex;flex-direction:column;gap:1rem;">
  <div class="result-panel">
    <div class="result-panel-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Sugestões de Melhoria (${standardSuggestions.length})
    </div>

    ${isGeneratorFlow ? `
    <div style="display:flex;align-items:center;gap:0.5rem;padding:0.625rem 0.75rem;background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.15);border-radius:var(--radius-md);margin-bottom:1rem;">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"/><path d="m9 12 2 2 4-4"/></svg>
      <span style="font-size:0.6875rem;color:var(--color-success);font-weight:600;">Selecione as sugestões que deseja aplicar ao gerar o CV</span>
    </div>` : ''}

    <div id="suggestions-list">
      ${suggestionsHtml}
    </div>

    ${suggestions.length ? `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--color-border);">
      <button id="btn-select-all" style="font-size:0.6875rem;font-weight:600;color:var(--color-text-secondary);background:none;border:1px solid var(--color-border);padding:0.375rem 0.75rem;border-radius:var(--radius-sm);cursor:pointer;transition:all 0.2s;">
        Selecionar Todas
      </button>
      <span id="selected-count" style="font-size:0.6875rem;color:var(--color-text-muted);font-weight:600;">0 selecionadas</span>
    </div>` : ''}
  </div>

  ${isGeneratorFlow ? `
  <button id="btn-generate" class="btn-continue" style="width:100%;border-radius:var(--radius-lg);">
    Gerar CV com Sugestões Selecionadas
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:0.5rem;"><path d="m9 18 6-6-6-6"/></svg>
  </button>` : ''}
</div>`;

// ═══════════════════════════════════════
// RENDER
// ═══════════════════════════════════════
const markup = `
<div class="result-grid">
  ${leftPanel}
  ${centerPanel}
  ${rightPanel}
</div>`;

document.getElementById('render-target').innerHTML = markup;

// ═══════════════════════════════════════
// INTERACTIVITY — Suggestion Selection
// ═══════════════════════════════════════
const selectedSet = new Set();

function updateSelectedCount() {
  const el = document.getElementById('selected-count');
  if (el) el.textContent = `${selectedSet.size} selecionada${selectedSet.size !== 1 ? 's' : ''}`;
}

document.querySelectorAll('.suggestion-card').forEach(card => {
  card.addEventListener('click', () => {
    const idx = parseInt(card.dataset.idx);
    if (selectedSet.has(idx)) {
      selectedSet.delete(idx);
      card.classList.remove('selected');
    } else {
      selectedSet.add(idx);
      card.classList.add('selected');
    }
    updateSelectedCount();
    // Persist selection
    setState({ selectedSuggestions: suggestions.filter((_, i) => selectedSet.has(i)) });
  });
});

// Select All button
const btnSelectAll = document.getElementById('btn-select-all');
if (btnSelectAll) {
  btnSelectAll.addEventListener('click', () => {
    const allSelected = selectedSet.size === suggestions.length;
    document.querySelectorAll('.suggestion-card').forEach(card => {
      const idx = parseInt(card.dataset.idx);
      if (allSelected) {
        selectedSet.delete(idx);
        card.classList.remove('selected');
      } else {
        selectedSet.add(idx);
        card.classList.add('selected');
      }
    });
    btnSelectAll.textContent = allSelected ? 'Selecionar Todas' : 'Desmarcar Todas';
    updateSelectedCount();
    setState({ selectedSuggestions: suggestions.filter((_, i) => selectedSet.has(i)) });
  });
}

// Generate CV button (generator flow only)
const btnGenerate = document.getElementById('btn-generate');
if (btnGenerate) {
  btnGenerate.addEventListener('click', () => {
    setState({ selectedSuggestions: suggestions.filter((_, i) => selectedSet.has(i)) });
    window.location.href = '/pages/step-template.html';
  });
}

// ═══════════════════════════════════════
// QUESTION MODAL LOGIC
// ═══════════════════════════════════════
if (questionSuggestions.length > 0) {
  let currentQIdx = 0;
  const modalWrap = document.createElement('div');
  modalWrap.id = 'question-modal-wrap';
  modalWrap.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;';
  
  function renderCurrentQuestion() {
    if (currentQIdx >= questionSuggestions.length) {
      modalWrap.style.opacity = '0';
      setTimeout(() => modalWrap.remove(), 300);
      return;
    }
    const q = questionSuggestions[currentQIdx];
    modalWrap.innerHTML = `
      <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-xl);width:90%;max-width:480px;padding:2rem;box-shadow:0 20px 40px rgba(0,0,0,0.3);transform:translateY(20px);animation:slideUp 0.4s forwards;">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;">
          <div style="background:rgba(139,92,246,0.1);color:#8b5cf6;width:2.5rem;height:2.5rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.25rem;">
            🤔
          </div>
          <div>
            <h3 style="font-size:1.125rem;font-weight:700;color:var(--color-text);margin:0;">Pergunta da IA</h3>
            <span style="font-size:0.75rem;color:var(--color-text-tertiary);">${currentQIdx + 1} de ${questionSuggestions.length}</span>
          </div>
        </div>
        <p style="font-size:1.0625rem;color:var(--color-text-secondary);line-height:1.6;margin-bottom:2rem;font-weight:500;">
          ${q.proposed}
        </p>
        <div style="display:flex;gap:1rem;">
          <button id="btn-q-no" style="flex:1;padding:0.875rem;border-radius:var(--radius-md);border:1px solid var(--color-border);background:transparent;color:var(--color-text-secondary);font-weight:600;cursor:pointer;transition:all 0.2s;">
            Não possuo
          </button>
          <button id="btn-q-yes" style="flex:1;padding:0.875rem;border-radius:var(--radius-md);border:none;background:#8b5cf6;color:#fff;font-weight:600;cursor:pointer;transition:all 0.2s;">
            Sim, eu possuo
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-q-no').addEventListener('click', () => {
      currentQIdx++;
      renderCurrentQuestion();
    });

    document.getElementById('btn-q-yes').addEventListener('click', () => {
      selectedSet.add(q._originalIdx);
      updateSelectedCount();
      setState({ selectedSuggestions: suggestions.filter((_, i) => selectedSet.has(i)) });
      currentQIdx++;
      renderCurrentQuestion();
    });
  }

  document.body.appendChild(modalWrap);
  if (!document.getElementById('modal-styles')) {
    const s = document.createElement('style');
    s.id = 'modal-styles';
    s.textContent = '@keyframes slideUp { to { transform: translateY(0); } } #btn-q-no:hover{background:var(--color-accent-dim)} #btn-q-yes:hover{background:#7c3aed}';
    document.head.appendChild(s);
  }

  setTimeout(() => {
    modalWrap.style.opacity = '1';
    renderCurrentQuestion();
  }, 100);
}
