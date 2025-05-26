import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { NotificationsProvider } from "./context/NotificationsContext";
import App from './App.jsx';

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
                <App />
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