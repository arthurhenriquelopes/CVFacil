/**
 * Settings Modal — Groq API Key Manager
 * 
 * Injects a gear icon button and a premium modal for managing
 * multiple Groq API keys stored in localStorage.
 */

const STORAGE_KEY = 'cvporvaga_groq_keys';
const PROVIDER_KEY = 'cvporvaga_ai_provider';

// ─── Key Management ───────────────────────────────

export function getAiProvider() {
    return localStorage.getItem(PROVIDER_KEY) || 'groq';
}

export function saveAiProvider(provider) {
    localStorage.setItem(PROVIDER_KEY, provider);
}

export function getGroqKeys() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const keys = JSON.parse(raw);
        return Array.isArray(keys) ? keys.filter(Boolean) : [];
    } catch {
        return [];
    }
}

export function saveGroqKeys(keys) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys.filter(Boolean)));
}

export function getActiveGroqKey() {
    const keys = getGroqKeys();
    return keys.length > 0 ? keys[0] : null;
}

// ─── UI Injection ─────────────────────────────────

/**
 * Injects the settings gear button into a container element.
 * Call this from layout.js after creating the navbar/header.
 * @param {HTMLElement} container - Element to append the gear button to
 */
export function injectSettingsGear(container) {
    const btn = document.createElement('button');
    btn.id = 'settings-gear-btn';
    btn.setAttribute('aria-label', 'Configurações');
    btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    `;
    container.appendChild(btn);

    btn.addEventListener('click', () => openSettingsModal());

    // Show a subtle indicator dot if no keys configured
    updateGearIndicator(btn);
}

function updateGearIndicator(btn) {
    const existing = btn.querySelector('.gear-indicator');
    if (existing) existing.remove();

    const provider = getAiProvider();
    if (provider === 'openai') return; // OpenAI uses embedded keys, no need for warning dot

    const keys = getGroqKeys();
    if (keys.length === 0) {
        const dot = document.createElement('span');
        dot.className = 'gear-indicator';
        btn.appendChild(dot);
    }
}

// ─── Modal ────────────────────────────────────────

function openSettingsModal() {
    // Prevent duplicates
    if (document.getElementById('settings-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'settings-modal-overlay';
    overlay.innerHTML = `
        <div class="settings-modal" role="dialog" aria-labelledby="settings-title">
            <div class="settings-modal-header">
                <div>
                    <h2 id="settings-title" class="settings-modal-title">Configurações</h2>
                    <p class="settings-modal-subtitle">Escolha o provedor de IA e gerencie suas chaves</p>
                </div>
                <button id="settings-close-btn" class="settings-close-btn" aria-label="Fechar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                </button>
            </div>

            <div class="settings-modal-body">
                <div class="settings-section" style="margin-bottom: 24px;">
                    <label class="settings-label">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                        Provedor de IA
                    </label>
                    <p class="settings-hint">
                        Selecione qual inteligência artificial processará seu currículo.
                    </p>
                    
                    <div class="provider-select-group" style="display: flex; gap: 12px; margin-top: 10px; flex-wrap: wrap;">
                        <div class="provider-radio-card card" id="card-groq" style="flex: 1; min-width: 220px; display: flex; flex-direction: column; padding: 1rem; position: relative;">
                            <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.95rem;">
                                <input type="radio" name="ai-provider" value="groq" id="provider-groq" style="accent-color: var(--color-accent);" />
                                <span>Groq / Llama (Chave Própria)</span>
                            </div>
                            <span style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.5rem; margin-left: 1.5rem; line-height: 1.3;">Use seus limites de requisições inserindo suas chaves próprias do Groq abaixo.</span>
                        </div>
                        
                        <div class="provider-radio-card card" id="card-openai" style="flex: 1; min-width: 220px; display: flex; flex-direction: column; padding: 1rem; position: relative;">
                            <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.95rem;">
                                <input type="radio" name="ai-provider" value="openai" id="provider-openai" style="accent-color: var(--color-accent);" />
                                <span>OpenAI GPT-4o (Cortesia)</span>
                            </div>
                            <span style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.5rem; margin-left: 1.5rem; line-height: 1.3;">Use chaves integradas gratuitamente sem precisar preencher chaves de API.</span>
                        </div>
                    </div>
                </div>

                <div id="groq-keys-section" class="settings-section">
                    <label class="settings-label">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                        </svg>
                        Chaves API Groq
                    </label>
                    <p class="settings-hint">
                        Obtenha sua chave em <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>. 
                        Adicione múltiplas chaves para rotação automática.
                    </p>

                    <div id="keys-list" class="keys-list"></div>

                    <div class="add-key-row">
                        <input 
                            type="password" 
                            id="new-key-input" 
                            class="form-input settings-input" 
                            placeholder="gsk_xxxxxxxxxxxxxxxx"
                            autocomplete="off"
                            spellcheck="false"
                        />
                        <button id="add-key-btn" class="add-key-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 12h14"/><path d="M12 5v14"/>
                            </svg>
                            Adicionar
                        </button>
                    </div>
                </div>

                <div class="settings-info-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;">
                        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                    </svg>
                    <span>Suas chaves ficam salvas apenas no seu navegador (localStorage) e nunca são enviadas para nossos servidores.</span>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Setup Provider state UI
    const provider = getAiProvider();
    const groqRadio = overlay.querySelector('#provider-groq');
    const openaiRadio = overlay.querySelector('#provider-openai');
    const groqSection = overlay.querySelector('#groq-keys-section');
    const cardGroq = overlay.querySelector('#card-groq');
    const cardOpenai = overlay.querySelector('#card-openai');

    if (provider === 'openai') {
        openaiRadio.checked = true;
        cardOpenai.classList.add('selected');
        groqSection.style.display = 'none';
    } else {
        groqRadio.checked = true;
        cardGroq.classList.add('selected');
    }

    const handleProviderChange = (newProvider) => {
        saveAiProvider(newProvider);
        if (newProvider === 'openai') {
            cardOpenai.classList.add('selected');
            cardGroq.classList.remove('selected');
            groqSection.style.display = 'none';
        } else {
            cardGroq.classList.add('selected');
            cardOpenai.classList.remove('selected');
            groqSection.style.display = 'block';
        }
    };

    cardGroq.addEventListener('click', () => {
        groqRadio.checked = true;
        handleProviderChange('groq');
    });

    cardOpenai.addEventListener('click', () => {
        openaiRadio.checked = true;
        handleProviderChange('openai');
    });

    groqRadio.addEventListener('change', () => handleProviderChange('groq'));
    openaiRadio.addEventListener('change', () => handleProviderChange('openai'));

    // Render existing keys
    renderKeysList();

    // Wire events
    const closeBtn = overlay.querySelector('#settings-close-btn');
    const addBtn = overlay.querySelector('#add-key-btn');
    const input = overlay.querySelector('#new-key-input');

    closeBtn.addEventListener('click', closeSettingsModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSettingsModal();
    });
    document.addEventListener('keydown', handleEsc);

    addBtn.addEventListener('click', () => addKey(input));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addKey(input);
    });

    // Animate in
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
}

