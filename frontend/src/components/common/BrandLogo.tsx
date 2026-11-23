import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor,
}) => {
  const sizeMap = {
    sm: { box: 'w-8 h-8', icon: 'w-6 h-6', text: 'text-base' },
    md: { box: 'w-10 h-10 sm:w-11 sm:h-11', icon: 'w-8 h-8 sm:w-9 sm:h-9', text: 'text-xl sm:text-2xl' },
    lg: { box: 'w-13 h-13 sm:w-14 sm:h-14', icon: 'w-10 h-10 sm:w-11 sm:h-11', text: 'text-2xl sm:text-3xl' },
    xl: { box: 'w-16 h-16 sm:w-20 sm:h-20', icon: 'w-13 h-13 sm:w-16 sm:h-16', text: 'text-3xl sm:text-4xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 group select-none ${className}`}>
      {/* Premium Emblem Tile */}
      <div
        className={`${currentSize.box} rounded-2xl bg-gradient-to-br from-emerald-950 via-[#0a3523] to-[#042014] dark:from-[#0F172A] dark:via-[#111827] dark:to-[#1E293B] border border-emerald-500/40 dark:border-blue-500/40 shadow-[0_4px_14px_rgba(16,185,129,0.22)] dark:shadow-[0_4px_16px_rgba(59,130,246,0.2)] flex items-center justify-center p-1 transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-400 dark:group-hover:border-blue-400 group-hover:shadow-[0_6px_20px_rgba(16,185,129,0.32)]`}
      >
        <svg
          viewBox="40 10 135 160"
          className={`${currentSize.icon} w-full h-full drop-shadow-md`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="blGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="40%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="blLeafDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="50%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <linearGradient id="blLeafLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BBF7D0" />
              <stop offset="50%" stopColor="#86EFAC" />
              <stop offset="100%" stopColor="#4ADE80" />
            </linearGradient>
            <linearGradient id="blBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="50%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#166534" />
            </linearGradient>
          </defs>

          {/* Golden Sun / Hope Crescent Arc */}
          <path
            d="M 98 16 A 74 74 0 0 1 162 136 A 68 68 0 0 0 102 28"
            fill="url(#blGold)"
          />
          <circle cx="156" cy="34" r="9" fill="#FDE047" />
          <path
            d="M 156 34 C 166 26 178 30 178 42 C 170 50 156 46 156 34 Z"
            fill="#F59E0B"
          />

          {/* Outer Protective Leaf (Left Wing) */}
          <path
            d="M 98 166 C 82 132 52 88 56 42 C 72 68 90 98 98 166 Z"
            fill="url(#blLeafDark)"
          />
          <path
            d="M 56 42 C 68 80 80 126 96 166 C 76 146 62 96 56 42 Z"
            fill="url(#blLeafLight)"
            opacity="0.95"
          />

          {/* Human Figure with Raised Joyful Arms */}
          <circle cx="97" cy="58" r="10" fill="url(#blBody)" />

          <path
            d="M 97 74 C 88 80 78 80 70 66 C 78 72 88 78 92 84 C 88 100 90 122 98 166 C 104 126 102 100 98 84 C 104 80 114 70 126 50 C 118 72 106 78 97 74 Z"
            fill="url(#blBody)"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <span
          className={`font-black tracking-tight ${currentSize.text} ${
            textColor || 'text-[#0f392b] dark:text-white'
          }`}
        >
          AnnaSathi{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 dark:from-blue-400 dark:via-cyan-400 dark:to-teal-300 bg-clip-text text-transparent">
            AI
          </span>
        </span>
      )}
    </div>
  );
};
