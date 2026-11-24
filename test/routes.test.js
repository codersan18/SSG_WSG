/**
 * Tests the gateway over real HTTP: routes, API key, validation, response format and error handling.
 * SSG itself is faked.
 */
const { TEST_ENV } = require('./helpers/setup');
const { describe, test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const fakeSsg = require('./helpers/fakeSsg');
const app = require('../app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0); // any free port
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());
beforeEach(() => fakeSsg.reset());

/** Calls the gateway. Sends the test API key unless `apiKey: null`. */
async function call(method, path, { body, rawBody, apiKey = TEST_ENV.GATEWAY_API_KEY } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;

  const response = await fetch(baseUrl + path, {
    method,
    headers,
    body: rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  return { status: response.status, body: await response.json() };
}

describe('Health and security', () => {
  test('GET /health works without an API key', async () => {
    const res = await call('GET', '/health', { apiKey: null });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'UP');
  });

  test('a request without x-api-key is rejected with 401 and never reaches SSG', async () => {
    const res = await call('GET', '/api/ssg/course-runs/123', { apiKey: null });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(fakeSsg.requestCount(), 0);
  });

  test('a wrong x-api-key is rejected with 401', async () => {
    const res = await call('GET', '/api/ssg/course-runs/123', { apiKey: 'wrong-key' });
    assert.equal(res.status, 401);
  });

  test('an unknown route returns 404', async () => {
    const res = await call('GET', '/api/ssg/does-not-exist');
    assert.equal(res.status, 404);
    assert.match(res.body.message, /Route not found/);
  });

  test('invalid JSON returns 400', async () => {
    const res = await call('POST', '/api/ssg/enrolments', { rawBody: '{not json' });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, 'Request body is not valid JSON');
  });
});

describe('Response format', () => {
  test('success wraps the SSG response as { success: true, data }', async () => {
    fakeSsg.replyWith({ status: 200, body: '{"status":200,"data":{"course":{"title":"Test"}}}' });
    const res = await call('GET', '/api/ssg/course-runs/123');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { success: true, data: { status: 200, data: { course: { title: 'Test' } } } });
  });

  test('an SSG error keeps SSG\'s status and shows SSG\'s answer', async () => {
    fakeSsg.replyWith({ status: 403, body: '{"error":"Access to this API has been disallowed"}' });
    const res = await call('GET', '/api/ssg/trainers');
    assert.equal(res.status, 403);
    assert.deepEqual(res.body, {
      success: false,
      message: 'SSG getTrainers failed with HTTP 403',
      api: 'getTrainers',
      ssgResponse: { error: 'Access to this API has been disallowed' },
    });
  });

  test('an SSG timeout returns 504', async () => {
    fakeSsg.replyWith({ networkError: 'ECONNABORTED' });
    const res = await call('GET', '/api/ssg/course-runs/123');
    assert.equal(res.status, 504);
  });
});

describe('Required fields are checked before calling SSG', () => {
  const cases = [
    ['POST', '/api/ssg/course-runs', {}, 'course.courseReferenceNumber'],
    ['PUT', '/api/ssg/course-runs/123', {}, 'course.courseReferenceNumber'],
    ['DELETE', '/api/ssg/course-runs/123', undefined, 'courseReferenceNumber'],
    ['GET', '/api/ssg/course-runs/123/sessions', undefined, 'courseReferenceNumber'],
    ['GET', '/api/ssg/attendance/123?courseReferenceNumber=X', undefined, 'sessionId'],
    ['POST', '/api/ssg/attendance/123', {}, 'course.sessionID'],
    ['POST', '/api/ssg/enrolments', {}, 'enrolment'],
    ['POST', '/api/ssg/enrolments/ENR-1/fee-collection', {}, 'collectionStatus'],
    ['POST', '/api/ssg/assessments', {}, 'assessment'],
    ['POST', '/api/ssg/grants/calculator', {}, 'course.referenceNumber'],
    ['POST', '/api/ssg/grants/calculator/personalised', { course: { referenceNumber: 'X' } }, 'trainee.id'],
    ['POST', '/api/ssg/sfc-claims/encrypt', {}, 'claimRequest'],
    ['POST', '/api/ssg/sfc-claims/decrypt', {}, 'claimRequestStatus'],
    ['GET', '/api/ssg/sfc-claims/C1', undefined, 'nric'],
    ['POST', '/api/ssg/sfc-claims/C1/cancel', { nric: 'S1234567A' }, 'claimCancelCode'],
    ['POST', '/api/ssg/sfc-claims/C1/documents', { nric: 'S1234567A' }, 'attachments'],
  ];

  for (const [method, path, body, missingField] of cases) {
    test(`${method} ${path} without ${missingField} returns 400`, async () => {
      const res = await call(method, path, { body });
      assert.equal(res.status, 400);
      assert.match(res.body.message, new RegExp(missingField.replace('.', '\\.')));
      assert.equal(fakeSsg.requestCount(), 0, 'SSG must not be called');
    });
  }
});

