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
        // フォーム要素の存在確認
        const purposeElement = document.getElementById('contact-purpose');
        console.log('=== PURPOSE ELEMENT DEBUG ===');
        console.log('Purpose element:', purposeElement);
        console.log('Purpose element exists:', !!purposeElement);
        console.log('Purpose element value:', purposeElement ? purposeElement.value : 'ELEMENT NOT FOUND');
        console.log('Purpose element selectedIndex:', purposeElement ? purposeElement.selectedIndex : 'N/A');
        console.log('Purpose element tagName:', purposeElement ? purposeElement.tagName : 'N/A');
        
        if (purposeElement && purposeElement.options) {
          console.log('Purpose element options count:', purposeElement.options.length);
          console.log('Purpose element options:', Array.from(purposeElement.options).map(opt => ({value: opt.value, text: opt.text, selected: opt.selected})));
          console.log('Selected option:', purposeElement.options[purposeElement.selectedIndex]);
        } else {
          console.log('Purpose element options: N/A (element or options not found)');
        }
        console.log('=== END DEBUG ===');

        // フォームデータを安全に取得
        const organizationEl = document.getElementById('organization');
        const nameEl = document.getElementById('name');
        const emailEl = document.getElementById('email');
        const accountsEl = document.getElementById('accounts');
        const messageEl = document.getElementById('message');
        
        const formData = {
          organization: organizationEl ? organizationEl.value || '' : '',
          name: nameEl ? nameEl.value || '' : '',
          email: emailEl ? emailEl.value || '' : '',
          purpose: purposeElement ? purposeElement.value || '' : '',
          accounts: accountsEl ? accountsEl.value || '1-3' : '1-3',
          message: messageEl ? messageEl.value || '' : ''
        };
        
        console.log('=== FORM DATA DEBUG ===');
        console.log('All form elements found:', {
          organization: !!organizationEl,
          name: !!nameEl,
          email: !!emailEl,
          purpose: !!purposeElement,
          accounts: !!accountsEl,
          message: !!messageEl
        });
        console.log('Form data values:', formData);
        console.log('=== END FORM DATA DEBUG ===');
        
        // バリデーション（安全なチェック）
        if (!formData.organization || !formData.organization.trim()) {
          alert('医療機関名を入力してください。');
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }
        if (!formData.name || !formData.name.trim()) {
          alert('ご担当者名を入力してください。');
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }
        if (!formData.email || !formData.email.trim()) {
          alert('メールアドレスを入力してください。');
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }
        
        console.log('Purpose validation check:', {
          value: formData.purpose,
          isEmpty: !formData.purpose,
          isTrimEmpty: formData.purpose ? formData.purpose.trim() === '' : true,
          isPlaceholder: formData.purpose === '選択してください'
        });
        
        if (!formData.purpose || (formData.purpose && formData.purpose.trim() === '') || formData.purpose === '選択してください') {
          alert('お問い合わせ目的を選択してください。現在の値: "' + (formData.purpose || 'undefined') + '"');
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
        }
        
        // デバッグ用：送信前のデータをログ出力
        console.log('Sending form data:', formData);
        console.log('Purpose value:', `"${formData.purpose}"`, 'Length:', formData.purpose.length);
        
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
          const contentType = response.headers.get('Content-Type');
          console.log('Response Content-Type:', contentType);
          
          // PDFレスポンスの場合（Content-Typeチェックを緩和）
          if (contentType && (contentType.includes('application/pdf') || contentType.includes('application/octet-stream'))) {
            console.log('Processing as PDF response');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'ChatGPT_DL.pdf';
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
            // レスポンスがPDFでない場合は、まずテキストとして取得
            console.log('Processing as non-PDF response');
            const responseText = await response.text();
            console.log('Response text preview:', responseText.substring(0, 100));
            
            // JSONレスポンスの処理を試みる
            try {
              const jsonResponse = JSON.parse(responseText);
              if (jsonResponse.pdfUrl) {
                console.log('Received PDF URL:', jsonResponse.pdfUrl);
                // 静的PDFを新しいタブで開く
                window.open(jsonResponse.pdfUrl, '_blank');
                
                // ダウンロードリンクコンテナを表示
                const downloadContainer = document.getElementById('downloadLinkContainer');
                if (downloadContainer) {
                  downloadContainer.classList.remove('hidden');
                }
                
                // フォームをリセット
                estimateForm.reset();
                
                // 成功メッセージを表示
                let message = 'お問い合わせありがとうございます。';
                if (saveResult === 'SUCCESS') {
                  message += '\n✅ お問い合わせ内容を保存しました。';
                } else {
                  message += '\n⚠️ データ保存に失敗しましたが、資料はダウンロード可能です。';
                }
                message += '\n\n資料のダウンロードリンクを表示しました。';
                
                alert(message);
                return;
              }
            } catch (jsonError) {
              console.log('Not a JSON response, trying other formats...');
            }
            
            // PDFの場合（JVBERで始まる）
            if (responseText.startsWith('JVBERi0x') || responseText.startsWith('%PDF')) {
              console.log('Detected PDF in text response, converting to blob');
              // Base64デコードしてPDFとして処理
              const binaryString = atob(responseText.startsWith('JVBERi0x') ? responseText : responseText.substring(responseText.indexOf('JVBERi0x')));
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'application/pdf' });
              const url = window.URL.createObjectURL(blob);
              
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = 'ChatGPT_DL.pdf';
              document.body.appendChild(a);
              a.click();
              
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              
              alert('資料請求ありがとうございます。サービス資料がダウンロードされました。');
            } else {
              // JSONとして処理
              try {
                const data = JSON.parse(responseText);
                console.log('JSON Response:', data);
                alert(data.message || 'お問い合わせが完了しました。');
              } catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                console.log('Raw response:', responseText);
                alert('レスポンスの処理でエラーが発生しました。');
              }
            }
          }
          
          estimateForm.reset();
        } else {
          // エラーレスポンスの処理も安全に
          try {
            const errorData = await response.json();
            console.log('Error Response:', errorData);
            throw new Error(errorData.message || 'エラーが発生しました。');
          } catch (parseError) {
            console.error('Error response parse failed:', parseError);
            throw new Error('サーバーエラーが発生しました。');
          }
        }
      } catch (error) {
        console.error('Form submission error:', error);
        
        // エラー時は静的PDFをダウンロード（フォールバック）
        console.log('Falling back to static PDF download');
        
        // ダウンロードリンクコンテナを表示
        const downloadContainer = document.getElementById('downloadLinkContainer');
        if (downloadContainer) {
          downloadContainer.classList.remove('hidden');
        }
        
        // 新しいタブで開く
        window.open('/PDF_DL.pdf', '_blank');
        
        alert(`データベース保存でエラーが発生しましたが、資料のダウンロードリンクを表示しました。\nエラー詳細: ${error.message}`);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }
});
