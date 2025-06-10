const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xyztpwuoptomidmpasxy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5enRwd3VvcHRvbWlkbXBhc3h5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2Mzk1MjUsImV4cCI6MjA1OTIxNTUyNX0.tvRP0zLfgNz0mnlBjClI-4B8nsstAXbs7_NDhz3VEzg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('=== Supabase接続テスト開始 ===');
    
    // 1. 接続テスト
    const { data: tables, error: tablesError } = await supabase
      .from('customers')
      .select('count', { count: 'exact' });
    
    if (tablesError) {
      console.error('❌ 接続エラー:', tablesError.message);
      return;
    }
    
    console.log('✅ Supabase接続成功');
    
    // 2. 顧客テーブルの確認
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (customersError) {
      console.error('❌ 顧客データ取得エラー:', customersError.message);
    } else {
      console.log('✅ 顧客データ取得成功');
      console.log(`📊 顧客数: ${customers.length}件`);
      if (customers.length > 0) {
        console.log('📋 最新の顧客:', customers[0]);
      }
    }
    
    // 3. フォーム送信テーブルの確認
    const { data: submissions, error: submissionsError } = await supabase
      .from('form_submissions')
      .select('*')
      .limit(5);
    
    if (submissionsError) {
      console.error('❌ フォーム送信データ取得エラー:', submissionsError.message);
    } else {
      console.log('✅ フォーム送信データ取得成功');
      console.log(`📊 フォーム送信数: ${submissions.length}件`);
      if (submissions.length > 0) {
        console.log('📋 最新のフォーム送信:', submissions[0]);
      }
    }
    
    console.log('=== テスト完了 ===');
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

testConnection();