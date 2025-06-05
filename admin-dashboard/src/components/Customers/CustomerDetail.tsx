import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  SelectChangeEvent,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { customerApi, accountApi } from '../../services/api';
import { Customer, ChatGptAccount, CompanyInfo } from '../../types';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    plan: 'plus',
    productId: '',
    subscriptionMonths: 12,
  });
  const [newGptEmail, setNewGptEmail] = useState('');
  const [gptAccounts, setGptAccounts] = useState<ChatGptAccount[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [editingAccount, setEditingAccount] = useState<ChatGptAccount | null>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadCustomer(id);
    }
    loadCompanyInfo();
  }, [id]);

  const loadCompanyInfo = () => {
    const companyInfoStr = localStorage.getItem('companyInfo');
    if (companyInfoStr) {
      setCompanyInfo(JSON.parse(companyInfoStr));
    }
  };

  const loadCustomer = async (customerId: string) => {
    try {
      // まずローカルストレージから確認
      const localCustomers = localStorage.getItem('customers');
      if (localCustomers) {
        const parsedCustomers = JSON.parse(localCustomers);
        const customer = parsedCustomers.find((c: Customer) => c.id === customerId);
        if (customer) {
          setCustomer(customer);
          setFormData({
            status: customer.status,
            plan: customer.plan,
            productId: customer.productId || '',
            subscriptionMonths: customer.subscriptionMonths || 12,
          });
          setGptAccounts(customer.chatGptAccounts || []);
          return;
        }
      }
      
      const data = await customerApi.getById(customerId);
      setCustomer(data);
      setFormData({
        status: data.status,
        plan: data.plan,
        productId: data.productId || '',
        subscriptionMonths: data.subscriptionMonths || 12,
      });
      setGptAccounts(data.chatGptAccounts || []);
    } catch (error) {
      console.error('Failed to load customer:', error);
      // 開発用のダミーデータ
      const dummyCustomer: Customer = {
        id: customerId,
        email: 'yamada@example.com',
        organization: '株式会社山田商事',
        name: '山田太郎',
        chatGptAccounts: [
          {
            id: 'gpt-1',
            email: 'yamada@chatgpt.com',
            isActive: true,
            createdAt: new Date('2025-05-01')
          },
          {
            id: 'gpt-5',
            email: 'yamada2@chatgpt.com',
            isActive: true,
            createdAt: new Date('2025-05-10')
          }
        ],
        status: 'active',
        plan: 'plus',
        paymentMethod: 'card',
        registeredAt: new Date('2025-05-01'),
        subscriptionMonths: 12,
        expiresAt: new Date('2026-05-01'),
        lastActivityAt: new Date(),
        stripeCustomerId: 'cus_123456789',
      };
      setCustomer(dummyCustomer);
      setFormData({
        status: dummyCustomer.status,
        plan: dummyCustomer.plan,
        productId: dummyCustomer.productId || '',
        subscriptionMonths: dummyCustomer.subscriptionMonths,
      });
      setGptAccounts(dummyCustomer.chatGptAccounts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!customer) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const expiresAt = new Date(customer.registeredAt);
      expiresAt.setMonth(expiresAt.getMonth() + formData.subscriptionMonths);
      
      const updatedCustomer = {
        ...customer,
        status: formData.status as 'trial' | 'active' | 'suspended' | 'cancelled',
        productId: formData.productId,
        subscriptionMonths: formData.subscriptionMonths,
        expiresAt
      };
      
      // ローカルストレージにも保存
      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const updatedCustomers = existingCustomers.map((c: Customer) => 
        c.id === customer.id ? updatedCustomer : c
      );
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      
      await customerApi.update(customer.id, updatedCustomer);
      setMessage({ type: 'success', text: 'ステータス情報を更新しました。' });
      
      // 顧客データを更新
      setCustomer(updatedCustomer);
    } catch (error) {
      console.error('Failed to save customer:', error);
      setMessage({ type: 'error', text: '更新に失敗しました。' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleSelectChange = (field: keyof typeof formData) => (
    event: SelectChangeEvent<string>
  ) => {
    const value = event.target.value;
    const newFormData = {
      ...formData,
      [field]: value,
    };
    
    // 申込み月数が変更された場合、更新期限を自動計算
    if (field === 'subscriptionMonths' && customer) {
      const expiresAt = new Date(customer.registeredAt);
      expiresAt.setMonth(expiresAt.getMonth() + parseInt(value));
      // この計算結果は表示用で、実際の保存は handleSave で行う
    }
    
    setFormData(newFormData);
  };

  const addGptAccount = async () => {
    if (!newGptEmail.trim() || !customer) return;
    
    // デフォルトのプランを取得
    const defaultProduct = companyInfo?.products.find(p => p.isActive) || companyInfo?.products[0];
    const now = new Date();
    const defaultExpiresAt = new Date(now);
    defaultExpiresAt.setMonth(defaultExpiresAt.getMonth() + 12);
    
    const newAccount: ChatGptAccount = {
      id: `gpt-${Date.now()}`,
      email: newGptEmail.trim(),
      isActive: true,
      createdAt: now,
      startDate: now, // デフォルトで登録日を開始日に設定
      productId: defaultProduct?.id,
      expiresAt: defaultExpiresAt,
      subscriptionMonths: 12,
      status: 'active',
    };
    
    const updatedAccounts = [...gptAccounts, newAccount];
    const updatedCustomer = {
      ...customer,
      chatGptAccounts: updatedAccounts
    };
    
    // ローカル状態を先に更新
    setGptAccounts(updatedAccounts);
    setCustomer(updatedCustomer);
    setNewGptEmail('');
    
    // ローカルストレージに保存（開発用）
    try {
      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const updatedCustomers = existingCustomers.map((c: Customer) => 
        c.id === customer.id ? updatedCustomer : c
      );
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      
      setMessage({ type: 'success', text: 'ChatGPTアカウントを追加しました。' });
    } catch (error) {
      console.log('ローカル開発モードで動作中');
      setMessage({ type: 'success', text: 'ChatGPTアカウントを追加しました。（ローカルモード）' });
    }
  };

  const removeGptAccount = async (accountId: string) => {
    if (!customer) return;
    
    const updatedAccounts = gptAccounts.filter(acc => acc.id !== accountId);
    const updatedCustomer = {
      ...customer,
      chatGptAccounts: updatedAccounts
    };
    
    // ローカル状態を先に更新
    setGptAccounts(updatedAccounts);
    setCustomer(updatedCustomer);
    
    // ローカルストレージに保存（開発用）
    try {
      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const updatedCustomers = existingCustomers.map((c: Customer) => 
        c.id === customer.id ? updatedCustomer : c
      );
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      
      setMessage({ type: 'success', text: 'ChatGPTアカウントを削除しました。' });
    } catch (error) {
      console.log('ローカル開発モードで動作中');
      setMessage({ type: 'success', text: 'ChatGPTアカウントを削除しました。（ローカルモード）' });
    }
  };

  const calculateExpiresAt = () => {
    if (!customer) return new Date();
    const expiresAt = new Date(customer.registeredAt);
    expiresAt.setMonth(expiresAt.getMonth() + formData.subscriptionMonths);
    return expiresAt;
  };

  const generateInvoice = async () => {
    if (!customer) return;
    
    setIsGeneratingInvoice(true);
    
    try {
      // 会社情報を取得
      const companyInfoStr = localStorage.getItem('companyInfo');
      const companyInfo: CompanyInfo | null = companyInfoStr ? JSON.parse(companyInfoStr) : null;
      
      // アカウント別の料金計算
      const accountDetails = customer.chatGptAccounts
        .filter(acc => acc.isActive || acc.status === 'active')
        .map(acc => {
          const product = companyInfo?.products.find(p => p.id === acc.productId) ||
                         companyInfo?.products.find(p => p.id === customer.productId) ||
                         companyInfo?.products.find(p => p.isActive);
          return {
            email: acc.email,
            product: product?.name || 'ChatGPT Plus 医療機関向けプラン',
            unitPrice: product?.unitPrice || 20000,
            months: acc.subscriptionMonths || customer.subscriptionMonths || 12,
            amount: (product?.unitPrice || 20000) * (acc.subscriptionMonths || customer.subscriptionMonths || 12)
          };
        });
      
      const totalAmount = accountDetails.reduce((sum, acc) => sum + acc.amount, 0);
      
      // 請求書データを作成
      const invoiceData = {
        invoiceNumber: `${companyInfo?.invoiceSettings.invoicePrefix || 'INV'}-${Date.now()}`,
        customerName: customer.name,
        organization: customer.organization,
        email: customer.email,
        totalAmount,
        accountDetails,
        issueDate: new Date().toLocaleDateString('ja-JP'),
        dueDate: new Date(Date.now() + (companyInfo?.invoiceSettings.paymentTermDays || 30) * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP'),
        accounts: customer.chatGptAccounts,
        companyInfo
      };
      
      // ローカルでPDFをシミュレート（実際はサーバーで生成）
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 詳細な請求書データを生成
      const invoiceContent = [
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `　　　　　　　　　　　　　　　　　　　請　求　書`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `請求書番号: ${invoiceData.invoiceNumber}`,
        `発行日: ${invoiceData.issueDate}`,
        `支払期限: ${invoiceData.dueDate}`,
        ``,
        `【請求先】`,
        `${invoiceData.organization}`,
        `${invoiceData.customerName} 様`,
        ``,
        `【請求元】`,
        `${companyInfo?.companyName || '株式会社WonderDrill'}`,
        `${companyInfo?.representativeName || '代表取締役 山田太郎'}`,
        `〒${companyInfo?.postalCode || '100-0001'}`,
        `${companyInfo?.address || '東京都千代田区丸の内1-1-1'}`,
        `TEL: ${companyInfo?.phoneNumber || '03-1234-5678'}`,
        `Email: ${companyInfo?.email || 'info@wonderdrill.com'}`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `【サービス詳細】`,
        ``,
        ...invoiceData.accountDetails.map((detail, index) => 
          `${index + 1}. ${detail.product} - ${detail.email}\n   月額: ¥${detail.unitPrice.toLocaleString()} × ${detail.months}ヶ月 = ¥${detail.amount.toLocaleString()}`
        ),
        ``,
        `【合計金額】`,
        `小計: ¥${invoiceData.totalAmount.toLocaleString()}`,
        `消費税(10%): ¥${Math.floor(invoiceData.totalAmount * 0.1).toLocaleString()}`,
        `合計: ¥${Math.floor(invoiceData.totalAmount * 1.1).toLocaleString()}`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `【振込先】`,
        `銀行名: ${companyInfo?.bankInfo.bankName || '三菱UFJ銀行'}`,
        `支店名: ${companyInfo?.bankInfo.branchName || '丸の内支店'}`,
        `口座種別: ${companyInfo?.bankInfo.accountType === 'checking' ? '普通' : '当座'}`,
        `口座番号: ${companyInfo?.bankInfo.accountNumber || '1234567'}`,
        `口座名義: ${companyInfo?.bankInfo.accountHolder || 'カ）ワンダードリル'}`,
        ``,
        `【ChatGPTアカウント一覧】`,
        ...customer.chatGptAccounts.map((acc, index) => 
          `${index + 1}. ${acc.email} (${acc.isActive ? 'アクティブ' : '停止中'})`
        ),
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `【備考】`,
        companyInfo?.invoiceSettings.notes || 'お支払いは請求書発行日より30日以内にお願いいたします。',
        ``,
        `※チームプラン・アカウント共有サービスのため、使用量による追加料金は発生いたしません。`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ].join('\n');
      
      // ダウンロードシミュレート
      const element = document.createElement('a');
      const file = new Blob([invoiceContent], { type: 'text/plain; charset=utf-8' });
      
      element.href = URL.createObjectURL(file);
      element.download = `請求書_${customer.name}_${invoiceData.invoiceNumber}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setMessage({ type: 'success', text: '請求書を生成しました。' });
      setInvoiceDialogOpen(false);
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      setMessage({ type: 'error', text: '請求書の生成に失敗しました。' });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const updateAccount = async (updatedAccount: ChatGptAccount) => {
    if (!customer) return;
    
    const updatedAccounts = gptAccounts.map(acc => 
      acc.id === updatedAccount.id ? updatedAccount : acc
    );
    const updatedCustomer = {
      ...customer,
      chatGptAccounts: updatedAccounts
    };
    
    // ローカル状態を先に更新
    setGptAccounts(updatedAccounts);
    setCustomer(updatedCustomer);
    
    // ローカルストレージに保存（開発用）
    try {
      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const updatedCustomers = existingCustomers.map((c: Customer) => 
        c.id === customer.id ? updatedCustomer : c
      );
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));
      
      setMessage({ type: 'success', text: 'ChatGPTアカウントを更新しました。' });
    } catch (error) {
      console.log('ローカル開発モードで動作中');
      setMessage({ type: 'success', text: 'ChatGPTアカウントを更新しました。（ローカルモード）' });
    }
  };

  const getTeamPlanStatus = () => {
    if (!customer) return { status: 'inactive', description: 'チームプラン未加入' };
    
    const activeAccounts = customer.chatGptAccounts.filter(acc => acc.isActive).length;
    if (activeAccounts === 0) return { status: 'inactive', description: 'アカウント未設定' };
    if (activeAccounts <= 5) return { status: 'normal', description: 'チームプラン（通常利用）' };
    return { status: 'heavy', description: 'チームプラン（高利用）' };
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (!customer) {
    return <Typography>顧客が見つかりません。</Typography>;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
          sx={{ mr: 2 }}
        >
          戻る
        </Button>
        <Typography variant="h4">
          顧客詳細
        </Typography>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              基本情報
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="顧客名"
                  value={customer.name}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="組織名"
                  value={customer.organization}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  value={customer.email}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  現在の更新期限: {calculateExpiresAt().toLocaleDateString('ja-JP')}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              ChatGPTアカウント管理
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs>
                  <TextField
                    fullWidth
                    size="small"
                    label="新しいChatGPTアカウント"
                    placeholder="email@chatgpt.com"
                    value={newGptEmail}
                    onChange={(e) => setNewGptEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addGptAccount()}
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={addGptAccount}
                    disabled={!newGptEmail.trim()}
                    color="primary"
                  >
                    追加・保存
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {gptAccounts.length > 0 ? (
              <List dense>
                {gptAccounts.map((account) => (
                  <ListItem key={account.id} divider>
                    <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <ListItemText 
                      primary={account.email}
                      secondary={(() => {
                        const product = companyInfo?.products.find(p => p.id === account.productId);
                        const planInfo = product ? `${product.name} (¥${product.unitPrice.toLocaleString()}/月)` : 'プラン未設定';
                        const startDate = account.startDate || account.createdAt;
                        const startInfo = ` | 開始: ${new Date(startDate).toLocaleDateString('ja-JP')}`;
                        const expiresInfo = account.expiresAt ? ` | 期限: ${new Date(account.expiresAt).toLocaleDateString('ja-JP')}` : '';
                        return `${planInfo}${startInfo}${expiresInfo}`;
                      })()}
                    />
                    <ListItemSecondaryAction>
                      <Chip 
                        label={account.status || (account.isActive ? 'アクティブ' : '無効')} 
                        size="small" 
                        color={
                          account.status === 'active' || account.isActive ? 'success' : 
                          account.status === 'suspended' ? 'warning' : 
                          account.status === 'expired' ? 'error' : 'default'
                        }
                        sx={{ mr: 1 }}
                      />
                      <IconButton 
                        edge="end" 
                        size="small"
                        onClick={() => {
                          // 開始日付がない場合は登録日をデフォルトに設定
                          const accountWithDefaults = {
                            ...account,
                            startDate: account.startDate || account.createdAt,
                            status: account.status || (account.isActive ? 'active' : 'suspended'),
                            subscriptionMonths: account.subscriptionMonths || 12
                          };
                          setEditingAccount(accountWithDefaults);
                          setAccountDialogOpen(true);
                        }}
                        color="primary"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        size="small"
                        onClick={() => removeGptAccount(account.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                ChatGPTアカウントが設定されていません
              </Typography>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              ステータス更新
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>ステータス</InputLabel>
                  <Select
                    value={formData.status}
                    label="ステータス"
                    onChange={handleSelectChange('status')}
                  >
                    <MenuItem value="trial">お試し</MenuItem>
                    <MenuItem value="active">アクティブ</MenuItem>
                    <MenuItem value="suspended">一時停止</MenuItem>
                    <MenuItem value="cancelled">キャンセル</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>サービスプラン</InputLabel>
                  <Select
                    value={formData.productId}
                    label="サービスプラン"
                    onChange={handleSelectChange('productId')}
                  >
                    {companyInfo?.products.filter(p => p.isActive).map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name} - ¥{product.unitPrice.toLocaleString()}/月
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="申込み月数"
                  type="number"
                  value={formData.subscriptionMonths}
                  onChange={handleInputChange('subscriptionMonths')}
                  inputProps={{ min: 1, max: 36 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? '更新中...' : 'ステータス更新'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    契約情報
                  </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  支払い方法
                </Typography>
                <Typography>
                  {customer.paymentMethod === 'card' ? 'クレジットカード' : '請求書'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  現在のプラン
                </Typography>
                <Chip label="Plus プラン" color="primary" size="small" />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  登録日
                </Typography>
                <Typography>
                  {new Date(customer.registeredAt).toLocaleDateString('ja-JP')}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  契約期間
                </Typography>
                <Typography>
                  {customer.subscriptionMonths}ヶ月
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  更新期限
                </Typography>
                <Typography>
                  {new Date(customer.expiresAt).toLocaleDateString('ja-JP')}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  最終アクティビティ
                </Typography>
                <Typography>
                  {new Date(customer.lastActivityAt).toLocaleDateString('ja-JP')}
                </Typography>
              </Box>
              {customer.stripeCustomerId && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Stripe顧客ID
                  </Typography>
                  <Typography variant="body2">
                    {customer.stripeCustomerId}
                  </Typography>
                </Box>
              )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    チームプラン状況
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      プランステータス
                    </Typography>
                    <Chip 
                      label={getTeamPlanStatus().description}
                      color={
                        getTeamPlanStatus().status === 'inactive' ? 'default' :
                        getTeamPlanStatus().status === 'normal' ? 'success' : 'primary'
                      }
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      アクティブアカウント数
                    </Typography>
                    <Typography variant="h6">
                      {customer ? customer.chatGptAccounts.filter(acc => acc.isActive).length : 0} / {customer ? customer.chatGptAccounts.length : 0}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      月額料金
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ¥{(() => {
                        if (!customer || !companyInfo) return 0;
                        return customer.chatGptAccounts
                          .filter(acc => acc.isActive || acc.status === 'active')
                          .reduce((total, acc) => {
                            const product = companyInfo.products.find(p => p.id === acc.productId) ||
                                           companyInfo.products.find(p => p.id === customer.productId) ||
                                           companyInfo.products.find(p => p.isActive);
                            return total + (product?.unitPrice || 20000);
                          }, 0).toLocaleString();
                      })()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      アカウント個別課金制（プラン・期間はアカウント毎に設定可能）
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    請求管理
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ReceiptIcon />}
                    onClick={() => setInvoiceDialogOpen(true)}
                    sx={{ mb: 1 }}
                  >
                    請求書発行
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AnalyticsIcon />}
                  >
                    使用状況レポート
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      {/* 請求書発行ダイアログ */}
      <Dialog open={invoiceDialogOpen} onClose={() => setInvoiceDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <ReceiptIcon sx={{ mr: 1 }} />
            請求書発行
          </Box>
        </DialogTitle>
        <DialogContent>
          {customer && (
            <Box>
              <Typography variant="h6" gutterBottom>
                請求情報
              </Typography>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>お客様</strong></TableCell>
                      <TableCell>{customer.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>組織</strong></TableCell>
                      <TableCell>{customer.organization}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>アカウント数</strong></TableCell>
                      <TableCell>{customer.chatGptAccounts.filter(acc => acc.isActive || acc.status === 'active').length}アカウント</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>合計金額</strong></TableCell>
                      <TableCell style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1976d2' }}>
                        ¥{(() => {
                          if (!companyInfo) return 0;
                          return customer.chatGptAccounts
                            .filter(acc => acc.isActive || acc.status === 'active')
                            .reduce((total, acc) => {
                              const product = companyInfo.products.find(p => p.id === acc.productId) ||
                                             companyInfo.products.find(p => p.id === customer.productId) ||
                                             companyInfo.products.find(p => p.isActive);
                              const months = acc.subscriptionMonths || customer.subscriptionMonths || 12;
                              return total + ((product?.unitPrice || 20000) * months);
                            }, 0).toLocaleString();
                        })()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                ChatGPTアカウント一覧
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>アカウント</TableCell>
                      <TableCell>状態</TableCell>
                      <TableCell>登録日</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customer.chatGptAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>{account.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={account.isActive ? 'アクティブ' : '停止中'} 
                            size="small" 
                            color={account.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{new Date(account.createdAt).toLocaleDateString('ja-JP')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialogOpen(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={generateInvoice} 
            variant="contained" 
            startIcon={isGeneratingInvoice ? undefined : <DownloadIcon />}
            disabled={isGeneratingInvoice}
          >
            {isGeneratingInvoice ? '生成中...' : '請求書をダウンロード'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* アカウント編集ダイアログ */}
      <Dialog open={accountDialogOpen} onClose={() => setAccountDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <EditIcon sx={{ mr: 1 }} />
            アカウント編集
          </Box>
        </DialogTitle>
        <DialogContent>
          {editingAccount && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="メールアドレス"
                    value={editingAccount.email}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>ステータス</InputLabel>
                    <Select
                      value={editingAccount.status || 'active'}
                      label="ステータス"
                      onChange={(e) => setEditingAccount({
                        ...editingAccount,
                        status: e.target.value as 'active' | 'suspended' | 'expired',
                        isActive: e.target.value === 'active'
                      })}
                    >
                      <MenuItem value="active">アクティブ</MenuItem>
                      <MenuItem value="suspended">一時停止</MenuItem>
                      <MenuItem value="expired">期限切れ</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>サービスプラン</InputLabel>
                    <Select
                      value={editingAccount.productId || ''}
                      label="サービスプラン"
                      onChange={(e) => setEditingAccount({
                        ...editingAccount,
                        productId: e.target.value
                      })}
                    >
                      {companyInfo?.products.filter(p => p.isActive).map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name} - ¥{product.unitPrice.toLocaleString()}/月
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="開始日付"
                    type="date"
                    value={(() => {
                      try {
                        const date = editingAccount.startDate || editingAccount.createdAt;
                        return date instanceof Date ? date.toISOString().split('T')[0] : new Date(date).toISOString().split('T')[0];
                      } catch (e) {
                        return new Date().toISOString().split('T')[0];
                      }
                    })()}
                    onChange={(e) => {
                      const startDate = new Date(e.target.value);
                      const months = editingAccount.subscriptionMonths || 12;
                      const expiresAt = new Date(startDate);
                      expiresAt.setMonth(expiresAt.getMonth() + months);
                      setEditingAccount({
                        ...editingAccount,
                        startDate,
                        expiresAt
                      });
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="契約期間（月）"
                    type="number"
                    value={editingAccount.subscriptionMonths || 12}
                    onChange={(e) => {
                      const months = parseInt(e.target.value);
                      const startDateValue = editingAccount.startDate || editingAccount.createdAt;
                      const startDate = startDateValue instanceof Date ? startDateValue : new Date(startDateValue);
                      const expiresAt = new Date(startDate);
                      expiresAt.setMonth(expiresAt.getMonth() + months);
                      setEditingAccount({
                        ...editingAccount,
                        subscriptionMonths: months,
                        expiresAt
                      });
                    }}
                    inputProps={{ min: 1, max: 36 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="更新期限"
                    type="date"
                    value={(() => {
                      try {
                        return editingAccount.expiresAt instanceof Date ? 
                          editingAccount.expiresAt.toISOString().split('T')[0] : 
                          editingAccount.expiresAt ? new Date(editingAccount.expiresAt).toISOString().split('T')[0] : '';
                      } catch (e) {
                        return '';
                      }
                    })()}
                    onChange={(e) => setEditingAccount({
                      ...editingAccount,
                      expiresAt: new Date(e.target.value)
                    })}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">
                    登録日: {new Date(editingAccount.createdAt).toLocaleDateString('ja-JP')}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountDialogOpen(false)}>
            キャンセル
          </Button>
          <Button 
            onClick={() => {
              if (editingAccount) {
                updateAccount(editingAccount);
                setAccountDialogOpen(false);
                setEditingAccount(null);
              }
            }} 
            variant="contained"
          >
            更新
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}