import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { getWebsiteSettings } from '../admin/services/adminSettingsService.js';
import Footer from './Footer.jsx';
import Navbar from './Navbar.jsx';

const CustomerChatWidget = lazy(() => import('./chat/CustomerChatWidget.jsx'));

export default function GuestLayout() {
  const [settings, setSettings] = useState(getWebsiteSettings());

  useEffect(() => {
    const applyTheme = (nextSettings) => {
      const branding = JSON.parse(localStorage.getItem('lune_branding_settings') || '{}');
      document.documentElement.style.setProperty('--lune-button-color', branding.buttonColor || '#b08a4b');
      document.documentElement.style.setProperty('--lune-accent-color', branding.accentColor || '#b08a4b');
      document.documentElement.style.setProperty('--lune-page-bg', branding.backgroundColor || '#fbfaf7');
      setSettings(nextSettings);
    };
    const refresh = () => applyTheme(getWebsiteSettings());
    refresh();
    window.addEventListener('lune:settings-updated', refresh);
    return () => window.removeEventListener('lune:settings-updated', refresh);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {settings.websiteStatus === 'maintenance' ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
          {settings.maintenanceMessage}
        </div>
      ) : null}
      <main className="flex-1">
        <Outlet />
      </main>
      <Suspense fallback={null}>
        <CustomerChatWidget />
      </Suspense>
      <Footer />
    </div>
  );
}
