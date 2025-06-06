import React, { useState } from 'react';
import {
  Container,
  Paper,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
} from '@mui/material';
import { authService } from '../../services/auth';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.login();
      onLogin();
    } catch (error: any) {
      setError(error.message || 'ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 開発環境用の仮ログイン
  const handleDevLogin = () => {
    localStorage.setItem('authToken', 'dev-token');
    onLogin();
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center">
            ChatGPT Plus 管理画面
          </Typography>
          
          <Typography variant="body2" align="center" sx={{ mt: 2, mb: 3 }}>
            管理者アカウントでログインしてください
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'ログイン中...' : 'Azure ADでログイン'}
          </Button>

          {process.env.NODE_ENV === 'development' && (
            <>
              <Divider sx={{ my: 2 }}>または</Divider>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleDevLogin}
              >
                開発用ログイン（テスト用）
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}