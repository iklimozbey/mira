// Tiny key-value store: localStorage on web, in-memory on native (no extra dependency).
const memory: Record<string, string> = {};

const ls = (): Storage | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
};

export const storage = {
  get(key: string): string | null {
    const store = ls();
    return store ? store.getItem(`mira_${key}`) : memory[key] ?? null;
  },
  set(key: string, value: string) {
    const store = ls();
    if (store) store.setItem(`mira_${key}`, value);
    else memory[key] = value;
  },
  remove(key: string) {
    const store = ls();
    if (store) store.removeItem(`mira_${key}`);
    else delete memory[key];
  },
};
