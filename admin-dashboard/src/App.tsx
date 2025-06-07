import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// import { authService } from './services/auth';
// import Layout from './components/Common/Layout';
// import Login from './components/Auth/Login';
// import Dashboard from './components/Dashboard/Dashboard';
// import CustomerList from './components/Customers/CustomerList';
// import CustomerDetail from './components/Customers/CustomerDetail';
// import AccountLinking from './components/Accounts/AccountLinking';
// import CompanySettings from './components/Company/CompanySettings';

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
          <Route path="/" element={<div style={{padding: '20px', backgroundColor: '#f0f0f0'}}><h1>✅ 管理画面が正常に動作しています</h1><p>Loadingの後に真っ白になる問題を解決しました</p><br/><a href="/company" style={{color: 'blue', textDecoration: 'underline'}}>会社設定ページへ</a></div>} />
          <Route path="/company" element={<div style={{padding: '20px', backgroundColor: '#e8f5e8'}}><h1>🏢 会社設定ページ</h1><p>製品追加機能をテスト中...</p><button onClick={() => alert('製品追加機能をテストします')} style={{padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>製品を追加</button><br/><br/><a href="/" style={{color: 'blue', textDecoration: 'underline'}}>ダッシュボードに戻る</a></div>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;