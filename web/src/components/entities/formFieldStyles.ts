export const entityFieldSx = {
  '& .MuiInputLabel-root': { color: 'var(--muted)', fontFamily: "'DM Sans', Arial, sans-serif", fontSize: { xs: 15, sm: 17 }, fontWeight: 700 },
  '& .MuiInputLabel-root.Mui-focused': { color: '#005ce4' },
  '& .MuiInputLabel-root.Mui-error': { color: '#d92d20' },
  '& .MuiOutlinedInput-root': {
    minHeight: { xs: 50, sm: 56 },
    borderRadius: '10px',
    backgroundColor: 'var(--surface)',
    color: 'var(--ink)',
    fontFamily: "'DM Sans', Arial, sans-serif",
    fontSize: { xs: 16, sm: 18 },
    '& input::placeholder, & textarea::placeholder': { color: 'var(--muted)', opacity: 0.68 },
    '& fieldset': { borderColor: 'var(--line)' },
    '&:hover fieldset': { borderColor: '#4384e7' },
    '&.Mui-focused fieldset': { borderColor: '#005ce4', borderWidth: '1px', boxShadow: '0 0 0 3px #005ce41c' },
    '&.Mui-error fieldset': { borderColor: '#d92d20' },
    '&.Mui-disabled': { backgroundColor: 'color-mix(in srgb,var(--surface),var(--line) 30%)' },
  },
  '& .MuiSelect-select': { minHeight: '1.45em', display: 'flex', alignItems: 'center' },
  '& .MuiSvgIcon-root': { color: 'var(--muted)' },
  '& .MuiFormHelperText-root': { marginLeft: 0, marginRight: 0, fontFamily: "'DM Sans', Arial, sans-serif", fontSize: 14, lineHeight: 1.4 },
};

export const entityQuoteFieldSx = {
  ...entityFieldSx,
  '& .MuiInputLabel-root': { ...entityFieldSx['& .MuiInputLabel-root'], fontSize: { xs: 16, sm: 19 } },
  '& .MuiOutlinedInput-root': { ...entityFieldSx['& .MuiOutlinedInput-root'], minHeight: { xs: 54, sm: 60 }, fontSize: { xs: 18, sm: 20 } },
};

export const entityMenuProps = {
  disablePortal: true,
  slotProps: { paper: { sx: { maxHeight: 320, backgroundColor: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--line)' } } },
};
