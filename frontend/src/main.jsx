import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from './App.jsx';
import { store } from './app/store.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import 'leaflet/dist/leaflet.css';
import './styles/index.css';

document.documentElement.classList.add('dark');
document.documentElement.dataset.theme = 'dark';
document.documentElement.style.colorScheme = 'dark';
globalThis.localStorage?.setItem('lifeledger_theme', 'dark');

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </ErrorBoundary>
);
