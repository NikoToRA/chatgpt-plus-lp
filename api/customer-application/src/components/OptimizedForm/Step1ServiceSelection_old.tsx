import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
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
import { fetchCompanyPlans, calculatePlanPricing, CompanyPlan } from '../../services/companyPlans';

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
  const [companyPlans, setCompanyPlans] = useState<CompanyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const watchPlanId = watch('planId', '');
  const watchAccountCount = watch('requestedAccountCount', 1);
  const watchBillingCycle = watch('billingCycle', 'monthly');
  
  // Load company plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await fetchCompanyPlans();
        setCompanyPlans(plans);
      } catch (error) {
        console.error('Failed to load company plans:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);
  
  // 見積計算と更新
  useEffect(() => {
    const selectedPlan = companyPlans.find(plan => plan.id === watchPlanId);
    if (selectedPlan) {
      const pricing = calculatePlanPricing(selectedPlan, watchAccountCount, watchBillingCycle);
      onPricingUpdate({
        ...pricing,
        billingCycle: watchBillingCycle,
        accountCount: watchAccountCount,
        planId: selectedPlan.id
      });
    }
  }, [watchPlanId, watchAccountCount, watchBillingCycle, onPricingUpdate, companyPlans]);

  const selectedPlan = companyPlans.find(plan => plan.id === watchPlanId);
  const monthlyTotal = selectedPlan ? selectedPlan.unitPrice : 0; // Fixed service fee
  const yearlyTotal = selectedPlan ? Math.floor(selectedPlan.unitPrice * 12 * 0.9) : 0; // 10% yearly discount
  const savings = selectedPlan ? (selectedPlan.unitPrice * 12) - yearlyTotal : 0;
  
  const maxAccountsForPlan = selectedPlan?.maxAccounts || 10;

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom color="primary">
          ChatGPT Plus 契約管理代行サービス
        </Typography>
        <Typography variant="h6" color="text.secondary">
          🏥 ChatGPT Plusの契約・運用・管理をまるごと代行
        </Typography>
        <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
          <Typography variant="body2">
            <strong>💡 チームプラン代行サービス</strong><br />
            • ChatGPT Plusチームプランを当社が契約<br />
            • アカウントID・パスワードをお客様にお渡し<br />
            • 契約・請求・管理業務をすべて代行
          </Typography>
        </Alert>
      </Box>

      {loading && (
        <Alert severity="info" sx={{ mb: 4 }}>
          プラン情報を読み込み中...
        </Alert>
      )}

      {/* プラン選択 */}
      {!loading && companyPlans.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 'bold' }}>
              📋 ご希望のプランを選択してください
            </FormLabel>
            <Controller
              name="planId"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} sx={{ gap: 2 }}>
                  {companyPlans.map((plan) => (
                    <Card 
                      key={plan.id}
                      variant={field.value === plan.id ? 'outlined' : 'elevation'}
                      sx={{ 
                        border: field.value === plan.id ? 2 : 0,
                        borderColor: 'primary.main',
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 4 }
                      }}
                      onClick={() => field.onChange(plan.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <FormControlLabel 
                            value={plan.id} 
                            control={<Radio />} 
                            label=""
                            sx={{ margin: 0 }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" color="primary">
                              {plan.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {plan.description}
                            </Typography>
                            <Typography variant="h6" color="text.primary">
                              ¥{plan.unitPrice.toLocaleString()}/月（固定料金）
                            </Typography>
                            {plan.maxAccounts && (
                              <Typography variant="body2" color="text.secondary">
                                最大{plan.maxAccounts}アカウント
                              </Typography>
                            )}
                            
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>
              )}
            />
          </FormControl>
        </Box>
      )}

      {/* アカウント数選択 */}
      <Box sx={{ mb: 4 }}>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold' }}>
            🔢 管理を希望するChatGPTアカウント数を選択してください
          </FormLabel>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>💰 料金体系</strong><br />
              表示料金にはChatGPT Plus利用料とサービス管理費がすべて含まれています（追加料金なし）
            </Typography>
          </Alert>
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
                  max={maxAccountsForPlan}
                  step={1}
                  marks={[
                    { value: 1, label: '1' },
                    { value: Math.floor(maxAccountsForPlan / 2), label: Math.floor(maxAccountsForPlan / 2).toString() },
                    { value: maxAccountsForPlan, label: maxAccountsForPlan.toString() }
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
        
        {/* 大規模導入のお問い合わせ */}
        {selectedPlan?.maxAccounts && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>💼 {selectedPlan.maxAccounts}アカウント以上をご希望の場合</strong><br />
              大規模導入や特別プランをご検討の場合は、お気軽にお問い合わせください。<br />
              専任担当者が最適なプランをご提案いたします。
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              sx={{ mt: 2 }}
              href={`mailto:sales@chatgpt-medical.com?subject=大規模導入のお問い合わせ(${selectedPlan.name})`}
            >
              📧 大規模導入のお問い合わせ
            </Button>
          </Alert>
        )}
      </Box>

      {/* プラン選択 */}
      <Box sx={{ mb: 4 }}>
        <FormLabel component="legend" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 'bold' }}>
          💰 月額料金（すべて込み）
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
                      <Typography variant="h6">月額払い</Typography>
                      <Typography variant="body2" color="text.secondary">
                        毎月のお支払い・月単位で柔軟に対応
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
                      <Typography variant="h6">年額払い</Typography>
                      <Typography variant="body2" color="text.secondary">
                        年1回のお支払い・10%割引が適用されます
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


      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          ⏱️ 予想入力時間: あと4分 | 📋 進捗: 1/5
        </Typography>
      </Box>
    </Paper>
  );
};

export default Step1ServiceSelection;