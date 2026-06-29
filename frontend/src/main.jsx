import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
          <Toaster
            position="bottom-right"
            richColors
            duration={2500}
            visibleToasts={4}
            expand={false}
            toastOptions={{
              style: {
                fontFamily: "var(--fuente-texto, 'Outfit', system-ui, sans-serif)",
                fontSize: '0.88rem',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                boxShadow: '0 8px 24px rgba(20, 45, 12, 0.12)',
              },
              className: 'toast-agrosmart',
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);