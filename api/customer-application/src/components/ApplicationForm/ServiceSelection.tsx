import React from 'react';
import {
  Paper,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Box,
  Slider,
  Alert
} from '@mui/material';
import { Controller, Control } from 'react-hook-form';
import { ServiceSelection } from '../../types/application';

interface ServiceSelectionStepProps {
  control: Control<ServiceSelection>;
  errors: any;
  watchAccountCount: number;
}

const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({ 
  control, 
  errors, 
  watchAccountCount 
}) => {
  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        サービス選択
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 2 }}>
              必要なアカウント数 *
            </FormLabel>
            <Controller
              name="requestedAccountCount"
              control={control}
              render={({ field }) => (
                <Box sx={{ px: 2 }}>
                  <Slider
                    {...field}
                    value={field.value}
                    onChange={(_, value) => field.onChange(value)}
                    min={1}
                    max={100}
                    step={1}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 25, label: '25' },
                      { value: 50, label: '50' },
                      { value: 75, label: '75' },
                      { value: 100, label: '100' }
                    ]}
                    valueLabelDisplay="on"
                    sx={{ mt: 2, mb: 3 }}
                  />
                  <Typography variant="h6" align="center" color="primary">
                    {watchAccountCount} アカウント
                  </Typography>
                </Box>
              )}
            />
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl component="fieldset" error={!!errors.billingCycle}>
            <FormLabel component="legend">お支払いサイクル *</FormLabel>
            <Controller
              name="billingCycle"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} sx={{ mt: 1 }}>
                  <FormControlLabel 
                    value="monthly" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">月額プラン</Typography>
                        <Typography variant="body2" color="text.secondary">
                          ¥3,000 × {watchAccountCount}アカウント = ¥{(3000 * watchAccountCount).toLocaleString()}/月
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel 
                    value="yearly" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">年額プラン（2ヶ月分お得！）</Typography>
                        <Typography variant="body2" color="text.secondary">
                          ¥{(3000 * watchAccountCount * 10).toLocaleString()}/年 
                          （月額換算: ¥{(3000 * watchAccountCount * 10 / 12).toLocaleString()}/月）
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              )}
            />
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="利用開始希望日"
                type="date"
                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!errors.startDate}
                helperText={errors.startDate?.message || '最短で申込から3営業日後からご利用可能です'}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>ChatGPT Plus 医療機関向けプラン</strong><br />
              • 高速なGPT-4アクセス<br />
              • 医療分野に特化したプロンプト集<br />
              • 専用サポートチャネル<br />
              • データプライバシー保護
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ServiceSelectionStep;