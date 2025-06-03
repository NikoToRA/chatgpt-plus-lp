# Power BI 接続設定自動化スクリプト
# このスクリプトは、Power BI とAzure データベースの接続を自動化します

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$DatabaseType, # "SQLDatabase" または "CosmosDB"
    
    [Parameter(Mandatory=$true)]
    [string]$DatabaseName,
    
    [Parameter(Mandatory=$true)]
    [string]$ServerName,
    
    [Parameter(Mandatory=$false)]
    [string]$WorkspaceName = "InquiryDataAnalytics"
)

# Azure にログイン
Write-Host "Azure にログインしています..." -ForegroundColor Green
Connect-AzAccount -SubscriptionId $SubscriptionId

# Power BI サービスにログイン
Write-Host "Power BI サービスにログインしています..." -ForegroundColor Green
Connect-PowerBIServiceAccount

# データベース接続文字列の生成
function Get-ConnectionString {
    param(
        [string]$Type,
        [string]$Server,
        [string]$Database
    )
    
    switch ($Type) {
        "SQLDatabase" {
            return "Data Source=$Server.database.windows.net;Initial Catalog=$Database;Integrated Security=False;User ID={username};Password={password};Connect Timeout=30;Encrypt=True;TrustServerCertificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False"
        }
        "CosmosDB" {
            # Cosmos DB の接続情報を取得
            $cosmosAccount = Get-AzCosmosDBAccount -ResourceGroupName $ResourceGroupName -Name $Server
            $keys = Get-AzCosmosDBAccountKey -ResourceGroupName $ResourceGroupName -Name $Server
            return "AccountEndpoint=$($cosmosAccount.DocumentEndpoint);AccountKey=$($keys.PrimaryMasterKey)"
        }
        default {
            throw "サポートされていないデータベースタイプです: $Type"
        }
    }
}

# Power BI ワークスペースの作成または取得
Write-Host "Power BI ワークスペースを設定しています..." -ForegroundColor Green
$workspace = Get-PowerBIWorkspace -Name $WorkspaceName -ErrorAction SilentlyContinue
if (-not $workspace) {
    Write-Host "新しいワークスペースを作成しています: $WorkspaceName" -ForegroundColor Yellow
    $workspace = New-PowerBIWorkspace -Name $WorkspaceName
}

# データセット設定の JSON テンプレート
$datasetJson = @"
{
    "name": "InquiryData_$DatabaseType",
    "defaultMode": "Push",
    "tables": [
        {
            "name": "Inquiries",
            "columns": [
                {"name": "Id", "dataType": "String"},
                {"name": "SubmittedAt", "dataType": "DateTime"},
                {"name": "CustomerName", "dataType": "String"},
                {"name": "Email", "dataType": "String"},
                {"name": "Category", "dataType": "String"},
                {"name": "Message", "dataType": "String"},
                {"name": "Status", "dataType": "String"},
                {"name": "ProcessingTime", "dataType": "Int64"}
            ]
        }
    ]
}
"@

# データセットの作成
Write-Host "Power BI データセットを作成しています..." -ForegroundColor Green
$datasetUrl = "https://api.powerbi.com/v1.0/myorg/groups/$($workspace.Id)/datasets"
$headers = @{
    "Authorization" = "Bearer " + (Get-PowerBIAccessToken).AccessToken
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri $datasetUrl -Method Post -Headers $headers -Body $datasetJson
    Write-Host "データセットが正常に作成されました。" -ForegroundColor Green
    
    # 接続文字列を設定ファイルに保存
    $connectionString = Get-ConnectionString -Type $DatabaseType -Server $ServerName -Database $DatabaseName
    $config = @{
        WorkspaceId = $workspace.Id
        DatasetId = $response.id
        ConnectionString = $connectionString
        DatabaseType = $DatabaseType
        CreatedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    $configPath = "./powerbi-config.json"
    $config | ConvertTo-Json | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "設定が $configPath に保存されました。" -ForegroundColor Green
    
} catch {
    Write-Host "エラーが発生しました: $_" -ForegroundColor Red
    exit 1
}

# ゲートウェイ設定の確認
Write-Host "`nゲートウェイ設定の確認..." -ForegroundColor Yellow
Write-Host "オンプレミスデータソースを使用する場合は、Power BI ゲートウェイのインストールが必要です。"
Write-Host "詳細: https://docs.microsoft.com/ja-jp/power-bi/connect-data/service-gateway-onprem"

# 次のステップの案内
Write-Host "`n=== セットアップ完了 ===" -ForegroundColor Green
Write-Host "次のステップ:"
Write-Host "1. Power BI Desktop を開いて、作成したワークスペースに接続"
Write-Host "2. powerbi-config.json の接続情報を使用してデータソースを設定"
Write-Host "3. レポートを作成して発行"
Write-Host "4. 自動更新スケジュールを設定"

# 接続テスト用のスクリプトを生成
$testScript = @"
# 接続テストスクリプト
`$config = Get-Content -Path "./powerbi-config.json" | ConvertFrom-Json

if (`$config.DatabaseType -eq "SQLDatabase") {
    # SQL Database 接続テスト
    `$connection = New-Object System.Data.SqlClient.SqlConnection
    `$connection.ConnectionString = `$config.ConnectionString
    try {
        `$connection.Open()
        Write-Host "データベース接続成功！" -ForegroundColor Green
        `$connection.Close()
    } catch {
        Write-Host "データベース接続失敗: `$_" -ForegroundColor Red
    }
}
"@

$testScript | Out-File -FilePath "./test-db-connection.ps1" -Encoding UTF8
Write-Host "`n接続テストスクリプトが test-db-connection.ps1 に作成されました。" -ForegroundColor Green