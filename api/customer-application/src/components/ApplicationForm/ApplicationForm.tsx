import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Button,
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

import StepIndicator from './StepIndicator';
import OrganizationInfoStep from './OrganizationInfo';
import ContactInfoStep from './ContactInfo';
import ServiceSelectionStep from './ServiceSelection';
import EstimateCalculator from './EstimateCalculator';

import {
  FormStep,
  OrganizationInfo,
  ContactInfo,
  ServiceSelection,
  ApplicationSubmission
} from '../../types/application';
import { calculatePricing } from '../../utils/pricing';

// バリデーションスキーマ
const organizationSchema = yup.object({
  organizationName: yup.string()
    .required('医療機関名は必須です')
    .max(200, '医療機関名は200文字以内で入力してください'),
  facilityType: yup.string()
    .required('施設種別を選択してください'),
  postalCode: yup.string()
    .required('郵便番号は必須です')
    .matches(/^\d{7}$/, '郵便番号は7桁の数字で入力してください'),
  address: yup.string()
    .required('住所は必須です')
    .max(500, '住所は500文字以内で入力してください'),
  representativeName: yup.string()
    .required('代表者名は必須です')
    .max(100, '代表者名は100文字以内で入力してください')
});

const contactSchema = yup.object({
  contactPerson: yup.string()
    .required('担当者名は必須です')
    .max(100, '担当者名は100文字以内で入力してください'),
  email: yup.string()
    .required('メールアドレスは必須です')
    .email('正しいメールアドレスを入力してください'),
  phoneNumber: yup.string()
    .required('電話番号は必須です')
    .matches(/^[\d-]+$/, '電話番号は数字とハイフンで入力してください'),
  department: yup.string().max(100, '部署名は100文字以内で入力してください')
});

const serviceSchema = yup.object({
  requestedAccountCount: yup.number()
    .required('アカウント数は必須です')
    .min(1, '最低1アカウント必要です')
    .max(100, '最大100アカウントまでです'),
  billingCycle: yup.string()
    .required('お支払いサイクルを選択してください'),
  startDate: yup.date()
    .required('利用開始希望日を入力してください')
    .min(new Date(), '利用開始日は今日以降の日付を選択してください')
});

const ApplicationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // フォーム管理
  const organizationForm = useForm<OrganizationInfo>({
    resolver: yupResolver(organizationSchema),
    defaultValues: {
      organizationName: '',
      facilityType: 'hospital',
      postalCode: '',
      address: '',
      representativeName: ''
    }
  });

  const contactForm = useForm<ContactInfo>({
    resolver: yupResolver(contactSchema),
    defaultValues: {
      contactPerson: '',
      email: '',
      phoneNumber: '',
      department: ''
    }
  });

  const serviceForm = useForm<ServiceSelection>({
    resolver: yupResolver(serviceSchema),
    defaultValues: {
      requestedAccountCount: 1,
      billingCycle: 'monthly',
      startDate: new Date()
    }
  });

  // サービス選択の監視
  const watchAccountCount = serviceForm.watch('requestedAccountCount', 1);
  const watchBillingCycle = serviceForm.watch('billingCycle', 'monthly');

  // 見積計算
  const pricing = calculatePricing(watchAccountCount, watchBillingCycle);

  // ステップ進行
  const handleNext = async () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = await organizationForm.trigger();
        break;
      case 2:
        isValid = await contactForm.trigger();
        break;
      case 3:
        isValid = await serviceForm.trigger();
        break;
      case 4:
      case 5:
        isValid = true;
        break;
    }

    if (isValid && currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as FormStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as FormStep);
    }
  };

  // 申込送信
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submission: ApplicationSubmission = {
        organizationInfo: organizationForm.getValues(),
        contactInfo: contactForm.getValues(),
        serviceSelection: serviceForm.getValues(),
        paymentMethod: {
          paymentType: 'card', // 仮設定
          agreementAccepted: true,
          privacyPolicyAccepted: true
        }
      };

      // TODO: API送信実装
      console.log('申込データ:', submission);
      
      // 仮の成功処理
      alert('申込が完了しました。ご登録のメールアドレスに確認メールをお送りしました。');
      
    } catch (error) {
      setSubmitError('申込送信に失敗しました。しばらく後に再試行してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ステップ別コンテンツ
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <OrganizationInfoStep
            control={organizationForm.control}
            errors={organizationForm.formState.errors}
          />
        );
      case 2:
        return (
          <ContactInfoStep
            control={contactForm.control}
            errors={contactForm.formState.errors}
          />
        );
      case 3:
        return (
          <ServiceSelectionStep
            control={serviceForm.control}
            errors={serviceForm.formState.errors}
            watchAccountCount={watchAccountCount}
          />
        );
      case 4:
        return (
          <EstimateCalculator
            pricing={pricing}
            accountCount={watchAccountCount}
            billingCycle={watchBillingCycle}
          />
        );
      case 5:
        return (
          <Box>
            {/* TODO: 決済方法選択コンポーネント */}
            <Alert severity="info">
              決済方法選択画面（実装予定）
            </Alert>
          </Box>
        );
      case 6:
        return (
          <Box>
            {/* TODO: 確認画面コンポーネント */}
            <Alert severity="success">
              申込確認画面（実装予定）
            </Alert>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <StepIndicator currentStep={currentStep} />
      
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}
      
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
          disabled={currentStep === 1 || isSubmitting}
          startIcon={<ArrowBack />}
        >
          戻る
        </Button>
        
        {currentStep < 6 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isSubmitting}
            endIcon={<ArrowForward />}
          >
            次へ
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              '申込完了'
            )}
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default ApplicationForm;