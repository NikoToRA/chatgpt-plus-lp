# Azure Functions API for ChatGPT Plus LP

このディレクトリには、ChatGPT Plus医療機関向けランディングページのAzure Functions APIが含まれています。

## 機能

- フォーム送信処理
- PDFの動的生成
- Azure Table Storageへのデータ保存

## ローカル開発

1. Azure Functions Core Toolsをインストール:
   ```
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

2. 依存関係をインストール:
   ```
   npm install
   ```

3. ローカル設定ファイル（local.settings.json）を更新:
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "接続文字列を入力",
       "FUNCTIONS_WORKER_RUNTIME": "node"
     }
   }
   ```

4. ローカルでFunctionsを実行:
   ```
   func start
   ```

## デプロイ

GitHub Actionsを使用して、mainブランチへのプッシュ時に自動的にAzure Functionsにデプロイされます。詳細は、`.github/workflows/azure-deploy.yml`を参照してください。

## Azure環境のセットアップ

Azure環境のセットアップ方法については、プロジェクトルートの[AZURE_SETUP.md](../AZURE_SETUP.md)を参照してください。
