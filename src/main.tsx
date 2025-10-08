import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'
import { toast, Toaster } from 'sonner'

const GTAG_DISABLE = import.meta.env.VITE_GTAG_DISABLE || 'false';
const GA_ID = import.meta.env.VITE_GTAG_ID || 'G-GKEB4TKN5X';

declare global {
  interface Window {
    dataLayer: any[];
  }
}
let gtagScript: HTMLScriptElement | null = null;

if ((GTAG_DISABLE.toLowerCase() === 'false' || GTAG_DISABLE.toLowerCase() === '0' || GTAG_DISABLE.toLowerCase() === 'off') && GA_ID) {
  gtagScript = document.createElement('script');
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  gtagScript.async = true;
  gtagScript.onload = () => {
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }

    gtag('js', new Date());
    gtag('config', GA_ID);
  };

  document.head.appendChild(gtagScript);
}
else if (gtagScript && document.head.contains(gtagScript)) {
  document.head.removeChild(gtagScript);
  gtagScript = null;
  // Optional: reset dataLayer
  window.dataLayer = [];
}

const BUILD_ID = (import.meta.env.VITE_BUILD_ID as string) || '';

function shouldDeferUpdate() {
  const key = `update-deferred:${BUILD_ID}`;
  const until = Number(localStorage.getItem(key) || 0);
  return Date.now() < until;
}

function deferUpdate(hours = 4) {
  const key = `update-deferred:${BUILD_ID}`;
  const until = Date.now() + hours * 60 * 60 * 1000;
  localStorage.setItem(key, String(until));
}

let updateToastId: string | number | undefined;
function showUpdateToast(registration: ServiceWorkerRegistration) {
  if (!registration.waiting) return;

  if (shouldDeferUpdate()) return;

  // Only one toast at a time
  if (updateToastId) return;

  updateToastId = toast('A new version of TasksMate is available.', {
    description: 'Update now to get the latest features and fixes.',
    action: {
      label: 'Update now',
      onClick: () => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        toast.loading('Updating…', { duration: 1500 });
      },
    },
    cancel: {
      label: 'Later',
      onClick: () => {
        deferUpdate(4);
        updateToastId = undefined;
      },
    },
    duration: 10000,
    onDismiss: () => { updateToastId = undefined; },
  });
}

// Multi-tab coordination: only one tab triggers skipWaiting
const updateChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('sw-updates') : null;
updateChannel?.addEventListener('message', (ev) => {
  if (ev.data === 'activate-now') {
    toast.loading('Updating…', { duration: 1200 });
  }
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

// Show loading state immediately
rootElement.innerHTML = `
  <div style="
    min-height: 100vh; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    background: #ffffff;
    font-family: Inter, system-ui, sans-serif;
  ">
    <div style="text-align: center;">
      <div style="
        width: 40px; 
        height: 40px; 
        border: 3px solid #e5e7eb; 
        border-top: 3px solid #3b82f6; 
        border-radius: 50%; 
        animation: spin 1s linear infinite; 
        margin: 0 auto 16px;
      "></div>
      <p style="color: #6b7280; font-size: 14px;">Loading TasksMate...</p>
    </div>
  </div>
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
`;


// Online/offline notifications
let offlineNotified = false;
window.addEventListener('offline', () => {
  if (!offlineNotified) {
    offlineNotified = true;
    toast.error('You are offline. Some actions may not sync.');
  }
});
window.addEventListener('online', () => {
  offlineNotified = false;
  toast.success('Back online. Syncing may resume.');
});

root.render(
  <ErrorBoundary>
    <App />
    <Toaster richColors position="top-center" />
  </ErrorBoundary>
);

// Persist storage
if (navigator.storage?.persist) {
  navigator.storage.persist();
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const swUrl = `/service-worker.js?v=${encodeURIComponent(BUILD_ID)}`;
  let hasRefreshed = false;
  const reloadOnControllerChange = () => {
    if (hasRefreshed) return;
    hasRefreshed = true;
    window.location.reload();
  };

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);

        // If a new worker is already waiting (e.g., returning to the app)
        if (registration.waiting) {
          showUpdateToast(registration);
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Broadcast so only one tab triggers activation UX
              updateChannel?.postMessage('activate-now');
              showUpdateToast(registration);
            }
          });
        });

        navigator.serviceWorker.addEventListener('controllerchange', reloadOnControllerChange);

        // Update checks: initial (30s), hourly, on tab focus
        setTimeout(() => registration.update(), 30_000);
        setInterval(() => registration.update(), 60 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().then(() => {
              if (registration.waiting && !shouldDeferUpdate()) {
                showUpdateToast(registration);
              }
            });
          }
        });

        // Expose manual trigger and re-prompt
        (window as any).checkForUpdates = async () => {
          await registration.update();
          if (registration.waiting) showUpdateToast(registration);
        };
        (window as any).promptUpdateNow = () => {
          if (registration.waiting) showUpdateToast(registration);
        };

        // Warm-cache assets for offline
        navigator.serviceWorker.ready.then((reg) => {
          const assets = performance.getEntriesByType('resource')
            .map((e) => (e as PerformanceResourceTiming).name)
            .filter((u) => u.startsWith(location.origin + '/assets/'));
          reg.active?.postMessage({ type: 'WARM_CACHE', assets });
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}