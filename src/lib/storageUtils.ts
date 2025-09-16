

export const clearPersistedStateFor = (page: 'projects' | 'tasks' | 'bugs' | 'tester') => {
    try {
        const prefix = `${page}:`;
        // Remove all localStorage keys created by usePersistedParam for this page
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        }
    } catch { }
};

export default clearPersistedStateFor;