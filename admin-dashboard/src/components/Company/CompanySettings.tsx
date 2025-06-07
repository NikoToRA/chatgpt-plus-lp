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
  AccountBalance as BankIcon,
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
        🏢 会社設定 - テストバージョン
      </Typography>
      
      <Box mb={3} p={2} bgcolor="#f0f0f0" borderRadius={1}>
        <Typography variant="h6">データ読み込み成功</Typography>
        <Typography>会社名: {companyInfo.companyName || '未設定'}</Typography>
        <Typography>製品数: {companyInfo.products?.length || 0}個</Typography>
      </Box>

      <Box mb={3}>
        <Typography variant="h6">簡易製品追加テスト</Typography>
        <button 
          onClick={() => {
            try {
              alert('製品追加機能をテストします');
            } catch (error) {
              alert(`エラー: ${error}`);
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          簡易製品追加テスト
        </button>
      </Box>

      <Box mb={3}>
        <Typography variant="h6">デバッグ情報</Typography>
        {debugInfo.map((info, index) => (
          <Typography key={index} variant="body2">
            {index + 1}. {info}
          </Typography>
        ))}
      </Box>
    </Box>
  );

}
