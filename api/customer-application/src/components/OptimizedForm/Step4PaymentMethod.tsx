import React from 'react';
import {
  Paper,
  Typography,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Alert,
  Checkbox,
  FormControlLabel as FormCheckboxLabel,
  Link,
  Divider
} from '@mui/material';
import { Controller, Control } from 'react-hook-form';
import { PaymentInformation, PricingCalculation } from '../../types/optimizedApplication';

interface Step4PaymentMethodProps {
  control: Control<PaymentInformation, any>;
  watch: any;
  errors: any;
  pricing: PricingCalculation;
}

const Step4PaymentMethod: React.FC<Step4PaymentMethodProps> = ({ 
  control, 
  watch, 
  errors,
  pricing 
}) => {

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 4 }}>
        お支払い方法の選択
      </Typography>

      {/* 料金サマリー */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="h6" color="primary">
          ご請求金額: ¥{pricing.totalAmount.toLocaleString()}
          <Typography component="span" variant="body2" sx={{ ml: 1 }}>
            ({pricing.billingCycle === 'monthly' ? '月額' : '年額'})
          </Typography>
        </Typography>
      </Alert>

      {/* 支払い方法選択 */}
      <Box sx={{ mb: 4 }}>
        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 'bold' }}>
            💳 お支払い方法を選択してください
          </FormLabel>
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <RadioGroup {...field} sx={{ gap: 2 }}>
                {/* クレジットカード決済 */}
                <Card 
                  variant={field.value === 'card' ? 'outlined' : 'elevation'}
                  sx={{ 
                    border: field.value === 'card' ? 2 : 0,
                    borderColor: 'primary.main',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 }
                  }}
                  onClick={() => field.onChange('card')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <FormControlLabel 
                        value="card" 
                        control={<Radio />} 
                        label=""
                        sx={{ margin: 0 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">
                          クレジットカード決済
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          • 自動更新<br />
                          • VISA, MasterCard, JCB, AMEX対応
                        </Typography>
                        
                        {field.value === 'card' && (
                          <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              ※ カード情報は次の画面でStripe（世界最高水準のセキュリティ）にて安全に入力いただきます
                            </Typography>
                            <Controller
                              name="cardHolderName"
                              control={control}
                              render={({ field: cardField }) => (
                                <TextField
                                  {...cardField}
                                  fullWidth
                                  label="カード名義人（参考）"
                                  placeholder="YAMADA TARO"
                                  size="small"
                                  helperText="実際のカード情報は次の画面で入力します"
                                />
                              )}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* 請求書払い */}
                <Card 
                  variant={field.value === 'invoice' ? 'outlined' : 'elevation'}
                  sx={{ 
                    border: field.value === 'invoice' ? 2 : 0,
                    borderColor: 'primary.main',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 }
                  }}
                  onClick={() => field.onChange('invoice')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <FormControlLabel 
                        value="invoice" 
                        control={<Radio />} 
                        label=""
                        sx={{ margin: 0 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">
                          請求書払い
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          • 月末締め・翌月5日請求書発行<br />
                          • 支払期限：請求書発行日から30日
                        </Typography>
                        
                        {field.value === 'invoice' && (
                          <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                            <Controller
                              name="billingContact"
                              control={control}
                              render={({ field: billingField }) => (
                                <TextField
                                  {...billingField}
                                  fullWidth
                                  label="請求書宛先担当者"
                                  placeholder="経理担当者名"
                                  size="small"
                                  sx={{ mb: 2 }}
                                />
                              )}
                            />
                            <Controller
                              name="billingEmail"
                              control={control}
                              render={({ field: billingField }) => (
                                <TextField
                                  {...billingField}
                                  fullWidth
                                  label="請求書送付先メールアドレス"
                                  placeholder="billing@hospital.com"
                                  type="email"
                                  size="small"
                                  helperText="請求書をPDFで送付いたします"
                                />
                              )}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </RadioGroup>
            )}
          />
        </FormControl>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* 利用規約同意 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          📋 利用規約・プライバシーポリシー
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Controller
            name="termsAccepted"
            control={control}
            render={({ field }) => (
              <FormCheckboxLabel
                control={
                  <Checkbox 
                    {...field}
                    checked={field.value}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    <Link href="#" underline="hover" color="primary">
                      利用規約
                    </Link>
                    に同意します（必須）
                  </Typography>
                }
              />
            )}
          />
          {errors.termsAccepted && (
            <Typography variant="caption" color="error">
              利用規約への同意が必要です
            </Typography>
          )}
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Controller
            name="privacyAccepted"
            control={control}
            render={({ field }) => (
              <FormCheckboxLabel
                control={
                  <Checkbox 
                    {...field}
                    checked={field.value}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    <Link href="#" underline="hover" color="primary">
                      プライバシーポリシー
                    </Link>
                    に同意します（必須）
                  </Typography>
                }
              />
            )}
          />
          {errors.privacyAccepted && (
            <Typography variant="caption" color="error">
              プライバシーポリシーへの同意が必要です
            </Typography>
          )}
        </Box>
        
        <Alert severity="info" sx={{ mt: 3, mb: 2 }}>
          <Typography variant="body2">
            <strong>🔒 個人情報の取り扱いについて</strong><br />
            ご入力いただいた個人情報は、サービス提供・サポート・請求業務のみに使用し、
            適切に管理いたします。第三者への提供や、他の目的での使用は一切行いません。
          </Typography>
        </Alert>
        
        <Box sx={{ mb: 2 }}>
          <Controller
            name="privacyUnderstandingConfirmed"
            control={control}
            render={({ field }) => (
              <FormCheckboxLabel
                control={
                  <Checkbox 
                    {...field}
                    checked={field.value}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    上記の個人情報の取り扱いについて理解し、同意いたします（必須）
                  </Typography>
                }
              />
            )}
          />
          {errors.privacyUnderstandingConfirmed && (
            <Typography variant="caption" color="error">
              個人情報の取り扱いについてのご理解・同意が必要です
            </Typography>
          )}
        </Box>
      </Box>


      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          ⏱️ 予想残り時間: あと1分 | 📋 進捗: 4/5
        </Typography>
      </Box>
    </Paper>
  );
};

export default Step4PaymentMethod;