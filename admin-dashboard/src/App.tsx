import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button, Alert } from '@mui/material';
import CompanySettings from './components/Company/CompanySettings';
import Dashboard from './components/Dashboard/Dashboard';
import CustomerList from './components/Customers/CustomerList';

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
      <Router>
        <Routes>
          <Route path="/" element={
            <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                ✅ ChatGPT Plus 管理ダッシュボードが正常に動作しています
              </Alert>
              <Typography variant="h4" gutterBottom>
                🏥 医療機関向け管理画面
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                このダッシュボードでは、医療機関向けChatGPT Plusサービスの管理が行えます。
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" color="primary" href="/dashboard">
                  📊 ダッシュボード
                </Button>
                <Button variant="contained" color="secondary" href="/customers">
                  👥 顧客管理
                </Button>
                <Button variant="outlined" color="primary" href="/company">
                  🏢 会社設定
                </Button>
              </Box>
            </Box>
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/company" element={<CompanySettings />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;