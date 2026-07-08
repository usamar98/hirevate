export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: string;
          subscription_status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          country_code: string | null;
          country_name: string | null;
          last_seen_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: string;
          subscription_status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          country_code?: string | null;
          country_name?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: string;
          subscription_status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          country_code?: string | null;
          country_name?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          website: string | null;
          greenhouse_slug: string;
          industry: string | null;
          is_active: boolean;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          greenhouse_slug: string;
          industry?: string | null;
          is_active?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website?: string | null;
          greenhouse_slug?: string;
          industry?: string | null;
          is_active?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          company_id: string | null;
          external_id: string;
          title: string;
          description: string | null;
          location: string | null;
          remote_type: string | null;
          source: string | null;
          source_url: string | null;
          apply_url: string | null;
          posted_at: string | null;
          discovered_at: string;
          updated_at: string | null;
          last_seen_at: string | null;
          freshness_score: number;
          status: string;
          raw_data: Json | null;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          external_id: string;
          title: string;
          description?: string | null;
          location?: string | null;
          remote_type?: string | null;
          source?: string | null;
          source_url?: string | null;
          apply_url?: string | null;
          posted_at?: string | null;
          discovered_at?: string;
          updated_at?: string | null;
          last_seen_at?: string | null;
          freshness_score?: number;
          status?: string;
          raw_data?: Json | null;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          external_id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          remote_type?: string | null;
          source?: string | null;
          source_url?: string | null;
          apply_url?: string | null;
          posted_at?: string | null;
          discovered_at?: string;
          updated_at?: string | null;
          last_seen_at?: string | null;
          freshness_score?: number;
          status?: string;
          raw_data?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_jobs: {
        Row: {
          id: string;
          user_id: string | null;
          job_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          job_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          job_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          }
        ];
      };
      job_views: {
        Row: {
          id: string;
          user_id: string | null;
          job_id: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          job_id?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          job_id?: string | null;
          viewed_at?: string;
        };
        Relationships: [];
      };
      job_source_usage: {
        Row: {
          source: string;
          period_month: string;
          searches_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          source: string;
          period_month: string;
          searches_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          source?: string;
          period_month?: string;
          searches_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_source_health: {
        Row: {
          id: string;
          source: string;
          source_key: string;
          display_name: string;
          status: "active" | "cooldown" | "disabled";
          consecutive_failures: number;
          total_successes: number;
          total_failures: number;
          last_success_at: string | null;
          last_failure_at: string | null;
          disabled_until: string | null;
          last_error: string | null;
          last_jobs_fetched: number;
          last_jobs_inserted: number;
          average_jobs_fetched: number;
          inserted_today: number;
          checked_today_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          source_key: string;
          display_name: string;
          status?: "active" | "cooldown" | "disabled";
          consecutive_failures?: number;
          total_successes?: number;
          total_failures?: number;
          last_success_at?: string | null;
          last_failure_at?: string | null;
          disabled_until?: string | null;
          last_error?: string | null;
          last_jobs_fetched?: number;
          last_jobs_inserted?: number;
          average_jobs_fetched?: number;
          inserted_today?: number;
          checked_today_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          source_key?: string;
          display_name?: string;
          status?: "active" | "cooldown" | "disabled";
          consecutive_failures?: number;
          total_successes?: number;
          total_failures?: number;
          last_success_at?: string | null;
          last_failure_at?: string | null;
          disabled_until?: string | null;
          last_error?: string | null;
          last_jobs_fetched?: number;
          last_jobs_inserted?: number;
          average_jobs_fetched?: number;
          inserted_today?: number;
          checked_today_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string | null;
          job_title: string;
          company: string;
          location: string | null;
          job_url: string | null;
          status: "interested" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";
          contact_name: string | null;
          contact_email: string | null;
          salary_range: string | null;
          applied_at: string | null;
          next_follow_up_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string | null;
          job_title: string;
          company: string;
          location?: string | null;
          job_url?: string | null;
          status?: "interested" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";
          contact_name?: string | null;
          contact_email?: string | null;
          salary_range?: string | null;
          applied_at?: string | null;
          next_follow_up_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string | null;
          job_title?: string;
          company?: string;
          location?: string | null;
          job_url?: string | null;
          status?: "interested" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";
          contact_name?: string | null;
          contact_email?: string | null;
          salary_range?: string | null;
          applied_at?: string | null;
          next_follow_up_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          }
        ];
      };
      resume_ab_tests: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          resume_a_name: string;
          resume_a_notes: string | null;
          resume_b_name: string;
          resume_b_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          resume_a_name?: string;
          resume_a_notes?: string | null;
          resume_b_name?: string;
          resume_b_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          resume_a_name?: string;
          resume_a_notes?: string | null;
          resume_b_name?: string;
          resume_b_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      resume_ab_applications: {
        Row: {
          id: string;
          user_id: string;
          ab_test_id: string;
          resume_variant: "A" | "B";
          job_title: string;
          company: string | null;
          contact_name: string | null;
          contact_email: string | null;
          status: "applied" | "interview" | "offer" | "rejected";
          application_channel: "direct" | "referral" | "recruiter" | "job_board" | "other";
          applied_at: string;
          interview_at: string | null;
          next_follow_up_at: string | null;
          source_url: string | null;
          resume_snapshot_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ab_test_id: string;
          resume_variant: "A" | "B";
          job_title: string;
          company?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          status?: "applied" | "interview" | "offer" | "rejected";
          application_channel?: "direct" | "referral" | "recruiter" | "job_board" | "other";
          applied_at?: string;
          interview_at?: string | null;
          next_follow_up_at?: string | null;
          source_url?: string | null;
          resume_snapshot_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ab_test_id?: string;
          resume_variant?: "A" | "B";
          job_title?: string;
          company?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          status?: "applied" | "interview" | "offer" | "rejected";
          application_channel?: "direct" | "referral" | "recruiter" | "job_board" | "other";
          applied_at?: string;
          interview_at?: string | null;
          next_follow_up_at?: string | null;
          source_url?: string | null;
          resume_snapshot_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resume_ab_applications_ab_test_id_fkey";
            columns: ["ab_test_id"];
            isOneToOne: false;
            referencedRelation: "resume_ab_tests";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      reserve_job_source_searches: {
        Args: {
          source_name: string;
          monthly_limit: number;
          reserve_count?: number;
        };
        Returns: {
          allowed: boolean;
          searches_used: number;
          searches_remaining: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Job = Database["public"]["Tables"]["jobs"]["Row"];
export type SavedJob = Database["public"]["Tables"]["saved_jobs"]["Row"];
export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];
export type JobSourceUsage = Database["public"]["Tables"]["job_source_usage"]["Row"];
export type JobSourceHealth = Database["public"]["Tables"]["job_source_health"]["Row"];
export type ResumeAbApplication = Database["public"]["Tables"]["resume_ab_applications"]["Row"];
export type ResumeAbTest = Database["public"]["Tables"]["resume_ab_tests"]["Row"];

export type JobWithCompany = Job & {
  companies: Pick<Company, "id" | "name" | "greenhouse_slug" | "website"> | null;
};

export type SavedJobWithJob = SavedJob & {
  jobs: JobWithCompany | null;
};
