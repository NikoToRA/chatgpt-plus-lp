// モックデータ for ローカル開発

const mockCustomers = [
  {
    partitionKey: 'Customer',
    rowKey: '1',
    email: 'yamada@example.com',
    organization: '山田内科クリニック',
    name: '山田 太郎',
    chatGptEmail: 'yamada@clinic.com',
    status: 'active',
    plan: 'basic',
    paymentMethod: 'card',
    stripeCustomerId: 'cus_mock_1',
    timestamp: new Date('2024-01-15').toISOString(),
    lastActivityAt: new Date('2024-03-20').toISOString(),
  },
  {
    partitionKey: 'Customer',
    rowKey: '2',
    email: 'sato@example.com',
    organization: '佐藤医院',
    name: '佐藤 花子',
    chatGptEmail: 'sato@hospital.com',
    status: 'active',
    plan: 'plus',
    paymentMethod: 'card',
    stripeCustomerId: 'cus_mock_2',
    timestamp: new Date('2024-02-01').toISOString(),
    lastActivityAt: new Date('2024-03-19').toISOString(),
  },
  {
    partitionKey: 'Customer',
    rowKey: '3',
    email: 'suzuki@example.com',
    organization: '鈴木総合病院',
    name: '鈴木 一郎',
    chatGptEmail: null,
    status: 'trial',
    plan: 'basic',
    paymentMethod: 'invoice',
    stripeCustomerId: null,
    timestamp: new Date('2024-03-18').toISOString(),
    lastActivityAt: new Date('2024-03-18').toISOString(),
  },
  {
    partitionKey: 'Customer',
    rowKey: '4',
    email: 'tanaka@example.com',
    organization: 'たなか歯科',
    name: '田中 美香',
    chatGptEmail: 'tanaka@dental.com',
    status: 'active',
    plan: 'enterprise',
    paymentMethod: 'card',
    stripeCustomerId: 'cus_mock_4',
    timestamp: new Date('2024-02-20').toISOString(),
    lastActivityAt: new Date('2024-03-21').toISOString(),
  },
  {
    partitionKey: 'Customer',
    rowKey: '5',
    email: 'takahashi@example.com',
    organization: '高橋小児科',
    name: '高橋 健二',
    chatGptEmail: 'takahashi@kids.com',
    status: 'suspended',
    plan: 'basic',
    paymentMethod: 'card',
    stripeCustomerId: 'cus_mock_5',
    timestamp: new Date('2024-01-30').toISOString(),
    lastActivityAt: new Date('2024-02-28').toISOString(),
  },
];

const mockDashboardStats = {
  totalApplications: 5,
  activeAccounts: 3,
  pendingApplications: 1,
  monthlyRevenue: 21000,
  conversionRate: 60,
};

const mockRecentApplications = mockCustomers
  .map(c => ({
    id: c.rowKey,
    email: c.email,
    organization: c.organization,
    name: c.name,
    plan: c.plan,
    status: c.status,
    createdAt: c.timestamp
  }))
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0, 3);

module.exports = {
  mockCustomers,
  mockDashboardStats,
  mockRecentApplications,
};