import React, { useId } from 'react';

interface DtdcLogoProps {
  className?: string;
  customLogoUrl?: string | null;
}

export const DtdcLogo: React.FC<DtdcLogoProps> = ({ className = 'h-8', customLogoUrl }) => {
  const rawId = useId();
  const maskId = `dtdc-slice-${rawId.replace(/:/g, '')}`;

  if (customLogoUrl) {
    return (
      <img
        src={customLogoUrl}
        alt="DTDC Logo"
        className={`${className} object-contain`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 570 110"
        className="h-full w-auto max-h-12 object-contain"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="570" height="110" fill="#ffffff" />
            {/* Clean horizontal slice through the entire logo */}
            <rect x="0" y="44" width="570" height="15" fill="#000000" />
          </mask>
        </defs>

        {/* Global forward slant matching authentic DTDC logo */}
        <g transform="skewX(-14)" style={{ transformOrigin: '285px 55px' }}>
          {/* Sliced DTDC Letterforms in official navy blue */}
          <g fill="#0b2447" mask={`url(#${maskId})`}>
            {/* 1st 'D' */}
            <path d="M 24 8 L 86 8 C 120 8 136 25 136 55 C 136 85 120 102 86 102 L 24 102 Z M 54 29 L 54 81 L 82 81 C 101 81 108 72 108 55 C 108 38 101 29 82 29 Z" />

            {/* 'T' */}
            <path d="M 146 8 L 242 8 L 242 31 L 208 31 L 208 102 L 180 102 L 180 31 L 146 31 Z" />

            {/* 2nd 'D' */}
            <path d="M 252 8 L 314 8 C 348 8 364 25 364 55 C 364 85 348 102 314 102 L 252 102 Z M 282 29 L 282 81 L 310 81 C 329 81 336 72 336 55 C 336 38 329 29 310 29 Z" />

            {/* 'C' - clean smooth crescent shape properly spaced after 2nd D */}
            <path d="M 478 30 L 452 40 C 444 31 432 26 416 26 C 390 26 376 40 376 55 C 376 70 390 84 416 84 C 432 84 444 79 452 70 L 478 80 C 464 96 443 103 416 103 C 372 103 346 79 346 55 C 346 31 372 7 416 7 C 443 7 464 14 478 30 Z" />
          </g>

          {/* Signature Red End Accent */}
          <rect x="496" y="52" width="40" height="42" fill="#e30613" rx="1" />
        </g>
      </svg>
    </div>
  );
};

