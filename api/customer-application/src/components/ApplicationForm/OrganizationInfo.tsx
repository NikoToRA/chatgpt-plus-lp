import React from 'react';
import {
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box
} from '@mui/material';
import { Controller, Control } from 'react-hook-form';
import { OrganizationInfo } from '../../types/application';

interface OrganizationInfoStepProps {
  control: Control<OrganizationInfo, any>;
  errors: any;
}

const OrganizationInfoStep: React.FC<OrganizationInfoStepProps> = ({ control, errors }) => {
  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        医療機関情報
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Controller
            name="organizationName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="医療機関名"
                required
                error={!!errors.organizationName}
                helperText={errors.organizationName?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
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
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Controller
            name="representativeName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="代表者名"
                required
                error={!!errors.representativeName}
                helperText={errors.representativeName?.message}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
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
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12} sm={8}>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="住所"
                required
                error={!!errors.address}
                helperText={errors.address?.message}
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

export default OrganizationInfoStep;