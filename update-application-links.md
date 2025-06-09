# LP申し込みボタン更新箇所

## 更新が必要な箇所（index.html）

### 1. Plusプラン申し込みボタン（行641付近）
```html
<!-- 現在 -->
<a href="/application/" target="_blank" class="w-full btn-action-secondary py-4 text-lg font-bold">📝 お申し込み</a>

<!-- 更新後 -->
<a href="[NOTION_FORM_URL]" target="_blank" class="w-full btn-action-secondary py-4 text-lg font-bold">📝 お申し込み</a>
```

### 2. 人気プラン申し込みボタン（行700付近）  
```html
<!-- 現在 -->
<a href="/application/" target="_blank" class="w-full btn-action-primary py-4 text-lg font-bold pulse-action">🔥 人気プラン<br>で申し込み</a>

<!-- 更新後 -->
<a href="[NOTION_FORM_URL]" target="_blank" class="w-full btn-action-primary py-4 text-lg font-bold pulse-action">🔥 人気プラン<br>で申し込み</a>
```

### 3. 正式申し込みフォームボタン（行879付近）
```html
<!-- 現在 -->
<a href="/application/" target="_blank" class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg mt-2 block text-center">
  <span class="text-lg">📝</span><br>
  正式申し込みフォーム
</a>

<!-- 更新後 -->
<a href="[NOTION_FORM_URL]" target="_blank" class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg mt-2 block text-center">
  <span class="text-lg">📝</span><br>
  正式申し込みフォーム
</a>
```

## 実行手順
1. Notion フォーム URL を受け取り
2. 上記3箇所の `[NOTION_FORM_URL]` を実際のURLに置換
3. Git コミット・プッシュでデプロイ
4. 申し込みフォームページ（/application/）を非表示化（オプション）

## 準備完了
- ✅ 管理画面の新規顧客登録機能
- ✅ Notion 申し込み確認ボタン  
- ✅ 既存の請求書・領収書生成機能
- ⏳ Notion フォーム URL 待ち