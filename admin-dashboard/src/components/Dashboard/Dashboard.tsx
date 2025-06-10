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
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { customerApi } from '../../services/api';
import { DashboardStats, Customer } from '../../types';
import RevenueChart from './RevenueChart';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Supabaseから直接顧客データを取得して統計計算
      const customers = await customerApi.getAll();
      
      // 動的計算
      const totalApplications = customers.length;
      const activeAccounts = customers.filter(c => c.status === 'active').length;
      
      // 月間売上計算（アカウント数 × プラン料金）
      const companyInfoStr = localStorage.getItem('companyInfo');
      const companyInfo = companyInfoStr ? JSON.parse(companyInfoStr) : null;
      
      const monthlyRevenue = customers
        .filter(c => c.status === 'active')
        .reduce((total, customer) => {
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
      
      setStats({
        totalCustomers: totalApplications,
        activeCustomers: activeAccounts,
        totalRevenue: monthlyRevenue * 12,
        monthlyRevenue,
      });
      
      // 最新の申込み（お試し状態の顧客）
      setRecentApplications(
        customers
          .filter(c => c.status === 'trial')
          .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
          .slice(0, 5)
      );
      
    } catch (error) {
      console.error('Supabaseからのデータ取得に失敗:', error);
      setError('データの取得に失敗しました。Supabase接続を確認してください。');
      
      // エラー時は空の状態を設定
      setStats({
        totalCustomers: 0,
        activeCustomers: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
      });
      setRecentApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: '総顧客数',
      value: stats?.totalCustomers || 0,
      icon: <AssignmentIcon />,
      color: '#3f51b5',
    },
    {
      title: 'アクティブ顧客',
      value: stats?.activeCustomers || 0,
      icon: <PeopleIcon />,
      color: '#4caf50',
    },
    {
      title: '月間売上',
      value: `¥${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: <AttachMoneyIcon />,
      color: '#f44336',
    },
    {
      title: '年間売上',
      value: `¥${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: <TrendingUpIcon />,
      color: '#9c27b0',
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
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

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
              顧客統計
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 200 }}>
              <Box textAlign="center">
                <Typography variant="h3" color="primary">
                  {stats?.activeCustomers || 0}
                </Typography>
                <Typography color="textSecondary">
                  アクティブ顧客
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  / {stats?.totalCustomers || 0} 総顧客数
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