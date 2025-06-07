import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import { 
  CheckCircle, 
  Download, 
  Email, 
  Schedule,
  Assignment
} from '@mui/icons-material';
import { OptimizedApplicationSubmission, PricingCalculation } from '../../types/optimizedApplication';

interface Step5CompletionProps {
  applicationData: OptimizedApplicationSubmission;
  pricing: PricingCalculation;
  applicationId: string;
  onDownloadContract: () => void;
}

const Step5Completion: React.FC<Step5CompletionProps> = ({ 
  applicationData, 
  pricing, 
  applicationId,
  onDownloadContract 
}) => {
  const isCardPayment = applicationData.paymentInformation.paymentMethod === 'card';
  
  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      {/* 完了メッセージ */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom color="success.main">
          お申込み完了
        </Typography>
        <Typography variant="h6" color="text.secondary">
          ChatGPT Plus 契約管理代行サービスへのお申込みありがとうございます
        </Typography>
      </Box>

      {/* 申込ID */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1">
          <strong>📋 申込ID: {applicationId}</strong><br />
          お問い合わせの際は、こちらのIDをお知らせください
        </Typography>
      </Alert>

      {/* 契約書ダウンロード */}
      <Card variant="outlined" sx={{ mb: 4, backgroundColor: 'primary.50' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            📄 契約書のダウンロード
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            ご契約内容を記載した契約書をPDFでダウンロードできます
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Download />}
            onClick={onDownloadContract}
            sx={{ px: 4 }}
          >
            契約書をダウンロード
          </Button>
        </CardContent>
      </Card>

      {/* 次のステップ */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📅 手続きの流れ
          </Typography>
          
          <Timeline>
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="success">
                  <CheckCircle />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  申込完了
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date().toLocaleDateString('ja-JP')} - 完了済み
                </Typography>
              </TimelineContent>
            </TimelineItem>

            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color={isCardPayment ? "success" : "warning"}>
                  <Email />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  確認メール送信
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  数分以内 - {applicationData.basicInformation.email}
                </Typography>
                {isCardPayment && (
                  <Chip label="カード決済URL含む" color="primary" size="small" sx={{ mt: 1 }} />
                )}
              </TimelineContent>
            </TimelineItem>

            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="warning">
                  <Schedule />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  {isCardPayment ? 'チームプラン契約開始' : '審査・承認'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isCardPayment ? '決済完了後即座' : '1-3営業日'} - ChatGPT Plusチーム契約
                </Typography>
              </TimelineContent>
            </TimelineItem>

            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="primary">
                  <CheckCircle />
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  アカウント情報お渡し
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isCardPayment ? '最短当日' : '3-5営業日'} - ChatGPT Plus ID・パスワードをメール送信
                </Typography>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </CardContent>
      </Card>

      {/* 契約サマリー */}
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 ご契約内容
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">医療機関名</Typography>
              <Typography variant="body1" fontWeight="bold">
                {applicationData.basicInformation.organizationName}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">アカウント数</Typography>
              <Typography variant="body1" fontWeight="bold">
                {applicationData.serviceSelection.requestedAccountCount}アカウント
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">プラン</Typography>
              <Typography variant="body1" fontWeight="bold">
                月額プラン
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">月額料金</Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                ¥{pricing.totalAmount.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ my: 4 }} />



      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          🎉 お申込み完了 | 📋 進捗: 5/5
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          この度はChatGPT Plus 契約管理代行サービスをお選びいただき、誠にありがとうございます
        </Typography>
      </Box>
    </Paper>
  );
};

export default Step5Completion;