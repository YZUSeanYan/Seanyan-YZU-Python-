import React from 'react';

interface SvgProps {
  className?: string;
}

export const PythonLogo: React.FC<SvgProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 8C14 8 15 13 15 13V19H24V21H11S6 20 6 30C6 40 11 39 11 39H17V33C17 33 16 27 22 27H30C30 27 35 27 35 22V13C35 13 36 8 24 8ZM20 12C21.1 12 22 12.9 22 14C22 15.1 21.1 16 20 16C18.9 16 18 15.1 18 14C18 12.9 18.9 12 20 12Z"
      fill="#0F4C81"
    />
    <path
      d="M24 40C34 40 33 35 33 35V29H24V27H37S42 28 42 18C42 8 37 9 37 9H31V15C31 15 32 21 26 21H18C18 21 13 21 13 26V35C13 35 12 40 24 40ZM28 36C26.9 36 26 35.1 26 34C26 32.9 26.9 32 28 32C29.1 32 30 32.9 30 34C30 35.1 29.1 36 28 36Z"
      fill="#2A9D8F"
    />
  </svg>
);

export const HeroBg: React.FC<SvgProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 1920 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <pattern id="code-grid" x="0" y="0" width="120" height="60" patternUnits="userSpaceOnUse">
        <rect x="10" y="10" width="40" height="6" rx="3" fill="#0F4C81" fillOpacity="0.08" />
        <rect x="10" y="22" width="60" height="6" rx="3" fill="#0F4C81" fillOpacity="0.06" />
        <rect x="10" y="34" width="30" height="6" rx="3" fill="#0F4C81" fillOpacity="0.07" />
        <rect x="10" y="46" width="50" height="6" rx="3" fill="#0F4C81" fillOpacity="0.05" />
        <rect x="70" y="10" width="25" height="6" rx="3" fill="#0F4C81" fillOpacity="0.06" />
        <rect x="70" y="22" width="45" height="6" rx="3" fill="#0F4C81" fillOpacity="0.08" />
        <rect x="70" y="34" width="35" height="6" rx="3" fill="#0F4C81" fillOpacity="0.05" />
        <rect x="70" y="46" width="20" height="6" rx="3" fill="#0F4C81" fillOpacity="0.07" />
      </pattern>
      <linearGradient id="fade-overlay" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
        <stop offset="50%" stopColor="#F5F7FA" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#F5F7FA" stopOpacity="1" />
      </linearGradient>
    </defs>
    <rect width="1920" height="600" fill="url(#code-grid)" />
    <rect width="1920" height="600" fill="url(#fade-overlay)" />
    {/* Connecting lines */}
    <line x1="200" y1="100" x2="400" y2="200" stroke="#0F4C81" strokeOpacity="0.06" strokeWidth="1" />
    <line x1="500" y1="150" x2="700" y2="250" stroke="#0F4C81" strokeOpacity="0.05" strokeWidth="1" />
    <line x1="800" y1="80" x2="1000" y2="180" stroke="#0F4C81" strokeOpacity="0.06" strokeWidth="1" />
    <line x1="1100" y1="200" x2="1300" y2="100" stroke="#0F4C81" strokeOpacity="0.05" strokeWidth="1" />
    <line x1="1400" y1="250" x2="1600" y2="150" stroke="#0F4C81" strokeOpacity="0.06" strokeWidth="1" />
    <line x1="1700" y1="120" x2="1850" y2="220" stroke="#0F4C81" strokeOpacity="0.05" strokeWidth="1" />
  </svg>
);

export const EmptyState: React.FC<SvgProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="120" y="60" width="160" height="200" rx="12" stroke="#94A3B8" strokeWidth="2" strokeDasharray="8 4" />
    <line x1="140" y1="100" x2="260" y2="100" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="140" y1="120" x2="240" y2="120" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="140" y1="140" x2="220" y2="140" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="140" y1="160" x2="250" y2="160" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="140" y1="180" x2="230" y2="180" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="140" y1="200" x2="200" y2="200" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <rect x="260" y="200" width="60" height="8" rx="4" fill="#94A3B8" fillOpacity="0.3" transform="rotate(-30 260 200)" />
    <circle cx="290" cy="190" r="6" stroke="#94A3B8" strokeWidth="2" />
    <path d="M285 185L295 195M295 185L285 195" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const Trophy: React.FC<SvgProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M60 45H140V55C140 75 125 90 110 95C105 105 95 105 90 95C75 90 60 75 60 55V45Z"
      stroke="#E9A23B"
      strokeWidth="3"
      fill="#E9A23B"
      fillOpacity="0.1"
    />
    <path d="M60 50H50C45 50 40 55 40 60C40 70 50 80 60 80" stroke="#E9A23B" strokeWidth="3" fill="none" />
    <path d="M140 50H150C155 50 160 55 160 60C160 70 150 80 140 80" stroke="#E9A23B" strokeWidth="3" fill="none" />
    <rect x="85" y="95" width="30" height="40" rx="4" stroke="#E9A23B" strokeWidth="3" fill="#E9A23B" fillOpacity="0.1" />
    <rect x="75" y="130" width="50" height="8" rx="4" stroke="#E9A23B" strokeWidth="2" fill="#E9A23B" fillOpacity="0.1" />
    <path d="M100 35L103 42H110L105 47L107 55L100 50L93 55L95 47L90 42H97L100 35Z" fill="#E9A23B" fillOpacity="0.3" stroke="#E9A23B" strokeWidth="1.5" />
  </svg>
);

export const ExamTimer: React.FC<SvgProps> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 300 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Hourglass */}
    <rect x="110" y="30" width="80" height="140" rx="8" stroke="#0F4C81" strokeWidth="2.5" />
    <line x1="110" y1="50" x2="190" y2="50" stroke="#0F4C81" strokeWidth="2" />
    <line x1="110" y1="150" x2="190" y2="150" stroke="#0F4C81" strokeWidth="2" />
    <path d="M120 50L150 95L180 50" stroke="#0F4C81" strokeWidth="2" fill="#0F4C81" fillOpacity="0.08" />
    <path d="M120 150L150 105L180 150" stroke="#0F4C81" strokeWidth="2" fill="#0F4C81" fillOpacity="0.15" />
    {/* Code brackets */}
    <text x="45" y="110" fill="#0F4C81" fillOpacity="0.4" fontFamily="monospace" fontSize="36" fontWeight="500">{'{'}</text>
    <text x="230" y="110" fill="#0F4C81" fillOpacity="0.4" fontFamily="monospace" fontSize="36" fontWeight="500">{'}'}</text>
    {/* Clock hands */}
    <line x1="150" y1="100" x2="150" y2="75" stroke="#0F4C81" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="150" y1="100" x2="165" y2="100" stroke="#0F4C81" strokeWidth="2" strokeLinecap="round" />
    <circle cx="150" cy="100" r="4" fill="#0F4C81" />
    {/* Dots */}
    <circle cx="40" cy="80" r="3" fill="#0F4C81" fillOpacity="0.2" />
    <circle cx="35" cy="130" r="2.5" fill="#0F4C81" fillOpacity="0.15" />
    <circle cx="255" cy="75" r="2.5" fill="#0F4C81" fillOpacity="0.15" />
    <circle cx="262" cy="125" r="3" fill="#0F4C81" fillOpacity="0.2" />
  </svg>
);
