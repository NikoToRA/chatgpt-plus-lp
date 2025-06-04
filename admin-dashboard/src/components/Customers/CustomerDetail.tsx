import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { customerApi, accountApi } from '../../services/api';
import { Customer } from '../../types';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    status: '',
    plan: '',
    chatGptEmail: '',
  });

  useEffect(() => {
    if (id) {
      loadCustomer(id);
    }
  }, [id]);

  const loadCustomer = async (customerId: string) => {
    try {
      const data = await customerApi.getById(customerId);
      setCustomer(data);
      setFormData({
        status: data.status,
        plan: data.plan,
        chatGptEmail: data.chatGptEmail || '',
      });
    } catch (error) {
      console.error('Failed to load customer:', error);
      // 開発用のダミーデータ
      const dummyCustomer: Customer = {
        id: customerId,
        email: 'yamada@example.com',
        organization: '株式会社山田商事',
        name: '山田太郎',
        chatGptEmail: 'yamada@chatgpt.com',
        status: 'active',
        plan: 'plus',
        paymentMethod: 'card',
        createdAt: new Date('2025-05-01'),
        lastActivityAt: new Date(),
        stripeCustomerId: 'cus_123456789',
      };
      setCustomer(dummyCustomer);
      setFormData({
        status: dummyCustomer.status,
        plan: dummyCustomer.plan,
        chatGptEmail: dummyCustomer.chatGptEmail || '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!customer) return;

    setIsSaving(true);
    setMessage(null);

    try {
      await customerApi.update(customer.id, formData);
      setMessage({ type: 'success', text: '顧客情報を更新しました。' });
      
      // ChatGPTアカウントが新規に設定された場合
      if (formData.chatGptEmail && !customer.chatGptEmail) {
        await accountApi.provision(customer.id);
        setMessage({ type: 'success', text: '顧客情報を更新し、アカウントをプロビジョニングしました。' });
      }
    } catch (error) {
      console.error('Failed to save customer:', error);
      setMessage({ type: 'error', text: '更新に失敗しました。' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (!customer) {
    return <Typography>顧客が見つかりません。</Typography>;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
          sx={{ mr: 2 }}
        >
          戻る
        </Button>
        <Typography variant="h4">
          顧客詳細
        </Typography>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              基本情報
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="顧客名"
                  value={customer.name}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="組織名"
                  value={customer.organization}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  value={customer.email}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ChatGPTアカウント"
                  value={formData.chatGptEmail}
                  onChange={handleChange('chatGptEmail')}
                  placeholder="未設定"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>ステータス</InputLabel>
                  <Select
                    value={formData.status}
                    label="ステータス"
                    onChange={handleChange('status')}
                  >
                    <MenuItem value="trial">お試し</MenuItem>
                    <MenuItem value="active">アクティブ</MenuItem>
                    <MenuItem value="suspended">一時停止</MenuItem>
                    <MenuItem value="cancelled">キャンセル</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>プラン</InputLabel>
                  <Select
                    value={formData.plan}
                    label="プラン"
                    onChange={handleChange('plan')}
                  >
                    <MenuItem value="basic">Basic</MenuItem>
                    <MenuItem value="plus">Plus</MenuItem>
                    <MenuItem value="enterprise">Enterprise</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                契約情報
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  支払い方法
                </Typography>
                <Typography>
                  {customer.paymentMethod === 'card' ? 'クレジットカード' : '請求書'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  登録日
                </Typography>
                <Typography>
                  {new Date(customer.createdAt).toLocaleDateString('ja-JP')}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  最終アクティビティ
                </Typography>
                <Typography>
                  {new Date(customer.lastActivityAt).toLocaleDateString('ja-JP')}
                </Typography>
              </Box>
              {customer.stripeCustomerId && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Stripe顧客ID
                  </Typography>
                  <Typography variant="body2">
                    {customer.stripeCustomerId}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}