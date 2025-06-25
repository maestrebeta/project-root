import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { NotificationsProvider } from "./context/NotificationsContext";
import { FocusModeProvider } from "./context/FocusModeContext.jsx";
import App from './App.jsx';
import './styles/focusMode.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

// Asegurarse de que solo se cree una vez
let root;
const container = document.getElementById('root');

if (!root) {
  root = createRoot(container);
}

// Función de renderizado segura
function renderApp() {
  root.render(
    <StrictMode>
      <ErrorBoundary 
        FallbackComponent={ErrorFallback}
        onReset={() => {
          // Opcional: Limpiar estado de la aplicación si es necesario
          window.location.reload();
        }}
      >
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemeProvider>
              <NotificationsProvider>
                <FocusModeProvider>
                  <App />
                </FocusModeProvider>
              </NotificationsProvider>
            </ThemeProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}

// Renderizar la aplicación
renderApp();