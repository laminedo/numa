// Everything is saved in this browser only (localStorage).
const KEY = 'numa.v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
const state = Object.assign({ profile: null, saved: [], journal: {}, chat: [], brand: '' }, load());

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

export const store = {
  get profile() { return state.profile; },
  setProfile(p) { state.profile = { ...state.profile, ...p }; save(); },
  clearAll() { Object.assign(state, { profile: null, saved: [], journal: {}, chat: [], brand: '' }); save(); },

  get brand() { return state.brand || ''; },
  setBrand(v) { state.brand = v; save(); },

  get saved() { return state.saved; },
  toggleSaved(date, label) {
    const i = state.saved.findIndex((s) => s.date === date);
    if (i >= 0) state.saved.splice(i, 1); else state.saved.unshift({ date, label: label || date });
    save();
  },
  isSaved: (date) => state.saved.some((s) => s.date === date),

  journal: (iso) => state.journal[iso] || null,
  get journalDates() { return Object.keys(state.journal).sort().reverse(); },
  setJournal(iso, entry) { state.journal[iso] = { ...state.journal[iso], ...entry, at: Date.now() }; save(); },

  get chat() { return state.chat; },
  pushChat(msg) { state.chat.push(msg); state.chat = state.chat.slice(-60); save(); },
  clearChat() { state.chat = []; save(); },
};
