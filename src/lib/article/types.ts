import type { ArticleMetadata } from "./metadata";

export interface Article {
  title: string;
  metadata: ArticleMetadata;
  content: string;
  source: string;
  links: Link[];
}

export interface Link {
  title: string;
  label: string;
}
