import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

export type NodeEnv = "development" | "test" | "production";

type AppConfig = {
  env: NodeEnv;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  port: number;
  clientUrl: string;
  clientOrigins: string[];
};

type SecretsConfig = {
  databaseUrl: string;
  jwtSecret: string;
};

type DatabaseConfig = {
  url: string;
  isLocal: boolean;
  ssl: false | { rejectUnauthorized: false };
  pool: {
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
};

export type Config = {
  app: AppConfig;
  secrets: SecretsConfig;
  database: DatabaseConfig;
};

const backendRoot = path.resolve(__dirname, "../..");
const originalProcessEnv = { ...process.env };
const requestedEnv = normalizeNodeEnv(process.env.NODE_ENV);

loadEnvFile(".env", false);
loadEnvFile(`.env.${requestedEnv}`, true);
loadEnvFile(`.env.${requestedEnv}.local`, true);

// Shell/cloud provider variables always win over local files.
for (const [key, value] of Object.entries(originalProcessEnv)) {
  if (value !== undefined) {
    process.env[key] = value;
  }
}

process.env.NODE_ENV = requestedEnv;

const app = buildAppConfig();
const secrets = buildSecretsConfig();
const database = buildDatabaseConfig(app, secrets);

export const config: Config = {
  app,
  secrets,
  database,
};

export const clientOrigins = config.app.clientOrigins;

function loadEnvFile(fileName: string, override: boolean) {
  const filePath = path.join(backendRoot, fileName);

  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override, quiet: true });
  }
}

function normalizeNodeEnv(value: string | undefined): NodeEnv {
  if (value === "production" || value === "test" || value === "development") {
    return value;
  }

  return "development";
}

function requiredValue(key: string, group: "config" | "secret") {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required ${group}: ${key}`);
  }

  return value;
}

function buildAppConfig(): AppConfig {
  const env = normalizeNodeEnv(process.env.NODE_ENV);
  const portValue = process.env.PORT?.trim() || "5000";
  const port = Number(portValue);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid config: PORT must be a positive integer. Received "${portValue}"`);
  }

  const clientUrl = requiredValue("CLIENT_URL", "config");
  const clientOrigins = clientUrl
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (clientOrigins.length === 0) {
    throw new Error("Invalid config: CLIENT_URL must include at least one allowed origin");
  }

  return {
    env,
    isDevelopment: env === "development",
    isProduction: env === "production",
    isTest: env === "test",
    port,
    clientUrl,
    clientOrigins,
  };
}

function buildSecretsConfig(): SecretsConfig {
  return {
    databaseUrl: requiredValue("DATABASE_URL", "secret"),
    jwtSecret: requiredValue("JWT_SECRET", "secret"),
  };
}

function buildDatabaseConfig(app: AppConfig, secrets: SecretsConfig): DatabaseConfig {
  const isLocal = /localhost|127\.0\.0\.1/i.test(secrets.databaseUrl);
  const ssl = app.isProduction && !isLocal
    ? { rejectUnauthorized: false } as const
    : false;

  return {
    url: secrets.databaseUrl,
    isLocal,
    ssl,
    pool: {
      max: app.isProduction ? 10 : 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    },
  };
}
