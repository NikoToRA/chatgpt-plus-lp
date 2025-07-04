import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../../services/api';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const steps = ['基本情報', '契約情報', '確認'];

export default function CustomerNew() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // 基本情報
    organization: '',
    name: '',
    email: '',
    phoneNumber: '',
    postalCode: '',
    address: '',
    facilityType: 'hospital',
    
    // 契約情報
    plan: 'plus',
    requestedAccountCount: 1,
    paymentMethod: 'card',
    status: 'trial',
    billingCycle: 'monthly',
    subscriptionMonths: 1,
    
    // その他
    notes: ''
  });

  const handleInputChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSave = async () => {
    try {
      // 期限日を計算
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + formData.subscriptionMonths);

      // 顧客データを構築
      const customerData = {
        email: formData.email,
        organization: formData.organization,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        postalCode: formData.postalCode,
        address: formData.address,
        facilityType: formData.facilityType as 'hospital' | 'clinic' | 'dental_clinic' | 'pharmacy' | 'nursing_home' | 'other',
        requestedAccountCount: formData.requestedAccountCount,
        status: formData.status as 'trial' | 'active' | 'suspended' | 'cancelled',
        plan: formData.plan as 'basic' | 'plus' | 'enterprise',
        paymentMethod: formData.paymentMethod as 'card' | 'invoice',
        subscriptionMonths: formData.subscriptionMonths,
        expiresAt,
        lastActivityAt: new Date(),
        chatGptAccounts: [],
        notes: formData.notes
      };

      // Supabaseに保存
      const newCustomer = await customerApi.create(customerData);
      
      alert('新規顧客をSupabaseに登録しました！');
      navigate('/customers');
    } catch (error) {
      console.error('Error creating customer:', error);
      const errorMessage = error instanceof Error ? error.message : '顧客登録に失敗しました。';
      alert(`顧客登録エラー: ${errorMessage}`);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="組織名"
                value={formData.organization}
                onChange={handleInputChange('organization')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="担当者名"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label="メールアドレス"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="電話番号"
                value={formData.phoneNumber}
                onChange={handleInputChange('phoneNumber')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="郵便番号"
                value={formData.postalCode}
                onChange={handleInputChange('postalCode')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="住所"
                value={formData.address}
                onChange={handleInputChange('address')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>施設タイプ</InputLabel>
                <Select
                  value={formData.facilityType}
                  onChange={handleInputChange('facilityType')}
                  label="施設タイプ"
                >
                  <MenuItem value="hospital">病院</MenuItem>
                  <MenuItem value="clinic">クリニック</MenuItem>
                  <MenuItem value="dental_clinic">歯科医院</MenuItem>
                  <MenuItem value="other">その他</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>プラン</InputLabel>
                <Select
                  value={formData.plan}
                  onChange={handleInputChange('plan')}
                  label="プラン"
                >
                  <MenuItem value="plus">Plus</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="アカウント数"
                value={formData.requestedAccountCount}
                onChange={handleInputChange('requestedAccountCount')}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>支払い方法</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  onChange={handleInputChange('paymentMethod')}
                  label="支払い方法"
                >
                  <MenuItem value="card">クレジットカード</MenuItem>
                  <MenuItem value="invoice">請求書</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  label="ステータス"
                >
                  <MenuItem value="trial">お試し</MenuItem>
                  <MenuItem value="active">アクティブ</MenuItem>
                  <MenuItem value="suspended">一時停止</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="備考"
                value={formData.notes}
                onChange={handleInputChange('notes')}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              以下の内容で顧客を登録します。内容を確認してください。
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={6}><strong>組織名:</strong></Grid>
              <Grid item xs={6}>{formData.organization}</Grid>
              <Grid item xs={6}><strong>担当者:</strong></Grid>
              <Grid item xs={6}>{formData.name}</Grid>
              <Grid item xs={6}><strong>メール:</strong></Grid>
              <Grid item xs={6}>{formData.email}</Grid>
              <Grid item xs={6}><strong>プラン:</strong></Grid>
              <Grid item xs={6}>{formData.plan}</Grid>
              <Grid item xs={6}><strong>アカウント数:</strong></Grid>
              <Grid item xs={6}>{formData.requestedAccountCount}</Grid>
            </Grid>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">新規顧客登録</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
        >
          顧客一覧に戻る
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          {renderStepContent()}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            戻る
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={<SaveIcon />}
            >
              顧客を登録
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              次へ
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}