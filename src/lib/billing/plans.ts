// ── B9 Automation Pricing (Updated) ──────────────────────────────────────────
// FREE:     ₹0/month
// STARTER:  ₹1,499/month  (annual ₹999/month)
// GROWTH:   ₹3,499/month  (annual ₹2,499/month)
// PRO:      ₹6,999/month  (annual ₹4,999/month)
// BUSINESS: ₹12,999/month (annual ₹9,999/month)
//
// AI Engine:
//   FREE/STARTER → Gemini 2.5 Flash Lite  (shown as "B9 Agentic Core" on UI)
//   GROWTH       → Groq 70B + Gemini      (shown as "B9 Agentic Core" on UI)
//   PRO          → Real DeepSeek-V3 + Groq 70B  (shown as "DeepSeek V3")
//   BUSINESS     → Real DeepSeek-V3 + R1 Reasoner (shown as "DeepSeek V3 + Reasoner")
// ─────────────────────────────────────────────────────────────────────────────

export const TOPUP_PACKS = {
  ai_queries: [
    { key: 'ai_500',  label: '+500 AI credits',   amount: 500,  price: 299, expiresAfterDays: 90, popular: false },
    { key: 'ai_1000', label: '+1,000 AI credits',  amount: 1000, price: 499, expiresAfterDays: 90, popular: true  },
    { key: 'ai_2500', label: '+2,500 AI credits',  amount: 2500, price: 999, expiresAfterDays: 90, popular: false },
  ],
  automation_executions: [
    { key: 'automation_5000',  label: '+5,000 automation runs',  amount: 5000,  price: 499  },
    { key: 'automation_20000', label: '+20,000 automation runs', amount: 20000, price: 1499 },
  ],
  storage: [
    { key: 'storage_5gb',  label: '+5GB storage',  amount: 5,  price: 199, billingCycle: 'monthly' },
    { key: 'storage_25gb', label: '+25GB storage', amount: 25, price: 799, billingCycle: 'monthly' },
  ],
} as const;

