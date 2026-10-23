'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', onConfirm, onCancel }: ConfirmationDialogProps) {
  return <Dialog open={open} onClose={onCancel} disablePortal aria-labelledby="confirmation-dialog-title" aria-describedby="confirmation-dialog-description" maxWidth="xs" fullWidth slotProps={{ paper: { sx: { border: '1px solid var(--line)', borderRadius: '16px', bgcolor: 'var(--card)', color: 'var(--ink)', boxShadow: 'var(--shadow)' } } }}>
    <DialogTitle id="confirmation-dialog-title" sx={{ pb: 1, font: '800 22px Manrope,sans-serif', color: 'var(--ink)' }}>{title}</DialogTitle>
    <DialogContent sx={{ pt: '8px !important' }}><Typography id="confirmation-dialog-description" sx={{ color: 'var(--muted)', fontSize: 16, lineHeight: 1.55 }}>{message}</Typography></DialogContent>
    <DialogActions sx={{ gap: 1, px: 3, pb: 2.5, pt: 2 }}>
      <Button onClick={onCancel} variant="outlined" sx={{ minHeight: 44, borderColor: 'var(--line)', borderRadius: '9px', color: 'var(--ink)', fontSize: 15, fontWeight: 700, textTransform: 'none' }}>{cancelLabel}</Button>
      <Button onClick={onConfirm} variant="contained" sx={{ minHeight: 44, borderRadius: '9px', bgcolor: '#c62828', fontSize: 15, fontWeight: 750, textTransform: 'none', '&:hover': { bgcolor: '#a61f1f' } }}>{confirmLabel}</Button>
    </DialogActions>
  </Dialog>;
}
