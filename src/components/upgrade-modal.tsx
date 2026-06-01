import Link from 'next/link';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Button } from './button';
import { Modal } from './modal';
import { FEATURE_RULES, FeatureKey, normalizePlan } from '@/lib/billing/features';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  requiredPlan?: string;
  feature?: FeatureKey;
  message?: string;
  benefits?: string[];
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan = 'FREE',
  requiredPlan,
  feature,
  message,
  benefits,
}: UpgradeModalProps) {
  const rule = feature ? FEATURE_RULES[feature] : null;
  const needed = normalizePlan(requiredPlan || rule?.requiredPlan || 'GROWTH');
  const items = benefits || rule?.benefits || ['Higher limits', 'More automation', 'More channels'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade required" size="md">
      <div className="space-y-5">
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
          <p className="text-sm font-semibold text-gray-700">Current plan</p>
          <p className="mt-1 text-2xl font-black text-gray-950">{normalizePlan(currentPlan)}</p>
          <p className="mt-3 text-sm text-gray-700">
            {message || rule?.message || `This feature is available on ${needed} plan and above.`}
          </p>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-100">Unlock with {needed}</p>
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard/billing" className="flex-1">
            <Button className="w-full">
              Upgrade
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing" className="flex-1">
            <Button variant="secondary" className="w-full">Compare plans</Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
