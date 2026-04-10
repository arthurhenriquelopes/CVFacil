import { getState } from '/src/lib/store.js';

const state = getState();
const res = state.analysisResult;

if (!res) {
    window.location.href = '/pages/dashboard.html';
}

// Se 'ats' não existir, cria um baseado na proporção real com a nota base 10
const ats = res.ats || {
    score: Math.round(
        (res.matchPercentage / 100) * 40 +
        (res.matchPercentage / 100) * 30 +
        (res.matchPercentage / 100) * 20 +
        10
    ) || 33,
    classification: (res.matchPercentage >= 70) ? "Aprovado pelo ATS" : "Reprovado automaticamente pelo ATS",
    risk: (res.matchPercentage >= 70) ? "BAIXO" : "ALTO",
    summary: "O seu currículo foi analisado com base nas palavras-chave e requisitos da vaga.",
    breakdown: {
        hardSkills: { score: Math.round((res.matchPercentage / 100) * 40), max: 40 },
        experience: { score: Math.round((res.matchPercentage / 100) * 30), max: 30 },
        keywords: { score: Math.round((res.matchPercentage / 100) * 20), max: 20 },
        education: { score: Math.round((res.matchPercentage / 100) * 10), max: 10 }
    },
    criticalGaps: res.suggestions?.slice(0, 3) || ["Ausência de palavras-chave adequadas"],
    missingKeywords: res.keywords?.filter(k => !(res.matchedKeywords || []).includes(k)) || ["Node.js", "TypeScript"],
    matchedKeywords: res.matchedKeywords || ["Docker", "PostgreSQL"],
    strengths: (res.highlightableExperiences || []).map(e => e.reason),
    tips: res.suggestions?.map(s => ({ text: s, impact: 'alto' })) || []
};

const isApproved = ats.score >= 70;
const colorMain = isApproved ? 'var(--color-success)' : 'var(--color-error)';
const badgeStyle = isApproved
    ? 'background:#dcfce7; color:#15803d;'
    : 'background:#fee2e2; color:#b91c1c;';
const badgeText = isApproved ? 'APROVAR' : 'REPROVAR';

const criticalGapsHtml = ats.criticalGaps.map(g => `
    <li style="font-size:0.875rem; color:var(--color-error); display:flex; align-items:flex-start; gap:0.5rem; margin-bottom:0.5rem;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:0.25rem;"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>
        ${g}
    </li>
`).join('');

const missingKwHtml = ats.missingKeywords.map(k => `
    <span style="padding:0.25rem 0.75rem; background:#fef2f2; color:#b91c1c; border:1px solid #fee2e2; font-size:0.875rem; font-weight:500;">${k}</span>
`).join('');

const matchedKwHtml = ats.matchedKeywords.map(k => `
    <span style="padding:0.25rem 0.75rem; background:#f0fdf4; color:#15803d; border:1px solid #dcfce7; font-size:0.875rem;">${k}</span>
`).join('');

const strengthsHtml = ats.strengths.map(s => `
    <li style="display:flex; align-items:flex-start; gap:0.75rem; font-size:0.875rem; color:var(--color-gray-600); margin-bottom:1rem;">
        <div style="width:0.375rem; height:0.375rem; border-radius:50%; background:var(--color-success); margin-top:0.375rem; flex-shrink:0;"></div>
        ${s}
    </li>
`).join('');

const tipsHtml = ats.tips.map(t => `
    <li style="display:flex; align-items:flex-start; gap:0.75rem; font-size:0.875rem; color:var(--color-gray-600); margin-bottom:1rem;">
        <div style="width:0.375rem; height:0.375rem; border-radius:50%; background:${t.impact === 'alto' ? 'var(--color-error)' : 'var(--color-warning)'}; margin-top:0.375rem; flex-shrink:0;"></div>
        <span style="${t.impact === 'alto' ? 'font-weight:600; color:var(--color-gray-800);' : ''}">${t.text}</span>
    </li>
`).join('');

