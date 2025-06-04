import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
} from '@mui/material';
import { Link as LinkIcon, Check as CheckIcon } from '@mui/icons-material';
import { customerApi } from '../../services/api';
import { Customer, AccountLinking } from '../../types';

export default function AccountLinkingComponent() {
  const [activeStep, setActiveStep] = useState(0);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [chatGptEmail, setChatGptEmail] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const steps = ['顧客を検索', 'ChatGPTアカウントを入力', '確認・紐付け'];

  const handleSearch = async () => {
    setIsSearching(true);
    setMessage(null);
    
    try {
      const customers = await customerApi.getAll();
      const results = customers.filter(c => 
        c.email.toLowerCase().includes(searchEmail.toLowerCase()) &&
        !c.chatGptEmail
      );
      setSearchResults(results);
      
      if (results.length === 0) {
        setMessage({ type: 'error', text: '該当する顧客が見つかりません。' });
      }
    } catch (error) {
      // 開発用のダミーデータ
      const dummyResults: Customer[] = [
        {
          id: '4',
          email: 'sato@example.com',
          organization: '佐藤製作所',
          name: '佐藤三郎',
          status: 'active',
          plan: 'plus',
          paymentMethod: 'card',
          createdAt: new Date(),
          lastActivityAt: new Date(),
        },
        {
          id: '5',
          email: 'ito@example.com',
          organization: '伊藤コンサルティング',
          name: '伊藤四郎',
          status: 'trial',
          plan: 'basic',
          paymentMethod: 'invoice',
          createdAt: new Date(),
          lastActivityAt: new Date(),
        },
      ];
      setSearchResults(dummyResults.filter(c => 
        c.email.toLowerCase().includes(searchEmail.toLowerCase())
      ));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveStep(1);
  };

  const handleNext = () => {
    if (activeStep === 1 && chatGptEmail) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleLink = async () => {
    if (!selectedCustomer || !chatGptEmail) return;

    setIsLinking(true);
    setMessage(null);

    try {
      const linking: AccountLinking = {
        customerId: selectedCustomer.id,
        customerEmail: selectedCustomer.email,
        chatGptEmail,
        linkedAt: new Date(),
        linkedBy: 'admin', // 実際にはログインユーザーIDを使用
      };

      await customerApi.linkAccount(linking);
      setMessage({ type: 'success', text: 'アカウントの紐付けが完了しました。' });
      
      // リセット
      setTimeout(() => {
        setActiveStep(0);
        setSearchEmail('');
        setSelectedCustomer(null);
        setChatGptEmail('');
        setSearchResults([]);
      }, 2000);
    } catch (error) {
      console.error('Failed to link account:', error);
      setMessage({ type: 'error', text: 'アカウントの紐付けに失敗しました。' });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        アカウント紐付け
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              紐付けする顧客を検索
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              ChatGPTアカウントが未設定の顧客のみ表示されます
            </Typography>
            
            <Box display="flex" gap={2} sx={{ mt: 3, mb: 3 }}>
              <TextField
                fullWidth
                label="顧客メールアドレスで検索"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={isSearching || !searchEmail}
              >
                検索
              </Button>
            </Box>

            {searchResults.length > 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>顧客名</TableCell>
                      <TableCell>組織</TableCell>
                      <TableCell>メールアドレス</TableCell>
                      <TableCell>プラン</TableCell>
                      <TableCell align="center">選択</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.map((customer) => (
                      <TableRow key={customer.id} hover>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.organization}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>
                          <Chip label={customer.plan.toUpperCase()} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            選択
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {activeStep === 1 && selectedCustomer && (
          <Box>
            <Typography variant="h6" gutterBottom>
              ChatGPTアカウントを入力
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                選択された顧客
              </Typography>
              <Typography variant="h6">
                {selectedCustomer.name} ({selectedCustomer.organization})
              </Typography>
              <Typography variant="body2">
                {selectedCustomer.email}
              </Typography>
            </Paper>

            <TextField
              fullWidth
              label="ChatGPTメールアドレス"
              value={chatGptEmail}
              onChange={(e) => setChatGptEmail(e.target.value)}
              placeholder="example@chatgpt.com"
              sx={{ mb: 3 }}
            />

            <Box display="flex" justifyContent="space-between">
              <Button onClick={handleBack}>
                戻る
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!chatGptEmail}
              >
                次へ
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && selectedCustomer && (
          <Box>
            <Typography variant="h6" gutterBottom>
              確認・紐付け
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              以下の内容でアカウントを紐付けします。よろしいですか？
            </Alert>

            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    顧客情報
                  </Typography>
                  <Typography variant="h6">
                    {selectedCustomer.name}
                  </Typography>
                  <Typography>
                    {selectedCustomer.organization}
                  </Typography>
                  <Typography variant="body2">
                    {selectedCustomer.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    ChatGPTアカウント
                  </Typography>
                  <Typography variant="h6">
                    {chatGptEmail}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Box display="flex" justifyContent="space-between">
              <Button onClick={handleBack}>
                戻る
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<LinkIcon />}
                onClick={handleLink}
                disabled={isLinking}
              >
                {isLinking ? '紐付け中...' : '紐付けを実行'}
              </Button>
            </Box>
          </Box>
        )}

        {message?.type === 'success' && activeStep === 2 && (
          <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
            <CheckIcon color="success" sx={{ fontSize: 48 }} />
          </Box>
        )}
      </Paper>
    </Box>
  );
}