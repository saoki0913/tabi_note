export const generateId = () => crypto.randomUUID();

export const generateShareToken = () =>
  crypto.randomUUID().replace(/-/g, "").slice(0, 24);
