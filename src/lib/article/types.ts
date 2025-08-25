import type { Infobox } from "./infobox";

export interface Article {
  title: string;
  metadata: ArticleMetadata;
  content: string;
  source: string;
  links: Link[];
}

export interface ArticleMetadata {
  infobox?: Infobox;
}

export interface Link {
  title: string;
  label: string;
}

// export interface MapPin {
//   map: string;
//   coords: [number, number];
//   type: PinType;
// }

// export type PinType = "region" | "province" | "capital" | "city" | "town" | "ruin" | "poi";
