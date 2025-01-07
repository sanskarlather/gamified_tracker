import React from 'react';
import ReactDOM from 'react-dom/client'; // Use 'react-dom/client' for modern React apps
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
