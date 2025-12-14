export const safeArray = <T>(v?: T[] | null): T[] => (Array.isArray(v) ? v : []);
