export interface User {
  id: number;
  email: string;
  company_name: string | null;
  created_at: string;
  is_active: number;
}

export interface PackageComponent {
  id: number;
  package_id: number;
  component_type: string;
  name: string;
  location?: string;
  nights_or_duration?: string;
  base_price_lkr?: number;
  notes?: string;
}

export interface DMCPackage {
  id: number;
  dmc_account_id: number;
  name: string;
  destination: string;
  duration_days: number;
  total_price_lkr: number;
  status: string;
  created_at: string;
  components: PackageComponent[];
}

export interface CompetitivenessReport {
  id: number;
  package_id: number;
  source_market_id: number;
  dmc_price_usd: number;
  market_assembled_price_usd: number;
  price_delta_pct: number;
  status: string;
  generated_at: string;
}

export interface AnalysisJob {
  id: string;
  package_id: number;
  source_market_ids: number[];
  status: string;
  total_tasks: number;
  completed_tasks: number;
  created_at: string;
  completed_at?: string;
  error_log?: string;
}
