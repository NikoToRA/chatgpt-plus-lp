現在のNetlifyとAzure Functionsに分散しているデプロイを、Azure Static Web Appsに統合します。これにより、デプロイプロセスの一元化と効率化を図ります。

**実施事項**:
1. Azure Portal または Azure CLI を使用して、Azure Static Web Apps リソースを作成する。対象リポジトリとして `NikoToRA/chatgpt-plus-lp` を指定する。
2. Static Web Apps リソース作成時に自動生成される（または手動で設定する）GitHub Actions ワークフローを確認・修正する。フロントエンドコードの場所とビルドコマンド、APIコード（`api` ディレクトリ）の場所が正しく設定されていることを確認する。
3. 現在のAzure Functionsで設定されているアプリケーション設定（例: Azure Storage の接続文字列など）を、Azure Static Web Apps のアプリケーション設定に移行する。
4. リポジトリの対象ブランチ（例: `main`）にコードをプッシュし、GitHub Actions ワークフローがトリガーされてデプロイが成功することを確認する。
5. デプロイされたStatic Web Apps のURLにアクセスし、LPが正しく表示され、お問い合わせフォームの送信機能（Azure Functions経由）が正常に動作することを確認する。

**完了の定義**: LPの表示とお問い合わせフォームの機能が、Azure Static Web Apps 上で安定して動作すること。 