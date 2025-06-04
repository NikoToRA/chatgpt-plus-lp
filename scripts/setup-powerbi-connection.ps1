# Power BI 接続自動設定スクリプト
# ChatGPT Plus LP - Power BI Setup Automation

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerName,
    
    [Parameter(Mandatory=$true)]
    [string]$DatabaseName,
    
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [SecureString]$Password,
    
    [Parameter(Mandatory=$false)]
    [string]$WorkspaceName = "ChatGPT Plus LP Analytics",
    
    [Parameter(Mandatory=$false)]
    [string]$ReportPath = "./PowerBI/ChatGPTPlusLP.pbix",
    
    [Parameter(Mandatory=$false)]
    [switch]$UseAzureAD = $false
)

# スクリプトの開始
Write-Host "=== Power BI 接続自動設定スクリプト ===" -ForegroundColor Cyan
Write-Host "開始時刻: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# 必要なモジュールのインポート
function Install-RequiredModules {
    Write-Host "`n必要なモジュールを確認しています..." -ForegroundColor Yellow
    
    $requiredModules = @(
        "MicrosoftPowerBIMgmt",
        "SqlServer",
        "Az.Accounts"
    )
    
    foreach ($module in $requiredModules) {
        if (!(Get-Module -ListAvailable -Name $module)) {
            Write-Host "モジュール '$module' をインストールしています..." -ForegroundColor Yellow
            Install-Module -Name $module -Force -AllowClobber -Scope CurrentUser
        } else {
            Write-Host "モジュール '$module' は既にインストールされています" -ForegroundColor Green
        }
    }
    
    # モジュールのインポート
    Import-Module MicrosoftPowerBIMgmt
    Import-Module SqlServer
    if ($UseAzureAD) {
        Import-Module Az.Accounts
    }
}

# Power BI サービスへのログイン
function Connect-PowerBIService {
    Write-Host "`nPower BI サービスに接続しています..." -ForegroundColor Yellow
    
    try {
        if ($UseAzureAD) {
            Connect-AzAccount
            Connect-PowerBIServiceAccount -UseAzureAD
        } else {
            Connect-PowerBIServiceAccount
        }
        Write-Host "Power BI サービスへの接続に成功しました" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Power BI サービスへの接続に失敗しました: $_" -ForegroundColor Red
        return $false
    }
}

# データベース接続のテスト
function Test-DatabaseConnection {
    Write-Host "`nデータベース接続をテストしています..." -ForegroundColor Yellow
    
    $connectionString = if ($UseAzureAD) {
        "Server=$ServerName;Database=$DatabaseName;Authentication=Active Directory Interactive;"
    } else {
        $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
        )
        "Server=$ServerName;Database=$DatabaseName;User Id=$Username;Password=$plainPassword;"
    }
    
    try {
        $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()
        
        # テーブルの存在確認
        $command = $connection.CreateCommand()
        $command.CommandText = @"
            SELECT COUNT(*) as TableCount
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME = 'FormSubmissions'
"@
        $result = $command.ExecuteScalar()
        
        if ($result -gt 0) {
            Write-Host "データベース接続テスト成功: FormSubmissions テーブルが見つかりました" -ForegroundColor Green
            
            # レコード数の確認
            $command.CommandText = "SELECT COUNT(*) FROM FormSubmissions"
            $recordCount = $command.ExecuteScalar()
            Write-Host "現在のレコード数: $recordCount" -ForegroundColor Gray
        } else {
            Write-Host "警告: FormSubmissions テーブルが見つかりません" -ForegroundColor Yellow
        }
        
        $connection.Close()
        return $true
    } catch {
        Write-Host "データベース接続テスト失敗: $_" -ForegroundColor Red
        return $false
    }
}

# ワークスペースの作成または取得
function Get-OrCreateWorkspace {
    param([string]$Name)
    
    Write-Host "`nワークスペース '$Name' を確認しています..." -ForegroundColor Yellow
    
    try {
        $workspace = Get-PowerBIWorkspace -Name $Name -ErrorAction SilentlyContinue
        
        if ($workspace) {
            Write-Host "既存のワークスペースが見つかりました" -ForegroundColor Green
        } else {
            Write-Host "新しいワークスペースを作成しています..." -ForegroundColor Yellow
            $workspace = New-PowerBIWorkspace -Name $Name
            Write-Host "ワークスペースの作成に成功しました" -ForegroundColor Green
        }
        
        return $workspace
    } catch {
        Write-Host "ワークスペースの処理中にエラーが発生しました: $_" -ForegroundColor Red
        return $null
    }
}

