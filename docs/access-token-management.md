# アクセストークン管理ガイド

このドキュメントは、Azure および Power BI サービスにおけるアクセストークンの管理と、トークン関連の問題を事前に察知・対処する方法について説明します。

## アクセストークンの概要

### トークンの種類
1. **Azure AD アクセストークン**: Azure リソースへのアクセス用
2. **Power BI アクセストークン**: Power BI API およびサービスへのアクセス用
3. **リフレッシュトークン**: アクセストークンの更新用
4. **データベース接続トークン**: データソースへの接続用

### トークンの有効期限
- アクセストークン: 通常1時間
- リフレッシュトークン: 90日間（設定により異なる）
- セッショントークン: 24時間

## トークン管理のベストプラクティス

### 1. 自動更新の実装

```powershell
# PowerShell スクリプトによる自動更新
function Get-RefreshedToken {
    param(
        [string]$TenantId,
        [string]$ClientId,
        [string]$ClientSecret,
        [string]$Resource
    )
    
    $tokenEndpoint = "https://login.microsoftonline.com/$TenantId/oauth2/token"
    
    $body = @{
        grant_type    = "client_credentials"
        client_id     = $ClientId
        client_secret = $ClientSecret
        resource      = $Resource
    }
    
    try {
        $response = Invoke-RestMethod -Uri $tokenEndpoint -Method Post -Body $body
        return $response.access_token
    }
    catch {
        Write-Error "トークン取得エラー: $_"
        return $null
    }
}
```

### 2. トークン有効期限の監視

```javascript
// Node.js での実装例
class TokenManager {
    constructor() {
        this.token = null;
        this.tokenExpiry = null;
        this.refreshInterval = null;
    }

    async initializeToken() {
        await this.refreshToken();
        // 有効期限の10分前に自動更新
        this.refreshInterval = setInterval(() => {
            const now = new Date();
            const expiryTime = new Date(this.tokenExpiry);
            const timeUntilExpiry = expiryTime - now;
            
            if (timeUntilExpiry < 10 * 60 * 1000) { // 10分
                this.refreshToken();
            }
        }, 60000); // 1分ごとにチェック
    }

    async refreshToken() {
        try {
            const response = await fetch('https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    scope: 'https://analysis.windows.net/powerbi/api/.default',
                    grant_type: 'client_credentials'
                })
            });

            const data = await response.json();
            this.token = data.access_token;
            this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
            
            console.log('トークンが正常に更新されました。有効期限:', this.tokenExpiry);
        } catch (error) {
            console.error('トークン更新エラー:', error);
            // アラート送信やフォールバック処理
            this.handleTokenError(error);
        }
    }

    handleTokenError(error) {
        // エラー通知の実装
        // 例: メール送信、ログ記録、アラート発生など
    }
}
```

### 3. Azure Key Vault を使用した安全な管理

```powershell
# Key Vault からトークンを取得
function Get-TokenFromKeyVault {
    param(
        [string]$VaultName,
        [string]$SecretName
    )
    
    # Azure にログイン
    Connect-AzAccount -Identity
    
    # Key Vault からシークレットを取得
    $secret = Get-AzKeyVaultSecret -VaultName $VaultName -Name $SecretName
    $token = $secret.SecretValue | ConvertFrom-SecureString -AsPlainText
    
    return $token
}

# Key Vault にトークンを保存
function Set-TokenToKeyVault {
    param(
        [string]$VaultName,
        [string]$SecretName,
        [string]$Token,
        [DateTime]$ExpiryDate
    )
    
    $secureToken = ConvertTo-SecureString -String $Token -AsPlainText -Force
    
    Set-AzKeyVaultSecret `
        -VaultName $VaultName `
        -Name $SecretName `
        -SecretValue $secureToken `
        -Expires $ExpiryDate `
        -Tag @{
            "Purpose" = "PowerBI-Access"
            "LastUpdated" = (Get-Date).ToString()
        }
}
```

## トークンエラーの事前察知と対処

### 1. 監視スクリプト

```python
# Python による監視スクリプト
import datetime
import requests
import json
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
import smtplib
from email.mime.text import MIMEText

class TokenMonitor:
    def __init__(self, vault_url, alert_email):
        self.credential = DefaultAzureCredential()
        self.secret_client = SecretClient(vault_url=vault_url, credential=self.credential)
        self.alert_email = alert_email
        
    def check_token_health(self):
        issues = []
        
        # 各トークンの状態をチェック
        tokens_to_check = [
            "powerbi-access-token",
            "azure-db-connection-token",
            "refresh-token"
        ]
        
        for token_name in tokens_to_check:
            try:
                secret = self.secret_client.get_secret(token_name)
                
                # 有効期限チェック
                if secret.properties.expires_on:
                    time_until_expiry = secret.properties.expires_on - datetime.datetime.now(datetime.timezone.utc)
                    
                    if time_until_expiry.days < 7:
                        issues.append({
                            "token": token_name,
                            "issue": "まもなく有効期限切れ",
                            "expires_in_days": time_until_expiry.days
                        })
                        
                # トークンの有効性チェック
                if not self.validate_token(secret.value):
                    issues.append({
                        "token": token_name,
                        "issue": "無効なトークン"
                    })
                    
            except Exception as e:
                issues.append({
                    "token": token_name,
                    "issue": f"取得エラー: {str(e)}"
                })
        
        if issues:
            self.send_alert(issues)
            
        return issues
    
    def validate_token(self, token):
        # トークンの有効性を検証
        try:
            # Power BI API でテスト
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(
                "https://api.powerbi.com/v1.0/myorg/groups",
                headers=headers
            )
            return response.status_code == 200
        except:
            return False
    
    def send_alert(self, issues):
        # アラートメールを送信
        message = "トークン管理アラート\n\n"
        for issue in issues:
            message += f"- {issue['token']}: {issue['issue']}\n"
        
        # メール送信ロジック
        print(f"アラート送信: {message}")
