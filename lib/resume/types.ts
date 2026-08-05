export type Experience = {
  id: string;
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
};

export type Project = {
  id: string;
  name: string;
  link: string;
  bullets: string[];
};

export type Education = {
  id: string;
  school: string;
  degree: string;
  dates: string;
};

export type ResumeTemplate =
  | "precision"
  | "modern"
  | "executive"
  | "minimal"
  | "compact"
  | "technical";

export type ResumeDraft = {
  template: ResumeTemplate;
  accent: string;
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  targetRole: string;
  targetKeywords: string;
  summary: string;
  skills: string;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: string;
};

export type JobAnalysis = {
  title: string;
  company: string;
  location: string;
  summary: string;
  keywords: string[];
  responsibilities: string[];
  qualifications: string[];
  sourceUrl: string;
};

export type TailoredResumeResult = {
  headline: string;
  targetRole: string;
  targetKeywords: string[];
  summary: string;
  skills: string[];
  experience: Array<{ id: string; bullets: string[] }>;
  projects: Array<{ id: string; bullets: string[] }>;
  reviewNotes: string[];
};
