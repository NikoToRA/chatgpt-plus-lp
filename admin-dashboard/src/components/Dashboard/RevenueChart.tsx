import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Customer } from '../../types';

interface RevenueData {
  month: string;
  revenue: number;
  customers: number;
  accounts: number;
}

export default function RevenueChart() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [viewType, setViewType] = useState<'line' | 'bar'>('line');
  const [period, setPeriod] = useState<'6months' | '12months' | '24months'>('12months');

  useEffect(() => {
    generateRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const generateRevenueData = () => {
    // 顧客データから月別売上を計算
    const customers: Customer[] = JSON.parse(localStorage.getItem('customers') || '[]');
    
    // 月数を決定
    const monthsToShow = period === '6months' ? 6 : period === '12months' ? 12 : 24;
    
    const data: RevenueData[] = [];
    const currentDate = new Date();
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const targetDate = new Date(currentDate);
      targetDate.setMonth(targetDate.getMonth() - i);
      
      const monthKey = targetDate.toLocaleDateString('ja-JP', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      // その月の売上を計算
      let monthlyRevenue = 0;
      let activeCustomers = 0;
      let totalAccounts = 0;
      
      customers.forEach(customer => {
        // 顧客が有効期間内かチェック
        const registeredDate = new Date(customer.registeredAt);
        const expiresDate = new Date(customer.expiresAt);
        
        if (registeredDate <= targetDate && expiresDate >= targetDate && customer.status === 'active') {
          activeCustomers++;
          
          // アクティブなアカウント数をカウント
          const activeAccountCount = customer.chatGptAccounts.filter(acc => 
            acc.isActive || acc.status === 'active'
          ).length;
          totalAccounts += activeAccountCount;
          
          // 月額料金を計算（アカウント単位）
          const monthlyFee = activeAccountCount * 20000; // デフォルト単価
          monthlyRevenue += monthlyFee;
        }
      });
      
      data.push({
        month: monthKey,
        revenue: monthlyRevenue,
        customers: activeCustomers,
        accounts: totalAccounts,
      });
    }
    
    setRevenueData(data);
  };

  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString()}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          border: '1px solid #ccc',
          borderRadius: 1,
          boxShadow: 2
        }}>
          <Typography variant="subtitle2" gutterBottom>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography 
              key={index} 
              variant="body2" 
              sx={{ color: entry.color }}
            >
              {entry.name}: {
                entry.dataKey === 'revenue' 
                  ? formatCurrency(entry.value)
                  : formatNumber(entry.value)
              }
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          売上推移
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>期間</InputLabel>
            <Select
              value={period}
              label="期間"
              onChange={(e) => setPeriod(e.target.value as any)}
            >
              <MenuItem value="6months">6ヶ月</MenuItem>
              <MenuItem value="12months">12ヶ月</MenuItem>
              <MenuItem value="24months">24ヶ月</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>表示</InputLabel>
            <Select
              value={viewType}
              label="表示"
              onChange={(e) => setViewType(e.target.value as any)}
            >
              <MenuItem value="line">線グラフ</MenuItem>
              <MenuItem value="bar">棒グラフ</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* サマリー情報 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                今月の売上
              </Typography>
              <Typography variant="h5" color="primary">
                {formatCurrency(revenueData[revenueData.length - 1]?.revenue || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                アクティブ顧客数
              </Typography>
              <Typography variant="h5" color="primary">
                {formatNumber(revenueData[revenueData.length - 1]?.customers || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                総アカウント数
              </Typography>
              <Typography variant="h5" color="primary">
                {formatNumber(revenueData[revenueData.length - 1]?.accounts || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* グラフ */}
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          {viewType === 'line' ? (
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="revenue"
                orientation="left"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="count"
                orientation="right"
                tickFormatter={formatNumber}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#1976d2"
                strokeWidth={3}
                name="月次売上"
                dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
              />
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="customers"
                stroke="#ff9800"
                strokeWidth={2}
                name="顧客数"
                dot={{ fill: '#ff9800', strokeWidth: 2, r: 3 }}
              />
              <Line
                yAxisId="count"
                type="monotone"
                dataKey="accounts"
                stroke="#4caf50"
                strokeWidth={2}
                name="アカウント数"
                dot={{ fill: '#4caf50', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          ) : (
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="revenue" 
                fill="#1976d2" 
                name="月次売上"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Box>

      {/* データテーブル */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          詳細データ
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 1,
          fontSize: '0.875rem'
        }}>
          <Typography fontWeight="bold">月</Typography>
          <Typography fontWeight="bold">売上</Typography>
          <Typography fontWeight="bold">顧客数</Typography>
          <Typography fontWeight="bold">アカウント数</Typography>
          
          {revenueData.map((data, index) => (
            <React.Fragment key={index}>
              <Typography>{data.month}</Typography>
              <Typography>{formatCurrency(data.revenue)}</Typography>
              <Typography>{formatNumber(data.customers)}</Typography>
              <Typography>{formatNumber(data.accounts)}</Typography>
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}