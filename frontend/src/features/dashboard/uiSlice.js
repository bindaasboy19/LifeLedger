import { createSlice } from '@reduxjs/toolkit';

const THEME_STORAGE_KEY = 'lifeledger_theme';

const applyTheme = (theme) => {
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
  const isDark = resolvedTheme === 'dark';

  localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;

  return isDark;
};

const initialState = {
  darkMode: false,
  sidebarOpen: true
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    hydrateTheme(state) {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
      state.darkMode = applyTheme(stored);
    },
    toggleTheme(state) {
      state.darkMode = applyTheme(state.darkMode ? 'light' : 'dark');
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    }
  }
});

export const { hydrateTheme, toggleTheme, toggleSidebar } = uiSlice.actions;

export default uiSlice.reducer;
