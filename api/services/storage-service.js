// Storage service that can switch between mock and Azure Table Storage
const { TableClient } = require("@azure/data-tables");

class StorageService {
  constructor(useMockData = true, connectionString = null) {
    this.useMockData = useMockData;
    this.connectionString = connectionString;
    this.mockData = this.initializeMockData();
  }

  initializeMockData() {
    return {
      FormSubmissions: [
        {
          partitionKey: "FormSubmission",
          rowKey: "2025-01-15T10:30:00.000Z_abc123",
          organization: "東京医科大学病院",
          name: "山田太郎",
          email: "yamada@tokyo-med.ac.jp",
          purpose: "research",
          accounts: 10,
          message: "研究部門でChatGPT Plusを活用したいと考えています。",
          submittedAt: new Date("2025-01-15T10:30:00.000Z")
        },
        {
          partitionKey: "FormSubmission",
          rowKey: "2025-01-20T14:45:00.000Z_def456",
          organization: "大阪総合病院",
          name: "佐藤花子",
          email: "sato@osaka-general.jp",
          purpose: "clinical",
          accounts: 5,
          message: "診療業務の効率化に活用したい。",
          submittedAt: new Date("2025-01-20T14:45:00.000Z")
        }
      ],
      Customers: [
        {
          partitionKey: "Customer",
          rowKey: "CUST001",
          id: "CUST001",
          email: "yamada@tokyo-med.ac.jp",
          organization: "東京医科大学病院",
          name: "山田太郎",
          chatGptEmail: "tokyo-med-001@chatgpt-proxy.jp",
          status: "active",
          plan: "annual",
          paymentMethod: "invoice",
          stripeCustomerId: null,
          createdAt: new Date("2025-01-16T09:00:00.000Z")
        },
        {
          partitionKey: "Customer",
          rowKey: "CUST002",
          id: "CUST002",
          email: "sato@osaka-general.jp",
          organization: "大阪総合病院",
          name: "佐藤花子",
          chatGptEmail: "osaka-gen-001@chatgpt-proxy.jp",
          status: "trial",
          plan: "monthly",
          paymentMethod: "credit_card",
          stripeCustomerId: "cus_mock123",
          createdAt: new Date("2025-01-21T11:00:00.000Z")
        },
        {
          partitionKey: "Customer",
          rowKey: "CUST003",
          id: "CUST003",
          email: "tanaka@kyoto-clinic.jp",
          organization: "京都クリニック",
          name: "田中一郎",
          chatGptEmail: null,
          status: "pending",
          plan: "annual",
          paymentMethod: "invoice",
          stripeCustomerId: null,
          createdAt: new Date("2025-01-25T15:30:00.000Z")
        }
      ],
      AccountMapping: [
        {
          partitionKey: "AccountMapping",
          rowKey: "CUST001",
          customerId: "CUST001",
          chatGptEmail: "tokyo-med-001@chatgpt-proxy.jp",
          chatGptAccountId: "acc_tokyo_001",
          linkedAt: new Date("2025-01-16T10:00:00.000Z"),
          linkedBy: "admin@chatgpt-proxy.jp"
        },
        {
          partitionKey: "AccountMapping",
          rowKey: "CUST002",
          customerId: "CUST002",
          chatGptEmail: "osaka-gen-001@chatgpt-proxy.jp",
          chatGptAccountId: "acc_osaka_001",
          linkedAt: new Date("2025-01-21T12:00:00.000Z"),
          linkedBy: "admin@chatgpt-proxy.jp"
        }
      ]
    };
  }

  async getTableClient(tableName) {
    if (this.useMockData) {
      return this.getMockTableClient(tableName);
    }
    
    if (!this.connectionString) {
      throw new Error("Azure Storage connection string not provided");
    }
    
    return TableClient.fromConnectionString(this.connectionString, tableName);
  }

  getMockTableClient(tableName) {
    const tableData = this.mockData[tableName] || [];
    
    return {
      createEntity: async (entity) => {
        const newEntity = {
          ...entity,
          etag: `mock-etag-${Date.now()}`,
          timestamp: new Date()
        };
        this.mockData[tableName].push(newEntity);
        return newEntity;
      },
      
      listEntities: async (options = {}) => {
        let entities = [...tableData];
        
        // Apply filter if provided
        if (options.queryOptions?.filter) {
          // Simple mock filter implementation
          if (options.queryOptions.filter.includes("PartitionKey eq")) {
            const partitionKey = options.queryOptions.filter.match(/PartitionKey eq '([^']+)'/)?.[1];
            if (partitionKey) {
              entities = entities.filter(e => e.partitionKey === partitionKey);
            }
          }
        }
        
        // Return async iterator
        return {
          [Symbol.asyncIterator]: async function* () {
            for (const entity of entities) {
              yield entity;
            }
          },
          byPage: () => {
            return {
              [Symbol.asyncIterator]: async function* () {
                yield entities;
              }
            };
          }
        };
      },
      
      getEntity: async (partitionKey, rowKey) => {
        const entity = tableData.find(
          e => e.partitionKey === partitionKey && e.rowKey === rowKey
        );
        if (!entity) {
          throw new Error("Entity not found");
        }
        return entity;
      },
      
      updateEntity: async (entity, mode = "Merge") => {
        const index = tableData.findIndex(
          e => e.partitionKey === entity.partitionKey && e.rowKey === entity.rowKey
        );
        if (index === -1) {
          throw new Error("Entity not found");
        }
        
        if (mode === "Replace") {
          this.mockData[tableName][index] = {
            ...entity,
            etag: `mock-etag-${Date.now()}`,
            timestamp: new Date()
          };
        } else {
          // Merge mode
          this.mockData[tableName][index] = {
            ...this.mockData[tableName][index],
            ...entity,
            etag: `mock-etag-${Date.now()}`,
            timestamp: new Date()
          };
        }
        
        return this.mockData[tableName][index];
      },
      
      deleteEntity: async (partitionKey, rowKey) => {
        const index = tableData.findIndex(
          e => e.partitionKey === partitionKey && e.rowKey === rowKey
        );
        if (index === -1) {
          throw new Error("Entity not found");
        }
        
        this.mockData[tableName].splice(index, 1);
      }
    };
  }

  // Helper method to get current data (for debugging)
  getMockData() {
    return this.mockData;
  }
}

module.exports = StorageService;