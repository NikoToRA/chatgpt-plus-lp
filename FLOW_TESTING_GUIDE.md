# 申し込みフロー動作確認ガイド

## 概要
このガイドでは、申し込みフォームからDB登録、管理画面での表示までの完全なフローの動作確認手順を説明します。

## ローカル環境での動作確認

### 1. API Functions の起動
```bash
cd api
npm install
npm start
```

### 2. 申し込みフォームの起動
```bash
cd api/customer-application
npm install
npm start
```
ブラウザで http://localhost:3000 にアクセス

### 3. 管理画面の起動
```bash
cd admin-dashboard
npm install
npm start
```
ブラウザで http://localhost:3001 にアクセス

## テストシナリオ

### シナリオ1: 新規申し込みフロー

1. **申し込みフォームの入力**
   - http://localhost:3000 にアクセス
   - 以下のテストデータを入力：
     - サービス選択: ChatGPT Plus（4アカウント）
     - 医療機関名: テスト病院
     - 施設種別: 病院
     - 郵便番号: 100-0001
     - 都道府県: 東京都
     - 市区町村: 千代田区
     - 住所: 丸の内1-1-1
     - 電話番号: 03-1234-5678
     - ご担当者名: 山田太郎
     - メールアドレス: test@example.com
     - 支払方法: クレジットカード

2. **申し込み完了確認**
   - 「お申込みありがとうございました」メッセージが表示されること
   - 「2営業日以内に担当者よりご連絡させていただきます」が表示されること
   - 申込IDが表示されること
   - 「トップページに戻る」ボタンが表示されること

3. **管理画面での確認**
   - http://localhost:3001 にアクセス
   - 顧客管理ページを開く
   - 新しく登録された「テスト病院」が表示されること
   - ステータスが「お試し」になっていること

### シナリオ2: LPへの戻り確認

1. 申し込み完了画面で「トップページに戻る」ボタンをクリック
2. メインLP（https://wonderful-flower-0f6517b00.6.azurestaticapps.net）に遷移すること

## 本番環境での動作確認

### デプロイ手順

1. **コミットとプッシュ**
```bash
git add .
git commit -m "feat: 申し込みフローから管理画面表示までの完全実装"
git push origin main
```

2. **GitHub Actions確認**
   - https://github.com/[your-username]/chatgpt-plus-lp/actions
   - 「Azure Static Web Apps CI/CD - Integrated」ワークフローが実行されること
   - ビルドとデプロイが成功すること

3. **本番環境での確認**
   - メインLP: https://wonderful-flower-0f6517b00.6.azurestaticapps.net
   - 管理画面: https://wonderful-flower-0f6517b00.6.azurestaticapps.net/admin/
   - 申し込みフォーム: https://wonderful-flower-0f6517b00.6.azurestaticapps.net/application/

### 本番環境テストチェックリスト

- [ ] LPから申し込みボタンで申し込みフォームに遷移
- [ ] 申し込みフォームでデータ入力
- [ ] 申し込み完了画面が表示される
- [ ] 申込IDが発行される
- [ ] 「トップページに戻る」でLPに戻る
- [ ] 管理画面で新規顧客が表示される
- [ ] Azure Table Storageにデータが保存される

## トラブルシューティング

### 申し込みがDBに保存されない場合
1. Azure Functions のログを確認
2. CORS設定を確認
3. Azure Table Storage の接続文字列を確認

### 管理画面に顧客が表示されない場合
1. ブラウザの開発者ツールでAPIレスポンスを確認
2. Azure Functions の `/api/customers` エンドポイントの動作確認
3. データのフィールドマッピングを確認

### 404エラーが発生する場合
1. staticwebapp.config.json のルーティング設定を確認
2. ビルド成果物が正しいディレクトリに配置されているか確認
3. Azure Static Web Apps のデプロイログを確認

## API エンドポイント一覧

- POST `/api/customer-application-submit` - 申し込みデータの送信
- GET `/api/customers` - 顧客一覧の取得
- GET `/api/dashboard` - ダッシュボードデータの取得
- GET `/api/company-settings` - 企業設定の取得
- POST `/api/company-settings` - 企業設定の更新

## 更新日
2025-06-08