export const PLAN_LIMITS = {
  FREE: {
    type: 'FREE',
    name: 'Free',
    price: 0,
    annual_price: undefined,
    description: 'Try B9 before you launch',
    bestFor: 'Testing with one PDF assistant — no WhatsApp',
    watermark: 'B9 watermark enabled',
    integrations: 'No integrations',
    automation: 'No automation',
    ai_engine: 'Gemini 2.5 Flash Lite',
    ai_label: 'B9 Agentic Core',
    features: [
      '1 assistant',
      'PDF only',
      '10 uploads, 50MB storage',
      '30 lifetime AI credits',
      'No WhatsApp, no automation',
      '1 team member',
    ],
    color: 'gray',
    cta: 'Start Free',
  },

  STARTER: {
    type: 'STARTER',
    name: 'Starter',
    price: 1499,
    annual_price: 9999,
    description: 'Launch your first AI-powered WhatsApp business',
    bestFor: 'Solo founders, local shops, freelancers',
    watermark: 'B9 watermark enabled',
    integrations: 'Google Sheets + WhatsApp Cloud API',
    automation: '10 workflows, max 5 steps, 500 runs/day',
    ai_engine: 'Gemini 2.5 Flash Lite',
    ai_label: 'B9 Agentic Core',
    badge: null,
    features: [
      '2 assistants',
      'PDF, Website, YouTube',
      '2GB storage, 100 uploads/month',
      '1,000 AI credits/month',
      '1 WhatsApp connection',
      '10 automations (5 steps each)',
      'IndiaMART sync ✓',
      'QR Code generator ✓',
      '500 leads/day, 2 team members',
      'Google Sheets integration',
    ],
    color: 'blue',
    cta: 'Start with Starter',
  },

  GROWTH: {
    type: 'GROWTH',
    name: 'Growth',
    price: 3499,
    annual_price: 24999,
    description: 'Scale with AI automation across all channels',
    bestFor: 'Growing businesses, agencies, multi-channel teams',
    watermark: 'Watermark removed',
    integrations: 'All 12 integrations (Slack, Shopify, HubSpot, Zoho, Calendly, Zapier…)',
    automation: 'Unlimited workflows + steps, 5,000 runs/day',
    ai_engine: 'Groq llama-3.3-70B + Gemini fallback',
    ai_label: 'B9 Agentic Core',
    badge: 'Most Popular',
    features: [
      '5 assistants',
      '10GB storage, 250 uploads/month',
      '5,000 AI credits/month',
      '2 WhatsApp connections',
      'Up to 5,000 automation runs/day',
      'WhatsApp Flows (form builder) ✓',
      'A/B Testing for campaigns ✓',
      'Agentic AI loop (basic) ✓',
      'All 12 integrations ✓',
      'Analytics dashboard',
      '1,000 leads/day, 5 team members',
    ],
    color: 'primary',
    cta: 'Start Growing',
  },

  PRO: {
    type: 'PRO',
    name: 'Pro',
    price: 6999,
    annual_price: 49999,
    description: 'Real DeepSeek AI with full agentic power',
    bestFor: 'Power users, sales teams, high-volume automation',
    watermark: 'Watermark removed',
    integrations: 'All integrations + API access + Webhooks',
    automation: 'Unlimited everything, 25,000 runs/day',
    ai_engine: 'Real DeepSeek-V3 + Groq 70B',
    ai_label: 'DeepSeek V3',
    badge: 'Best Value',
    features: [
      '15 assistants',
      '25GB storage, 500 uploads/month',
      '20,000 AI credits/month',
      '5 WhatsApp connections',
      'Real DeepSeek-V3 AI (not Gemini) ✓',
      'Full Agentic Tool-Use Loop ✓',
      'API access + Webhooks ✓',
      'Web search + Thinking mode ✓',
      'Premium 3D widget ✓',
      'Priority AI queue ✓',
      '5,000 leads/day, 15 team members',
    ],
    color: 'green',
    cta: 'Go Pro',
  },

  BUSINESS: {
    type: 'BUSINESS',
    name: 'Business',
    price: 12999,
    annual_price: 99999,
    description: 'Unlimited scale with white-label and dedicated support',
    bestFor: 'Large teams, agencies, enterprise clients',
    watermark: 'Full white-label — your brand only',
    integrations: 'All integrations + White-label + Custom domain',
    automation: 'Unlimited workflows, 100,000 runs/day',
    ai_engine: 'DeepSeek-V3 + DeepSeek-R1 Reasoner',
    ai_label: 'DeepSeek V3 + Reasoner',
    badge: 'Enterprise',
    features: [
      'Unlimited assistants',
      '100GB storage, unlimited uploads',
      '50,000 AI credits/month fair use',
      '10 WhatsApp connections',
      'DeepSeek-R1 Deep Reasoning ✓',
      'White-label — your own branding ✓',
      'Custom domain ✓',
      'Role-based permissions ✓',
      'Dedicated support + SLA ✓',
      'Unlimited leads, 50 team members',
    ],
    color: 'purple',
    cta: 'Contact Sales',
  },
} as const;

export const PLANS = Object.values(PLAN_LIMITS);

export type PlanKey = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[(plan?.toUpperCase() as PlanKey) || 'FREE'] || PLAN_LIMITS.FREE;
}

export function canUseFeature(plan: string, featureKey: string) {
  const limits = getPlanLimits(plan) as any;
  const featureText = [...limits.features, limits.integrations, limits.automation, limits.watermark]
    .join(' ')
    .toLowerCase();
  return featureText.includes(featureKey.replace(/_/g, ' ').toLowerCase());
}

export function checkUsageLimit(plan: string, metric: string, current: number, amount = 1) {
  const limits = getPlanLimits(plan) as any;
  const metricLimits: Record<string, number | undefined> = {
    assistants: Number(limits.features[0]?.match(/\d+/)?.[0] || 0),
    ai_queries: Number(limits.features.find((item: string) => item.includes('queries'))?.match(/[\d,]+/)?.[0]?.replace(',', '') || 0),
  };
  const limit = metricLimits[metric];
  return typeof limit === 'number' && limit > 0 ? current + amount <= limit : true;
}

export function incrementUsage(current: number, amount = 1) {
  return current + amount;
}

// Helper: is this plan using real DeepSeek or Gemini illusion?
export function getAiLabel(plan: string): string {
  const limits = getPlanLimits(plan) as any;
  return limits.ai_label || 'B9 Agentic Core';
}

export function isRealDeepSeek(plan: string): boolean {
  return ['PRO', 'BUSINESS'].includes(plan?.toUpperCase());
}
