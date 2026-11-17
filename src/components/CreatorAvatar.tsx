import React from 'react';

interface CreatorAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CreatorAvatar: React.FC<CreatorAvatarProps> = ({ size = 'md', className = '' }) => {
  const uid = React.useId().replace(/:/g, '');
  const sizeClass =
    size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-24 h-24 sm:w-32 sm:h-32' : 'w-10 h-10';

  return (
    <div
      className={`${sizeClass} rounded-2xl ruiva-gradient p-[2px] shrink-0 overflow-hidden shadow-lg shadow-copper-600/20 ${className}`}
    >
      <div className="w-full h-full rounded-[14px] bg-obsidian-950 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" aria-label="Ruivinha VIP">
          <defs>
            <linearGradient id={`hair-${uid}`} x1="15" y1="15" x2="85" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
            <linearGradient id={`skin-${uid}`} x1="35" y1="32" x2="65" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffe4d6" />
              <stop offset="100%" stopColor="#f5c2ab" />
            </linearGradient>
            <linearGradient id={`crown-${uid}`} x1="35" y1="8" x2="65" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="#121216" />
          <path
            d="M20 52C12 36 22 16 50 16C78 16 88 36 80 52C87 66 84 87 72 95C60 87 40 87 28 95C16 87 13 66 20 52Z"
            fill={`url(#hair-${uid})`}
          />
          <path d="M37 18L41 9L50 15L59 9L63 18H37Z" fill={`url(#crown-${uid})`} />
          <circle cx="50" cy="7" r="2.2" fill="#fde047" />
          <path
            d="M43 68H57V79C66 81 72 86 75 96H25C28 86 34 81 43 79V68Z"
            fill={`url(#skin-${uid})`}
          />
          <path d="M30 86C38 91 62 91 70 86L75 100H25L30 86Z" fill="#e11d48" />
          <path
            d="M34 44C34 33 41 27 50 27C59 27 66 33 66 44C66 57 59 68 50 68C41 68 34 57 34 44Z"
            fill={`url(#skin-${uid})`}
          />
          <path d="M33 43C33 30 43 24 54 25C47 31 41 38 35 48C33 46 33 44 33 43Z" fill="#c2410c" />
          <path d="M51 25C62 25 68 33 67 46C63 39 58 32 51 25Z" fill="#ea580c" />
          <ellipse cx="43" cy="46" rx="2.5" ry="2" fill="#18181b" />
          <ellipse cx="57" cy="46" rx="2.5" ry="2" fill="#18181b" />
          <circle cx="43.8" cy="45.3" r="0.8" fill="#ffffff" />
          <circle cx="57.8" cy="45.3" r="0.8" fill="#ffffff" />
          <circle cx="39" cy="51" r="0.7" fill="#d97706" opacity="0.65" />
          <circle cx="41.5" cy="52" r="0.7" fill="#d97706" opacity="0.65" />
          <circle cx="61" cy="51" r="0.7" fill="#d97706" opacity="0.65" />
          <circle cx="58.5" cy="52" r="0.7" fill="#d97706" opacity="0.65" />
          <path d="M46 57C48 56 52 56 54 57C52 60 48 60 46 57Z" fill="#f43f5e" />
          <path d="M32 45C27 57 26 74 32 88C35 78 35 62 35 51Z" fill="#ea580c" />
          <path d="M68 45C73 57 74 74 68 88C65 78 65 62 65 51Z" fill="#ea580c" />
        </svg>
      </div>
    </div>
  );
};
