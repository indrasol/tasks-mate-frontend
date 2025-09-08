import { createRoot } from 'react-dom/client'
import App from './App.tsx'
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

createRoot(document.getElementById("root")!).render(<App />);
