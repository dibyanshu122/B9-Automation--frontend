export const TOPUP_PACKS = {
  ai_queries: [
    { key: 'ai_500', label: '+500 AI replies', amount: 500, price: 299, expiresAfterDays: 90, popular: false },
    { key: 'ai_1000', label: '+1,000 AI replies', amount: 1000, price: 499, expiresAfterDays: 90, popular: true },
    { key: 'ai_2500', label: '+2,500 AI replies', amount: 2500, price: 999, expiresAfterDays: 90, popular: false },
  ],
  automation_executions: [
    { key: 'automation_5000', label: '+5000 automation executions', amount: 5000, price: 499 },
    { key: 'automation_20000', label: '+20000 automation executions', amount: 20000, price: 1499 },
  ],
  storage: [
    { key: 'storage_5gb', label: '+5GB storage', amount: 5, price: 199, billingCycle: 'monthly' },
    { key: 'storage_25gb', label: '+25GB storage', amount: 25, price: 799, billingCycle: 'monthly' },
  ],
} as const;

export const PLAN_LIMITS = {
  FREE: {
    type: 'FREE',
    name: 'Free',
    price: 0,
    annual_price: undefined,
    description: 'For testing document chat before launch',
    bestFor: 'Trying B9 with one PDF assistant',
    watermark: 'B9 watermark enabled',
    integrations: 'No integrations',
    automation: 'No automation',
    features: [
      '1 assistant',
      'PDF only',
      '10 uploads',
      '50MB storage',
      '30 lifetime AI queries',
      'Max 1 active chat session',
      'Max 3 sources per assistant',
      'No widget embed',
    ],
    color: 'gray',
    cta: 'Start Free',
  },
  STARTER: {
    type: 'STARTER',
    name: 'Starter',
    price: 799,
    annual_price: 7990,
    description: 'For a solo business launching one AI assistant',
    bestFor: 'Solo founders, local businesses, creators',
    watermark: 'B9 watermark enabled',
    integrations: 'Google Sheets only',
    automation: '1 active workflow, max 2 steps, 200 executions/day',
    features: [
      '1 assistant',
      'PDF, Website URL, YouTube URL',
      '2GB storage, 100 uploads/month',
      'Max 50MB/file, 5 YouTube videos',
      '500 AI queries/month',
      '1 widget, 1 domain',
      '3 public share links',
      'Max 2 team members',
      '50 leads/day',
    ],
    color: 'blue',
    cta: 'Upgrade to Starter',
  },
  GROWTH: {
    type: 'GROWTH',
    name: 'Growth',
    price: 1999,
    annual_price: 19990,
    description: 'Most popular for lead-generating websites',
    bestFor: 'Growing teams using chat, leads, and follow-up workflows',
    watermark: 'Watermark removed',
    integrations: 'Sheets, Gmail, Facebook Lead Ads, WhatsApp Cloud API',
    automation: '3 active workflows, max 5 steps, 2000 executions/day',
    features: [
      '3 assistants',
      '10GB storage, 250 uploads/month',
      '50 YouTube links, max 200MB/video',
      '1200 AI queries/month',
      '2 widgets, 2 domains',
      'Lead, query, and chat history analytics',
      '10 public share links',
      'Max 5 team members',
      '500 leads/day',
    ],
    color: 'primary',
    cta: 'Choose Growth',
  },
  PRO: {
    type: 'PRO',
    name: 'Pro',
    price: 3999,
    annual_price: 39990,
    description: 'For serious automation and premium AI workflows',
    bestFor: 'Businesses running multi-channel automations',
    watermark: 'Watermark removed',
    integrations: 'All connectors, API access, webhooks, web search',
    automation: '5 active workflows, max 10 steps, 10000 executions/day',
    features: [
      '5 assistants',
      '25GB storage, 500 uploads/month',
      'Unlimited YouTube links with fair usage',
      '2500 AI queries/month',
      '5 widgets, 5 domains, premium 3D widget',
      'Thinking mode and multi-source answers',
      'AI confidence scoring',
      'Advanced analytics',
      'Max 15 team members',
    ],
    color: 'green',
    cta: 'Upgrade to Pro',
  },
  BUSINESS: {
    type: 'BUSINESS',
    name: 'Business',
    price: 7999,
    annual_price: 79990,
    description: 'For larger teams needing control and scale',
    bestFor: 'Teams with high volume, white-label, and support needs',
    watermark: 'Full white-label',
    integrations: 'All connectors with priority AI queue',
    automation: '15 active workflows, max 20 steps, 50000 executions/day',
    features: [
      '10 assistants',
      '100GB storage',
      '7500 AI queries/month',
      '15 domains',
      'Team collaboration and role permissions',
      'Dedicated support',
      'Custom domain',
      'Max 50 team members',
      '10000 leads/day',
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
    ai_queries: Number(limits.features.find((item: string) => item.includes('queries'))?.match(/\d+/)?.[0] || 0),
  };
  const limit = metricLimits[metric];
  return typeof limit === 'number' && limit > 0 ? current + amount <= limit : true;
}

export function incrementUsage(current: number, amount = 1) {
  return current + amount;
}