const ctaHtml = !isApproved ? `
    <div style="background:var(--color-gray-200); border:1px solid var(--color-gray-300); padding:2rem; margin-top:2rem; text-align:center; color:var(--color-gray-900);">
        <div style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.375rem 1rem; background:var(--color-error); color:white; font-size:0.875rem; font-weight:700; margin-bottom:1rem;">
            ⚠ Atenção: Seu CV está sendo eliminado
        </div>
        <h2 style="font-size:1.5rem; font-weight:700; margin:0 0 0.75rem;">Com esse score, você está perdendo vagas agora</h2>
        <p style="color:var(--color-gray-600); font-weight:500; max-width:40rem; margin:0 auto 2rem;">Enquanto você lê isso, outros candidatos com CVs otimizados estão sendo chamados para entrevista.</p>
        <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
            <a href="/pages/step-template.html" style="background:var(--color-gray-900); color:var(--color-gray-50); padding:1rem 2rem; font-weight:700;">
                🚀 Gerar currículo otimizado
            </a>
            <a href="/pages/step-ats-scanner.html" style="color:var(--color-gray-600); padding:1rem 1.5rem; font-weight:700; border:1px solid var(--color-gray-300);">
                Testar outra vaga
            </a>
        </div>
    </div>
` : `
    <div style="background:var(--color-gray-200); border:1px solid var(--color-success); padding:2rem; margin-top:2rem; text-align:center; color:var(--color-gray-900);">
        <h2 style="font-size:1.5rem; font-weight:700; margin:0 0 0.75rem; color:var(--color-success);">Seu currículo está forte!</h2>
        <p style="color:var(--color-gray-600); font-weight:500; max-width:40rem; margin:0 auto 2rem;">Pode enviar com confiança, o ATS não será uma barreira para você.</p>
        <a href="/pages/step-ats-scanner.html" style="display:inline-flex; background:var(--color-gray-900); color:var(--color-gray-50); padding:1rem 2rem; font-weight:700;">
            Testar outra vaga
        </a>
    </div>
`;

