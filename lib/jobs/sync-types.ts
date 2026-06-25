export type JobSyncError = {
  company?: string;
  message: string;
  query?: string;
  slug?: string;
  source: string;
};

export type JobSyncSourceResult = {
  configured: boolean;
  source: string;
  totalJobsFetched: number;
  totalJobsInserted: number;
  totalJobsUpdated: number;
  totalRequests: number;
};

export type JobSyncResult = {
  errors: JobSyncError[];
  sourceResults: JobSyncSourceResult[];
  totalCompaniesChecked: number;
  totalJobsInserted: number;
  totalJobsUpdated: number;
};
