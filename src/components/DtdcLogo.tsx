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
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 500 100"
        className="h-full w-auto max-w-full object-contain"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="500" height="100" fill="#ffffff" />
            {/* Clean horizontal slice through the center */}
            <rect x="0" y="40" width="500" height="14" fill="#000000" />
          </mask>
        </defs>

        {/* Global forward slant matching authentic DTDC logo */}
        <g transform="skewX(-13)" style={{ transformOrigin: '250px 50px' }}>
          {/* Letters D T D C in official deep navy blue */}
          <g fill="#0b2447" mask={`url(#${maskId})`}>
            {/* 1st 'D' */}
            <path d="M 22 10 L 80 10 C 110 10 124 24 124 50 C 124 76 110 90 80 90 L 22 90 Z M 48 28 L 48 72 L 76 72 C 92 72 98 64 98 50 C 98 36 92 28 76 28 Z" />

            {/* 'T' */}
            <path d="M 134 10 L 216 10 L 216 30 L 188 30 L 188 90 L 162 90 L 162 30 L 134 30 Z" />

            {/* 2nd 'D' */}
            <path d="M 226 10 L 284 10 C 314 10 328 24 328 50 C 328 76 314 90 284 90 L 226 90 Z M 252 28 L 252 72 L 280 72 C 296 72 302 64 302 50 C 302 36 296 28 280 28 Z" />

            {/* 'C' */}
            <path d="M 426 28 L 402 37 C 396 29 388 25 376 25 C 354 25 342 37 342 50 C 342 63 354 75 376 75 C 388 75 396 71 402 63 L 426 72 C 414 86 398 92 376 92 C 336 92 316 71 316 50 C 316 29 336 8 376 8 C 398 8 414 14 426 28 Z" />
          </g>

          {/* Signature Red Accent Square */}
          <rect x="444" y="47" width="34" height="36" fill="#e30613" rx="1" />
        </g>
      </svg>
    </div>
  );
};
