import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export function Logo({ className = '', variant = 'dark' }: LogoProps) {
  const isDark = variant === 'dark';

  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl ${isDark ? 'bg-white shadow-sm shadow-white/20' : ''}`}>
        <Image
          src="/b9-mark-logo.jpg"
          alt="B9 Automation logo"
          width={36}
          height={36}
          className="h-full w-full object-contain"
          priority
        />
      </div>
      <span className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-[#1F2937]'}`}>
        B9 Automation
      </span>
    </Link>
  );
}
