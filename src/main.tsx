import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

// // Optional: Show SW updates
// import { registerSW } from 'virtual:pwa-register';

// registerSW({
//   onNeedRefresh() {
//     // You can show a toast or modal here
//     console.log('New content available. Refresh the page.');
//   },
//   onOfflineReady() {
//     console.log('App ready to work offline');
//   },
// });

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

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
