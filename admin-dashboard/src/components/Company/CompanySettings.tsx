import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { CompanyInfo, ProductInfo } from '../../types';

export default function CompanySettings() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
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
      setComponentError(null);
      setDebugInfo(prev => [...prev, 'loadCompanyInfo開始']);
      
      // First try to get from Azure API
      try {
        setDebugInfo(prev => [...prev, 'Azure API呼び出し開始']);
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://chatgpt-plus-api.azurewebsites.net/api'}/company-settings`);
        if (response.ok) {
          setDebugInfo(prev => [...prev, 'API応答OK']);
          const data = await response.json();
          setDebugInfo(prev => [...prev, `APIデータ: ${JSON.stringify(data).substring(0, 100)}...`]);
          if (data.success && data.data) {
            setCompanyInfo(data.data);
            // Also save to localStorage as backup
            localStorage.setItem('companyInfo', JSON.stringify(data.data));
            setDebugInfo(prev => [...prev, 'APIデータ設定完了']);
            setIsLoading(false);
            return;
          }
        } else {
          setDebugInfo(prev => [...prev, `API応答エラー: ${response.status}`]);
        }
      } catch (apiError) {
        setDebugInfo(prev => [...prev, `APIエラー: ${(apiError as Error).message}`]);
        console.warn('Azure API not available, falling back to localStorage:', apiError);
      }

      // Fallback to localStorage
      setDebugInfo(prev => [...prev, 'localStorage確認開始']);
      const localCompanyInfo = localStorage.getItem('companyInfo');
      if (localCompanyInfo) {
        setDebugInfo(prev => [...prev, 'localStorageからデータ発見']);
        const parsedInfo = JSON.parse(localCompanyInfo);
        // 新しいフィールドが存在しない場合はデフォルト値を追加
        if (!parsedInfo.emailSettings) {
          parsedInfo.emailSettings = {
            sendgridApiKey: '',
            fromEmail: parsedInfo.email || 'info@wonderdrill.com',
            fromName: parsedInfo.companyName || '株式会社WonderDrill',
            isConfigured: false,
          };
        }
        if (!parsedInfo.invoiceTemplate) {
          parsedInfo.invoiceTemplate = {
            emailSubjectTemplate: '【{{companyName}}】{{billingType}}請求書のご送付 - {{invoiceNumber}}',
            emailBodyTemplate: `{{customerOrganization}}
{{customerName}} 様

いつもお世話になっております。
{{companyName}}の{{representativeName}}です。

{{billingType}}の請求書をお送りいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【請求内容】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

請求書番号: {{invoiceNumber}}
請求金額: ¥{{totalAmount}}
お支払い期限: {{dueDate}}

【サービス内容】
ChatGPT Plus 医療機関向けプラン（チームプラン・アカウント共有）
アクティブアカウント数: {{activeAccountCount}}アカウント
月額料金: ¥{{monthlyFee}}
{{billingPeriodDescription}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【お振込先】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

銀行名: {{bankName}}
支店名: {{branchName}}
口座種別: {{accountType}}
口座番号: {{accountNumber}}
口座名義: {{accountHolder}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

添付ファイルに詳細な請求書を添付いたします。
ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{companyName}}
{{representativeName}}
〒{{postalCode}} {{address}}
TEL: {{phoneNumber}}
Email: {{email}}
{{#if website}}Website: {{website}}{{/if}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            invoiceFooterNotes: '※チームプラン・アカウント共有サービスのため、使用量による追加料金は発生いたしません。',
          };
        }
        setCompanyInfo(parsedInfo);
        // 更新されたデータを保存
        localStorage.setItem('companyInfo', JSON.stringify(parsedInfo));
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
          emailSettings: {
            sendgridApiKey: '',
            fromEmail: 'info@wonderdrill.com',
            fromName: '株式会社WonderDrill',
            isConfigured: false,
          },
          invoiceTemplate: {
            emailSubjectTemplate: '【{{companyName}}】{{billingType}}請求書のご送付 - {{invoiceNumber}}',
            emailBodyTemplate: `{{customerOrganization}}
{{#if customerAddress}}〒{{customerPostalCode}}
{{customerAddress}}{{/if}}
{{customerName}} 様

いつもお世話になっております。
{{companyName}}の{{representativeName}}です。

{{billingType}}の請求書をお送りいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【請求内容】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

請求書番号: {{invoiceNumber}}
請求金額: ¥{{totalAmount}}
お支払い期限: {{dueDate}}

【サービス内容】
ChatGPT Plus 医療機関向けプラン（チームプラン・アカウント共有）
アクティブアカウント数: {{activeAccountCount}}アカウント
月額料金: ¥{{monthlyFee}}
{{billingPeriodDescription}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【お振込先】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

銀行名: {{bankName}}
支店名: {{branchName}}
口座種別: {{accountType}}
口座番号: {{accountNumber}}
口座名義: {{accountHolder}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

添付ファイルに詳細な請求書を添付いたします。
ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{companyName}}
{{representativeName}}
〒{{postalCode}} {{address}}
TEL: {{phoneNumber}}
Email: {{email}}
{{#if website}}Website: {{website}}{{/if}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            invoiceFooterNotes: '※チームプラン・アカウント共有サービスのため、使用量による追加料金は発生いたしません。',
          },
        };
        localStorage.setItem('companyInfo', JSON.stringify(defaultCompanyInfo));
        setCompanyInfo(defaultCompanyInfo);
      }
    } catch (error) {
      console.error('Failed to load company info:', error);
      setComponentError(`会社情報の読み込みに失敗しました: ${(error as Error).message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyInfo) return;

    setIsSaving(true);
    setMessage(null);

    try {
      // First try to save to Azure API
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://chatgpt-plus-api.azurewebsites.net/api'}/company-settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(companyInfo),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Also save to localStorage as backup
            localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
            setMessage({ type: 'success', text: '会社情報をAzure API (in-memory) に保存しました。' });
            return;
          }
        }
        throw new Error('Azure API save failed');
      } catch (apiError) {
        console.error('Azure API save failed:', apiError);
        // Fallback to localStorage only
        localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
        setMessage({ type: 'error', text: `Azure API接続失敗: ${(apiError as Error).message || 'Unknown error'}。ローカル保存のみ実行されました。` });
      }
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

  const addProduct = async () => {
    if (!companyInfo || !newProduct.name) return;

    const product: ProductInfo = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      description: newProduct.description || '',
      unitPrice: newProduct.unitPrice || 0,
      taxRate: newProduct.taxRate || 10,
      isActive: newProduct.isActive ?? true,
    };

    const updatedCompanyInfo = {
      ...companyInfo,
      products: [...companyInfo.products, product],
    };

    setCompanyInfo(updatedCompanyInfo);

    // 製品追加後に自動保存
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://chatgpt-plus-api.azurewebsites.net/api'}/company-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCompanyInfo),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          localStorage.setItem('companyInfo', JSON.stringify(updatedCompanyInfo));
          setMessage({ type: 'success', text: '製品が追加され、Azure API (in-memory) に保存されました。' });
        } else {
          throw new Error('API response indicates failure');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Azure API save failed, saving to localStorage only:', error);
      localStorage.setItem('companyInfo', JSON.stringify(updatedCompanyInfo));
      setMessage({ type: 'success', text: '製品が追加されました（ローカル保存のみ、Azure DBエラー）。' });
    }

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

  if (componentError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {componentError}
        </Alert>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => {
            setComponentError(null);
            loadCompanyInfo();
          }}
        >
          再試行
        </Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box p={3}>
        <Typography>会社設定を読み込み中...</Typography>
        <Box mt={2}>
          <Typography variant="caption" component="div">
            デバッグ情報:
          </Typography>
          {debugInfo.map((info, index) => (
            <Typography key={index} variant="caption" component="div">
              {index + 1}. {info}
            </Typography>
          ))}
        </Box>
      </Box>
    );
  }

  if (!companyInfo) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          会社情報が見つかりません。
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        🏢 会社設定管理
      </Typography>
      
      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Box mb={3}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">基本情報</Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="会社名"
                value={companyInfo.companyName || ''}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="代表者名"
                value={companyInfo.representativeName || ''}
                onChange={(e) => handleInputChange('representativeName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="郵便番号"
                value={companyInfo.postalCode || ''}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="住所"
                value={companyInfo.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="電話番号"
                value={companyInfo.phoneNumber || ''}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={companyInfo.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ウェブサイト"
                value={companyInfo.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Box mb={3}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">製品・サービス管理</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setProductDialogOpen(true)}
            >
              製品追加
            </Button>
          </Box>
          
          <List>
            {companyInfo.products.map((product, index) => (
              <ListItem key={product.id} divider={index < companyInfo.products.length - 1}>
                <ListItemText
                  primary={product.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {product.description}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={1}>
                        <Typography variant="body2" color="text.primary" sx={{ mr: 2 }}>
                          価格: ¥{product.unitPrice.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                          税率: {(product.taxRate * 100).toFixed(0)}%
                        </Typography>
                        <Chip
                          label={product.isActive ? 'アクティブ' : '無効'}
                          color={product.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeProduct(product.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {companyInfo.products.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="製品が登録されていません"
                  secondary="「製品追加」ボタンから新しい製品を追加してください。"
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Box>

      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={isSaving}
          color="primary"
        >
          {isSaving ? '保存中...' : '設定を保存'}
        </Button>
      </Box>

      {/* 製品追加ダイアログ */}
      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新しい製品を追加</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="製品名"
              value={newProduct.name || ''}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="製品説明"
              multiline
              rows={3}
              value={newProduct.description || ''}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="単価"
              type="number"
              value={newProduct.unitPrice || ''}
              onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseInt(e.target.value) || 0 })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="税率 (%)"
              type="number"
              value={newProduct.taxRate ? (newProduct.taxRate * 100).toString() : '10'}
              onChange={(e) => setNewProduct({ ...newProduct, taxRate: (parseInt(e.target.value) || 10) / 100 })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>キャンセル</Button>
          <Button onClick={addProduct} variant="contained" disabled={!newProduct.name}>
            追加
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

}
