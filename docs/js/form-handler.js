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
          accounts: document.getElementById('accounts').value,
          message: document.getElementById('message').value
        };
        
        const response = await fetch('/api/submit-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          if (response.headers.get('Content-Type') === 'application/pdf') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'chatgpt-plus-quote.pdf';
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            alert('お問い合わせありがとうございます。見積PDFがダウンロードされました。');
          } else {
            const data = await response.json();
            alert(data.message || 'お問い合わせが完了しました。');
          }
          
          estimateForm.reset();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'エラーが発生しました。');
        }
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
