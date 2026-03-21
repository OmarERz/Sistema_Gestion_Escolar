import { TextField, IconButton, InputAdornment, type TextFieldProps } from '@mui/material';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';

const btnSx = {
  width: 24,
  height: 24,
  minWidth: 24,
  minHeight: 24,
  p: 0,
  color: 'primary.main',
  borderRadius: 0.75,
  '&:hover': { bgcolor: 'rgba(41, 182, 246, 0.15)' },
  '&:active': { scale: '0.96' },
  transitionProperty: 'background-color, scale',
  transitionDuration: '150ms',
};

interface NumberFieldProps extends Omit<TextFieldProps, 'type'> {
  /** Step size for the stepper buttons (default: 1). Note: keyboard arrows also use this step. */
  step?: number;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Called with the new string value */
  onValueChange?: (value: string) => void;
}

/**
 * Number input with custom stepper buttons that match the app theme.
 * Hides native browser spinners (handled globally in theme).
 * Selects all text on focus for easy replacement.
 */
export default function NumberField({
  step = 1,
  min,
  max,
  value,
  onValueChange,
  onChange,
  ...rest
}: NumberFieldProps) {
  const numValue = parseFloat(String(value)) || 0;

  const clamp = (v: number) => {
    let result = v;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    // Round to avoid floating-point drift
    return Math.round(result * 100) / 100;
  };

  const handleStep = (direction: 1 | -1) => {
    const next = clamp(numValue + step * direction);
    onValueChange?.(String(next));
  };

  return (
    <TextField
      type="number"
      value={value}
      onChange={(e) => {
        onChange?.(e);
        onValueChange?.(e.target.value);
      }}
      onFocus={(e) => (e.target as HTMLInputElement).select()}
      inputProps={{ min, max, step: String(step) }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end" sx={{ ml: 0, gap: 0.25, display: 'flex' }}>
            <IconButton size="small" onClick={() => handleStep(-1)} sx={btnSx} tabIndex={-1}>
              <KeyboardArrowDown sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" onClick={() => handleStep(1)} sx={btnSx} tabIndex={-1}>
              <KeyboardArrowUp sx={{ fontSize: 16 }} />
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...rest}
    />
  );
}
