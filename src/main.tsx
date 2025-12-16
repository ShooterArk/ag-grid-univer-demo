import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Note: StrictMode removed due to compatibility issues with Univer's lifecycle management
// Univer manages its own internal state and doesn't handle React 18's double-mount behavior well
createRoot(document.getElementById('root')!).render(<App />);
