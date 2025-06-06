import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  Alert,
  Autocomplete
} from '@mui/material';
import { Controller, Control } from 'react-hook-form';
import { BasicInformation } from '../../types/optimizedApplication';

interface Step2BasicInformationProps {
  control: Control<BasicInformation, any>;
  errors: any;
}

// 都道府県リスト
const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const Step2BasicInformation: React.FC<Step2BasicInformationProps> = ({ control, errors }) => {
  const [addressFromZip, setAddressFromZip] = useState<string>('');

  // 郵便番号から住所を取得（実装例）
  const fetchAddressFromPostalCode = async (postalCode: string) => {
    if (postalCode.length === 7) {
      try {
        const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
        const data = await response.json();
        if (data.results && data.results[0]) {
          const result = data.results[0];
          const fullAddress = `${result.address1}${result.address2}${result.address3}`;
          setAddressFromZip(fullAddress);
          return { prefecture: result.address1, city: result.address2 + result.address3 };
        }
      } catch (error) {
        console.error('住所取得エラー:', error);
      }
    }
    return null;
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 4 }}>
        基本情報の入力
      </Typography>
      
      {/* 医療機関情報セクション */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          🏥 医療機関情報
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Controller
              name="organizationName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="医療機関名"
                  required
                  placeholder="例：山田総合病院"
                  error={!!errors.organizationName}
                  helperText={errors.organizationName?.message}
                />
              )}
            />
          </Box>
          
          <Box>
            <FormControl fullWidth error={!!errors.facilityType}>
              <InputLabel>施設種別 *</InputLabel>
              <Controller
                name="facilityType"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="施設種別 *">
                    <MenuItem value="hospital">病院</MenuItem>
                    <MenuItem value="clinic">診療所・クリニック</MenuItem>
                    <MenuItem value="dental_clinic">歯科診療所</MenuItem>
                    <MenuItem value="pharmacy">調剤薬局</MenuItem>
                    <MenuItem value="nursing_home">介護施設</MenuItem>
                    <MenuItem value="other">その他</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Box>
          
          <Box>
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="代表電話番号"
                  required
                  placeholder="03-1234-5678"
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber?.message}
                />
              )}
            />
          </Box>
          
          <Box>
            <Controller
              name="postalCode"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="郵便番号"
                  placeholder="1234567"
                  required
                  error={!!errors.postalCode}
                  helperText={errors.postalCode?.message}
                  onChange={(e) => {
                    field.onChange(e);
                    if (e.target.value.length === 7) {
                      fetchAddressFromPostalCode(e.target.value);
                    }
                  }}
                />
              )}
            />
          </Box>
          
          <Box>
            <Controller
              name="prefecture"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={PREFECTURES}
                  value={field.value || ''}
                  onChange={(_, value) => field.onChange(value || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="都道府県"
                      required
                      error={!!errors.prefecture}
                      helperText={errors.prefecture?.message}
                    />
                  )}
                />
              )}
            />
          </Box>
          
          <Box>
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="市区町村"
                  required
                  placeholder="新宿区"
                  error={!!errors.city}
                  helperText={errors.city?.message}
                />
              )}
            />
          </Box>
          
          <Box>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="番地・建物名"
                  required
                  placeholder="西新宿1-1-1 新宿ビル5F"
                  error={!!errors.address}
                  helperText={addressFromZip ? `住所候補: ${addressFromZip}` : errors.address?.message}
                />
              )}
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* 担当者情報セクション */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          👤 ご担当者情報
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Controller
              name="contactPerson"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="担当者名"
                  required
                  placeholder="山田太郎"
                  error={!!errors.contactPerson}
                  helperText={errors.contactPerson?.message}
                />
              )}
            />
          </Box>
          
          <Box>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="部署名"
                  placeholder="事務課・システム部など"
                />
              )}
            />
          </Box>
          
          <Box>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  required
                  placeholder="yamada@hospital.com"
                  error={!!errors.email}
                  helperText={errors.email?.message || 'サービス開通やご請求に関するご連絡をお送りします'}
                />
              )}
            />
          </Box>
          
          <Box>
            <Controller
              name="contactPhone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="担当者直通電話番号"
                  placeholder="080-1234-5678（任意）"
                  helperText="緊急時やサポート時の連絡用（任意）"
                />
              )}
            />
          </Box>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>🔒 個人情報の取り扱いについて</strong><br />
          入力いただいた情報は、サービス提供・サポート・請求業務のみに使用し、
          適切に管理いたします。第三者への提供は行いません。
        </Typography>
      </Alert>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          ⏱️ 予想残り時間: あと2分 | 📋 進捗: 2/5
        </Typography>
      </Box>
    </Paper>
  );
};

export default Step2BasicInformation;