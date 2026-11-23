import React from 'react';
import { CompanyId } from '../types';
import { LuminousLogo } from './LuminousLogo';

interface ArqLogoProps {
  variant?: 'full' | 'icon' | 'horizontal' | 'stamp';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  color?: string;
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-11',
  lg: 'h-14',
  xl: 'h-20',
  '2xl': 'h-28',
};

/**
 * Official ARQ Engineering Consultancy Vector Logo (Exact SVG Paths)
 */
export const ArqLogo: React.FC<ArqLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  color = '#111111',
}) => {
  const renderArqMark = () => (
    <g fill={color}>
      <path d="M1091.73,414.61l-1091.47-.02-.25-11.9h84.54s.24-68.37.24-68.37l.15-29.68,93.79-49.26v147.04s11.11.02,11.11.02l-.11-163.18-27.03,13.53-.07-180.14L259.82,0l-1.21,175.18-37.07-27.65.1,105.4.12,149.43,9.48-.04-.15-235.14,83.26,64.44.16,171.04,777.24.04c.61,3.78.66,7.08-.02,11.92Z" />
      <g>
        <path d="M746.83,391.74l-54.19.09-78.9-116.62,58.5-.29c24.35-.12,40.83-22.86,36.54-46.39-2.92-17.72-16.96-29.84-34.97-31.78l-93.52-.26-19.94-39.79,109.96.05c45.88.28,79.53,30.96,80.66,76.91.91,37.06-22.47,69.02-58.87,78.39l14.39,20.22,40.33,59.47Z" />
        <path d="M570.71,285.81l-63.41-129.32-38.55.15-35.28,72.61-79.61,162.38,47.82.19,21.21-42.57,131.23.08,20.28,42.55,47.82-.15-51.51-105.92ZM442.46,306.58l45.63-92.59,45.67,92.83-91.3-.24Z" />
        <g>
          <path d="M933.37,204.29c-26.13-14.2-58.17-13.14-82.7,2.61-33.37,21.42-45.43,63.1-30.04,98.94,15.12,35.21,53.52,55.03,91.59,46.02l27.72,32.36c-28.68,12.75-60.04,13.58-88.65,2.19-43.88-18.18-74.97-58.29-76.59-106.48-1.15-34.06,11.13-66.68,35.2-90.4,25.72-25.34,59.43-37.68,95.65-34.28,28.74,2.7,55.5,14.11,75.32,35.18,27.42,29.16,38.17,69.83,29.29,108.75-4.57,17.72-12.67,33.07-24.53,47.61l-25.43-28.12c26.7-39.4,14.99-91.65-26.83-114.38Z" />
          <polygon points="1018.31 393.5 962.97 393.78 932.63 359.24 888 309.68 942.07 309.49 955.55 323.43 1018.31 393.5" />
        </g>
      </g>
    </g>
  );

  if (variant === 'icon') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1092.22 424"
        style={{ direction: 'ltr' }}
        className={`${sizeClasses[size]} w-auto inline-block ${className}`}
        aria-label="ARQ Engineering Consultancy"
      >
        {renderArqMark()}
      </svg>
    );
  }

  if (variant === 'stamp') {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center border-2 border-[#1c1917]/75 bg-stone-50/90 px-4 py-2.5 rounded-xl text-center ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1092.22 618.3"
          style={{ direction: 'ltr' }}
          className="h-12 w-auto"
          aria-label="ختم شركة أرك للاستشارات الهندسية"
        >
          {renderArqMark()}
          <text
            fill={color}
            style={{
              fontFamily: "'Cairo', sans-serif",
              fontSize: '80.39px',
              fontWeight: 700,
              direction: 'rtl',
              unicodeBidi: 'plaintext',
            }}
            x="546"
            y="575.77"
            textAnchor="middle"
          >
            أرك للإسـتشـارات الهنـدسـيـة
          </text>
          <text
            fill={color}
            style={{
              fontFamily: "'Outfit', 'Cairo', sans-serif",
              fontSize: '49.32px',
              fontWeight: 800,
              letterSpacing: '0.09em',
            }}
            x="546"
            y="492.11"
            textAnchor="middle"
          >
            ENGINEERING CONSULTANCY
          </text>
        </svg>
        <div className="w-full h-[1.5px] bg-[#a6926b] my-1" />
        <div className="text-[8.5px] font-extrabold text-[#3a3c3e] tracking-tight">
          الختم والاعتماد الهندسي المعتمد • س.ت: 1010788646
        </div>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-3.5 ${className}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1092.22 618.3"
          style={{ direction: 'ltr' }}
          className="h-14 w-auto shrink-0"
          aria-label="ARQ Engineering Consultancy"
        >
          {renderArqMark()}
          <text
            fill={color}
            style={{
              fontFamily: "'Cairo', sans-serif",
              fontSize: '80.39px',
              fontWeight: 700,
              direction: 'rtl',
              unicodeBidi: 'plaintext',
            }}
            x="546"
            y="575.77"
            textAnchor="middle"
          >
            أرك للإسـتشـارات الهنـدسـيـة
          </text>
          <text
            fill={color}
            style={{
              fontFamily: "'Outfit', 'Cairo', sans-serif",
              fontSize: '49.32px',
              fontWeight: 800,
              letterSpacing: '0.09em',
            }}
            x="546"
            y="492.11"
            textAnchor="middle"
          >
            ENGINEERING CONSULTANCY
          </text>
        </svg>
      </div>
    );
  }

  // Full official ARQ SVG lockup matching exact provided geometry
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1092.22 618.3"
      style={{ direction: 'ltr' }}
      className={`${sizeClasses[size]} w-auto inline-block ${className}`}
      aria-label="شركة أرك للاستشارات الهندسية - ARQ Engineering Consultancy"
    >
      {renderArqMark()}
      <text
        fill={color}
        style={{
          fontFamily: "'Cairo', sans-serif",
          fontSize: '80.39px',
          fontWeight: 700,
          direction: 'rtl',
          unicodeBidi: 'plaintext',
        }}
        x="546"
        y="575.77"
        textAnchor="middle"
      >
        أرك للإسـتشـارات الهنـدسـيـة
      </text>
      <text
        fill={color}
        style={{
          fontFamily: "'Outfit', 'Cairo', sans-serif",
          fontSize: '49.32px',
          fontWeight: 800,
          letterSpacing: '0.09em',
        }}
        x="546"
        y="492.11"
        textAnchor="middle"
      >
        ENGINEERING CONSULTANCY
      </text>
    </svg>
  );
};

