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
import { Customer } from '../../types';

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      const data = await customerApi.getAll();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
      // 開発用のダミーデータ
      const dummyCustomers: Customer[] = [
        {
          id: '1',
          email: 'yamada@example.com',
          organization: '株式会社山田商事',
          name: '山田太郎',
          chatGptEmail: 'yamada@chatgpt.com',
          status: 'active',
          plan: 'plus',
          paymentMethod: 'card',
          createdAt: new Date('2025-05-01'),
          lastActivityAt: new Date(),
        },
        {
          id: '2',
          email: 'suzuki@example.com',
          organization: '鈴木工業株式会社',
          name: '鈴木花子',
          status: 'trial',
          plan: 'basic',
          paymentMethod: 'invoice',
          createdAt: new Date('2025-05-15'),
          lastActivityAt: new Date(),
        },
        {
          id: '3',
          email: 'tanaka@example.com',
          organization: '田中システム',
          name: '田中次郎',
          chatGptEmail: 'tanaka@chatgpt.com',
          status: 'active',
          plan: 'enterprise',
          paymentMethod: 'invoice',
          createdAt: new Date('2025-04-20'),
          lastActivityAt: new Date(),
        },
      ];
      setCustomers(dummyCustomers);
      setFilteredCustomers(dummyCustomers);
    } finally {
      setIsLoading(false);
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
                <TableCell>プラン</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>登録日</TableCell>
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
                      {customer.chatGptEmail || (
                        <Chip label="未紐付け" size="small" color="warning" />
                      )}
                    </TableCell>
                    <TableCell>{getPlanChip(customer.plan)}</TableCell>
                    <TableCell>{getStatusChip(customer.status)}</TableCell>
                    <TableCell>
                      {new Date(customer.createdAt).toLocaleDateString('ja-JP')}
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