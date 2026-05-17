import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export function Logo({ className = '', variant = 'dark' }: LogoProps) {
  const isDark = variant === 'dark';

  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
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
      <div className="flex flex-col leading-none gap-1.5">
        <span className={`text-[15px] font-bold tracking-[0.28em] uppercase ${isDark ? 'text-white' : 'text-[#1a2f5e]'}`}>
          B9 Automation
        </span>
        <span className={`text-[8.5px] tracking-[0.22em] uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Sales &nbsp;&nbsp; Support &nbsp;&nbsp; Automate
        </span>
      </div>
    </Link>
  );
}
