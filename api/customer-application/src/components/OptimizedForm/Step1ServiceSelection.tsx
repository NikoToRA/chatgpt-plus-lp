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
  
  // Update pricing when plan or account count changes
  useEffect(() => {
    const selectedPlan = companyPlans.find(plan => plan.id === watchPlanId);
    if (selectedPlan) {
      const pricing = calculatePlanPricing(selectedPlan, watchAccountCount);
      onPricingUpdate(pricing);
    }
  }, [watchPlanId, watchAccountCount, companyPlans, onPricingUpdate]);
  
  const selectedPlan = companyPlans.find(plan => plan.id === watchPlanId);
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <FormControlLabel 
                            value={plan.id} 
                            control={<Radio />} 
                            label=""
                            sx={{ margin: 0 }}
                          />
                          <Box sx={{ flex: 1, ml: 2 }}>
                            <Typography variant="h6">{plan.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {plan.description}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {plan.features.map((feature, index) => (
                                <Chip 
                                  key={index}
                                  label={feature} 
                                  size="small" 
                                  variant="outlined" 
                                  sx={{ mr: 1, mb: 1 }} 
                                />
                              ))}
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h5" color="primary">
                              ¥{plan.unitPrice.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              /月（税込・すべて込み）
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
                  sx={{ mt: 3, mb: 2 }}
                />
                <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
                  選択中: <strong>{field.value}アカウント</strong>
                </Typography>
              </Box>
            )}
          />
        </FormControl>
        
        {watchAccountCount >= maxAccountsForPlan && selectedPlan && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>💼 大規模導入をご検討の場合</strong><br />
              {maxAccountsForPlan}アカウント以上の大規模導入については、専用プランをご用意いたします。
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

      {/* 月額料金表示 */}
      {selectedPlan && (
        <Box sx={{ mb: 4 }}>
          <Card variant="outlined" sx={{ backgroundColor: 'primary.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                💰 月額料金（税込）
              </Typography>
              <Typography variant="h4" color="primary" gutterBottom>
                ¥{selectedPlan.unitPrice.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ChatGPT Plus利用料 + サービス管理費込み
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* 開始希望日 */}
      <Box sx={{ mb: 4 }}>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold' }}>
            📅 サービス開始希望日
          </FormLabel>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <TextField
                type="date"
                {...field}
                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
                fullWidth
                helperText="カード決済の場合は最短翌日開始、請求書払いの場合は審査後3-5営業日で開始"
              />
            )}
          />
        </FormControl>
      </Box>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          ⏱️ 予想残り時間: あと4分 | 📋 進捗: 1/5
        </Typography>
      </Box>
    </Paper>
  );
};

export default Step1ServiceSelection;