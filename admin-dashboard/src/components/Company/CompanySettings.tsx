import React, { useEffect, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  AccountBalance as BankIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { CompanyInfo, ProductInfo } from '../../types';

export default function CompanySettings() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductInfo | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<ProductInfo>>({
    name: '',
    description: '',
    unitPrice: 0,
    taxRate: 10,
    isActive: true,
  });

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      // ローカルストレージから会社情報を取得
      const localCompanyInfo = localStorage.getItem('companyInfo');
      if (localCompanyInfo) {
        setCompanyInfo(JSON.parse(localCompanyInfo));
      } else {
        // デフォルトの会社情報
        const defaultCompanyInfo: CompanyInfo = {
          id: 'company-1',
          companyName: '株式会社WonderDrill',
          representativeName: '代表取締役 山田太郎',
          postalCode: '100-0001',
          address: '東京都千代田区丸の内1-1-1',
          phoneNumber: '03-1234-5678',
          email: 'info@wonderdrill.com',
          website: 'https://wonderdrill.com',
          taxId: '1234567890123',
          bankInfo: {
            bankName: '三菱UFJ銀行',
            branchName: '丸の内支店',
            accountType: 'checking',
            accountNumber: '1234567',
            accountHolder: 'カ）ワンダードリル',
          },
          products: [
            {
              id: 'prod-1',
              name: 'ChatGPT Plus 医療機関向けプラン',
              description: '医療機関専用のChatGPT Plusサービス（チームプラン・アカウント共有）',
              unitPrice: 20000,
              taxRate: 10,
              isActive: true,
            },
            {
              id: 'prod-2',
              name: 'ChatGPT Plus 企業向けプラン',
              description: '企業向けのChatGPT Plusサービス（チームプラン・アカウント共有）',
              unitPrice: 15000,
              taxRate: 10,
              isActive: true,
            },
          ],
          invoiceSettings: {
            invoicePrefix: 'INV',
            paymentTermDays: 30,
            notes: 'お支払いは請求書発行日より30日以内にお願いいたします。',
          },
        };
        localStorage.setItem('companyInfo', JSON.stringify(defaultCompanyInfo));
        setCompanyInfo(defaultCompanyInfo);
      }
    } catch (error) {
      console.error('Failed to load company info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyInfo) return;

    setIsSaving(true);
    setMessage(null);

    try {
      localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
      setMessage({ type: 'success', text: '会社情報を保存しました。' });
    } catch (error) {
      console.error('Failed to save company info:', error);
      setMessage({ type: 'error', text: '保存に失敗しました。' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (!companyInfo) return;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCompanyInfo({
        ...companyInfo,
        [parent]: {
          ...(companyInfo as any)[parent],
          [child]: value,
        },
      });
    } else {
      setCompanyInfo({
        ...companyInfo,
        [field]: value,
      });
    }
  };

  const addProduct = () => {
    if (!companyInfo || !newProduct.name) return;

    const product: ProductInfo = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      description: newProduct.description || '',
      unitPrice: newProduct.unitPrice || 0,
      taxRate: newProduct.taxRate || 10,
      isActive: newProduct.isActive ?? true,
    };

    setCompanyInfo({
      ...companyInfo,
      products: [...companyInfo.products, product],
    });

    setNewProduct({
      name: '',
      description: '',
      unitPrice: 0,
      taxRate: 10,
      isActive: true,
    });
    setProductDialogOpen(false);
  };

  const removeProduct = (productId: string) => {
    if (!companyInfo) return;

    setCompanyInfo({
      ...companyInfo,
      products: companyInfo.products.filter(p => p.id !== productId),
    });
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (!companyInfo) {
    return <Typography>会社情報が見つかりません。</Typography>;
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <BusinessIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">
          会社情報設定
        </Typography>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 基本情報 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              基本情報
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="会社名"
                  value={companyInfo.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="代表者名"
                  value={companyInfo.representativeName}
                  onChange={(e) => handleInputChange('representativeName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="郵便番号"
                  value={companyInfo.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="住所"
                  value={companyInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="電話番号"
                  value={companyInfo.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ウェブサイト"
                  value={companyInfo.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="法人番号"
                  value={companyInfo.taxId || ''}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* 銀行情報 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <BankIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                振込先情報
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="銀行名"
                  value={companyInfo.bankInfo.bankName}
                  onChange={(e) => handleInputChange('bankInfo.bankName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="支店名"
                  value={companyInfo.bankInfo.branchName}
                  onChange={(e) => handleInputChange('bankInfo.branchName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>口座種別</InputLabel>
                  <Select
                    value={companyInfo.bankInfo.accountType}
                    label="口座種別"
                    onChange={(e) => handleInputChange('bankInfo.accountType', e.target.value)}
                  >
                    <MenuItem value="checking">普通</MenuItem>
                    <MenuItem value="savings">当座</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="口座番号"
                  value={companyInfo.bankInfo.accountNumber}
                  onChange={(e) => handleInputChange('bankInfo.accountNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="口座名義"
                  value={companyInfo.bankInfo.accountHolder}
                  onChange={(e) => handleInputChange('bankInfo.accountHolder', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* 請求書設定 */}
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ReceiptIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                請求書設定
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="請求書番号プレフィックス"
                  value={companyInfo.invoiceSettings.invoicePrefix}
                  onChange={(e) => handleInputChange('invoiceSettings.invoicePrefix', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="支払期限（日数）"
                  type="number"
                  value={companyInfo.invoiceSettings.paymentTermDays}
                  onChange={(e) => handleInputChange('invoiceSettings.paymentTermDays', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="請求書備考"
                  multiline
                  rows={3}
                  value={companyInfo.invoiceSettings.notes || ''}
                  onChange={(e) => handleInputChange('invoiceSettings.notes', e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* サイドパネル - 製品管理 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                製品・サービス
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setProductDialogOpen(true)}
                size="small"
              >
                追加
              </Button>
            </Box>
            
            {companyInfo.products.length > 0 ? (
              <List dense>
                {companyInfo.products.map((product) => (
                  <ListItem key={product.id} divider>
                    <ListItemText
                      primary={product.name}
                      secondary={`¥${product.unitPrice.toLocaleString()}/月`}
                    />
                    <ListItemSecondaryAction>
                      <Chip 
                        label={product.isActive ? 'アクティブ' : '無効'} 
                        size="small" 
                        color={product.isActive ? 'success' : 'default'}
                        sx={{ mr: 1 }}
                      />
                      <IconButton 
                        edge="end" 
                        size="small"
                        onClick={() => removeProduct(product.id)}
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
                製品が登録されていません
              </Typography>
            )}
          </Paper>

          <Box sx={{ mt: 3 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving}
              size="large"
            >
              {isSaving ? '保存中...' : '設定を保存'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* 製品追加ダイアログ */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>製品・サービス追加</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="製品名"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="説明"
                multiline
                rows={2}
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="単価（円）"
                type="number"
                value={newProduct.unitPrice}
                onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="消費税率（%）"
                type="number"
                value={newProduct.taxRate}
                onChange={(e) => setNewProduct({ ...newProduct, taxRate: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={addProduct} variant="contained" disabled={!newProduct.name}>
            追加
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}