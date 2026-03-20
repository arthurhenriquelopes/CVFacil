/**
 * Micro-prompt strategy based on application frequency.
 * @param {string} frequency 
 * @returns {string} Prompt instructions
 */
export function getFrequencyStrategyPrompt(frequency) {
    switch (frequency) {
        case '0':
            return 'ESTRATÉGIA DE ENVIO (INICIANTE): O candidato está apenas começando a busca. Gere uma estrutura impecável, clássica e muito segura que sirva como um excelente ponto de partida sólido para vagas similares.';
        case '1-5':
            return 'ESTRATÉGIA DE ENVIO (QUALITATIVA 1-5/sem): O candidato faz candidaturas cirúrgicas. Otimize o currículo de forma *extremamente customizada* para as nuances sutis descritas na vaga, valorizando o "match" cultural e técnico perfeito.';
        case '6-10':
            return 'ESTRATÉGIA DE ENVIO (ATIVA 6-10/sem): O candidato envia vários currículos. Equilibre muito bem a personalização com uma estrutura super clara e fácil de ser lida "em Z" (leitura dinâmica) por recrutadores.';
        case '10+':
            return 'ESTRATÉGIA DE ENVIO (VOLUME +10/sem): O candidato joga o "jogo dos números". Otimize para *passar com nota máxima no ATS de forma agressiva*: use as palavras-chave exatas nas 3 primeiras linhas de cada seção e simplifique radicalmente a leitura, removendo qualquer palavra "fofa" ou adjetivos desnecessários.';
        default:
            return '';
    }
}
