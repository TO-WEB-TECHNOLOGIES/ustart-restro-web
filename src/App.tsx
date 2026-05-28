import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
// import { useEffect } from 'react';
import { queryClient } from './api/queryClient';
import { router } from './routes';
import './styles/App.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ReactErrorBoundary } from './components/ReactErrorBoundary';

import { Toaster } from 'sonner';

function App() {
  // useEffect(() => {
  //   const handleContextMenu = (e: MouseEvent) => {
  //     e.preventDefault();
  //     alert("Right click disabled for security purposes.");
  //   };

  //   document.addEventListener('contextmenu', handleContextMenu);

  //   return () => {
  //     document.removeEventListener('contextmenu', handleContextMenu);
  //   };
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <Toaster position="top-right" richColors />
          <ReactErrorBoundary>
            <RouterProvider router={router} />
          </ReactErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
