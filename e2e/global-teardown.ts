export default async function globalTeardown() {
  // Test DB data persists between runs for easier failure debugging.
  // Each test should clean up its own data in beforeEach/afterEach.
  // To fully reset: bunx prisma db push --force-reset (run from server/ with TEST_DATABASE_URL)
}
