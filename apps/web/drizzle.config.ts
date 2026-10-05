import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;

function partsCredentials() {
  // Loaded lazily so DB_* validation only runs when DATABASE_URL isn't set
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { env } = require("@/data/env/db") as typeof import("@/data/env/db");
  return {
    password: env.DB_PASSWORD,
    user: env.DB_USER,
    database: env.DB_NAME,
    host: env.DB_HOST,
    port: env.DB_PORT,
    ssl: env.DB_SSL,
  };
}

const dbCredentials = url ? { url } : partsCredentials();

// drizzle-kit loads apps/web/.env by itself, and a DATABASE_URL there wins
// over DB_* set on the command line. Say which database this is, before
// anything runs against it (host and name only, never the password).
const target =
  "url" in dbCredentials
    ? `${new URL(dbCredentials.url).hostname}${new URL(dbCredentials.url).pathname} (from DATABASE_URL)`
    : `${dbCredentials.host}/${dbCredentials.database} (from DB_*)`;
console.error(`[drizzle] database: ${target}`);

export default defineConfig({
  out: "./src/drizzle/migrations",
  schema: "./src/drizzle/schema.ts",
  dialect: "postgresql",
  strict: true,
  verbose: true,
  dbCredentials,
});