// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'FREE' | 'STARTER' | 'GROWTH' | 'PRO' | 'BUSINESS';
  subscription_status: string;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

// Workspace
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  is_public: boolean;
  assistants_count?: number;
  created_at: string;
}

// Assistant
export interface Assistant {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  language: string;
  temperature: number;
  allowed_model?: string;
  chat_provider?: 'groq' | 'gemini';
  chat_model?: string;
  automation_provider?: string;
  automation_model?: string;
  is_public: boolean;
  lead_capture_enabled?: boolean;
  total_queries: number;
  created_at: string;
  icon?: string;
}

// Document
export interface Document {
  id: string;
  title: string;
  source_type: string;
  purpose?: string;
  source_purpose?: string;
  is_indexed: boolean;
  content_length: number;
  created_at: string;
  pages?: number;
  source_url?: string;
  source_metadata?: Record<string, any>;
}

// Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokens_used?: number;
  sources?: string[];
}

export interface ChatSession {
  id: string;
  assistant_id: string;
  messages: ChatMessage[];
  created_at: string;
}

// Quota
export interface QuotaStatus {
  plan: string;
  queries_used: number;
  queries_limit: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  uploads_used: number;
  uploads_limit: number;
  assistants_created: number;
  assistants_limit: number;
  days_remaining: number;
}

// Plan
export interface Plan {
  type: string;
  name: string;
  price: number;
  annual_price?: number;
  description: string;
  features: string[];
  color: string;
  cta: string;
  bestFor?: string;
  watermark?: string;
  integrations?: string;
  automation?: string;
}

// Invoice
export interface Invoice {
  id: string;
  invoice_number: string;
  plan_type: string;
  amount: number;
  status: string;
  billing_period_start: string;
  billing_period_end: string;
  paid_at?: string;
}

export interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  requirement?: string;
  source: string;
  status: string;
  widget_id?: string;
  conversation_id?: string;
  visitor_id?: string;
  tag?: string;
  metadata?: Record<string, any>;
  ai_summary?: string;
  lead_score: number;
  score_label?: 'hot' | 'warm' | 'cold';
  score_reason?: string;
  next_follow_up_at?: string;
  budget?: string;
  timeline?: string;
  created_at: string;
  updated_at?: string;
}

export interface GeneratedContent {
  id: string;
  content_type: string;
  title?: string;
  content: string;
  hashtags?: string;
  status: string;
  platform?: string;
  scheduled_at?: string;
  created_at: string;
}

export interface AutomationRun {
  id: string;
  intent?: string;
  status: string;
  user_message?: string;
  final_response?: string;
  started_at: string;
}

export interface AutomationTool {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  required_plan: string;
  is_active: boolean;
}

export interface AutomationWorkflow {
  id: string;
  workspace_id: string;
  assistant_id?: string;
  name: string;
  description?: string;
  trigger_type: string;
  status: string;
  required_plan: string;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AutomationBlock {
  id: string;
  workflow_id: string;
  block_type: string;
  name: string;
  description?: string;
  order_index: number;
  config?: Record<string, unknown>;
  created_at: string;
}

export interface DocumentRoute {
  id: string;
  name: string;
  keywords?: string[];
  document_ids?: string[];
  fallback_action: string;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface OutboundMessage {
  id: string;
  channel: string;
  recipient?: string;
  message: string;
  status: string;
  provider?: string;
  provider_ref?: string;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface AutomationIntegration {
  id: string;
  provider: string;
  channel: string;
  status: string;
  config?: Record<string, unknown>;
  created_at: string;
}

export interface IntegrationCatalogItem {
  provider: string;
  channel: string;
  label: string;
  description: string;
  required_plan: string;
  mode: string;
  status: string;
  connected: boolean;
  config?: Record<string, unknown>;
}

export interface BusinessProfile {
  id: string;
  workspace_id: string;
  business_name: string;
  business_type: string;
  industry?: string;
  target_audience?: string;
  website_url?: string;
  whatsapp_number?: string;
  instagram_handle?: string;
  business_description?: string;
  services?: string;
  primary_goal?: string;
  setup_completed_at?: string;
  metadata?: Record<string, unknown>;
  tone: string;
  language: string;
  created_at: string;
  updated_at: string;
}
