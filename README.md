# CvPorVaga

Gerador de currículos otimizados para ATS (Applicant Tracking System). Cada currículo é gerado sob medida para uma vaga específica, usando inteligência artificial para maximizar a compatibilidade com os filtros automáticos de recrutamento.

## O que faz

1. O usuário cola a descrição de uma vaga
2. A IA analisa as palavras-chave, requisitos e perfil do candidato
3. Um currículo é gerado com as keywords da vaga incorporadas organicamente no resumo, nas experiências e nas habilidades
4. O resultado pode ser baixado como PDF pronto para envio

## Como funciona por dentro

- **Análise ATS** — Extrai todas as keywords da vaga, calcula compatibilidade, identifica gaps críticos e sugere melhorias
- **Injeção de keywords** — As palavras-chave faltantes são incorporadas no resumo profissional, nos bullet points das experiências e na lista de habilidades, sem inventar experiências
- **Foco adaptável** — O usuário escolhe entre foco em experiências, habilidades técnicas ou resultados quantificados. Cada foco muda estruturalmente o output
- **Templates** — Modern (Inter, azul, avatar) e Classic (Space Grotesk, monocromático, formal)
- **KPI Dashboard** — Após a geração, mostra score antes/depois, cobertura de keywords, gaps corrigidos e lista de keywords aplicadas

## Stack

- Vite (dev server e build)
- HTML + JS + CSS vanilla (sem framework)
- Perplexity Sonar API (geração e análise via IA)
- html2pdf.js (export para PDF)

## Rodando localmente

```bash
npm install
cp .env.example .env  # configure sua API key
npm run dev
```

O servidor sobe em `http://localhost:5173`.

## Estrutura

```
src/
  api/sonar.js         # Cliente da API Perplexity
  prompts/
    analyze-job.js     # Prompt de análise ATS
    generate-cv.js     # Prompt de geração do CV
    goal-strategy.js   # Estratégias por objetivo
    frequency-strategy.js
  lib/
    store.js           # Estado via localStorage
    layout.js          # Navbar e layout
pages/
  step-*.html          # Fluxo passo a passo
  result.html          # Resultado com CV e KPI dashboard
```

## Licença

Projeto privado.
