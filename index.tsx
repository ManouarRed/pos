import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import './index.css'; // Import the main CSS file

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Initial data loading is now handled by productService.ts using API calls.
// The setup wizard handles initial configuration if 'appSetupComplete' flag is not set.
// Client-side session persistence for currentUser info still uses localStorage directly in App.tsx.

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);