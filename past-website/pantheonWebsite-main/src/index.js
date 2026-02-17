import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initGA, trackPageView } from './analytics';

// Initialize Google Analytics
initGA();
trackPageView(window.location.pathname);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
