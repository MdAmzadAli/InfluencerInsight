import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set - database operations will be disabled");
  // Return a minimal config that won't break the build
  export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
      url: "postgresql://placeholder:placeholder@localhost:5432/placeholder",
    },
  });
} else {
  export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
      url: process.env.DATABASE_URL,
    },
  });
}
