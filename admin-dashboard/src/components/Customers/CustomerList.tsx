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
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Link as LinkIcon,
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

  const loadCustomers = async () => {
    try {
      // まずAzure APIから最新データを取得
      try {
        const data = await customerApi.getAll();
        if (data && data.length > 0) {
          // Azure APIからデータを取得できた場合
          const transformedData = data.map((customer: any) => ({
            id: customer.id || customer.customerId || customer.rowKey,
            email: customer.email,
            organization: customer.organizationName || customer.organization,
            name: customer.contactPerson || customer.name,
            chatGptAccounts: customer.chatGptAccounts || [],
            status: customer.status || 'trial',
            plan: customer.planType || customer.plan || 'plus',
            paymentMethod: customer.paymentMethod || 'card',
            registeredAt: new Date(customer.createdAt || customer.timestamp || Date.now()),
            subscriptionMonths: customer.billingCycle === 'monthly' ? 1 : 12,
            expiresAt: new Date(Date.now() + (customer.billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
            lastActivityAt: new Date(customer.lastActiveAt || customer.lastActivityAt || customer.createdAt || Date.now()),
            accountCount: customer.accountCount || 1,
            applicationId: customer.applicationId
          }));
          
          setCustomers(transformedData);
          setFilteredCustomers(transformedData);
          // 取得したデータをローカルストレージにも保存
          localStorage.setItem('customers', JSON.stringify(transformedData));
          return;
        }
      } catch (apiError) {
        console.warn('Azure API接続失敗、ローカルストレージから読み込み:', apiError);
      }
      
      // Azure APIから取得できない場合、ローカルストレージから確認
      const localCustomers = localStorage.getItem('customers');
      if (localCustomers) {
        const parsedCustomers = JSON.parse(localCustomers);
        setCustomers(parsedCustomers);
        setFilteredCustomers(parsedCustomers);
        return;
      }
      
      throw new Error('No data available from API or localStorage');
    } catch (error) {
      console.error('Failed to load customers:', error);
      // 開発用のダミーデータ
      const dummyCustomers: Customer[] = [
        {
          id: '1',
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
            },
            {
              id: 'gpt-6',
              email: 'yamada3@chatgpt.com',
              isActive: true,
              createdAt: new Date('2025-05-15')
            },
            {
              id: 'gpt-7',
              email: 'yamada4@chatgpt.com',
              isActive: true,
              createdAt: new Date('2025-05-20')
            }
          ],
          status: 'active',
          plan: 'plus',
          paymentMethod: 'card',
          registeredAt: new Date('2025-05-01'),
          subscriptionMonths: 12,
          expiresAt: new Date('2026-05-01'),
          lastActivityAt: new Date(),
        },
        {
          id: '2',
          email: 'suzuki@example.com',
          organization: '鈴木工業株式会社',
          name: '鈴木花子',
          chatGptAccounts: [],
          status: 'trial',
          plan: 'plus',
          paymentMethod: 'invoice',
          registeredAt: new Date('2025-05-15'),
          subscriptionMonths: 3,
          expiresAt: new Date('2025-08-15'),
          lastActivityAt: new Date(),
        },
        {
          id: '3',
          email: 'tanaka@example.com',
          organization: '田中システム',
          name: '田中次郎',
          chatGptAccounts: [
            {
              id: 'gpt-2',
              email: 'tanaka@chatgpt.com',
              isActive: true,
              createdAt: new Date('2025-04-20')
            },
            {
              id: 'gpt-3',
              email: 'tanaka2@chatgpt.com',
              isActive: true,
              createdAt: new Date('2025-04-25')
            },
            {
              id: 'gpt-4',
              email: 'tanaka3@chatgpt.com',
              isActive: false,
              createdAt: new Date('2025-04-30')
            }
          ],
          status: 'active',
          plan: 'plus',
          paymentMethod: 'invoice',
          registeredAt: new Date('2025-04-20'),
          subscriptionMonths: 6,
          expiresAt: new Date('2025-10-20'),
          lastActivityAt: new Date(),
        },
      ];
      // ダミーデータをローカルストレージに保存
      localStorage.setItem('customers', JSON.stringify(dummyCustomers));
      setCustomers(dummyCustomers);
      setFilteredCustomers(dummyCustomers);
    } finally {
      setIsLoading(false);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          顧客管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<LinkIcon />}
          onClick={() => navigate('/accounts/link')}
        >
          アカウント紐付け
        </Button>
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
                  <TableRow key={customer.id} hover>
                    <TableCell>{customer.name}</TableCell>
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
                        onClick={() => navigate(`/customers/${customer.id}`)}
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