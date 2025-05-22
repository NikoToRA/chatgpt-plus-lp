# Azure Setup Guide for ChatGPT Plus LP

このガイドでは、ChatGPT Plus医療機関向けランディングページのAzure Functionsとの連携に必要な設定手順を説明します。

## 必要なAzureリソース

1. **Azure Function App**
   - Node.js 18.x ランタイム
   - 消費プラン（サーバーレス）

2. **Azure Storage Account**
   - Table Storageを使用
   - FormSubmissionsテーブルを作成

## 設定手順

### 1. Azureアカウントとサブスクリプションの設定

1. [Azure Portal](https://portal.azure.com/)にログイン
2. サブスクリプションがない場合は、無料トライアルまたは従量課金プランを選択

### 2. Azure Storage Accountの作成

1. Azure Portalで「ストレージアカウント」を検索
2. 「作成」をクリック
3. 以下の設定を入力:
   - サブスクリプション: 任意のサブスクリプション
   - リソースグループ: 新規作成または既存のグループを選択
   - ストレージアカウント名: 一意の名前（例: chatgptpluslpstorage）
   - 地域: 最寄りのリージョン
   - パフォーマンス: Standard
   - 冗長性: ローカル冗長ストレージ (LRS)
4. 「確認および作成」をクリックし、検証が完了したら「作成」をクリック
5. デプロイ完了後、「リソースに移動」をクリック
6. 左側メニューの「アクセスキー」を選択し、接続文字列をメモ

### 3. Azure Function Appの作成

1. Azure Portalで「Function App」を検索
2. 「作成」をクリック
3. 以下の設定を入力:
   - サブスクリプション: 任意のサブスクリプション
   - リソースグループ: Storage Accountと同じグループを選択
   - 関数アプリ名: chatgpt-plus-lp-api
   - 公開: コード
   - ランタイムスタック: Node.js
   - バージョン: 18 LTS
   - 地域: Storage Accountと同じリージョン
   - オペレーティングシステム: Windows
   - プランタイプ: 消費（サーバーレス）
4. 「確認および作成」をクリックし、検証が完了したら「作成」をクリック
5. デプロイ完了後、「リソースに移動」をクリック

### 4. Function Appの設定

1. 左側メニューの「構成」を選択
2. 「アプリケーション設定」タブで「新しいアプリケーション設定」をクリック
3. 以下の設定を追加:
   - 名前: AzureWebJobsStorage
   - 値: 先ほどメモした接続文字列
4. 「保存」をクリック

### 5. デプロイプロファイルの取得

1. 左側メニューの「デプロイセンター」を選択
2. 「管理発行プロファイル」をクリック
3. 発行プロファイルをダウンロード

### 6. GitHub Secretsの設定

1. GitHubリポジトリの「Settings」タブに移動
2. 左側メニューの「Secrets and variables」→「Actions」を選択
3. 「New repository secret」をクリック
4. 以下のシークレットを追加:
   - 名前: AZURE_FUNCTIONAPP_PUBLISH_PROFILE
   - 値: ダウンロードした発行プロファイルの内容をコピー＆ペースト
5. 「Add secret」をクリック

## デプロイ

GitHub Actionsワークフローが設定されているため、mainブランチにプッシュすると自動的にAzure Functionsにデプロイされます。

## ローカルでのテスト

1. Azure Functions Core Toolsをインストール:
   ```
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

2. ローカル設定ファイルを更新:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "接続文字列を入力",
       "FUNCTIONS_WORKER_RUNTIME": "node"
     }
   }
   ```

3. ローカルでFunctionsを実行:
   ```
   cd api
   func start
   ```

4. フロントエンドのスクリプトを更新:
   ```html
   <script src="js/azure-form-handler.js"></script>
   ```

## トラブルシューティング

- **CORS設定**: Azure Functionsでのリクエスト処理時にCORSエラーが発生する場合は、Function Appの「CORS」設定で許可されたオリジンを追加してください。
- **接続エラー**: Storage Accountへの接続エラーが発生する場合は、接続文字列が正しいことを確認してください。
- **デプロイエラー**: GitHub Actionsでのデプロイエラーが発生する場合は、発行プロファイルが正しく設定されていることを確認してください。
