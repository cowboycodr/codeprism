import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './packages/db/src/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.CODEPRISM_DATABASE_URL ?? './data/codeprism.sqlite'
  }
});
