// お見積もり計算機能とお試し請求書生成

// 料金設定
const PRICING = {
  monthlyRate: 6000, // 1アカウントあたりの月額料金
  yearlyRate: 66000, // 1アカウントあたりの年額料金
  setupFee: 20000,   // 初期設定費用
  additionalServices: {
    lecture: 30000,  // レクチャー費用（1回）
    support: 10000   // 優先サポート（月額）
  },
  discounts: {
    3: 0.05,  // 3ヶ月: 5%割引
    6: 0.10   // 6ヶ月: 10%割引
    // 12ヶ月は年額料金を直接使用するため割引設定不要
  }
};

// モーダル開閉機能
function openEstimateModal() {
  document.getElementById('estimateModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeEstimateModal() {
  document.getElementById('estimateModal').classList.add('hidden');
  document.body.style.overflow = 'auto';
  
  // フォームリセット
  document.getElementById('estimateForm').reset();
  document.getElementById('estimateResult').classList.add('hidden');
  document.getElementById('generateInvoiceBtn').disabled = true;
}

// 見積もり計算機能
function calculateEstimate() {
  const accountCount = parseInt(document.getElementById('accountCount').value) || 0;
  const contractPeriod = parseInt(document.getElementById('contractPeriod').value) || 0;
  const lectureService = document.getElementById('lectureService').checked;
  const prioritySupport = document.getElementById('prioritySupport').checked;

  if (accountCount === 0 || contractPeriod === 0) {
    document.getElementById('estimateResult').classList.add('hidden');
    document.getElementById('generateInvoiceBtn').disabled = true;
    return;
  }

  // 基本料金計算
  let basicCost;
  if (contractPeriod === 12) {
    // 12ヶ月契約は年額料金を使用
    basicCost = accountCount * PRICING.yearlyRate;
  } else {
    // 12ヶ月以外は月額料金×期間で計算
    basicCost = accountCount * PRICING.monthlyRate * contractPeriod;
    
    // 割引適用
    const discount = PRICING.discounts[contractPeriod] || 0;
    basicCost = Math.round(basicCost * (1 - discount));
  }

  // 初期設定費用
  const setupCost = PRICING.setupFee;

  // 追加サービス費用
  let additionalCost = 0;
  if (lectureService) {
    additionalCost += PRICING.additionalServices.lecture;
  }
  if (prioritySupport) {
    additionalCost += PRICING.additionalServices.support * contractPeriod;
  }

  // 合計金額（税込）
  const subtotal = basicCost + setupCost + additionalCost;
  const totalCost = Math.round(subtotal * 1.1); // 10%税込

  // 結果表示
  updateEstimateDisplay(accountCount, contractPeriod, basicCost, setupCost, additionalCost, totalCost);
  
  // 請求書発行ボタンを有効化
  document.getElementById('generateInvoiceBtn').disabled = false;
}

function updateEstimateDisplay(accountCount, contractPeriod, basicCost, setupCost, additionalCost, totalCost) {
  document.getElementById('resultAccountCount').textContent = accountCount;
  document.getElementById('resultPeriod').textContent = contractPeriod;
  document.getElementById('basicCost').textContent = '¥' + basicCost.toLocaleString();
  document.getElementById('setupCost').textContent = '¥' + setupCost.toLocaleString();
  
  if (additionalCost > 0) {
    document.getElementById('additionalCostSection').classList.remove('hidden');
    document.getElementById('additionalCost').textContent = '¥' + additionalCost.toLocaleString();
  } else {
    document.getElementById('additionalCostSection').classList.add('hidden');
  }
  
  document.getElementById('totalCost').textContent = '¥' + totalCost.toLocaleString();
  document.getElementById('estimateResult').classList.remove('hidden');
}

// お試し請求書生成機能
function generateInvoice() {
  const formData = {
    facilityName: document.getElementById('facilityName').value,
    contactPerson: document.getElementById('contactPerson').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    facilityType: document.getElementById('facilityType').value,
    accountCount: parseInt(document.getElementById('accountCount').value),
    contractPeriod: parseInt(document.getElementById('contractPeriod').value),
    lectureService: document.getElementById('lectureService').checked,
    prioritySupport: document.getElementById('prioritySupport').checked
  };

  // バリデーション
  if (!formData.facilityName || !formData.contactPerson || !formData.email) {
    alert('必須項目を入力してください。');
    return;
  }

  // 請求書HTMLを生成
  const invoiceHTML = generateInvoiceHTML(formData);
  
  // 新しいウィンドウで請求書を表示
  const invoiceWindow = window.open('', '_blank');
  invoiceWindow.document.write(invoiceHTML);
  invoiceWindow.document.close();
  
  // 印刷ダイアログを表示
  setTimeout(() => {
    invoiceWindow.print();
  }, 500);
}

function generateInvoiceHTML(data) {
  const today = new Date();
  const invoiceNumber = 'TRIAL-' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0') + String(today.getDate()).padStart(2, '0') + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  // 料金計算（再計算）
  let basicCost;
  let discount = 0;
  if (data.contractPeriod === 12) {
    // 12ヶ月契約は年額料金を使用
    basicCost = data.accountCount * PRICING.yearlyRate;
  } else {
    // 12ヶ月以外は月額料金×期間で計算
    basicCost = data.accountCount * PRICING.monthlyRate * data.contractPeriod;
    
    // 割引適用
    discount = PRICING.discounts[data.contractPeriod] || 0;
    basicCost = Math.round(basicCost * (1 - discount));
  }
  
  const setupCost = PRICING.setupFee;
  let additionalCost = 0;
  if (data.lectureService) additionalCost += PRICING.additionalServices.lecture;
  if (data.prioritySupport) additionalCost += PRICING.additionalServices.support * data.contractPeriod;
  
  const subtotal = basicCost + setupCost + additionalCost;
  const tax = Math.round(subtotal * 0.1);
  const totalCost = subtotal + tax;

  const facilityTypeMap = {
    clinic: 'クリニック・診療所',
    hospital: '病院',
    dental: '歯科医院',
    pharmacy: '調剤薬局',
    other: 'その他'
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>お試し請求書 - ${data.facilityName}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; }
    .header { border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
    .title { color: #059669; font-size: 32px; font-weight: bold; margin: 0; }
    .subtitle { color: #6b7280; font-size: 16px; margin: 5px 0 0 0; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .company-info { flex: 1; }
    .client-info { flex: 1; text-align: right; }
    .invoice-details { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .table th { background: #f3f4f6; font-weight: 600; }
    .table .amount { text-align: right; }
    .total-section { border-top: 2px solid #059669; padding-top: 15px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .total-final { font-size: 18px; font-weight: bold; color: #059669; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    .trial-notice { background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .trial-notice h3 { color: #92400e; margin: 0 0 10px 0; }
    @media print { body { margin: 0; } .invoice { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="trial-notice">
      <h3>⚠️ お試し請求書</h3>
      <p>これは概算見積もりに基づくお試し請求書です。実際の契約には別途正式なお見積もりが必要となります。</p>
    </div>

    <div class="header">
      <h1 class="title">お試し請求書</h1>
      <p class="subtitle">ChatGPT Plus 医療機関向けサービス</p>
    </div>

    <div class="invoice-info">
      <div class="company-info">
        <h3>請求者</h3>
        <p><strong>Wonder Drill株式会社</strong><br>
        〒123-4567 東京都渋谷区〇〇1-2-3<br>
        TEL: 03-1234-5678<br>
        Email: info@wonderdrill.com</p>
      </div>
      <div class="client-info">
        <h3>請求先</h3>
        <p><strong>${data.facilityName}</strong><br>
        ${facilityTypeMap[data.facilityType] || data.facilityType}<br>
        ご担当者: ${data.contactPerson} 様<br>
        Email: ${data.email}${data.phone ? '<br>TEL: ' + data.phone : ''}</p>
      </div>
    </div>

    <div class="invoice-details">
      <div style="display: flex; justify-content: space-between;">
        <div>
          <strong>請求書番号:</strong> ${invoiceNumber}<br>
          <strong>発行日:</strong> ${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日
        </div>
        <div style="text-align: right;">
          <strong>契約期間:</strong> ${data.contractPeriod}ヶ月<br>
          <strong>アカウント数:</strong> ${data.accountCount}アカウント
        </div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>項目</th>
          <th>数量</th>
          <th>単価</th>
          <th class="amount">金額</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>ChatGPT Plus利用料金${data.contractPeriod === 12 ? ' (年額プラン)' : (discount > 0 ? ' (' + Math.round(discount * 100) + '%割引適用)' : '')}</td>
          <td>${data.accountCount}アカウント × ${data.contractPeriod === 12 ? '1年' : data.contractPeriod + 'ヶ月'}</td>
          <td>${data.contractPeriod === 12 ? '¥' + PRICING.yearlyRate.toLocaleString() + '/年' : '¥' + PRICING.monthlyRate.toLocaleString() + '/月'}</td>
          <td class="amount">¥${basicCost.toLocaleString()}</td>
        </tr>
        <tr>
          <td>初期設定費用</td>
          <td>1式</td>
          <td>¥${PRICING.setupFee.toLocaleString()}</td>
          <td class="amount">¥${setupCost.toLocaleString()}</td>
        </tr>
        ${data.lectureService ? `
        <tr>
          <td>医療現場活用講義</td>
          <td>1回</td>
          <td>¥${PRICING.additionalServices.lecture.toLocaleString()}</td>
          <td class="amount">¥${PRICING.additionalServices.lecture.toLocaleString()}</td>
        </tr>
        ` : ''}
        ${data.prioritySupport ? `
        <tr>
          <td>優先サポート</td>
          <td>${data.contractPeriod}ヶ月</td>
          <td>¥${PRICING.additionalServices.support.toLocaleString()}/月</td>
          <td class="amount">¥${(PRICING.additionalServices.support * data.contractPeriod).toLocaleString()}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row">
        <span>小計:</span>
        <span>¥${subtotal.toLocaleString()}</span>
      </div>
      <div class="total-row">
        <span>消費税 (10%):</span>
        <span>¥${tax.toLocaleString()}</span>
      </div>
      <div class="total-row total-final">
        <span>合計金額:</span>
        <span>¥${totalCost.toLocaleString()}</span>
      </div>
    </div>

    <div class="footer">
      <p><strong>お支払い条件:</strong> 請求書発行から30日以内</p>
      <p><strong>お支払い方法:</strong> 銀行振込（振込手数料はお客様負担）</p>
      <p><strong>備考:</strong> この請求書は概算見積もりです。正式契約時には詳細な条件をご確認いただきます。</p>
    </div>
  </div>
</body>
</html>
  `;
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
  // ESCキーでモーダルを閉じる
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeEstimateModal();
    }
  });

  // モーダル外クリックで閉じる
  document.getElementById('estimateModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeEstimateModal();
    }
  });
});