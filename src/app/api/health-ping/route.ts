import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://b9-automation-backend.onrender.com';

// Called by Vercel Cron every 5 minutes to keep Railway backend alive (prevents cold starts)
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { next: { revalidate: 0 } });
    const ok = res.ok;
    return NextResponse.json({ ok, backend: BACKEND_URL, ts: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, error: 'Backend unreachable' }, { status: 200 });
  }
}
