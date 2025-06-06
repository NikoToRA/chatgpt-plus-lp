import React, { useEffect, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { dashboardApi } from '../../services/api';
import { DashboardStats, Customer } from '../../types';
import RevenueChart from './RevenueChart';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, recentData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentApplications(),
      ]);
      setStats(statsData);
      setRecentApplications(recentData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      
      // ローカルストレージから顧客データを取得して動的計算
      const localCustomers = localStorage.getItem('customers');
      let customers: Customer[] = [];
      
      if (localCustomers) {
        customers = JSON.parse(localCustomers);
      } else {
        // フォールバック用ダミーデータ
        customers = [
          {
            id: '1',
            email: 'yamada@example.com',
            organization: '株式会社山田商事',
            name: '山田太郎',
            chatGptAccounts: [
              { id: 'gpt-1', email: 'yamada@chatgpt.com', isActive: true, createdAt: new Date('2025-05-01') },
              { id: 'gpt-5', email: 'yamada2@chatgpt.com', isActive: true, createdAt: new Date('2025-05-10') },
              { id: 'gpt-6', email: 'yamada3@chatgpt.com', isActive: true, createdAt: new Date('2025-05-15') },
              { id: 'gpt-7', email: 'yamada4@chatgpt.com', isActive: true, createdAt: new Date('2025-05-20') }
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
              { id: 'gpt-2', email: 'tanaka@chatgpt.com', isActive: true, createdAt: new Date('2025-04-20') },
              { id: 'gpt-3', email: 'tanaka2@chatgpt.com', isActive: true, createdAt: new Date('2025-04-25') },
              { id: 'gpt-4', email: 'tanaka3@chatgpt.com', isActive: false, createdAt: new Date('2025-04-30') }
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
        localStorage.setItem('customers', JSON.stringify(customers));
      }
      
      // 動的計算
      const totalApplications = customers.length;
      const pendingApplications = customers.filter(c => c.status === 'trial').length;
      const activeAccounts = customers.filter(c => c.status === 'active').length;
      
      // 月間売上計算（アカウント数 × プラン料金）
      const companyInfoStr = localStorage.getItem('companyInfo');
      const companyInfo = companyInfoStr ? JSON.parse(companyInfoStr) : null;
      
      const monthlyRevenue = customers
        .filter(c => c.status === 'active')
        .reduce((total, customer) => {
          // 顧客詳細のチームプラン状況と同じ計算ロジック
          const customerRevenue = customer.chatGptAccounts
            .filter(acc => acc.isActive || acc.status === 'active')
            .reduce((customerTotal, acc) => {
              const product = companyInfo?.products.find((p: any) => p.id === acc.productId) ||
                             companyInfo?.products.find((p: any) => p.id === customer.productId) ||
                             companyInfo?.products.find((p: any) => p.isActive);
              return customerTotal + (product?.unitPrice || 20000);
            }, 0);
          return total + customerRevenue;
        }, 0);
      
      const conversionRate = totalApplications > 0 ? (activeAccounts / totalApplications) * 100 : 0;
      
      setStats({
        totalApplications,
        pendingApplications,
        activeAccounts,
        monthlyRevenue,
        conversionRate: Math.round(conversionRate * 100) / 100,
      });
      
      // 最新の申込み（お試し状態の顧客）
      setRecentApplications(
        customers
          .filter(c => c.status === 'trial')
          .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
          .slice(0, 5)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: '総申込数',
      value: stats?.totalApplications || 0,
      icon: <AssignmentIcon />,
      color: '#3f51b5',
    },
    {
      title: '処理待ち',
      value: stats?.pendingApplications || 0,
      icon: <AssignmentIcon />,
      color: '#ff9800',
    },
    {
      title: 'アクティブアカウント',
      value: stats?.activeAccounts || 0,
      icon: <PeopleIcon />,
      color: '#4caf50',
    },
    {
      title: '月間売上',
      value: `¥${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: <AttachMoneyIcon />,
      color: '#f44336',
    },
  ];


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

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ダッシュボード
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h5">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <RevenueChart />
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              コンバージョン率
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 200 }}>
              <Box textAlign="center">
                <Typography variant="h2" color="primary">
                  {stats?.conversionRate || 0}%
                </Typography>
                <Typography color="textSecondary">
                  申込 → アクティブ
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  ※申込み＝契約のため、現在は参考値
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  LP資料申込数との比較用項目として維持
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="center">
              <TrendingUpIcon color="success" />
              <Typography color="success.main" sx={{ ml: 1 }}>
                前月比 +5.2%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mt: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            最新の申込
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>申込日時</TableCell>
                <TableCell>顧客名</TableCell>
                <TableCell>組織</TableCell>
                <TableCell>プラン</TableCell>
                <TableCell>ステータス</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentApplications.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{new Date(customer.registeredAt).toLocaleString('ja-JP')}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.organization}</TableCell>
                  <TableCell>{customer.plan.toUpperCase()}</TableCell>
                  <TableCell>{getStatusChip(customer.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}