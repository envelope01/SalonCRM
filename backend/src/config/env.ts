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
const shouldPreferRuntimeEnv = nodeEnv !== "development";

function loadEnvFile(fileName: string, override: boolean) {
  const filePath = path.join(backendRoot, fileName);

  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override, quiet: true });
  }
}

loadEnvFile(".env", false);
loadEnvFile(`.env.${nodeEnv}`, true);
loadEnvFile(`.env.${nodeEnv}.local`, true);

// Cloud/runtime variables should win in production. Local development should
// prefer .env.development to avoid accidentally connecting to hosted services.
if (shouldPreferRuntimeEnv) {
  for (const [key, value] of Object.entries(originalProcessEnv)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
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

function isPrivateDevelopmentHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

export function isAllowedClientOrigin(origin: string) {
  if (clientOrigins.includes(origin)) return true;

  if (env.NODE_ENV !== "development") return false;

  try {
    const parsed = new URL(origin);
    const isAllowedPort = parsed.port === "3000" || parsed.port === "5173";
    const isAllowedProtocol = parsed.protocol === "http:";

    return isAllowedProtocol && isAllowedPort && isPrivateDevelopmentHost(parsed.hostname);
  } catch {
    return false;
  }
}
