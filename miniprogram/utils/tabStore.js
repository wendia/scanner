// utils/tabStore.js
let current = '';
const listeners = new Set();

module.exports = {
  getCurrent() {
    return current;
  },
  setCurrent(route) {
    if (route === current) return current;
    current = route;
    // notify listeners
    listeners.forEach(fn => {
      try { fn(current); } catch (e) { console.error(e); }
    });
    return current;
  },
  subscribe(fn) {
    listeners.add(fn);
    // return unsubscribe function
    return () => listeners.delete(fn);
  },
  // optional: clear all (for testing)
  _reset() {
    current = '';
    listeners.clear();
  }
};