interface CompanyLogoProps {
  companyId?: CompanyId;
  variant?: 'full' | 'icon' | 'horizontal' | 'stamp';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showSignature?: boolean;
  color?: string;
  arqColor?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  companyId = 'luminous',
  variant = 'full',
  size = 'md',
  className = '',
  showSignature = true,
  color,
  arqColor = '#111111',
}) => {
  if (companyId === 'arq') {
    return (
      <ArqLogo
        variant={variant}
        size={size}
        className={className}
        color={color ?? arqColor}
      />
    );
  }

  return (
    <LuminousLogo
      variant={variant}
      size={size}
      className={className}
      showSignature={showSignature}
    />
  );
};

/**
 * Reusable Official Company Seal block for print views (Quotations & Contracts)
 */
export const CompanyOfficialSeal: React.FC<{
  companyId?: CompanyId;
  className?: string;
}> = ({ companyId = 'luminous', className = 'h-16 print:h-14 w-auto' }) => {
  if (companyId === 'arq') {
    return (
      <div className="inline-flex flex-col items-center justify-center border border-[#1c1917]/60 bg-[#faf9f6] px-3 py-1.5 rounded-lg text-center select-none">
        <ArqLogo variant="full" className="h-10 print:h-9 w-auto" color="#1c1917" />
        <div className="w-full h-[1.5px] bg-[#a6926b] my-1" />
        <div className="text-[8px] print:text-[7px] font-black text-[#2c2e30] leading-none">
          اعتماد وختم شركة أرك للاستشارات الهندسية
        </div>
      </div>
    );
  }

  return (
    <img
      src="/official-seal.png"
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src.indexOf('/official-emblem.svg') === -1) {
          target.src = '/official-emblem.svg';
        }
      }}
      alt="ختم واعتماد شركة الرؤية المضيئة للاستشارات الهندسية"
      className={`${className} object-contain select-none`}
      loading="eager"
    />
  );
};
