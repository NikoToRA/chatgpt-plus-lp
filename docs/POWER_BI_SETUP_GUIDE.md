# Power BI 設定ガイド - ChatGPT Plus LP

このガイドでは、Azure データベースに保存されたお問い合わせデータをPower BIで可視化するための完全な設定手順を説明します。

## 目次

1. [前提条件](#前提条件)
2. [Power BI Desktop のセットアップ](#power-bi-desktop-のセットアップ)
3. [Azure データベースへの接続](#azure-データベースへの接続)
4. [データモデルの構築](#データモデルの構築)
5. [レポートの作成](#レポートの作成)
6. [Power BI Service への発行](#power-bi-service-への発行)
7. [自動更新の設定](#自動更新の設定)
8. [セキュリティとアクセス制御](#セキュリティとアクセス制御)
9. [パフォーマンス最適化](#パフォーマンス最適化)
10. [トラブルシューティング](#トラブルシューティング)

## 前提条件

### 必要なツールとライセンス

- **Power BI Desktop** (最新版)
  - [ダウンロードリンク](https://powerbi.microsoft.com/ja-jp/desktop/)
- **Power BI Pro または Premium ライセンス** (共有機能のため)
- **Azure サブスクリプション** (データベースアクセスのため)
- **Azure AD アカウント** (認証のため)

### 必要なデータベース情報

- Azure SQL Database または Cosmos DB の接続情報
- データベースサーバー名
- データベース名
- 認証情報（ユーザー名/パスワード または Azure AD）

## Power BI Desktop のセットアップ

### 1. インストールと初期設定

```powershell
# Power BI Desktop のインストール（Chocolatey使用の場合）
choco install powerbi-desktop
```

### 2. 初回起動時の設定

1. Power BI Desktop を起動
2. Microsoft アカウントでサインイン
3. 「ファイル」→「オプションと設定」→「オプション」
4. 以下の設定を推奨:
   - データロード: バックグラウンドデータを有効化
   - プライバシー: 組織レベルに設定
   - 診断: 自動エラー報告を有効化

## Azure データベースへの接続

### Azure SQL Database への接続

1. Power BI Desktop で「データを取得」をクリック
2. 「Azure」→「Azure SQL データベース」を選択
3. 接続情報を入力:

```
サーバー: your-server.database.windows.net
データベース: chatgptplus-db
データ接続モード: Import（推奨）またはDirectQuery
```

4. 認証方法を選択:
   - **データベース認証**: ユーザー名とパスワードを入力
   - **Microsoft アカウント**: Azure AD 認証を使用

### Azure Cosmos DB への接続

1. 「データを取得」→「Azure」→「Azure Cosmos DB」
2. アカウントエンドポイント URL を入力:

```
https://your-cosmosdb-account.documents.azure.com:443/
```

3. アカウントキーまたは読み取り専用キーを入力
4. データベースとコレクションを選択

### 接続文字列の例

```sql
-- Azure SQL Database
Server=tcp:chatgptplus-server.database.windows.net,1433;
Initial Catalog=chatgptplus-db;
Persist Security Info=False;
User ID=powerbi-reader;
Password={your_password};
MultipleActiveResultSets=False;
Encrypt=True;
TrustServerCertificate=False;
Connection Timeout=30;
```

## データモデルの構築

### 基本テーブル構造

```sql
-- FormSubmissions テーブル
CREATE TABLE FormSubmissions (
    SubmissionId NVARCHAR(50) PRIMARY KEY,
    Timestamp DATETIME2,
    HospitalName NVARCHAR(200),
    HospitalType NVARCHAR(50),
    ContactPerson NVARCHAR(100),
    Email NVARCHAR(200),
    Phone NVARCHAR(50),
    StaffCount INT,
    Interest NVARCHAR(50),
    SystemUsage NVARCHAR(50),
    Message NVARCHAR(MAX),
    IpAddress NVARCHAR(50),
    UserAgent NVARCHAR(500)
);

-- 追加の分析用ビュー
CREATE VIEW vw_FormSubmissionsAnalytics AS
SELECT 
    SubmissionId,
    Timestamp,
    CAST(Timestamp AS DATE) as SubmissionDate,
    DATEPART(HOUR, Timestamp) as SubmissionHour,
    DATENAME(WEEKDAY, Timestamp) as DayOfWeek,
    HospitalName,
    HospitalType,
    StaffCount,
    CASE 
        WHEN StaffCount < 50 THEN '小規模'
        WHEN StaffCount < 200 THEN '中規模'
        ELSE '大規模'
    END as HospitalScale,
    Interest,
    SystemUsage
FROM FormSubmissions;
```

### Power BI でのデータ変換

```powerquery
// Power Query エディターでの変換例
let
    Source = Sql.Database("server.database.windows.net", "database"),
    FormSubmissions = Source{[Schema="dbo",Item="FormSubmissions"]}[Data],
    
    // データ型の設定
    TypedData = Table.TransformColumnTypes(FormSubmissions,{
        {"Timestamp", type datetime},
        {"StaffCount", Int64.Type},
        {"HospitalType", type text}
    }),
    
    // 日付列の追加
    AddedDate = Table.AddColumn(TypedData, "Date", 
        each DateTime.Date([Timestamp]), type date),
    
    // 時間帯の分類
    AddedTimeSlot = Table.AddColumn(AddedDate, "TimeSlot", 
        each if Time.Hour([Timestamp]) < 9 then "早朝"
        else if Time.Hour([Timestamp]) < 12 then "午前"
        else if Time.Hour([Timestamp]) < 18 then "午後"
        else "夜間", type text),
    
    // 病院規模の分類
    AddedScale = Table.AddColumn(AddedTimeSlot, "HospitalScale",
        each if [StaffCount] < 50 then "小規模"
        else if [StaffCount] < 200 then "中規模"
        else "大規模", type text)
in
    AddedScale
```

## レポートの作成

### 推奨ビジュアライゼーション

#### 1. KPI カード
- 総問い合わせ数
- 今月の問い合わせ数
- 平均反応時間
- コンバージョン率

#### 2. 時系列グラフ
```dax
// 日別問い合わせ数の推移
DailySubmissions = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    USERELATIONSHIP('Calendar'[Date], FormSubmissions[Date])
)

// 移動平均（7日間）
MovingAverage7Days = 
AVERAGEX(
    DATESINPERIOD('Calendar'[Date], LASTDATE('Calendar'[Date]), -7, DAY),
    [DailySubmissions]
)
```

#### 3. 円グラフ・ドーナツチャート
- 病院タイプ別分布
- 興味のある機能別分布
- システム利用状況別分布

#### 4. 地図ビジュアル（病院の地理的分布）
```dax
// 都道府県の抽出（住所から）
Prefecture = 
LEFT(
    MID(
        FormSubmissions[Address],
        FIND("都", FormSubmissions[Address], 1, 
            FIND("道", FormSubmissions[Address], 1,
                FIND("府", FormSubmissions[Address], 1,
                    FIND("県", FormSubmissions[Address], 1, 0)
                )
            )
        ) + 1,
        3
    ),
    3
)
```

### 高度な分析メジャー

```dax
// 前月比成長率
MoM_Growth = 
VAR CurrentMonth = [TotalSubmissions]
VAR PreviousMonth = CALCULATE([TotalSubmissions], DATEADD('Calendar'[Date], -1, MONTH))
RETURN
DIVIDE(CurrentMonth - PreviousMonth, PreviousMonth, 0)

// 累積問い合わせ数
CumulativeSubmissions = 
CALCULATE(
    COUNT(FormSubmissions[SubmissionId]),
    FILTER(
        ALL('Calendar'[Date]),
        'Calendar'[Date] <= MAX('Calendar'[Date])
    )
)

// 平均リードタイム（問い合わせから契約まで）
AverageLeadTime = 
AVERAGEX(
    FILTER(
        FormSubmissions,
        NOT(ISBLANK(FormSubmissions[ContractDate]))
    ),
    DATEDIFF(FormSubmissions[Timestamp], FormSubmissions[ContractDate], DAY)
)

// コンバージョン率
ConversionRate = 
DIVIDE(
    CALCULATE(COUNT(FormSubmissions[SubmissionId]), FormSubmissions[Status] = "契約済み"),
    COUNT(FormSubmissions[SubmissionId]),
    0
)
```

## Power BI Service への発行

### 1. ワークスペースの作成

1. [Power BI Service](https://app.powerbi.com) にログイン
2. 「ワークスペース」→「ワークスペースの作成」
3. 以下の情報を入力:
   - 名前: ChatGPT Plus LP Analytics
   - 説明: 医療機関向けLPの問い合わせ分析
   - 詳細設定: Premium 容量を割り当て（必要な場合）

### 2. レポートの発行

```powershell
# Power BI Desktop から
1. 「ファイル」→「発行」→「Power BI に発行」
2. ワークスペースを選択: "ChatGPT Plus LP Analytics"
3. 「選択」をクリック
```

### 3. データセットの設定

発行後、Power BI Service で:
1. データセット設定に移動
2. 「データソースの資格情報」を更新
3. 「スケジュールされた更新」を設定

## 自動更新の設定

### スケジュール更新の設定

```json
{
  "updateSchedule": {
    "frequency": "Daily",
    "times": ["09:00", "18:00"],
    "timezone": "Tokyo Standard Time",
    "notifyOption": "MailOnFailure"
  }
}
```

### オンプレミス データ ゲートウェイ（必要な場合）

```powershell
# ゲートウェイのインストール
1. Power BI Service から「ゲートウェイのダウンロード」
2. インストーラーを実行
3. ゲートウェイをクラウドサービスに登録
4. データソースをゲートウェイに追加
```

## セキュリティとアクセス制御

### 行レベルセキュリティ (RLS) の実装

```dax
// 病院タイプ別のアクセス制御
[HospitalType] = USERNAME()

// 地域別のアクセス制御
[Region] IN PATHCONTAINS(USERPRINCIPALNAME(), "region")
```

### ロールの作成と割り当て

```powershell
# Power BI Service で
1. データセット設定 → セキュリティ
2. 「ロールの作成」
3. DAX フィルターを定義
4. メンバーを追加
```

### 共有とアクセス許可

| ロール | アクセスレベル | 説明 |
|--------|--------------|------|
| 管理者 | 完全なアクセス | すべてのデータとレポートの編集 |
| アナリスト | 読み取り + 作成 | レポートの作成と閲覧 |
| ビューアー | 読み取り専用 | レポートの閲覧のみ |

## パフォーマンス最適化

### 1. データモデルの最適化

```dax
// 不要な列の削除
// Power Query エディターで実行
Table.RemoveColumns(Source, {"UnusedColumn1", "UnusedColumn2"})

// データ型の最適化
// 文字列を整数に変換
Table.TransformColumnTypes(Source, {{"CategoryId", Int64.Type}})
```

### 2. 集計テーブルの作成

```sql
-- SQL Server での事前集計
CREATE TABLE AggregatedSubmissions AS
SELECT 
    CAST(Timestamp AS DATE) as Date,
    HospitalType,
    COUNT(*) as SubmissionCount,
    AVG(StaffCount) as AvgStaffCount
FROM FormSubmissions
GROUP BY CAST(Timestamp AS DATE), HospitalType;
```

### 3. インデックスの追加

```sql
-- パフォーマンス向上のためのインデックス
CREATE INDEX idx_timestamp ON FormSubmissions(Timestamp);
CREATE INDEX idx_hospitaltype ON FormSubmissions(HospitalType);
CREATE INDEX idx_composite ON FormSubmissions(Timestamp, HospitalType);
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. 接続エラー

**問題**: "サーバーに接続できません"
```powershell
# 解決方法
1. ファイアウォール設定を確認
2. Azure Portal で SQL Database のファイアウォール規則に IP を追加
3. 接続文字列の確認
```

#### 2. 更新エラー

**問題**: "データの更新に失敗しました"
```powershell
# 診断手順
1. Power BI Service → 設定 → データセット → 更新履歴
2. エラーの詳細を確認
3. 資格情報の有効期限を確認
4. ゲートウェイの状態を確認
```

#### 3. パフォーマンス問題

**問題**: "レポートの読み込みが遅い"
```dax
// 解決方法
1. DirectQuery から Import モードに変更
2. 不要なビジュアルを削除
3. DAX メジャーを最適化
4. 集計を使用
```

### エラーログの確認

```powershell
# Power BI Desktop のログ
%LOCALAPPDATA%\Microsoft\Power BI Desktop\Traces

# ゲートウェイのログ
%LOCALAPPDATA%\Microsoft\On-premises data gateway\GatewayLogs
```

## 次のステップ

1. **高度な分析の実装**
   - 予測分析の追加
   - 異常検知の設定
   - What-if パラメーターの活用

2. **自動化の強化**
   - Power Automate との連携
   - アラートの設定
   - レポートの自動配信

3. **ガバナンスの確立**
   - 命名規則の策定
   - バージョン管理
   - 変更管理プロセス

## 参考リソース

- [Power BI Documentation](https://docs.microsoft.com/ja-jp/power-bi/)
- [DAX Reference](https://docs.microsoft.com/ja-jp/dax/)
- [Power BI Community](https://community.powerbi.com/)
- [Guy in a Cube YouTube Channel](https://www.youtube.com/channel/UCFp1vaKzpfvoGai0vE5VJ0w)