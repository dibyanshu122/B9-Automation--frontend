import { useState } from 'react';
import toast from 'react-hot-toast';
import { Zap, RefreshCw } from 'lucide-react';
import { TOPUP_PACKS } from '@/lib/billing/plans';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { Modal } from './modal';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AI_PACKS = TOPUP_PACKS.ai_queries as readonly any[];

const SAVINGS: Record<string, string> = {
  ai_500: '',
  ai_1000: 'Save 17%',
  ai_2500: 'Save 33%',
};

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
    document.body.appendChild(script);
  });
}

export function TopUpModal({ isOpen, onClose }: TopUpModalProps) {
  const { post } = useApi();
  const { user } = useAuthStore();
  const [autoTopup, setAutoTopup] = useState(false);
  const [autoThreshold] = useState(50);
  const [purchasing, setPurchasing] = useState('');

  const purchase = async (packKey: string, packLabel: string) => {
    const key = packKey;
    if (!key) return;
    setPurchasing(key);
    try {
      // Step 1: Create Razorpay order on backend
      const response = await post('/api/billing/topups/purchase', {
        pack_key: key,
        auto_topup: autoTopup,
        auto_threshold: autoThreshold,
      });
      const { order_id, amount, razorpay_key } = response.data;

      // Validate key before opening checkout
      const rzpKey = razorpay_key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!rzpKey) {
        toast.error('Payment is not configured yet. Contact support.');
        return;
      }

      // Step 2: Load Razorpay SDK
      await loadRazorpayScript();

      // Step 3: Open Razorpay checkout modal
      const options = {
        key: rzpKey,
        order_id,
        amount,
        currency: 'INR',
        name: 'B9 Automation',
        description: `${packLabel} — AI Reply Credits`,
        image: '/brand-logo.svg',
        handler: () => {
          toast.success(`${packLabel} added! Your AI replies will reflect shortly.`);
          onClose();
          // Reload page so quota counter updates
          setTimeout(() => window.location.reload(), 1500);
        },
        prefill: {
          email: user?.email || '',
          name: user?.name || '',
        },
        notes: {
          pack_key: key,
          user_id: user?.id || '',
        },
        theme: { color: '#f97316' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled.');
            setPurchasing('');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Could not start checkout. Try again.');
      setPurchasing('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy AI Reply Credits" size="lg">
      <div className="space-y-5">
        {/* AI replies section */}
        <div>
          <p className="text-xs text-gray-500 mb-3">1 credit = 1 AI-powered reply on WhatsApp, Instagram, or chat. Credits expire in 90 days.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {AI_PACKS.map((pack) => (
              <button
                key={pack.key}
                type="button"
                disabled={Boolean(purchasing)}
                onClick={() => purchase(pack.key, pack.label)}
                className={`relative rounded-xl border p-4 text-left transition disabled:opacity-60 ${pack.popular ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-300' : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50'}`}
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-950">{pack.label}</p>
                  {purchasing === pack.key
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                    : <Zap className="h-4 w-4 shrink-0 text-primary-600" />}
                </div>
                {SAVINGS[pack.key] && (
                  <span className="mt-1 inline-block rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    {SAVINGS[pack.key]}
                  </span>
                )}
                <p className="mt-3 text-2xl font-black text-primary-600">₹{pack.price}</p>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  ₹{(pack.price / pack.amount).toFixed(2)} per reply
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Other top-ups */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-bold text-gray-950 mb-3">Other Add-ons</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[...TOPUP_PACKS.automation_executions, ...TOPUP_PACKS.storage].map((pack: any) => (
              <button
                key={pack.key}
                type="button"
                disabled={Boolean(purchasing)}
                onClick={() => purchase(pack.key, pack.label)}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 disabled:opacity-60"
              >
                <p className="font-bold text-gray-950">{pack.label}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {pack.expiresAfterDays ? `Expires in ${pack.expiresAfterDays} days` : pack.billingCycle || 'One-time'}
                </p>
                <p className="mt-2 text-xl font-black text-primary-600">₹{pack.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Auto top-up toggle */}
        <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition ${autoTopup ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <RefreshCw className={`h-4 w-4 shrink-0 ${autoTopup ? 'text-emerald-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm font-bold text-gray-950">Auto top-up</p>
              <p className="text-xs text-gray-500">Auto-refill 500 credits when balance drops below {autoThreshold}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoTopup(!autoTopup)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${autoTopup ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${autoTopup ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
          Tip: Add your own <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="font-bold underline">Groq API key</a> in Settings to use your own AI quota for replies.
        </p>
      </div>
    </Modal>
  );
}
