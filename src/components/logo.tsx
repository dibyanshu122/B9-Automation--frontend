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

      {/* B9 Automation — Space Grotesk + premium gradient */}
      <span
        style={{
          fontFamily: "var(--font-space-grotesk), 'Inter', ui-sans-serif, system-ui, sans-serif",
          fontSize,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          userSelect: 'none',
          background:
            variant === 'dark'
              ? 'linear-gradient(125deg, #00F2FE 0%, #a78bfa 45%, #7C3AED 75%, #f472b6 100%)'
              : 'linear-gradient(125deg, #0891b2 0%, #6d28d9 60%, #9333ea 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        B9 Automation
      </span>
    </Link>
  );
}
