import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

type Env = {
  NODE_ENV: "development" | "test" | "production";
  PORT: string;
  DATABASE_URL: string;
  CLIENT_URL: string;
  JWT_SECRET: string;
};

const backendRoot = path.resolve(__dirname, "../..");
const nodeEnv = (process.env.NODE_ENV || "development") as Env["NODE_ENV"];
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

// Real environment variables from Render/Vercel/Neon/Supabase/etc. always win.
for (const [key, value] of Object.entries(originalProcessEnv)) {
  if (value !== undefined) {
    process.env[key] = value;
  }
}

process.env.NODE_ENV = nodeEnv;

const requiredKeys: Array<keyof Env> = [
  "NODE_ENV",
  "PORT",
  "DATABASE_URL",
  "CLIENT_URL",
  "JWT_SECRET",
];

const missing = requiredKeys.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

export const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  JWT_SECRET: process.env.JWT_SECRET,
} as Env;

export const clientOrigins = env.CLIENT_URL
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
