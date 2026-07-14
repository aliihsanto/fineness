/**
 * The hallmark: a cut-corner assay cartouche stamped with a Marcellus lowercase f.
 * Path data is the actual glyph outline extracted from Marcellus-Regular.ttf, so the
 * mark stays identical to the wordmark face at any size. Same drawing lives in app/icon.svg.
 */
export const F_GLYPH =
  "M25.59-69.92Q24.37-69.92 22.97-69.48Q21.58-69.04 20.41-67.87Q19.24-66.70 18.46-64.62Q17.68-62.55 17.68-59.28L17.68-50Q20.26-50.05 22.53-50.15Q24.80-50.24 26.61-50.34Q28.42-50.44 29.64-50.56Q30.86-50.68 31.40-50.78L30.52-45.80Q28.81-45.85 26.81-45.95Q25.10-46.04 22.75-46.09Q20.41-46.14 17.68-46.19L17.68-19.09Q17.68-14.94 17.80-11.84Q17.92-8.74 18.09-6.49Q18.26-4.25 18.53-2.73Q18.80-1.22 19.09-0.20L19.09 0L7.81 0L7.81-0.20Q8.11-1.22 8.35-2.73Q8.59-4.25 8.79-6.49Q8.98-8.74 9.08-11.84Q9.18-14.94 9.18-19.09L9.18-46.19L0.98-45.90L0.98-50.20Q2.49-50.10 4.59-50.05Q6.69-50 9.18-50L9.18-58.20Q9.18-61.96 10.28-64.87Q11.38-67.77 13.33-69.75Q15.28-71.73 18.02-72.75Q20.75-73.78 24.02-73.78Q25.83-73.78 27.39-73.54Q28.96-73.29 30.20-72.95Q31.45-72.61 32.40-72.24Q33.35-71.87 33.98-71.58L35.89-63.18L35.30-62.89Q34.52-64.06 33.59-65.31Q32.67-66.55 31.49-67.58Q30.32-68.60 28.88-69.26Q27.44-69.92 25.59-69.92";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 96" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hallmark-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0D584" />
          <stop offset="55%" stopColor="#D9B454" />
          <stop offset="100%" stopColor="#A9821F" />
        </linearGradient>
      </defs>
      <path
        d="M16 4 H48 L60 16 V80 L48 92 H16 L4 80 V16 Z"
        fill="none"
        stroke="url(#hallmark-gold)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M19 9 H45 L55 19 V77 L45 87 H19 L9 77 V19 Z"
        fill="none"
        stroke="url(#hallmark-gold)"
        strokeWidth="0.75"
        opacity="0.45"
      />
      <path d={F_GLYPH} transform="translate(20.02 72) scale(0.65)" fill="url(#hallmark-gold)" />
    </svg>
  );
}
