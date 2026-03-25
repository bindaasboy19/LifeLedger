import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  darkMode: false,
  sidebarOpen: true
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    hydrateTheme(state) {
      const stored = localStorage.getItem('lifeledger_theme');
      state.darkMode = stored === 'dark';
      document.documentElement.classList.toggle('dark', state.darkMode);
    },
    toggleTheme(state) {
      state.darkMode = !state.darkMode;
      localStorage.setItem('lifeledger_theme', state.darkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', state.darkMode);
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    }
  }
});

export const { hydrateTheme, toggleTheme, toggleSidebar } = uiSlice.actions;

export default uiSlice.reducer;
