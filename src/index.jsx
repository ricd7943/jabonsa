import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Admin from './Admin';
import Landing from './Landing';
import NotFound from './NotFound';
import reportWebVitals from './reportWebVitals';

const path = window.location.pathname;

let Component;
if (path === '/admin') Component = Admin;
else if (path === '/tienda') Component = App;
else if (path === '/') Component = Landing;
else Component = NotFound;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
);

reportWebVitals();