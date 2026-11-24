/**
 * Quick check that your certificate, encryption key, UEN and TP code all work against SSG.
 * Run with: npm run check
 *
 * It makes two read-only calls:
 *   1. Enrolment search (encrypted): tests the certificate AND the encryption key
 *   2. Course run by ID (plain):     tests the certificate only. Runs only if TEST_RUN_ID is set.
 */
const { searchEnrolments } = require('../services/tpg/enrolmentService');
const { getCourseRunById } = require('../services/tpg/courseService');

async function check(label, fn) {
  try {
    await fn();
    console.log(`✓ ${label}`);
  } catch (error) {
    console.error(`✗ ${label}: ${error.message}`);
    if (error.ssgResponse) console.error('  SSG said:', JSON.stringify(error.ssgResponse, null, 2));
    process.exitCode = 1;
  }
}

(async () => {
  const year = new Date().getFullYear();

  await check('Enrolment search (certificate + encryption)', () =>
    searchEnrolments({
      meta: { lastUpdateDateFrom: `${year}-01-01`, lastUpdateDateTo: `${year}-12-31` },
      sortBy: { field: 'updatedOn', order: 'asc' },
      parameters: { page: 0, pageSize: 1 },
    })
  );

  if (process.env.TEST_RUN_ID) {
    await check(`Course run ${process.env.TEST_RUN_ID} (certificate)`, () => getCourseRunById(process.env.TEST_RUN_ID));
  }
})();
