// ------------------- UTILITY: LOGGING -------------------
const listeners = [];
const entries = [];

export const Log = {
  add: (msg, color = '') => {
    entries.push({ text: msg, color });
    listeners.forEach(fn => fn(entries.slice(-100)));
  },
  battle: (msg) => Log.add(msg, 'text-yellow-200'),
  loot: (msg) => Log.add(msg, 'text-green-400'),
  subscribe: (fn) => listeners.push(fn),
  entries,
};
