export type NewsStatus = 'novo' | 'reapurar' | 'em_producao' | 'publicado' | 'descartado';

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source_name: string | null;
  published_at: string | null;
  summary: string | null;
  query_label: string | null;
  topic: string | null;
  city: string | null;
  region: string | null;
  opportunity_score: number | null;
  status: NewsStatus;
  angle: string | null;
  notes: string | null;
  created_at: string;
};

export type RssQuery = {
  id: string;
  label: string;
  query: string;
  topic: string | null;
  city: string | null;
  region: string | null;
  priority_weight: number;
  enabled: boolean;
};
