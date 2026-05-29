import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', variant = 'dark', size = 'md' }: LogoProps) {
  const iconSize = size === 'sm' ? 26 : size === 'lg' ? 42 : 34;

  const textStyle =
    size === 'sm'
      ? 'text-[13px] tracking-[0.01em]'
      : size === 'lg'
      ? 'text-[18px] tracking-[-0.01em]'
      : 'text-[15px] tracking-[0.005em]';

  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/brand-logo.svg"
        alt="B9 Automation logo"
        width={iconSize}
        height={iconSize}
        className="shrink-0"
        priority
      />

      <span
        className={`${textStyle} font-black select-none leading-none`}
        style={{
          background:
            variant === 'dark'
              ? 'linear-gradient(135deg, #ffffff 0%, #c8d4f0 55%, #a0b4e8 100%)'
              : 'linear-gradient(135deg, #1a1a2e 0%, #3b3b6b 60%, #5a5aaa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: "'Inter', 'SF Pro Display', ui-sans-serif, system-ui, sans-serif",
        }}
      >
        B9{' '}
        <span
          style={{
            background:
              variant === 'dark'
                ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #00c6ff 100%)'
                : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Automation
        </span>
      </span>
    </Link>
  );
}
