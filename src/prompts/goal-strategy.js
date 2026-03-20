/**
 * Micro-prompt strategy based on the user's objective (goal).
 * @param {string} goal 
 * @returns {string} Prompt instructions
 */
export function getGoalStrategyPrompt(goal) {
    switch (goal) {
        case 'emprego':
            return 'ESTRATÉGIA (CONSEGUIR EMPREGO): O objetivo do candidato é conseguir um emprego o mais rápido possível. Otimize as experiências de forma muito direta, enfatizando a prontidão, resultados imediatos e competência atual para a vaga.';
        case 'transicao':
            return 'ESTRATÉGIA (TRANSIÇÃO DE CARREIRA): O objetivo é mudar de área. CRÍTICO: Extraia e destaque fortemente as *habilidades transferíveis* das experiências passadas que se aplicam aos requisitos dessa nova vaga. Traduza jargões da área anterior para termos que façam sentido na nova área.';
        case 'promocao':
            return 'ESTRATÉGIA (PROMOÇÃO INTERNA): O objetivo é crescer na mesma empresa. Destaque fortemente o conhecimento profundo da cultura/processos da empresa, resultados consistentes ao longo do tempo e qualquer iniciativa de liderança/proatividade.';
        case 'freelancer':
            return 'ESTRATÉGIA (FREELANCER/PJ): O currículo deve funcionar como um portfólio de prestação de serviços. Foque intensamente nos projetos entregues, impacto tangível (ROI, eficiência ganha) e capacidade de trabalhar com autonomia.';
        default:
            return '';
    }
}
