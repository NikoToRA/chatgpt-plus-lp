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
          organization: document.getElementById('organization').value,
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          purpose: document.getElementById('purpose').value,
          accounts: document.getElementById('accounts').value,
          message: document.getElementById('message').value
        };
        
        // デバッグ用：送信前のデータをログ出力
        console.log('Sending form data:', formData);
        console.log('Organization:', formData.organization);
        console.log('Name:', formData.name);
        console.log('Email:', formData.email);
        console.log('Purpose:', formData.purpose);
        
        // 準備済み資料を直接ダウンロード
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = '/chatgpt-plus-service-guide.pdf';
        a.download = 'chatgpt-plus-service-guide.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // お問い合わせ目的に応じたメッセージ
        const purpose = formData.purpose;
        if (purpose === 'お申し込み') {
          alert('お申し込みありがとうございます。サービス資料がダウンロードされました。\n\n承りました。お打ち合わせの日程調整については、後日メールにてご連絡いたします。');
        } else if (purpose === '資料請求') {
          alert('資料請求ありがとうございます。サービス資料がダウンロードされました。\n\nご不明点がございましたら、お気軽にお問い合わせください。');
        } else {
          alert('お問い合わせありがとうございます。サービス資料がダウンロードされました。');
        }
        
        estimateForm.reset();
      } catch (error) {
        console.error('Form submission error:', error);
        alert(`エラーが発生しました: ${error.message}`);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }
});
