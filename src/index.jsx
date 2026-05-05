import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Admin from './Admin';
import reportWebVitals from './reportWebVitals';

const path = window.location.pathname;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {path === '/admin' ? <Admin /> : <App />}
  </React.StrictMode>
);

reportWebVitals();