describe('Each route reaches the right SSG API', () => {
  const cases = [
    ['GET', '/api/ssg/courses/TGS-1', undefined, 'GET', '/courses/directory/TGS-1'],
    ['GET', '/api/ssg/courses/TGS-1/runs', undefined, 'GET', '/courses/courseRuns/reference'],
    ['POST', '/api/ssg/course-runs', { course: { courseReferenceNumber: 'TGS-1' } }, 'POST', '/courses/courseRuns/publish'],
    ['GET', '/api/ssg/course-runs/123', undefined, 'GET', '/courses/courseRuns/id/123'],
    ['PUT', '/api/ssg/course-runs/123', { course: { courseReferenceNumber: 'TGS-1' } }, 'POST', '/courses/courseRuns/edit/123'],
    ['DELETE', '/api/ssg/course-runs/123?courseReferenceNumber=TGS-1', undefined, 'POST', '/courses/courseRuns/edit/123'],
    ['GET', '/api/ssg/course-runs/123/sessions?courseReferenceNumber=TGS-1', undefined, 'GET', '/courses/runs/123/sessions'],
    ['GET', '/api/ssg/attendance/123?courseReferenceNumber=TGS-1&sessionId=S1', undefined, 'GET', '/courses/runs/123/sessions/attendance'],
    ['POST', '/api/ssg/attendance/123', { course: { sessionID: 'S1' } }, 'POST', '/courses/runs/123/sessions/attendance'],
    ['GET', '/api/ssg/trainers', undefined, 'GET', `/trainingProviders/${TEST_ENV.SSG_UEN}/trainers`],
    ['PUT', '/api/ssg/trainers/T1', { trainer: {} }, 'POST', `/trainingProviders/${TEST_ENV.SSG_UEN}/trainers/T1`],
    ['DELETE', '/api/ssg/trainers/T1', undefined, 'POST', `/trainingProviders/${TEST_ENV.SSG_UEN}/trainers/T1`],
    ['POST', '/api/ssg/enrolments', { enrolment: {} }, 'POST', '/tpg/enrolments'],
    ['POST', '/api/ssg/enrolments/search', {}, 'POST', '/tpg/enrolments/search'],
    ['GET', '/api/ssg/enrolments/ENR-1', undefined, 'GET', '/tpg/enrolments/details/ENR-1'],
    ['PUT', '/api/ssg/enrolments/ENR-1', {}, 'POST', '/tpg/enrolments/details/ENR-1'],
    ['POST', '/api/ssg/enrolments/ENR-1/cancel', undefined, 'POST', '/tpg/enrolments/details/ENR-1'],
    ['POST', '/api/ssg/enrolments/ENR-1/fee-collection', { collectionStatus: 'Full Payment' }, 'POST', '/tpg/enrolments/feeCollections/ENR-1'],
    ['POST', '/api/ssg/assessments', { assessment: {} }, 'POST', '/tpg/assessments'],
    ['POST', '/api/ssg/assessments/search', {}, 'POST', '/tpg/assessments/search'],
    ['GET', '/api/ssg/assessments/ASM-1', undefined, 'GET', '/tpg/assessments/details/ASM-1'],
    ['PUT', '/api/ssg/assessments/ASM-1', {}, 'POST', '/tpg/assessments/details/ASM-1'],
    ['POST', '/api/ssg/assessments/ASM-1/void', undefined, 'POST', '/tpg/assessments/details/ASM-1'],
    ['POST', '/api/ssg/grants/calculator', { course: { referenceNumber: 'TGS-1' } }, 'POST', '/grantCalculators/individual'],
    ['POST', '/api/ssg/grants/calculator/personalised', { course: { referenceNumber: 'TGS-1' }, trainee: { id: 'S1234567A' } }, 'POST', '/grantCalculators/individual/personalised'],
    ['POST', '/api/ssg/grants/search', {}, 'POST', '/tpg/grants/search'],
    ['GET', '/api/ssg/grants/GL-1', undefined, 'GET', '/tpg/grants/details/GL-1'],
    ['POST', '/api/ssg/sfc-claims/encrypt', { claimRequest: {} }, 'POST', '/skillsFutureCredits/claims/encryptRequests'],
    ['POST', '/api/ssg/sfc-claims/decrypt', { claimRequestStatus: 'x' }, 'POST', '/skillsFutureCredits/claims/decryptRequests'],
    ['GET', '/api/ssg/sfc-claims/C1?nric=S1234567A', undefined, 'GET', '/skillsFutureCredits/claims/C1'],
    ['POST', '/api/ssg/sfc-claims/C1/cancel', { nric: 'S1234567A', claimCancelCode: '51' }, 'POST', '/skillsFutureCredits/claims/C1'],
    ['POST', '/api/ssg/sfc-claims/C1/documents', { nric: 'S1234567A', attachments: [] }, 'POST', '/skillsFutureCredits/claims/C1/supportingdocuments'],
  ];

  for (const [method, path, body, ssgMethod, ssgPath] of cases) {
    test(`${method} ${path.split('?')[0]} → ${ssgMethod} ${ssgPath}`, async () => {
      const res = await call(method, path, { body });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      assert.equal(fakeSsg.lastRequest().method, ssgMethod);
      assert.equal(fakeSsg.lastRequest().url, ssgPath);
    });
  }
});
