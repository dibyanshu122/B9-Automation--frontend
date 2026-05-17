import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { FeatureKey } from '@/lib/billing/features';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { UpgradeModal } from './upgrade-modal';

interface FeatureGateProps {
  feature: FeatureKey;
  requiredPlan?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: 'wrap' | 'replace';
}

export function FeatureGate({ feature, requiredPlan, children, fallback, mode = 'wrap' }: FeatureGateProps) {
  const access = usePlanAccess(feature, requiredPlan);
  const [open, setOpen] = useState(false);

  if (access.allowed) return <>{children}</>;

  if (mode === 'replace') {
    return (
      <>
        {fallback || (
          <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600">
            <Lock className="h-4 w-4" /> Upgrade required
          </button>
        )}
        <UpgradeModal isOpen={open} onClose={() => setOpen(false)} currentPlan={access.currentPlan} requiredPlan={access.requiredPlan} feature={feature} />
      </>
    );
  }

  return (
    <>
      <div onClickCapture={(event) => { event.preventDefault(); event.stopPropagation(); setOpen(true); }} className="relative cursor-pointer">
        <div className="pointer-events-none opacity-60">{children}</div>
        <div className="absolute right-2 top-2 rounded-full bg-gray-950 px-2 py-1 text-[10px] font-bold text-white">
          Locked
        </div>
      </div>
      <UpgradeModal isOpen={open} onClose={() => setOpen(false)} currentPlan={access.currentPlan} requiredPlan={access.requiredPlan} feature={feature} />
    </>
  );
}
