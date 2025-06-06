import React from 'react';
import {
  Paper,
  Typography,
  TextField,
  Grid,
  Box
} from '@mui/material';
import { Controller, Control } from 'react-hook-form';
import { ContactInfo } from '../../types/application';

interface ContactInfoStepProps {
  control: Control<ContactInfo, any>;
  errors: any;
}

const ContactInfoStep: React.FC<ContactInfoStepProps> = ({ control, errors }) => {
  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        担当者情報
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="contactPerson"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="担当者名"
                required
                error={!!errors.contactPerson}
                helperText={errors.contactPerson?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="部署名"
                placeholder="事務課、システム部など"
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
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
                error={!!errors.email}
                helperText={errors.email?.message || 'サービス開通やご請求に関するご連絡をお送りします'}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="電話番号"
                placeholder="03-1234-5678"
                required
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message}
              />
            )}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          * 必須項目
        </Typography>
      </Box>
    </Paper>
  );
};

export default ContactInfoStep;