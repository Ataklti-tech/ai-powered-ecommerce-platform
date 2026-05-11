export const loadState = (key) => {
  try {
    const serialized = localStorage.getItem(key);
    return serialized ? JSON.parse(serialized) : undefined;
  } catch {
    return undefined;
  }
};

export const saveState = (key, state) => {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    err;
  }
};

export const clearState = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    err;
  }
};
