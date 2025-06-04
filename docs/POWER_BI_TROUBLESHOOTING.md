# Power BI トラブルシューティングガイド

このガイドでは、ChatGPT Plus LP の Power BI 実装で発生する可能性のある問題と解決方法を提供します。

## 目次

1. [接続関連の問題](#接続関連の問題)
2. [パフォーマンスの問題](#パフォーマンスの問題)
3. [データ更新の問題](#データ更新の問題)
4. [セキュリティの問題](#セキュリティの問題)
5. [ビジュアルの問題](#ビジュアルの問題)
6. [DAX関連の問題](#dax関連の問題)
7. [Power BI Service の問題](#power-bi-service-の問題)
8. [一般的なエラーコード](#一般的なエラーコード)

## 接続関連の問題

### 問題: Azure SQL Database に接続できない

#### エラーメッセージ
```
接続できませんでした。サーバーが見つからないか、アクセスできません。
```

#### 解決方法

1. **ファイアウォール設定の確認**
```powershell
# Azure Portal で SQL Server のファイアウォール規則を確認
# 現在の IP アドレスを追加
$myIP = (Invoke-WebRequest -Uri "https://api.ipify.org").Content
Write-Host "現在の IP アドレス: $myIP"
```

2. **接続文字列の確認**
```
正しい形式:
Server=tcp:your-server.database.windows.net,1433;
Initial Catalog=your-database;
Persist Security Info=False;
User ID=your-username;
Password=your-password;
MultipleActiveResultSets=False;
Encrypt=True;
TrustServerCertificate=False;
Connection Timeout=30;
```

3. **ネットワーク設定の確認**
- VPN接続が必要な場合は接続されているか確認
- プロキシ設定が正しいか確認
- DNS解決が正常に動作しているか確認

### 問題: Cosmos DB に接続できない

#### エラーメッセージ
```
認証に失敗しました。アカウントキーが無効です。
```

#### 解決方法

1. **アカウントキーの再生成**
```powershell
# Azure CLI を使用してキーを取得
az cosmosdb keys list \
  --name your-cosmosdb-account \
  --resource-group your-resource-group \
  --type keys
```

2. **エンドポイント URL の確認**
- 正しい形式: `https://your-account.documents.azure.com:443/`
- HTTPSプロトコルとポート443が含まれていることを確認

3. **接続モードの変更**
- Gateway モードから Direct モードに変更
- Power Query エディターで接続オプションを調整

## パフォーマンスの問題

### 問題: レポートの読み込みが遅い

#### 症状
- ビジュアルの表示に10秒以上かかる
- フィルター適用時の応答が遅い
- ページ切り替えが重い

#### 解決方法

1. **データモデルの最適化**
```dax
// 不要な列を削除
// Power Query エディターで実行
Table.RemoveColumns(Source, {"UnusedColumn1", "UnusedColumn2"})

// データ型の最適化
Table.TransformColumnTypes(Source, {
    {"ID", Int64.Type}, // 文字列から整数に変換
    {"Date", type date} // 日時から日付のみに変換
})
```

2. **集計の事前計算**
```sql
-- SQL Server で集計ビューを作成
CREATE VIEW vw_DailyAggregates AS
SELECT 
    CAST(Timestamp AS DATE) as Date,
    HospitalType,
    COUNT(*) as SubmissionCount,
    AVG(StaffCount) as AvgStaffCount
FROM FormSubmissions
GROUP BY CAST(Timestamp AS DATE), HospitalType;
```

3. **インデックスの追加**
```sql
-- よく使用される列にインデックスを追加
CREATE NONCLUSTERED INDEX IX_Timestamp 
ON FormSubmissions(Timestamp) INCLUDE (HospitalType, StaffCount);

CREATE NONCLUSTERED INDEX IX_HospitalType 
ON FormSubmissions(HospitalType) INCLUDE (SubmissionId);
```

4. **DirectQuery から Import モードへの変更**
- データ量が許容範囲内の場合は Import モードを使用
- 増分更新を設定して効率的にデータを更新

### 問題: メモリ不足エラー

#### エラーメッセージ
```
メモリが不足しています。一部のビジュアルを読み込めません。
```

#### 解決方法

1. **データ量の削減**
```powerquery
// 必要な期間のデータのみをロード
let
    Source = Sql.Database("server", "database"),
    FilteredData = Table.SelectRows(Source, 
        each [Timestamp] >= #date(2024, 1, 1))
in
    FilteredData
```

2. **ビジュアルの最適化**
- 1ページあたりのビジュアル数を制限（推奨: 8個以下）
- 複雑な計算を含むビジュアルを簡素化
- 条件付き書式の使用を最小限に

## データ更新の問題

### 問題: スケジュール更新が失敗する

#### エラーメッセージ
```
データソースのエラー: 資格情報の有効期限が切れています。
```

#### 解決方法

1. **資格情報の更新**
```powershell
# Power BI Service で実行
1. データセット設定に移動
2. "データソースの資格情報" をクリック
3. "資格情報を編集" をクリック
4. 新しい資格情報を入力
```

2. **ゲートウェイの確認**（オンプレミスデータソースの場合）
```powershell
# ゲートウェイの状態確認
Get-Service "PBIEgwService" | Select-Object Name, Status, StartType

# ゲートウェイの再起動
Restart-Service "PBIEgwService"
```

3. **更新タイムアウトの延長**
- Power BI Service で更新タイムアウトを120分に設定
- 大量のデータの場合は増分更新を検討

### 問題: 増分更新が機能しない

#### 症状
- 全データが毎回読み込まれる
- 更新時間が予想より長い

#### 解決方法

1. **RangeStart と RangeEnd パラメータの設定**
```powerquery
// Power Query でパラメータを作成
let
    RangeStart = #datetime(2024, 1, 1, 0, 0, 0),
    RangeEnd = #datetime(2024, 12, 31, 23, 59, 59),
    
    Source = Sql.Database("server", "database"),
    FilteredData = Table.SelectRows(Source, 
        each [Timestamp] >= RangeStart and [Timestamp] <= RangeEnd)
in
    FilteredData
```

2. **増分更新ポリシーの設定**
- データセット設定で増分更新を有効化
- 保持期間と更新期間を適切に設定

## セキュリティの問題

### 問題: 行レベルセキュリティが機能しない

#### 症状
- ユーザーが見るべきでないデータが表示される
- フィルターが適用されない

#### 解決方法

1. **RLS ロールの確認**
```dax
// ロール定義の例
[HospitalType] = USERPRINCIPALNAME()

// より複雑なロール
VAR UserEmail = USERPRINCIPALNAME()
VAR AllowedTypes = 
    FILTER(
        UserPermissions,
        UserPermissions[Email] = UserEmail
    )
RETURN
    [HospitalType] IN VALUES(AllowedTypes[HospitalType])
```

2. **ロールメンバーシップの確認**
```powershell
# Power BI REST API でロールメンバーを確認
$workspaceId = "your-workspace-id"
$datasetId = "your-dataset-id"

$uri = "https://api.powerbi.com/v1.0/myorg/groups/$workspaceId/datasets/$datasetId/users"
Invoke-PowerBIRestMethod -Method GET -Url $uri
```

### 問題: 認証エラー

#### エラーメッセージ
```
認証に失敗しました。組織のアカウントでサインインしてください。
```

#### 解決方法

1. **Azure AD 設定の確認**
- ユーザーが正しい Azure AD テナントに属しているか確認
- 必要なライセンスが割り当てられているか確認

2. **条件付きアクセスポリシーの確認**
- 多要素認証が必要な場合は設定
- IP 制限がある場合は許可リストに追加

## ビジュアルの問題

### 問題: カスタムビジュアルが表示されない

#### 症状
- カスタムビジュアルが空白で表示される
- エラーアイコンが表示される

#### 解決方法

1. **組織の設定を確認**
```powershell
# Power BI 管理ポータルで確認
1. 設定 → 管理ポータル
2. テナント設定 → カスタムビジュアル
3. "組織のカスタムビジュアルを許可" を有効化
```

2. **ビジュアルの再インポート**
- AppSource からビジュアルを再度インポート
- 最新バージョンかどうか確認

### 問題: 日本語が文字化けする

#### 症状
- 日本語テキストが正しく表示されない
- エクスポート時に文字化けする

#### 解決方法

1. **フォントの設定**
```json
// テーマファイルでフォントを指定
{
    "name": "JapaneseTheme",
    "textClasses": {
        "label": {
            "fontFamily": "Yu Gothic UI, Meiryo UI, sans-serif"
        }
    }
}
```

2. **エンコーディングの確認**
- データソースの文字エンコーディングを UTF-8 に設定
- CSV ファイルの場合は BOM 付き UTF-8 で保存

## DAX関連の問題

### 問題: 循環依存エラー

#### エラーメッセージ
```
循環依存が検出されました。
```

#### 解決方法

1. **計算列の見直し**
```dax
// 問題のある例
Column1 = [Column2] + 1
Column2 = [Column1] - 1

// 解決方法: 基準となる列を使用
BaseValue = 100
Column1 = [BaseValue] + 1
Column2 = [BaseValue] - 1
```

2. **メジャーの依存関係を確認**
- DAX Studio を使用して依存関係を可視化
- 複雑な計算は変数を使用して分割

### 問題: パフォーマンスの悪い DAX クエリ

#### 症状
- メジャーの計算に時間がかかる
- フィルター適用時にフリーズする

#### 解決方法

1. **CALCULATE の最適化**
```dax
// 非効率な例
BadMeasure = 
SUMX(
    FormSubmissions,
    IF([HospitalType] = "大学病院", [StaffCount], 0)
)

// 効率的な例
GoodMeasure = 
CALCULATE(
    SUM(FormSubmissions[StaffCount]),
    FormSubmissions[HospitalType] = "大学病院"
)
```

2. **変数の活用**
```dax
OptimizedMeasure = 
VAR TotalSubmissions = COUNT(FormSubmissions[SubmissionId])
VAR FilteredSubmissions = 
    CALCULATE(
        COUNT(FormSubmissions[SubmissionId]),
        FormSubmissions[Status] = "契約済み"
    )
RETURN
    DIVIDE(FilteredSubmissions, TotalSubmissions, 0)
```

## Power BI Service の問題

### 問題: レポートの共有ができない

#### 症状
- 共有ボタンがグレーアウトしている
- 共有しても相手が見られない

#### 解決方法

1. **ライセンスの確認**
- 共有元: Power BI Pro または Premium ライセンスが必要
- 共有先: 最低でも無料ライセンスが必要

2. **ワークスペースの権限**
```powershell
# ワークスペースロールの確認
# 管理者、メンバー、共同作成者、ビューアー
```

3. **共有設定の確認**
- "再共有を許可" オプションの確認
- "基になるデータセットへのアクセスを許可" の設定

### 問題: エクスポート機能が使えない

#### 症状
- Excel へのエクスポートボタンが表示されない
- PDF エクスポートが失敗する

#### 解決方法

1. **エクスポート設定の確認**
```powershell
# Power BI Service の設定
1. データセット設定 → エクスポート設定
2. "基になるデータのエクスポート" を有効化
3. "集約されたデータのエクスポート" を有効化
```

2. **データ量の制限**
- Excel: 最大150,000行
- CSV: 最大30,000行
- 大量データの場合は Power BI Paginated Reports を使用

## 一般的なエラーコード

### エラーコード一覧と対処法

| エラーコード | 説明 | 対処法 |
|------------|------|--------|
| DM_GWPipeline_Gateway_SpooledOperationMissing | ゲートウェイエラー | ゲートウェイを再起動 |
| DM_GWPipeline_UnknownError | 不明なエラー | ログを確認して詳細を特定 |
| DMTS_DatasourceHasNoCredentialError | 資格情報エラー | データソースの資格情報を更新 |
| DM_ErrorDetailNameCode_UnderlyingErrorMessage | 基礎的なエラー | エラーメッセージの詳細を確認 |
| CredentialNotFound | 資格情報が見つからない | 資格情報を再設定 |
| DataSourceAccessForbidden | アクセス拒否 | 権限を確認 |
| InvalidConnectionCredentials | 無効な接続情報 | 接続文字列を確認 |

## ログの確認方法

### Power BI Desktop のログ

```powershell
# ログファイルの場所
$logPath = "$env:LOCALAPPDATA\Microsoft\Power BI Desktop\Traces"

# 最新のログファイルを開く
Get-ChildItem $logPath -Filter "*.log" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1 | 
    Invoke-Item
```

### Power BI Service のアクティビティログ

```powershell
# Power BI REST API でアクティビティログを取得
$startDate = (Get-Date).AddDays(-7).ToString("yyyy-MM-dd")
$endDate = (Get-Date).ToString("yyyy-MM-dd")

$activities = Get-PowerBIActivityEvent -StartDateTime $startDate -EndDateTime $endDate
$activities | Where-Object {$_.Activity -like "*Error*"} | Format-Table
```

## サポートリソース

1. **公式ドキュメント**
   - [Power BI ドキュメント](https://docs.microsoft.com/ja-jp/power-bi/)
   - [トラブルシューティングガイド](https://docs.microsoft.com/ja-jp/power-bi/troubleshoot/)

2. **コミュニティ**
   - [Power BI Community](https://community.powerbi.com/)
   - [Stack Overflow - Power BI タグ](https://stackoverflow.com/questions/tagged/powerbi)

3. **サポート**
   - Microsoft サポートチケット
   - Power BI Pro サポート（ライセンス保有者）

## 予防的メンテナンス

### 定期的なチェックリスト

- [ ] データソースの接続状態を確認（週次）
- [ ] 更新履歴でエラーがないか確認（日次）
- [ ] ゲートウェイのログを確認（月次）
- [ ] 未使用のデータセットとレポートを削除（四半期）
- [ ] ライセンスの有効期限を確認（月次）
- [ ] パフォーマンスメトリクスを記録（週次）