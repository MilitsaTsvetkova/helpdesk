import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

// `prisma db push` only syncs Prisma-modeled tables/columns; raw-SQL database
// objects (e.g. stored functions) aren't represented in schema.prisma, so
// apply their migration files here directly. CREATE OR REPLACE is idempotent,
// so re-running this on every test run is safe.
const RAW_SQL_MIGRATIONS = [
  '20260712094007_add_dashboard_stats_function',
];

export default async function globalSetup() {
  const testDbUrl = process.env.TEST_DATABASE_URL;
  if (!testDbUrl) throw new Error('TEST_DATABASE_URL is not set in .env.test');

  const dbUrl = new URL(testDbUrl);
  const testDbName = dbUrl.pathname.slice(1);

  // Connect to the default postgres DB to create the test DB if needed
  const adminUrl = new URL(testDbUrl);
  adminUrl.pathname = '/postgres';

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  // cSpell:ignore datname
  const { rowCount } = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [testDbName],
  );

  if (!rowCount) {
    await client.query(`CREATE DATABASE "${testDbName}"`);
    console.log(`[setup] Created test database: ${testDbName}`);
  }

  await client.end();

  // Sync schema to test DB (apply any schema changes; data is preserved between runs)
  // cSpell:ignore bunx
  execSync('bunx prisma db push', {
    cwd: path.resolve(__dirname, '../server'),
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'inherit',
  });

  const testClient = new Client({ connectionString: testDbUrl });
  await testClient.connect();
  for (const migration of RAW_SQL_MIGRATIONS) {
    const sql = fs.readFileSync(
      path.resolve(__dirname, `../server/prisma/migrations/${migration}/migration.sql`),
      'utf-8',
    );
    await testClient.query(sql);
  }
  await testClient.end();
}
