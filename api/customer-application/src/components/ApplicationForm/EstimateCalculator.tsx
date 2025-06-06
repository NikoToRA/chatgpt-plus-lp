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
  Chip
} from '@mui/material';
import { PricingCalculation } from '../../types/application';

interface EstimateCalculatorProps {
  pricing: PricingCalculation;
  accountCount: number;
  billingCycle: 'monthly' | 'yearly';
}

const EstimateCalculator: React.FC<EstimateCalculatorProps> = ({ 
  pricing, 
  accountCount, 
  billingCycle 
}) => {
  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        お見積り確認
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          ご選択内容
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`${accountCount}アカウント`} color="primary" />
          <Chip 
            label={billingCycle === 'monthly' ? '月額プラン' : '年額プラン'} 
            color="secondary" 
          />
          {billingCycle === 'yearly' && (
            <Chip label="2ヶ月分お得" color="success" size="small" />
          )}
        </Box>
      </Box>
      
      <TableContainer>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <Typography variant="body1">
                  ChatGPT Plus 医療機関向けプラン
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {accountCount}アカウント × ¥3,000 
                  {billingCycle === 'yearly' && ' × 12ヶ月'}
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
                    年額プラン割引（2ヶ月分）
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
                <Typography variant="h6" color="primary">
                  ¥{pricing.totalAmount.toLocaleString()}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>お支払いサイクル：</strong>
          {billingCycle === 'monthly' ? '毎月' : '年1回'}のお支払い<br />
          <strong>初回請求：</strong>サービス開始月の翌月初旬<br />
          <strong>お支払い方法：</strong>クレジットカード決済または請求書払い
        </Typography>
      </Box>
    </Paper>
  );
};

export default EstimateCalculator;