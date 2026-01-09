// ===== UTILITY FUNCTIONS =====
export const generateId = () => Math.random().toString(36).substring(2, 15);

export const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
};

export const formatFullDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
};
