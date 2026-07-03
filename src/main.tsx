import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error:', message, 'at', source, ':', lineno, ':', colno, error);
};

window.onunhandledrejection = function(event) {
  console.error('Unhandled Rejection:', event.reason);
};

const root = document.getElementById('root');
if (!root) {
  console.error('Root element not found!');
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
