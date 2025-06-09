# Notion Form 設定後の変更箇所

## LP (index.html) の変更箇所

以下の箇所を Notion Form URL に変更してください：

### 1. Plusプランの申し込みボタン（行641）
```html
<!-- 変更前 -->
<a href="/application/" target="_blank" class="w-full btn-action-secondary py-4 text-lg font-bold">📝 お申し込み</a>

<!-- 変更後 -->
<a href="[NOTION_FORM_URL]" target="_blank" class="w-full btn-action-secondary py-4 text-lg font-bold">📝 お申し込み</a>
```

### 2. 人気プランの申し込みボタン（行700）
```html
<!-- 変更前 -->
<a href="/application/" target="_blank" class="w-full btn-action-primary py-4 text-lg font-bold pulse-action">🔥 人気プラン<br>で申し込み</a>

<!-- 変更後 -->
<a href="[NOTION_FORM_URL]" target="_blank" class="w-full btn-action-primary py-4 text-lg font-bold pulse-action">🔥 人気プラン<br>で申し込み</a>
```

### 3. 正式申し込みフォームボタン（行879-884）
```html
<!-- 変更前 -->
<a href="/application/" target="_blank" class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg mt-2 block text-center">
  <span class="text-lg">📝</span><br>
  正式申し込みフォーム
</a>

<!-- 変更後 -->
<a href="[NOTION_FORM_URL]" target="_blank" class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg mt-2 block text-center">
  <span class="text-lg">📝</span><br>
  正式申し込みフォーム
</a>
```

## 手順
1. Notion でフォームを作成
2. 共有URLを取得
3. 上記3箇所の `[NOTION_FORM_URL]` を実際のURLに置換
4. デプロイ