
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// @ts-ignore CSS is handled by the bundler and has no TypeScript declarations.
import './globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
