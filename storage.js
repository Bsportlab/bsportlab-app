export default {
  getItem: async (k) => window.localStorage.getItem(k),
  setItem: async (k, v) => window.localStorage.setItem(k, v),
  removeItem: async (k) => window.localStorage.removeItem(k),
};
