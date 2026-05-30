// Server Component — fetches billing data at render time so the page loads with data (no loading flicker)
import { cookies } from 'next/headers';
import BillingClient from './billing-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function serverFetch(path: string, token: string) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function BillingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  let initialPlan;
  let initialInvoices;

  if (token) {
    const [planResult, invoicesResult] = await Promise.allSettled([
      serverFetch('/api/billing/current-plan', token),
      serverFetch('/api/billing/invoices', token),
    ]);
    if (planResult.status === 'fulfilled') initialPlan = planResult.value ?? undefined;
    if (invoicesResult.status === 'fulfilled') initialInvoices = invoicesResult.value ?? undefined;
  }

  return <BillingClient initialPlan={initialPlan} initialInvoices={initialInvoices} />;
}
