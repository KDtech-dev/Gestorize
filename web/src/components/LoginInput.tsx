'use client';

import { useState } from 'react';
import { Box, IconButton, InputBase, SvgIcon } from '@mui/material';
import { useTheme } from '@/context/ThemeContext';

type LoginInputProps = {
  id: string;
  type: 'email' | 'password';
  value: string;
  placeholder: string;
  autoComplete: string;
  onChange: (value: string) => void;
};

export function LoginInput({ id, type, value, placeholder, autoComplete, onChange }: LoginInputProps) {
  const { mode } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isDark = mode === 'dark';
  const iconColor = focused ? 'var(--primary)' : isDark ? '#fff' : '#1e1e1e';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: 64,
        px: 1.5,
        border: '2px solid',
        borderColor: focused ? 'var(--primary)' : 'transparent',
        borderRadius: '12px',
        backgroundColor: focused
          ? isDark ? '#ffffff29' : '#00000008'
          : isDark ? '#ffffff17' : '#0000000a',
        transition: 'background-color .16s, border-color .16s',
      }}
    >
      <SvgIcon sx={{ flexShrink: 0, color: iconColor, fontSize: 24 }} viewBox="0 0 24 24" aria-hidden="true">
        {type === 'email' ? (
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" />
        ) : (
          <path d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM9 6a3 3 0 0 1 6 0v2H9V6Zm9 14H6V10h12v10Zm-6-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        )}
      </SvgIcon>
      <InputBase
        id={id}
        type={type === 'password' && showPassword ? 'text' : type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required
        fullWidth
        sx={{
          mx: 1.25,
          color: isDark ? '#fff' : '#000',
          fontSize: 18,
          '& input': {
            p: 0,
            minWidth: 0,
            '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus': {
              WebkitBoxShadow: `0 0 0 100px ${isDark ? '#1d3c64' : '#f7f9fc'} inset`,
              WebkitTextFillColor: isDark ? '#fff' : '#000',
              caretColor: isDark ? '#fff' : '#000',
              transition: 'background-color 999999s ease-out',
            },
          },
          '& input::placeholder': { color: isDark ? '#ffffff80' : '#00000080', opacity: 1 },
        }}
      />
      {type === 'password' && (
        <IconButton
          type="button"
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setShowPassword((current) => !current)}
          onMouseDown={(event) => event.preventDefault()}
          edge="end"
          size="small"
          sx={{ flexShrink: 0, color: iconColor }}
        >
          <SvgIcon fontSize="small" aria-hidden="true">
            {showPassword
              ? <path d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              : <path d="M2.1 3.51 3.51 2.1 21.9 20.49l-1.41 1.41-3.25-3.25A11.6 11.6 0 0 1 12 19c-5 0-9.27-3.11-11-7 .79-1.78 2.13-3.37 3.83-4.6L2.1 3.51ZM12 5c5 0 9.27 3.11 11 7-.59 1.33-1.48 2.55-2.6 3.58l-3-3a5 5 0 0 0-6.98-6.98L8.95 4.13A12 12 0 0 1 12 5Zm-2.86 6.1 3.76 3.76a3 3 0 0 1-3.76-3.76Z" />}
          </SvgIcon>
        </IconButton>
      )}
    </Box>
  );
}
