export type GuideReference = {
  label: string;
  url: string;
};

const googleJobPostingReference: GuideReference = {
  label: "Google Search Central: JobPosting guidelines and content policies",
  url: "https://developers.google.com/search/docs/appearance/structured-data/job-posting"
};

const leverPostingsReference: GuideReference = {
  label: "Lever: public Postings API documentation",
  url: "https://github.com/lever/postings-api"
};

const careerOneStopResumeReference: GuideReference = {
  label: "CareerOneStop: Resume Writing Guide",
  url: "https://www.careeronestop.org/JobSearch/Resumes/ResumeGuide/introduction.aspx"
};

const careerOneStopSearchReference: GuideReference = {
  label: "CareerOneStop: Plan your job search",
  url: "https://www.careeronestop.org/JobSearch/job-search.aspx"
};

export const guideReferences: Record<string, readonly GuideReference[]> = {
  "find-hidden-jobs": [googleJobPostingReference, leverPostingsReference],
  "search-company-career-pages": [leverPostingsReference, googleJobPostingReference],
  "remote-job-search": [googleJobPostingReference],
  "job-freshness-score": [googleJobPostingReference],
  "resume-job-match": [careerOneStopResumeReference],
  "application-tracking": [careerOneStopSearchReference]
};
