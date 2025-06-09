import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Link as LinkIcon,
  Refresh as RefreshIcon,
  CloudDownload as CloudDownloadIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { customerApi } from '../../services/api';
import { Customer, CompanyInfo } from '../../types';

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadCompanyInfo();
    
    // ウィンドウフォーカス時にデータを再読み込み
    const handleFocus = () => {
      loadCustomers();
      loadCompanyInfo();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    filterCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, customers]);

  const loadCustomers = async (forceRefresh = false) => {
    const loadingState = forceRefresh ? setIsRefreshing : setIsLoading;
    loadingState(true);
    try {
      // Azure APIから最新データを取得（ローカルストレージフォールバック削除）
      const data = await customerApi.getAll();
      
      const transformedData = data.map((customer: any) => ({
        id: customer.id || customer.customerId || customer.rowKey,
        email: customer.email,
        organization: customer.organizationName || customer.organization,
        name: customer.contactPerson || customer.name,
        phoneNumber: customer.phoneNumber || '',
        postalCode: customer.postalCode || '',
        address: customer.address || '',
        facilityType: customer.facilityType || '',
        requestedAccountCount: customer.requestedAccountCount || customer.accountCount || 1,
        applicationDate: customer.submittedAt ? new Date(customer.submittedAt) : undefined,
        chatGptAccounts: customer.chatGptAccounts || [],
        status: customer.status || 'trial',
        plan: customer.planType || customer.plan || 'plus',
        paymentMethod: customer.paymentMethod || 'card',
        registeredAt: new Date(customer.createdAt || customer.registeredAt || customer.timestamp || Date.now()),
        subscriptionMonths: customer.billingCycle === 'monthly' ? 1 : 12,
        expiresAt: new Date(Date.now() + (customer.billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(customer.lastActiveAt || customer.lastActivityAt || customer.createdAt || Date.now()),
        accountCount: customer.accountCount || customer.requestedAccountCount || 1,
        applicationId: customer.applicationId,
        isNewApplication: customer.isNewApplication || false,
        productId: customer.productId || '',
        stripeCustomerId: customer.stripeCustomerId || null
      }));
      
      setCustomers(transformedData);
      setFilteredCustomers(transformedData);
      
      // 新規申込みがあるかチェック
      const newApplications = transformedData.filter((c: any) => c.isNewApplication);
      if (newApplications.length > 0) {
        console.log(`${newApplications.length}件の新規申込みを検出:`, newApplications);
      }
      
    } catch (error) {
      console.error('Azure APIからの顧客データ取得に失敗:', error);
      // エラー時は空配列を設定
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Azureから最新データを手動で取得
  const refreshFromAzure = async () => {
    await loadCustomers(true);
  };

  const loadCompanyInfo = () => {
    const companyInfoStr = localStorage.getItem('companyInfo');
    if (companyInfoStr) {
      setCompanyInfo(JSON.parse(companyInfoStr));
    }
  };

  const filterCustomers = () => {
    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.organization.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
    setPage(0);
  };

  // チームプラン状況の月額料金計算（CustomerDetailと共通ロジック）
  const calculateTeamPlanMonthlyFee = (customer: Customer, companyInfo: CompanyInfo | null) => {
    if (!customer || !companyInfo) return 0;
    return customer.chatGptAccounts
      .filter(acc => acc.isActive || acc.status === 'active')
      .reduce((total, acc) => {
        const product = companyInfo.products.find(p => p.id === acc.productId) ||
                       companyInfo.products.find(p => p.id === customer.productId) ||
                       companyInfo.products.find(p => p.isActive);
        return total + (product?.unitPrice || 20000);
      }, 0);
  };

  const calculateMonthlyRevenue = (customer: Customer) => {
    // trialステータスの顧客は収益を0とする
    if (customer.status !== 'active') {
      return 0;
    }
    // チームプラン状況の月額料金をそのまま使用
    return calculateTeamPlanMonthlyFee(customer, companyInfo);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
      trial: { label: 'お試し', color: 'warning' },
      active: { label: 'アクティブ', color: 'success' },
      suspended: { label: '一時停止', color: 'error' },
      cancelled: { label: 'キャンセル', color: 'default' },
    };
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getPlanChip = (plan: string) => {
    const planConfig: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' }> = {
      basic: { label: 'Basic', color: 'default' },
      plus: { label: 'Plus', color: 'primary' },
      enterprise: { label: 'Enterprise', color: 'secondary' },
    };
    const config = planConfig[plan] || { label: plan, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  // 新規申込みの数をカウント
  const newApplicationsCount = customers.filter((c: any) => c.isNewApplication).length;

  return (
    <Box>
      {newApplicationsCount > 0 && (
        <Alert 
          severity="info" 
          icon={<NotificationsIcon />}
          sx={{ mb: 3 }}
        >
          {newApplicationsCount}件の新規申込みがあります。「Azureから最新データ取得」ボタンで最新情報を確認してください。
        </Alert>
      )}
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          顧客管理
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<LinkIcon />}
            onClick={() => navigate('/customers/new')}
          >
            新規顧客を登録
          </Button>
          <Button
            variant="outlined"
            startIcon={<NotificationsIcon />}
            onClick={() => {
              // Notion申し込み確認ページを開く
              window.open('https://notion.so', '_blank');
            }}
          >
            Notion申し込み確認
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<EmailIcon />}
            onClick={() => {
              alert('請求書メール一括送信機能\n各顧客の詳細画面から個別送信が可能です');
            }}
          >
            請求書送信
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              console.log('Test navigation to customer 1');
              navigate('/customers/1');
            }}
          >
            テスト: 顧客詳細を開く
          </Button>
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            onClick={() => navigate('/accounts/link')}
          >
            アカウント紐付け
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="顧客名、メール、組織名で検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>顧客名</TableCell>
                <TableCell>組織</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>ChatGPTアカウント</TableCell>
                <TableCell>月額収益</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>登録日</TableCell>
                <TableCell>更新期限</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer) => (
                  <TableRow 
                    key={customer.id} 
                    hover
                    sx={(customer as any).isNewApplication ? { 
                      backgroundColor: '#fff3cd',
                      '&:hover': { backgroundColor: '#ffeaa7' }
                    } : undefined}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {customer.name}
                        {(customer as any).isNewApplication && (
                          <Chip 
                            label="新規申込み" 
                            size="small" 
                            color="warning" 
                            variant="filled"
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{customer.organization}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      {customer.chatGptAccounts.length > 0 ? (
                        <Chip 
                          label={`${customer.chatGptAccounts.filter(acc => acc.isActive).length}/${customer.chatGptAccounts.length}アカウント`} 
                          size="small" 
                          color="primary" 
                        />
                      ) : (
                        <Chip label="未紐付け" size="small" color="warning" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        ¥{calculateMonthlyRevenue(customer).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(customer.status)}</TableCell>
                    <TableCell>
                      {new Date(customer.registeredAt).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell>
                      {new Date(customer.expiresAt).toLocaleDateString('ja-JP')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => {
                          console.log('Navigating to customer:', customer.id);
                          navigate(`/customers/${customer.id}`);
                        }}
                        title="顧客詳細を編集"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="表示件数:"
        />
      </Paper>
    </Box>
  );
}