import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', variant = 'dark', size = 'md' }: LogoProps) {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;

  const fontSize =
    size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px';

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/brand-logo.svg"
        alt="B9 Automation logo"
        width={iconSize}
        height={iconSize}
        className="shrink-0"
        priority
      />

      <span
        style={{
          fontFamily: "'Inter', 'SF Pro Display', ui-sans-serif, system-ui, sans-serif",
          fontSize,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          userSelect: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.18em',
        }}
      >
        {/* B9 — cyan to violet gradient matching the icon */}
        <span
          style={{
            background:
              variant === 'dark'
                ? 'linear-gradient(135deg, #00F2FE 0%, #818CF8 50%, #7C3AED 100%)'
                : 'linear-gradient(135deg, #0891b2 0%, #6d28d9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 900,
            letterSpacing: '-0.03em',
          }}
        >
          B9
        </span>

        {/* Automation — clean white/dark */}
        <span
          style={{
            color: variant === 'dark' ? 'rgba(255,255,255,0.90)' : 'rgba(15,15,35,0.88)',
            fontWeight: 700,
            letterSpacing: '-0.015em',
          }}
        >
          Automation
        </span>
      </span>
    </Link>
  );
}
