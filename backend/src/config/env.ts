import { clientOrigins, config } from "./index";

export const env = {
  NODE_ENV: config.app.env,
  PORT: String(config.app.port),
  DATABASE_URL: config.secrets.databaseUrl,
  CLIENT_URL: config.app.clientUrl,
  JWT_SECRET: config.secrets.jwtSecret,
};

export { clientOrigins, config };
