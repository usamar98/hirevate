export type JobSyncError = {
  company?: string;
  message: string;
  query?: string;
  slug?: string;
  source: string;
};

export type JobSyncSourceResult = {
  configured: boolean;
  monthlyLimit?: number;
  searchesRemaining?: number;
  searchesUsed?: number;
  skippedReason?: string;
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
