import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Typography,
  MenuItem,
  Select,
  FormControl,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Snackbar,
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  PersonAdd as PersonAddIcon 
} from '@mui/icons-material';
import { FormSubmission, Customer } from '../../types';
import { formSubmissionApi, customerApi } from '../../services/api';

const FormSubmissionList: React.FC = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [customerData, setCustomerData] = useState({
    facilityType: 'clinic' as const,
    phoneNumber: '',
    postalCode: '',
    address: '',
    plan: 'plus' as const,
    paymentMethod: 'card' as const,
    subscriptionMonths: 12,
    notes: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await formSubmissionApi.getAll();
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: FormSubmission['status']) => {
    try {
      await formSubmissionApi.updateStatus(id, newStatus);
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === id ? { ...sub, status: newStatus } : sub
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleConvertToCustomer = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setCustomerData({
      facilityType: 'clinic',
      phoneNumber: '',
      postalCode: '',
      address: '',
      plan: 'plus',
      paymentMethod: 'card',
      subscriptionMonths: 12,
      notes: `お問い合わせから変換: ${submission.purpose}`
    });
    setConvertDialogOpen(true);
  };

  const handleCustomerDataChange = (field: string, value: any) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const confirmConvertToCustomer = async () => {
    if (!selectedSubmission) return;

    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + customerData.subscriptionMonths);

      const newCustomer: Partial<Customer> = {
        email: selectedSubmission.email,
        organization: selectedSubmission.organization,
        name: selectedSubmission.name,
        phoneNumber: customerData.phoneNumber || undefined,
        postalCode: customerData.postalCode || undefined,
        address: customerData.address || undefined,
        facilityType: customerData.facilityType,
        requestedAccountCount: selectedSubmission.accounts,
        status: 'trial',
        plan: customerData.plan,
        paymentMethod: customerData.paymentMethod,
        subscriptionMonths: customerData.subscriptionMonths,
        expiresAt,
        lastActivityAt: new Date(),
        chatGptAccounts: []
      };

      await customerApi.create(newCustomer);
      await formSubmissionApi.updateStatus(selectedSubmission.id, 'converted');
      
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === selectedSubmission.id ? { ...sub, status: 'converted' } : sub
        )
      );
      
      setSnackbar({ 
        open: true, 
        message: '顧客への変換が完了しました', 
        severity: 'success' 
      });
      
      setConvertDialogOpen(false);
      setSelectedSubmission(null);
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: err instanceof Error ? err.message : '顧客変換に失敗しました', 
        severity: 'error' 
      });
    }
  };

  const getStatusColor = (status: FormSubmission['status']) => {
    switch (status) {
      case 'new': return 'error';
      case 'contacted': return 'warning';
      case 'converted': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getPurposeColor = (purpose: FormSubmission['purpose']) => {
    switch (purpose) {
      case 'お申し込み': return 'success';
      case '資料請求': return 'info';
      case 'その他': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        お問い合わせ一覧
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>受信日時</TableCell>
              <TableCell>医療機関名</TableCell>
              <TableCell>担当者名</TableCell>
              <TableCell>メールアドレス</TableCell>
              <TableCell>目的</TableCell>
              <TableCell>希望アカウント数</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>アクション</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>
                  {new Date(submission.created_at).toLocaleString('ja-JP')}
                </TableCell>
                <TableCell>{submission.organization}</TableCell>
                <TableCell>{submission.name}</TableCell>
                <TableCell>{submission.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={submission.purpose} 
                    color={getPurposeColor(submission.purpose)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{submission.accounts}</TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={submission.status}
                      onChange={(e) => handleStatusChange(submission.id, e.target.value as FormSubmission['status'])}
                    >
                      <MenuItem value="new">新規</MenuItem>
                      <MenuItem value="contacted">対応済み</MenuItem>
                      <MenuItem value="converted">成約</MenuItem>
                      <MenuItem value="closed">クローズ</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <IconButton size="small">
                    <VisibilityIcon />
                  </IconButton>
                  {(submission.status === 'new' || submission.status === 'contacted') && submission.purpose === 'お申し込み' && (
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleConvertToCustomer(submission)}
                      title="顧客に変換"
                    >
                      <PersonAddIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {submissions.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            お問い合わせがありません
          </Typography>
        </Box>
      )}

      {/* 顧客変換ダイアログ */}
      <Dialog open={convertDialogOpen} onClose={() => setConvertDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>顧客に変換</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box>
              <Typography variant="h6" gutterBottom>
                基本情報
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <TextField
                    label="医療機関名"
                    value={selectedSubmission.organization}
                    disabled
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="担当者名"
                    value={selectedSubmission.name}
                    disabled
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="メールアドレス"
                    value={selectedSubmission.email}
                    disabled
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="希望アカウント数"
                    value={selectedSubmission.accounts}
                    disabled
                    fullWidth
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                追加情報
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <Typography variant="body2" sx={{ mb: 1 }}>施設種別</Typography>
                    <Select
                      value={customerData.facilityType}
                      onChange={(e) => handleCustomerDataChange('facilityType', e.target.value)}
                    >
                      <MenuItem value="hospital">病院</MenuItem>
                      <MenuItem value="clinic">クリニック</MenuItem>
                      <MenuItem value="dental_clinic">歯科医院</MenuItem>
                      <MenuItem value="pharmacy">薬局</MenuItem>
                      <MenuItem value="nursing_home">介護施設</MenuItem>
                      <MenuItem value="other">その他</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="電話番号"
                    value={customerData.phoneNumber}
                    onChange={(e) => handleCustomerDataChange('phoneNumber', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label="郵便番号"
                    value={customerData.postalCode}
                    onChange={(e) => handleCustomerDataChange('postalCode', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={9}>
                  <TextField
                    label="住所"
                    value={customerData.address}
                    onChange={(e) => handleCustomerDataChange('address', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <Typography variant="body2" sx={{ mb: 1 }}>プラン</Typography>
                    <Select
                      value={customerData.plan}
                      onChange={(e) => handleCustomerDataChange('plan', e.target.value)}
                    >
                      <MenuItem value="basic">Basic</MenuItem>
                      <MenuItem value="plus">Plus</MenuItem>
                      <MenuItem value="enterprise">Enterprise</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <Typography variant="body2" sx={{ mb: 1 }}>支払い方法</Typography>
                    <Select
                      value={customerData.paymentMethod}
                      onChange={(e) => handleCustomerDataChange('paymentMethod', e.target.value)}
                    >
                      <MenuItem value="card">クレジットカード</MenuItem>
                      <MenuItem value="invoice">請求書</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    label="契約期間（月）"
                    type="number"
                    value={customerData.subscriptionMonths}
                    onChange={(e) => handleCustomerDataChange('subscriptionMonths', parseInt(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="備考"
                    value={customerData.notes}
                    onChange={(e) => handleCustomerDataChange('notes', e.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialogOpen(false)}>キャンセル</Button>
          <Button onClick={confirmConvertToCustomer} variant="contained" color="primary">
            顧客として登録
          </Button>
        </DialogActions>
      </Dialog>

      {/* スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FormSubmissionList;