document.addEventListener('DOMContentLoaded', function() {
  const estimateForm = document.getElementById('estimate');
  
  if (estimateForm) {
    estimateForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitButton = estimateForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = '処理中...';
      
      try {
        const formData = {
          organization: document.getElementById('organization').value || '',
          name: document.getElementById('name').value || '',
          email: document.getElementById('email').value || '',
          purpose: document.getElementById('purpose').value || '',
          accounts: document.getElementById('accounts').value || '1-3',
          message: document.getElementById('message').value || ''
        };
        
        // バリデーション
        if (!formData.organization.trim()) {
          alert('医療機関名を入力してください。');
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }
        if (!formData.name.trim()) {
          alert('ご担当者名を入力してください。');
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }
        if (!formData.email.trim()) {
          alert('メールアドレスを入力してください。');
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }
        if (!formData.purpose.trim()) {
          alert('お問い合わせ目的を選択してください。');
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }
        
        // デバッグ用：送信前のデータをログ出力
        console.log('Sending form data:', formData);
        
        // Azure Functions APIを呼び出し
        const response = await fetch('/api/submit-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        // デバッグ情報をログ出力
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // DB接続状況をチェック
        const dbTest = response.headers.get('X-DB-Test');
        const saveResult = response.headers.get('X-Save-Result');
        const saveError = response.headers.get('X-Save-Error');
        
        if (dbTest) {
          console.log('DB Test Result:', JSON.parse(dbTest));
        }
        console.log('Save Result:', saveResult);
        console.log('Save Error:', saveError);
        
        if (response.ok) {
          // PDFレスポンスの場合
          if (response.headers.get('Content-Type') === 'application/pdf') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'chatgpt-plus-service-guide.pdf';
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            // DB保存状況に応じたメッセージ
            let dbStatusMessage = '';
            if (saveResult === 'SUCCESS') {
              dbStatusMessage = '\n✅ データベース保存: 成功';
            } else if (saveResult === 'FAILED') {
              dbStatusMessage = '\n⚠️ データベース保存: 失敗（' + (saveError || '不明なエラー') + '）';
            }
            
            // お問い合わせ目的に応じたメッセージ
            const purpose = formData.purpose;
            if (purpose === 'お申し込み') {
              alert('お申し込みありがとうございます。サービス資料がダウンロードされました。\n\n承りました。お打ち合わせの日程調整については、後日メールにてご連絡いたします。' + dbStatusMessage);
            } else if (purpose === '資料請求') {
              alert('資料請求ありがとうございます。サービス資料がダウンロードされました。\n\nご不明点がございましたら、お気軽にお問い合わせください。' + dbStatusMessage);
            } else {
              alert('お問い合わせありがとうございます。サービス資料がダウンロードされました。' + dbStatusMessage);
            }
          } else {
            // JSONレスポンスの場合
            const data = await response.json();
            console.log('JSON Response:', data);
            alert(data.message || 'お問い合わせが完了しました。');
          }
          
          estimateForm.reset();
        } else {
          const errorData = await response.json();
          console.log('Error Response:', errorData);
          throw new Error(errorData.message || 'エラーが発生しました。');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        
        // エラー時は静的PDFをダウンロード（フォールバック）
        console.log('Falling back to static PDF download');
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = '/chatgpt-plus-service-guide.pdf';
        a.download = 'chatgpt-plus-service-guide.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        alert(`データベース保存でエラーが発生しましたが、資料はダウンロードされました。\nエラー詳細: ${error.message}`);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }
});
