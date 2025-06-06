データベースに保存された顧客情報を閲覧・管理（編集、メール送信連携など）できる簡易的な管理画面を開発します。

**実施事項**:
1. LPとは別のディレクトリ、またはサブプロジェクトとして、管理画面用のフロントエンドアプリケーションを作成する (React, Vue, Sveltekit など、LPの技術スタックに合わせるか別途検討)。
2. データベースからデータを取得・更新するための新しいAzure Functions (API) を開発する。認証・認可の仕組みも検討する。
3. 開発した管理画面フロントエンドと管理用APIを、Azure Static Web Apps の別の環境としてデプロイするか、パスベースのルーティングで統合する設定を行う。
4. 管理画面から顧客データの一覧表示、詳細確認、編集、Issue 4で実装したメール送信機能との連携などができることを確認する。

**完了の定義**: データベース上の顧客情報を操作できる簡易管理画面が利用可能になること。 