# Power BI レポートテンプレートの作成
function Create-PowerBIReportTemplate {
    param([string]$OutputPath)
    
    Write-Host "`nPower BI レポートテンプレートを作成しています..." -ForegroundColor Yellow
    
    # テンプレートディレクトリの作成
    $templateDir = Split-Path $OutputPath -Parent
    if (!(Test-Path $templateDir)) {
        New-Item -ItemType Directory -Path $templateDir -Force | Out-Null
    }
    
    # M言語クエリの作成
    $mQuery = @"
let
    Source = Sql.Database("$ServerName", "$DatabaseName"),
    FormSubmissions = Source{[Schema="dbo",Item="FormSubmissions"]}[Data],
    
    // データ型の設定
    TypedData = Table.TransformColumnTypes(FormSubmissions,{
        {"SubmissionId", type text},
        {"Timestamp", type datetime},
        {"HospitalName", type text},
        {"HospitalType", type text},
        {"ContactPerson", type text},
        {"Email", type text},
        {"Phone", type text},
        {"StaffCount", Int64.Type},
        {"Interest", type text},
        {"SystemUsage", type text},
        {"Message", type text}
    }),
    
    // 追加の計算列
    AddedColumns = Table.AddColumn(TypedData, "SubmissionDate", 
        each DateTime.Date([Timestamp]), type date),
    
    FinalData = Table.AddColumn(AddedColumns, "HospitalScale",
        each if [StaffCount] < 50 then "小規模"
        else if [StaffCount] < 200 then "中規模"
        else "大規模", type text)
in
    FinalData
"@
    
    # クエリファイルの保存
    $queryPath = Join-Path $templateDir "FormSubmissionsQuery.m"
    $mQuery | Out-File -FilePath $queryPath -Encoding UTF8
    
    Write-Host "Power Query テンプレートを作成しました: $queryPath" -ForegroundColor Green
    
    # DAXメジャーの作成
    $daxMeasures = @"
// 基本メジャー
TotalSubmissions = COUNT(FormSubmissions[SubmissionId])
UniqueHospitals = DISTINCTCOUNT(FormSubmissions[HospitalName])
AverageStaffCount = AVERAGE(FormSubmissions[StaffCount])

// 時系列メジャー
ThisMonthSubmissions = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    MONTH(FormSubmissions[Timestamp]) = MONTH(TODAY()) &&
    YEAR(FormSubmissions[Timestamp]) = YEAR(TODAY())
)

// コンバージョン率
ConversionRate = 
DIVIDE(
    CALCULATE(COUNT(FormSubmissions[SubmissionId]), FormSubmissions[Status] = "契約済み"),
    COUNT(FormSubmissions[SubmissionId]),
    0
)
"@
    
    $daxPath = Join-Path $templateDir "Measures.dax"
    $daxMeasures | Out-File -FilePath $daxPath -Encoding UTF8
    
    Write-Host "DAX メジャーテンプレートを作成しました: $daxPath" -ForegroundColor Green
    
    return @{
        QueryPath = $queryPath
        DaxPath = $daxPath
    }
}

# データセットの作成と設定
function Create-PowerBIDataset {
    param(
        [string]$WorkspaceId,
        [string]$DatasetName = "ChatGPT Plus LP Dataset"
    )
    
    Write-Host "`nデータセットを作成しています..." -ForegroundColor Yellow
    
    # データセット定義
    $datasetDefinition = @{
        name = $DatasetName
        defaultMode = "Push"
        tables = @(
            @{
                name = "FormSubmissions"
                columns = @(
                    @{name = "SubmissionId"; dataType = "String"}
                    @{name = "Timestamp"; dataType = "DateTime"}
                    @{name = "HospitalName"; dataType = "String"}
                    @{name = "HospitalType"; dataType = "String"}
                    @{name = "ContactPerson"; dataType = "String"}
                    @{name = "Email"; dataType = "String"}
                    @{name = "Phone"; dataType = "String"}
                    @{name = "StaffCount"; dataType = "Int64"}
                    @{name = "Interest"; dataType = "String"}
                    @{name = "SystemUsage"; dataType = "String"}
                    @{name = "Message"; dataType = "String"}
                )
            }
        )
    }
    
    try {
        $dataset = New-PowerBIDataset -WorkspaceId $WorkspaceId -Dataset $datasetDefinition
        Write-Host "データセットの作成に成功しました" -ForegroundColor Green
        return $dataset
    } catch {
        Write-Host "データセットの作成に失敗しました: $_" -ForegroundColor Red
        return $null
    }
}

# 接続文字列の設定
function Set-ConnectionString {
    param(
        [string]$WorkspaceId,
        [string]$DatasetId
    )
    
    Write-Host "`n接続文字列を設定しています..." -ForegroundColor Yellow
    
    $connectionDetails = @{
        connectionString = if ($UseAzureAD) {
            "Data Source=$ServerName;Initial Catalog=$DatabaseName;Authentication=ActiveDirectoryInteractive"
        } else {
            "Data Source=$ServerName;Initial Catalog=$DatabaseName;User ID=$Username"
        }
    }
    
    try {
        # REST API を使用して接続情報を更新
        $uri = "https://api.powerbi.com/v1.0/myorg/groups/$WorkspaceId/datasets/$DatasetId/datasources"
        
        $headers = @{
            "Authorization" = "Bearer $(Get-PowerBIAccessToken)"
            "Content-Type" = "application/json"
        }
        
        $body = $connectionDetails | ConvertTo-Json
        
        Invoke-RestMethod -Uri $uri -Method PATCH -Headers $headers -Body $body
        
        Write-Host "接続文字列の設定に成功しました" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "接続文字列の設定に失敗しました: $_" -ForegroundColor Red
        return $false
    }
}

