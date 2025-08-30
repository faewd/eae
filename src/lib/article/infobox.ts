import * as z from "zod";

export const InfoboxHeadingItemSchema = z.object({
  kind: z.literal("heading"),
  text: z.string(),
});

export const InfoboxFactItemSchema = z.object({
  kind: z.literal("fact"),
  label: z.string(),
  content: z.string(),
});

export const InfoboxListItemSchema = z.object({
  kind: z.literal("list"),
  label: z.string(),
  items: z.array(z.string()),
  delimited: z.optional(z.boolean()),
});

export const InfoboxImageItemSchema = z.object({
  kind: z.literal("image"),
  alt: z.string(),
  src: z.string(),
  caption: z.string(),
});

export const InfoboxItemSchema = z.union([
  InfoboxHeadingItemSchema,
  InfoboxFactItemSchema,
  InfoboxListItemSchema,
  InfoboxImageItemSchema,
]);

export const InfoboxSchema = z.object({
  title: z.optional(z.string()),
  items: z.array(InfoboxItemSchema),
});

export type Infobox = z.infer<typeof InfoboxSchema>;
