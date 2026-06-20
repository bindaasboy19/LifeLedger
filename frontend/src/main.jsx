import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from './App.jsx';
import { store } from './app/store.js';
import './styles/index.css';

const THEME_STORAGE_KEY = 'lifeledger_theme';
const storedTheme = globalThis.localStorage?.getItem(THEME_STORAGE_KEY) || 'light';
const resolvedTheme = storedTheme === 'dark' ? 'dark' : 'light';

document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
document.documentElement.dataset.theme = resolvedTheme;
document.documentElement.style.colorScheme = resolvedTheme;
globalThis.localStorage?.setItem(THEME_STORAGE_KEY, resolvedTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
);
