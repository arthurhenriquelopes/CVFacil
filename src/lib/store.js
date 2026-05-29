/**
 * LocalStorage-based state manager for CVPorVaga.
 * Persists all user inputs across the multi-step flow.
 */

const STORE_KEY = 'cvporvaga_data';

const DEFAULT_STATE = {
    profile: {
        name: '',
        email: '',
        phone: '',
        location: '',
        summary: '',
        experiences: [],
        education: [],
        skills: [],
        languages: [],
        projects: [],
        certifications: [],
        linkedin: '',
        portfolio: '',
    },
    cvText: '',
    professionalGoal: '',
    targetRole: '',
    jobDescription: '',
    focus: 'experiences',
    template: 'modern',
    analysisResult: null,
    selectedSuggestions: [],
    selectedCertifications: null,
    generatedCV: null,
};

export function getState() {
    try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return { ...DEFAULT_STATE };
        return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch {
        return { ...DEFAULT_STATE };
    }
}

export function setState(partial) {
    const current = getState();
    const next = { ...current, ...partial };
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    return next;
}

export function updateProfile(partial) {
    const state = getState();
    const profile = { ...state.profile, ...partial };
    setState({ profile });
    return profile;
}

export function resetState() {
    localStorage.removeItem(STORE_KEY);
}

export function resetFlow() {
    setState({ flow: null });
}
