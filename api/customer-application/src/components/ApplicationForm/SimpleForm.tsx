import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Alert
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

const steps = [
  '医療機関情報',
  '担当者情報', 
  'サービス選択',
  '見積確認',
  '決済方法',
  '申込確認'
];

const SimpleForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    organizationName: '',
    contactPerson: '',
    email: '',
    accountCount: 1
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              医療機関情報
            </Typography>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="医療機関名"
                value={formData.organizationName}
                onChange={handleInputChange('organizationName')}
                margin="normal"
              />
            </Box>
          </Paper>
        );
      case 1:
        return (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              担当者情報
            </Typography>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="担当者名"
                value={formData.contactPerson}
                onChange={handleInputChange('contactPerson')}
                margin="normal"
              />
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                margin="normal"
              />
            </Box>
          </Paper>
        );
      case 2:
        return (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              サービス選択
            </Typography>
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="アカウント数"
                type="number"
                value={formData.accountCount}
                onChange={handleInputChange('accountCount')}
                margin="normal"
                inputProps={{ min: 1, max: 100 }}
              />
            </Box>
          </Paper>
        );
      case 3:
        const totalPrice = formData.accountCount * 3000;
        return (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              見積確認
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1">
                アカウント数: {formData.accountCount}
              </Typography>
              <Typography variant="body1">
                月額料金: ¥{totalPrice.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        );
      case 4:
        return (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Alert severity="info">
              決済方法選択画面（実装予定）
            </Alert>
          </Paper>
        );
      case 5:
        return (
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              申込確認
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1">医療機関名: {formData.organizationName}</Typography>
              <Typography variant="body1">担当者: {formData.contactPerson}</Typography>
              <Typography variant="body1">メール: {formData.email}</Typography>
              <Typography variant="body1">アカウント数: {formData.accountCount}</Typography>
            </Box>
            <Alert severity="success" sx={{ mt: 2 }}>
              申込内容を確認しました。「申込完了」ボタンを押してください。
            </Alert>
          </Paper>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ width: '100%', mb: 4 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      
      {renderStepContent()}
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mt: 4,
        pt: 2,
        borderTop: 1,
        borderColor: 'divider'
      }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={currentStep === 0}
          startIcon={<ArrowBack />}
        >
          戻る
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForward />}
          >
            次へ
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={() => alert('申込完了しました！')}
          >
            申込完了
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default SimpleForm;