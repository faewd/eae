import { Client } from "@elastic/elasticsearch";

export const client = new Client({
  node: "http://localhost:9200",
  auth: {
    username: "elastic",
    password: "elastic",
  },
});
