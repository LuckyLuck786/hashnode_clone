import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider, applyTheme, readStoredTheme } from './context/ThemeContext.jsx';
import './styles/index.css';

// Applied before the first render so a dark-mode reader never sees a flash of light paper.
applyTheme(readStoredTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Outermost so a crash anywhere below still renders a recoverable page. */}
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);