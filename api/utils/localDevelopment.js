// ローカル開発環境用のヘルパー関数

const { mockCustomers, mockDashboardStats, mockRecentApplications } = require('../local-data/mockData');

// 開発環境かどうかをチェック
function isDevelopment() {
  return process.env.NODE_ENV === 'development' || !process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_STORAGE_CONNECTION_STRING === 'UseDevelopmentStorage=true';
}

// モックデータを使用したテーブルストレージのシミュレーション
class MockTableClient {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async listEntities(options) {
    if (this.tableName === 'customers') {
      return {
        [Symbol.asyncIterator]: async function* () {
          for (const customer of mockCustomers) {
            // Check if partition key filter is applied
            if (options && options.queryOptions && options.queryOptions.filter) {
              if (options.queryOptions.filter.includes("PartitionKey eq 'Customer'") && 
                  customer.partitionKey === 'Customer') {
                yield customer;
              }
            } else {
              yield customer;
            }
          }
        }
      };
    }
    return {
      [Symbol.asyncIterator]: async function* () {
        // 空のイテレータ
      }
    };
  }

  async getEntity(partitionKey, rowKey) {
    if (this.tableName === 'customers') {
      const customer = mockCustomers.find(c => c.rowKey === rowKey);
      if (customer) {
        return customer;
      }
    }
    throw new Error('Entity not found');
  }

  async updateEntity(entity) {
    if (this.tableName === 'customers') {
      const index = mockCustomers.findIndex(c => c.rowKey === entity.rowKey);
      if (index !== -1) {
        mockCustomers[index] = { ...mockCustomers[index], ...entity };
        return mockCustomers[index];
      }
    }
    throw new Error('Entity not found');
  }

  async createEntity(entity) {
    if (this.tableName === 'customers') {
      mockCustomers.push(entity);
      return entity;
    }
    throw new Error('Table not found');
  }
}

// Azure Table Storage クライアントの作成（開発環境ではモックを返す）
function createTableClient(tableName) {
  if (isDevelopment()) {
    return new MockTableClient(tableName);
  }
  
  // 本番環境では実際のTableClientを返す
  const { TableClient } = require('@azure/data-tables');
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  return TableClient.fromConnectionString(connectionString, tableName);
}

// ダッシュボード統計のモックデータを取得
function getMockDashboardStats() {
  return mockDashboardStats;
}

// 最近の申込みのモックデータを取得
function getMockRecentApplications() {
  return mockRecentApplications;
}

module.exports = {
  isDevelopment,
  createTableClient,
  getMockDashboardStats,
  getMockRecentApplications,
};