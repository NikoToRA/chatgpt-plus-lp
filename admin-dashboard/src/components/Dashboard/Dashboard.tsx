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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '../../services/api';
import { DashboardStats, Customer } from '../../types';

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
      // 開発用のダミーデータ
      setStats({
        totalApplications: 156,
        pendingApplications: 12,
        activeAccounts: 89,
        monthlyRevenue: 445000,
        conversionRate: 57.05,
      });
      setRecentApplications([
        {
          id: '1',
          email: 'test@example.com',
          organization: 'テスト企業',
          name: '山田太郎',
          status: 'trial',
          plan: 'plus',
          paymentMethod: 'card',
          createdAt: new Date(),
          lastActivityAt: new Date(),
        },
      ]);
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

  // ダミーの売上データ
  const salesData = [
    { name: '1週前', value: 320000 },
    { name: '6日前', value: 350000 },
    { name: '5日前', value: 380000 },
    { name: '4日前', value: 390000 },
    { name: '3日前', value: 420000 },
    { name: '2日前', value: 440000 },
    { name: '昨日', value: 445000 },
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
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              売上推移
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
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
                  <TableCell>{new Date(customer.createdAt).toLocaleString('ja-JP')}</TableCell>
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