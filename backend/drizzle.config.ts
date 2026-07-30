import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env";

const isLocalDatabase = /localhost|127\.0\.0\.1/i.test(env.DATABASE_URL);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
    ssl: env.NODE_ENV === "production" && !isLocalDatabase,
  },
});
