import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', variant = 'dark', size = 'md' }: LogoProps) {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  const textSize = size === 'sm' ? 'text-[13px]' : size === 'lg' ? 'text-[17px]' : 'text-[15px]';
  const textColor = variant === 'dark' ? 'text-white' : 'text-[#1F2937]';

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
      <span className={`${textSize} font-bold ${textColor}`}>
        B9 Automation
      </span>
    </Link>
  );
}
