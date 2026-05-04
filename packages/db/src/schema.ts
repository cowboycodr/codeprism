import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const repositories = sqliteTable(
  'repositories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    owner: text('owner').notNull(),
    name: text('name').notNull(),
    defaultBranch: text('default_branch').notNull().default('main'),
    ciCommand: text('ci_command').notNull().default('npm test'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`)
  },
  (table) => ({
    repoUnique: uniqueIndex('repositories_owner_name_unique').on(table.owner, table.name)
  })
);

export const sshKeys = sqliteTable('ssh_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  publicKey: text('public_key').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export const pushes = sqliteTable('pushes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  repositoryId: integer('repository_id')
    .notNull()
    .references(() => repositories.id, { onDelete: 'cascade' }),
  oldSha: text('old_sha').notNull(),
  newSha: text('new_sha').notNull(),
  refName: text('ref_name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  repositoryId: integer('repository_id')
    .notNull()
    .references(() => repositories.id, { onDelete: 'cascade' }),
  pushId: integer('push_id').references(() => pushes.id, { onDelete: 'set null' }),
  commitSha: text('commit_sha').notNull(),
  status: text('status', { enum: ['queued', 'running', 'succeeded', 'failed', 'canceled', 'setup_failed'] })
    .notNull()
    .default('queued'),
  command: text('command').notNull(),
  exitCode: integer('exit_code'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export const jobLogs = sqliteTable('job_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: integer('job_id')
    .notNull()
    .references(() => jobs.id, { onDelete: 'cascade' }),
  stream: text('stream', { enum: ['stdout', 'stderr', 'system'] }).notNull(),
  line: text('line').notNull(),
  sequence: integer('sequence').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
});

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