function closeSettingsModal() {
    const overlay = document.getElementById('settings-modal-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    overlay.classList.add('closing');
    document.removeEventListener('keydown', handleEsc);

    setTimeout(() => overlay.remove(), 250);

    // Update gear indicator
    const gearBtn = document.getElementById('settings-gear-btn');
    if (gearBtn) updateGearIndicator(gearBtn);
}

function handleEsc(e) {
    if (e.key === 'Escape') closeSettingsModal();
}

function addKey(input) {
    const value = input.value.trim();
    if (!value) return;

    // Basic validation
    if (!value.startsWith('gsk_') && value.length < 20) {
        input.style.borderColor = 'var(--color-error)';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
        setTimeout(() => {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }, 1500);
        return;
    }

    const keys = getGroqKeys();
    if (keys.includes(value)) {
        input.value = '';
        return; // Already exists
    }

    keys.push(value);
    saveGroqKeys(keys);
    input.value = '';
    renderKeysList();

    // Flash success
    input.style.borderColor = 'var(--color-success)';
    input.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.15)';
    setTimeout(() => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
    }, 1000);
}

function removeKey(index) {
    const keys = getGroqKeys();
    keys.splice(index, 1);
    saveGroqKeys(keys);
    renderKeysList();
}

function maskKey(key) {
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.slice(0, 4) + '•'.repeat(Math.min(key.length - 8, 24)) + key.slice(-4);
}

function renderKeysList() {
    const container = document.getElementById('keys-list');
    if (!container) return;

    const keys = getGroqKeys();

    if (keys.length === 0) {
        container.innerHTML = `
            <div class="keys-empty">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3;">
                    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
                <span>Nenhuma chave configurada</span>
            </div>
        `;
        return;
    }

    container.innerHTML = keys.map((key, i) => `
        <div class="key-item animate-fade-in" style="animation-delay:${i * 50}ms;">
            <div class="key-item-info">
                <span class="key-index">${i + 1}</span>
                <code class="key-value">${maskKey(key)}</code>
                ${i === 0 ? '<span class="key-active-badge">Ativa</span>' : ''}
            </div>
            <button class="key-remove-btn" data-index="${i}" aria-label="Remover chave ${i + 1}">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
            </button>
        </div>
    `).join('');

    // Wire remove buttons
    container.querySelectorAll('.key-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index, 10);
            removeKey(idx);
        });
    });
}
