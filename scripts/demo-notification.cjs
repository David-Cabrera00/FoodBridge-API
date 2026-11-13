const assert = require('node:assert/strict');
const { connectDemo, seedNotification, uuid } = require('./demo-db.cjs');

async function main() {
  const userId = process.argv[2];
  assert(
    typeof userId === 'string' && uuid.test(userId),
    'Usage: node scripts/demo-notification.cjs USER_ID (UUID)',
  );
  const db = await connectDemo();
  try {
    console.log(JSON.stringify(await seedNotification(db, userId), null, 2));
  } finally {
    await db.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
