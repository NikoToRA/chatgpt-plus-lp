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
  Notifications as NotificationsIcon,
  Sync as SyncIcon,
  Delete as DeleteIcon,
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
  const [error, setError] = useState<string>('');

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
    setError('');
    
    try {
      // Supabaseから最新データを取得
      const data = await customerApi.getAll();
      
      setCustomers(data);
      setFilteredCustomers(data);
      
      console.log(`Supabaseから${data.length}件の顧客データを取得しました`);
      
    } catch (error) {
      console.error('Supabaseからの顧客データ取得に失敗:', error);
      const errorMessage = error instanceof Error ? error.message : 'データの取得に失敗しました';
      setError(errorMessage);
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Supabaseから最新データを手動で取得
  const refreshFromSupabase = async () => {
    console.log('🔄 Supabaseから同期開始');
    await loadCustomers(true);
    console.log('✅ Supabase同期完了');
  };

  // 顧客削除
  const handleDeleteCustomer = async (customer: Customer) => {
    const confirmMessage = `顧客「${customer.organization} - ${customer.name}」を削除しますか？\n\nこの操作は取り消せません。`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await customerApi.delete(customer.id);
        
        // 一覧から削除
        const updatedCustomers = customers.filter(c => c.id !== customer.id);
        setCustomers(updatedCustomers);
        setFilteredCustomers(updatedCustomers);
        
        console.log(`顧客 ${customer.name} を削除しました`);
      } catch (error) {
        console.error('顧客削除に失敗:', error);
        const errorMessage = error instanceof Error ? error.message : '削除に失敗しました';
        setError(`顧客削除エラー: ${errorMessage}`);
      }
    }
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

  return (
    <Box>
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError('')}
        >
          {error}
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
            variant="contained"
            color="success"
            startIcon={<SyncIcon />}
            onClick={refreshFromSupabase}
            disabled={isRefreshing}
          >
{isRefreshing ? 'Supabase同期中...' : 'Supabaseから同期'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<NotificationsIcon />}
            onClick={() => {
              // Notion申し込み確認ページを開く
              window.open('https://acute-bonsai-31d.notion.site/20d5d7357cc780a48de3e5a6a86c1bf4?pvs=105', '_blank');
            }}
          >
            Notion申し込み確認
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
                  >
                    <TableCell>
                      {customer.name}
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
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCustomer(customer)}
                        title="顧客を削除"
                      >
                        <DeleteIcon />
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