お問い合わせがあった際に、自動返信メールを送信したり、管理者へ通知メールを送ったりする機能を実装します。

**実施事項**:
1. Azure Communication Services または SendGrid などのメール送信サービスを準備する。
2. Azure Functionsのコードを改修し、フォームデータ保存後、設定したメール送信サービスを利用してメールを送信する処理を追加する。
3. メール送信サービスに関するAPIキーや接続情報をAzure Static Web Appsのアプリケーション設定に追加する。
4. 改修したコードをデプロイし、フォーム送信テストを行い、メールが正しく送受信されることを確認する。

**完了の定義**: お問い合わせフォーム送信をトリガーとしたメール通知が正常に機能すること。 