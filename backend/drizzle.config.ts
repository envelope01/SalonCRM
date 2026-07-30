import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import fs from "node:fs";
import path from "node:path";

const nodeEnv = process.env.NODE_ENV || "development";
const backendRoot = __dirname;
const originalProcessEnv = { ...process.env };

function loadEnvFile(fileName: string, override: boolean) {
  const filePath = path.join(backendRoot, fileName);

  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override, quiet: true });
  }
}

loadEnvFile(".env", false);
loadEnvFile(`.env.${nodeEnv}`, true);
loadEnvFile(`.env.${nodeEnv}.local`, true);

// Shell/Render variables must override local template files.
for (const [key, value] of Object.entries(originalProcessEnv)) {
  if (value !== undefined) {
    process.env[key] = value;
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Drizzle commands");
}

const isLocalDatabase = /localhost|127\.0\.0\.1/i.test(databaseUrl);
const useSsl = nodeEnv === "production" && !isLocalDatabase;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
    ssl: useSsl ? "require" : false,
  },
});
