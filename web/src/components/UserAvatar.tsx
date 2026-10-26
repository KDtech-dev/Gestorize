import { Avatar as MuiAvatar } from '@mui/material';
import { Icon } from '@iconify/react';

type UserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  fallbackIcon?: string;
  size?: number;
  className?: string;
};

export function UserAvatar({ name, imageUrl, fallbackIcon, size = 46, className }: UserAvatarProps) {
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
        bgcolor: '#005CE4',
        color: '#fff',
        border: '2px solid #38bdf8',
        fontSize: size * 0.32,
        fontWeight: 800,
        '& .MuiAvatar-img': {
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        },
      }}
    >
      {fallbackIcon ? <Icon icon={fallbackIcon} width={size * 0.52} height={size * 0.52} /> : initials.toUpperCase()}
    </MuiAvatar>
  );
}
