export interface IndustryTemplate {
  title: string;
  prompt: string;
  trigger: string;
}

export interface IndustryPack {
  key: string;
  label: string;
  workspace_name: string;
  assistant_name: string;
  industry: string;
  target_audience: string;
  primary_goal: string;
  document_hint: string;
  dashboard_message: string;
  templates: IndustryTemplate[];
  quick_actions: string[];
}

export const INDUSTRY_PACKS: IndustryPack[] = [
  {
    key: 'coaching',
    label: 'Coaching',
    workspace_name: 'My Coaching Center',
    assistant_name: 'Coaching Support Bot',
    industry: 'Education',
    target_audience: 'Class 10-12 students, parents, and admission inquiries',
    primary_goal: 'Capture admission leads and automate follow-ups',
    document_hint: 'Upload fees, courses, batch timing, syllabus, and FAQ documents.',
    dashboard_message: 'Your coaching automation workspace is ready to capture admission leads, answer FAQs, and prepare follow-up drafts.',
    templates: [
      { title: 'New Admission Lead Follow-up', prompt: 'Aaj ke new admission leads ko follow-up message banao', trigger: 'new_lead' },
      { title: 'Demo Class Reminder', prompt: 'Demo class reminder WhatsApp draft banao', trigger: 'manual_run' },
      { title: 'Fee Inquiry Reply', prompt: 'Fee inquiry ke liye friendly WhatsApp reply banao', trigger: 'chat_command' },
      { title: 'Batch Start Alert', prompt: 'Upcoming batch ke liye WhatsApp announcement draft banao', trigger: 'manual_run' },
      { title: 'Instagram Content Generator', prompt: 'Mere coaching ke liye 7 Instagram posts banao', trigger: 'chat_command' },
    ],
    quick_actions: ['Upload fee PDFs', 'Enable lead capture', 'Generate weekly Instagram posts'],
  },
  {
    key: 'real_estate',
    label: 'Real Estate',
    workspace_name: 'My Real Estate Workspace',
    assistant_name: 'Property Sales Bot',
    industry: 'Real Estate',
    target_audience: 'Home buyers, investors, and site visit inquiries',
    primary_goal: 'Qualify property leads and book site visits',
    document_hint: 'Upload brochures, pricing sheets, floor plans, amenities, and location documents.',
    dashboard_message: 'Your real estate automation workspace is ready to qualify buyers, send brochures, and prepare site visit follow-ups.',
    templates: [
      { title: 'Site Visit Booking', prompt: 'Hot property leads ke liye site visit follow-up draft banao', trigger: 'new_lead' },
      { title: 'Brochure Auto-Send', prompt: 'Interested leads ko brochure sharing message banao', trigger: 'chat_command' },
      { title: 'Budget Qualification', prompt: 'Leads ko budget ke basis par hot warm cold classify karo', trigger: 'manual_run' },
      { title: 'Price Comparison', prompt: 'Property pricing comparison message draft karo', trigger: 'chat_command' },
    ],
    quick_actions: ['Upload brochures', 'Capture budget', 'Create site visit task'],
  },
  {
    key: 'gym',
    label: 'Gym',
    workspace_name: 'My Fitness Studio',
    assistant_name: 'Fitness Sales Bot',
    industry: 'Fitness',
    target_audience: 'Local fitness leads and trial class inquiries',
    primary_goal: 'Convert trial inquiries into memberships',
    document_hint: 'Upload plans, trainer details, transformation programs, and offers.',
    dashboard_message: 'Your gym automation workspace is ready to answer plan questions, capture trial leads, and draft membership follow-ups.',
    templates: [
      { title: 'Trial Class Follow-up', prompt: 'Gym trial class lead ko WhatsApp follow-up draft banao', trigger: 'new_lead' },
      { title: 'Membership Plan Reply', prompt: 'Gym membership fee inquiry reply banao', trigger: 'chat_command' },
      { title: 'Offer Broadcast', prompt: 'Gym monthly offer ke liye WhatsApp broadcast draft banao', trigger: 'manual_run' },
      { title: 'Instagram Fitness Posts', prompt: 'Gym ke liye 7 Instagram posts banao', trigger: 'chat_command' },
    ],
    quick_actions: ['Upload membership plans', 'Enable trial follow-up', 'Create offer content'],
  },
  {
    key: 'salon',
    label: 'Salon',
    workspace_name: 'My Salon Studio',
    assistant_name: 'Salon Booking Bot',
    industry: 'Beauty and Wellness',
    target_audience: 'Local customers asking about services, pricing, and appointments',
    primary_goal: 'Capture appointment leads and promote service packages',
    document_hint: 'Upload service menu, price list, offers, and appointment policies.',
    dashboard_message: 'Your salon automation workspace is ready to answer pricing questions, capture appointment leads, and draft offer messages.',
    templates: [
      { title: 'Appointment Follow-up', prompt: 'Salon appointment inquiry follow-up draft banao', trigger: 'new_lead' },
      { title: 'Service Price Reply', prompt: 'Salon service price inquiry reply banao', trigger: 'chat_command' },
      { title: 'Festival Offer Message', prompt: 'Salon festival offer WhatsApp draft banao', trigger: 'manual_run' },
      { title: 'Instagram Beauty Posts', prompt: 'Salon ke liye 7 Instagram posts banao', trigger: 'chat_command' },
    ],
    quick_actions: ['Upload service menu', 'Enable appointment capture', 'Draft offer campaign'],
  },
  {
    key: 'healthcare',
    label: 'Healthcare / Clinic',
    workspace_name: 'My Clinic Workspace',
    assistant_name: 'Clinic Support Bot',
    industry: 'Healthcare',
    target_audience: 'Patients asking about appointment, services, timings, and fees',
    primary_goal: 'Answer clinic FAQs and capture appointment requests',
    document_hint: 'Upload doctor profiles, clinic timings, service list, pricing, and appointment policy.',
    dashboard_message: 'Your clinic automation workspace is ready for appointment inquiries, service FAQs, and follow-up drafts.',
    templates: [
      { title: 'Appointment Request Follow-up', prompt: 'Clinic appointment inquiry follow-up draft banao', trigger: 'new_lead' },
      { title: 'Clinic Timing Reply', prompt: 'Clinic timings ke liye polite reply banao', trigger: 'chat_command' },
      { title: 'Service FAQ Generator', prompt: 'Clinic documents se FAQ generate karo', trigger: 'document_uploaded' },
    ],
    quick_actions: ['Upload clinic timings', 'Enable appointment capture', 'Generate service FAQs'],
  },
  {
    key: 'it_agency',
    label: 'IT / Agency',
    workspace_name: 'My Agency Workspace',
    assistant_name: 'Agency Growth Bot',
    industry: 'IT and Services',
    target_audience: 'Business owners asking about services, demos, proposals, and pricing',
    primary_goal: 'Generate service leads and prepare proposals',
    document_hint: 'Upload services, case studies, pricing, proposal samples, and FAQs.',
    dashboard_message: 'Your agency automation workspace is ready to qualify project leads, answer technical FAQs, and prepare proposal drafts.',
    templates: [
      { title: 'Demo Scheduling', prompt: 'Software demo ke liye follow-up message draft karo', trigger: 'new_lead' },
      { title: 'Technical FAQ', prompt: 'Uploaded docs se technical FAQ generate karo', trigger: 'document_uploaded' },
      { title: 'Proposal Generator', prompt: 'Client requirement se proposal draft banao', trigger: 'chat_command' },
      { title: 'LinkedIn Content Ideas', prompt: 'Agency ke liye 5 LinkedIn posts banao', trigger: 'chat_command' },
    ],
    quick_actions: ['Upload case studies', 'Create proposal', 'Draft demo follow-up'],
  },
  {
    key: 'ecommerce',
    label: 'E-commerce',
    workspace_name: 'My Store Workspace',
    assistant_name: 'Store Support Bot',
    industry: 'E-commerce',
    target_audience: 'Online shoppers asking about products, discounts, orders, and returns',
    primary_goal: 'Answer product FAQs and recover purchase intent',
    document_hint: 'Upload product catalogs, return policy, shipping policy, and offers.',
    dashboard_message: 'Your e-commerce automation workspace is ready for product FAQs, discount follow-ups, and review collection.',
    templates: [
      { title: 'Product Recommendation', prompt: 'Customer requirement ke basis par product recommendation draft karo', trigger: 'chat_command' },
      { title: 'Discount Follow-up', prompt: 'Interested shopper ko discount follow-up draft banao', trigger: 'new_lead' },
      { title: 'Review Collection', prompt: 'Recent customers ke liye review request message banao', trigger: 'manual_run' },
    ],
    quick_actions: ['Upload catalog', 'Add return policy', 'Create discount follow-up'],
  },
  {
    key: 'legal',
    label: 'Legal',
    workspace_name: 'My Legal Practice',
    assistant_name: 'Legal Intake Bot',
    industry: 'Legal Services',
    target_audience: 'Clients asking about consultation, documents, fees, and appointment slots',
    primary_goal: 'Capture consultation requests and prepare intake summaries',
    document_hint: 'Upload consultation process, fee structure, practice areas, and document checklist.',
    dashboard_message: 'Your legal automation workspace is ready to capture consultation requests and draft intake follow-ups.',
    templates: [
      { title: 'Consultation Intake', prompt: 'Legal consultation lead ka intake summary aur follow-up draft banao', trigger: 'new_lead' },
      { title: 'Document Checklist Reply', prompt: 'Legal document checklist ke liye reply draft karo', trigger: 'chat_command' },
      { title: 'Appointment Booking Follow-up', prompt: 'Legal appointment booking follow-up draft banao', trigger: 'manual_run' },
    ],
    quick_actions: ['Upload fee structure', 'Enable intake capture', 'Draft appointment reply'],
  },
  {
    key: 'fintech',
    label: 'Fintech',
    workspace_name: 'My Fintech Workspace',
    assistant_name: 'Fintech Support Bot',
    industry: 'Financial Services',
    target_audience: 'Users asking about plans, eligibility, onboarding, payments, and compliance',
    primary_goal: 'Answer onboarding FAQs and qualify high-intent users',
    document_hint: 'Upload plan details, compliance FAQs, onboarding steps, and pricing.',
    dashboard_message: 'Your fintech automation workspace is ready for onboarding FAQs, payment follow-ups, and qualified lead alerts.',
    templates: [
      { title: 'Onboarding FAQ', prompt: 'Fintech onboarding docs se FAQ generate karo', trigger: 'document_uploaded' },
      { title: 'Payment Follow-up', prompt: 'Payment pending users ke liye follow-up draft banao', trigger: 'manual_run' },
      { title: 'Eligibility Reply', prompt: 'Eligibility question ke liye compliant reply draft karo', trigger: 'chat_command' },
    ],
    quick_actions: ['Upload onboarding docs', 'Generate FAQs', 'Draft payment follow-up'],
  },
  {
    key: 'custom',
    label: 'Custom Business',
    workspace_name: 'My Business Workspace',
    assistant_name: 'Business Support Bot',
    industry: 'General Business',
    target_audience: 'Website visitors and customer inquiries',
    primary_goal: 'Capture leads and automate common customer follow-ups',
    document_hint: 'Upload pricing, services, FAQs, policies, and offers.',
    dashboard_message: 'Your automation workspace is ready to capture leads, answer FAQs, and prepare follow-up drafts.',
    templates: [
      { title: 'New Lead Follow-up', prompt: 'Aaj ke new leads ko follow-up message banao', trigger: 'new_lead' },
      { title: 'FAQ Generator', prompt: 'Uploaded documents se FAQ generate karo', trigger: 'document_uploaded' },
      { title: 'Content Generator', prompt: 'Mere business ke liye 7 Instagram posts banao', trigger: 'chat_command' },
    ],
    quick_actions: ['Upload documents', 'Enable lead capture', 'Create content drafts'],
  },
];

export const DEFAULT_INDUSTRY_PACK = INDUSTRY_PACKS[0];
