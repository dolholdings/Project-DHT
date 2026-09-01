import React from 'react';

export interface UserAvatarProps {
  name?: string;
  email?: string;
  role?: string;
  avatarUrl?: string; // fallback or legacy
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  theme?: 'dark' | 'light';
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  ring?: boolean | string;
  showTooltip?: boolean;
}

// Deterministic color palette for initial badges
const COLOR_PALETTES = [
  { bg: 'bg-[#0773BB]', text: 'text-white', ring: 'ring-[#0773BB]/60' },
  { bg: 'bg-[#0D9488]', text: 'text-white', ring: 'ring-[#0D9488]/60' },
  { bg: 'bg-emerald-600', text: 'text-white', ring: 'ring-emerald-500/60' },
  { bg: 'bg-indigo-600', text: 'text-white', ring: 'ring-indigo-500/60' },
  { bg: 'bg-purple-600', text: 'text-white', ring: 'ring-purple-500/60' },
  { bg: 'bg-amber-600', text: 'text-white', ring: 'ring-amber-500/60' },
  { bg: 'bg-rose-600', text: 'text-white', ring: 'ring-rose-500/60' },
  { bg: 'bg-cyan-600', text: 'text-white', ring: 'ring-cyan-500/60' },
  { bg: 'bg-blue-600', text: 'text-white', ring: 'ring-blue-500/60' },
  { bg: 'bg-teal-600', text: 'text-white', ring: 'ring-teal-500/60' },
];

export const getFirstInitial = (name?: string, email?: string): string => {
  if (name && name.trim()) {
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().charAt(0).toUpperCase();
  }
  return 'U';
};

const getPaletteForName = (str?: string) => {
  if (!str) return COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index];
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  email,
  role,
  size = 'md',
  className = '',
  theme = 'dark',
  onClick,
  title,
  ring = true
}) => {
  const initial = getFirstInitial(name, email);
  const palette = getPaletteForName(name || email || 'User');

  // Size styling map
  let sizeClass = 'w-8 h-8 text-xs';
  let customStyle: React.CSSProperties | undefined = undefined;

  if (typeof size === 'number') {
    customStyle = {
      width: `${size}px`,
      height: `${size}px`,
      fontSize: `${Math.max(10, Math.floor(size * 0.42))}px`
    };
    sizeClass = '';
  } else {
    switch (size) {
      case 'xs':
        sizeClass = 'w-5 h-5 text-[10px] font-bold';
        break;
      case 'sm':
        sizeClass = 'w-6 h-6 text-[11px] font-bold';
        break;
      case 'md':
        sizeClass = 'w-8 h-8 text-xs font-bold';
        break;
      case 'lg':
        sizeClass = 'w-10 h-10 text-sm font-bold';
        break;
      case 'xl':
        sizeClass = 'w-12 h-12 text-base font-black';
        break;
    }
  }

  const ringClass = typeof ring === 'string'
    ? ring
    : ring
    ? theme === 'light'
      ? 'ring-2 ring-white shadow-xs'
      : `ring-2 ${palette.ring} shadow-xs`
    : '';

  const tooltipTitle = title || (name ? `${name}${role ? ` (${role})` : ''}` : email || 'User');

  return (
    <div
      onClick={onClick}
      style={customStyle}
      className={`inline-flex items-center justify-center rounded-full select-none shrink-0 font-sans uppercase tracking-wider transition-transform ${palette.bg} ${palette.text} ${sizeClass} ${ringClass} ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''
      } ${className}`}
      title={tooltipTitle}
      aria-label={tooltipTitle}
    >
      <span className="leading-none">{initial}</span>
    </div>
  );
};
