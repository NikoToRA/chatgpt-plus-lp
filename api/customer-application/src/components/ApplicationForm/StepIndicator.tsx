import React from 'react';
import { Stepper, Step, StepLabel, Box } from '@mui/material';
import { FormStep } from '../../types/application';

interface StepIndicatorProps {
  currentStep: FormStep;
}

const steps = [
  '医療機関情報',
  '担当者情報', 
  'サービス選択',
  '見積確認',
  '決済方法',
  '申込確認'
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper activeStep={currentStep - 1} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default StepIndicator;