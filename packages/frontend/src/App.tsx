import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ModalProvider } from './contexts/ModalContext';
import { ConfirmDialogProvider } from './components/Providers/ConfirmDialogProvider';
import { AnalysisViewerProvider } from './context/AnalysisViewerContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ModalProvider>
          <ConfirmDialogProvider>
            <AnalysisViewerProvider>
              <RouterProvider router={router} />
            </AnalysisViewerProvider>
          </ConfirmDialogProvider>
        </ModalProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
