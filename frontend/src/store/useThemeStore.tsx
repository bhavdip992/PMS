import { create } from 'zustand';

const STORAGE_KEY = 'aero-pm-theme';

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(theme);
  }
}

const stored = localStorage.getItem(STORAGE_KEY) || 'dark';

export const useThemeStore = create((set) => ({
  theme: stored, // 'light' | 'dark' | 'system'

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },

  initTheme: () => {
    const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
    applyTheme(saved);
    set({ theme: saved });

    // Listen for OS preference changes when theme is 'system'
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      const current = localStorage.getItem(STORAGE_KEY) || 'dark';
      if (current === 'system') applyTheme('system');
    });
  },
}));
