# ChatGPT Plus for Healthcare - Clean Site

このプロジェクトは、ChatGPT Plus医療機関向け運用代行サービスのランディングページです。

## 構成

- `/` - メインのランディングページ
- `/privacy.html` - プライバシーポリシー

## ファイル構造

```
/
├── index.html              # メインページ
├── privacy.html            # プライバシーポリシー
├── css/                   # スタイルシート
├── js/                    # JavaScript
├── images/                # 画像ファイル
└── staticwebapp.config.json # Azure Static Web Apps設定
```

## デプロイ

このプロジェクトはAzure Static Web Appsを使用してデプロイされます。

### 新しいAzure Static Web Appsインスタンスの作成手順

1. Azure Portalにログイン
2. Static Web Apps リソースを作成
3. GitHubリポジトリを接続
4. `AZURE_STATIC_WEB_APPS_API_TOKEN` シークレットを設定
5. 自動デプロイが実行される

## 更新日

2025年7月11日