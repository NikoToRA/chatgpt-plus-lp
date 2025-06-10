import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Button, Alert } from '@mui/material';
import Layout from './components/Common/Layout';
import CompanySettings from './components/Company/CompanySettings';
import Dashboard from './components/Dashboard/Dashboard';
import CustomerList from './components/Customers/CustomerList';
import CustomerDetail from './components/Customers/CustomerDetail';
import CustomerNew from './components/Customers/CustomerNew';
import AccountLinking from './components/Accounts/AccountLinking';
import FormSubmissionList from './components/FormSubmissions/FormSubmissionList';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [error, setError] = useState<string | null>(null);
  const [supabaseTest, setSupabaseTest] = useState<string>('');

  // エラーハンドリング用
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(`JavaScript Error: ${event.message}`);
      console.error('Global error:', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(`Promise Rejection: ${event.reason}`);
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>アプリケーションエラー</h1>
        <p>{error}</p>
        <button onClick={() => setError(null)}>リトライ</button>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Supabaseテスト用デバッグボタン */}
      <Box sx={{ position: 'fixed', top: 10, right: 10, zIndex: 9999 }}>
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={async () => {
            try {
              console.log('🔄 App.tsx Supabaseテスト開始');
              setSupabaseTest('テスト中...');
              
              // Supabaseクライアントの動的インポート
              const { createClient } = await import('@supabase/supabase-js');
              const supabase = createClient(
                'https://xyztpwuoptomidmpasxy.supabase.co',
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5enRwd3VvcHRvbWlkbXBhc3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2Mzk1MjUsImV4cCI6MjA1OTIxNTUyNX0.tvRP0zLfgNz0mnlBjClI-4B8nsstAXbs7_NDhz3VEzg'
              );
              
              const { data, error } = await supabase
                .from('customers')
                .select('count', { count: 'exact', head: true });
              
              if (error) throw error;
              
              setSupabaseTest(`✅ Supabase接続成功! 顧客数: ${data || 0}`);
              console.log('✅ App.tsx Supabaseテスト成功');
            } catch (err) {
              setSupabaseTest(`❌ エラー: ${err instanceof Error ? err.message : 'Unknown error'}`);
              console.error('❌ App.tsx Supabaseテストエラー:', err);
            }
          }}
        >
          🔄 Supabase
        </Button>
        {supabaseTest && (
          <Alert severity={supabaseTest.includes('✅') ? 'success' : 'error'} sx={{ mt: 1, fontSize: '12px' }}>
            {supabaseTest}
          </Alert>
        )}
      </Box>
      
      <Router basename="/admin">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/new" element={<CustomerNew />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="accounts/link" element={<AccountLinking />} />
            <Route path="form-submissions" element={<FormSubmissionList />} />
            <Route path="company" element={<CompanySettings />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;