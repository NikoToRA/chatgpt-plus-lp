import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Slider,
  Alert,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField
} from '@mui/material';
import { Controller, Control } from 'react-hook-form';
import { ServiceSelection, PricingCalculation } from '../../types/optimizedApplication';
import { calculatePricing } from '../../utils/pricing';

interface Step1ServiceSelectionProps {
  control: Control<ServiceSelection, any>;
  watch: any;
  onPricingUpdate: (pricing: PricingCalculation) => void;
}

const Step1ServiceSelection: React.FC<Step1ServiceSelectionProps> = ({ 
  control, 
  watch,
  onPricingUpdate 
}) => {
  const watchAccountCount = watch('requestedAccountCount', 1);
  const watchBillingCycle = watch('billingCycle', 'monthly');
  
  // 見積計算と更新
  React.useEffect(() => {
    const pricing = calculatePricing(watchAccountCount, watchBillingCycle);
    onPricingUpdate({
      ...pricing,
      billingCycle: watchBillingCycle,
      accountCount: watchAccountCount
    });
  }, [watchAccountCount, watchBillingCycle, onPricingUpdate]);

  const monthlyTotal = watchAccountCount * 3000;
  const yearlyTotal = Math.floor(watchAccountCount * 3000 * 10); // 2ヶ月分割引
  const savings = (watchAccountCount * 3000 * 12) - yearlyTotal;

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          ChatGPT Plus 医療機関向けプラン
        </Typography>
        <Typography variant="h6" color="text.secondary">
          🏥 医療現場に特化した高性能AIアシスタント
        </Typography>
      </Box>

      {/* アカウント数選択 */}
      <Box sx={{ mb: 4 }}>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold' }}>
            必要なアカウント数を選択してください
          </FormLabel>
          <Controller
            name="requestedAccountCount"
            control={control}
            render={({ field }) => (
              <Box sx={{ px: 2 }}>
                <Slider
                  {...field}
                  value={field.value}
                  onChange={(_, value) => field.onChange(value)}
                  min={1}
                  max={50}
                  step={1}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 10, label: '10' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50+' }
                  ]}
                  valueLabelDisplay="on"
                  sx={{ mt: 3, mb: 4 }}
                />
                <Typography variant="h5" align="center" color="primary" sx={{ mb: 2 }}>
                  {watchAccountCount} アカウント
                </Typography>
              </Box>
            )}
          />
        </FormControl>
      </Box>

      {/* プラン選択 */}
      <Box sx={{ mb: 4 }}>
        <FormLabel component="legend" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 'bold' }}>
          お支払いプランを選択してください
        </FormLabel>
        <Controller
          name="billingCycle"
          control={control}
          render={({ field }) => (
            <RadioGroup {...field} sx={{ gap: 2 }}>
              {/* 月額プラン */}
              <Card 
                variant={field.value === 'monthly' ? 'outlined' : 'elevation'}
                sx={{ 
                  border: field.value === 'monthly' ? 2 : 0,
                  borderColor: 'primary.main',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 }
                }}
                onClick={() => field.onChange('monthly')}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel 
                      value="monthly" 
                      control={<Radio />} 
                      label=""
                      sx={{ margin: 0 }}
                    />
                    <Box sx={{ flex: 1, ml: 2 }}>
                      <Typography variant="h6">月額プラン</Typography>
                      <Typography variant="body2" color="text.secondary">
                        柔軟性重視・短期利用に最適
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" color="primary">
                        ¥{monthlyTotal.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        /月
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* 年額プラン */}
              <Card 
                variant={field.value === 'yearly' ? 'outlined' : 'elevation'}
                sx={{ 
                  border: field.value === 'yearly' ? 2 : 0,
                  borderColor: 'primary.main',
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': { boxShadow: 4 }
                }}
                onClick={() => field.onChange('yearly')}
              >
                {savings > 0 && (
                  <Chip 
                    label={`¥${savings.toLocaleString()}お得!`}
                    color="success"
                    size="small"
                    sx={{ 
                      position: 'absolute', 
                      top: -8, 
                      right: 16,
                      zIndex: 1,
                      fontWeight: 'bold'
                    }}
                  />
                )}
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel 
                      value="yearly" 
                      control={<Radio />} 
                      label=""
                      sx={{ margin: 0 }}
                    />
                    <Box sx={{ flex: 1, ml: 2 }}>
                      <Typography variant="h6">年額プラン（おすすめ）</Typography>
                      <Typography variant="body2" color="text.secondary">
                        2ヶ月分お得・長期利用に最適
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" color="primary">
                        ¥{yearlyTotal.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        /年（月額換算: ¥{Math.floor(yearlyTotal/12).toLocaleString()}）
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </RadioGroup>
          )}
        />
      </Box>

      {/* 利用開始日 */}
      <Box sx={{ mb: 4 }}>
        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="利用開始希望日"
              type="date"
              value={field.value ? field.value.toISOString().split('T')[0] : ''}
              onChange={(e) => field.onChange(new Date(e.target.value))}
              InputLabelProps={{
                shrink: true,
              }}
              helperText="最短で申込から3営業日後からご利用可能です"
            />
          )}
        />
      </Box>

      {/* サービス特徴 */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>🎯 医療機関向け特別機能</strong><br />
          • 医療専門用語対応 • カルテ作成支援 • 診断補助プロンプト<br />
          • データプライバシー保護 • 24時間専用サポート
        </Typography>
      </Alert>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          ⏱️ 予想入力時間: あと4分 | 📋 進捗: 1/5
        </Typography>
      </Box>
    </Paper>
  );
};

export default Step1ServiceSelection;