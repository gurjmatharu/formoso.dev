// types/index.ts

export type FormSubmission = {
  id: string;
  user_id: string;
  form_data: Record<string, any>;
  is_llm_detected_spam: boolean | null;
  ip_address: string;
  blocked: boolean;
  block_reason: string;
  created_at: string;
  updated_at: string;
  abuse_confidence_score: number;
  total_reports: number;
  country_code: string;
  domain: string;
  isp: string;
  is_public: boolean;
};
