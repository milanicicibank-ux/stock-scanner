import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Scanner: Initializing...");

// Help diagnose runtime errors
window.onerror = function(message, source, lineno, colno, error) {
  const status = document.getElementById('status-text');
  if (status) {
    status.innerText = "Runtime Error: " + message;
    status.style.color = "red";
  }
  return false;
};

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
  console.log("Scanner: Mounted successfully.");
} else {
  console.error("Scanner: Root element missing.");
}
