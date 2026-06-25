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
  totalJobsExpired?: number;
  searchesRemaining?: number;
  searchesUsed?: number;
  setupRequired?: boolean;
  setupSqlPath?: string;
  skippedReason?: string;
  source: string;
  totalJobsFetched: number;
  totalJobsInserted: number;
  totalJobsUpdated: number;
  totalRequests: number;
  totalSkipped?: number;
};

export type JobSyncResult = {
  errors: JobSyncError[];
  sourceResults: JobSyncSourceResult[];
  totalCompaniesChecked: number;
  totalJobsExpired?: number;
  totalJobsInserted: number;
  totalJobsUpdated: number;
};
