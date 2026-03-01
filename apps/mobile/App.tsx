import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/auth';
import { AppNavigator } from './src/navigation/AppNavigator';

const isProdEnv = process.env.EXPO_PUBLIC_ENV === 'production';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: isProdEnv ? 1 : 0,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
