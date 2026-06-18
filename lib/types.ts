export type NewsStatus = 'novo' | 'reapurar' | 'em_producao' | 'publicado' | 'descartado';

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source_name: string | null;
  source_domain?: string | null;
  source_url?: string | null;
  published_at: string | null;
  summary: string | null;
  query_label: string | null;
  topic: string | null;
  city: string | null;
  region: string | null;
  opportunity_score: number | null;
  story_key?: string | null;
  media_mentions_count?: number | null;
  media_repercussion_score?: number | null;
  top_media_sources?: string[] | null;
  competitor_hits_count?: number | null;
  competitor_names?: string[] | null;
  competitor_notes?: string | null;
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
