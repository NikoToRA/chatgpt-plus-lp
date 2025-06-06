import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// import { authService } from './services/auth';
import Layout from './components/Common/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import CustomerList from './components/Customers/CustomerList';
import CustomerDetail from './components/Customers/CustomerDetail';
import AccountLinking from './components/Accounts/AccountLinking';
import CompanySettings from './components/Company/CompanySettings';

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
          <Route path="/login" element={<Login onLogin={() => {}} />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<div style={{padding: '20px'}}><h1>管理画面ダッシュボード</h1><p>正常に動作しています</p></div>} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="accounts/link" element={<AccountLinking />} />
            <Route path="company" element={<CompanySettings />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;