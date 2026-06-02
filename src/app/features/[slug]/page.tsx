'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MarketingNav, MarketingFooter } from '@/components/marketing-shell';
import {
  Bot, MessageCircle, Sparkles, Brain, Globe, CheckCircle2, Users, ArrowRight,
  CreditCard, FileText, Workflow, ShoppingBag, Code2, BarChart3, Globe2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };

type FeatureStep = { title: string; desc: string };
type FeatureItem = { title: string; desc: string };
type FeatureUseCase = { industry: string; flow: string };
type FeatureData = {
  title: string;
  subtitle: string;
  badge: string;
  icon: LucideIcon;
  color: string;
  steps: FeatureStep[];
  features: FeatureItem[];
  useCases: FeatureUseCase[];
};

const featuresData: Record<string, FeatureData> = {
  'whatsapp-agentic-ai': {
    title: 'Agentic WhatsApp AI',
    subtitle: 'B9 AI receives customer messages, classifies intent, searches your knowledge base, sends catalog or payment link — fully automated. No manual replies needed.',
    badge: 'AI Core',
    icon: Bot,
    color: 'emerald',
    steps: [
      { title: 'Connect Meta', desc: 'Link your WhatsApp Business number through the official Meta Cloud API connection flow.' },
      { title: 'Customer messages', desc: 'B9 AI receives the message, understands intent (buy/question/complaint/opt-out) using DeepSeek AI.' },
      { title: 'AI takes action', desc: 'Searches knowledge → sends catalog → creates payment link → books follow-up — all in one turn.' },
    ],
    features: [
      { title: 'Intent classification', desc: 'DeepSeek/Groq AI classifies every message: buy, question, complaint, opt-out, greeting.' },
      { title: 'Tool calling', desc: 'AI autonomously calls: send message, send catalog, create payment link, schedule follow-up, handover.' },
      { title: 'Catalog & payment auto', desc: 'When buy intent is detected, AI sends your product catalog and Razorpay payment link automatically.' },
      { title: 'Lead scoring', desc: 'AI scores each lead hot/warm/cold based on conversation intent and engagement level.' },
      { title: '24h compliance', desc: 'Meta 24-hour window enforced automatically. Only approved templates after window closes.' },
      { title: 'Durable opt-out', desc: 'STOP messages block all future sends permanently. Consent logged for compliance.' },
    ],
    useCases: [
      { industry: 'Coaching Centers', flow: 'Student asks about batch → AI checks schedule from PDF → sends class options → collects phone → drafts fee WhatsApp' },
      { industry: 'Real Estate', flow: 'Buyer asks about property → AI sends property catalog → schedule site visit → payment token collected via Razorpay' },
      { industry: 'D2C Brands', flow: 'Customer asks about product → AI recommends from catalog → creates order → sends payment link → confirms via WhatsApp' },
    ],
  },

  'ai-template-builder': {
    title: 'AI Template Builder',
    subtitle: 'Describe your campaign in plain English — B9 AI drafts a complete WhatsApp-approved Meta template with variables, header, buttons, and footer in seconds.',
    badge: 'AI Core',
    icon: Sparkles,
    color: 'violet',
    steps: [
      { title: 'Describe your campaign', desc: 'Type: "Diwali sale 20% off, expires 5 days, link to website" — in any language.' },
      { title: 'AI drafts Meta template', desc: 'B9 AI generates header, body with variables, footer, and CTA buttons. Validates Meta rules automatically.' },
      { title: 'Review and submit', desc: 'Preview the WhatsApp bubble. Edit if needed. One click submits for Meta approval — usually within minutes.' },
    ],
    features: [
      { title: 'Plain English to template', desc: 'No learning Meta template format. Just describe what you want to say.' },
      { title: 'Variable detection', desc: 'AI automatically detects {{1}} {{2}} variables and suggests example values Meta requires.' },
      { title: 'All 3 categories', desc: 'Marketing, Utility, Authentication templates — including LTO (Limited Time Offer) and Carousel.' },
      { title: '10 Indian languages', desc: 'English, Hindi, Gujarati, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Punjabi.' },
      { title: 'Rejection reason shown', desc: 'If Meta rejects, see exactly why and resubmit with fixes. AI suggests corrections.' },
      { title: 'Button types', desc: 'Quick Reply, Visit Website, Call Phone, Copy Offer Code, Complete Form — all supported.' },
    ],
    useCases: [
      { industry: 'Flash Sales', flow: 'Type "50% off ends tonight" → AI drafts template with countdown CTA → Submit → Approved → Campaign sent' },
      { industry: 'Appointment Reminders', flow: 'Clinic types "appointment reminder with doctor name and time" → Template with {{1}}{{2}} variables created in 10s' },
      { industry: 'OTP Verification', flow: 'Select Authentication category → AI generates compliant OTP template with security disclaimer and expiry' },
    ],
  },

  'visual-automation-builder': {
    title: '37-Node Automation Canvas',
    subtitle: 'Drag-and-drop visual builder with 37 node types. Build any business flow: Trigger → AI → Condition → Action. No code, no complexity.',
    badge: 'Platform',
    icon: Workflow,
    color: 'blue',
    steps: [
      { title: 'Choose a trigger', desc: 'New WhatsApp message, Facebook lead, website form, payment, scheduled time, or manual run.' },
      { title: 'Add AI and action nodes', desc: 'Generate reply, qualify lead, send WhatsApp/catalog/payment, save to sheet, condition branch, wait.' },
      { title: 'Test and activate', desc: 'Run test with sample lead. Fix blockers. One click to activate. Runs 24/7 from then on.' },
    ],
    features: [
      { title: '37 node types', desc: 'Triggers, AI agents, conditions, loops, waits, WhatsApp, catalog, payment, email, sheet, webhook.' },
      { title: 'Visual debugging', desc: 'See each node execute in real time during test run. Output inspector shows AI results per node.' },
      { title: 'A/B testing', desc: 'Split traffic between two branches. Compare conversion rates. Auto-pick winner.' },
      { title: 'Version history', desc: 'Every save creates a snapshot. Rollback to any previous version with one click.' },
      { title: 'AI generates workflows', desc: 'Describe your flow in plain English — AI builds the full canvas automatically.' },
      { title: 'Template gallery', desc: '20+ pre-built workflow templates for coaching, real estate, D2C, clinics, and more.' },
    ],
    useCases: [
      { industry: 'Welcome + Qualify', flow: 'New WhatsApp lead → Welcome message → AI extracts name/phone/requirement → Score → If hot → Send catalog' },
      { industry: 'Payment Collection', flow: 'Buy intent detected → AI collects order details → Create Razorpay payment link → Send via WhatsApp → On payment → Invoice' },
      { industry: 'Retention Sequence', flow: 'Lead goes cold after 3 days → Scheduled trigger → Send follow-up template → If no reply → Human handover after 48h' },
    ],
  },

  'campaigns': {
    title: 'Broadcast Campaigns',
    subtitle: 'Send WhatsApp template campaigns to hot/warm/cold leads. A/B test messages, schedule for peak hours, preview recipient count before sending.',
    badge: 'Business Tools',
    icon: BarChart3,
    color: 'orange',
    steps: [
      { title: 'Select leads filter', desc: 'Filter by hot/warm/cold score, tag, or upload a phone list. Preview exact recipient count before sending.' },
      { title: 'Choose template and schedule', desc: 'Pick an APPROVED WhatsApp template. Set variables. Schedule for peak hours or send immediately.' },
      { title: 'Track and retry', desc: 'Monitor sent/failed/delivered per lead. Retry failed messages. A/B test two message variants.' },
    ],
    features: [
      { title: 'Hot/warm/cold filter', desc: 'Target only leads who are ready. Filter by AI-assigned score label automatically.' },
      { title: 'A/B testing', desc: 'Split leads 50/50 between two templates. Track which gets more responses and conversions.' },
      { title: 'Scheduling', desc: 'Schedule campaigns for any future date and time. Campaigns run even when you are offline.' },
      { title: 'Preview recipient count', desc: 'See exactly how many leads match your filter before sending. No surprises.' },
      { title: 'Retry failed', desc: 'Any failed deliveries can be retried with one click. Separate from successful sends.' },
      { title: 'Per-plan cap', desc: 'Starter: 100 recipients/send. Growth: 1,000. Pro: 5,000. Business: 50,000.' },
    ],
    useCases: [
      { industry: 'Diwali Sale', flow: 'Filter warm leads → Select "Diwali offer" approved template → Schedule 10 AM → Track 68% delivery rate' },
      { industry: 'Win-back Cold Leads', flow: 'Filter cold leads (60+ days) → Send "We miss you" template → A/B test two messages → Re-engage 12%' },
      { industry: 'Follow-up Sequence', flow: 'Leads who clicked but did not pay → Template with payment link → 24h later auto-retry to non-payers' },
    ],
  },

  'payments': {
    title: 'Razorpay Payment Flows',
    subtitle: 'AI detects buy intent and automatically creates a Razorpay payment link — sent via WhatsApp. Customer pays, lead status updates to "Won", GST invoice generated.',
    badge: 'Business Tools',
    icon: CreditCard,
    color: 'green',
    steps: [
      { title: 'Buy intent detected', desc: 'Orchestrator AI classifies "I want to buy" or "send payment link" → activates conversion agent.' },
      { title: 'Payment link created and sent', desc: 'B9 creates a Razorpay payment link with amount + description. Sends via WhatsApp automatically.' },
      { title: 'Customer pays → CRM updated', desc: 'Razorpay webhook fires → Lead status → Won, score → Hot. WhatsApp confirmation sent. Invoice generated.' },
    ],
    features: [
      { title: 'Auto payment link on buy intent', desc: 'No manual step needed. AI creates and sends the Razorpay link when customer is ready to pay.' },
      { title: 'GST invoice generation', desc: 'Auto-generate GST-compliant invoice PDF on payment success. Sent to customer via WhatsApp.' },
      { title: 'Webhook confirmed', desc: 'Razorpay payment webhook updates lead status in CRM. Idempotent — no duplicate processing.' },
      { title: 'Lead status to Won', desc: 'On payment confirmed, lead moves to "Won" stage and score becomes "Hot" automatically.' },
      { title: 'WhatsApp receipt', desc: 'Customer receives WhatsApp thank-you with order summary after payment confirmation.' },
      { title: 'CustomerPayment table', desc: 'Every payment recorded with amount, customer name, phone, lead ID, paid_at for audit trail.' },
    ],
    useCases: [
      { industry: 'Coaching Fee', flow: 'Parent asks about fee → AI sends course details → Creates ₹15,000 payment link → Parent pays → Admission confirmed via WhatsApp' },
      { industry: 'Real Estate Token', flow: 'Buyer says "I want to book" → AI creates ₹50,000 token amount link → Paid → Site visit confirmed' },
      { industry: 'D2C Order', flow: 'Customer picks product → AI collects quantity + address → Creates order payment → On pay → Dispatch WhatsApp sent' },
    ],
  },

  'templates': {
    title: 'Meta WhatsApp Templates',
    subtitle: 'Create, submit, track, and use WhatsApp-approved Meta templates. All template types supported — standard, carousel, LTO, authentication.',
    badge: 'Business Tools',
    icon: FileText,
    color: 'blue',
    steps: [
      { title: 'Create template', desc: 'Use the AI Template Builder or create manually. All types: Marketing, Utility, Authentication, Carousel, LTO.' },
      { title: 'AI validates and submits', desc: 'Button mixing rules, variable count, carousel limits — all checked before submission. Meta rejects prevented.' },
      { title: 'Use in campaigns and automations', desc: 'Approved templates available in campaign builder, auto-reply rules, and automation canvas immediately.' },
    ],
    features: [
      { title: 'All template types', desc: 'Standard, Carousel (2-10 cards), Limited Time Offer (countdown), Authentication (OTP/autofill/zero-tap).' },
      { title: 'AI draft in 60 seconds', desc: 'Describe campaign → AI generates complete template with correct structure. No manual JSON.' },
      { title: 'Variable example required', desc: 'AI auto-fills example values Meta requires for {{1}} {{2}} variables. No rejection risk.' },
      { title: 'Rejection reason shown', desc: 'If Meta rejects, see exact reason. "Fix and Resubmit" opens pre-filled form with corrections.' },
      { title: 'Template library', desc: '20 curated templates for Indian businesses — order confirmation, appointment, OTP, follow-up, welcome.' },
      { title: 'Resubmit flow', desc: 'REJECTED templates open in edit modal pre-filled. Change and resubmit in one click.' },
    ],
    useCases: [
      { industry: 'Marketing Blast', flow: 'Type "Navratri 30% off all courses" → AI drafts → Template approved in 10 min → Campaign sent to 2,000 leads' },
      { industry: 'OTP Verification', flow: 'Select Authentication → AI generates compliant OTP template → Copy Code or One-tap autofill option' },
      { industry: 'Order Confirmation', flow: 'Utility template with {{order_id}} {{amount}} → Auto-sent after Razorpay payment webhook → Customer confirms' },
    ],
  },

  'crm': {
    title: 'Leads & CRM',
    subtitle: 'Auto-score leads hot/warm/cold, track conversation memory, manage pipeline stages, set follow-ups, and export to CSV or Google Sheets.',
    badge: 'Business Tools',
    icon: Users,
    color: 'indigo',
    steps: [
      { title: 'Lead captured automatically', desc: 'Every WhatsApp, Facebook, Instagram, and website inquiry creates a lead. No manual entry.' },
      { title: 'AI scores and tracks', desc: 'AI assigns hot/warm/cold label based on intent. Conversation memory stores key facts per lead.' },
      { title: 'Pipeline and follow-ups', desc: 'Move leads through New → Contacted → Qualified → Won → Lost. Set follow-up reminders.' },
    ],
    features: [
      { title: 'Hot/warm/cold scoring', desc: 'AI scores every lead based on buying signals in the conversation. No manual tagging needed.' },
      { title: 'Conversation memory', desc: 'AI remembers what each lead said — name, budget, requirement — across sessions.' },
      { title: 'Follow-up scheduler', desc: 'Set next follow-up date. Get reminders. Scheduler auto-sends follow-up WhatsApp at due time.' },
      { title: 'Bulk export CSV', desc: 'Export all leads with filters (status, score, phone) to CSV for email campaigns or reporting.' },
      { title: 'Google Sheets sync', desc: 'Every new lead auto-pushes to connected Google Sheet in real time. Custom field mapping.' },
      { title: 'Phone filter', desc: 'Search leads by exact phone number. Useful for looking up a specific customer from WhatsApp.' },
    ],
    useCases: [
      { industry: 'Sales Pipeline', flow: '50 WhatsApp leads → 8 hot (high intent) → 3 won → Export won leads to Razorpay for invoicing' },
      { industry: 'Follow-up Sequence', flow: 'Cold lead tagged → Schedule 7-day follow-up → Auto-WhatsApp sent → If no reply → 14-day retry' },
      { industry: 'Agency Client Report', flow: 'Filter by date range → Export CSV → Share with client showing leads, scores, and conversion rate' },
    ],
  },

  'widget': {
    title: 'Website Sales Widget',
    subtitle: 'Embed an AI sales assistant on your website that captures leads, qualifies prospects, shows action hints (catalog/payment/demo), and sends WhatsApp follow-ups.',
    badge: 'Business Tools',
    icon: Globe,
    color: 'cyan',
    steps: [
      { title: 'Paste embed script', desc: 'Copy one script tag from Widgets page. Paste before </body> on your website. Done.' },
      { title: 'Visitor chats with AI', desc: 'AI searches your knowledge base, answers questions, detects intent (pricing/demo/support).' },
      { title: 'Lead captured + WhatsApp follow-up', desc: 'When visitor shares phone, lead saved to CRM. WhatsApp follow-up drafted automatically.' },
    ],
    features: [
      { title: 'AI sales assistant', desc: 'Answers from your PDFs, FAQs, pricing docs — with citations showing the source document.' },
      { title: 'Intent-based action hints', desc: 'If visitor asks about pricing → "Get Quote on WhatsApp" CTA shown. Demo intent → "Book Free Demo".' },
      { title: 'Lead form with city/budget', desc: 'Capture name, phone, email, city, budget, product interest, callback time — all configurable.' },
      { title: '30-message session limit', desc: 'Anti-abuse: each visitor session limited to 30 messages. Prevents AI scraping.' },
      { title: 'Domain allowlist', desc: 'Widget only works on your approved domains. Subdomains must be added separately.' },
      { title: 'Live preview in dashboard', desc: 'Test exactly how your widget AI responds before going live. Built-in test chat.' },
    ],
    useCases: [
      { industry: 'Coaching Enquiry', flow: 'Student visits website → AI answers class/fee questions → Student shares phone → Lead saved → WhatsApp follow-up sent' },
      { industry: 'Real Estate', flow: 'Buyer on property page → AI shares property details → Asks budget → Lead qualified hot → Agent notified immediately' },
      { industry: 'SaaS Trial', flow: 'Visitor asks about pricing → AI explains plan → CTA "Book Demo" shown → Demo booked → Sales team notified' },
    ],
  },

  'whatsapp-automation': {
    title: 'WhatsApp Auto Replies',
    subtitle: 'Set up keyword replies, welcome messages, out-of-office auto-replies, opt-out handling, keyword alerts, and auto-assign — all no-code, all instant.',
    badge: 'Channels',
    icon: MessageCircle,
    color: 'green',
    steps: [
      { title: 'Set your rule', desc: 'Choose rule type: keyword reply, welcome, out-of-office, opt-out, keyword alert, or auto-assign.' },
      { title: 'Customer triggers keyword', desc: 'Customer messages "price" or "demo" → rule engine matches → auto-reply fires instantly.' },
      { title: 'Reply sent, lead updated', desc: 'Auto-reply sent. Lead tagged or assigned. First matching rule stops (no spam from multiple rules).' },
    ],
    features: [
      { title: 'Keyword reply', desc: 'Match any keyword (exact or contains). Send text reply or approved WhatsApp template automatically.' },
      { title: 'Welcome message', desc: 'First-time leads get a customised welcome. Optionally skip automation workflows for new contacts.' },
      { title: 'Out-of-office', desc: 'Set working hours per day. Outside those hours, auto-reply fires — even on weekends.' },
      { title: 'Opt-out handling', desc: 'STOP / UNSUBSCRIBE / BAND KARO → lead blocked, tag "opted_out", durable consent logged.' },
      { title: 'Auto-assign by keyword', desc: 'Keyword "complaint" → assign to Support. "demo" → assign to Sales. Tag set automatically.' },
      { title: 'Stop-after-first-match', desc: 'First matching rule sends reply — no duplicate messages from multiple matching rules.' },
    ],
    useCases: [
      { industry: 'Price Inquiry', flow: 'Customer texts "price" at 2 AM → Keyword rule fires → Template with pricing sent → Lead tagged "price_interest"' },
      { industry: 'After-hours Support', flow: 'Customer messages at 11 PM → OOO rule → "We open at 9 AM. Your query is noted." → Follow-up next morning' },
      { industry: 'Team Routing', flow: 'Customer says "complaint" → Auto-assign rule → Lead assigned to Support team → Alert email to manager sent' },
    ],
  },

  'instagram-dm': {
    title: 'Instagram DM Automation',
    subtitle: 'Auto-reply to Instagram DMs, capture them as leads, and route to your AI assistant — all via official Meta Graph API.',
    badge: 'Channels',
    icon: Globe2,
    color: 'pink',
    steps: [
      { title: 'Connect Instagram', desc: 'OAuth connect your Instagram Professional account in Integrations. Link to a Facebook Page.' },
      { title: 'DM received', desc: 'Customer DMs your Instagram → webhook fires instantly → AI assistant selected handles it.' },
      { title: 'AI replies + lead created', desc: 'AI replies with quick buttons. Lead captured with name, Instagram ID, message in CRM.' },
    ],
    features: [
      { title: 'Official Meta OAuth', desc: 'Connect via Instagram Graph API. No unofficial access. Zero ban risk.' },
      { title: 'Auto-reply', desc: 'AI assistant answers DMs from your knowledge base. Same RAG engine as WhatsApp.' },
      { title: 'Quick reply buttons', desc: 'After AI response, send up to 13 quick reply options for guided conversation flow.' },
      { title: 'Lead capture', desc: 'Every DM creates a lead with Instagram sender ID, message text, and conversation history.' },
      { title: 'Assistant selector', desc: 'Choose which B9 assistant handles Instagram DMs. Different from your WhatsApp assistant.' },
      { title: '24h compliance', desc: 'Meta 24h window applies to Instagram too. Enforced automatically — no accidental spam.' },
    ],
    useCases: [
      { industry: 'Influencer Products', flow: 'Follower DMs "where to buy?" → AI responds with product link → Lead captured → WhatsApp follow-up drafted' },
      { industry: 'Service Bookings', flow: 'Potential client DMs about services → AI answers pricing → Quick replies: "Book now" / "Get quote" → Lead pipeline' },
      { industry: 'Content Creator', flow: 'Fan DMs → AI answers FAQs from creator\'s course PDFs → Upsell suggested → Lead with high intent tagged' },
    ],
  },

  'facebook-lead-ads': {
    title: 'Facebook Lead Ads',
    subtitle: 'Auto-capture leads from Facebook Lead Ad forms into your CRM the moment they submit — with real-time WhatsApp follow-up.',
    badge: 'Channels',
    icon: Brain,
    color: 'blue',
    steps: [
      { title: 'Connect Facebook', desc: 'OAuth connect your Facebook account. Select which Page and Lead Ad Forms to sync.' },
      { title: 'Form submitted', desc: 'Customer submits Facebook Lead Form → webhook fires in real time → Lead appears in CRM instantly.' },
      { title: 'WhatsApp follow-up sent', desc: 'Lead phone number extracted → WhatsApp template sent within seconds → Lead scored and tracked.' },
    ],
    features: [
      { title: 'Real-time sync', desc: 'Facebook lead webhook delivers form data within 1-2 seconds of submission.' },
      { title: 'Form field mapping', desc: 'Map Facebook form fields to CRM fields: name, phone, email, city, budget, interest.' },
      { title: 'Instant WhatsApp follow-up', desc: 'Lead WhatsApp number from form → approved template sent automatically → Engagement rate 3x higher.' },
      { title: 'Lead scoring', desc: 'AI scores each Facebook lead based on form responses and ad targeting signals.' },
      { title: 'Google Sheets export', desc: 'All Facebook leads auto-push to connected Google Sheet for reporting.' },
      { title: 'Multiple form support', desc: 'Connect multiple Facebook Lead Forms from multiple ad campaigns simultaneously.' },
    ],
    useCases: [
      { industry: 'Coaching Ads', flow: 'Run Facebook ad → Parent fills form → Lead in CRM in 2s → WhatsApp "Thank you, our counsellor will call in 1hr"' },
      { industry: 'Real Estate Ads', flow: 'Property ad → Buyer fills enquiry form → Lead scored → Hot lead alert to sales team → Follow-up within 5 min' },
      { industry: 'D2C Lead Gen', flow: 'Instagram/Facebook ad → Customer fills interest form → Product catalog WhatsApp sent → Payment link if buy intent' },
    ],
  },

  'ai-chatbot': {
    title: 'Website AI Sales Widget',
    subtitle: 'Embed an AI-powered sales assistant on your website. Answers questions from your knowledge base, captures leads, and sends WhatsApp follow-ups.',
    badge: 'Business Tools',
    icon: Globe,
    color: 'cyan',
    steps: [
      { title: 'Paste embed script', desc: 'Copy one script tag from Widgets page. Paste before </body>. Widget appears on your site.' },
      { title: 'Visitor chats with AI', desc: 'AI searches your uploaded PDFs, pricing pages, FAQs — answers with source citations.' },
      { title: 'Lead captured', desc: 'Visitor shares phone/email → Lead saved to CRM → WhatsApp follow-up drafted automatically.' },
    ],
    features: [
      { title: 'Knowledge base AI', desc: 'Answers from your PDFs, URLs, YouTube videos with citations showing the source.' },
      { title: 'Action hints on intent', desc: 'Pricing question → "Get Quote on WhatsApp" CTA. Demo question → "Book Free Demo".' },
      { title: 'Configurable lead form', desc: 'Capture name, phone, city, budget, product interest, callback time — you decide which fields.' },
      { title: 'Domain security', desc: 'Widget only loads on your approved domains. Subdomains added separately.' },
      { title: 'Live test in dashboard', desc: 'Test widget AI responses before going live from your dashboard.' },
      { title: '3D robot avatar', desc: 'Optional Spline 3D robot avatar. Mobile fallback image included.' },
    ],
    useCases: [
      { industry: 'Coaching Website', flow: 'Student visits → AI answers batch/fee questions → Shares phone → Lead to CRM → WhatsApp: "Our counsellor will call you"' },
      { industry: 'Real Estate Portal', flow: 'Buyer browses properties → AI recommends from catalog → Collects budget/location → Qualified lead to sales team' },
      { industry: 'SaaS Pricing Page', flow: 'Visitor asks pricing → AI explains plans → "Book Demo" CTA → Demo booked → Sales notified immediately' },
    ],
  },

  'catalog': {
    title: 'Product Catalog',
    subtitle: 'Upload your product catalog. AI recommends and sends WhatsApp catalog cards when customers ask about products — with Razorpay payment link on buy intent.',
    badge: 'Business Tools',
    icon: ShoppingBag,
    color: 'amber',
    steps: [
      { title: 'Upload products', desc: 'Add products manually with name, price, image, description, category. Or sync from Meta Catalog.' },
      { title: 'AI detects buy intent', desc: 'Customer asks "what do you sell?" or "price of X" → AI routing sends catalog automatically.' },
      { title: 'Catalog + payment sent', desc: 'WhatsApp catalog card shown → Customer picks product → Razorpay payment link sent → Order confirmed.' },
    ],
    features: [
      { title: 'Manual upload or Meta sync', desc: 'Add products manually or connect Meta Business Catalog for auto-sync.' },
      { title: 'AI routing', desc: 'Agentic AI sends catalog when buy intent or product inquiry detected in conversation.' },
      { title: 'WhatsApp catalog card', desc: 'Products shown as native WhatsApp catalog cards — image, name, price, description.' },
      { title: 'Razorpay payment link', desc: 'After customer picks product, AI creates and sends Razorpay payment link automatically.' },
      { title: 'Multi-product support', desc: 'Catalog with hundreds of products. AI picks most relevant 5 based on customer query.' },
      { title: 'Category filtering', desc: 'Filter by category in dashboard. Search products. Toggle active/inactive per product.' },
    ],
    useCases: [
      { industry: 'D2C Store', flow: 'Customer asks "do you have protein powder?" → AI sends top 3 matching products → Customer picks → Payment link sent' },
      { industry: 'Restaurant Menu', flow: 'Customer asks "what is today\'s special?" → AI sends daily specials from catalog → Customer orders via WhatsApp' },
      { industry: 'Service Pricing', flow: 'Client asks "how much for logo design?" → AI sends service packages with prices → Payment link for selected package' },
    ],
  },

  'api': {
    title: 'REST API v1',
    subtitle: 'Full REST API with 22 scopes for custom integrations. Connect your CRM, Shopify, IndiaMART, or any external tool to B9 Automation programmatically.',
    badge: 'Platform',
    icon: Code2,
    color: 'gray',
    steps: [
      { title: 'Generate API key', desc: 'Go to API Keys page → Create key → Select exactly which scopes you need → Copy key once.' },
      { title: 'Choose 22 scopes', desc: 'leads:read, leads:write, messages:send, templates:read, campaigns:write, automations:run — and 16 more.' },
      { title: 'Make authenticated calls', desc: 'Pass Authorization: Bearer b9_xxx header. Works from curl, JavaScript, Python, any HTTP client.' },
    ],
    features: [
      { title: 'API key auth', desc: 'b9_xxx prefixed keys stored hashed (SHA-256). Never plaintext. Revoke instantly anytime.' },
      { title: '22 scopes', desc: 'Granular permission control. Give read-only access or full write access per integration.' },
      { title: 'v1 clean routes', desc: '/api/v1/leads, /api/v1/messages/send, /api/v1/campaigns, /api/v1/automations/{id}/run.' },
      { title: 'Request logs', desc: 'Last 20 API requests shown in dashboard. Method, path, status, response time visible.' },
      { title: 'Rate limiting', desc: 'Per-key rate limits. 429 returned on excess. Never silently dropped.' },
      { title: 'Code examples', desc: 'curl, JavaScript, and Python examples in API Docs tab. Copy and run immediately.' },
    ],
    useCases: [
      { industry: 'CRM Sync', flow: 'Your CRM creates a lead → POST /api/v1/leads → B9 WhatsApp follow-up fires automatically' },
      { industry: 'Shopify Integration', flow: 'New Shopify order → POST /api/v1/messages/send with order template → Customer gets WhatsApp confirmation' },
      { industry: 'Custom Dashboard', flow: 'GET /api/v1/analytics → Show your clients their B9 leads/messages/conversions in your own tool' },
    ],
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE] mb-4">{children}</p>;
}

