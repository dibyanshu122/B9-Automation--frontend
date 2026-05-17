export const PLAN_ORDER = {
  FREE: 0,
  STARTER: 1,
  GROWTH: 2,
  PRO: 3,
  BUSINESS: 4,
} as const;

export const FEATURES = {
  assistantCreate: 'assistant.create',
  sourcePdf: 'source.pdf',
  sourceWebsite: 'source.website',
  sourceYoutube: 'source.youtube',
  widgetEmbed: 'widget.embed',
  integrationGoogleSheets: 'integration.google_sheets',
  integrationGmail: 'integration.gmail',
  integrationFacebook: 'integration.facebook',
  integrationWhatsapp: 'integration.whatsapp',
  integrationInstagram: 'integration.instagram',
  automationCreate: 'automation.create',
  automationExecute: 'automation.execute',
  automationSteps: 'automation.steps',
  aiThinking: 'ai.thinking',
  apiAccess: 'api.access',
  webhookAccess: 'webhook.access',
  whiteLabel: 'white_label',
  premiumWidget: 'premium_widget',
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];
export type PlanKey = keyof typeof PLAN_ORDER;

export const FEATURE_RULES: Record<FeatureKey, { requiredPlan: PlanKey; message: string; benefits: string[] }> = {
  'assistant.create': { requiredPlan: 'FREE', message: 'Assistant creation is available on your plan while limits remain.', benefits: ['Create trained AI assistants', 'Connect sources', 'Chat from dashboard'] },
  'source.pdf': { requiredPlan: 'FREE', message: 'PDF upload is available on all plans.', benefits: ['Upload PDFs', 'Train assistant knowledge', 'Answer from documents'] },
  'source.website': { requiredPlan: 'STARTER', message: 'Website crawling starts from Starter plan.', benefits: ['Train from website URLs', 'Keep source setup faster', 'Use website chat knowledge'] },
  'source.youtube': { requiredPlan: 'STARTER', message: 'YouTube URL training starts from Starter plan.', benefits: ['Use YouTube transcripts', 'Train from video content', 'Answer from video knowledge'] },
  'widget.embed': { requiredPlan: 'STARTER', message: 'Widget embed starts from Starter plan.', benefits: ['Add chat to your website', 'Capture visitor leads', 'Connect custom domains'] },
  'integration.google_sheets': { requiredPlan: 'STARTER', message: 'Google Sheets is available on Starter plan and above.', benefits: ['Send leads to sheets', 'Create rows from workflows', 'Keep owner records synced'] },
  'integration.gmail': { requiredPlan: 'GROWTH', message: 'Gmail is available on Growth plan and above.', benefits: ['Draft and send email follow-ups', 'Use lead variables', 'Automate replies'] },
  'integration.facebook': { requiredPlan: 'GROWTH', message: 'Facebook Lead Ads is available on Growth plan and above.', benefits: ['Capture ad leads', 'Trigger workflows', 'Route leads to follow-ups'] },
  'integration.whatsapp': { requiredPlan: 'GROWTH', message: 'WhatsApp is available on Growth plan and above.', benefits: ['Connect WhatsApp Cloud API', 'Draft or send replies', 'Follow up hot leads'] },
  'integration.instagram': { requiredPlan: 'GROWTH', message: 'Instagram DM is available on Growth plan and above.', benefits: ['Capture Instagram DMs', 'Trigger AI replies', 'Save DM users as leads'] },
  'automation.create': { requiredPlan: 'STARTER', message: 'Automation starts from Starter plan.', benefits: ['Build lead workflows', 'Run follow-up actions', 'Save owner time'] },
  'automation.execute': { requiredPlan: 'STARTER', message: 'Automation execution starts from Starter plan.', benefits: ['Run workflows', 'Create tasks and drafts', 'Track execution history'] },
  'automation.steps': { requiredPlan: 'STARTER', message: 'Your plan controls maximum workflow steps.', benefits: ['Add more workflow blocks', 'Branch with conditions', 'Build richer automations'] },
  'ai.thinking': { requiredPlan: 'PRO', message: 'Thinking mode is available on Pro plan.', benefits: ['Deeper reasoning', 'Multi-source answers', 'Consumes 3 queries per response'] },
  'api.access': { requiredPlan: 'PRO', message: 'API access is available on Pro plan.', benefits: ['Use B9 from your product', 'Create custom integrations', 'Automate external systems'] },
  'webhook.access': { requiredPlan: 'PRO', message: 'Webhooks are available on Pro plan.', benefits: ['Trigger workflows from tools', 'Connect forms and CRMs', 'Run event-based automations'] },
  white_label: { requiredPlan: 'BUSINESS', message: 'Full white-label is available on Business plan.', benefits: ['Remove B9 branding', 'Use custom domain', 'Own client-facing brand'] },
  premium_widget: { requiredPlan: 'PRO', message: 'Premium 3D widget is available on Pro plan.', benefits: ['Premium website launcher', 'More visual polish', 'Higher-converting widget UX'] },
};

export const PLAN_LIMITS_UI: Record<PlanKey, { workflowSteps: number; activeWorkflows: number; domains: number; widgets: number }> = {
  FREE: { workflowSteps: 0, activeWorkflows: 0, domains: 0, widgets: 0 },
  STARTER: { workflowSteps: 2, activeWorkflows: 1, domains: 1, widgets: 1 },
  GROWTH: { workflowSteps: 5, activeWorkflows: 3, domains: 2, widgets: 2 },
  PRO: { workflowSteps: 10, activeWorkflows: 5, domains: 5, widgets: 5 },
  BUSINESS: { workflowSteps: 20, activeWorkflows: 15, domains: 15, widgets: 15 },
};

export function normalizePlan(plan?: string): PlanKey {
  const normalized = String(plan || 'FREE').toUpperCase() as PlanKey;
  return PLAN_ORDER[normalized] === undefined ? 'FREE' : normalized;
}

export function isPlanAtLeast(plan: string | undefined, requiredPlan: PlanKey) {
  return PLAN_ORDER[normalizePlan(plan)] >= PLAN_ORDER[requiredPlan];
}

export function featureForProvider(provider: string): FeatureKey {
  const value = provider.toLowerCase();
  if (value === 'google_sheets') return FEATURES.integrationGoogleSheets;
  if (value === 'gmail') return FEATURES.integrationGmail;
  if (value === 'facebook' || value === 'facebook_lead_ads') return FEATURES.integrationFacebook;
  if (value === 'meta' || value === 'whatsapp' || value === 'whatsapp_cloud_api') return FEATURES.integrationWhatsapp;
  if (value === 'instagram' || value === 'instagram_dm') return FEATURES.integrationInstagram;
  if (value === 'webhook') return FEATURES.webhookAccess;
  return FEATURES.apiAccess;
}
