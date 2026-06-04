'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import toast from 'react-hot-toast';
import {
  Background,
  Connection,
  ConnectionMode,
  Controls,
  Edge,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  AlertTriangle,
  Bell,
  Bot,
  Brain,
  Calendar,
  Camera,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  GitBranch,
  Globe,
  Link,
  Link2,
  Mail,
  Maximize2,
  MessageCircle,
  Minimize2,
  Monitor,
  MousePointer2,
  Play,
  Plus,
  RefreshCw,
  Route,
  Save,
  Send,
  ShoppingCart,
  Sparkles,
  Star,
  Table2,
  Trash2,
  UserCheck,
  Workflow,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/button';
import { UpgradeModal } from '@/components/upgrade-modal';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { AutomationRun, AutomationWorkflow, IntegrationCatalogItem } from '@/types';
import { DEFAULT_INDUSTRY_PACK, IndustryPack } from '@/lib/industry-packs';
import { FeatureKey } from '@/lib/billing/features';

type BlockType = 'trigger' | 'ai' | 'condition' | 'action';

interface BuilderBlock {
  id: string;
  type: BlockType;
  title: string;
  description: string;
  x: number;
  y: number;
  config: Record<string, any>;
}

interface BuilderEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

interface LibraryBlock {
  type: BlockType;
  title: string;
  description: string;
  config: Record<string, any>;
}

interface WorkflowValidationResult {
  ready: boolean;
  blockers: Array<{ node: string; message: string; provider?: string }>;
  warnings: Array<{ node: string; message: string; provider?: string }>;
  reachable_nodes?: string[];
  trigger_paths?: Array<{ node_id: string; trigger_type: string; reachable_nodes: string[]; has_outgoing: boolean }>;
}

const FLOW_CENTER_Y = 280;   // main pipeline Y
const BRANCH_OFFSET_Y = 220; // vertical gap per leaf slot — tighter like n8n
const FLOW_START_X = 80;
const FLOW_GAP_X = 300;      // horizontal gap — node is 220px + 80px gap = clean
const AUTOSAVE_KEY = 'brainai:automation-builder:v1';

const blockStyles = {
  trigger: 'border-red-300/30 bg-gradient-to-br from-red-500/20 to-orange-500/10 text-red-100 shadow-red-500/10',
  ai: 'border-violet-300/30 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-violet-100 shadow-violet-500/10',
  condition: 'border-amber-300/30 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 text-amber-100 shadow-amber-500/10',
  action: 'border-emerald-300/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-100 shadow-emerald-500/10',
};

const blockIcons = {
  trigger: MousePointer2,
  ai: Bot,
  condition: GitBranch,
  action: Send,
};

const baseLibrary: LibraryBlock[] = [
  { type: 'trigger', title: 'New Website Lead', description: 'Runs when a new lead is captured from website widget.', config: { trigger_type: 'new_website_lead', source: 'website_widget' } },
  { type: 'trigger', title: 'All Leads Sheet', description: 'Runs using lead data from the connected Google Sheet.', config: { trigger_type: 'all_leads_sheet', source: 'google_sheets', mode: 'manual_all_rows' } },
  { type: 'trigger', title: 'New Lead', description: 'Starts when chatbot captures a lead.', config: { trigger_type: 'new_lead' } },
  { type: 'trigger', title: 'Chat Message', description: 'Starts when a visitor asks a matching question.', config: { trigger_type: 'chat_command' } },
  { type: 'trigger', title: 'Document Uploaded', description: 'Runs after a new document is added.', config: { trigger_type: 'document_uploaded' } },
  { type: 'trigger', title: 'Inbound Webhook', description: 'Receive data from Typeform, Facebook Ads, Zapier, Make or any external tool.', config: { trigger_type: 'webhook' } },
  { type: 'trigger', title: 'New WhatsApp Lead', description: 'Runs when a new WhatsApp contact becomes a lead.', config: { trigger_type: 'new_whatsapp_lead', source: 'whatsapp' } },
  { type: 'trigger', title: 'New WhatsApp Message', description: 'Runs on every incoming WhatsApp message.', config: { trigger_type: 'new_whatsapp_message', source: 'whatsapp' } },
  { type: 'trigger', title: 'New Gmail Email', description: 'Runs when a new email is received in connected Gmail.', config: { trigger_type: 'new_gmail_email', source: 'gmail', unread_only: 'true' } },
  { type: 'trigger', title: 'New Facebook Lead', description: 'Runs when a new lead is captured from Facebook Lead Ads.', config: { trigger_type: 'new_facebook_lead', source: 'facebook' } },
  { type: 'trigger', title: 'New Instagram Lead', description: 'Runs when a new Instagram DM user becomes a lead.', config: { trigger_type: 'new_instagram_lead', source: 'instagram' } },
  { type: 'trigger', title: 'New Instagram Message', description: 'Runs on every incoming Instagram DM.', config: { trigger_type: 'new_instagram_message', source: 'instagram' } },
  { type: 'trigger', title: 'Payment Success', description: 'Fires after a successful Razorpay payment.', config: { trigger_type: 'payment_success' } },
  { type: 'trigger', title: 'IndiaMART Lead', description: 'Auto-polls IndiaMART every 15 min for new buyer leads.', config: { trigger_type: 'indiamart' } },
  { type: 'ai', title: 'Agentic AI (Auto)', description: 'Agentic AI decides which approved tools to call: reply, catalog, payment, handover, and follow-up.', config: { tool: 'agentic_agent', max_steps: '4', max_messages: '2', send_mode: 'live', handover_enabled: 'true', template_fallback_enabled: 'true' } },
  { type: 'ai', title: 'AI Agent', description: 'Gemini Flash reply using lead, message and knowledge context.', config: { tool: 'ai_agent', tone: 'Friendly', response_length: 'Short', use_knowledge_base: 'true', use_previous_data: 'true' } },
  { type: 'ai', title: 'Conversation Flow', description: 'Uses uploaded chatbot flow PDF to decide the next reply.', config: { tool: 'conversation_flow_pdf', strict_mode: 'true', fallback_instruction: 'Ask one clarification question or hand over to team if flow is unclear.' } },
  { type: 'ai', title: 'Document Search', description: 'Find the right answer from uploaded docs.', config: { tool: 'document_routing' } },
  { type: 'ai', title: 'Capture Lead Details', description: 'Extract name, phone, email and requirement.', config: { tool: 'extract_structured_data', fields: 'name, phone, email, requirement' } },
  { type: 'ai', title: 'Score Lead', description: 'Mark lead as hot, warm or cold.', config: { tool: 'evaluate_condition' } },
  { type: 'condition', title: 'If Lead Is Hot', description: 'Branch when urgency or buying intent is detected.', config: { field: 'lead_score', operator: 'greater_than', value: '7', then_action: 'notify_owner', else_action: 'create_task' } },
  { type: 'condition', title: 'If AI Confidence Low', description: 'Escalate when AI is not confident.', config: { field: 'extraction.confidence', operator: 'confidence_below', value: '0.7', then_action: 'human_handover', else_action: 'reply' } },
  { type: 'action', title: 'Send WhatsApp Message', description: 'Send WhatsApp text or approved template.', config: { tool: 'send_whatsapp_message', recipient: '{{lead.phone}}', message_body: '{{flow.flowResponse}}', message_mode: 'text', language_code: 'en_US' } },
  { type: 'action', title: 'Send Image', description: 'Send a JPG/PNG image to customer via WhatsApp.', config: { tool: 'send_whatsapp_media', recipient: '{{lead.phone}}', media_type: 'image', media_url: '', caption: '', send_mode: 'live' } },
  { type: 'action', title: 'Send PDF / Document', description: 'Send a PDF or document to customer via WhatsApp.', config: { tool: 'send_whatsapp_media', recipient: '{{lead.phone}}', media_type: 'document', media_url: '', caption: '', filename: 'document.pdf', send_mode: 'live' } },
  { type: 'action', title: 'Send Video', description: 'Send a video to customer via WhatsApp.', config: { tool: 'send_whatsapp_media', recipient: '{{lead.phone}}', media_type: 'video', media_url: '', caption: '', send_mode: 'live' } },
  { type: 'action', title: 'Send Instagram DM', description: 'Send AI replies to Instagram DM users.', config: { tool: 'send_instagram_dm', recipient: '{{instagram.senderId}}', message_body: '{{flow.flowResponse}}' } },
  { type: 'action', title: 'Send Email', description: 'Send email via Gmail OAuth or SMTP.', config: { tool: 'send_email' } },
  { type: 'action', title: 'Create Draft Reply', description: 'Recommended Gmail action: AI creates a draft for approval.', config: { tool: 'create_gmail_draft_reply', gmail_message_id: '{{email.gmailMessageId}}', subject: 'Re: {{email.subject}}', body: '{{flow.flowResponse}}' } },
  { type: 'action', title: 'Send Gmail Reply', description: 'Send a Gmail reply only when auto-send and safety checks allow it.', config: { tool: 'send_gmail_reply', gmail_message_id: '{{email.gmailMessageId}}', subject: 'Re: {{email.subject}}', body: '{{flow.flowResponse}}', auto_send: 'false', min_confidence: '0.85' } },
  { type: 'action', title: 'Mark Email as Read', description: 'Mark the incoming Gmail message as read.', config: { tool: 'mark_gmail_read', gmail_message_id: '{{email.gmailMessageId}}' } },
  { type: 'action', title: 'Add Gmail Label', description: 'Apply a label to the Gmail message.', config: { tool: 'add_gmail_label', gmail_message_id: '{{email.gmailMessageId}}', label_name: 'B9 Automation' } },
  { type: 'action', title: 'Sync CRM', description: 'Push lead details to Zoho/HubSpot.', config: { tool: 'push_to_crm' } },
  { type: 'action', title: 'Sync to Sheet', description: 'Append lead data to Google Sheets.', config: { tool: 'sync_to_sheet' } },
  { type: 'action', title: 'Add Row to Google Sheet', description: 'Adds lead, AI, or workflow data to selected Google Sheet.', config: { tool: 'add_row_google_sheet', column_mapping: { Name: '{{lead.name}}', Phone: '{{lead.phone}}', Email: '{{lead.email}}', Message: '{{lead.message}}', Status: '{{lead.status}}' } } },
  { type: 'action', title: 'Book Meeting', description: 'Create Calendly/Calendar booking task.', config: { tool: 'book_meeting' } },
  { type: 'action', title: 'Notify Owner', description: 'Alert owner via Telegram, Slack or Email.', config: { tool: 'notify_owner' } },
  { type: 'action', title: 'HTTP Request', description: 'Call any external API with GET, POST, PUT, or DELETE.', config: { tool: 'http_request', method: 'POST', url: '', headers: [], body: '' } },
  { type: 'action', title: 'Set Variable', description: 'Create or transform variables using {{placeholders}} from previous nodes.', config: { tool: 'set_variable', variables: {} } },
  { type: 'action', title: 'Wait / Delay', description: 'Pause workflow and resume after a set time.', config: { tool: 'wait_node', delay_minutes: 60 } },
  { type: 'action', title: 'Loop Items', description: 'Run the next action for each item in a list.', config: { tool: 'loop' } },
  { type: 'action', title: 'Request Approval', description: 'Pause and send approval link to owner via Telegram/Email/WhatsApp.', config: { tool: 'request_approval', channel: 'telegram' } },
  { type: 'action', title: 'GST Invoice', description: 'Generate GST-compliant invoice draft from lead data (India).', config: { tool: 'generate_gst_invoice', gst_rate: '18' } },
  { type: 'condition', title: 'AI Condition', description: 'Ask AI a yes/no question to decide the next step.', config: { tool: 'ai_condition', condition_prompt: '' } },
];

// Simplified Phase-1 node library — friendly names, same backend tool configs.
// baseLibrary (full 35-node set) is kept intact for future "Advanced" mode.
const visibleLibrary: LibraryBlock[] = [
  // ── Triggers ──────────────────────────────────────────────────────────────
  { type: 'trigger', title: 'New Website Lead', description: 'Lead captured from your website widget.', config: { trigger_type: 'new_website_lead', source: 'website_widget' } },
  { type: 'trigger', title: 'New WhatsApp Message', description: 'Incoming WhatsApp message from a contact.', config: { trigger_type: 'new_whatsapp_message', source: 'whatsapp' } },
  { type: 'trigger', title: 'New Facebook Lead', description: 'Lead submitted via Facebook Lead Ads form.', config: { trigger_type: 'new_facebook_lead', source: 'facebook' } },
  { type: 'trigger', title: 'New Instagram Message', description: 'Incoming Instagram DM from a follower or customer.', config: { trigger_type: 'new_instagram_message', source: 'instagram' } },
  { type: 'trigger', title: 'New Facebook Message', description: 'Incoming Facebook Messenger message from a user.', config: { trigger_type: 'new_facebook_message', source: 'facebook' } },
  { type: 'trigger', title: 'New Google Sheet Row', description: 'Runs for each row in your connected Google Sheet.', config: { trigger_type: 'all_leads_sheet', source: 'google_sheets', mode: 'manual_all_rows' } },
  { type: 'trigger', title: 'Manual Run', description: 'Trigger this flow manually from the Test button.', config: { trigger_type: 'manual_run' } },
  // ── AI Agent ──────────────────────────────────────────────────────────────
  { type: 'ai', title: 'Qualify Lead', description: 'Extract name, phone, email and requirement from the message.', config: { tool: 'extract_structured_data', fields: 'name, phone, email, requirement' } },
  { type: 'ai', title: 'Generate Reply', description: 'AI writes a reply using your knowledge base.', config: { tool: 'ai_agent', tone: 'Friendly', response_length: 'Short', use_knowledge_base: 'true', use_previous_data: 'true' } },
  { type: 'ai', title: 'Summarize Conversation', description: 'AI creates a short 2-3 line summary of this lead conversation.', config: { tool: 'ai_agent', custom_prompt: 'Summarize this conversation in 2-3 lines. Include name, phone, and key requirement.', response_length: 'Short', use_previous_data: 'true' } },
  { type: 'ai', title: 'Score Lead', description: 'AI marks lead as Hot, Warm or Cold based on buying intent.', config: { tool: 'ai_agent', custom_prompt: 'Score this lead as HOT, WARM or COLD based on urgency and buying intent. Reply with only: HOT, WARM, or COLD.', response_length: 'Short' } },
  // ── Logic ─────────────────────────────────────────────────────────────────
  { type: 'condition', title: 'Is New Customer?', description: 'Branch YES for first-time customers (never messaged before), NO for returning customers.', config: { field: 'lead.is_new', operator: 'equals', value: 'true' } },
  { type: 'condition', title: 'If Flow: Show Catalog', description: 'Branch YES when AI flow wants to show product catalog.', config: { field: 'flow.intent', operator: 'equals', value: 'show_catalog' } },
  { type: 'condition', title: 'If Flow: Collect Form', description: 'Branch YES when AI flow wants to collect customer details.', config: { field: 'flow.intent', operator: 'equals', value: 'collect_form' } },
  { type: 'condition', title: 'If Flow: Take Payment', description: 'Branch YES when AI flow wants to send payment link.', config: { field: 'flow.intent', operator: 'equals', value: 'take_payment' } },
  { type: 'condition', title: 'If Flow: Handover', description: 'Branch YES when AI decides human agent is needed.', config: { field: 'flow.intent', operator: 'equals', value: 'handover' } },
  { type: 'condition', title: 'If Hot Lead', description: 'Branch YES if AI scored this lead as HOT.', config: { field: 'lead_score', operator: 'greater_than', value: '7', then_action: 'notify_owner', else_action: 'create_task' } },
  { type: 'condition', title: 'Decide Next Step', description: 'Ask AI a Yes/No question to choose the next path.', config: { tool: 'ai_condition', condition_prompt: 'Does this lead want to book a demo or meeting?' } },
  { type: 'action', title: 'Schedule Reminder', description: 'Schedule a WhatsApp follow-up reminder to send automatically after X hours or days.', config: { tool: 'schedule_followup', hours: '24', days: '0', message: 'Hi {{lead.name}}, just checking in! Do you need any help?' } },
  { type: 'action', title: 'Wait 1 Hour', description: 'Pause the flow for 1 hour before the next step.', config: { tool: 'wait_node', delay_minutes: 60 } },
  // ── Actions ───────────────────────────────────────────────────────────────
  { type: 'action', title: 'Send WhatsApp', description: 'Send WhatsApp message or approved template to the lead.', config: { tool: 'send_whatsapp_message', recipient: '{{lead.phone}}', message_body: '{{ai.response}}', message_mode: 'text', send_mode: 'live', language_code: 'en_US' } },
  { type: 'action', title: 'Send Image', description: 'Send a JPG/PNG image to customer via WhatsApp. Use for product photos, flyers, brochure covers.', config: { tool: 'send_whatsapp_media', recipient: '{{lead.phone}}', media_type: 'image', media_url: '', caption: '', send_mode: 'live' } },
  { type: 'action', title: 'Send PDF / Document', description: 'Send a PDF brochure, price list, invoice or any document to customer via WhatsApp.', config: { tool: 'send_whatsapp_media', recipient: '{{lead.phone}}', media_type: 'document', media_url: '', caption: 'Please find the document attached', filename: 'document.pdf', send_mode: 'live' } },
  { type: 'action', title: 'Send Video', description: 'Send a product demo, explainer, or testimonial video to customer via WhatsApp.', config: { tool: 'send_whatsapp_media', recipient: '{{lead.phone}}', media_type: 'video', media_url: '', caption: '', send_mode: 'live' } },
  { type: 'action', title: 'Send WhatsApp Menu', description: 'Send an interactive list/menu message with up to 10 options for the customer to choose from.', config: { tool: 'send_whatsapp_list_message', recipient: '{{lead.phone}}', body_text: 'Please choose a service:', button_text: 'View Options', send_mode: 'live', sections: '[{"title":"Services","rows":[{"id":"opt_1","title":"Option 1"},{"id":"opt_2","title":"Option 2"}]}]' } },
  { type: 'action', title: 'WhatsApp Buttons (3)', description: 'Send up to 3 quick-reply buttons that customers can tap instantly.', config: { tool: 'send_whatsapp_buttons', recipient: '{{lead.phone}}', body_text: 'Which option suits you best?', buttons: '[{"id":"btn_0","title":"Option 1"},{"id":"btn_1","title":"Option 2"},{"id":"btn_2","title":"Option 3"}]', send_mode: 'live' } },
  { type: 'action', title: 'WhatsApp CTA Button', description: 'Send a call-to-action button that opens a URL or calls a phone number.', config: { tool: 'send_whatsapp_cta', recipient: '{{lead.phone}}', body_text: 'Click below to learn more:', buttons: '[{"type":"url","text":"Visit Website","url":"https://your-site.com"}]', send_mode: 'live' } },
  { type: 'action', title: 'WhatsApp Form (Flow)', description: 'Open an interactive Meta WhatsApp Flow for surveys, booking forms, and lead capture inside chat.', config: { tool: 'send_whatsapp_meta_flow', recipient: '{{lead.phone}}', flow_id: '', cta_text: 'Fill Form', body_text: 'Please fill in your details below:', send_mode: 'live' } },
  { type: 'action', title: 'Send Contact Card', description: 'Share a contact (vCard) — name, phone, email, company — directly in WhatsApp chat.', config: { tool: 'send_contact_card', recipient: '{{lead.phone}}', contact_name: 'John Doe', contact_phone: '+91 XXXXX XXXXX', contact_email: '', contact_org: '', send_mode: 'live' } },
  { type: 'action', title: 'Send Location', description: 'Send your business location pin to the customer via WhatsApp with name and address.', config: { tool: 'send_whatsapp_location', recipient: '{{lead.phone}}', latitude: '28.6139', longitude: '77.2090', name: 'Our Office', address: '123 Business Park, New Delhi', send_mode: 'live' } },
  { type: 'action', title: 'Send Single Product', description: 'Send a single product card from your Meta catalog with a Buy Now button.', config: { tool: 'send_whatsapp_single_product', recipient: '{{lead.phone}}', catalog_id: '', product_retailer_id: '', body_text: 'Check out this product:', send_mode: 'live' } },
  { type: 'action', title: 'Get Inbound Media URL', description: 'When a customer sends an image/video/document, fetch its download URL for processing.', config: { tool: 'get_whatsapp_media_url', media_id: '{{message.media_id}}' } },
  { type: 'action', title: 'Request Payment (UPI)', description: 'Send a WhatsApp Pay UPI payment request. Requires WhatsApp Pay enabled on your Meta account.', config: { tool: 'send_whatsapp_payment_request', recipient: '{{lead.phone}}', amount: '{{extraction.fields.amount}}', description: 'Payment for your order', reference_id: '', send_mode: 'live' } },
  { type: 'action', title: 'Chat Flow Reply', description: 'Send a step-by-step reply from the uploaded conversation flow PDF, including buttons when choices exist.', config: { tool: 'send_whatsapp_flow_message', recipient: '{{lead.phone}}', send_mode: 'live' } },
  { type: 'action', title: 'Send Instagram DM', description: 'Reply to the Instagram DM with an AI-generated message.', config: { tool: 'send_instagram_dm', recipient: '{{instagram.senderId}}', message_body: '{{ai.response}}', send_mode: 'live' } },
  { type: 'action', title: 'Send Facebook Message', description: 'Reply to the Facebook Messenger message with an AI response.', config: { tool: 'send_facebook_message', recipient: '{{facebook.senderId}}', message_body: '{{ai.response}}', send_mode: 'live' } },
  { type: 'action', title: 'Send Catalog', description: 'Send your product catalog via WhatsApp with Buy buttons for top 3 products.', config: { tool: 'send_catalog', recipient: '{{lead.phone}}', send_mode: 'live', intro_text: 'Please review our products:' } },
  { type: 'action', title: 'Collect Order Form', description: 'AI asks step-by-step questions to collect product choice, name, phone, address.', config: { tool: 'collect_order_form', fields: 'name, phone, product_choice, quantity, address' } },
  { type: 'action', title: 'Send Payment Link', description: 'Create a Razorpay payment link and send it to the customer via WhatsApp.', config: { tool: 'create_customer_payment_link', amount: '{{extraction.fields.budget}}', description: 'Payment for {{extraction.fields.product_choice}}', recipient_phone: '{{lead.phone}}', send_mode: 'live', send_via_whatsapp: 'true' } },
  { type: 'action', title: 'Generate GST Invoice', description: 'Create a GST-compliant invoice from order data and send via WhatsApp.', config: { tool: 'generate_gst_invoice', gst_rate: '18', buyer_name: '{{lead.name}}' } },
  { type: 'action', title: 'Send Email', description: 'Send an email to the lead using your connected Gmail account.', config: { tool: 'send_email', to: '{{lead.email}}', subject: 'Thank you for your inquiry', body: '{{ai.response}}' } },
  // ── Smart AI nodes ────────────────────────────────────────────────────────
  { type: 'trigger', title: 'Follow-up Due', description: 'Fires automatically when a lead\'s scheduled follow-up time is reached (every 15 min check).', config: { trigger_type: 'follow_up_due' } },
  { type: 'ai', title: 'Score Lead with AI', description: 'AI analyzes message intent in Hindi/Hinglish/English and scores 1-10. More accurate than keyword rules.', config: { tool: 'ai_score_lead' } },
  { type: 'ai', title: 'Analyze Sentiment', description: 'Detect if customer is happy, neutral, frustrated, or complaining. Use with condition nodes to route complaints.', config: { tool: 'analyze_sentiment' } },
  { type: 'ai', title: 'Detect Language', description: 'Auto-detect Hindi/English/Hinglish from the message. AI replies will automatically use the detected language.', config: { tool: 'detect_language' } },
  { type: 'ai', title: 'Recommend Product', description: 'AI matches customer query to your Product Catalog and recommends the best matching products.', config: { tool: 'recommend_products' } },
  { type: 'ai', title: 'Agentic AI (Auto)', description: 'AI decides the next safe tool call: reply, catalog, payment, follow-up, or handover.', config: { tool: 'agentic_agent', max_steps: '4', max_messages: '2', send_mode: 'live', handover_enabled: 'true', template_fallback_enabled: 'true' } },
  { type: 'condition', title: 'If Complaint', description: 'Branch YES if customer is complaining, frustrated, or unhappy. Connect to Auto Handover for escalation.', config: { tool: 'ai_condition', condition_prompt: 'Is this customer making a complaint, expressing frustration, or asking for a manager/human?' } },
  { type: 'condition', title: 'If Price Inquiry', description: 'Branch YES if customer is asking about price, cost, fees, or charges.', config: { tool: 'ai_condition', condition_prompt: 'Is the customer asking about price, fees, cost, charges, or how much it costs?' } },
  { type: 'condition', title: 'If Booking Request', description: 'Branch YES if customer wants to book, schedule, or make an appointment.', config: { tool: 'ai_condition', condition_prompt: 'Does the customer want to book, schedule an appointment, or register for something?' } },
  { type: 'condition', title: 'If 24h Window Open', description: 'Branch YES if customer messaged within last 24 hours (free WhatsApp reply allowed). Branch NO = must use template.', config: { tool: 'ai_condition', condition_prompt: 'Is there a recent conversation (within 24 hours) in context.whatsapp? Has the customer sent a message recently?' } },
  { type: 'action', title: 'Auto Handover', description: 'Escalate to human: update lead status to contacted + notify owner immediately via Telegram/WhatsApp.', config: { tool: 'auto_handover', reason: '{{flow.reason}}', notify_via: 'telegram' } },
  { type: 'action', title: 'Save to Google Sheet', description: 'Add lead name, phone, email and AI reply to your Sheet.', config: { tool: 'add_row_google_sheet', column_mapping: { Name: '{{lead.name}}', Phone: '{{lead.phone}}', Email: '{{lead.email}}', Message: '{{lead.message}}', 'AI Reply': '{{ai.response}}', Status: '{{lead.status}}' } } },
  { type: 'action', title: 'Create Task', description: 'Add a follow-up task to your B9 task board.', config: { tool: 'create_task' } },
  { type: 'action', title: 'Notify Owner', description: 'Alert you via Telegram, Slack or Email when a hot lead arrives.', config: { tool: 'notify_owner', provider: 'telegram', notify_when: 'hot_lead' } },
];

const samplePrompts: Record<string, string> = {
  real_estate: 'My name is Amit. I am looking for a 3BHK, my budget is 65 lakh, and I want a Saturday site visit. Phone XXXXXXXXXX.',
  coaching: 'I want a Class 12 Physics demo. My name is Rahul and my phone is XXXXXXXXXX.',
  gym: 'I want to book a gym trial class. Please share the weight loss plan and fees. Phone XXXXXXXXXX.',
  salon: 'What is the price for a hair spa and can I get an appointment on Sunday? Phone XXXXXXXXXX.',
  healthcare: 'I want to meet a doctor. I have had stomach pain since yesterday. Phone XXXXXXXXXX.',
  it_agency: 'I want a CRM software demo. My budget is 5000 dollars. Phone XXXXXXXXXX.',
  custom: 'I want pricing and a demo. My phone is XXXXXXXXXX.',
};

const providerOptions = {
  whatsapp: ['meta', 'draft'],
  email: ['gmail'],
  sheet: ['google_sheets'],
  crm: ['zoho', 'hubspot'],
  meeting: ['calendly'],
  notify: ['telegram', 'slack', 'email'],
};

const recipientSources = [
  { value: 'lead_phone', label: 'Lead phone from chatbot' },
  { value: 'lead_email', label: 'Lead email from chatbot' },
  { value: 'owner', label: 'Business owner/admin' },
  { value: 'custom', label: 'Custom value' },
];

const makeNode = (block: LibraryBlock, x: number, y: number): BuilderBlock => ({
  id: `node-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type: block.type,
  title: block.title,
  description: block.description,
  x,
  y,
  config: { ...block.config },
});

const findBlock = (title: string): LibraryBlock =>
  visibleLibrary.find((b) => b.title === title) ?? visibleLibrary[0];

export default function AutomationsPage() {
  const { get, post, put, delete: del } = useApi();
  const planAccess = usePlanAccess('automation.create');
  const [industryPack, setIndustryPack] = useState<IndustryPack>(DEFAULT_INDUSTRY_PACK);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationCatalogItem[]>([]);
  const [workflowName, setWorkflowName] = useState('Visual Lead Automation');
  const [activeWorkflowId, setActiveWorkflowId] = useState('');
  const [nodes, setNodes] = useState<BuilderBlock[]>([]);
  const [edges, setEdges] = useState<BuilderEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  // Undo/Redo history
  const [history, setHistory] = useState<{ nodes: BuilderBlock[]; edges: BuilderEdge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const skipHistoryRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState(samplePrompts.custom);
  const [testLeadName, setTestLeadName] = useState('Rahul Sharma');
  const [testLeadPhone, setTestLeadPhone] = useState('XXXXXXXXXX');
  const [testLeadEmail, setTestLeadEmail] = useState('');
  const [testLeadStatus, setTestLeadStatus] = useState('new');
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, any>>({});
  const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(new Set());
  const [timeline, setTimeline] = useState<any[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [activeNodeIds, setActiveNodeIds] = useState<Set<string>>(new Set());
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(new Set());
  const [failedNodeIds, setFailedNodeIds] = useState<Set<string>>(new Set());
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateDesc, setGenerateDesc] = useState('');
  const [generatePlatform, setGeneratePlatform] = useState('whatsapp');
  const [generating, setGenerating] = useState(false);
  const [showLaunchAssistant, setShowLaunchAssistant] = useState(false);
  const [launchDrafting, setLaunchDrafting] = useState(false);
  const [launchPlan, setLaunchPlan] = useState<any>(null);
  const [launchBrief, setLaunchBrief] = useState({
    business_name: '',
    industry: '',
    goal: '',
    products_services: '',
    target_customers: '',
    common_questions: '',
    channels: ['whatsapp', 'website'],
    language_style: 'English',
  });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<FeatureKey | null>(null);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [libraryMode, setLibraryMode] = useState<'beginner' | 'advanced'>('beginner');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backendValidation, setBackendValidation] = useState<WorkflowValidationResult | null>(null);
  const [autosaveReady, setAutosaveReady] = useState(false);
  const [lastAutosavedAt, setLastAutosavedAt] = useState('');
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const overflowMenuRef = useRef<HTMLDivElement>(null);
  const [showWorkflowList, setShowWorkflowList] = useState(true);
  const [wfLoading, setWfLoading] = useState(true);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const threeColRef = useRef<HTMLDivElement>(null);

  const toggleCanvasFullscreen = async () => {
    if (!document.fullscreenElement) {
      await threeColRef.current?.requestFullscreen().catch(() => {});
      setIsCanvasFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsCanvasFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setIsCanvasFullscreen(false); };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Warn user before leaving if they have unsaved nodes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (nodes.length > 0 && !activeWorkflowId) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [nodes.length, activeWorkflowId]);

  // Track history for undo/redo whenever nodes or edges change
  useEffect(() => {
    if (skipHistoryRef.current) { skipHistoryRef.current = false; return; }
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const snapshot = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };
      const last = trimmed[trimmed.length - 1];
      if (last && JSON.stringify(last) === JSON.stringify(snapshot)) return prev;
      const next = [...trimmed, snapshot].slice(-30); // keep last 30 snapshots
      setHistoryIndex(next.length - 1);
      return next;
    });
  }, [nodes, edges]); // eslint-disable-line

  const undo = () => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    skipHistoryRef.current = true;
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setHistoryIndex(i => i - 1);
  };
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    skipHistoryRef.current = true;
    setNodes(next.nodes);
    setEdges(next.edges);
    setHistoryIndex(i => i + 1);
  };
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Keyboard shortcuts: Ctrl+Z undo, Ctrl+Y / Ctrl+Shift+Z redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showWorkflowList) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // no deps — always reads latest undo/redo

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const validEdges = useMemo(() => {
    const nodeIds = new Set(nodes.map((node) => node.id));
    return edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  }, [edges, nodes]);
  const library = useMemo(() => {
    if (libraryMode === 'beginner') return visibleLibrary;
    const seen = new Set(visibleLibrary.map((block) => `${block.type}:${block.config?.tool || block.config?.trigger_type || block.title}`));
    const advancedOnly = baseLibrary.filter((block) => {
      const key = `${block.type}:${block.config?.tool || block.config?.trigger_type || block.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return [...visibleLibrary, ...advancedOnly];
  }, [libraryMode]);

  // Force send_mode:'live' on all action/ai nodes that have a send_mode field
  const forceLiveMode = (nodes: BuilderBlock[]): BuilderBlock[] =>
    nodes.map((n) =>
      (n.type === 'action' || n.type === 'ai') && n.config?.send_mode
        ? { ...n, config: { ...n.config, send_mode: 'live' } }
        : n
    );

  const arrangeNodes = (items: BuilderBlock[], edgeItems: BuilderEdge[]): BuilderBlock[] => {
    if (items.length === 0) return items;

    const nodeIds = new Set(items.map((n) => n.id));
    const valid = edgeItems.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    // Build child map — ordered: yes first (top), then (middle), no last (bottom)
    const childMap = new Map<string, Array<{ id: string; label: string }>>();
    const indegree = new Map<string, number>();
    items.forEach((n) => { childMap.set(n.id, []); indegree.set(n.id, 0); });

    const edgesBySource = new Map<string, BuilderEdge[]>();
    valid.forEach((e) => {
      if (!edgesBySource.has(e.source)) edgesBySource.set(e.source, []);
      edgesBySource.get(e.source)!.push(e);
      indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1);
    });
    edgesBySource.forEach((edges, src) => {
      const sorted = [...edges].sort((a, b) => {
        const rank = (e: BuilderEdge) => (e.label === 'yes' || e.sourceHandle === 'yes') ? 0 : (e.label === 'no' || e.sourceHandle === 'no') ? 2 : 1;
        return rank(a) - rank(b);
      });
      sorted.forEach((e) => childMap.get(src)!.push({ id: e.target, label: e.label || 'then' }));
    });

    // Find root
    const roots = items.filter((n) => n.type === 'trigger' || (indegree.get(n.id) ?? 0) === 0);
    const root = (roots.length ? roots : [items[0]])[0];

    // Count leaf nodes in each subtree (used to space vertically)
    const leafCount = new Map<string, number>();
    const visited1 = new Set<string>();
    const countLeaves = (id: string): number => {
      if (visited1.has(id)) return leafCount.get(id) ?? 1;
      visited1.add(id);
      const ch = childMap.get(id) ?? [];
      const total = ch.length === 0 ? 1 : ch.reduce((s, c) => s + countLeaves(c.id), 0);
      leafCount.set(id, total);
      return total;
    };
    countLeaves(root.id);

    // Assign positions: each node centered over its subtree
    const positions = new Map<string, { x: number; y: number }>();
    const visited2 = new Set<string>();
    const assignPos = (id: string, col: number, leafStart: number) => {
      if (visited2.has(id)) return;
      visited2.add(id);
      const myLeaves = leafCount.get(id) ?? 1;
      const centerLeaf = leafStart + (myLeaves - 1) / 2;
      positions.set(id, {
        x: FLOW_START_X + col * FLOW_GAP_X,
        y: centerLeaf * BRANCH_OFFSET_Y,
      });
      let offset = leafStart;
      for (const child of (childMap.get(id) ?? [])) {
        assignPos(child.id, col + 1, offset);
        offset += leafCount.get(child.id) ?? 1;
      }
    };

    const totalLeaves = leafCount.get(root.id) ?? 1;
    assignPos(root.id, 0, -(totalLeaves - 1) / 2);

    // Dynamic center Y: ensure no node goes above y=100 (top margin)
    // rawY_min = -(totalLeaves-1)/2 * BRANCH_OFFSET_Y
    const rawYMin = -(totalLeaves - 1) / 2 * BRANCH_OFFSET_Y;
    const dynamicCenterY = Math.max(FLOW_CENTER_Y, -rawYMin + 100);

    // Convert relative y → absolute
    const result = new Map<string, { x: number; y: number }>();
    positions.forEach((pos, id) => result.set(id, { x: pos.x, y: pos.y + dynamicCenterY }));

    // Place any disconnected nodes to the right
    let maxCol = result.size ? Math.max(...[...result.values()].map((p) => Math.round((p.x - FLOW_START_X) / FLOW_GAP_X))) : 0;
    items.forEach((n) => {
      if (!result.has(n.id)) {
        maxCol++;
        result.set(n.id, { x: FLOW_START_X + maxCol * FLOW_GAP_X, y: dynamicCenterY });
      }
    });

    return items.map((n) => ({ ...n, ...result.get(n.id) }));
  };

  // Nodes are stored with their real positions — no auto-rearrange on every render.
  // arrangeNodes() is only called by the user via the Arrange button or on template load.
  const layoutNodes = nodes;

  const autoArrangeFlow = () => {
    setNodes((items) => arrangeNodes(items, edges));
  };

  const refresh = (silent = false) => {
    if (!silent) setWfLoading(true);

    // Always stop loading after 10s even if API hangs
    const safetyTimer = setTimeout(() => setWfLoading(false), 10_000);

    // Wraps each call so a single failure never blocks the rest
    const bg = (url: string, fallback: any) =>
      get(url)
        .catch((e: any) => { if (!e.response) return { data: fallback }; throw e; })
        .catch(() => ({ data: fallback }));

    Promise.all([
      bg('/api/automation/workflows', []),
      bg('/api/automation/runs', []),
      bg('/api/automation/integrations/catalog', []),
      bg('/api/automation/onboarding/status', null),
    ]).then(([wfRes, runsRes, intRes, onbRes]) => {
      setWorkflows(wfRes.data || []);
      setRuns(runsRes.data || []);
      setIntegrations(intRes.data || []);
      const pack = onbRes.data?.industry_pack;
      if (pack) {
        setIndustryPack(pack);
        setTestMessage(samplePrompts[pack.key as keyof typeof samplePrompts] || samplePrompts.custom);
      }
    }).finally(() => {
      clearTimeout(safetyTimer);
      setWfLoading(false);
    });
  };

  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTOSAVE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (Array.isArray(draft.nodes) && draft.nodes.length > 0) {
          setWorkflowName(draft.workflowName || 'Unsaved Automation Draft');
          setActiveWorkflowId(draft.activeWorkflowId || '');
          setNodes(draft.nodes);
          setEdges(Array.isArray(draft.edges) ? draft.edges : []);
          setSelectedNodeId(draft.nodes[0]?.id || '');
          setLastAutosavedAt(draft.savedAt || '');
          toast.success('Recovered your unsaved automation draft');
        }
      }
    } catch {
      window.localStorage.removeItem(AUTOSAVE_KEY);
    } finally {
      setAutosaveReady(true);
    }
  }, []);

  useEffect(() => {
    if (autosaveReady && nodes.length === 0) {
      loadTemplate();
    }
  }, [autosaveReady, industryPack.key]);

  useEffect(() => {
    if (!autosaveReady || nodes.length === 0) return;
    const timer = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      try {
        window.localStorage.setItem(
          AUTOSAVE_KEY,
          JSON.stringify({
            workflowName,
            activeWorkflowId,
            nodes: layoutNodes,
            edges: validEdges,
            industry: industryPack.key,
            savedAt,
          })
        );
        setLastAutosavedAt(savedAt);
      } catch (err: any) {
        if (err?.name === 'QuotaExceededError') {
          toast.error('⚠️ Autosave failed — browser storage is full. Please save manually by clicking Save, then clear some browser data.');
        }
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [autosaveReady, workflowName, activeWorkflowId, layoutNodes, validEdges, industryPack.key]);

  const loadTemplate = () => {
    const t1 = makeNode(findBlock('New Website Lead'), 0, 0);
    const t2 = makeNode(findBlock('New WhatsApp Message'), 0, 0);
    const t3 = makeNode(findBlock('New Facebook Lead'), 0, 0);
    const ai = makeNode(findBlock('Generate Reply'), 0, 0);
    const action = makeNode(findBlock('Send WhatsApp'), 0, 0);
    const templateNodes = [t1, t2, t3, ai, action];
    const templateEdges = [
      { id: `e-${t1.id}-${ai.id}`, source: t1.id, target: ai.id, label: 'then', sourceHandle: 'then', targetHandle: 'in' },
      { id: `e-${t2.id}-${ai.id}`, source: t2.id, target: ai.id, label: 'then', sourceHandle: 'then', targetHandle: 'in' },
      { id: `e-${t3.id}-${ai.id}`, source: t3.id, target: ai.id, label: 'then', sourceHandle: 'then', targetHandle: 'in' },
      { id: `e-${ai.id}-${action.id}`, source: ai.id, target: action.id, label: 'then', sourceHandle: 'then', targetHandle: 'in' },
    ];
    setNodes(arrangeNodes(templateNodes, templateEdges));
    setEdges(templateEdges);
    setSelectedNodeId(t1.id);
    setWorkflowName('Universal Lead Automation');
    setActiveWorkflowId('');
  };

  const openWorkflow = (wf: AutomationWorkflow) => {
    setActiveWorkflowId(wf.id);
    setWorkflowName(wf.name);
    const graph = wf.config as any;
    if (graph?.nodes?.length) {
      const arranged = arrangeNodes(forceLiveMode(graph.nodes), graph.edges || []);
      setNodes(arranged);
      setEdges(graph.edges || []);
      setSelectedNodeId(arranged[0]?.id || '');
    } else {
      setNodes([]);
      setEdges([]);
    }
    setShowWorkflowList(false);
  };

  const loadTemplateByKey = async (key: string) => {
    try {
      const response = await get(`/api/automation/templates/${key}/nodes`);
      const graph = response.data;
      if (graph?.nodes?.length) {
        const arranged = arrangeNodes(forceLiveMode(graph.nodes), graph.edges || []);
        setNodes(arranged);
        setEdges(graph.edges || []);
        setSelectedNodeId(arranged[0]?.id || '');
        setWorkflowName(graph.name || 'Automation');
        setActiveWorkflowId('');
        window.localStorage.removeItem(AUTOSAVE_KEY);
        toast.success(`Template loaded: ${graph.name}`);
        return;
      }
    } catch {
      // fallback to generic template if key not found
    }
    loadTemplate();
  };

  const startDragLibrary = (event: DragEvent<HTMLButtonElement>, block: LibraryBlock) => {
    event.dataTransfer.setData('application/brainai-block', JSON.stringify(block));
  };

  const clickNode = (nodeId: string) => {
    // Same node clicked again while settings open → close settings (toggle)
    if (nodeId === selectedNodeId && settingsOpen) {
      setSettingsOpen(false);
      return;
    }
    setSelectedNodeId(nodeId);
    setSettingsOpen(true);
  };

  const updateSelected = (patch: Partial<BuilderBlock>) => {
    if (!selectedNodeId) return;
    setNodes((items) => items.map((node) => (node.id === selectedNodeId ? { ...node, ...patch } : node)));
  };

  const updateSelectedConfig = (key: string, value: string) => {
    if (!selectedNodeId) return;
    setNodes((items) =>
      items.map((node) =>
        node.id === selectedNodeId ? { ...node, config: { ...node.config, [key]: value } } : node
      )
    );
  };

  const inferNodeTool = (node: BuilderBlock | undefined) => {
    if (!node) return '';
    const configured = node.config?.tool;
    if (configured) return configured;
    const text = `${node.title} ${node.description}`.toLowerCase();
    if (text.includes('instagram')) return 'send_instagram_dm';
    if (text.includes('whatsapp')) return 'send_whatsapp_message';
    if (text.includes('draft')) return 'create_gmail_draft_reply';
    if (text.includes('gmail')) return 'send_gmail_reply';
    if (text.includes('sheet')) return 'add_row_google_sheet';
    return '';
  };

  const integrationStatusFor = (provider: string) => {
    const item = integrations.find((integration) => integration.provider === provider);
    if (!item) return 'not connected';
    if (item.status) return item.status.split('_').join(' ');
    return item.connected ? 'connected' : 'not connected';
  };

  const workflowValidation = useMemo(() => {
    const blockers: Array<{ node: string; message: string; provider?: string }> = [];
    const warnings: Array<{ node: string; message: string; provider?: string }> = [];

    const getIntegration = (provider: string) => integrations.find((item) => item.provider === provider);
    const requireProvider = (node: BuilderBlock, provider: string, message: string) => {
      const integration = getIntegration(provider) as any;
      if (!integration) {
        blockers.push({ node: node.title, provider, message: `${message}: provider is not set up.` });
        return null;
      }
      if (!integration.setup_complete && integration.status !== 'active') {
        blockers.push({ node: node.title, provider, message: `${message}: setup details are incomplete.` });
      }
      return integration;
    };

    nodes
      .filter((node) => node.type === 'action')
      .forEach((node) => {
        const tool = inferNodeTool(node);
        const provider = node.config.provider || defaultProviderForTool(tool);
        const whatsappSendTools = [
          'send_whatsapp_message',
          'send_whatsapp_media',
          'send_whatsapp_list_message',
          'send_whatsapp_buttons',
          'send_whatsapp_cta',
          'send_whatsapp_meta_flow',
          'send_whatsapp_location',
          'send_whatsapp_single_product',
          'send_whatsapp_payment_request',
          'send_whatsapp_flow_message',
          'send_catalog',
          'create_customer_payment_link',
        ];

        if (whatsappSendTools.includes(tool)) {
          if ((node.config.send_mode || 'draft') === 'live') {
            const integration = requireProvider(node, provider === 'draft' ? 'meta' : provider, 'WhatsApp live send');
            if (integration && integration.status !== 'active') {
              warnings.push({ node: node.title, provider, message: 'WhatsApp is not fully connected. Messages will be saved as drafts until credentials are added in Integrations.' });
            }
          } else {
            warnings.push({ node: node.title, message: 'WhatsApp will create drafts unless live mode is enabled.' });
          }
        }

        if (tool === 'send_whatsapp_message') {
          if (node.config.recipient_source === 'custom' && !node.config.recipient) {
            blockers.push({ node: node.title, provider, message: 'Custom WhatsApp recipient is missing.' });
          }
        }

        if (tool === 'send_instagram_dm') {
          requireProvider(node, 'instagram', 'Instagram DM action');
          if (!node.config.recipient) {
            blockers.push({ node: node.title, provider: 'instagram', message: 'Instagram recipient is missing.' });
          }
        }

        if (tool === 'send_email') {
          requireProvider(node, 'gmail', 'Email action');
        }

        if (['create_gmail_draft_reply', 'send_gmail_reply', 'mark_gmail_read', 'add_gmail_label'].includes(tool)) {
          requireProvider(node, 'gmail', 'Gmail action');
          if (!node.config.gmail_message_id) {
            blockers.push({ node: node.title, provider: 'gmail', message: 'Gmail message ID is missing.' });
          }
          if (tool === 'send_gmail_reply' && node.config.auto_send !== 'true') {
            warnings.push({ node: node.title, message: 'Send Gmail Reply will create a draft until auto-send is enabled.' });
          }
        }

        if (tool === 'sync_to_sheet') {
          const integration = requireProvider(node, 'google_sheets', 'Google Sheets action');
          if (!node.config.sheet_name && !(integration as any)?.config?.sheet_name) {
            blockers.push({ node: node.title, provider: 'google_sheets', message: 'Sheet name is missing.' });
          }
        }

        if (tool === 'add_row_google_sheet') {
          requireProvider(node, 'google_sheets', 'Google Sheets action');
        }

        if (tool === 'push_to_crm') {
          requireProvider(node, provider || 'zoho', 'CRM action');
        }

        if (tool === 'book_meeting') {
          const integration = requireProvider(node, 'calendly', 'Meeting action');
          if (!node.config.booking_link && !(integration as any)?.config?.booking_link) {
            blockers.push({ node: node.title, provider: 'calendly', message: 'Booking link is missing.' });
          }
        }

        if (tool === 'notify_owner') {
          requireProvider(node, provider || 'telegram', 'Owner notification');
        }
      });

    return { ready: blockers.length === 0, blockers, warnings };
  }, [nodes, integrations]);

  const effectiveValidation = backendValidation || workflowValidation;

  const complianceScore = useMemo(() => {
    const actionNodes = nodes.filter((node) => node.type === 'action');
    const liveWhatsAppNodes = actionNodes.filter((node) => {
      const tool = inferNodeTool(node);
      return (tool.includes('whatsapp') || tool.includes('catalog') || tool.includes('payment')) && (node.config.send_mode || 'draft') === 'live';
    });
    const templateFallbackNodes = liveWhatsAppNodes.filter((node) => {
      const cfg = node.config || {};
      return Boolean(cfg.template_name || cfg.template_fallback || cfg.message_mode === 'template' || cfg.fallback_template_name);
    });
    // Compliance = hard blockers + missing template coverage only.
    // Infrastructure warnings (WA not connected, draft mode) are NOT compliance issues.
    const missingTemplate = Math.max(0, liveWhatsAppNodes.length - templateFallbackNodes.length);
    const score = Math.max(0, Math.min(100,
      100
      - effectiveValidation.blockers.length * 20   // hard errors (was 25)
      - missingTemplate * 10                        // missing template fallback (was 12, warnings removed)
    ));
    return { score, liveWhatsApp: liveWhatsAppNodes.length, templateFallback: templateFallbackNodes.length };
  }, [nodes, effectiveValidation]);

  useEffect(() => {
    setBackendValidation(null);
  }, [nodes, validEdges]);

  const validateWithBackend = async (): Promise<WorkflowValidationResult> => {
    const triggerType = nodes.find((node) => node.type === 'trigger')?.config?.trigger_type || 'new_lead';
    const response = await post('/api/automation/workflows/validate', {
      nodes: layoutNodes,
      edges: validEdges,
      trigger_type: triggerType,
      status: 'active',
    });
    setBackendValidation(response.data);
    return response.data;
  };

  const deleteSelected = () => {
    if (!selectedNodeId) return;
    setNodes((items) => items.filter((node) => node.id !== selectedNodeId));
    setEdges((items) => items.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
    setSelectedNodeId('');
  };

  const duplicateSelected = () => {
    if (!selectedNode) return;
    if (nodes.length + 1 > planAccess.limits.workflowSteps) {
      toast.error(`Your plan allows max ${planAccess.limits.workflowSteps} steps.`);
      setLockedFeature('automation.steps');
      return;
    }
    const clone: BuilderBlock = {
      ...selectedNode,
      id: `node-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: `${selectedNode.title} Copy`,
      x: selectedNode.x + 44,
      y: selectedNode.y + 44,
      config: { ...selectedNode.config },
    };
    setNodes((items) => [...items, clone]);
    setSelectedNodeId(clone.id);
    toast.success('Node duplicated');
  };

  const openWebhookSetup = () => {
    setShowWorkflowList(false);
    setSettingsOpen(true);
    setLibraryCollapsed(false);
    const existing = nodes.find((node) => node.type === 'trigger' && node.config?.trigger_type === 'webhook');
    if (existing) {
      setSelectedNodeId(existing.id);
      return;
    }
    const block = baseLibrary.find((item) => item.config?.trigger_type === 'webhook') || {
      type: 'trigger' as BlockType,
      title: 'Inbound Webhook',
      description: 'Receive data from any external tool.',
      config: { trigger_type: 'webhook', source: 'webhook' },
    };
    const nextNode = makeNode(block, FLOW_START_X, FLOW_CENTER_Y);
    setNodes((items) => [nextNode, ...items]);
    setSelectedNodeId(nextNode.id);
    toast.success(activeWorkflowId ? 'Webhook trigger ready. Copy the URL from settings.' : 'Webhook trigger added. Save once to generate the URL.');
  };

  const saveWorkflow = async () => {
    if (nodes.length === 0) {
      toast.error('Add at least one block');
      return;
    }
    if (!planAccess.allowed) {
      setLockedFeature('automation.create');
      return;
    }
    if (nodes.length > planAccess.limits.workflowSteps) {
      toast.error(`Your plan allows max ${planAccess.limits.workflowSteps} steps.`);
      setLockedFeature('automation.steps');
      return;
    }
    setSaving(true);
    try {
      const serverValidation = await validateWithBackend();
      const isReady = serverValidation.ready;
      if (isReady) {
        const otherActiveWorkflows = workflows.filter((workflow) => workflow.status === 'active' && workflow.id !== activeWorkflowId).length;
        if (otherActiveWorkflows + 1 > planAccess.limits.activeWorkflows) {
          toast.error(`Your plan allows max ${planAccess.limits.activeWorkflows} active workflow${planAccess.limits.activeWorkflows === 1 ? '' : 's'}.`);
          setLockedFeature('automation.create');
          return;
        }
      }
      const workflowPayload = {
        name: workflowName,
        trigger_type: nodes.find((node) => node.type === 'trigger')?.config?.trigger_type || 'new_lead',
        status: isReady ? 'active' : 'draft',
        config: {
          builder: 'visual_canvas',
          industry: industryPack.key,
          nodes: layoutNodes,
          edges: validEdges,
          activation_validation: serverValidation,
        },
      };

      let workflowId = activeWorkflowId;

      if (activeWorkflowId) {
        // UPDATE existing workflow via PUT (no duplicate creation)
        await put(`/api/automation/workflows/${activeWorkflowId}`, workflowPayload);
      } else {
        // CREATE new workflow via POST
        const response = await post('/api/automation/workflows', {
          ...workflowPayload,
          description: 'Visual drag-and-drop workflow created in B9 Automation.',
          required_plan: 'GROWTH',
        });
        workflowId = response.data.id;
        setActiveWorkflowId(workflowId);

        // Create blocks only for new workflows
        await Promise.all(
          layoutNodes.map((node, index) =>
            post(`/api/automation/workflows/${workflowId}/blocks`, {
              block_type: node.type,
              name: node.title,
              description: node.description,
              position_x: Math.round(node.x),
              position_y: Math.round(node.y),
              order_index: index,
              config: { ...node.config, node_id: node.id, edges: validEdges.filter((edge) => edge.source === node.id) },
            })
          )
        );

        await Promise.all(
          nodes
            .filter((node) => node.type === 'condition')
            .map((node) =>
              post(`/api/automation/workflows/${workflowId}/conditions`, {
                field: node.config.field || 'extraction.fields.budget',
                operator: node.config.operator || 'exists',
                value: node.config.value || null,
                then_action: node.config.then_action || 'send_whatsapp_message',
                else_action: node.config.else_action || 'create_task',
                config: { node_id: node.id },
              })
            )
        );
      }

      toast.success(isReady ? 'Workflow saved and active' : 'Workflow saved as draft. Fix blockers to activate.');
      window.localStorage.removeItem(AUTOSAVE_KEY);
      setLastAutosavedAt('');
      refresh(true); // silent — keeps existing list visible, no skeleton flash
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Could not save workflow');
    } finally {
      setSaving(false);
    }
  };

  const testWorkflow = async () => {
    if (!planAccess.canUse('automation.execute')) {
      setLockedFeature('automation.execute');
      return;
    }
    setTesting(true);
    setActiveNodeIds(new Set());
    setCompletedNodeIds(new Set());
    setFailedNodeIds(new Set());
    setTimeline([
      { label: 'Reading visual workflow', status: 'completed' },
      { label: 'Detecting intent', status: 'running' },
      { label: 'Running...', status: 'pending' },
    ]);
    try {
      // Derive channel source from the trigger node so the test simulates the right channel
      const triggerNode = nodes.find(n => n.type === 'trigger');
      const triggerSource = (triggerNode?.config?.source as string) || (triggerNode?.config?.trigger_type as string)?.replace('new_', '').replace('_message', '').replace('_lead', '') || 'whatsapp';
      const testContext = {
        lead: { name: testLeadName, phone: testLeadPhone, email: testLeadEmail, status: testLeadStatus },
        message: { text: testMessage },
        whatsapp: { fromNumber: testLeadPhone, text: testMessage },
        user_message: testMessage,
        is_test_run: true,
      };
      setNodeOutputs({});
      setExpandedOutputs(new Set());
      const response = activeWorkflowId
        ? await post(`/api/automation/workflows/${activeWorkflowId}/run`, { message: testMessage, source: triggerSource, test_context: testContext })
        : await post('/api/automation/chat', { message: testMessage });
      const runId = response.data.run_id;
      setTimeline(response.data.timeline || []);
      toast.success(activeWorkflowId ? 'Visual graph executed' : 'Automation chat test complete');
      refresh();

      if (runId) {
        const wsBase = (process.env.NEXT_PUBLIC_API_URL || 'https://b9-automation-backend.onrender.com').replace(/^http/, 'ws');
        const ws = new WebSocket(`${wsBase}/api/automation/ws/runs/${runId}`);
        ws.onmessage = (evt) => {
          try {
            const event = JSON.parse(evt.data);
            if (event.type === 'node_start') setActiveNodeIds((prev) => new Set([...prev, event.node_id]));
            if (event.type === 'node_done') {
              setActiveNodeIds((prev) => { const s = new Set(prev); s.delete(event.node_id); return s; });
              if (event.status === 'failed' || event.error) {
                setFailedNodeIds((prev) => new Set([...prev, event.node_id]));
              } else {
                setCompletedNodeIds((prev) => new Set([...prev, event.node_id]));
              }
              if (event.output && event.node_id) {
                setNodeOutputs(prev => ({ ...prev, [event.node_id]: event.output }));
              }
              if (event.timeline) setTimeline((prev) => [event.timeline, ...prev.slice(0, 19)]);
            }
            if (event.type === 'run_done') {
              ws.close();
              setActiveNodeIds(new Set());
              setTimeout(() => { setCompletedNodeIds(new Set()); setFailedNodeIds(new Set()); }, 5000);
            }
          } catch { /* ignore */ }
        };
        ws.onerror = () => ws.close();
        setTimeout(() => ws.close(), 120_000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Test run failed');
      setTimeline([{ label: 'Test failed', status: 'failed' }]);
    } finally {
      setTesting(false);
    }
  };

  const testSingleNode = async (nodeId: string) => {
    if (!activeWorkflowId) { toast.error('Save the workflow first to test individual nodes.'); return; }
    try {
      const response = await post(`/api/automation/workflows/${activeWorkflowId}/nodes/${nodeId}/test`, { message: testMessage });
      setTimeline((prev) => [{ label: `Node test: ${response.data.node_title}`, status: 'completed', data: response.data.output }, ...prev.slice(0, 9)]);
      toast.success(`Node "${response.data.node_title}" tested`);
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Node test failed';
      toast.error(msg);
    }
  };

  return (
    <div className="flex h-[calc(100vh-72px)] min-h-[720px] flex-col gap-3 overflow-hidden">
      {/* ── Top toolbar ── */}
      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm overflow-x-auto">
        {/* LEFT: back + name + plan badge */}
        {!showWorkflowList && (
          <button
            type="button"
            onClick={() => setShowWorkflowList(true)}
            className="flex items-center gap-1 shrink-0 text-xs font-semibold text-gray-400 hover:text-gray-800 transition px-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Workflows
          </button>
        )}
        <div className="h-4 w-px bg-gray-200 shrink-0" />
        <input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="w-36 min-w-0 shrink-0 rounded-lg border border-transparent bg-gray-50 px-2.5 py-1.5 text-sm font-semibold text-gray-900 focus:border-primary-300 focus:bg-white focus:outline-none truncate"
        />
        {/* Steps badge — show ∞ for GROWTH+ */}
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          planAccess.limits.workflowSteps >= 9999
            ? 'bg-emerald-50 text-emerald-700'
            : nodes.length >= planAccess.limits.workflowSteps
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-500'
        }`}>
          {planAccess.limits.workflowSteps >= 9999
            ? `${nodes.length} steps · ∞`
            : `${nodes.length} / ${planAccess.limits.workflowSteps}`}
        </span>

        <div className="h-4 w-px bg-gray-200 shrink-0" />

        {/* CENTER: action buttons */}
        <Button variant="secondary" size="sm" className="shrink-0"
          onClick={() => { const opening = libraryCollapsed; setLibraryCollapsed(!opening); if (opening) setSettingsOpen(false); }}>
          {libraryCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />} Library
        </Button>
        <Button variant="secondary" size="sm" className="shrink-0"
          onClick={() => { const opening = !settingsOpen; setSettingsOpen(opening); if (opening) setLibraryCollapsed(true); }}>
          {settingsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />} Settings
        </Button>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 shrink-0">
          <button type="button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo last action"
            className="rounded-md px-2 py-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition text-sm leading-none">
            ↩
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" aria-label="Redo last action"
            className="rounded-md px-2 py-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition text-sm leading-none">
            ↪
          </button>
        </div>

        <Button variant="secondary" size="sm" className="shrink-0 bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200 text-violet-700 hover:from-violet-100"
          onClick={() => setShowGenerateModal(true)}>
          ✨ AI
        </Button>

        <Button variant="secondary" size="sm" className="shrink-0" onClick={() => setShowTemplateGallery(true)}>
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden md:inline ml-1">Templates</span>
        </Button>

        {/* More menu */}
        <div className="relative shrink-0" ref={overflowMenuRef}>
          <Button variant="secondary" size="sm" onClick={() => setOverflowMenuOpen((p) => !p)}>
            ··· More
          </Button>
          {overflowMenuOpen && (
            <div className="fixed z-[9999] mt-1 w-52 rounded-xl border border-gray-200 bg-white py-1.5 shadow-2xl"
              style={{ top: overflowMenuRef.current ? overflowMenuRef.current.getBoundingClientRect().bottom + 4 : 0, right: overflowMenuRef.current ? window.innerWidth - overflowMenuRef.current.getBoundingClientRect().right : 0 }}
              onClick={() => setOverflowMenuOpen(false)}>
              <button type="button" onClick={() => setShowLaunchAssistant(true)} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                <Bot className="h-3.5 w-3.5 text-gray-400" /> Launch Assistant
              </button>
              <button type="button" onClick={() => setShowAnalytics((p) => !p)} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                <RefreshCw className="h-3.5 w-3.5 text-gray-400" /> Analytics
              </button>
              <button type="button" onClick={autoArrangeFlow} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                <Route className="h-3.5 w-3.5 text-gray-400" /> Auto Arrange
              </button>
              <button type="button" onClick={openWebhookSetup} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                <Globe className="h-3.5 w-3.5 text-gray-400" /> Inbound Webhook
              </button>
              {activeWorkflowId && (
                <div className="border-t border-gray-100 pt-1">
                  <VersionHistoryButton workflowId={activeWorkflowId} onRollback={(nodes, edges, name) => { setNodes(nodes); setEdges(edges); setWorkflowName(name); }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: status + actions */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {effectiveValidation.blockers.length > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              {effectiveValidation.blockers.length} issue{effectiveValidation.blockers.length > 1 ? 's' : ''}
            </span>
          )}
          {effectiveValidation.ready && !effectiveValidation.blockers.length && (
            <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Ready
            </span>
          )}
          {lastAutosavedAt && (
            <span className="hidden sm:block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              Saved {new Date(lastAutosavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <Button
          variant={testing ? 'primary' : 'secondary'}
          size="sm"
          onClick={testWorkflow}
          loading={testing}
          title={!activeWorkflowId ? 'Save the workflow first to test the visual canvas. Currently testing the general AI chat.' : 'Run the saved visual workflow'}
        >
          <Play className="h-3.5 w-3.5" />
          {testing ? 'Running...' : activeWorkflowId ? 'Test' : 'Test (unsaved)'}
        </Button>
        {/* Go Live - set all send nodes to live at once */}
        {nodes.some(n => {
          const cfg = n.config || {};
          return (cfg.send_mode === 'draft') && (cfg.tool?.includes('whatsapp') || cfg.tool?.includes('catalog') || cfg.tool?.includes('payment'));
        }) && (
          <Button
            size="sm"
            variant="secondary"
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            onClick={() => {
              setNodes(prev => prev.map(n => {
                const cfg = n.config || {};
                if (cfg.tool?.includes('whatsapp') || cfg.tool?.includes('catalog') || cfg.tool?.includes('payment')) {
                  return { ...n, config: { ...cfg, send_mode: 'live' } };
                }
                return n;
              }));
              toast.success('All WhatsApp nodes set to live mode. Review compliance before activating.');
            }}
            title="Set all WhatsApp send nodes to live mode"
          >
            Go Live
          </Button>
        )}
        <Button size="sm" onClick={saveWorkflow} loading={saving}>
          <Save className="h-3.5 w-3.5" /> Save
        </Button>
      </div>


      {!showWorkflowList && (
        <div className="shrink-0 rounded-xl border border-indigo-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-gray-950">Compliance score: {complianceScore.score}%</p>
              <p className="mt-0.5 text-xs text-gray-600">Live WhatsApp nodes: {complianceScore.liveWhatsApp}. Template fallback configured: {complianceScore.templateFallback}. Backend safety checks still run before every send.</p>
            </div>
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${complianceScore.score >= 90 ? 'bg-emerald-50 text-emerald-700' : complianceScore.score >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
              {complianceScore.score >= 90 ? 'Ready to activate' : complianceScore.score >= 70 ? 'Review warnings' : 'Fix blockers first'}
            </span>
          </div>
        </div>
      )}

      {!showWorkflowList && effectiveValidation.blockers.length > 0 && (
        <div className="shrink-0 flex flex-wrap gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2">
          {effectiveValidation.blockers.slice(0, 3).map((b) => (
            <span key={`${b.node}-${b.message}`} className="text-xs text-amber-800">
              <strong>{b.node}</strong>: {b.message}
            </span>
          ))}
          {effectiveValidation.blockers.length > 3 && (
            <span className="text-xs text-amber-600">+{effectiveValidation.blockers.length - 3} more</span>
          )}
        </div>
      )}

      {/* ── Workflow Card List (n8n-style) ── */}
      {showWorkflowList && (
        <WorkflowListView
          workflows={workflows}
          loading={wfLoading}
          onOpen={openWorkflow}
          onNew={() => {
            setNodes([]);
            setEdges([]);
            setActiveWorkflowId('');
            setWorkflowName('New Automation');
            setShowWorkflowList(false);
          }}
          onDelete={async (id) => {
            try {
              await del(`/api/automation/workflows/${id}`);
              setWorkflows((prev) => prev.filter((w) => w.id !== id));
              if (activeWorkflowId === id) setActiveWorkflowId('');
            } catch (e: any) {
              if (e?.response?.status === 403) {
                toast.error('Only workspace admins can delete workflows.');
              } else {
                toast.error(e?.response?.data?.detail || 'Failed to delete workflow');
              }
            }
          }}
          onToggleStatus={async (id, currentStatus) => {
            const newStatus = currentStatus === 'active' ? 'draft' : 'active';
            const prevWorkflows = workflows;
            // Optimistic update immediately
            setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
            try {
              await put(`/api/automation/workflows/${id}`, { status: newStatus });
              toast.success(newStatus === 'active' ? '▶ Workflow activated' : '⏸ Workflow paused');
            } catch {
              setWorkflows(prevWorkflows); // rollback
              toast.error('Failed to update workflow — changes reverted');
            }
          }}
          onClone={async (id) => {
            try {
              const res = await post(`/api/automation/workflows/${id}/clone`, {});
              toast.success(`Cloned as "${res.data.name}"`);
              refresh();
            } catch {
              toast.error('Failed to clone workflow');
            }
          }}
          onRefresh={() => refresh()}
          onGenerate={() => setShowGenerateModal(true)}
        />
      )}

      {/* ── Main 3-column area ── */}
      <div ref={threeColRef} className={`relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 ${showWorkflowList ? 'hidden' : ''}`}>

        {/* Left — Node Library */}
        <div className={`b9-dark-surface z-20 flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 shadow-xl shadow-black/30 transition-all duration-200 ${libraryCollapsed ? 'w-0 opacity-0' : 'w-[280px] opacity-100'}`}>
          <div className="border-b border-slate-800 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Node Library</p>
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-0.5">
                {(['beginner', 'advanced'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLibraryMode(mode)}
                    className={`rounded-md px-2 py-1 text-[10px] font-bold capitalize transition ${
                      libraryMode === mode ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder="Search nodes..."
              className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
            <p className="mt-1.5 text-[10px] leading-4 text-slate-500">
              {libraryMode === 'beginner' ? 'Recommended nodes for common WhatsApp automations.' : 'Full toolset for advanced workflows and external systems.'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {(['trigger', 'ai', 'condition', 'action'] as BlockType[]).map((sectionType) => {
              const sectionBlocks = library.filter((b) => b.type === sectionType && (
                !librarySearch || b.title.toLowerCase().includes(librarySearch.toLowerCase()) || b.description.toLowerCase().includes(librarySearch.toLowerCase())
              ));
              if (sectionBlocks.length === 0) return null;
              const labels: Record<BlockType, string> = { trigger: 'Triggers', ai: 'AI Agent', condition: 'Logic', action: 'Actions' };
              const colors: Record<BlockType, string> = { trigger: 'text-red-300', ai: 'text-violet-300', condition: 'text-amber-300', action: 'text-emerald-300' };
              const Icon = blockIcons[sectionType];
              return (
                <div key={sectionType} className="mb-3">
                  <div className={`mb-1.5 flex items-center gap-1 px-1 text-[10px] font-black uppercase tracking-widest ${colors[sectionType]}`}>
                    <Icon className="h-3 w-3" />{labels[sectionType]}
                  </div>
                  <div className="space-y-1">
                    {sectionBlocks.map((block) => (
                      <button
                        key={`${block.type}-${block.title}`}
                        type="button"
                        draggable
                        onDragStart={(e) => startDragLibrary(e, block)}
                        className={`w-full cursor-grab rounded-xl border px-3 py-2 text-left shadow-sm transition active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-lg ${blockStyles[block.type]}`}
                      >
                        <span className="block text-xs font-bold leading-tight">{block.title}</span>
                        <span className="mt-0.5 block text-[10px] leading-tight opacity-65">{block.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center — Canvas */}
        <div className="min-h-0 h-full min-w-[720px] flex-1 p-3">
        <ReactFlowProvider>
          <WorkflowCanvas
            nodes={layoutNodes}
            edges={validEdges}
            selectedNodeId={selectedNodeId}
            library={library}
            onSelectNode={clickNode}
            onConnectBlocks={(source, target, label = 'then', sourceHandle = label, targetHandle = 'in') => {
              setEdges((items) => [...items, { id: `edge-${source}-${target}-${Date.now()}`, source, target, label, sourceHandle, targetHandle }]);
            }}
            onAddNode={(block, position, sourceId, label = 'then') => {
              if (nodes.length + 1 > planAccess.limits.workflowSteps) {
                toast.error(`Your plan allows max ${planAccess.limits.workflowSteps} steps.`);
                setLockedFeature('automation.steps');
                return;
              }
              const nextNode = makeNode(block, position.x, position.y);
              const nextEdge = sourceId
                ? { id: `edge-${sourceId}-${nextNode.id}-${Date.now()}`, source: sourceId, target: nextNode.id, label, sourceHandle: label, targetHandle: 'in' }
                : null;
              setNodes((items) => [...items, nextNode]);
              if (nextEdge) setEdges((items) => [...items, nextEdge]);
              setSelectedNodeId(nextNode.id);
              if (window.innerWidth < 1200) setLibraryCollapsed(true);
            }}
            onMoveNode={(nodeId, position) => {
              setNodes((items) => items.map((n) => (n.id === nodeId ? { ...n, x: position.x, y: position.y } : n)));
            }}
            onArrange={autoArrangeFlow}
            onTestNode={testSingleNode}
            activeNodeIds={activeNodeIds}
            completedNodeIds={completedNodeIds}
            failedNodeIds={failedNodeIds}
            nodeOutputs={nodeOutputs}
            testing={testing}
            isFullscreen={isCanvasFullscreen}
            onToggleFullscreen={toggleCanvasFullscreen}
          />
        </ReactFlowProvider>
        </div>

        {/* Right — Settings + Test + Saved */}
        <div className={`absolute bottom-3 right-3 top-3 z-30 flex w-[360px] max-w-[calc(100%-2rem)] flex-col gap-3 overflow-y-auto transition-transform duration-200 ${settingsOpen ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]'}`}>

          {/* Block Settings */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                {selectedNode ? `${NODE_TYPE_META[selectedNode.type].label} Settings` : 'Block Settings'}
              </p>
            </div>
            {!selectedNode ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-400">Click a node on the canvas to edit it</p>
              </div>
            ) : (
              <div className="space-y-3 p-3">
                <label className="block text-xs font-semibold text-gray-600">
                  Label
                  <input value={selectedNode.title} onChange={(e) => updateSelected({ title: e.target.value })} className="input-field mt-1" />
                </label>

                {selectedNode.type === 'trigger' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-600">
                      Trigger event
                      <select value={selectedNode.config.trigger_type || 'new_website_lead'} onChange={(e) => updateSelectedConfig('trigger_type', e.target.value)} className="input-field mt-1">
                        <optgroup label="Lead Sources">
                          <option value="new_website_lead">New Website Lead</option>
                          <option value="new_whatsapp_message">New WhatsApp Message</option>
                          <option value="new_facebook_lead">New Facebook Lead</option>
                          <option value="all_leads_sheet">New Google Sheet Row</option>
                          <option value="manual_run">Manual Run</option>
                        </optgroup>
                        <optgroup label="More Triggers">
                          <option value="new_whatsapp_lead">New WhatsApp Lead</option>
                          <option value="new_gmail_email">New Gmail Email</option>
                          <option value="new_instagram_lead">New Instagram Lead</option>
                          <option value="new_instagram_message">New Instagram Message</option>
                          <option value="payment_success">Payment Success</option>
                          <option value="webhook">Inbound Webhook</option>
                          <option value="indiamart">IndiaMART Lead</option>
                        </optgroup>
                      </select>
                    </label>
                    {selectedNode.config.trigger_type === 'webhook' && (
                      <WebhookUrlPanel workflowId={activeWorkflowId} />
                    )}
                    {selectedNode.config.trigger_type === 'schedule' && (
                      <ScheduleTriggerPanel workflowId={activeWorkflowId} nodeConfig={selectedNode.config} onConfigChange={updateSelectedConfig} />
                    )}
                    {selectedNode.config.trigger_type === 'payment_success' && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 space-y-1.5">
                        <p className="font-bold">💳 Payment Success Trigger</p>
                        <p>Fires when a Razorpay payment is confirmed — both plan upgrades and customer payment links.</p>
                        <p className="font-semibold mt-1">Available variables in this automation:</p>
                        <div className="font-mono bg-white border border-emerald-200 rounded p-2 space-y-0.5 text-[10px]">
                          <p>{'{{payment.payment_id}}'} — Razorpay payment ID</p>
                          <p>{'{{payment.amount_inr}}'} — Amount in ₹</p>
                          <p>{'{{payment.lead_id}}'} — Lead who paid</p>
                          <p>{'{{payment.description}}'} — Payment description</p>
                          <p>{'{{lead.phone}}'} — Customer phone</p>
                          <p>{'{{lead.name}}'} — Customer name</p>
                        </div>
                      </div>
                    )}
                    {selectedNode.config.trigger_type === 'new_facebook_lead' && (() => {
                      const fbStatus = integrationStatusFor('facebook');
                      const isConnected = fbStatus === 'active' || fbStatus === 'connected';
                      return (
                        <div className={`rounded-lg border p-3 text-xs ${isConnected ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                          {isConnected ? (
                            <>
                              <p className="font-bold mb-1">✓ Facebook Connected</p>
                              <p className="text-emerald-700">This trigger fires when a lead submits your Facebook Lead Ad form.</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {['{{lead.name}}', '{{lead.phone}}', '{{lead.email}}', '{{lead.message}}'].map((v) => (
                                  <code key={v} className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px]">{v}</code>
                                ))}
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="font-bold mb-1">⚠ Facebook not connected</p>
                              <p className="mb-2">Set up Facebook Lead Ads on the Integrations page first.</p>
                              <a href="/dashboard/integrations" className="font-bold underline">Go to Integrations →</a>
                            </>
                          )}
                        </div>
                      );
                    })()}
                    {selectedNode.config.trigger_type === 'manual_run' && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                        <p className="font-bold">Manual Run</p>
                        <p className="mt-1">Use the <strong>Test</strong> button in the toolbar to run this flow manually. No automatic trigger needed.</p>
                      </div>
                    )}
                    {['new_instagram_lead', 'new_instagram_message'].includes(selectedNode.config.trigger_type) && (
                      <div className="rounded-lg border border-pink-100 bg-pink-50 p-3 text-xs text-pink-800">
                        <p className="font-bold">Instagram DM trigger</p>
                        <InputField label="Connection ID optional" value={selectedNode.config.connection_id || ''} placeholder="Use default Instagram connection" onChange={(value) => updateSelectedConfig('connection_id', value)} />
                        <InputField label="Message contains optional" value={selectedNode.config.message_contains || ''} placeholder="pricing, demo, help" onChange={(value) => updateSelectedConfig('message_contains', value)} />
                      </div>
                    )}
                    {selectedNode.config.trigger_type === 'all_leads_sheet' && (
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
                        <p className="font-bold">Google Sheet trigger</p>
                        <SelectField label="Mode" value={selectedNode.config.mode || 'manual_all_rows'} options={['manual_all_rows', 'new_row_placeholder']} onChange={(value) => updateSelectedConfig('mode', value)} />
                        <input
                          value={selectedNode.config.connection_id || ''}
                          onChange={(e) => updateSelectedConfig('connection_id', e.target.value)}
                          className="input-field mt-2"
                          placeholder="Default Google Sheet connection"
                        />
                        <input
                          value={selectedNode.config.limit || '100'}
                          onChange={(e) => updateSelectedConfig('limit', e.target.value)}
                          className="input-field mt-2"
                          placeholder="Rows to process"
                        />
                        <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                          This trigger processes all rows from your connected Google Sheet. Real-time new-row detection requires a Google Sheets webhook — use the <strong>Manual Run</strong> button to process rows on demand.
                        </p>
                      </div>
                    )}
                    {selectedNode.config.trigger_type === 'new_gmail_email' && (
                      <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800">
                        <p className="font-bold">Gmail trigger</p>
                        <InputField label="Connection ID optional" value={selectedNode.config.connection_id || ''} placeholder="Use default Gmail connection" onChange={(value) => updateSelectedConfig('connection_id', value)} />
                        <InputField label="From email contains optional" value={selectedNode.config.from_email || ''} placeholder="customer@example.com" onChange={(value) => updateSelectedConfig('from_email', value)} />
                        <InputField label="Subject contains optional" value={selectedNode.config.subject_contains || ''} placeholder="pricing, demo, support" onChange={(value) => updateSelectedConfig('subject_contains', value)} />
                        <SelectField label="Unread only" value={selectedNode.config.unread_only || 'true'} options={['true', 'false']} onChange={(value) => updateSelectedConfig('unread_only', value)} />
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.type === 'condition' && selectedNode.config.tool === 'ai_condition' && (
                  <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50 p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-violet-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">AI Condition</p>
                    </div>
                    <label className="block text-xs font-semibold text-violet-900">
                      Yes/No question for AI
                      <textarea value={selectedNode.config.condition_prompt || ''} onChange={(e) => updateSelectedConfig('condition_prompt', e.target.value)} rows={2} className="input-field mt-1 resize-none text-xs" placeholder="Does the user want to book a demo? / Is this a serious buying intent?" />
                    </label>
                    <p className="text-[10px] text-violet-600">AI checks the current message and context, returns YES or NO. Use <code className="font-mono">{'{{name}}'}</code> or <code className="font-mono">{'{{phone}}'}</code> in the question.</p>
                    <div className="flex gap-1.5 pt-1 text-[10px] font-bold">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">✓ YES → top path</span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">✗ NO → bottom path</span>
                    </div>
                  </div>
                )}

                {selectedNode.type === 'condition' && selectedNode.config.tool !== 'ai_condition' && (
                  <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">IF / ELSE</p>
                    <label className="block text-xs font-semibold text-amber-900">
                      Field
                      <input value={selectedNode.config.field || ''} onChange={(e) => updateSelectedConfig('field', e.target.value)} className="input-field mt-1" placeholder="message.interactive_reply.id" />
                    </label>
                    {/* Quick field suggestions */}
                    <div className="flex flex-wrap gap-1 -mt-1">
                      <p className="text-[9px] text-amber-600 w-full font-semibold">Quick select:</p>
                      {[
                        { label: '🔘 Button tapped', value: 'message.interactive_reply.id' },
                        { label: '📝 Button text', value: 'message.interactive_reply.title' },
                        { label: '👋 New customer', value: 'lead.is_new' },
                        { label: '🤖 AI intent', value: 'flow.intent' },
                        { label: '⭐ Lead score', value: 'lead_score' },
                        { label: '📊 AI confidence', value: 'ai.confidence' },
                        { label: '💰 Budget', value: 'extraction.fields.budget' },
                      ].map(s => (
                        <button key={s.value} type="button"
                          onClick={() => updateSelectedConfig('field', s.value)}
                          className={`rounded px-1.5 py-0.5 text-[9px] transition border ${selectedNode.config.field === s.value ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-100'}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <label className="block text-xs font-semibold text-amber-900">
                      Operator
                      <select value={selectedNode.config.operator || 'exists'} onChange={(e) => updateSelectedConfig('operator', e.target.value)} className="input-field mt-1">
                        <option value="exists">exists (not empty)</option>
                        <option value="contains">contains</option>
                        <option value="equals">equals</option>
                        <option value="greater_than">greater than</option>
                        <option value="confidence_below">AI confidence below</option>
                      </select>
                    </label>
                    <label className="block text-xs font-semibold text-amber-900">
                      Value
                      <input value={selectedNode.config.value || ''} onChange={(e) => updateSelectedConfig('value', e.target.value)} className="input-field mt-1" placeholder="demo, 50L, 0.7..." />
                    </label>
                    <div className="flex gap-1.5 pt-1 text-[10px] font-bold">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">✓ YES → top</span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">✗ NO → bottom</span>
                    </div>
                  </div>
                )}

                {selectedNode.type === 'action' && (
                  <ActionBlockSettings
                    tool={inferNodeTool(selectedNode)}
                    config={selectedNode.config}
                    integrations={integrations}
                    integrationStatusFor={integrationStatusFor}
                    onChange={updateSelectedConfig}
                  />
                )}

                {selectedNode.type === 'ai' && (
                  <AiBlockSettings config={selectedNode.config} onChange={updateSelectedConfig} />
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" className="w-full" onClick={duplicateSelected}>
                    <Copy className="h-4 w-4" /> Duplicate
                  </Button>
                  <Button variant="danger" className="w-full" onClick={deleteSelected}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Test Run */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">Test Run</p>
            </div>
            <div className="p-3">
              {/* Channel indicator derived from trigger node */}
              {(() => {
                const triggerNode = nodes.find(n => n.type === 'trigger');
                const src = (triggerNode?.config?.source as string) || '';
                const channelMap: Record<string, { icon: string; label: string; color: string }> = {
                  whatsapp: { icon: '💬', label: 'WhatsApp', color: 'text-emerald-700 bg-emerald-50' },
                  instagram: { icon: '📸', label: 'Instagram DM', color: 'text-pink-700 bg-pink-50' },
                  facebook: { icon: '📘', label: 'Facebook', color: 'text-blue-700 bg-blue-50' },
                  website_widget: { icon: '🌐', label: 'Website Widget', color: 'text-cyan-700 bg-cyan-50' },
                };
                const ch = channelMap[src];
                return ch ? (
                  <div className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${ch.color}`}>
                    <span>{ch.icon}</span> Testing as: {ch.label}
                  </div>
                ) : null;
              })()}
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                className="input-field resize-none text-sm"
                placeholder="Paste a sample lead message to test..."
              />
              {/* Lead context pre-fill */}
              <details className="mt-2">
                <summary className="text-[11px] font-semibold text-gray-500 cursor-pointer select-none hover:text-gray-700">
                  ▶ Pre-fill lead data (optional)
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Lead Name</p>
                    <input value={testLeadName} onChange={e => setTestLeadName(e.target.value)} placeholder="Rahul Sharma" className="input-field text-xs py-1.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Lead Phone</p>
                    <input value={testLeadPhone} onChange={e => setTestLeadPhone(e.target.value)} placeholder="XXXXXXXXXX" className="input-field text-xs py-1.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Lead Email</p>
                    <input value={testLeadEmail} onChange={e => setTestLeadEmail(e.target.value)} placeholder="rahul@email.com" className="input-field text-xs py-1.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-0.5">Lead Status</p>
                    <select value={testLeadStatus} onChange={e => setTestLeadStatus(e.target.value)} className="input-field text-xs py-1.5">
                      <option value="new">new</option>
                      <option value="hot">hot</option>
                      <option value="warm">warm</option>
                      <option value="cold">cold</option>
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">These fill <code className="font-mono">{'{{lead.name}}'}</code>, <code className="font-mono">{'{{lead.phone}}'}</code> etc. in your nodes</p>
              </details>
              <Button className="mt-2 w-full" onClick={testWorkflow} loading={testing}>
                <Play className="h-4 w-4" /> {testing ? '⚡ Running…' : 'Run Test'}
              </Button>
              {testing && (
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-cyan-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
                  Workflow executing — watch nodes light up on canvas
                </div>
              )}
              {(timeline.length > 0 || runs.length > 0) && (
                <ExecutionLog timeline={timeline} runs={runs} />
              )}
              {/* Variable inspector — shows output of each completed node */}
              {Object.keys(nodeOutputs).length > 0 && (
                <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700 mb-2">📦 Node Outputs (click to expand)</p>
                  <div className="space-y-1.5">
                    {nodes.filter(n => nodeOutputs[n.id]).map(n => {
                      const out = nodeOutputs[n.id];
                      const isExpanded = expandedOutputs.has(n.id);
                      const displayKeys = Object.entries(out).filter(([k]) => !k.startsWith('_') && k !== 'message_ids');
                      return (
                        <div key={n.id} className="rounded-lg bg-white border border-violet-100 overflow-hidden">
                          <button
                            onClick={() => setExpandedOutputs(prev => {
                              const s = new Set(prev);
                              if (isExpanded) s.delete(n.id);
                              else s.add(n.id);
                              return s;
                            })}
                            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-violet-50 transition"
                          >
                            <span className="text-xs font-semibold text-gray-700 truncate">{n.title}</span>
                            <span className="text-[10px] text-violet-500 shrink-0 ml-2">{isExpanded ? '▲' : '▼ show'}</span>
                          </button>
                          {isExpanded && (
                            <div className="px-3 pb-2 space-y-1 border-t border-violet-50">
                              {displayKeys.length === 0 ? (
                                <p className="text-[10px] text-gray-400 pt-1">No output data</p>
                              ) : displayKeys.map(([k, v]) => (
                                <div key={k} className="flex gap-2 text-[11px]">
                                  <span className="font-mono text-violet-600 shrink-0">{k}</span>
                                  <span className="text-gray-600 truncate">{typeof v === 'object' ? JSON.stringify(v).slice(0, 80) : String(v).slice(0, 120)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Saved Workflows */}
          {workflows.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Saved Workflows</p>
              </div>
              <div className="space-y-1 p-3">
                {workflows.slice(0, 5).map((wf) => (
                  <button
                    key={wf.id}
                    type="button"
                    onClick={() => {
                      setActiveWorkflowId(wf.id);
                      setWorkflowName(wf.name);
                      const graph = wf.config as any;
                      if (graph?.nodes?.length) {
                        const graphEdges = graph.edges || [];
                        const arranged = arrangeNodes(forceLiveMode(graph.nodes), graphEdges);
                        setNodes(arranged);
                        setEdges(graphEdges);
                        setSelectedNodeId(arranged[0]?.id || '');
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition hover:border-orange-200 hover:bg-orange-50 ${
                      activeWorkflowId === wf.id ? 'border-primary-300 bg-orange-50' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-gray-900">{wf.name}</span>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 font-bold ${wf.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {wf.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-gray-400">{wf.trigger_type?.split('_').join(' ')}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Panel */}
          {showAnalytics && (
            <AnalyticsPanel onClose={() => setShowAnalytics(false)} />
          )}
        </div>
      </div>

      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <TemplateGallery
          onClose={() => setShowTemplateGallery(false)}
          onSelect={(key: string) => { loadTemplateByKey(key); setShowTemplateGallery(false); }}
        />
      )}

      {/* ✨ AI Flow Generator Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-violet-200 bg-white shadow-2xl max-h-[90vh] flex flex-col">
            <div className="border-b border-gray-100 px-6 py-4 flex-shrink-0">
              <div>
                <p className="font-bold text-gray-900 text-lg">Generate Automation with AI</p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Describe your business workflow in plain English. AI will build an editable canvas draft.</p>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Describe your automation:</p>
                <textarea
                  value={generateDesc}
                  onChange={e => setGenerateDesc(e.target.value)}
                  rows={5}
                  className="input-field resize-none text-sm"
                  placeholder={`Examples:\n- "Coaching center: Ask 9th/10th/11th-12th class, collect name+phone, share fees, schedule demo call"\n- "Real estate: Ask budget (50L/1Cr/1Cr+), location preference, collect contact, book site visit, send payment token"\n- "D2C brand: Show product menu, collect order details, address, send Razorpay payment link, confirm order"\n- "SaaS: Ask use-case (team size, industry), qualify lead, book demo, send pricing PDF"`}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Platform:</p>
                <div className="flex gap-2">
                  {[
                    { value: 'whatsapp', label: 'WhatsApp', desc: 'Interactive buttons (max 3)' },
                    { value: 'instagram', label: 'Instagram', desc: 'Quick replies (max 13)' },
                    { value: 'facebook', label: 'Facebook', desc: 'Quick replies (max 13)' },
                  ].map(p => (
                    <button key={p.value} onClick={() => setGeneratePlatform(p.value)}
                      className={`flex-1 rounded-xl border p-2.5 text-left text-xs transition ${generatePlatform === p.value ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className="font-semibold">{p.label}</p>
                      <p className="text-gray-400 mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3 text-xs text-violet-800">
                <p className="font-semibold mb-1">✨ For a powerful 15-20 node flow, include:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Your business type + what you sell/offer</li>
                  <li>Menu options customers can choose (e.g. pricing, demo, support)</li>
                  <li>What details to collect (name, phone, budget, city)</li>
                  <li>Whether to send a payment link or booking</li>
                  <li>Follow-up timing (e.g. "remind after 24 hours")</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4 flex-shrink-0">
              <Button variant="secondary" onClick={() => setShowGenerateModal(false)} disabled={generating}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={generateDesc.trim().length < 10 || generating}
                loading={generating}
                onClick={async () => {
                  setGenerating(true);
                  try {
                    const res = await post('/api/automation/workflows/generate-from-description', {
                      description: generateDesc.trim(),
                      platform: generatePlatform,
                    }, { timeout: 90000 });
                    const { nodes: genNodes, edges: genEdges, name: genName } = res.data;
                    // Force live mode + mark WA nodes as template-aware so compliance score is accurate
                    const liveNodes = (genNodes as BuilderBlock[]).map((n) => {
                      if (n.type !== 'action' && n.type !== 'ai') return n;
                      const tool = (n.config?.tool || '');
                      const isWA = tool.includes('whatsapp') || tool.includes('catalog') || tool.includes('payment');
                      return {
                        ...n,
                        config: {
                          ...n.config,
                          ...(n.config?.send_mode ? { send_mode: 'live' } : {}),
                          // Mark WA nodes so compliance score doesn't penalise missing template
                          ...(isWA && !n.config?.message_mode ? { message_mode: 'text' } : {}),
                        },
                      };
                    });
                    // Auto-arrange immediately for clean n8n-style layout
                    const arranged = arrangeNodes(liveNodes, genEdges);
                    setNodes(arranged);
                    setEdges(genEdges);
                    if (genName) setWorkflowName(genName);
                    setActiveWorkflowId('');
                    setShowWorkflowList(false);
                    setShowGenerateModal(false);
                    // Fit view after small delay so React Flow renders first
                    toast.success('Flow generated! Review and Save.');
                  } catch (err: any) {
                    toast.error(err.response?.data?.detail || 'Generation failed. Try a more detailed description');
                  } finally {
                    setGenerating(false);
                  }
                }}
              >
                {generating ? '✨ Building flow (may take ~30s)...' : '✨ Generate Full Flow'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {showLaunchAssistant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-violet-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <p className="text-lg font-bold text-gray-900">Agentic Launch Assistant</p>
                <p className="mt-0.5 text-xs text-gray-500">Draft assistant, templates, WhatsApp Flow, automation, widget, and campaign. Nothing goes live until you review.</p>
              </div>
              <button type="button" onClick={() => setShowLaunchAssistant(false)} className="rounded-lg px-2 py-1 text-sm font-bold text-gray-400 hover:bg-gray-100">X</button>
            </div>
            <div className="grid flex-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
              <div className="space-y-3">
                {[
                  ['business_name', 'Business name', 'Example: Sharma Realty'],
                  ['industry', 'Industry', 'Real estate, coaching, clinic, D2C...'],
                  ['goal', 'Main goal', 'Qualify leads and book site visits'],
                  ['products_services', 'Products or services', 'List your services, prices, packages'],
                  ['target_customers', 'Target customers', 'Who should this automation serve?'],
                  ['common_questions', 'Common customer questions', 'Pricing, availability, location, timing...'],
                ].map(([key, label, placeholder]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-bold text-gray-700">{label}</label>
                    {['products_services', 'common_questions'].includes(key) ? (
                      <textarea
                        value={(launchBrief as any)[key]}
                        onChange={(e) => setLaunchBrief((p) => ({ ...p, [key]: e.target.value }))}
                        rows={3}
                        className="input-field resize-none text-sm"
                        placeholder={placeholder}
                      />
                    ) : (
                      <input
                        value={(launchBrief as any)[key]}
                        onChange={(e) => setLaunchBrief((p) => ({ ...p, [key]: e.target.value }))}
                        className="input-field text-sm"
                        placeholder={placeholder}
                      />
                    )}
                  </div>
                ))}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                  Review-before-activate is enforced. AI drafts; you approve before templates, flows, or automations go live.
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900">Draft Preview</p>
                  {launchPlan && <span className="rounded-full bg-violet-100 px-2 py-1 text-[11px] font-bold text-violet-700">{launchPlan.source || 'draft'}</span>}
                </div>
                {!launchPlan ? (
                  <div className="flex h-full min-h-[360px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                    Fill the brief and generate a launch plan.
                  </div>
                ) : (
                  <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 text-sm">
                    {[
                      ['Assistant', launchPlan.assistant?.name, launchPlan.assistant?.instructions],
                      ['Templates', `${launchPlan.templates?.length || 0} drafts`, launchPlan.templates?.map((t: any) => t.name).join(', ')],
                      ['WhatsApp Flow', launchPlan.whatsapp_flow?.name, launchPlan.whatsapp_flow?.fields?.join(', ')],
                      ['Automation', launchPlan.automation?.name, launchPlan.automation?.steps?.join(' -> ')],
                      ['Widget', launchPlan.widget?.mode, launchPlan.widget?.welcome_message],
                      ['Campaign', launchPlan.campaign?.name, launchPlan.campaign?.audience],
                    ].map(([title, main, sub]) => (
                      <div key={title} className="rounded-xl border border-gray-200 bg-white p-3">
                        <p className="text-xs font-black uppercase tracking-wide text-gray-400">{title}</p>
                        <p className="mt-1 font-bold text-gray-900">{main || 'Draft ready'}</p>
                        {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
                      </div>
                    ))}
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                      Next: {(launchPlan.next_steps || []).join(' -> ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <Button variant="secondary" onClick={() => setShowLaunchAssistant(false)} disabled={launchDrafting}>Close</Button>
              {launchPlan && (
                <Button
                  variant="secondary"
                  loading={launchDrafting}
                  disabled={launchDrafting}
                  onClick={async () => {
                    setLaunchDrafting(true);
                    try {
                      const description = [
                        launchBrief.business_name && `Business: ${launchBrief.business_name}`,
                        launchBrief.industry && `Industry: ${launchBrief.industry}`,
                        launchBrief.goal && `Goal: ${launchBrief.goal}`,
                        launchBrief.products_services && `Products/services: ${launchBrief.products_services}`,
                        launchBrief.target_customers && `Target customers: ${launchBrief.target_customers}`,
                        launchBrief.common_questions && `Common questions: ${launchBrief.common_questions}`,
                        launchPlan.automation?.steps?.length ? `Suggested steps: ${launchPlan.automation.steps.join(' -> ')}` : '',
                      ].filter(Boolean).join('\n');
                      const res = await post('/api/automation/workflows/generate-from-description', {
                        description,
                        platform: 'whatsapp',
                      });
                      const { nodes: genNodes, edges: genEdges, name: genName } = res.data;
                      const liveNodes2 = (genNodes as BuilderBlock[]).map((n) =>
                        (n.type === 'action' || n.type === 'ai') && n.config?.send_mode
                          ? { ...n, config: { ...n.config, send_mode: 'live' } }
                          : n
                      );
                      setNodes(liveNodes2);
                      setEdges(genEdges);
                      setWorkflowName(genName || launchPlan.automation?.name || 'Agentic Launch Automation');
                      setShowWorkflowList(false);
                      setShowLaunchAssistant(false);
                      setTimeout(() => autoArrangeFlow(), 100);
                      toast.success('Canvas draft created. Review every node before going live.');
                    } catch (err: any) {
                      toast.error(err.response?.data?.detail || 'Could not create canvas draft');
                    } finally {
                      setLaunchDrafting(false);
                    }
                  }}
                >
                  Build Canvas Draft
                </Button>
              )}
              <Button
                className="flex-1"
                loading={launchDrafting}
                disabled={launchDrafting || launchBrief.industry.trim().length < 2 || launchBrief.goal.trim().length < 5}
                onClick={async () => {
                  setLaunchDrafting(true);
                  try {
                    const res = await post('/api/automation/agentic/launch-plan', launchBrief);
                    setLaunchPlan(res.data.launch_plan);
                    toast.success('Launch plan drafted. Review before activating.');
                  } catch (err: any) {
                    toast.error(err.response?.data?.detail || 'Could not draft launch plan');
                  } finally {
                    setLaunchDrafting(false);
                  }
                }}
              >
                Draft Launch Plan
              </Button>
            </div>
          </div>
        </div>
      )}
      <UpgradeModal
        isOpen={!!lockedFeature}
        onClose={() => setLockedFeature(null)}
        currentPlan={planAccess.currentPlan}
        feature={lockedFeature || undefined}
      />
    </div>
  );
}

// ── n8n-style workflow list ─────────────────────────────────────────────────

function nodeIcon(node: any): string {
  if (node.type === 'trigger') return '⚡';
  if (node.type === 'ai') return '🤖';
  if (node.type === 'condition') return '🔀';
  const tool = String(node.config?.tool || '');
  if (tool.includes('whatsapp')) return '💬';
  if (tool.includes('email') || tool.includes('gmail')) return '📧';
  if (tool.includes('sheet')) return '📊';
  if (tool.includes('instagram')) return '📸';
  if (tool.includes('facebook')) return '📘';
  if (tool.includes('lead') || tool.includes('crm')) return '👤';
  if (tool.includes('wait') || tool.includes('delay')) return '⏳';
  return '⚙️';
}

function nodeLabel(node: any): string {
  return (node.title || node.type || 'Step')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase())
    .slice(0, 16);
}

function MiniFlowPreview({ nodes }: { nodes: any[] }) {
  if (!nodes?.length) return <p className="text-xs text-slate-600 italic">No steps yet</p>;
  const visible = nodes.slice(0, 4);
  const extra = nodes.length - 4;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((n, i) => (
        <span key={n.id || i} className="flex items-center gap-1">
          <span className="flex items-center gap-0.5 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-slate-300">
            <span>{nodeIcon(n)}</span>
            <span className="hidden sm:inline">{nodeLabel(n)}</span>
          </span>
          {i < visible.length - 1 && <span className="text-slate-600 text-[10px]">→</span>}
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400">+{extra}</span>
      )}
    </div>
  );
}

function WorkflowListView({
  workflows,
  loading,
  onOpen,
  onNew,
  onDelete,
  onToggleStatus,
  onClone,
  onRefresh,
  onGenerate,
}: {
  workflows: AutomationWorkflow[];
  loading?: boolean;
  onOpen: (wf: AutomationWorkflow) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onToggleStatus?: (id: string, currentStatus: string) => void;
  onClone?: (id: string) => void;
  onRefresh?: () => void;
  onGenerate?: () => void;
}) {
  const [wfSearch, setWfSearch] = useState('');
  const [wfStatus, setWfStatus] = useState<'all' | 'active' | 'draft'>('all');
  const [selectedWfIds, setSelectedWfIds] = useState<Set<string>>(new Set());
  const [bulkActing, setBulkActing] = useState(false);

  const displayedWfs = workflows
    .filter(w => wfStatus === 'all' || w.status === wfStatus)
    .filter(w => !wfSearch.trim() || w.name.toLowerCase().includes(wfSearch.toLowerCase()));

  const bulkSetStatus = async (newStatus: string) => {
    if (!selectedWfIds.size || !onToggleStatus) return;
    setBulkActing(true);
    for (const id of selectedWfIds) {
      const wf = workflows.find(w => w.id === id);
      if (wf && wf.status !== newStatus) {
        try { onToggleStatus(id, wf.status); } catch { /* ignore */ }
      }
    }
    setSelectedWfIds(new Set());
    setBulkActing(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-slate-950 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Workflows</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {loading ? 'Loading...' : `${displayedWfs.length}${displayedWfs.length !== workflows.length ? ` of ${workflows.length}` : ''} workflows`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
            >
              {loading ? '⟳ Loading...' : '↻ Refresh'}
            </button>
          )}
          <button
            type="button"
            onClick={onNew}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 transition"
          >
            + New Workflow
          </button>
        </div>
      </div>

      {/* Search + filter row */}
      {!loading && workflows.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <input
              value={wfSearch}
              onChange={e => setWfSearch(e.target.value)}
              placeholder="Search workflows…"
              className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]">🔍</span>
            {wfSearch && <button onClick={() => setWfSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 text-xs">✕</button>}
          </div>
          {(['all', 'active', 'draft'] as const).map(s => (
            <button key={s} onClick={() => setWfStatus(s)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition border ${wfStatus === s ? (s === 'active' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : s === 'draft' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-white/10 border-white/20 text-white') : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'}`}>
              {s === 'all' ? 'All' : s === 'active' ? '● Active' : '○ Draft'}
            </button>
          ))}
        </div>
      )}
      {/* Bulk action toolbar */}
      {selectedWfIds.size > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary-500/30 bg-primary-500/10 px-3 py-2">
          <span className="text-xs font-semibold text-primary-300">{selectedWfIds.size} selected</span>
          <button onClick={() => setSelectedWfIds(new Set())} className="text-xs text-primary-400 hover:text-white">Clear</button>
          <div className="ml-auto flex gap-2">
            <button disabled={bulkActing} onClick={() => bulkSetStatus('active')}
              className="rounded-md bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/30 transition disabled:opacity-40">
              ▶ Activate All
            </button>
            <button disabled={bulkActing} onClick={() => bulkSetStatus('draft')}
              className="rounded-md bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-400 hover:bg-amber-500/30 transition disabled:opacity-40">
              ⏸ Pause All
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 min-h-[140px] animate-pulse">
              <div className="h-3 w-24 rounded bg-white/10 mb-3" />
              <div className="h-2 w-40 rounded bg-white/[0.06] mb-2" />
              <div className="h-2 w-32 rounded bg-white/[0.06]" />
              <div className="mt-4 flex gap-2">
                <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
                <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center px-4">
          <div>
            <p className="text-5xl mb-3">⚡</p>
            <p className="text-xl font-bold text-slate-200">Build your first automation</p>
            <p className="text-sm text-slate-500 mt-1 max-w-md">Automations run automatically when a customer messages you — no manual work needed.</p>
          </div>

          {/* How it works — 3 steps */}
          <div className="grid grid-cols-3 gap-3 max-w-lg text-left">
            {[
              { n:'1', icon:'⚡', title:'Choose a Trigger', desc:'When does it start? e.g. New WhatsApp message' },
              { n:'2', icon:'🔀', title:'Add Actions', desc:'What should happen? Send reply, collect info, pay' },
              { n:'3', icon:'✅', title:'Activate', desc:'Turn it on — runs 24/7 without you' },
            ].map(s => (
              <div key={s.n} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-black text-white">{s.n}</span>
                  <span className="text-sm">{s.icon}</span>
                </div>
                <p className="text-xs font-bold text-slate-300">{s.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => onGenerate ? onGenerate() : onNew()}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition">
              ✨ Generate with AI
            </button>
            <button type="button" onClick={onNew}
              className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:border-white/40 hover:text-white transition">
              Start from scratch
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* New workflow card */}
          <button
            type="button"
            onClick={onNew}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-slate-500 hover:border-primary-400/40 hover:bg-primary-500/[0.04] hover:text-slate-300 transition min-h-[140px]"
          >
            <span className="text-2xl">+</span>
            <span className="text-sm font-semibold">New Workflow</span>
          </button>

          {/* Existing workflow cards */}
          {displayedWfs.map((wf) => {
            const graph = wf.config as any;
            const wfNodes: any[] = graph?.nodes || [];
            const triggerLabel = (wf.trigger_type || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
            return (
              <div
                key={wf.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(wf)}
                onKeyDown={(e) => e.key === 'Enter' && onOpen(wf)}
                className="group flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-left hover:border-primary-400/30 hover:bg-white/[0.06] transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedWfIds.has(wf.id)}
                      onClick={e => e.stopPropagation()}
                      onChange={e => {
                        e.stopPropagation();
                        setSelectedWfIds(prev => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(wf.id); else next.delete(wf.id);
                          return next;
                        });
                      }}
                      className="h-3.5 w-3.5 shrink-0 rounded accent-primary-400 cursor-pointer"
                    />
                    <p className="truncate font-bold text-slate-100 group-hover:text-white">{wf.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${wf.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-slate-400'}`}>
                      {wf.status}
                    </span>
                    {onToggleStatus && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleStatus(wf.id, wf.status); }}
                        className={`flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-semibold opacity-0 transition group-hover:opacity-100 ${wf.status === 'active' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                        title={wf.status === 'active' ? 'Pause workflow' : 'Activate workflow'}
                      >
                        {wf.status === 'active' ? '⏸ Pause' : '▶ Activate'}
                      </button>
                    )}
                    {onClone && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClone(wf.id); }}
                        className="flex h-5 items-center gap-1 rounded-md px-1.5 text-[10px] font-semibold text-slate-500 opacity-0 transition hover:bg-white/10 hover:text-slate-200 group-hover:opacity-100"
                        title="Clone workflow"
                      >
                        ⊕ Clone
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${wf.name}"? This cannot be undone.`)) {
                          onDelete(wf.id);
                        }
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-md text-slate-700 transition hover:bg-red-500/20 hover:text-red-400 opacity-40 group-hover:opacity-100"
                      title="Delete workflow"
                      aria-label="Delete workflow"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {triggerLabel && (
                  <p className="text-[11px] text-slate-600">⚡ {triggerLabel}</p>
                )}
                <div className="mt-auto pt-1">
                  <MiniFlowPreview nodes={wfNodes} />
                </div>
                <p className="text-[10px] text-slate-700">
                  {wf.updated_at ? new Date(wf.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

type FlowNodeData = {
  block: BuilderBlock;
  stepIndex: number;
  selected: boolean;
  active: boolean;
  completed: boolean;
  failed: boolean;
  onSelect: (id: string) => void;
  onOpenAddMenu: (sourceId: string, label: string) => void;
  onTestNode: (nodeId: string) => void;
};

function edgeVisualFor(type?: BlockType, label?: string) {
  if (label === 'yes') return { stroke: '#10b981', label: '#bbf7d0' };
  if (label === 'no') return { stroke: '#ef4444', label: '#fecaca' };
  if (type === 'trigger') return { stroke: '#f97316', label: '#fed7aa' };
  if (type === 'ai') return { stroke: '#8b5cf6', label: '#ddd6fe' };
  if (type === 'condition') return { stroke: '#f59e0b', label: '#fde68a' };
  if (type === 'action') return { stroke: '#10b981', label: '#bbf7d0' };
  return { stroke: '#e2e8f0', label: '#f8fafc' };
}

function WorkflowCanvas({
  nodes,
  edges,
  selectedNodeId,
  library,
  isFullscreen,
  onToggleFullscreen,
  onSelectNode,
  onConnectBlocks,
  onAddNode,
  onMoveNode,
  onArrange,
  onTestNode,
  activeNodeIds,
  completedNodeIds,
  failedNodeIds,
  nodeOutputs,
  testing,
}: {
  nodes: BuilderBlock[];
  edges: BuilderEdge[];
  selectedNodeId: string;
  library: LibraryBlock[];
  onSelectNode: (nodeId: string) => void;
  onConnectBlocks: (source: string, target: string, label?: string, sourceHandle?: string | null, targetHandle?: string | null) => void;
  onAddNode: (block: LibraryBlock, position: { x: number; y: number }, sourceId?: string, label?: string) => void;
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  onArrange: () => void;
  onTestNode: (nodeId: string) => void;
  activeNodeIds?: Set<string>;
  completedNodeIds?: Set<string>;
  failedNodeIds?: Set<string>;
  nodeOutputs?: Record<string, any>;
  testing?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();
  const [addMenu, setAddMenu] = useState<{ sourceId: string; label: string } | null>(null);
  const [addMenuShowAll, setAddMenuShowAll] = useState(false);

  const SUGGESTIONS_BY_SOURCE_TYPE: Record<string, string[]> = {
    trigger: ['Detect Language', 'Analyze Sentiment', 'Qualify Lead', 'Generate Reply', 'Send WhatsApp', 'Send Catalog', 'Decide Next Step'],
    ai: ['Send WhatsApp', 'Chat Flow Reply', 'Send Catalog', 'If Hot Lead', 'If Complaint', 'Recommend Product', 'Save to Google Sheet', 'Notify Owner'],
    condition: ['Send WhatsApp', 'Auto Handover', 'Send Catalog', 'Send Payment Link', 'Notify Owner', 'Save to Google Sheet', 'Create Task'],
    action: ['Save to Google Sheet', 'Send Payment Link', 'Collect Order Form', 'Generate GST Invoice', 'Auto Handover', 'Notify Owner', 'Create Task', 'Wait 1 Hour'],
  };

  const flowNodes = useMemo<Node<FlowNodeData>[]>(
    () =>
      nodes.map((node, index) => ({
        id: node.id,
        type: 'b9Block',
        position: { x: node.x, y: node.y },
        data: {
          block: node,
          stepIndex: index + 1,
          selected: selectedNodeId === node.id,
          active: activeNodeIds?.has(node.id) ?? false,
          completed: completedNodeIds?.has(node.id) ?? false,
          failed: failedNodeIds?.has(node.id) ?? false,
          onSelect: onSelectNode,
          onOpenAddMenu: handleOpenAddMenu,
          onTestNode,
        },
      })),
    [nodes, onSelectNode, selectedNodeId, onTestNode, activeNodeIds, completedNodeIds, failedNodeIds]
  );

  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        const edgeVisual = edgeVisualFor(sourceNode?.type, edge.label);
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || edge.label || 'then',
          targetHandle: edge.targetHandle || 'in',
          label: edge.label,
          type: 'smoothstep',
          animated: testing === true,
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeVisual.stroke },
          style: {
            stroke: edgeVisual.stroke,
            strokeWidth: testing ? 3 : 2.5,
            filter: testing ? `drop-shadow(0 0 3px ${edgeVisual.stroke})` : undefined,
          },
          labelStyle: { fill: edgeVisual.label, fontWeight: 800, fontSize: 11 },
          labelBgStyle: { fill: '#0f172a', fillOpacity: 0.92 },
          labelBgPadding: [8, 5],
          labelBgBorderRadius: 10,
        };
      }),
    [edges, nodes, testing]
  );

  const nodeTypes = useMemo(() => ({ b9Block: WorkflowNode }), []);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const rawBlock = event.dataTransfer.getData('application/brainai-block');
    if (!rawBlock) return;

    const block = JSON.parse(rawBlock) as LibraryBlock;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    onAddNode(block, { x: position.x, y: position.y });
  }

  function handleOpenAddMenu(sourceId: string, label: string) {
    const source = nodes.find((node) => node.id === sourceId);
    if (!source) return;
    setAddMenu({ sourceId, label });
    onSelectNode(sourceId);
  }

  return (
    <div className="b9-node-canvas relative h-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/30">
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-100">Workflow Canvas</p>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Trigger → Actions → End</span>
          </div>
          <p className="text-xs text-slate-500">Drag from library · Connect nodes · Left to Right flow</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => zoomOut()} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/20">-</button>
          <button type="button" onClick={() => zoomIn()} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/20">+</button>
          <button type="button" onClick={() => fitView({ padding: 0.25, duration: 300 })} className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-400/20">Fit</button>
          <button type="button" onClick={onArrange} className="inline-flex items-center gap-2 rounded-lg border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-xs font-bold text-sky-100 hover:bg-sky-400/20">
            <Route className="h-4 w-4" />Arrange
          </button>
          <button type="button" onClick={() => onToggleFullscreen?.()}
            title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Fullscreen — library + canvas + settings'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:border-slate-500 transition">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div ref={wrapperRef} className="absolute inset-x-0 bottom-0 top-[64px]" onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          minZoom={0.2}
          maxZoom={1.8}
          defaultViewport={{ x: 72, y: 72, zoom: 0.9 }}
          panOnDrag
          zoomOnScroll
          panOnScroll
          zoomOnPinch
          zoomOnDoubleClick={false}
          nodesDraggable
          nodesConnectable
          connectionMode={ConnectionMode.Loose}
          elementsSelectable
          onNodeClick={(_, node) => onSelectNode(node.id)}
          onNodeDragStop={(_, node) => onMoveNode(node.id, { x: node.position.x, y: node.position.y })}
          onConnect={(connection: Connection) => {
            if (!connection.source || !connection.target) return;
            const label = connection.sourceHandle || 'then';
            onConnectBlocks(connection.source, connection.target, label, connection.sourceHandle, connection.targetHandle || 'in');
          }}
          className="b9-react-flow"
        >
          <Background color="rgba(148, 163, 184, 0.34)" gap={22} size={1.2} />
          <Controls position="bottom-right" showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            position="bottom-left"
            nodeColor={(node) => {
              const block = (node.data as FlowNodeData).block;
              if (block.type === 'trigger') return '#f97316';
              if (block.type === 'ai') return '#a78bfa';
              if (block.type === 'condition') return '#fbbf24';
              return '#34d399';
            }}
            maskColor="rgba(2, 6, 23, 0.72)"
          />
        </ReactFlow>

        {addMenu && (() => {
          const sourceNode = nodes.find((n) => n.id === addMenu.sourceId);
          const sourceType = sourceNode?.type || 'trigger';
          const suggestedTitles = SUGGESTIONS_BY_SOURCE_TYPE[sourceType] || [];
          const nonTrigger = library.filter((b) => b.type !== 'trigger');
          const suggested = suggestedTitles.map((t) => nonTrigger.find((b) => b.title === t)).filter(Boolean) as LibraryBlock[];
          const rest = nonTrigger.filter((b) => !suggestedTitles.includes(b.title));

          const addNodeFromMenu = (block: LibraryBlock) => {
            const source = nodes.find((node) => node.id === addMenu.sourceId);
            onAddNode(
              block,
              {
                x: (source?.x || FLOW_START_X) + FLOW_GAP_X,
                y: addMenu.label === 'yes'
                  ? (source?.y || FLOW_CENTER_Y) - BRANCH_OFFSET_Y
                  : addMenu.label === 'no'
                  ? (source?.y || FLOW_CENTER_Y) + BRANCH_OFFSET_Y
                  : (source?.y || FLOW_CENTER_Y),
              },
              addMenu.sourceId,
              addMenu.label
            );
            setAddMenu(null);
            setAddMenuShowAll(false);
          };

          const renderBlock = (block: LibraryBlock) => {
            const Icon = blockIcons[block.type];
            return (
              <button
                key={`${addMenu.sourceId}-${addMenu.label}-${block.type}-${block.title}`}
                type="button"
                onClick={() => addNodeFromMenu(block)}
                className="b9-tilt-card w-full rounded-xl p-3 text-left transition"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-bold text-gray-950">{block.title}</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{block.description}</p>
              </button>
            );
          };

          return (
            <div
              className="b9-glass absolute z-30 w-72 rounded-2xl p-3"
              style={{ left: 18, top: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-950">Add next step</p>
                  <p className="text-xs text-gray-500 capitalize">Suggested for {sourceType} node</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setAddMenu(null); setAddMenuShowAll(false); }}
                  className="rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-slate-300 hover:bg-white/20"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: '18rem' }}>
                {suggested.map(renderBlock)}

                {rest.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setAddMenuShowAll((p) => !p)}
                      className="w-full rounded-lg border border-white/10 py-1.5 text-[11px] font-bold text-slate-400 hover:bg-white/10 hover:text-slate-200 mt-1"
                    >
                      {addMenuShowAll ? '▲ Less options' : `▼ More options (${rest.length})`}
                    </button>
                    {addMenuShowAll && rest.map(renderBlock)}
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-400/10">
                <Zap className="h-8 w-8 text-orange-400" />
              </div>
              <p className="text-lg font-bold text-slate-100">Build your automation</p>
              <p className="mt-2 max-w-xs text-sm text-slate-400">
                Drag a <span className="font-semibold text-red-300">Trigger</span> from the library, then connect an{' '}
                <span className="font-semibold text-violet-300">AI Agent</span> and an{' '}
                <span className="font-semibold text-emerald-300">Action</span>.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Or click <strong className="text-orange-300">Templates</strong> to start with a ready-made flow.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const NODE_TYPE_META: Record<BlockType, { bar: string; badge: string; label: string }> = {
  trigger:   { bar: 'bg-gradient-to-b from-red-500 to-orange-500', badge: 'bg-red-500/20 text-red-200', label: 'Trigger'   },
  ai:        { bar: 'bg-violet-500', badge: 'bg-violet-500/20 text-violet-300', label: 'AI Agent'  },
  condition: { bar: 'bg-amber-500',  badge: 'bg-amber-500/20 text-amber-300',  label: 'Logic'     },
  action:    { bar: 'bg-emerald-500',badge: 'bg-emerald-500/20 text-emerald-300', label: 'Action'  },
};

function isNodeConfigured(block: BuilderBlock): boolean {
  if (block.type === 'trigger') return !!(block.config?.trigger_type);
  if (block.type === 'ai') {
    const tool = block.config?.tool || '';
    if (tool === 'agentic_agent') return Number(block.config?.max_steps || 0) > 0;
    return true;
  }
  if (block.type === 'condition') return !!(block.config?.field || block.config?.tool === 'ai_condition');
  const tool = block.config?.tool || '';
  if (tool === 'send_whatsapp_message') return !!(block.config?.recipient && (block.config?.message_body || block.config?.template_name));
  if (tool === 'send_whatsapp_media') return !!(block.config?.recipient && block.config?.media_url);
  if (tool === 'send_whatsapp_list_message') return !!(block.config?.recipient && block.config?.body_text && block.config?.button_text && block.config?.sections);
  if (tool === 'send_whatsapp_buttons') return !!(block.config?.recipient && block.config?.body_text && block.config?.buttons);
  if (tool === 'send_whatsapp_cta') return !!(block.config?.recipient && block.config?.body_text && block.config?.buttons);
  if (tool === 'send_whatsapp_meta_flow') return !!(block.config?.recipient && block.config?.flow_id && block.config?.cta_text);
  if (tool === 'send_whatsapp_location') return !!(block.config?.recipient && block.config?.latitude && block.config?.longitude);
  if (tool === 'send_whatsapp_single_product') return !!(block.config?.recipient && block.config?.catalog_id && block.config?.product_retailer_id);
  if (tool === 'send_whatsapp_payment_request') return !!(block.config?.recipient && block.config?.amount);
  if (tool === 'send_instagram_dm') return !!(block.config?.recipient && block.config?.message_body);
  if (tool === 'send_facebook_message') return !!(block.config?.recipient && block.config?.message_body);
  if (tool === 'send_catalog') return !!(block.config?.recipient);
  if (tool === 'create_customer_payment_link') return !!(block.config?.amount && block.config?.recipient_phone);
  if (tool === 'send_email') return !!(block.config?.to && block.config?.subject);
  if (tool === 'add_row_google_sheet') return !!(block.config?.sheet_name || block.config?.connection_id);
  if (tool === 'sync_to_sheet') return !!(block.config?.sheet_name || block.config?.connection_id);
  if (tool === 'http_request') return !!(block.config?.method && block.config?.url);
  if (tool === 'notify_owner') return !!(block.config?.provider);
  if (tool === 'create_task') return true;
  if (tool === 'wait_node') return true;
  return true;
}

type NodeIconDef = { icon: React.ElementType; bg: string; fg: string };

/** Maps each node tool/source/trigger to a branded Lucide icon + color.
 *  Single source of truth used in full node and compact mode. */
function getNodeIcon(block: BuilderBlock): NodeIconDef {
  const tool = block.config?.tool as string | undefined;
  const source = block.config?.source as string | undefined;
  const tt = block.config?.trigger_type as string | undefined;

  // WhatsApp
  if (tool?.includes('whatsapp') || source === 'whatsapp' || tt?.includes('whatsapp'))
    return { icon: MessageCircle, bg: 'bg-emerald-600', fg: 'text-white' };
  // Instagram
  if (tool === 'send_instagram_dm' || source === 'instagram' || tt?.includes('instagram'))
    return { icon: Camera, bg: 'bg-pink-600', fg: 'text-white' };
  // Facebook
  if (tool === 'send_facebook_message' || source === 'facebook' || tt?.includes('facebook'))
    return { icon: Globe, bg: 'bg-blue-600', fg: 'text-white' };
  // Gmail / Email
  if (tool === 'send_email' || tool?.includes('gmail') || source === 'gmail' || tt?.includes('gmail'))
    return { icon: Mail, bg: 'bg-red-600', fg: 'text-white' };
  // Google Sheets
  if (tool === 'add_row_google_sheet' || tool === 'sync_to_sheet' || source === 'google_sheets')
    return { icon: Table2, bg: 'bg-green-600', fg: 'text-white' };
  // Payment / Razorpay
  if (tool?.includes('payment') || tt === 'payment_success')
    return { icon: CreditCard, bg: 'bg-amber-600', fg: 'text-white' };
  // Catalog / Products
  if (tool === 'send_catalog' || tool?.includes('catalog') || tool?.includes('product'))
    return { icon: ShoppingCart, bg: 'bg-teal-600', fg: 'text-white' };
  // Invoice
  if (tool === 'generate_gst_invoice')
    return { icon: FileText, bg: 'bg-emerald-700', fg: 'text-white' };
  // Task / Follow-up
  if (tool === 'create_task' || tool === 'schedule_followup')
    return { icon: CheckSquare, bg: 'bg-blue-600', fg: 'text-white' };
  // Handover
  if (tool === 'auto_handover')
    return { icon: UserCheck, bg: 'bg-violet-600', fg: 'text-white' };
  // Wait / Delay
  if (tool === 'wait_node')
    return { icon: Clock, bg: 'bg-slate-600', fg: 'text-white' };
  // Notify
  if (tool === 'notify_owner')
    return { icon: Bell, bg: 'bg-amber-600', fg: 'text-white' };
  // HTTP / Webhook
  if (tool === 'http_request')
    return { icon: Link2, bg: 'bg-slate-500', fg: 'text-white' };
  // Score / Qualify
  if (tool === 'qualify_lead' || tool === 'score_lead')
    return { icon: Star, bg: 'bg-amber-500', fg: 'text-white' };
  // Calendar / Schedule
  if (tool?.includes('schedule') || tt?.includes('schedule'))
    return { icon: Calendar, bg: 'bg-blue-500', fg: 'text-white' };
  // AI types
  if (block.type === 'ai')
    return { icon: Brain, bg: 'bg-violet-600', fg: 'text-white' };
  // Condition
  if (block.type === 'condition')
    return { icon: GitBranch, bg: 'bg-amber-600', fg: 'text-white' };
  // Website widget trigger
  if (source === 'website_widget')
    return { icon: Monitor, bg: 'bg-cyan-600', fg: 'text-white' };
  // Webhook / IndiaMART
  if (tt === 'webhook' || tt === 'indiamart')
    return { icon: Zap, bg: 'bg-orange-600', fg: 'text-white' };
  // Generic trigger
  if (block.type === 'trigger')
    return { icon: Zap, bg: 'bg-orange-600', fg: 'text-white' };
  // Generic action fallback
  return { icon: Send, bg: 'bg-emerald-600', fg: 'text-white' };
}

function WorkflowNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const { block, stepIndex, selected, active, completed, failed, onSelect, onOpenAddMenu, onTestNode } = data;
  const Icon = blockIcons[block.type];
  const isCondition = block.type === 'condition';
  const meta = NODE_TYPE_META[block.type];
  const { zoom } = useViewport();
  const compact = zoom < 0.70;

  /* Show output variables on AI nodes */
  const outputVars = block.type === 'ai'
    ? (block.config.fields || '')
        .split(',')
        .map((f: string) => f.trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];

  // Compact mode when zoomed out — just icon circle
  const nodeIconDef = getNodeIcon(block);
  const NodeIconComp = nodeIconDef.icon as React.FC<{ className?: string }>;

  if (compact) {
    return (
      <div data-workflow-node onClick={() => onSelect(block.id)}
        className={`b9-flow-node relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl transition-all duration-200
          ${selected ? 'ring-2 ring-cyan-300 ring-offset-1 ring-offset-slate-900' : 'hover:ring-1 hover:ring-white/30'}
          ${active ? 'ring-2 ring-cyan-400 animate-pulse' : ''}
          ${completed ? 'ring-2 ring-emerald-400' : ''}
          ${failed ? 'ring-2 ring-red-400' : ''}`}>
        <div className={`h-full w-full rounded-xl flex items-center justify-center ${nodeIconDef.bg}`}>
          <NodeIconComp className="h-5 w-5 text-white" />
        </div>
        <Handle id="in" type="target" position={Position.Left}
          className="!-left-2 !h-4 !w-4 !rounded-full !border !border-slate-600 !bg-slate-800 !cursor-crosshair" />
        <span className={`absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-slate-900 ${isNodeConfigured(block) ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        {isCondition ? (
          <>
            <Handle id="yes" type="source" position={Position.Right}
              onMouseDown={(e) => { e.stopPropagation(); onOpenAddMenu(block.id, 'yes'); }}
              className="!-right-1.5 !h-4 !w-4 !rounded-full !border !border-emerald-400 !bg-emerald-600 !cursor-pointer"
              style={{ top: '30%' }} />
            <Handle id="no" type="source" position={Position.Right}
              onMouseDown={(e) => { e.stopPropagation(); onOpenAddMenu(block.id, 'no'); }}
              className="!-right-1.5 !h-4 !w-4 !rounded-full !border !border-amber-400 !bg-amber-600 !cursor-pointer"
              style={{ top: '70%' }} />
          </>
        ) : (
          <Handle id="then" type="source" position={Position.Right}
            onMouseDown={(e) => { e.stopPropagation(); onOpenAddMenu(block.id, 'then'); }}
            className="!-right-1.5 !h-4 !w-4 !rounded-full !border !border-orange-400 !bg-orange-500 !cursor-pointer" />
        )}
      </div>
    );
  }

  return (
    <div
      data-workflow-node
      onClick={() => onSelect(block.id)}
      className={`b9-flow-node relative min-h-[148px] w-[220px] cursor-pointer rounded-2xl transition-all duration-300
        ${active
          ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.35)]'
          : completed
          ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_14px_rgba(52,211,153,0.3)]'
          : failed
          ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_14px_rgba(248,113,113,0.3)]'
          : selected
          ? 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-900'
          : 'hover:ring-1 hover:ring-white/20'
        }`}
    >
      {/* Step number badge */}
      {!active && !completed && !failed && (
        <span className="absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[9px] font-black text-slate-300 leading-none">
          {stepIndex}
        </span>
      )}
      {/* Run status corner badge */}
      {active && <span className="absolute right-2 top-2 z-10 h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />}
      {completed && <span className="absolute right-2 top-2 z-10 text-[11px] font-black text-emerald-400 leading-none">✓</span>}
      {failed && <span className="absolute right-2 top-2 z-10 text-[11px] font-black text-red-400 leading-none">✗</span>}

      {/* Top color bar — rounded-t-2xl matches node card top corners */}
      <div className={`h-1 w-full rounded-t-2xl ${meta.bar}`} />

      {/* Handles — onMouseDown to open add menu (fires before ReactFlow absorbs click) + drag still works */}
      <Handle id="in" type="target" position={Position.Left}
        className="!-left-2 !h-5 !w-5 !rounded-full !border-2 !border-slate-600 !bg-slate-800 hover:!bg-slate-700 hover:!border-slate-400 !cursor-crosshair" />
      {isCondition ? (
        <>
          <Handle id="yes" type="source" position={Position.Right}
            onMouseDown={(e) => { e.stopPropagation(); onOpenAddMenu(block.id, 'yes'); }}
            className="!-right-3.5 !h-7 !w-7 !flex !items-center !justify-center !rounded-full !border-2 !border-emerald-400 !bg-slate-800 !text-emerald-300 !text-sm !font-black !cursor-pointer hover:!bg-emerald-600 !transition-all !duration-150"
            style={{ top: '44%' }}>
            <span className="pointer-events-none select-none">+</span>
          </Handle>
          <Handle id="no" type="source" position={Position.Right}
            onMouseDown={(e) => { e.stopPropagation(); onOpenAddMenu(block.id, 'no'); }}
            className="!-right-3.5 !h-7 !w-7 !flex !items-center !justify-center !rounded-full !border-2 !border-amber-400 !bg-slate-800 !text-amber-300 !text-sm !font-black !cursor-pointer hover:!bg-amber-600 !transition-all !duration-150"
            style={{ top: '68%' }}>
            <span className="pointer-events-none select-none">+</span>
          </Handle>
        </>
      ) : (
        <Handle id="then" type="source" position={Position.Right}
          onMouseDown={(e) => { e.stopPropagation(); onOpenAddMenu(block.id, 'then'); }}
          className="!-right-3.5 !h-7 !w-7 !flex !items-center !justify-center !rounded-full !border-2 !border-slate-500 !bg-slate-800 !text-slate-300 !text-sm !font-black !cursor-pointer hover:!border-orange-400 hover:!bg-slate-700 hover:!text-orange-300 !transition-all !duration-150">
          <span className="pointer-events-none select-none">+</span>
        </Handle>
      )}

      {/* Node body — Zapier style: icon left, title+badge right */}
      <div className="flex items-start gap-3 p-3.5">
        {/* Brand icon box */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${nodeIconDef.bg} shadow-lg`}>
          <NodeIconComp className="h-5 w-5 text-white" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Top row: title + status dot */}
          <div className="flex items-start justify-between gap-1.5">
            <p className="text-[13px] font-bold leading-tight text-white tracking-tight truncate">
              {block.title || (block.config?.tool || block.config?.trigger_type || 'Node').replace(/_/g,' ').replace(/\b\w/g,(c:string)=>c.toUpperCase())}
            </p>
            <span
              className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${isNodeConfigured(block) ? 'bg-emerald-400' : 'bg-amber-400'}`}
              title={isNodeConfigured(block) ? 'Ready' : 'Needs setup'}
            />
          </div>

          {/* Type badge */}
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${meta.badge}`}>
            {meta.label}
          </span>

          {/* AI output vars */}
          {outputVars.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {outputVars.map((v: string) => (
                <span key={v} className="rounded-md bg-violet-500/20 px-1.5 py-0.5 font-mono text-[9px] text-violet-300">
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          )}

          {/* Condition YES/NO hint */}
          {isCondition && (
            <div className="mt-2 flex gap-3 text-[10px] font-bold">
              <span className="text-emerald-400">✓ YES</span>
              <span className="text-amber-400">✗ NO</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const TEMPLATE_VAR_SUGGESTIONS = [
  '{{lead.name}}', '{{lead.phone}}', '{{lead.email}}',
  '{{extraction.fields.budget}}', '{{order_form.product_choice}}',
  '{{payment.amount}}', '{{payment.link_url}}', '{{ai.response}}',
];

function ActionBlockSettings({
  tool,
  config,
  integrations,
  integrationStatusFor,
  onChange,
}: {
  tool: string;
  config: Record<string, any>;
  integrations: IntegrationCatalogItem[];
  integrationStatusFor: (provider: string) => string;
  onChange: (key: string, value: string) => void;
}) {
  const linkedProvider = config.provider || defaultProviderForTool(tool);
  const linkedIntegration = integrations.find((item) => item.provider === linkedProvider);

  // Template picker state
  const [waTemplates, setWaTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  const loadTemplates = () => {
    if (templatesLoaded || templatesLoading) return;
    setTemplatesLoading(true);
    const token = useAuthStore.getState().token;
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${base}/api/automation/whatsapp/templates`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        const list = data.templates || data.data || [];
        setWaTemplates(list.filter((t: any) => t.status === 'APPROVED' || t.status === 'approved'));
        setTemplatesLoaded(true);
      })
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  };

  return (
    <div className="space-y-3 rounded-xl bg-orange-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-950">Action setup</p>
          <p className="text-xs text-gray-600">This tells B9 Automation which connected business tool to use.</p>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-primary-700">
          {tool || 'action'}
        </span>
      </div>

      {tool === 'send_whatsapp_message' && (
        <>
          <SelectField label="WhatsApp provider" value={config.provider || 'meta'} options={providerOptions.whatsapp} onChange={(value) => onChange('provider', value)} />
          <InputField label="Connection ID" value={config.connection_id || ''} placeholder="Use default connection if blank" onChange={(value) => onChange('connection_id', value)} />
          <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(value) => onChange('recipient', value)} />
          <SelectField label="Message mode" value={config.message_mode || 'text'} options={['text', 'template']} onChange={(value) => onChange('message_mode', value)} />
          {config.message_mode === 'template' ? (
            <>
              {/* Smart Template Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-700">Select Template</p>
                  <button onClick={() => { setTemplatesLoaded(false); loadTemplates(); }}
                    className="text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold">
                    {templatesLoading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                {/* Dropdown loads on focus/click */}
                <select
                  value={config.template_name || ''}
                  onFocus={loadTemplates}
                  onChange={e => {
                    const name = e.target.value;
                    const tpl = waTemplates.find(t => t.name === name);
                    onChange('template_name', name);
                    if (tpl) {
                      onChange('language_code', tpl.language || 'en_US');
                      const body = (tpl.components || []).find((c: any) => c.type === 'BODY')?.text || '';
                      onChange('_tpl_body', body);
                      const varCount = (body.match(/\{\{\d+\}\}/g) || []).length;
                      onChange('_tpl_var_count', String(varCount));
                      // Clear old var values
                      for (let i = 0; i < 5; i++) onChange(`var_${i}`, '');
                    }
                  }}
                  className="input-field text-sm"
                >
                  <option value="">{templatesLoading ? 'Loading templates...' : waTemplates.length === 0 ? 'Click Refresh to load templates' : 'Select an approved template...'}</option>
                  {waTemplates.map(t => (
                    <option key={t.name} value={t.name}>{t.name} ({t.language || 'en_US'})</option>
                  ))}
                </select>

                {/* Template body preview */}
                {config._tpl_body && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-[11px] text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">
                    {config._tpl_body}
                  </div>
                )}

                {/* Variable mapping — one per {{N}} */}
                {parseInt(config._tpl_var_count || '0') > 0 && (
                  <div className="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Variable Values</p>
                    {Array.from({length: parseInt(config._tpl_var_count || '0')}).map((_, i) => (
                      <div key={i}>
                        <p className="text-[10px] text-gray-500 mb-0.5">
                          {`{{${i+1}}}`} in template =
                        </p>
                        <input
                          value={config[`var_${i}`] || ''}
                          onChange={e => onChange(`var_${i}`, e.target.value)}
                          placeholder={TEMPLATE_VAR_SUGGESTIONS[i] || `{{lead.name}}`}
                          className="input-field text-xs py-1.5"
                        />
                      </div>
                    ))}
                    <p className="text-[9px] text-gray-400">These become {'{{1}}'}, {'{{2}}'} etc. in the template</p>
                  </div>
                )}

                {/* Fallback: manual name input if no templates loaded */}
                {!config.template_name && (
                  <details className="mt-1">
                    <summary className="text-[10px] text-gray-400 cursor-pointer">Enter name manually instead</summary>
                    <InputField label="Template name" value={config.template_name || ''} placeholder="welcome_lead" onChange={(value) => onChange('template_name', value)} />
                  </details>
                )}
              </div>
              <InputField label="Language code" value={config.language_code || 'en_US'} placeholder="en_US" onChange={(value) => onChange('language_code', value)} />
            </>
          ) : (
            <>
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <p className="font-bold mb-1">⚠️ 24-Hour Window Rule</p>
                <p>Text messages only work within <strong>24 hours</strong> of the customer's last message. For first contact or re-engagement after 24h, switch to <strong>Template mode</strong>.</p>
                <button onClick={() => onChange('message_mode', 'template')}
                  className="mt-1.5 rounded-lg bg-amber-700 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-amber-800 transition">
                  Switch to Template →
                </button>
              </div>
              <label className="block text-sm font-semibold text-gray-700">
                Message body
                <textarea value={config.message_body || '{{ai.response}}'} onChange={(e) => onChange('message_body', e.target.value)} rows={3} className="input-field mt-2 resize-none text-sm" />
              </label>
            </>
          )}
          <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(value) => onChange('send_mode', value)} />
          {(config.send_mode || 'draft') === 'draft' ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
              <p className="font-bold mb-1">📋 Draft Mode — message will NOT be sent automatically</p>
              <p>The message will be saved as a draft. After test run, go to <a href="/dashboard/messages" className="font-bold underline">Messages page</a> → WhatsApp Drafts to review and send it.</p>
              <p className="mt-1.5 font-semibold">To auto-send: change Send Mode to <strong>live</strong> and connect WhatsApp in Integrations.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <p className="font-bold mb-2">⚡ Live Mode — 3 steps to enable real sending:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-emerald-800">
                <li><strong>Connect WhatsApp</strong> in <a href="/dashboard/integrations" className="font-bold underline">Integrations</a> with Meta access token + phone number ID</li>
                <li><strong>Click Save</strong> on this workflow after setting Live mode</li>
                <li><strong>Run Test</strong> — messages will be sent live to <code className="font-mono bg-emerald-100 px-1">{'{{lead.phone}}'}</code></li>
              </ol>
              <p className="mt-2 text-[10px] text-emerald-600 italic">Test button runs the <strong>saved</strong> version — always Save first, then Test.</p>
            </div>
          )}
          <SelectField label="Delay" value={config.delay_enabled || 'no'} options={['no', 'yes']} onChange={(value) => onChange('delay_enabled', value)} />
          {config.delay_enabled === 'yes' && (
            <div className="grid grid-cols-2 gap-2">
              <InputField label="Delay value" value={config.delay_value || '10'} placeholder="10" onChange={(value) => onChange('delay_value', value)} />
              <SelectField label="Unit" value={config.delay_unit || 'minutes'} options={['minutes', 'hours', 'days']} onChange={(value) => onChange('delay_unit', value)} />
            </div>
          )}
          <p className="text-xs text-amber-700">Use template messages for follow-ups outside the 24-hour WhatsApp window.</p>
        </>
      )}

      {/* ── Send Facebook Message ────────────────────────────────────────── */}
      {tool === 'send_facebook_message' && (
        <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-blue-950">Facebook Message 📘</p>
              <p className="text-xs text-blue-700">Reply to a Facebook Messenger conversation.</p>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-blue-700">
              {integrationStatusFor('facebook')}
            </span>
          </div>
          <InputField label="Connection ID (optional)" value={config.connection_id || ''} placeholder="Use default Facebook connection" onChange={(v) => onChange('connection_id', v)} />
          <InputField label="Send to" value={config.recipient || '{{facebook.senderId}}'} placeholder="{{facebook.senderId}}" onChange={(v) => onChange('recipient', v)} />
          <label className="block text-sm font-semibold text-gray-700">
            Message body
            <textarea value={config.message_body || '{{ai.response}}'} onChange={e => onChange('message_body', e.target.value)} rows={3} className="input-field mt-2 resize-none text-sm" />
          </label>
          <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
          <div className="rounded-lg bg-white p-2 text-[10px] text-gray-500">
            Variables: <code className="rounded bg-blue-50 px-1">{'{{facebook.senderId}}'}</code> <code className="rounded bg-blue-50 px-1">{'{{facebook.text}}'}</code> <code className="rounded bg-blue-50 px-1">{'{{ai.response}}'}</code>
          </div>
        </div>
      )}

      {/* ── Chat Flow Reply (send_whatsapp_flow_message) ──────────────────── */}
      {tool === 'send_whatsapp_flow_message' && (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-emerald-950">Chat Flow Reply 🔄</p>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{integrationStatusFor('meta')}</span>
          </div>
          <div className="rounded-lg bg-emerald-100 px-3 py-2 text-xs text-emerald-800">
            <p className="font-semibold mb-1">How to use:</p>
            <p>Place this node <strong>after a Conversation Flow (PDF)</strong> AI node. It automatically sends the AI's response — including interactive buttons if the flow step has choices.</p>
          </div>
          <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(v) => onChange('recipient', v)} />
          <label className="block text-sm font-semibold text-gray-700">
            Message (leave blank to use flow response)
            <textarea value={config.message_body || '{{flow.flowResponse}}'} onChange={e => onChange('message_body', e.target.value)} rows={2} className="input-field mt-2 resize-none text-sm" placeholder="{{flow.flowResponse}}" />
          </label>
          <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
        </div>
      )}

      {tool === 'send_instagram_dm' && (
        <div className="space-y-3 rounded-xl border border-pink-200 bg-pink-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-pink-950">Instagram DM</p>
              <p className="text-xs text-pink-700">Sends a DM using the connected Instagram Professional account.</p>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-pink-700">
              {integrationStatusFor('instagram')}
            </span>
          </div>
          <InputField label="Connection ID optional" value={config.connection_id || ''} placeholder="Use default Instagram connection" onChange={(value) => onChange('connection_id', value)} />
          <InputField label="Send to" value={config.recipient || '{{instagram.senderId}}'} placeholder="{{instagram.senderId}}" onChange={(value) => onChange('recipient', value)} />
          <label className="block text-sm font-semibold text-gray-700">
            Message body
            <textarea value={config.message_body || '{{flow.flowResponse}}'} onChange={(e) => onChange('message_body', e.target.value)} rows={3} className="input-field mt-2 resize-none text-sm" />
          </label>
          <p className="rounded-lg bg-white p-2 text-xs text-pink-700">Use this for real conversations only. Meta messaging windows and policy errors are logged cleanly if sending fails.</p>
          <div className="rounded-lg bg-white p-2 text-[10px] text-gray-500">
            Variables: <code className="rounded bg-pink-50 px-1">{'{{instagram.senderId}}'}</code> <code className="rounded bg-pink-50 px-1">{'{{instagram.text}}'}</code> <code className="rounded bg-pink-50 px-1">{'{{lead.name}}'}</code> <code className="rounded bg-pink-50 px-1">{'{{ai.response}}'}</code>
          </div>
        </div>
      )}

      {/* ── WhatsApp Media ────────────────────────────────────────────────── */}
      {tool === 'send_whatsapp_media' && (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-emerald-950">
            {config.media_type === 'document' ? '📄 Send PDF / Document' : config.media_type === 'video' ? '🎥 Send Video' : config.media_type === 'audio' ? '🎵 Send Audio' : '🖼️ Send Image'}
          </p>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{integrationStatusFor('meta')}</span>
          </div>
          <SelectField label="Media type" value={config.media_type || 'image'} options={['image', 'video', 'document', 'audio']} onChange={(value) => onChange('media_type', value)} />
          {/* File upload for media */}
          {(() => {
            const [uploading, setUploading] = React.useState(false);
            const accept = config.media_type === 'document' ? 'application/pdf' : config.media_type === 'video' ? 'video/mp4,video/3gpp' : config.media_type === 'audio' ? 'audio/mpeg,audio/ogg,audio/wav' : 'image/jpeg,image/png,image/webp';
            const uploadMedia = async (file: File) => {
              setUploading(true);
              try {
                const fd = new FormData();
                fd.append('file', file);
                const token = useAuthStore.getState().token;
                const base = process.env.NEXT_PUBLIC_API_URL || '';
                const res = await fetch(`${base}/api/automation/upload-media-public`, {
                  method: 'POST',
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                  body: fd,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Upload failed');
                onChange('media_url', data.public_url);
                if (config.media_type === 'document' && file.name && !config.filename) onChange('filename', file.name);
              } catch (err: any) {
                alert(err.message || 'Upload failed');
              } finally {
                setUploading(false);
              }
            };
            return (
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {config.media_type === 'document' ? 'PDF / Document' : config.media_type === 'video' ? 'Video File' : config.media_type === 'audio' ? 'Audio File' : 'Image File'}
                </label>
                {config.media_url ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2">
                    <span className="text-base">{config.media_type === 'document' ? '📄' : config.media_type === 'video' ? '🎥' : config.media_type === 'audio' ? '🎵' : '🖼️'}</span>
                    <span className="flex-1 truncate text-xs text-gray-600">{config.media_url.split('/').pop()}</span>
                    <button type="button" onClick={() => onChange('media_url', '')} className="text-red-400 hover:text-red-600 text-xs">✕ Remove</button>
                  </div>
                ) : (
                  <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-emerald-200 bg-white px-3 py-3 text-xs text-gray-500 hover:border-emerald-400 hover:bg-emerald-50 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? <><span className="animate-spin">⏳</span> Uploading...</> : <><span>📤</span> Click to upload {config.media_type === 'document' ? 'PDF' : config.media_type === 'video' ? 'video' : config.media_type === 'audio' ? 'audio' : 'image'}</>}
                    <input type="file" className="hidden" accept={accept} onChange={e => { const f = e.target.files?.[0]; if (f) uploadMedia(f); e.target.value = ''; }} />
                  </label>
                )}
              </div>
            );
          })()}
          <InputField label="Caption (optional)" value={config.caption || ''} placeholder="{{ai.response}}" onChange={(value) => onChange('caption', value)} />
          {config.media_type === 'document' && (
            <InputField label="Filename for document" value={config.filename || ''} placeholder="brochure.pdf" onChange={(value) => onChange('filename', value)} />
          )}
          <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(value) => onChange('recipient', value)} />
          <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(value) => onChange('send_mode', value)} />
        </div>
      )}

      {/* ── WhatsApp List / Menu ───────────────────────────────────────────── */}
      {tool === 'send_whatsapp_list_message' && (() => {
        // Parse sections JSON to extract rows for visual editing
        let parsedRows: { id: string; title: string }[] = [];
        try {
          const sec = JSON.parse(config.sections || '[]');
          parsedRows = (sec[0]?.rows || sec) as { id: string; title: string }[];
        } catch { parsedRows = []; }

        const updateRows = (rows: { id: string; title: string }[]) => {
          const sections = [{ title: 'Options', rows: rows.map((r, i) => ({ ...r, id: r.id || `opt_${i + 1}` })) }];
          onChange('sections', JSON.stringify(sections));
        };

        return (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-emerald-950">WhatsApp Menu (List Message)</p>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{integrationStatusFor('meta')}</span>
            </div>
            <InputField label="Menu intro text" value={config.body_text || 'Please choose a service:'} placeholder="Please choose a service:" onChange={(v) => onChange('body_text', v)} />
            <InputField label="Button label" value={config.button_text || 'View Options'} placeholder="View Options" onChange={(v) => onChange('button_text', v)} />
            <div>
              <p className="mb-2 text-xs font-bold text-gray-700">Menu options <span className="font-normal text-gray-400">(max 10)</span></p>
              <div className="space-y-1.5">
                {parsedRows.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={row.title}
                      onChange={(e) => { const next = [...parsedRows]; next[i] = { ...next[i], title: e.target.value }; updateRows(next); }}
                      placeholder={`Option ${i + 1}`}
                      className="input-field flex-1 text-xs py-1.5"
                    />
                    <button type="button" onClick={() => updateRows(parsedRows.filter((_, idx) => idx !== i))} className="rounded p-1 text-red-400 hover:bg-red-50">✕</button>
                  </div>
                ))}
              </div>
              {parsedRows.length < 10 && (
                <button type="button" onClick={() => updateRows([...parsedRows, { id: `opt_${parsedRows.length + 1}`, title: '' }])} className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-800">
                  + Add Option
                </button>
              )}
            </div>
            <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(v) => onChange('recipient', v)} />
            <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
          </div>
        );
      })()}

      {/* ── Send Catalog ─────────────────────────────────────────────────── */}
      {tool === 'send_catalog' && (
        <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-violet-950">Send Product Catalog 🛍</p>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-violet-700">{integrationStatusFor('meta')}</span>
          </div>
          <p className="text-xs text-violet-700">Sends your active products with Buy buttons for the top 3. Manage products in <a href="/dashboard/catalog" className="font-bold underline">Product Catalog</a>.</p>
          <InputField label="Intro message" value={config.intro_text || 'Please review our products:'} placeholder="Please review our products:" onChange={(v) => onChange('intro_text', v)} />
          <InputField label="Filter by category (optional)" value={config.category || ''} placeholder="Leave blank to show all" onChange={(v) => onChange('category', v)} />
          <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(v) => onChange('recipient', v)} />
          <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
          <p className="text-[10px] text-violet-500">After catalog is sent, add "Collect Order Form" to collect customer choice, then "Send Payment Link" to accept payment.</p>
        </div>
      )}

      {/* ── WhatsApp Buttons (3 quick-reply) ─────────────────────────────── */}
      {tool === 'send_whatsapp_buttons' && (() => {
        let btns: {id:string;title:string}[] = [];
        try { btns = JSON.parse(config.buttons || '[]'); } catch { btns = [{id:'btn_0',title:'Option 1'},{id:'btn_1',title:'Option 2'},{id:'btn_2',title:'Option 3'}]; }
        return (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-emerald-950">WhatsApp Buttons (max 3) 🔘</p>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">{integrationStatusFor('meta')}</span>
            </div>
            <InputField label="Message body" value={config.body_text || 'Which option suits you?'} placeholder="Which option suits you?" onChange={(v) => onChange('body_text', v)} />
            <InputField label="Header text (optional)" value={config.header_text || ''} placeholder="Leave blank for no header" onChange={(v) => onChange('header_text', v)} />
            <div>
              <p className="mb-1 text-xs font-bold text-gray-700">Buttons (max 3, max 20 chars each)</p>
              {btns.slice(0,3).map((b,i) => (
                <div key={i} className="flex gap-2 mb-1">
                  <input value={b.title} onChange={e => { const n=[...btns]; n[i]={...n[i],title:e.target.value.slice(0,20)}; onChange('buttons',JSON.stringify(n)); }}
                    className="input-field text-sm flex-1" placeholder={`Button ${i+1} label`} maxLength={20} />
                  {btns.length > 1 && <button onClick={() => { const n=btns.filter((_,j)=>j!==i); onChange('buttons',JSON.stringify(n)); }} className="text-red-400 hover:text-red-600 text-xs px-2">✕</button>}
                </div>
              ))}
              {btns.length < 3 && <button onClick={() => { const n=[...btns,{id:`btn_${btns.length}`,title:`Option ${btns.length+1}`}]; onChange('buttons',JSON.stringify(n)); }} className="text-xs text-emerald-600 font-semibold">+ Add button</button>}
            </div>
            <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(v) => onChange('recipient', v)} />
            <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
          </div>
        );
      })()}

      {/* ── WhatsApp CTA Button ───────────────────────────────────────────── */}
      {tool === 'send_whatsapp_cta' && (() => {
        let btns: {type:string;text:string;url?:string;phone_number?:string}[] = [];
        try { btns = JSON.parse(config.buttons || '[]'); } catch { btns = [{type:'url',text:'Visit Website',url:'https://'}]; }
        return (
          <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-blue-950">WhatsApp CTA Button 🔗</p>
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-blue-700">{integrationStatusFor('meta')}</span>
            </div>
            <InputField label="Message body" value={config.body_text || 'Click below to continue:'} placeholder="Click below to continue:" onChange={(v) => onChange('body_text', v)} />
            <div>
              <p className="mb-1 text-xs font-bold text-gray-700">Buttons (max 2 CTA)</p>
              {btns.slice(0,2).map((b,i) => (
                <div key={i} className="space-y-1 mb-2 p-2 bg-white rounded-lg border border-blue-100">
                  <div className="flex gap-2">
                    <select value={b.type} onChange={e => { const n=[...btns]; n[i]={...n[i],type:e.target.value}; onChange('buttons',JSON.stringify(n)); }} className="input-field text-xs w-32">
                      <option value="url">URL</option>
                      <option value="phone_number">Phone Call</option>
                    </select>
                    <input value={b.text} onChange={e => { const n=[...btns]; n[i]={...n[i],text:e.target.value}; onChange('buttons',JSON.stringify(n)); }} className="input-field text-xs flex-1" placeholder="Button label" maxLength={25} />
                    {btns.length > 1 && <button onClick={() => { const n=btns.filter((_,j)=>j!==i); onChange('buttons',JSON.stringify(n)); }} className="text-red-400 text-xs px-1">✕</button>}
                  </div>
                  {b.type === 'url' && <input value={b.url||''} onChange={e => { const n=[...btns]; n[i]={...n[i],url:e.target.value}; onChange('buttons',JSON.stringify(n)); }} className="input-field text-xs" placeholder="https://your-site.com" />}
                  {b.type === 'phone_number' && <input value={b.phone_number||''} onChange={e => { const n=[...btns]; n[i]={...n[i],phone_number:e.target.value}; onChange('buttons',JSON.stringify(n)); }} className="input-field text-xs" placeholder="+91 XXXXX XXXXX" />}
                </div>
              ))}
              {btns.length < 2 && <button onClick={() => { const n=[...btns,{type:'url',text:'Click Here',url:'https://'}]; onChange('buttons',JSON.stringify(n)); }} className="text-xs text-blue-600 font-semibold">+ Add button</button>}
            </div>
            <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(v) => onChange('recipient', v)} />
            <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
          </div>
        );
      })()}

      {/* ── WhatsApp Form (Meta Flow) ─────────────────────────────────────── */}
      {tool === 'send_whatsapp_meta_flow' && (
        <div className="space-y-3 rounded-xl border border-purple-200 bg-purple-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-purple-950">WhatsApp Form (Meta Flow) 📋</p>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-purple-700">{integrationStatusFor('meta')}</span>
          </div>
          <div className="rounded-lg bg-purple-100 px-3 py-2 text-xs text-purple-800">
            <p className="font-semibold mb-1">What is a WhatsApp Flow?</p>
            <p>A multi-screen interactive form that opens inside WhatsApp. Use it for: surveys, lead capture, appointment booking, support tickets.</p>
            <p className="mt-1">Create flows at: <a href="https://business.facebook.com/wa/manage/flows" target="_blank" rel="noreferrer" className="underline font-semibold">Meta Business Suite → Flows</a></p>
          </div>
          <InputField label="Flow ID (from Meta)" value={config.flow_id || ''} placeholder="1234567890123456" onChange={(v) => onChange('flow_id', v)} />
          <InputField label="CTA Button text" value={config.cta_text || 'Fill Form'} placeholder="Fill Form / Book Now / Get Quote" onChange={(v) => onChange('cta_text', v)} />
          <InputField label="Message body" value={config.body_text || 'Please fill in your details below:'} placeholder="Please fill in your details:" onChange={(v) => onChange('body_text', v)} />
          <InputField label="Header text (optional)" value={config.header_text || ''} placeholder="Leave blank for no header" onChange={(v) => onChange('header_text', v)} />
          <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(v) => onChange('recipient', v)} />
          <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
        </div>
      )}

      {/* ── Send Location ────────────────────────────────────────────────── */}
      {tool === 'send_contact_card' && (
        <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3">
          <p className="text-sm font-bold text-cyan-900">Send Contact Card (vCard) 👤</p>
          <p className="text-xs text-cyan-700">Share a contact directly in WhatsApp — customer can save it with one tap.</p>
          <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(v) => onChange('recipient', v)} />
          <InputField label="Contact name *" value={config.contact_name || ''} placeholder="e.g. Rahul Sharma or {{lead.name}}" onChange={(v) => onChange('contact_name', v)} />
          <InputField label="Contact phone" value={config.contact_phone || ''} placeholder="e.g. +91 XXXXX XXXXX" onChange={(v) => onChange('contact_phone', v)} />
          <InputField label="Contact email" value={config.contact_email || ''} placeholder="e.g. rahul@company.com" onChange={(v) => onChange('contact_email', v)} />
          <InputField label="Company / Org" value={config.contact_org || ''} placeholder="e.g. B9 Automation" onChange={(v) => onChange('contact_org', v)} />
          <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
        </div>
      )}

      {tool === 'send_whatsapp_location' && (
        <div className="space-y-3 rounded-xl border border-teal-200 bg-teal-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-teal-950">Send Location Pin 📍</p>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-teal-700">{integrationStatusFor('meta')}</span>
          </div>
          <p className="text-xs text-teal-700">Sends a Google Maps location pin inside WhatsApp. Customer taps to open in Maps. Great for sharing your store, office, or delivery zone.</p>
          <div className="grid grid-cols-2 gap-2">
            <InputField label="Latitude" value={config.latitude || '28.6139'} placeholder="28.6139" onChange={(v) => onChange('latitude', v)} />
            <InputField label="Longitude" value={config.longitude || '77.2090'} placeholder="77.2090" onChange={(v) => onChange('longitude', v)} />
          </div>
          <InputField label="Location name" value={config.name || 'Our Office'} placeholder="Our Store / Office" onChange={(v) => onChange('name', v)} />
          <InputField label="Address" value={config.address || ''} placeholder="123 Business Park, New Delhi" onChange={(v) => onChange('address', v)} />
          <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(v) => onChange('recipient', v)} />
          <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
          <div className="rounded-lg bg-teal-100 p-2 text-xs text-teal-800">
            <p className="font-semibold">Tip:</p>
            <p>Find coordinates at <strong>maps.google.com</strong> → right-click any location → copy coordinates.</p>
          </div>
        </div>
      )}

      {/* ── Send Single Product ───────────────────────────────────────────── */}
      {tool === 'send_whatsapp_single_product' && (
        <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-orange-950">Send Single Product 🛍️</p>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-orange-700">{integrationStatusFor('meta')}</span>
          </div>
          <p className="text-xs text-orange-700">Sends a single product card from your Meta catalog with an image, name, price, and Buy Now button.</p>
          <InputField label="Catalog ID" value={config.catalog_id || ''} placeholder="From Meta Commerce Manager" onChange={(v) => onChange('catalog_id', v)} />
          <InputField label="Product Retailer ID" value={config.product_retailer_id || ''} placeholder="Your product SKU / ID in catalog" onChange={(v) => onChange('product_retailer_id', v)} />
          <InputField label="Message body" value={config.body_text || 'Check out this product:'} placeholder="Check out this product:" onChange={(v) => onChange('body_text', v)} />
          <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(v) => onChange('recipient', v)} />
          <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
          <div className="rounded-lg bg-orange-100 p-2 text-xs text-orange-800">
            <p>Find your Catalog ID and Product IDs in <strong>Meta Commerce Manager → Catalog</strong>.</p>
          </div>
        </div>
      )}

      {/* ── Get Inbound Media URL ─────────────────────────────────────────── */}
      {tool === 'get_whatsapp_media_url' && (
        <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-indigo-950">Get Inbound Media URL 🖼️</p>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-indigo-700">{integrationStatusFor('meta')}</span>
          </div>
          <p className="text-xs text-indigo-700">When a customer sends an image, video, document, or audio — use this node to fetch its download URL and pass it to the next step (e.g. HTTP Request or AI Agent).</p>
          <InputField label="Media ID" value={config.media_id || '{{message.media_id}}'} placeholder="{{message.media_id}}" onChange={(v) => onChange('media_id', v)} />
          <div className="rounded-lg bg-indigo-100 p-2 text-xs text-indigo-800 space-y-1">
            <p className="font-semibold">Output variables available after this node:</p>
            {['{{get_whatsapp_media_url.url}}', '{{get_whatsapp_media_url.mime_type}}', '{{get_whatsapp_media_url.file_size}}'].map(v => (
              <code key={v} className="block font-mono">{v}</code>
            ))}
            <p className="mt-1 text-indigo-600">Trigger condition: <code className="font-mono">message.type IN (image, video, audio, document)</code></p>
          </div>
        </div>
      )}

      {/* ── WhatsApp Pay (UPI) ───────────────────────────────────────────── */}
      {tool === 'send_whatsapp_payment_request' && (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-rose-950">Request Payment (UPI) 💳</p>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-rose-700">{integrationStatusFor('meta')}</span>
          </div>
          <div className="rounded-lg bg-rose-100 px-3 py-2 text-xs text-rose-800">
            <p className="font-semibold mb-1">WhatsApp Pay — India Only</p>
            <p>Customer receives a payment card inside WhatsApp and can pay via UPI without leaving the chat. Requires <strong>WhatsApp Pay enabled</strong> on your Meta Business account.</p>
            <p className="mt-1">Apply at: <a href="https://business.facebook.com/" target="_blank" rel="noreferrer" className="underline font-semibold">Meta Business Suite → WhatsApp → Payments</a></p>
          </div>
          <InputField label="Amount (₹)" value={config.amount || '{{extraction.fields.amount}}'} placeholder="e.g. 999 or {{order_form.amount}}" onChange={(v) => onChange('amount', v)} />
          <InputField label="Description" value={config.description || 'Payment for your order'} placeholder="Payment for your order" onChange={(v) => onChange('description', v)} />
          <InputField label="Reference ID (optional)" value={config.reference_id || ''} placeholder="Auto-generated if blank" onChange={(v) => onChange('reference_id', v)} />
          <InputField label="Send to" value={config.recipient || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(v) => onChange('recipient', v)} />
          <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
        </div>
      )}

      {/* ── Collect Order Form ────────────────────────────────────────────── */}
      {tool === 'collect_order_form' && (
        <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
          <p className="text-sm font-bold text-orange-950">Collect Order Details 📋</p>
          <p className="text-xs text-orange-700">AI asks the customer step-by-step questions. Each reply advances the form. Collected data goes into <code className="font-mono text-orange-800">{'{{order_form.name}}'}</code>, <code className="font-mono text-orange-800">{'{{order_form.product_choice}}'}</code>, etc.</p>
          <div>
            <p className="mb-1 text-xs font-bold text-gray-700">Fields to collect <span className="font-normal text-gray-400">(comma separated)</span></p>
            <input value={config.fields || 'name, phone, product_choice, quantity, address'} onChange={(e) => onChange('fields', e.target.value)} className="input-field text-sm" placeholder="name, phone, product_choice, quantity, address" />
          </div>
          <div className="rounded-lg bg-white p-2 text-[10px] text-gray-500 space-y-0.5">
            <p className="font-semibold text-gray-700">Available after this node:</p>
            {['order_form.name', 'order_form.phone', 'order_form.product_choice', 'order_form.quantity', 'order_form.address'].map(v => (
              <code key={v} className="mr-1 rounded bg-orange-50 px-1">{`{{${v}}}`}</code>
            ))}
          </div>
        </div>
      )}

      {/* ── Send Payment Link ─────────────────────────────────────────────── */}
      {tool === 'create_customer_payment_link' && (
        <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="text-sm font-bold text-green-950">Send Payment Link 💳</p>
          <p className="text-xs text-green-700">Creates a Razorpay payment link and sends it via WhatsApp. Connect your Razorpay account in <a href="/dashboard/integrations" className="underline font-semibold">Integrations → Razorpay</a>.</p>
          <InputField label="Amount (₹)" value={config.amount || '{{extraction.fields.budget}}'} placeholder="e.g. 4999 or {{order_form.amount}}" onChange={(v) => onChange('amount', v)} />
          <InputField label="Description" value={config.description || '{{extraction.fields.product_choice}}'} placeholder="Payment for {{order_form.product_choice}}" onChange={(v) => onChange('description', v)} />
          <InputField label="Customer phone" value={config.recipient_phone || '{{lead.phone}}'} placeholder="{{lead.phone}}" onChange={(v) => onChange('recipient_phone', v)} />
          <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(v) => onChange('send_mode', v)} />
          <div className="rounded-lg bg-white p-2 text-[10px] text-gray-500 space-y-0.5">
            <p className="font-semibold text-gray-700">After this node:</p>
            <code className="mr-1 rounded bg-green-50 px-1">{'{{payment.link_url}}'}</code>
            <code className="mr-1 rounded bg-green-50 px-1">{'{{payment.amount}}'}</code>
          </div>
        </div>
      )}

      {tool === 'send_email' && (
        <>
          <SelectField label="Email provider" value={config.provider || 'gmail'} options={providerOptions.email} onChange={(value) => onChange('provider', value)} />
          <SelectField label="Recipient" value={config.recipient_source || 'lead_email'} options={recipientSources.map((item) => item.value)} labels={recipientSources} onChange={(value) => onChange('recipient_source', value)} />
          {config.recipient_source === 'custom' && (
            <InputField label="To address" value={config.to || ''} placeholder="owner@yourbusiness.com" onChange={(value) => onChange('to', value)} />
          )}
          <InputField label="Subject" value={config.subject || ''} placeholder="Thanks for your inquiry — {{name}}" onChange={(value) => onChange('subject', value)} />
          <SelectField label="Body mode" value={config.body_mode || 'ai_generated'} options={['ai_generated', 'fixed_template']} onChange={(value) => onChange('body_mode', value)} />
          {config.body_mode === 'fixed_template' && (
            <label className="block text-sm font-semibold text-gray-700">
              Body
              <textarea value={config.body || ''} onChange={(e) => onChange('body', e.target.value)} rows={3} className="input-field mt-2 resize-none text-sm" placeholder={"Hi {{name}},\n\nThanks for reaching out. We'll contact you shortly.\n\nTeam"} />
            </label>
          )}
        </>
      )}

      {['create_gmail_draft_reply', 'send_gmail_reply', 'mark_gmail_read', 'add_gmail_label'].includes(tool) && (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-rose-950">Gmail automation</p>
              <p className="text-xs text-rose-700">
                {tool === 'create_gmail_draft_reply' ? 'Recommended: AI creates a draft for your approval.' : 'Uses the connected Gmail account for this workflow.'}
              </p>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-rose-700">
              {integrationStatusFor('gmail')}
            </span>
          </div>
          <InputField label="Connection ID optional" value={config.connection_id || ''} placeholder="Use default Gmail connection" onChange={(value) => onChange('connection_id', value)} />
          <InputField label="Reply to message ID" value={config.gmail_message_id || '{{email.gmailMessageId}}'} placeholder="{{email.gmailMessageId}}" onChange={(value) => onChange('gmail_message_id', value)} />
          {(tool === 'create_gmail_draft_reply' || tool === 'send_gmail_reply') && (
            <>
              <InputField label="Subject" value={config.subject || 'Re: {{email.subject}}'} placeholder="Re: {{email.subject}}" onChange={(value) => onChange('subject', value)} />
              <label className="block text-sm font-semibold text-gray-700">
                Reply body
                <textarea value={config.body || '{{flow.flowResponse}}'} onChange={(e) => onChange('body', e.target.value)} rows={4} className="input-field mt-2 resize-none text-sm" placeholder="{{flow.flowResponse}}" />
              </label>
            </>
          )}
          {tool === 'send_gmail_reply' && (
            <>
              <SelectField label="Auto-send" value={config.auto_send || 'false'} options={['false', 'true']} onChange={(value) => onChange('auto_send', value)} />
              <InputField label="Minimum AI confidence" value={config.min_confidence || '0.85'} placeholder="0.85" onChange={(value) => onChange('min_confidence', value)} />
              <p className="rounded-lg bg-white p-2 text-xs text-amber-700">Auto-send is off by default. If confidence is low or intent is sensitive, B9 creates a draft instead.</p>
            </>
          )}
          {tool === 'add_gmail_label' && (
            <InputField label="Label name" value={config.label_name || 'B9 Automation'} placeholder="B9 Automation" onChange={(value) => onChange('label_name', value)} />
          )}
          {tool === 'mark_gmail_read' && (
            <p className="rounded-lg bg-white p-2 text-xs text-rose-700">This marks the synced incoming email as read after earlier nodes finish.</p>
          )}
          <div className="rounded-lg bg-white p-2 text-[10px] text-gray-500">
            Variables: <code className="rounded bg-rose-50 px-1">{'{{email.subject}}'}</code> <code className="rounded bg-rose-50 px-1">{'{{email.bodyText}}'}</code> <code className="rounded bg-rose-50 px-1">{'{{lead.email}}'}</code> <code className="rounded bg-rose-50 px-1">{'{{ai.response}}'}</code>
          </div>
        </div>
      )}

      {(tool === 'sync_to_sheet' || tool === 'add_row_google_sheet') && (
        <>
          <SelectField label="Sheet provider" value={config.provider || 'google_sheets'} options={providerOptions.sheet} onChange={(value) => onChange('provider', value)} />
          {tool === 'add_row_google_sheet' && (
            <InputField label="Connection ID" value={config.connection_id || ''} placeholder="Use default connection if blank" onChange={(value) => onChange('connection_id', value)} />
          )}
          <InputField label="Sheet name" value={config.sheet_name || ''} placeholder="Website Leads" onChange={(value) => onChange('sheet_name', value)} />
          <InputField label="Tab name" value={config.tab_name || ''} placeholder="Leads" onChange={(value) => onChange('tab_name', value)} />
          <label className="block text-sm font-semibold text-gray-700">
            Column mapping
            <textarea
              value={config.row_mapping || 'Name={{lead.name}}\nPhone={{lead.phone}}\nEmail={{lead.email}}\nMessage={{lead.message}}\nAI Reply={{ai.response}}\nStatus={{lead.status}}'}
              onChange={(e) => onChange('row_mapping', e.target.value)}
              rows={5}
              className="input-field mt-2 resize-none text-sm"
            />
            <span className="mt-1 block text-xs text-gray-500">One per line: Column name = value or variable.</span>
          </label>
        </>
      )}

      {tool === 'push_to_crm' && (
        <>
          <SelectField label="CRM provider" value={config.provider || 'zoho'} options={providerOptions.crm} onChange={(value) => onChange('provider', value)} />
          <InputField label="Pipeline/module" value={config.pipeline || ''} placeholder="Leads" onChange={(value) => onChange('pipeline', value)} />
          <InputField label="Stage" value={config.stage || ''} placeholder="New Lead" onChange={(value) => onChange('stage', value)} />
          <SelectField label="Lead status source" value={config.status_source || 'ai_score'} options={['ai_score', 'fixed_stage']} onChange={(value) => onChange('status_source', value)} />
        </>
      )}

      {tool === 'book_meeting' && (
        <>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 mb-2">
            📋 This node creates a meeting task reminder for your team to follow up manually.
          </div>
          <InputField label="Booking link (send to lead)" value={config.booking_link || ''} placeholder="https://calendly.com/your-business/demo" onChange={(value) => onChange('booking_link', value)} />
          <InputField label="Meeting type" value={config.meeting_type || ''} placeholder="demo, site_visit, trial_class" onChange={(value) => onChange('meeting_type', value)} />
          <InputField label="Due in days" value={config.days_from_now || '1'} placeholder="1" onChange={(value) => onChange('days_from_now', value)} />
        </>
      )}

      {tool === 'notify_owner' && (
        <>
          <SelectField label="Alert channel" value={config.provider || 'telegram'} options={providerOptions.notify} onChange={(value) => onChange('provider', value)} />
          <SelectField label="Notify when" value={config.notify_when || 'hot_lead'} options={['hot_lead', 'low_confidence', 'failed_automation', 'new_lead']} onChange={(value) => onChange('notify_when', value)} />
          <InputField label="Recipient/admin" value={config.recipient || ''} placeholder={config.provider === 'email' ? 'owner@yourbusiness.com' : 'owner chat id or channel'} onChange={(value) => onChange('recipient', value)} />
          {config.provider === 'email' && (
            <InputField label="Email subject" value={config.email_subject || ''} placeholder="Hot Lead Alert: {name} is waiting" onChange={(value) => onChange('email_subject', value)} />
          )}
          <InputField label="Alert template" value={config.alert_template || ''} placeholder="Hot lead waiting: {name} - {requirement}" onChange={(value) => onChange('alert_template', value)} />
        </>
      )}

      {tool === 'create_proposal' && (
        <>
          <InputField label="Proposal type" value={config.proposal_type || 'sales'} placeholder="sales, admission, service_quote" onChange={(value) => onChange('proposal_type', value)} />
          <InputField label="Business offer" value={config.offer || ''} placeholder="Free demo class, site visit, consultation" onChange={(value) => onChange('offer', value)} />
          <SelectField label="Save output as" value={config.output || 'draft'} options={['draft', 'pdf_draft', 'content_record']} onChange={(value) => onChange('output', value)} />
        </>
      )}

      {tool === 'http_request' && (
        <HttpRequestSettings config={config} onChange={onChange} />
      )}

      {tool === 'set_variable' && (
        <SetVariableSettings config={config} onChange={onChange} />
      )}

      {tool === 'wait_node' && (
        <WaitNodeSettings config={config} onChange={onChange} />
      )}

      {tool === 'loop' && (
        <LoopNodeSettings config={config} onChange={onChange} />
      )}

      {tool === 'request_approval' && (
        <RequestApprovalSettings config={config} onChange={onChange} />
      )}

      {tool === 'generate_gst_invoice' && (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-bold text-gray-700">GST Invoice Settings</p>
          <InputField label="Seller GSTIN" value={config.seller_gstin || ''} placeholder="27AABCU9603R1ZX" onChange={(v) => onChange('seller_gstin', v)} />
          <InputField label="Service / Item description" value={config.service || ''} placeholder="Web Development Services" onChange={(v) => onChange('service', v)} />
          <InputField label="Amount (₹)" value={config.amount || ''} placeholder="50000" onChange={(v) => onChange('amount', v)} />
          <InputField label="GST Rate (%)" value={config.gst_rate || '18'} placeholder="18" onChange={(v) => onChange('gst_rate', v)} />
          <p className="text-[10px] text-gray-400">{`Buyer details auto-filled from lead extraction ({{name}}, {{phone}}, {{email}}).`}</p>
        </div>
      )}

      {/* ── Schedule Reminder ────────────────────────────────────────────── */}
      {tool === 'schedule_followup' && (
        <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-sm font-bold text-sky-950">Schedule Reminder ⏰</p>
          <div className="rounded-lg bg-sky-100 px-3 py-2 text-xs text-sky-800">
            <p className="font-semibold mb-1">How it works:</p>
            <p>This sets a follow-up timer on the lead. After X hours/days, the <strong>Follow-up Due</strong> trigger in another workflow fires automatically and sends the reminder message.</p>
            <p className="mt-1 font-semibold">Tip: Create a second workflow with "Follow-up Due" trigger + "Send WhatsApp" to send the reminder.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InputField label="Hours from now" value={config.hours || '24'} placeholder="24" onChange={(v) => onChange('hours', v)} />
            <InputField label="Days from now" value={config.days || '0'} placeholder="0" onChange={(v) => onChange('days', v)} />
          </div>
          <label className="block text-sm font-semibold text-gray-700">
            Reminder message
            <textarea value={config.message || 'Hi {{lead.name}}, just checking in! Do you need any help?'} onChange={e => onChange('message', e.target.value)} rows={3} className="input-field mt-2 resize-none text-sm" />
          </label>
          <div className="rounded-lg bg-white p-2 text-[10px] text-gray-500">
            Variables: <code className="rounded bg-sky-50 px-1">{'{{lead.name}}'}</code> <code className="rounded bg-sky-50 px-1">{'{{order_form.product_choice}}'}</code> <code className="rounded bg-sky-50 px-1">{'{{payment.amount}}'}</code>
          </div>
        </div>
      )}

      {/* ── Create Task ──────────────────────────────────────────────────── */}
      {tool === 'create_task' && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-bold text-amber-950">Create Task 📋</p>
          <p className="text-xs text-amber-700">Adds a follow-up task to your B9 task board so your team doesn't miss this lead.</p>
          <InputField label="Task title" value={config.title || 'Follow up with {{lead.name}}'} placeholder="Follow up with {{lead.name}}" onChange={(v) => onChange('title', v)} />
          <label className="block text-sm font-semibold text-gray-700">
            Description (optional)
            <textarea value={config.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} className="input-field mt-2 resize-none text-sm" placeholder="Lead interested in {{extraction.fields.requirement}}" />
          </label>
          <SelectField label="Priority" value={config.priority || 'medium'} options={['low', 'medium', 'high', 'urgent']} onChange={(v) => onChange('priority', v)} />
          <InputField label="Due in (days)" value={config.days_from_now || '1'} placeholder="1" onChange={(v) => onChange('days_from_now', v)} />
          <InputField label="Assign to (user ID or blank for owner)" value={config.assignee || ''} placeholder="Leave blank to assign to yourself" onChange={(v) => onChange('assignee', v)} />
        </div>
      )}

      {/* ── Auto Handover ─────────────────────────────────────────────────── */}
      {tool === 'auto_handover' && (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <p className="text-sm font-bold text-rose-950">Auto Handover 🤝</p>
          <div className="rounded-lg bg-rose-100 px-3 py-2 text-xs text-rose-800">
            <p className="font-semibold mb-1">What this does:</p>
            <p>Stops automation for this lead, marks it as <strong>"needs human"</strong>, and notifies the owner immediately. Use when AI detects a complaint, legal issue, or sensitive request.</p>
          </div>
          <label className="block text-sm font-semibold text-gray-700">
            Handover reason
            <textarea value={config.reason || '{{flow.reason}}'} onChange={e => onChange('reason', e.target.value)} rows={2} className="input-field mt-2 resize-none text-sm" placeholder="Customer needs human assistance: {{ai.intent}}" />
          </label>
          <SelectField label="Notify owner via" value={config.notify_via || 'telegram'} options={['telegram', 'email', 'slack', 'none']} onChange={(v) => onChange('notify_via', v)} />
          <label className="block text-sm font-semibold text-gray-700">
            Message to send customer (optional)
            <textarea value={config.handover_message || ''} onChange={e => onChange('handover_message', e.target.value)} rows={2} className="input-field mt-2 resize-none text-sm" placeholder="Our team will contact you shortly. We're here to help!" />
          </label>
        </div>
      )}

      {!['http_request', 'set_variable'].includes(tool) && (
        <div className="rounded-lg bg-white p-3 text-xs text-gray-600">
          <p className="font-bold text-gray-900">Connection status</p>
          <p className="mt-1">
            {linkedProvider}: {integrationStatusFor(linkedProvider)}
            {(linkedIntegration as any)?.env_ready ? ' / live ready' : ' / draft only'}
          </p>
        </div>
      )}

      {/* ── 📋 Variable Cheat Sheet ───────────────────────────────────────── */}
      <details className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
        <summary className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 select-none">
          <span>📋 Available Variables — click to copy</span>
          <span className="text-gray-400 text-[10px]">expand</span>
        </summary>
        <div className="px-3 pb-3 pt-1 space-y-2">
          {[
            { group: 'Lead', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', vars: ['{{lead.name}}','{{lead.phone}}','{{lead.email}}','{{lead.message}}','{{lead.status}}','{{lead.source}}'] },
            { group: 'Message', color: 'bg-blue-50 text-blue-800 border-blue-200', vars: ['{{user_message}}','{{message.text}}','{{message.media_id}}','{{message.location.latitude}}'] },
            { group: 'AI Output', color: 'bg-violet-50 text-violet-800 border-violet-200', vars: ['{{ai.response}}','{{ai.intent}}','{{ai.confidence}}','{{flow.flowResponse}}'] },
            { group: 'WhatsApp', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', vars: ['{{whatsapp.fromNumber}}','{{whatsapp.interactiveReply.id}}','{{whatsapp.buttonPayload}}'] },
            { group: 'Instagram', color: 'bg-pink-50 text-pink-800 border-pink-200', vars: ['{{instagram.senderId}}','{{instagram.text}}'] },
            { group: 'Facebook', color: 'bg-blue-50 text-blue-800 border-blue-200', vars: ['{{facebook.senderId}}','{{facebook.text}}'] },
            { group: 'Email', color: 'bg-sky-50 text-sky-800 border-sky-200', vars: ['{{email.subject}}','{{email.bodyText}}','{{email.gmailMessageId}}'] },
            { group: 'Extraction', color: 'bg-amber-50 text-amber-800 border-amber-200', vars: ['{{extraction.fields.name}}','{{extraction.fields.phone}}','{{extraction.fields.budget}}','{{extraction.confidence}}'] },
            { group: 'Orders', color: 'bg-orange-50 text-orange-800 border-orange-200', vars: ['{{order_form.name}}','{{order_form.product_choice}}','{{order_form.quantity}}','{{order_form.address}}'] },
            { group: 'Payment', color: 'bg-green-50 text-green-800 border-green-200', vars: ['{{payment.link_url}}','{{payment.amount}}','{{payment.status}}'] },
            { group: 'Media', color: 'bg-purple-50 text-purple-800 border-purple-200', vars: ['{{get_whatsapp_media_url.url}}','{{get_whatsapp_media_url.mime_type}}'] },
            { group: 'Loop', color: 'bg-slate-50 text-slate-800 border-slate-200', vars: ['{{loop.item}}','{{loop.index}}','{{loop.total}}'] },
          ].map(({ group, color, vars }) => (
            <div key={group}>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">{group}</p>
              <div className="flex flex-wrap gap-1">
                {vars.map(v => (
                  <button key={v} onClick={() => {
                    navigator.clipboard.writeText(v);
                    // Brief visual feedback via title change not possible without state — use toast via a hack
                    const el = document.activeElement as HTMLElement;
                    if (el) el.setAttribute('title', 'Copied!');
                  }} title="Click to copy"
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10px] hover:opacity-70 active:scale-95 transition ${color}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[9px] text-gray-400 mt-1">Click any variable to copy it, then paste into any config field above.</p>
        </div>
      </details>

      {/* Retry on failure — shown for all action nodes */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700">Retry on failure</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => onChange('retry_count', config.retry_count && config.retry_count !== '0' ? '0' : '1')}
              className={`relative h-4 w-8 rounded-full transition-colors ${config.retry_count && config.retry_count !== '0' ? 'bg-primary-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${config.retry_count && config.retry_count !== '0' ? 'translate-x-4' : ''}`} />
            </div>
          </label>
        </div>
        {config.retry_count && config.retry_count !== '0' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Retries (max 3)</p>
              <select value={config.retry_count || '1'} onChange={e => onChange('retry_count', e.target.value)} className="input-field text-xs py-1">
                <option value="1">1 retry</option>
                <option value="2">2 retries</option>
                <option value="3">3 retries</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Delay (seconds)</p>
              <input type="number" min="1" max="30" value={config.retry_delay_seconds || '5'} onChange={e => onChange('retry_delay_seconds', e.target.value)} className="input-field text-xs py-1" />
            </div>
          </div>
        )}
        <p className="text-[10px] text-slate-400">If this step fails (e.g. API timeout), retry automatically before marking the run as failed.</p>
      </div>
    </div>
  );
}

const AI_TEMPLATES: Array<{
  key: string;
  label: string;
  desc: string;
  prompt: string;
  fields: string;
  tool: string;
}> = [
  {
    key: 'standard_lead',
    label: 'Standard Lead',
    desc: 'Name, phone, email, requirement',
    prompt: 'Extract the lead\'s name, phone number, email, and what they are looking for.',
    fields: 'name, phone, email, requirement',
    tool: 'extract_structured_data',
  },
  {
    key: 'budget_details',
    label: 'Budget + Details',
    desc: 'Budget, location, timeline',
    prompt: 'Extract name, phone, budget amount, location preference, and timeline from this message.',
    fields: 'name, phone, budget, location, timeline, requirement',
    tool: 'extract_structured_data',
  },
  {
    key: 'document_qa',
    label: 'Document Q&A',
    desc: 'Answer from uploaded docs',
    prompt: 'Find the answer to the user\'s question from uploaded business documents.',
    fields: '',
    tool: 'document_routing',
  },
  {
    key: 'custom',
    label: 'Custom',
    desc: 'Write your own prompt',
    prompt: '',
    fields: '',
    tool: 'extract_structured_data',
  },
];

const OUTPUT_TYPES = [
  { value: 'fields', label: 'Field list', desc: 'Key-value pairs like name, phone' },
  { value: 'json', label: 'JSON', desc: 'Structured JSON object' },
  { value: 'text', label: 'Plain text', desc: 'Raw AI response' },
];

function AiBlockSettings({ config, onChange }: { config: Record<string, any>; onChange: (key: string, value: string) => void }) {
  const { post } = useApi();
  const [testMessage, setTestMessage] = useState('My name is Rahul. I want a Class 12 Physics demo. Phone XXXXXXXXXX.');
  const [testResult, setTestResult] = useState<{ extracted: Record<string, string>; confidence: number; variables: string[]; ai_response?: string; error?: string } | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');

  const activeTemplate = config.ai_template || 'standard_lead';
  const currentOutputType = config.output_type || 'fields';
  const customPrompt = config.custom_prompt || '';
  const currentFields = config.fields || 'name, phone, email, requirement';

  const selectTemplate = (tpl: typeof AI_TEMPLATES[number]) => {
    onChange('ai_template', tpl.key);
    onChange('tool', tpl.tool);
    if (tpl.prompt) onChange('custom_prompt', tpl.prompt);
    if (tpl.fields) onChange('fields', tpl.fields);
  };

  const derivedVariables: string[] = (currentFields || '')
    .split(',')
    .map((f: string) => f.trim())
    .filter(Boolean)
    .map((f: string) => `{{${f}}}`);

  const runTest = async () => {
    setTestLoading(true);
    setTestError('');
    setTestResult(null);
    try {
      const resp = await post('/api/automation/blocks/test-prompt', {
        message: testMessage,
        fields: currentFields,
        custom_prompt: customPrompt,
        model: 'gemini-1.5-flash',
        output_type: currentOutputType,
      });
      setTestResult(resp.data);
    } catch (err: any) {
      setTestError(err.response?.data?.detail || 'Test failed. Try again.');
    } finally {
      setTestLoading(false);
    }
  };

  if (config.tool === 'agentic_agent') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
          <p className="text-xs font-bold text-violet-700">Agentic AI Safety</p>
          <p className="mt-1 text-xs text-violet-700">
            AI can choose approved tools, but backend compliance checks still run before any live WhatsApp send.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <InputField label="Max steps" value={config.max_steps || '4'} placeholder="4" onChange={(value) => onChange('max_steps', value)} />
          <InputField label="Max messages" value={config.max_messages || '2'} placeholder="2" onChange={(value) => onChange('max_messages', value)} />
        </div>
        <SelectField label="Send mode" value={config.send_mode || 'draft'} options={['draft', 'live']} onChange={(value) => onChange('send_mode', value)} />
        <SelectField label="Human handover" value={config.handover_enabled || 'true'} options={['true', 'false']} onChange={(value) => onChange('handover_enabled', value)} />
        <SelectField label="Template fallback" value={config.template_fallback_enabled || 'true'} options={['true', 'false']} onChange={(value) => onChange('template_fallback_enabled', value)} />
        <textarea
          value={config.agent_goal || ''}
          onChange={(e) => onChange('agent_goal', e.target.value)}
          rows={3}
          className="input-field resize-none text-sm"
          placeholder="Example: qualify the lead, answer questions from knowledge base, send catalog when buying intent is clear, and hand over complaints."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Template picker */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Template</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {AI_TEMPLATES.map((tpl) => (
            <button
              key={tpl.key}
              type="button"
              onClick={() => selectTemplate(tpl)}
              className={`rounded-xl border p-2.5 text-left transition ${
                activeTemplate === tpl.key
                  ? 'border-violet-400 bg-violet-50 text-violet-800'
                  : 'border-gray-200 hover:border-violet-200 hover:bg-violet-50/40'
              }`}
            >
              <p className="text-xs font-bold">{tpl.label}</p>
              <p className="mt-0.5 text-[10px] text-gray-500">{tpl.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom prompt */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
          Prompt
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => onChange('custom_prompt', e.target.value)}
          rows={3}
          className="input-field mt-2 resize-none text-sm"
          placeholder="Describe what AI should extract or do. E.g. 'Extract class, subject, and phone number from this message.'"
        />
      </div>

      {/* Fields (shown only for extract templates) */}
      {config.tool !== 'document_routing' && config.tool !== 'conversation_flow_pdf' && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
            Fields to extract <span className="font-normal normal-case text-gray-400">(comma separated)</span>
          </label>
          <input
            value={currentFields}
            onChange={(e) => onChange('fields', e.target.value)}
            className="input-field mt-2 text-sm"
            placeholder="name, phone, email, budget, requirement"
          />
        </div>
      )}

      {config.tool === 'conversation_flow_pdf' && (() => {
        const { get: _get } = useApi();
        const [flowDocs, setFlowDocs] = useState<any[]>([]);
        useEffect(() => {
          const assistantId = config.assistant_id;
          if (!assistantId) return;
          _get(`/api/documents/${assistantId}/flow-pdfs?limit=20`)
            .then(r => setFlowDocs(r.data || []))
            .catch(() => {});
        }, [config.assistant_id]); // eslint-disable-line
        return (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 space-y-3">
            <div>
              <p className="text-xs font-bold text-emerald-700 mb-1">AI reads your script PDF step by step</p>
              <div className="rounded-lg bg-emerald-100 px-3 py-2 text-[10px] text-emerald-800 space-y-1">
                <p className="font-semibold">📄 How to write your Flow PDF:</p>
                <p>STEP 1 — Reply: "Which class do you need?" Options: 9th-10th, 11th-12th</p>
                <p>STEP 2A — If 9th-10th: Reply: "Fee ₹X/month." Options: Enroll, Demo</p>
                <p className="text-emerald-600 font-semibold">Max 3 options per step • 20 chars per option</p>
                <a href="/dashboard/documents" className="text-emerald-700 underline font-semibold">Upload flow PDF →</a>
              </div>
            </div>
            <input value={config.assistant_id || ''} onChange={e => onChange('assistant_id', e.target.value)} className="input-field text-xs" placeholder="Assistant ID (required)" />
            {/* Document picker */}
            <div>
              <p className="text-[10px] font-semibold text-emerald-800 mb-1">Select Flow PDF:</p>
              <select value={config.flow_document_id || ''} onChange={e => onChange('flow_document_id', e.target.value)} className="input-field text-xs">
                <option value="">Use latest uploaded flow PDF (recommended)</option>
                {flowDocs.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.title || d.filename} — {d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</option>
                ))}
              </select>
              {flowDocs.length === 0 && config.assistant_id && (
                <p className="text-[9px] text-amber-600 mt-1">No flow PDFs found. <a href="/dashboard/documents" className="underline">Upload one →</a></p>
              )}
            </div>
            <select value={config.strict_mode || 'true'} onChange={e => onChange('strict_mode', e.target.value)} className="input-field text-xs">
              <option value="true">Strict mode ON — follow script exactly</option>
              <option value="false">Strict mode OFF — allow some flexibility</option>
            </select>
            <label className="block text-xs font-semibold text-emerald-800">
              Fallback (when AI is unsure):
              <textarea value={config.fallback_instruction || 'Ask one clarification question or hand over to team if flow is unclear.'} onChange={e => onChange('fallback_instruction', e.target.value)} rows={2} className="input-field mt-1 resize-none text-xs" />
            </label>
            <div className="rounded-lg bg-white p-2 text-[10px] text-gray-600 space-y-0.5">
              <p className="font-bold text-gray-700">Output variables after this node:</p>
              {['{{flow.flowResponse}} — AI reply text', '{{flow.buttons}} — buttons array [{id, title}]', '{{flow.intent}} — greeting | show_catalog | collect_form | take_payment | handover', '{{flow.confidence}} — 0 to 1', '{{ai.response}} — same as flowResponse'].map(v => (
                <p key={v} className="font-mono">{v}</p>
              ))}
            </div>
          </div>
        );
      })()}

      {config.tool === 'ai_agent' && (
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
          <p className="text-xs font-bold text-violet-700">Automation AI uses Gemini Flash for reliability.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input value={config.assistant_id || ''} onChange={(e) => onChange('assistant_id', e.target.value)} className="input-field text-xs" placeholder="Assistant ID optional" />
            <select value={config.tone || 'Friendly'} onChange={(e) => onChange('tone', e.target.value)} className="input-field text-xs">
              <option>Professional</option>
              <option>Friendly</option>
              <option>Hinglish</option>
            </select>
            <select value={config.response_length || 'Short'} onChange={(e) => onChange('response_length', e.target.value)} className="input-field text-xs">
              <option>Short</option>
              <option>Medium</option>
              <option>Detailed</option>
            </select>
            <select value={config.use_knowledge_base || 'true'} onChange={(e) => onChange('use_knowledge_base', e.target.value)} className="input-field text-xs">
              <option value="true">Knowledge Base ON</option>
              <option value="false">Knowledge Base OFF</option>
            </select>
          </div>
        </div>
      )}

      {/* Output type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Output</p>
          <div className="mt-2 space-y-1.5">
            {OUTPUT_TYPES.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name={`output-${config.node_id || 'ai'}`}
                  value={o.value}
                  checked={currentOutputType === o.value}
                  onChange={() => onChange('output_type', o.value)}
                  className="mt-0.5 h-3.5 w-3.5 accent-violet-600"
                />
                <span>
                  <span className="block text-xs font-semibold text-gray-800">{o.label}</span>
                  <span className="block text-[10px] text-gray-400">{o.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Output variables */}
      {derivedVariables.length > 0 && (
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
          <p className="text-xs font-bold text-violet-700">Output variables — use in next blocks</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {derivedVariables.map((v) => (
              <code key={v} className="rounded-md border border-violet-200 bg-white px-2 py-0.5 text-[11px] font-mono font-semibold text-violet-700">
                {v}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* Test section */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Test Output</p>
        <textarea
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          rows={2}
          className="input-field mt-2 resize-none text-xs"
          placeholder="Paste a sample lead message to test..."
        />
        <button
          type="button"
          onClick={runTest}
          disabled={testLoading}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800 transition hover:bg-violet-200 disabled:opacity-60"
        >
          {testLoading ? (
            <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Running...</>
          ) : (
            <><Play className="h-3.5 w-3.5" /> Test Output</>
          )}
        </button>
        {testError && (
          <p className="mt-2 text-xs text-red-600">{testError}</p>
        )}
        {testResult && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700">Extracted</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${testResult.confidence >= 0.6 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {Math.round(testResult.confidence * 100)}% confidence
              </span>
            </div>
            {Object.entries(testResult.extracted).filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-xs">
                <code className="font-mono font-semibold text-violet-700">{`{{${k}}}`}</code>
                <span className="text-gray-400">→</span>
                <span className="truncate text-gray-700">{String(v)}</span>
              </div>
            ))}
            {Object.entries(testResult.extracted).filter(([, v]) => v).length === 0 && (
              <p className="text-xs text-gray-500">No data extracted. Try a different message or check your field names.</p>
            )}
            {testResult.ai_response && (
              <div className="mt-2 rounded-lg border border-violet-100 bg-violet-50 p-2.5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-violet-600">AI Generated Response</p>
                <p className="whitespace-pre-wrap text-xs text-gray-700">{testResult.ai_response}</p>
              </div>
            )}
            {testResult.error && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2.5">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-600">AI Error</p>
                <p className="whitespace-pre-wrap text-xs font-mono text-red-700">{testResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="input-field mt-2" placeholder={placeholder} />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels?: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="input-field mt-2">
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.find((item) => item.value === option)?.label || option.split('_').join(' ')}
          </option>
        ))}
      </select>
    </label>
  );
}

function defaultProviderForTool(tool: string) {
  if (
    tool === 'send_whatsapp_message' ||
    tool.startsWith('send_whatsapp_') ||
    tool === 'send_catalog' ||
    tool === 'create_customer_payment_link'
  ) return 'meta';
  if (tool === 'send_instagram_dm') return 'instagram';
  if (tool === 'send_email') return 'gmail';
  if (['create_gmail_draft_reply', 'send_gmail_reply', 'mark_gmail_read', 'add_gmail_label'].includes(tool)) return 'gmail';
  if (tool === 'sync_to_sheet' || tool === 'add_row_google_sheet') return 'google_sheets';
  if (tool === 'push_to_crm') return 'zoho';
  if (tool === 'book_meeting') return 'calendly';
  if (tool === 'notify_owner') return 'telegram';
  return 'draft';
}

// ── HTTP Request Node Settings ─────────────────────────────────────────────

function HttpRequestSettings({ config, onChange }: { config: Record<string, any>; onChange: (key: string, value: string) => void }) {
  const headers: { key: string; value: string }[] = Array.isArray(config.headers)
    ? config.headers
    : [];

  const setHeaders = (newHeaders: { key: string; value: string }[]) => {
    onChange('headers', JSON.stringify(newHeaders));
  };

  const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
  const removeHeader = (i: number) => setHeaders(headers.filter((_, idx) => idx !== i));
  const updateHeader = (i: number, field: 'key' | 'value', val: string) => {
    const updated = headers.map((h, idx) => (idx === i ? { ...h, [field]: val } : h));
    setHeaders(updated);
  };

  return (
    <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-sky-600" />
        <p className="text-sm font-bold text-sky-900">HTTP Request</p>
        <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-black uppercase text-sky-700">Live</span>
      </div>

      <div className="flex gap-2">
        <div className="w-24 shrink-0">
          <p className="mb-1 text-[10px] font-bold uppercase text-sky-700">Method</p>
          <select value={config.method || 'POST'} onChange={(e) => onChange('method', e.target.value)} className="input-field text-xs">
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
          </select>
        </div>
        <div className="flex-1">
          <p className="mb-1 text-[10px] font-bold uppercase text-sky-700">URL</p>
          <input value={config.url || ''} onChange={(e) => onChange('url', e.target.value)} className="input-field text-xs" placeholder="https://api.example.com/leads" />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase text-sky-700">Headers</p>
          <button type="button" onClick={addHeader} className="flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 hover:bg-sky-200">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {headers.map((h, i) => (
          <div key={i} className="mb-1 flex gap-1.5">
            <input value={h.key} onChange={(e) => updateHeader(i, 'key', e.target.value)} className="input-field flex-1 text-xs" placeholder="Authorization" />
            <input value={h.value} onChange={(e) => updateHeader(i, 'value', e.target.value)} className="input-field flex-1 text-xs" placeholder="Bearer {{token}}" />
            <button type="button" onClick={() => removeHeader(i)} className="rounded-md px-1.5 text-gray-400 hover:text-red-500">×</button>
          </div>
        ))}
      </div>

      {config.method !== 'GET' && (
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase text-sky-700">JSON Body</p>
          <textarea
            value={config.body || ''}
            onChange={(e) => onChange('body', e.target.value)}
            rows={3}
            className="input-field resize-none font-mono text-xs"
            placeholder={'{"name": "{{name}}", "phone": "{{phone}}"}'}
          />
        </div>
      )}

      <div>
        <p className="mb-1 text-[10px] font-bold uppercase text-sky-700">Extract from response (optional)</p>
        <input value={config.extract_path || ''} onChange={(e) => onChange('extract_path', e.target.value)} className="input-field text-xs" placeholder="$.data.id  or  $.lead_id" />
        <p className="mt-0.5 text-[10px] text-sky-600">Use dot-path to pull a value from JSON response into next nodes.</p>
      </div>

      <div className="rounded-lg bg-white p-2 text-[10px] text-gray-500">
        <p className="font-bold text-gray-700">Variable hints</p>
        <p className="mt-0.5">Use <code className="rounded bg-sky-50 px-1 font-mono text-sky-700">{'{{name}}'}</code> <code className="rounded bg-sky-50 px-1 font-mono text-sky-700">{'{{phone}}'}</code> <code className="rounded bg-sky-50 px-1 font-mono text-sky-700">{'{{email}}'}</code> anywhere in URL, headers or body.</p>
      </div>
    </div>
  );
}

// ── Set Variable Node Settings ─────────────────────────────────────────────

function SetVariableSettings({ config, onChange }: { config: Record<string, any>; onChange: (key: string, value: string) => void }) {
  const variables: { key: string; value: string }[] = (() => {
    const v = config.variables;
    if (!v) return [];
    if (typeof v === 'string') {
      try { return Object.entries(JSON.parse(v)).map(([key, value]) => ({ key, value: String(value) })); }
      catch { return []; }
    }
    return Object.entries(v).map(([key, value]) => ({ key, value: String(value) }));
  })();

  const save = (rows: { key: string; value: string }[]) => {
    const obj: Record<string, string> = {};
    rows.forEach(({ key, value }) => { if (key) obj[key] = value; });
    onChange('variables', JSON.stringify(obj));
  };

  const add = () => save([...variables, { key: '', value: '' }]);
  const remove = (i: number) => save(variables.filter((_, idx) => idx !== i));
  const update = (i: number, field: 'key' | 'value', val: string) =>
    save(variables.map((v, idx) => (idx === i ? { ...v, [field]: val } : v)));

  return (
    <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-violet-600" />
        <p className="text-sm font-bold text-violet-900">Set Variables</p>
      </div>
      <p className="text-[10px] text-violet-600">Create or format values using <code className="rounded bg-violet-100 px-1 font-mono">{'{{placeholders}}'}</code> from previous nodes.</p>

      <div className="space-y-1.5">
        {variables.map((v, i) => (
          <div key={i} className="flex gap-1.5">
            <input value={v.key} onChange={(e) => update(i, 'key', e.target.value)} className="input-field w-28 shrink-0 text-xs" placeholder="full_phone" />
            <input value={v.value} onChange={(e) => update(i, 'value', e.target.value)} className="input-field flex-1 text-xs" placeholder="+91{{phone}}" />
            <button type="button" onClick={() => remove(i)} className="rounded-md px-1.5 text-gray-400 hover:text-red-500">×</button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-violet-200 bg-white py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-50">
        <Plus className="h-3.5 w-3.5" /> Add Variable
      </button>
    </div>
  );
}

// ── Webhook URL Panel ──────────────────────────────────────────────────────

function WebhookUrlPanel({ workflowId }: { workflowId: string }) {
  const { get } = useApi();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  useEffect(() => {
    if (!workflowId) return;
    setLoading(true);
    get(`/api/automation/workflows/${workflowId}/webhook-url`)
      .then((r) => setUrl(r.data?.webhook_url || ''))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workflowId, get]);

  const verifyUrl = url ? `${url}/verify` : '';
  const curlExample = url
    ? `curl -X POST "${url}" -H "Content-Type: application/json" -d "{\"name\":\"Test Lead\",\"phone\":\"91XXXXXXXXXX\",\"email\":\"lead@example.com\",\"message\":\"Webhook test lead\"}"`
    : '';

  const copyText = (text: string, kind: 'url' | 'curl') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (kind === 'url') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setCopiedCurl(true);
        setTimeout(() => setCopiedCurl(false), 2000);
      }
    });
  };

  if (!workflowId) {
    return (
      <div className="space-y-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
        <p className="font-bold">Save once to generate the webhook URL</p>
        <p>This trigger is ready. Click Save, then B9 will create a unique inbound URL for this workflow.</p>
        <div className="rounded-lg bg-white/70 p-2 text-[10px] text-amber-700">
          Supported payload fields: <code>name</code>, <code>phone</code>, <code>email</code>, <code>message</code>, plus any custom JSON keys.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
      <div className="flex items-start gap-2">
        <Link className="mt-0.5 h-4 w-4 text-emerald-600" />
        <div>
          <p className="text-xs font-bold text-emerald-900">Inbound Webhook</p>
          <p className="text-[10px] text-emerald-700">Use this URL in Typeform, Zapier, Make, custom forms, or any external tool.</p>
        </div>
      </div>
      {loading ? (
        <p className="text-[10px] text-emerald-600">Generating URL...</p>
      ) : url ? (
        <>
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">POST URL</p>
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2 py-1.5">
            <code className="flex-1 truncate font-mono text-[10px] text-gray-700">{url}</code>
            <button type="button" onClick={() => copyText(url, 'url')} className="shrink-0 rounded-md p-1 hover:bg-emerald-50">
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="shrink-0 rounded-md p-1 hover:bg-emerald-50">
              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            </a>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-white/80 p-2">
            <p className="text-[10px] font-bold text-emerald-900">Verify URL</p>
            <code className="mt-1 block truncate font-mono text-[10px] text-gray-700">{verifyUrl}</code>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-white/80 p-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-emerald-900">Test with cURL</p>
              <button type="button" onClick={() => copyText(curlExample, 'curl')} className="rounded-md px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50">
                {copiedCurl ? 'Copied' : 'Copy'}
              </button>
            </div>
            <code className="block whitespace-pre-wrap break-all font-mono text-[10px] text-gray-700">{curlExample}</code>
          </div>
          <div className="rounded-lg bg-white/80 p-2 text-[10px] text-emerald-800">
            Variables: <code>{'{{webhook.name}}'}</code>, <code>{'{{webhook.phone}}'}</code>, <code>{'{{webhook.email}}'}</code>, <code>{'{{webhook.message}}'}</code>, plus raw payload fields.
          </div>
        </>
      ) : (
        <p className="text-[10px] text-emerald-600">Could not load URL. Save the workflow and try again.</p>
      )}
    </div>
  );
}
// ── Execution Log ──────────────────────────────────────────────────────────

// ── Wait / Delay Node Settings ─────────────────────────────────────────────

function WaitNodeSettings({ config, onChange }: { config: Record<string, any>; onChange: (key: string, value: string) => void }) {
  const PRESETS = [
    { label: '30 min', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '2 hours', minutes: 120 },
    { label: '1 day', minutes: 1440 },
  ];
  return (
    <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-sky-600" />
        <p className="text-sm font-bold text-sky-900">Wait / Delay</p>
      </div>
      <p className="text-[10px] text-sky-600">Pause the workflow, then continue automatically after the set time. Useful for follow-up sequences.</p>
      <div className="grid grid-cols-4 gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.minutes} type="button"
            onClick={() => onChange('delay_minutes', String(p.minutes))}
            className={`rounded-lg border py-1.5 text-[11px] font-bold transition ${Number(config.delay_minutes) === p.minutes ? 'border-sky-400 bg-sky-100 text-sky-800' : 'border-gray-200 bg-white text-gray-600 hover:border-sky-200'}`}>
            {p.label}
          </button>
        ))}
      </div>
      <label className="block text-xs font-semibold text-sky-800">
        Custom delay (minutes)
        <input type="number" min={1} value={config.delay_minutes || 60} onChange={(e) => onChange('delay_minutes', e.target.value)} className="input-field mt-1" placeholder="60" />
      </label>
      <div className="rounded-lg bg-white p-2 text-[10px] text-gray-500">
        <strong className="text-gray-700">How it works:</strong> When the workflow reaches this node, execution pauses. The scheduler resumes it after the delay and continues from the next node.
      </div>
    </div>
  );
}

// ── Loop / ForEach Node Settings ───────────────────────────────────────────

function LoopNodeSettings({ config, onChange }: { config: Record<string, any>; onChange: (key: string, value: string) => void }) {
  return (
    <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-3">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-violet-600" />
        <p className="text-sm font-bold text-violet-900">Loop / ForEach</p>
      </div>
      <p className="text-[10px] text-violet-600">Run the next action for each item in a list from the previous node output. Max 50 items.</p>
      <label className="block text-xs font-semibold text-violet-800">
        Items path (from previous output)
        <input value={config.items_path || 'items'} onChange={(e) => onChange('items_path', e.target.value)} className="input-field mt-1 font-mono text-xs" placeholder="items  or  leads  or  drafts" />
      </label>
      <label className="block text-xs font-semibold text-violet-800">
        Action to run on each item
        <select value={config.tool || 'send_whatsapp_message'} onChange={(e) => onChange('tool', e.target.value)} className="input-field mt-1">
          <option value="send_whatsapp_message">Send WhatsApp</option>
          <option value="send_instagram_dm">Send Instagram DM</option>
          <option value="send_email">Send Email</option>
          <option value="create_gmail_draft_reply">Create Gmail Draft</option>
          <option value="send_gmail_reply">Send Gmail Reply</option>
          <option value="mark_gmail_read">Mark Gmail Read</option>
          <option value="add_gmail_label">Add Gmail Label</option>
          <option value="notify_owner">Notify Owner</option>
          <option value="push_to_crm">Push to CRM</option>
          <option value="sync_to_sheet">Sync to Sheet</option>
          <option value="http_request">HTTP Request</option>
        </select>
      </label>
      <div className="rounded-lg bg-white p-2 text-[10px] text-gray-500">
        <strong className="text-gray-700">Example:</strong> If previous node returns <code className="font-mono text-violet-700">{"{ items: [lead1, lead2] }"}</code>, this node runs "Send WhatsApp" for each lead automatically.
      </div>
    </div>
  );
}

// ── Schedule Trigger Panel ─────────────────────────────────────────────────

const CRON_PRESETS = [
  { label: 'Every day 9 AM IST', cron: '0 3 * * *', desc: 'Daily morning' },
  { label: 'Every Monday 9 AM', cron: '0 3 * * 1', desc: 'Weekly' },
  { label: 'Every hour', cron: '0 * * * *', desc: 'Hourly' },
  { label: 'Every 30 min', cron: '*/30 * * * *', desc: '30 min' },
  { label: 'Every day 6 PM', cron: '0 12 * * *', desc: 'Evening' },
  { label: 'Mon-Fri 9 AM', cron: '0 3 * * 1-5', desc: 'Weekdays' },
];

// ── Version History Button ─────────────────────────────────────────────────

function VersionHistoryButton({ workflowId, onRollback }: { workflowId: string; onRollback: (nodes: any[], edges: any[], name: string) => void }) {
  const { get, post } = useApi();
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    get(`/api/automation/workflows/${workflowId}/versions`)
      .then((r) => setVersions(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const rollback = async (versionId: string, versionNumber: number) => {
    if (!confirm(`Rollback to version ${versionNumber}? Current state will be overwritten.`)) return;
    try {
      await post(`/api/automation/workflows/${workflowId}/rollback/${versionId}`, {});
      // Reload workflow after rollback
      const wfResp = await get(`/api/automation/workflows`);
      const wf = (wfResp.data || []).find((w: any) => w.id === workflowId);
      if (wf?.config?.nodes) {
        onRollback(wf.config.nodes, wf.config.edges || [], wf.name);
      }
      setOpen(false);
      toast.success(`Rolled back to version ${versionNumber}`);
    } catch {
      toast.error('Rollback failed');
    }
  };

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" onClick={() => { setOpen(!open); if (!open) load(); }}>
        <RefreshCw className="h-3.5 w-3.5" /> History
      </Button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-700">Version History</p>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
          </div>
          {loading ? (
            <p className="py-4 text-center text-xs text-gray-400">Loading…</p>
          ) : versions.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400">No saved versions yet. Save the workflow to create snapshots.</p>
          ) : (
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50">
                  <div>
                    <p className="text-xs font-bold text-gray-800">v{v.version_number} — {v.name || 'Workflow'}</p>
                    <p className="text-[10px] text-gray-400">{v.note} · {new Date(v.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <button type="button" onClick={() => rollback(v.id, v.version_number)} className="ml-2 shrink-0 rounded-md bg-orange-50 px-2 py-1 text-[10px] font-bold text-primary-700 hover:bg-orange-100">
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Request Approval Node Settings ────────────────────────────────────────

function RequestApprovalSettings({ config, onChange }: { config: Record<string, any>; onChange: (key: string, value: string) => void }) {
  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-amber-600" />
        <p className="text-sm font-bold text-amber-900">Request Approval</p>
      </div>
      <p className="text-[10px] text-amber-700">Workflow pauses and sends an Approve / Reject link to the owner. Resumes only after approval.</p>
      <SelectField label="Send approval via" value={config.channel || 'telegram'} options={['telegram', 'email', 'whatsapp']} onChange={(v) => onChange('channel', v)} />
      <InputField label="Recipient" value={config.recipient || ''} placeholder="Chat ID, email, or phone" onChange={(v) => onChange('recipient', v)} />
      <label className="block text-xs font-semibold text-amber-800">
        Approval message
        <textarea value={config.message || ''} onChange={(e) => onChange('message', e.target.value)} rows={2} className="input-field mt-1 resize-none text-xs" placeholder="New high-value lead needs your review: {{name}} — {{requirement}}" />
      </label>
      <div className="rounded-lg bg-white p-2 text-[10px] text-gray-500">
        <strong className="text-gray-700">How it works:</strong> Owner receives a message with ✅ Approve and ❌ Reject links. Clicking Approve continues the workflow; Reject stops it.
      </div>
    </div>
  );
}

// ── Facebook Lead Ads Webhook Panel ───────────────────────────────────────

function FacebookWebhookPanel({ workspaceId }: { workspaceId: string }) {
  const [copied, setCopied] = useState(false);
  void workspaceId;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://b9-automation-backend.onrender.com';
  const webhookUrl = `${baseUrl}/api/webhooks/facebook`;
  const verifyToken = 'brainai_fb_verify';

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-blue-600" />
        <p className="text-sm font-bold text-blue-900">Facebook Lead Ads Setup</p>
      </div>
      <div className="space-y-2 text-[10px] text-blue-700">
        <p className="font-bold">Steps:</p>
        <p>1. Facebook Developers → your App → Webhooks → Subscribe to <strong>leadgen</strong> events</p>
        <p>2. Paste the Callback URL and Verify Token below</p>
        <p>3. Connect Facebook in Integrations, then select Page and Lead Form</p>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-bold text-blue-700">Callback URL</p>
        <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2 py-1.5">
          <code className="flex-1 truncate font-mono text-[10px] text-gray-700">{webhookUrl}</code>
          <button type="button" onClick={() => copy(webhookUrl)} className="shrink-0 rounded p-1 hover:bg-blue-50">
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
          </button>
        </div>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-bold text-blue-700">Verify Token</p>
        <div className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2 py-1.5">
          <code className="flex-1 font-mono text-[10px] text-gray-700">{verifyToken}</code>
          <button type="button" onClick={() => copy(verifyToken)} className="shrink-0 rounded p-1 hover:bg-blue-50">
            <Copy className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </div>
      </div>
      <div className="rounded-lg bg-blue-100/60 p-2.5 text-[10px] text-blue-800">
        <p className="font-bold mb-1">Available variables in this flow:</p>
        <div className="flex flex-wrap gap-1">
          {['{{lead.name}}', '{{lead.phone}}', '{{lead.email}}', '{{lead.message}}', '{{facebook.formName}}'].map((v) => (
            <code key={v} className="rounded bg-white px-1.5 py-0.5 font-mono">{v}</code>
          ))}
        </div>
        <p className="mt-2 text-[10px]">Phone from form field <code className="font-mono bg-white px-1">phone_number</code> — auto-normalised for WhatsApp.</p>
      </div>
      <a href="/dashboard/integrations" className="flex items-center gap-1 text-[10px] font-bold text-blue-700 underline">
        <ExternalLink className="h-3 w-3" /> Connect Facebook in Integrations →
      </a>
    </div>
  );
}

function ScheduleTriggerPanel({ workflowId, nodeConfig, onConfigChange }: { workflowId: string; nodeConfig: Record<string, any>; onConfigChange: (key: string, value: string) => void }) {
  const { get, post, delete: del } = useApi();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [cron, setCron] = useState(nodeConfig.cron_expression || '0 3 * * *');
  const [runMsg, setRunMsg] = useState(nodeConfig.run_message || '');
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!workflowId) return;
    get('/api/automation/schedules').then((r) => setSchedules((r.data || []).filter((s: any) => s.workflow_id === workflowId))).catch(() => {});
  };

  useEffect(() => { load(); }, [workflowId]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!workflowId) { return; }
    setSaving(true);
    try {
      await post('/api/automation/schedules', { workflow_id: workflowId, cron_expression: cron, run_message: runMsg, timezone: 'Asia/Kolkata' });
      onConfigChange('cron_expression', cron);
      load();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try { await del(`/api/automation/schedules/${id}`); load(); } catch { /* ignore */ }
  };

  if (!workflowId) {
    return (
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
        <p className="font-bold">Save workflow first</p>
        <p className="mt-0.5">Save the workflow to create a schedule for it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-emerald-600" />
        <p className="text-sm font-bold text-emerald-900">Schedule / Cron</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {CRON_PRESETS.map((p) => (
          <button key={p.cron} type="button" onClick={() => setCron(p.cron)}
            className={`rounded-lg border px-2 py-1.5 text-left transition ${cron === p.cron ? 'border-emerald-400 bg-emerald-100 text-emerald-800' : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-200'}`}>
            <p className="text-[11px] font-bold">{p.label}</p>
            <p className="text-[10px] text-gray-400">{p.cron}</p>
          </button>
        ))}
      </div>
      <label className="block text-xs font-semibold text-emerald-800">
        Custom cron expression
        <input value={cron} onChange={(e) => setCron(e.target.value)} className="input-field mt-1 font-mono text-xs" placeholder="0 3 * * *" />
        <span className="mt-0.5 block text-[10px] text-emerald-600">Format: min hour day month weekday (UTC). IST = UTC+5:30</span>
      </label>
      <label className="block text-xs font-semibold text-emerald-800">
        Message / context for run (optional)
        <input value={runMsg} onChange={(e) => setRunMsg(e.target.value)} className="input-field mt-1 text-xs" placeholder="Scheduled follow-up run" />
      </label>
      <button type="button" onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-100 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-200 disabled:opacity-60">
        <Save className="h-3.5 w-3.5" />{saving ? 'Saving…' : 'Create Schedule'}
      </button>
      {schedules.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase text-emerald-700">Active Schedules</p>
          {schedules.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white px-2.5 py-1.5 text-xs">
              <span className="font-mono text-gray-700">{s.cron_expression}</span>
              <span className="mx-2 text-gray-400">{s.is_active ? '● active' : '○ paused'}</span>
              <button type="button" onClick={() => remove(s.id)} className="text-red-400 hover:text-red-600">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExecutionLog({ timeline, runs }: { timeline: any[]; runs: any[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const items = timeline.length ? timeline : runs.slice(0, 5);

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const statusColor = (status: string) => {
    if (status === 'completed') return 'bg-emerald-100 text-emerald-700';
    if (status === 'failed') return 'bg-red-100 text-red-700';
    if (status === 'running') return 'bg-sky-100 text-sky-700';
    if (status === 'skipped') return 'bg-gray-100 text-gray-500';
    return 'bg-orange-50 text-primary-700';
  };

  return (
    <div className="mt-3 space-y-1">
      {items.map((item: any, idx: number) => {
        const key = item.id || item.label || String(idx);
        const hasData = item.data || item.output;
        const isExpanded = expanded[key];
        const label = item.label || item.intent || 'run';
        const status = item.status || 'pending';
        const tool = item.tool || '';

        return (
          <div key={key} className="rounded-lg border border-gray-100 text-xs overflow-hidden">
            <div
              className={`flex items-center gap-2 px-3 py-2 ${hasData ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => hasData && toggle(key)}
            >
              <span className="flex-1 truncate font-semibold text-gray-800">{label}</span>
              {tool && <span className="shrink-0 font-mono text-[10px] text-gray-400">{tool}</span>}
              <span className={`shrink-0 rounded-full px-2 py-0.5 font-bold ${statusColor(status)}`}>{status}</span>
              {hasData && (
                <ChevronRight className={`h-3 w-3 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              )}
            </div>
            {isExpanded && hasData && (
              <div className="border-t border-gray-100 bg-gray-50 px-3 py-2">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[10px] text-gray-600">
                  {JSON.stringify(item.data || item.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Analytics Panel ────────────────────────────────────────────────────────

function AnalyticsPanel({ onClose }: { onClose: () => void }) {
  const { get } = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/api/automation/analytics/runs?days=30')
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Analytics — Last 30 Days</p>
        <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
      </div>
      {loading ? (
        <div className="p-6 text-center text-xs text-gray-400">Loading…</div>
      ) : !data ? (
        <div className="p-6 text-center text-xs text-gray-400">No data yet. Run some workflows first.</div>
      ) : (
        <div className="p-3 space-y-3">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total Runs', value: data.total_runs, color: 'text-gray-800' },
              { label: 'Success Rate', value: `${data.success_rate_pct}%`, color: 'text-emerald-700' },
              { label: 'Failed', value: data.failed, color: 'text-red-600' },
              { label: 'Avg Time', value: `${data.avg_duration_seconds}s`, color: 'text-sky-700' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-gray-100 p-2 text-center">
                <p className={`text-lg font-black ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-gray-400">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Daily bar chart (simple) */}
          {data.daily_runs?.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase text-gray-400">Daily Runs</p>
              <div className="flex items-end gap-0.5 h-16">
                {data.daily_runs.slice(-14).map((d: any) => {
                  const maxCount = Math.max(...data.daily_runs.map((x: any) => x.count), 1);
                  const pct = Math.max((d.count / maxCount) * 100, 4);
                  return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-0.5">
                      <div title={`${d.date}: ${d.count} runs`} className="w-full rounded-sm bg-orange-400" style={{ height: `${pct}%` }} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top tools */}
          {data.tool_stats?.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase text-gray-400">Top Nodes</p>
              <div className="space-y-1">
                {data.tool_stats.slice(0, 5).map((t: any) => (
                  <div key={t.tool} className="flex items-center gap-2 text-xs">
                    <span className="w-32 truncate font-mono text-gray-600">{t.tool}</span>
                    <div className="flex-1 rounded-full bg-gray-100 h-1.5">
                      <div className="h-1.5 rounded-full bg-orange-400" style={{ width: `${Math.min((t.runs / (data.tool_stats[0]?.runs || 1)) * 100, 100)}%` }} />
                    </div>
                    <span className="w-8 text-right text-gray-500">{t.runs}</span>
                    {t.failed > 0 && <span className="text-red-400 text-[10px]">{t.failed} fail</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Template Gallery ───────────────────────────────────────────────────────

function TemplateGallery({ onClose, onSelect }: { onClose: () => void; onSelect: (key: string) => void }) {
  const { get } = useApi();
  const [templates, setTemplates] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    get(`/api/automation/templates`)
      .then((r) => setTemplates(r.data || []))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const diffColor: Record<string, string> = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-sky-100 text-sky-700',
    advanced: 'bg-violet-100 text-violet-700',
  };

  const filtered = filter === 'all' ? templates : templates.filter((t) => t.difficulty === filter || t.industry === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 flex-shrink-0">
          <div>
            <p className="font-bold text-gray-900">Automation Templates</p>
            <p className="text-xs text-gray-400">Pick a pre-built workflow to start fast</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-500">✕</button>
        </div>

        <div className="flex gap-1.5 px-5 pt-3 flex-shrink-0">
          {['all', 'beginner', 'intermediate', 'advanced'].map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition ${filter === f ? 'bg-orange-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              {f}
            </button>
          ))}
        </div>

        <div className="max-h-96 overflow-y-auto p-4 grid grid-cols-2 gap-3">
          {filtered.map((tpl) => (
            <button key={tpl.key} type="button" onClick={() => onSelect(tpl.key)}
              className="rounded-xl border border-gray-200 p-3 text-left hover:border-orange-300 hover:bg-orange-50 transition">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-gray-900 leading-tight">{tpl.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${diffColor[tpl.difficulty] || 'bg-gray-100 text-gray-500'}`}>
                  {tpl.difficulty}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">{tpl.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(tpl.steps || []).slice(0, 3).map((s: string) => (
                  <span key={s} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">{s}</span>
                ))}
                {tpl.steps?.length > 3 && <span className="text-[10px] text-gray-400">+{tpl.steps.length - 3}</span>}
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-100 px-5 py-3 text-[11px] text-gray-400 flex-shrink-0">
          Selecting a template loads it into the canvas. You can edit it before saving.
        </div>
      </div>
    </div>
  );
}