# スケジュール更新の設定
function Set-RefreshSchedule {
    param(
        [string]$WorkspaceId,
        [string]$DatasetId
    )
    
    Write-Host "`nスケジュール更新を設定しています..." -ForegroundColor Yellow
    
    $refreshSchedule = @{
        value = @{
            enabled = $true
            days = @("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")
            times = @("09:00", "18:00")
            localTimeZoneId = "Tokyo Standard Time"
            notifyOption = "MailOnFailure"
        }
    }
    
    try {
        $uri = "https://api.powerbi.com/v1.0/myorg/groups/$WorkspaceId/datasets/$DatasetId/refreshSchedule"
        
        $headers = @{
            "Authorization" = "Bearer $(Get-PowerBIAccessToken)"
            "Content-Type" = "application/json"
        }
        
        $body = $refreshSchedule | ConvertTo-Json -Depth 10
        
        Invoke-RestMethod -Uri $uri -Method PATCH -Headers $headers -Body $body
        
        Write-Host "スケジュール更新の設定に成功しました" -ForegroundColor Green
        Write-Host "更新時刻: 毎日 9:00 と 18:00 (JST)" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "スケジュール更新の設定に失敗しました: $_" -ForegroundColor Red
        return $false
    }
}

# メイン処理
function Main {
    Write-Host "`n=== メイン処理を開始します ===" -ForegroundColor Cyan
    
    # 1. 必要なモジュールのインストール
    Install-RequiredModules
    
    # 2. データベース接続のテスト
    if (!(Test-DatabaseConnection)) {
        Write-Host "データベース接続に失敗したため、処理を中止します" -ForegroundColor Red
        return
    }
    
    # 3. Power BI サービスへの接続
    if (!(Connect-PowerBIService)) {
        Write-Host "Power BI サービスへの接続に失敗したため、処理を中止します" -ForegroundColor Red
        return
    }
    
    # 4. ワークスペースの作成/取得
    $workspace = Get-OrCreateWorkspace -Name $WorkspaceName
    if (!$workspace) {
        Write-Host "ワークスペースの処理に失敗したため、処理を中止します" -ForegroundColor Red
        return
    }
    
    # 5. レポートテンプレートの作成
    $templates = Create-PowerBIReportTemplate -OutputPath $ReportPath
    
    # 6. データセットの作成
    $dataset = Create-PowerBIDataset -WorkspaceId $workspace.Id
    
    if ($dataset) {
        # 7. 接続文字列の設定
        Set-ConnectionString -WorkspaceId $workspace.Id -DatasetId $dataset.Id
        
        # 8. スケジュール更新の設定
        Set-RefreshSchedule -WorkspaceId $workspace.Id -DatasetId $dataset.Id
    }
    
    # 完了メッセージ
    Write-Host "`n=== セットアップが完了しました ===" -ForegroundColor Green
    Write-Host "ワークスペース: $($workspace.Name)" -ForegroundColor Gray
    Write-Host "ワークスペースID: $($workspace.Id)" -ForegroundColor Gray
    if ($dataset) {
        Write-Host "データセットID: $($dataset.Id)" -ForegroundColor Gray
    }
    Write-Host "Power Query テンプレート: $($templates.QueryPath)" -ForegroundColor Gray
    Write-Host "DAX メジャー: $($templates.DaxPath)" -ForegroundColor Gray
    Write-Host "`n次のステップ:" -ForegroundColor Yellow
    Write-Host "1. Power BI Desktop で新しいレポートを作成" -ForegroundColor Gray
    Write-Host "2. 作成されたクエリファイルを使用してデータをインポート" -ForegroundColor Gray
    Write-Host "3. DAX メジャーを追加" -ForegroundColor Gray
    Write-Host "4. レポートをワークスペースに発行" -ForegroundColor Gray
}

# エラーハンドリング
try {
    Main
} catch {
    Write-Host "`n予期しないエラーが発生しました: $_" -ForegroundColor Red
    Write-Host "スタックトレース: $($_.ScriptStackTrace)" -ForegroundColor Red
} finally {
    # Power BI サービスからの切断
    Disconnect-PowerBIServiceAccount -ErrorAction SilentlyContinue
    Write-Host "`n終了時刻: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
}

# 使用例
<#
.\setup-powerbi-connection.ps1 `
    -ServerName "chatgptplus-server.database.windows.net" `
    -DatabaseName "chatgptplus-db" `
    -Username "powerbi-reader" `
    -Password (ConvertTo-SecureString "YourPassword" -AsPlainText -Force) `
    -WorkspaceName "ChatGPT Plus LP Analytics" `
    -UseAzureAD
#>