```

### 2. 自動回復メカニズム

```typescript
// TypeScript による自動回復実装
interface TokenConfig {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    resource: string;
}

class TokenAutoRecovery {
    private config: TokenConfig;
    private retryCount: number = 0;
    private maxRetries: number = 3;
    
    constructor(config: TokenConfig) {
        this.config = config;
    }
    
    async getTokenWithRecovery(): Promise<string> {
        try {
            return await this.acquireToken();
        } catch (error) {
            console.error(`トークン取得エラー (試行 ${this.retryCount + 1}/${this.maxRetries}):`, error);
            
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                
                // エクスポネンシャルバックオフ
                const delay = Math.pow(2, this.retryCount) * 1000;
                await this.sleep(delay);
                
                // 代替認証方法を試行
                if (this.retryCount === 2) {
                    return await this.tryAlternativeAuth();
                }
                
                return await this.getTokenWithRecovery();
            } else {
                // 最終的なフォールバック
                return await this.finalFallback();
            }
        }
    }
    
    private async acquireToken(): Promise<string> {
        const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/token`;
        
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                resource: this.config.resource
            })
        });
        
        if (!response.ok) {
            throw new Error(`Token acquisition failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.access_token;
    }
    
    private async tryAlternativeAuth(): Promise<string> {
        // マネージドIDを使用した認証を試行
        console.log('代替認証方法（マネージドID）を試行中...');
        // 実装詳細
        return '';
    }
    
    private async finalFallback(): Promise<string> {
        // キャッシュされたトークンや緊急用トークンを使用
        console.error('すべての認証方法が失敗しました。緊急プロトコルを実行中...');
        // 管理者に通知
        // 一時的な読み取り専用トークンを返すなど
        return '';
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

### 3. CI/CD パイプラインでの検証

```yaml
# Azure DevOps Pipeline での例
trigger:
  - main

variables:
  - group: PowerBI-Credentials

stages:
  - stage: ValidateTokens
    displayName: 'トークン検証'
    jobs:
      - job: CheckTokens
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: AzurePowerShell@5
            displayName: 'トークン有効期限チェック'
            inputs:
              azureSubscription: 'Service-Connection'
              ScriptType: 'InlineScript'
              Inline: |
                # トークンの有効期限をチェック
                $vault = Get-AzKeyVault -VaultName "MyKeyVault"
                $secrets = Get-AzKeyVaultSecret -VaultName $vault.VaultName
                
                foreach ($secret in $secrets) {
                    if ($secret.Expires) {
                        $daysUntilExpiry = ($secret.Expires - (Get-Date)).Days
                        
                        if ($daysUntilExpiry -lt 30) {
                            Write-Warning "$($secret.Name) は $daysUntilExpiry 日後に期限切れになります"
                            
                            if ($daysUntilExpiry -lt 7) {
                                Write-Error "緊急: $($secret.Name) の更新が必要です"
                                exit 1
                            }
                        }
                    }
                }
              
          - task: PowerShell@2
            displayName: 'Power BI 接続テスト'
            inputs:
              targetType: 'inline'
              script: |
                # Power BI への接続をテスト
                $token = "$(PowerBIToken)"
                $headers = @{
                    "Authorization" = "Bearer $token"
                }
                
                try {
                    $response = Invoke-RestMethod `
                        -Uri "https://api.powerbi.com/v1.0/myorg/groups" `
                        -Headers $headers `
                        -Method Get
                    
                    Write-Host "Power BI 接続成功"
                } catch {
                    Write-Error "Power BI 接続失敗: $_"
                    exit 1
                }
```

## トラブルシューティングガイド

### よくある問題と解決策

1. **401 Unauthorized エラー**
   - 原因: トークンの有効期限切れまたは無効
   - 解決: トークンを再取得し、Key Vault を更新

2. **403 Forbidden エラー**
   - 原因: 権限不足
   - 解決: サービスプリンシパルの権限を確認・更新

3. **トークン更新の失敗**
   - 原因: ネットワーク問題または認証情報の変更
   - 解決: 接続を確認し、認証情報を検証

### 緊急時の対応手順

1. **即座の対応**
   ```bash
   # 手動でトークンを更新
   az login
   az account get-access-token --resource https://analysis.windows.net/powerbi/api
   ```

2. **一時的な回避策**
   - キャッシュされたレポートの使用
   - 読み取り専用モードへの切り替え
   - バックアップデータソースの利用

3. **根本原因の調査**
   - Azure AD ログの確認
   - Power BI 管理ポータルでの診断
   - ネットワークトレースの分析

## まとめ

アクセストークンの適切な管理は、システムの安定性と可用性を維持するために重要です。自動更新、監視、そして問題の事前察知により、サービス中断を最小限に抑えることができます。定期的なレビューと改善により、より堅牢なトークン管理システムを構築してください。