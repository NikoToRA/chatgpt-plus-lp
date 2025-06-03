# Power BI によるお問い合わせデータ可視化設定ガイド

このドキュメントは、Issue #2で作成したAzureデータベースのお問い合わせデータをPower BIで可視化するための設定手順を説明します。

## 前提条件

- Azure SQL Database または Azure Cosmos DB が設定済み（Issue #2完了）
- Power BI Pro または Premium ライセンス
- Azure Portal へのアクセス権限
- データベースへの読み取り権限

## 1. Power BI Desktop のセットアップ

### 1.1 Power BI Desktop のインストール
1. [Power BI Desktop ダウンロードページ](https://powerbi.microsoft.com/ja-jp/desktop/)にアクセス
2. 最新版をダウンロードしてインストール

### 1.2 データソースへの接続

#### Azure SQL Database の場合
1. Power BI Desktop を起動
2. 「ホーム」タブから「データを取得」→「Azure」→「Azure SQL Database」を選択
3. 接続情報を入力：
   - サーバー名: `your-server.database.windows.net`
   - データベース名: `your-database-name`
   - データ接続モード: 「インポート」または「DirectQuery」を選択
4. 認証方法を選択（推奨: Azure AD 認証）
5. テーブルを選択してインポート

#### Azure Cosmos DB の場合
1. 「データを取得」→「Azure」→「Azure Cosmos DB」を選択
2. アカウントエンドポイント URL とアクセスキーを入力
3. データベースとコンテナーを選択
4. データをインポート

### 1.3 接続文字列の設定例

```sql
-- Azure SQL Database
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

## 2. レポートの作成

### 2.1 基本的なビジュアライゼーション

#### お問い合わせ件数の推移
1. 「視覚化」ペインから「折れ線グラフ」を選択
2. X軸: 日付フィールド
3. Y軸: お問い合わせ件数（カウント）

#### カテゴリ別お問い合わせ分析
1. 「円グラフ」または「棒グラフ」を選択
2. 凡例: カテゴリフィールド
3. 値: お問い合わせ件数

#### 時間帯別分析
1. 「マトリックス」または「ヒートマップ」を選択
2. 行: 日付
3. 列: 時間帯
4. 値: お問い合わせ件数

### 2.2 メジャーの作成

```dax
-- 合計お問い合わせ件数
Total Inquiries = COUNTROWS('Inquiries')

-- 前月比
MoM Growth = 
VAR CurrentMonth = CALCULATE([Total Inquiries], DATESMTD('Date'[Date]))
VAR PreviousMonth = CALCULATE([Total Inquiries], PREVIOUSMONTH('Date'[Date]))
RETURN
DIVIDE(CurrentMonth - PreviousMonth, PreviousMonth, 0)

-- 平均処理時間
Avg Processing Time = 
AVERAGE('Inquiries'[ProcessingTime])

-- 未対応件数
Pending Inquiries = 
CALCULATE(
    [Total Inquiries],
    'Inquiries'[Status] = "Pending"
)
```

### 2.3 ダッシュボードの構成例

1. **概要ページ**
   - KPIカード（総件数、未対応件数、平均処理時間）
   - 月次推移グラフ
   - カテゴリ別円グラフ

2. **詳細分析ページ**
   - 時系列分析
   - 地域別分析（該当する場合）
   - ステータス別分析

3. **アラートページ**
   - 未対応件数の推移
   - 処理時間が長いお問い合わせ一覧

## 3. Power BI Service への発行

### 3.1 ワークスペースの準備
1. [Power BI Service](https://app.powerbi.com/)にサインイン
2. 「ワークスペース」→「ワークスペースの作成」
3. ワークスペース名と説明を入力

### 3.2 レポートの発行
1. Power BI Desktop から「発行」ボタンをクリック
2. 発行先のワークスペースを選択
3. 「選択」をクリックして発行

### 3.3 自動更新の設定
1. Power BI Service でデータセットの設定を開く
2. 「スケジュールされた更新」を有効化
3. 更新頻度を設定（日次、時間単位など）
4. 認証情報を設定

## 4. 共有とアクセス制御

### 4.1 アプリの作成
1. ワークスペースで「アプリの作成」を選択
2. アプリ名、説明、ロゴを設定
3. 含めるコンテンツを選択
4. アクセス権限を設定

### 4.2 共有設定
- **閲覧者**: レポートの閲覧のみ
- **投稿者**: レポートの編集が可能
- **管理者**: ワークスペースの管理が可能

### 4.3 Row Level Security (RLS) の設定
```dax
-- 部門別アクセス制御
[Department] = USERPRINCIPALNAME()

-- 地域別アクセス制御
[Region] IN VALUES(UserRegions[Region])
```

## 5. ベストプラクティス

### 5.1 パフォーマンス最適化
- 必要なデータのみをインポート
- 集計テーブルの活用
- DirectQuery vs Import モードの適切な選択
- インデックスの最適化（データベース側）

### 5.2 データモデリング
- スタースキーマの採用
- 適切なリレーションシップの設定
- 日付テーブルの作成
- 不要なカラムの削除

### 5.3 セキュリティ
- Azure AD 認証の使用
- 接続文字列の暗号化
- 定期的なアクセスレビュー
- 監査ログの有効化

## 6. トラブルシューティング

### 接続エラーの対処
1. ファイアウォール設定の確認
2. 認証情報の確認
3. ネットワーク接続の確認
4. Power BI ゲートウェイの設定（オンプレミスの場合）

### パフォーマンス問題
1. クエリの最適化
2. データモデルの見直し
3. 更新頻度の調整
4. Premium 容量の検討

## 7. 監視とメンテナンス

### 7.1 使用状況の監視
- Power BI 使用状況メトリックの確認
- レポートアクセスログの分析
- パフォーマンスメトリックの追跡

### 7.2 定期メンテナンス
- 月次でのデータモデルレビュー
- 四半期でのセキュリティレビュー
- 年次でのライセンス最適化

## まとめ

このガイドに従って設定を行うことで、Azure データベースに保存されたお問い合わせデータを Power BI で効果的に可視化し、ビジネスインサイトを得ることができます。定期的なレビューと最適化により、システムの効率性と有用性を維持してください。