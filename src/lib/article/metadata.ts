import * as yaml from "yaml";
import * as z from "zod";
import { InfoboxSchema } from "./infobox";
import { ParserError } from "./parse";

const MapPinSchema = z.object({
  map: z.string(),
  label: z.optional(z.string()),
  desc: z.optional(z.string()),
  type: z.enum([
    "region",
    "domain",
    "zone",
    "capital",
    "city",
    "town",
    "ruin",
    "poi",
  ]),
  coords: z.tuple([z.number(), z.number()]),
});

export type MapPin = z.infer<typeof MapPinSchema>;
export type PinType = MapPin["type"];

const EventSchema = z.object({
  label: z.string(),
  time: z.string().regex(/^\d+e\d+$/, {
    error: "Event time must be of the form '<era>e<year>'.",
  }),
  desc: z.optional(z.string()),
});

export type Event = z.infer<typeof EventSchema>;

const ArticleMetadataSchema = z.object({
  tags: z.array(z.string()),
  summary: z.optional(z.string()),
  infobox: z.optional(InfoboxSchema),
  pins: z.array(MapPinSchema),
  events: z.array(EventSchema),
});

export type ArticleMetadata = z.infer<typeof ArticleMetadataSchema>;

const FM_DEFAULTS = {
  tags: [],
  pins: [],
  events: [],
};

export function parseMetadata(source: string | undefined): ArticleMetadata {
  const properties: Partial<ArticleMetadata> = source !== undefined
    ? yaml.parse(source)
    : {};
  const meta = Object.assign({}, FM_DEFAULTS, properties);
  const result = ArticleMetadataSchema.safeParse(meta);
  if (result.success) return result.data;
  throw new ParserError(
    { offset: 0, length: 1 },
    z.prettifyError(result.error),
  );
}
