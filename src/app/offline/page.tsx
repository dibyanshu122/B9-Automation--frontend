'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#030712] px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 20C6 12.268 12.268 6 20 6s14 6.268 14 14-6.268 14-14 14S6 27.732 6 20z" stroke="#00F2FE" strokeWidth="2"/>
          <path d="M14 20h12M20 14v12" stroke="#00F2FE" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 8l24 24" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white">You are offline</h1>
      <p className="mt-3 max-w-sm text-sm text-zinc-400">
        Check your internet connection and try again. B9 Automation needs an active connection to sync your leads and messages.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-xl bg-[#00F2FE]/10 border border-[#00F2FE]/30 px-6 py-2.5 text-sm font-semibold text-[#00F2FE] transition hover:bg-[#00F2FE]/20"
      >
        Try again
      </button>
    </div>
  );
}
