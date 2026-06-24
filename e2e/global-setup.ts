import { execSync } from 'node:child_process';
import path from 'node:path';
import { Client } from 'pg';

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
}
