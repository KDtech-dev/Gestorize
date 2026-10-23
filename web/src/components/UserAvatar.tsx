import { Avatar as MuiAvatar } from '@mui/material';

type UserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
};

export function UserAvatar({ name, imageUrl, size = 46, className }: UserAvatarProps) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.length > 1
    ? `${words[0][0]}${words[words.length - 1][0]}`
    : (words[0] ?? 'U').slice(0, 2);

  return (
    <MuiAvatar
      className={className}
      src={imageUrl || undefined}
      alt={name || 'Usuário'}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        bgcolor: 'var(--primary)',
        color: 'var(--bg)',
        fontSize: size * 0.32,
        fontWeight: 800,
      }}
    >
      {initials.toUpperCase()}
    </MuiAvatar>
  );
}
