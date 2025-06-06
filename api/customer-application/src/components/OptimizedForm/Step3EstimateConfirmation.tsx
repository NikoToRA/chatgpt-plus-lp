import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Box,
  Divider,
  Chip,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import { PricingCalculation, ServiceSelection, BasicInformation } from '../../types/optimizedApplication';
import { DEFAULT_COMPANY_PLANS } from '../../services/companyPlans';

interface Step3EstimateConfirmationProps {
  pricing: PricingCalculation;
  serviceData: ServiceSelection;
  basicData: BasicInformation;
}

const Step3EstimateConfirmation: React.FC<Step3EstimateConfirmationProps> = ({ 
  pricing, 
  serviceData,
  basicData 
}) => {
  const facilityTypeNames = {
    hospital: '病院',
    clinic: '診療所・クリニック',
    dental_clinic: '歯科診療所',
    pharmacy: '調剤薬局',
    nursing_home: '介護施設',
    other: 'その他'
  };

  const selectedPlan = DEFAULT_COMPANY_PLANS.find(plan => plan.id === serviceData.planId);
  const planName = selectedPlan ? selectedPlan.name : 'ChatGPT Plus 医療機関向けプラン';

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 4 }}>
        お見積り内容の確認
      </Typography>
      
      {/* ご契約者情報 */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 ご契約情報
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">医療機関名</Typography>
              <Typography variant="body1" fontWeight="bold">{basicData.organizationName}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">施設種別</Typography>
              <Typography variant="body1">{facilityTypeNames[basicData.facilityType]}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">担当者</Typography>
              <Typography variant="body1">{basicData.contactPerson}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">メールアドレス</Typography>
              <Typography variant="body1">{basicData.email}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* サービス内容 */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎯 選択サービス
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip 
              label={`${serviceData.requestedAccountCount}アカウント`} 
              color="primary" 
              size="medium"
            />
            <Chip 
              label={serviceData.billingCycle === 'monthly' ? '月額プラン' : '年額プラン'} 
              color="secondary" 
              size="medium"
            />
            {serviceData.billingCycle === 'yearly' && (
              <Chip label="2ヶ月分お得" color="success" size="small" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            利用開始予定日: {serviceData.startDate.toLocaleDateString('ja-JP')}
          </Typography>
        </CardContent>
      </Card>
      
      {/* 料金明細 */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💰 料金明細
          </Typography>
          <TableContainer>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Typography variant="body1">
                      {planName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {serviceData.requestedAccountCount}アカウント管理代行サービス・固定料金
                      {serviceData.billingCycle === 'yearly' && '（年額・10%割引適用）'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1">
                      ¥{(pricing.basePrice + pricing.discountAmount).toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
                
                {pricing.discountAmount > 0 && (
                  <TableRow>
                    <TableCell>
                      <Typography variant="body1" color="success.main">
                        🎉 年額プラン割引（10%オフ）
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" color="success.main">
                        -¥{pricing.discountAmount.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                
                <TableRow>
                  <TableCell>
                    <Typography variant="body1">小計</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1">
                      ¥{pricing.subtotal.toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>
                    <Typography variant="body1">消費税（10%）</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1">
                      ¥{pricing.taxAmount.toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell colSpan={2}>
                    <Divider />
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell>
                    <Typography variant="h6" color="primary">
                      合計金額（税込）
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      ¥{pricing.totalAmount.toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* 支払い詳細 */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>💳 お支払いについて</strong><br />
          • <strong>支払いサイクル:</strong> {serviceData.billingCycle === 'monthly' ? '毎月' : '年1回'}のお支払い<br />
          • <strong>初回請求:</strong> サービス開始月の翌月初旬<br />
          • <strong>支払い方法:</strong> クレジットカード決済または請求書払い<br />
          • <strong>請求書発行:</strong> 月末締め・翌月5日発行
        </Typography>
      </Alert>


      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          ⏱️ 予想残り時間: あと2分 | 📋 進捗: 3/5
        </Typography>
      </Box>
    </Paper>
  );
};

export default Step3EstimateConfirmation;