const colorMap: Record<string, { badge: string; step: string; glow: string }> = {
  emerald: { badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400', step: 'bg-emerald-500/10 text-emerald-300', glow: 'from-emerald-500/10' },
  violet:  { badge: 'border-violet-500/20 bg-violet-500/10 text-violet-400',   step: 'bg-violet-500/10 text-violet-300',   glow: 'from-violet-500/10' },
  blue:    { badge: 'border-blue-500/20 bg-blue-500/10 text-blue-400',         step: 'bg-blue-500/10 text-blue-300',         glow: 'from-blue-500/10' },
  orange:  { badge: 'border-orange-500/20 bg-orange-500/10 text-orange-400',   step: 'bg-orange-500/10 text-orange-300',   glow: 'from-orange-500/10' },
  green:   { badge: 'border-green-500/20 bg-green-500/10 text-green-400',       step: 'bg-green-500/10 text-green-300',       glow: 'from-green-500/10' },
  indigo:  { badge: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400',   step: 'bg-indigo-500/10 text-indigo-300',   glow: 'from-indigo-500/10' },
  cyan:    { badge: 'border-[#00F2FE]/20 bg-[#00F2FE]/10 text-[#00F2FE]',     step: 'bg-[#00F2FE]/10 text-[#00F2FE]',     glow: 'from-[#00F2FE]/10' },
  pink:    { badge: 'border-pink-500/20 bg-pink-500/10 text-pink-400',         step: 'bg-pink-500/10 text-pink-300',         glow: 'from-pink-500/10' },
  amber:   { badge: 'border-amber-500/20 bg-amber-500/10 text-amber-400',       step: 'bg-amber-500/10 text-amber-300',       glow: 'from-amber-500/10' },
  gray:    { badge: 'border-white/[0.08] bg-white/[0.04] text-zinc-300',       step: 'bg-white/[0.05] text-zinc-300',       glow: 'from-zinc-500/10'  },
};

export default function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const feature = featuresData[slug];

  if (!feature) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center flex-col gap-6 px-4 text-center">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[400px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px]" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#00F2FE]">404</p>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400">Feature not found</h1>
        <p className="max-w-sm text-zinc-400">This feature page does not exist. Browse all available features below.</p>
        <Link href="/features" className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#00F2FE]/30 bg-[#00F2FE]/10 px-5 py-2.5 text-sm font-semibold text-[#00F2FE] hover:bg-[#00F2FE]/20 transition">
          ← View All Features
        </Link>
      </div>
    );
  }

  const Icon = feature.icon;
  const colors = colorMap[feature.color] || colorMap.gray;

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[500px] w-[600px] rounded-full bg-[#00F2FE]/[0.03] blur-[140px] animate-pulse" />
        <div className="absolute top-1/2 -right-32 h-[400px] w-[400px] rounded-full bg-[#FF5722]/[0.02] blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[700px] rounded-full bg-[#00F2FE]/[0.015] blur-[120px]" />
      </div>

      {/* Dot grid */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.016]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots-feat-slug" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-feat-slug)" />
        </svg>
      </div>

      <MarketingNav variant="dark" />

      {/* Breadcrumb */}
      <div className="relative border-b border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-xs text-zinc-600">
          <Link href="/features" className="hover:text-zinc-400 transition-colors">Features</Link>
          <span>/</span>
          <span className="text-zinc-400">{feature.title}</span>
        </div>
      </div>

      {/* HERO */}
      <section className="relative border-b border-white/[0.04] px-6 pb-24 pt-16 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col items-center gap-5">
            <motion.div variants={fadeUp}>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${colors.badge}`}>
                <Icon className="h-3 w-3" />
                {feature.badge} · {feature.title}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="max-w-3xl text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 lg:text-6xl"
              style={{ letterSpacing: '-0.03em', lineHeight: 1.07 }}
            >
              {feature.title}
            </motion.h1>

            <motion.p variants={fadeUp} className="max-w-2xl text-lg font-light text-zinc-400 leading-relaxed">
              {feature.subtitle}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 items-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_30px_rgba(0,242,254,0.2)]"
              >
                Start Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup?demo=1"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:text-white"
              >
                Book Demo Call
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative border-b border-white/[0.04] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp}>
              <SectionLabel>How It Works</SectionLabel>
              <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500" style={{ letterSpacing: '-0.02em' }}>
                Get started in 3 steps
              </h2>
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {feature.steps.map((step, idx) => (
              <motion.div key={idx} variants={fadeUp} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 backdrop-blur-xl transition-all duration-500 hover:border-[#00F2FE]/20 hover:bg-white/[0.025] hover:-translate-y-1">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#00F2FE]/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#00F2FE]/30 bg-[#00F2FE]/[0.08] text-sm font-bold text-[#00F2FE] mb-5">
                  {idx + 1}
                </div>
                <h3 className="relative text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="relative text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* KEY FEATURES GRID */}
      <section className="relative border-b border-white/[0.04] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp}>
              <SectionLabel>What You Get</SectionLabel>
              <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500" style={{ letterSpacing: '-0.02em' }}>
                Everything included
              </h2>
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {feature.features.map((feat, idx) => (
              <motion.div key={idx} variants={fadeUp} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 backdrop-blur-xl transition-all duration-500 hover:border-[#00F2FE]/20 hover:bg-white/[0.025] hover:-translate-y-0.5">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#00F2FE]/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative mb-3 flex h-7 w-7 items-center justify-center rounded-full border border-[#00F2FE]/20 bg-[#00F2FE]/[0.07]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00F2FE]" />
                </div>
                <h3 className="relative text-sm font-bold text-white mb-1.5">{feat.title}</h3>
                <p className="relative text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="relative border-b border-white/[0.04] px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp}>
              <SectionLabel>Real-World Use Cases</SectionLabel>
              <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-500" style={{ letterSpacing: '-0.02em' }}>
                How Indian businesses use it
              </h2>
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {feature.useCases.map((useCase, idx) => (
              <motion.div key={idx} variants={fadeUp} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 backdrop-blur-xl transition-all duration-500 hover:border-[#00F2FE]/20 hover:bg-white/[0.025] hover:-translate-y-0.5">
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-[#00F2FE]/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-[#00F2FE]/80 mb-3">{useCase.industry}</p>
                <p className="relative text-sm text-zinc-300 leading-relaxed">{useCase.flow}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-b border-white/[0.04] px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
            <motion.div
              variants={fadeUp}
              className="relative overflow-hidden rounded-2xl border border-[#00F2FE]/10 bg-[#00F2FE]/[0.02] p-12 text-center backdrop-blur-xl lg:p-16"
            >
              {/* Corner blobs */}
              <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-[#00F2FE]/[0.06] blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-[#00F2FE]/[0.04] blur-[80px]" />

              <div className="relative">
                <div className="mb-4"><SectionLabel>Get Started</SectionLabel></div>
                <motion.h2
                  variants={fadeUp}
                  className="mb-5 text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400 lg:text-5xl"
                  style={{ letterSpacing: '-0.03em', lineHeight: 1.07 }}
                >
                  Ready to automate?
                </motion.h2>
                <motion.p variants={fadeUp} className="mx-auto mb-10 max-w-xl text-lg font-light text-zinc-400">
                  Free plan available. No credit card required. Setup in under 5 minutes.
                </motion.p>
                <motion.div variants={fadeUp} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#00F2FE]/35 bg-[#00F2FE]/[0.12] px-8 py-3 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-[#00F2FE]/[0.2] hover:shadow-[0_0_30px_rgba(0,242,254,0.2)]"
                  >
                    Start Free <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/features"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-8 py-3 text-sm font-semibold text-zinc-300 transition-all duration-300 hover:text-white"
                  >
                    ← All Features
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter variant="dark" />
    </div>
  );
}
