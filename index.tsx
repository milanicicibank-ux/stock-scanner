import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Terminal: Starting initialization sequence...");

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Terminal: React mount successful.");
  } catch (error) {
    console.error("Terminal: Critical mount error:", error);
    const textEl = document.getElementById('loading-text');
    if (textEl) textEl.innerText = "Error: Failed to launch engine. Check console.";
  }
} else {
  console.error("Terminal: Root element not found in HTML.");
}
