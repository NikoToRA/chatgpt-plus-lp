import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Email as EmailIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { InvoicePDF, Customer, CompanyInfo } from '../../types';

interface InvoiceManagerProps {
  customer: Customer;
  companyInfo: CompanyInfo | null;
  onInvoiceGenerated?: (invoice: InvoicePDF) => void;
}

export default function InvoiceManager({ customer, companyInfo, onInvoiceGenerated }: InvoiceManagerProps) {
  const [invoices, setInvoices] = useState<InvoicePDF[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    invoice: InvoicePDF | null;
    pdfUrl: string | null;
  }>({
    open: false,
    invoice: null,
    pdfUrl: null
  });

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  const loadInvoices = () => {
    // ローカルストレージから請求書一覧を取得
    const storedInvoices = localStorage.getItem(`invoices_${customer.id}`);
    if (storedInvoices) {
      const parsed = JSON.parse(storedInvoices).map((inv: any) => ({
        ...inv,
        issueDate: new Date(inv.issueDate),
        dueDate: new Date(inv.dueDate),
        createdAt: new Date(inv.createdAt),
        updatedAt: new Date(inv.updatedAt),
        emailSentAt: inv.emailSentAt ? new Date(inv.emailSentAt) : undefined,
      }));
      setInvoices(parsed);
    }
  };

  const generatePDF = async (billingType: 'monthly' | 'yearly') => {
    if (!companyInfo?.emailSettings?.isConfigured) {
      alert('SendGridの設定が完了していません。会社概要でAPIキーを設定してください。');
      return;
    }

    setIsGenerating(true);
    
    try {
      // PDF生成APIを呼び出し
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7071';
      const response = await fetch(`${apiBaseUrl}/api/generate-invoice-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer,
          companyInfo,
          billingType
        })
      });

      if (response.ok) {
        const result = await response.json();
        const newInvoice: InvoicePDF = {
          id: result.invoiceId,
          customerId: customer.id,
          customerName: customer.name,
          invoiceNumber: result.invoiceNumber,
          billingType,
          totalAmount: result.totalAmount,
          monthlyFee: result.monthlyFee,
          billingMonths: billingType === 'monthly' ? 1 : 12,
          issueDate: new Date(result.issueDate),
          dueDate: new Date(result.dueDate),
          status: 'draft',
          pdfUrl: result.pdfUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // ローカルストレージに保存
        const updatedInvoices = [newInvoice, ...invoices];
        setInvoices(updatedInvoices);
        localStorage.setItem(`invoices_${customer.id}`, JSON.stringify(updatedInvoices));

        // プレビューダイアログを開く
        setPreviewDialog({
          open: true,
          invoice: newInvoice,
          pdfUrl: result.pdfUrl
        });

        onInvoiceGenerated?.(newInvoice);
      } else {
        throw new Error('PDF生成に失敗しました');
      }
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成に失敗しました。開発環境ではシミュレーション動作します。');
      
      // 開発環境用のダミーデータ
      const dummyInvoice: InvoicePDF = {
        id: `inv-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        invoiceNumber: `INV-${Date.now()}`,
        billingType,
        totalAmount: billingType === 'monthly' ? 23500 : 282000,
        monthlyFee: 23500,
        billingMonths: billingType === 'monthly' ? 1 : 12,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        pdfUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedInvoices = [dummyInvoice, ...invoices];
      setInvoices(updatedInvoices);
      localStorage.setItem(`invoices_${customer.id}`, JSON.stringify(updatedInvoices));
      
      setPreviewDialog({
        open: true,
        invoice: dummyInvoice,
        pdfUrl: null
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendInvoiceEmail = async (invoice: InvoicePDF) => {
    setIsSending(true);
    
    try {
      // メール送信APIを呼び出し
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7071';
      const response = await fetch(`${apiBaseUrl}/api/send-invoice-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice,
          customer,
          companyInfo
        })
      });

      if (response.ok) {
        // 請求書のステータスを更新
        const updatedInvoice = {
          ...invoice,
          status: 'sent' as const,
          emailSentAt: new Date(),
          updatedAt: new Date()
        };
        
        const updatedInvoices = invoices.map(inv => 
          inv.id === invoice.id ? updatedInvoice : inv
        );
        setInvoices(updatedInvoices);
        localStorage.setItem(`invoices_${customer.id}`, JSON.stringify(updatedInvoices));
        
        alert('請求書メールを送信しました！');
        setPreviewDialog({ open: false, invoice: null, pdfUrl: null });
      } else {
        throw new Error('メール送信に失敗しました');
      }
    } catch (error) {
      console.error('メール送信エラー:', error);
      alert('メール送信をシミュレートしました（開発環境）');
      
      // 開発環境用の更新
      const updatedInvoice = {
        ...invoice,
        status: 'sent' as const,
        emailSentAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedInvoices = invoices.map(inv => 
        inv.id === invoice.id ? updatedInvoice : inv
      );
      setInvoices(updatedInvoices);
      localStorage.setItem(`invoices_${customer.id}`, JSON.stringify(updatedInvoices));
      
      setPreviewDialog({ open: false, invoice: null, pdfUrl: null });
    } finally {
      setIsSending(false);
    }
  };

  const downloadPDF = (invoice: InvoicePDF) => {
    if (invoice.pdfUrl) {
      // 実際のPDFダウンロード
      const link = document.createElement('a');
      link.href = invoice.pdfUrl;
      link.download = `請求書_${customer.name}_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // 開発環境用のダミーダウンロード
      alert(`${invoice.invoiceNumber}のPDFダウンロード（開発環境ではシミュレーション）`);
    }
  };

  const getStatusChip = (status: InvoicePDF['status']) => {
    const statusConfig = {
      draft: { label: '下書き', color: 'default' as const },
      sent: { label: '送信済み', color: 'primary' as const },
      paid: { label: '入金済み', color: 'success' as const },
      overdue: { label: '期限切れ', color: 'error' as const },
    };
    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        請求書管理
      </Typography>

      {/* PDF生成ボタン */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={() => generatePDF('monthly')}
              disabled={isGenerating}
            >
              {isGenerating ? <CircularProgress size={20} /> : '月払いPDF生成'}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={() => generatePDF('yearly')}
              disabled={isGenerating}
            >
              {isGenerating ? <CircularProgress size={20} /> : '年払いPDF生成'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* 請求書一覧 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>請求書番号</TableCell>
                <TableCell>請求タイプ</TableCell>
                <TableCell>金額</TableCell>
                <TableCell>発行日</TableCell>
                <TableCell>支払期限</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>送信日時</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">
                      請求書がありません
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.billingType === 'monthly' ? '月払い' : '年払い'} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>¥{invoice.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{invoice.issueDate.toLocaleDateString('ja-JP')}</TableCell>
                    <TableCell>{invoice.dueDate.toLocaleDateString('ja-JP')}</TableCell>
                    <TableCell>{getStatusChip(invoice.status)}</TableCell>
                    <TableCell>
                      {invoice.emailSentAt ? 
                        invoice.emailSentAt.toLocaleString('ja-JP') : 
                        '-'
                      }
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => setPreviewDialog({ 
                          open: true, 
                          invoice, 
                          pdfUrl: invoice.pdfUrl || null 
                        })}
                        title="プレビュー"
                      >
                        <PreviewIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => downloadPDF(invoice)}
                        title="PDFダウンロード"
                      >
                        <DownloadIcon />
                      </IconButton>
                      {invoice.status === 'draft' && (
                        <IconButton
                          size="small"
                          onClick={() => sendInvoiceEmail(invoice)}
                          title="メール送信"
                          disabled={isSending}
                        >
                          <EmailIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* PDFプレビューダイアログ */}
      <Dialog 
        open={previewDialog.open} 
        onClose={() => setPreviewDialog({ open: false, invoice: null, pdfUrl: null })}
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PdfIcon sx={{ mr: 1 }} />
            請求書プレビュー
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewDialog.invoice && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {previewDialog.invoice.invoiceNumber}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">請求先</Typography>
                  <Typography>{customer.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">請求金額</Typography>
                  <Typography variant="h6" color="primary">
                    ¥{previewDialog.invoice.totalAmount.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">請求タイプ</Typography>
                  <Typography>
                    {previewDialog.invoice.billingType === 'monthly' ? '月払い' : '年払い'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">支払期限</Typography>
                  <Typography>
                    {previewDialog.invoice.dueDate.toLocaleDateString('ja-JP')}
                  </Typography>
                </Grid>
              </Grid>
              
              {previewDialog.pdfUrl ? (
                <Box sx={{ mt: 2, height: 400, border: '1px solid #ddd' }}>
                  <iframe 
                    src={previewDialog.pdfUrl} 
                    width="100%" 
                    height="100%"
                    title="PDF Preview"
                  />
                </Box>
              ) : (
                <Box sx={{ mt: 2, p: 3, bgcolor: '#f5f5f5', textAlign: 'center' }}>
                  <PdfIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                  <Typography color="textSecondary">
                    PDFプレビュー（開発環境では表示されません）
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, invoice: null, pdfUrl: null })}>
            キャンセル
          </Button>
          {previewDialog.invoice && (
            <>
              <Button 
                startIcon={<DownloadIcon />}
                onClick={() => downloadPDF(previewDialog.invoice!)}
              >
                PDFダウンロード
              </Button>
              {previewDialog.invoice.status === 'draft' && (
                <Button 
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => sendInvoiceEmail(previewDialog.invoice!)}
                  disabled={isSending}
                >
                  {isSending ? '送信中...' : 'メール送信'}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}