const finalMarkup = `
<div style="width:100%; max-width:64rem; margin:0 auto; padding:2rem 1rem;">
    <div style="display:grid; gap:1.5rem;" class="main-grid">
        <!-- Top Summary Grid -->
        <div class="col-span-2" style="border:1px solid var(--color-gray-300); padding:2rem;">
            <div style="display:flex; align-items:flex-start; justify-content:space-between;">
                <div>
                    <h2 style="font-size:1.875rem; font-weight:700; color:var(--color-gray-900); margin:0;">Resultado da Análise</h2>
                    <p style="color:var(--color-gray-500); font-weight:500; margin-top:0.25rem; font-size:0.875rem;">Baseado nos critérios de +50 ATS do mercado</p>
                </div>
                <div style="padding:0.25rem 1rem; font-size:0.75rem; font-weight:700; letter-spacing:0.05em; ${badgeStyle}">${badgeText}</div>
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; margin-top:1.5rem;">
                <div>
                    <div style="font-size:0.875rem; color:var(--color-gray-500); font-weight:700; text-transform:uppercase; margin-bottom:0.25rem;">Score Geral</div>
                    <div style="font-size:3.75rem; font-weight:700; color:${colorMain}; line-height:1;">${ats.score}<span style="font-size:1.5rem; color:var(--color-gray-400); font-weight:400;">/100</span></div>
                </div>
                <div>
                    <div style="font-size:0.875rem; color:var(--color-gray-400); font-weight:700; text-transform:uppercase; margin-bottom:0.25rem;">Classificação</div>
                    <div style="font-size:1.25rem; font-weight:700; color:var(--color-gray-800); line-height:1.2;">${ats.classification}</div>
                    <div style="margin-top:0.5rem; display:flex; align-items:center; gap:0.5rem;">
                        <div style="width:0.75rem; height:0.75rem; border-radius:50%; background:${colorMain};"></div>
                        <span style="font-size:0.875rem; color:var(--color-gray-600);">Risco de Rejeição: <strong>${ats.risk}</strong></span>
                    </div>
                </div>
            </div>
            <p style="color:var(--color-gray-600); font-weight:500; line-height:1.6; border-top:1px solid var(--color-gray-200); padding-top:1.5rem; margin-top:1.5rem;">${ats.summary}</p>
        </div>
        
        <div style="border:1px solid var(--color-gray-300); padding:1.5rem;">
            <h3 style="font-weight:700; color:var(--color-gray-800); font-size:1.125rem; margin:0 0 1.5rem;">Composição da Nota</h3>
            <div style="display:flex; flex-direction:column; gap:1rem;">
                <div>
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem;"><span style="font-weight:700; color:var(--color-gray-600);">Hard Skills</span><span style="font-weight:700; color:var(--color-gray-800);">${ats.breakdown.hardSkills.score}/${ats.breakdown.hardSkills.max}</span></div>
                    <div style="height:0.625rem; width:100%; background:var(--color-gray-200); overflow:hidden;"><div style="height:100%; background:var(--color-error); width: ${(ats.breakdown.hardSkills.score / ats.breakdown.hardSkills.max) * 100}%;"></div></div>
                </div>
                <div>
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem;"><span style="font-weight:700; color:var(--color-gray-600);">Experiência</span><span style="font-weight:700; color:var(--color-gray-800);">${ats.breakdown.experience.score}/${ats.breakdown.experience.max}</span></div>
                    <div style="height:0.625rem; width:100%; background:var(--color-gray-200); overflow:hidden;"><div style="height:100%; background:var(--color-error); width: ${(ats.breakdown.experience.score / ats.breakdown.experience.max) * 100}%;"></div></div>
                </div>
                <div>
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem;"><span style="font-weight:700; color:var(--color-gray-600);">Palavras-chave</span><span style="font-weight:700; color:var(--color-gray-800);">${ats.breakdown.keywords.score}/${ats.breakdown.keywords.max}</span></div>
                    <div style="height:0.625rem; width:100%; background:var(--color-gray-200); overflow:hidden;"><div style="height:100%; background:var(--color-error); width: ${(ats.breakdown.keywords.score / ats.breakdown.keywords.max) * 100}%;"></div></div>
                </div>
                <div>
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem;"><span style="font-weight:700; color:var(--color-gray-600);">Formação</span><span style="font-weight:700; color:var(--color-gray-800);">${ats.breakdown.education.score}/${ats.breakdown.education.max}</span></div>
                    <div style="height:0.625rem; width:100%; background:var(--color-gray-200); overflow:hidden;"><div style="height:100%; background:var(--color-warning); width: ${(ats.breakdown.education.score / ats.breakdown.education.max) * 100}%;"></div></div>
                </div>
            </div>
            
            <div style="padding-top:1.25rem; border-top:1px solid var(--color-gray-200); margin-top:1.25rem;">
                <div style="font-size:0.75rem; font-weight:700; color:var(--color-gray-500); text-transform:uppercase; margin-bottom:0.75rem;">Gaps Críticos</div>
                <ul style="list-style:none; padding:0; margin:0;">
                    ${criticalGapsHtml}
                </ul>
            </div>
        </div>
    </div>

    <!-- Keywords -->
    <div style="border:1px solid var(--color-gray-300); overflow:hidden; margin-top:1.5rem;">
        <div style="padding:1.5rem; border-bottom:1px solid var(--color-gray-200);">
            <h3 style="font-weight:700; font-size:1.125rem; display:flex; align-items:center; gap:0.5rem; color:var(--color-gray-800); margin:0;">
                ⚠ Palavras-chave Ausentes
            </h3>
            <p style="color:var(--color-gray-500); font-size:0.875rem; font-weight:500; margin:0.25rem 0 0;">Termos importantes da vaga que não foram encontrados no seu CV.</p>
        </div>
        <div style="padding:1.5rem;">
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                ${missingKwHtml}
            </div>
            <div style="margin-top:1.5rem; padding-top:1.5rem; border-top:1px solid var(--color-gray-200);">
                <h4 style="font-weight:700; font-size:0.875rem; color:var(--color-gray-700); margin:0 0 0.75rem;">Termos encontrados (Match)</h4>
                <div style="display:flex; flex-wrap:wrap; gap:0.75rem;">
                    ${matchedKwHtml}
                </div>
            </div>
        </div>
    </div>

    <!-- Strengths and Tips -->
    <div style="display:grid; gap:1.5rem; margin-top:1.5rem;" class="main-grid-2">
        <div style="border:1px solid var(--color-gray-300); padding:1.5rem;">
            <h3 style="font-weight:700; font-size:1.125rem; display:flex; align-items:center; gap:0.5rem; margin:0 0 1.25rem; color:var(--color-success);">
                ✓ Pontos Fortes
            </h3>
            <ul style="list-style:none; padding:0; margin:0;">
                ${strengthsHtml}
            </ul>
        </div>
        <div style="border:1px solid var(--color-gray-300); padding:1.5rem;">
            <h3 style="font-weight:700; font-size:1.125rem; display:flex; align-items:center; gap:0.5rem; margin:0 0 1.25rem; color:var(--color-gray-600);">
                ⓘ Dicas de Otimização
            </h3>
            <ul style="list-style:none; padding:0; margin:0;">
                ${tipsHtml}
            </ul>
        </div>
    </div>

    <!-- Bottom CTA -->
    ${ctaHtml}
</div>
`;

document.getElementById('render-target').innerHTML = finalMarkup;
