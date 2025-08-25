export type Infobox = {
  title?: string;
  items: InfoboxItem[];
};

export type InfoboxItem =
  | {
      kind: "heading";
      text: string;
    }
  | {
      kind: "fact";
      label: string;
      content: string;
    }
  | {
      kind: "list";
      label: string;
      items: string[];
      delimited?: boolean;
    }
  | {
      kind: "image";
      alt: string;
      src: string;
      caption: string;
    };
