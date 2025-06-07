import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Container,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import { ArrowBack, ArrowForward, Send } from '@mui/icons-material';

import Step1ServiceSelection from './Step1ServiceSelection';
import Step2BasicInformation from './Step2BasicInformation';
import Step3EstimateConfirmation from './Step3EstimateConfirmation';
import Step4PaymentMethod from './Step4PaymentMethod';
import Step5Completion from './Step5Completion';

import {
  OptimizedFormStep,
  ServiceSelection,
  BasicInformation,
  PaymentInformation,
  OptimizedApplicationSubmission,
  PricingCalculation,
  FORM_STEPS
} from '../../types/optimizedApplication';

const OptimizedApplicationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<OptimizedFormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string>('');
  const [pricing, setPricing] = useState<PricingCalculation>({
    basePrice: 3000,
    discountAmount: 0,
    subtotal: 3000,
    taxAmount: 300,
    totalAmount: 3300,
    billingCycle: 'monthly',
    accountCount: 1
  });

  // フォーム管理
  const serviceForm = useForm<ServiceSelection>({
    defaultValues: {
      planId: 'prod-1',
      requestedAccountCount: 1,
      billingCycle: 'monthly' as const,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1週間後
    }
  });

  const basicForm = useForm<BasicInformation>({
    defaultValues: {
      organizationName: '',
      facilityType: 'hospital',
      phoneNumber: '',
      contactPerson: '',
      department: '',
      email: '',
      contactPhone: ''
    }
  });

  const paymentForm = useForm<PaymentInformation>({
    defaultValues: {
      paymentMethod: 'card',
      cardHolderName: '',
      billingContact: '',
      billingEmail: '',
      termsAccepted: false,
      privacyAccepted: false,
      privacyUnderstandingConfirmed: false
    }
  });

  // 見積更新コールバック
  const handlePricingUpdate = useCallback((newPricing: PricingCalculation) => {
    setPricing(newPricing);
  }, []);

  // ステップ進行
  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as OptimizedFormStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OptimizedFormStep);
    }
  };

  // 申込送信
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // バリデーション
      const paymentData = paymentForm.getValues();
      if (!paymentData.termsAccepted || !paymentData.privacyAccepted || !paymentData.privacyUnderstandingConfirmed) {
        throw new Error('利用規約とプライバシーポリシーへの同意が必要です');
      }

      const submission: OptimizedApplicationSubmission = {
        serviceSelection: serviceForm.getValues(),
        basicInformation: basicForm.getValues(),
        paymentInformation: paymentData,
        submittedAt: new Date()
      };

      // 申込ID生成（実際はサーバーサイドで生成）
      const newApplicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      setApplicationId(newApplicationId);
      
      // クレジットカード決済の場合はStripeダミー処理
      if (paymentData.paymentMethod === 'card') {
        // Stripeダミー処理（実際はStripe Elements使用）
        await simulateStripePayment();
      }
      
      // Azure Functions APIへの送信実装
      console.log('申込データ:', submission);
      
      // 本番環境とローカル環境でのAPI URLを判定
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://chatgpt-plus-api.azurewebsites.net/api'
        : '/api';
      
      const response = await fetch(`${apiBaseUrl}/customer-application-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }

      // 実際のAPIから返されたapplicationIdを使用
      setApplicationId(result.applicationId);
      
      // TODO: メール送信
      // await sendConfirmationEmail(submission);
      
      // 成功時にStep 5へ
      setCurrentStep(5);
      
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '申込送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stripeダミー決済処理
  const simulateStripePayment = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // ダミーのStripe処理をシミュレート
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90%の成功率でダミー
        if (success) {
          console.log('✅ Stripe決済シミュレーション成功');
          resolve();
        } else {
          reject(new Error('決済処理に失敗しました。カード情報をご確認ください。'));
        }
      }, 2000); // 2秒のダミー処理時間
    });
  };

  // 契約書ダウンロード
  const handleDownloadContract = () => {
    // TODO: PDF生成とダウンロード実装
    alert('契約書PDFのダウンロードを開始します（実装予定）');
  };

  // 現在のステップに応じてボタンテキストを決定
  const getNextButtonText = () => {
    switch (currentStep) {
      case 1: return 'サービス内容を確認';
      case 2: return '見積もりを確認';
      case 3: return 'お支払い方法へ';
      case 4: return '申込を完了';
      default: return '次へ';
    }
  };

  // ステップ別コンテンツ
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1ServiceSelection
            control={serviceForm.control}
            watch={serviceForm.watch}
            onPricingUpdate={handlePricingUpdate}
          />
        );
      case 2:
        return (
          <Step2BasicInformation
            control={basicForm.control}
            errors={basicForm.formState.errors}
          />
        );
      case 3:
        return (
          <Step3EstimateConfirmation
            pricing={pricing}
            serviceData={serviceForm.getValues()}
            basicData={basicForm.getValues()}
          />
        );
      case 4:
        return (
          <Step4PaymentMethod
            control={paymentForm.control}
            watch={paymentForm.watch}
            errors={paymentForm.formState.errors}
            pricing={pricing}
          />
        );
      case 5:
        return (
          <Step5Completion
            applicationData={{
              serviceSelection: serviceForm.getValues(),
              basicInformation: basicForm.getValues(),
              paymentInformation: paymentForm.getValues(),
              submittedAt: new Date()
            }}
            pricing={pricing}
            applicationId={applicationId}
            onDownloadContract={handleDownloadContract}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      {/* プログレスステッパー */}
      {currentStep < 5 && (
        <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={currentStep - 1} alternativeLabel>
            {FORM_STEPS.slice(0, 4).map((stepInfo) => (
              <Step key={stepInfo.step}>
                <StepLabel>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box>{stepInfo.title}</Box>
                    <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {stepInfo.estimatedTime}
                    </Box>
                  </Box>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}
      
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}
      
      {renderStepContent()}
      
      {/* ナビゲーションボタン */}
      {currentStep < 5 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 4,
          pt: 3,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            startIcon={<ArrowBack />}
            size="large"
          >
            戻る
          </Button>
          
          {currentStep < 4 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isSubmitting}
              endIcon={<ArrowForward />}
              size="large"
              sx={{ px: 4 }}
            >
              {getNextButtonText()}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
              size="large"
              sx={{ px: 4, minWidth: 180 }}
            >
              {isSubmitting ? '送信中...' : '申込を完了'}
            </Button>
          )}
        </Box>
      )}
    </Container>
  );
};

export default OptimizedApplicationForm;