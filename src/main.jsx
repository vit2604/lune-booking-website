import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { CurrencyProvider } from './i18n/CurrencyContext.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import { loadFonts } from './utils/loadFonts.js';
import { preloadHomeHeroImage } from './utils/preloadHero.js';
import './index.css';

loadFonts();
preloadHomeHeroImage();

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <CurrencyProvider>
            <App />
          </CurrencyProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
