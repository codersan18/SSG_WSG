require('./helpers/setup');
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const fakeSsg = require('./helpers/fakeSsg');
const { callSsg, SsgApiError } = require('../services/ssgClient');
const { encrypt, decrypt } = require('../services/ssgCrypto');

// Small endpoints used only by these tests
const PLAIN_ENDPOINT = { name: 'plainTest', method: 'GET', path: '/things/:id', version: ['TEST_PLAIN_VERSION', 'v1.0'], encrypted: false };
const ENCRYPTED_ENDPOINT = { name: 'encryptedTest', method: 'POST', path: '/secure/:ref', version: ['TEST_ENC_VERSION', 'v4.0'], encrypted: true };

beforeEach(() => {
  fakeSsg.reset();
  delete process.env.TEST_PLAIN_VERSION;
  delete process.env.TEST_ENC_VERSION;
});

// ------------------------------------------------------------------ Request building

test('fills path parameters and URL-encodes them', async () => {
  await callSsg(PLAIN_ENDPOINT, { pathParams: { id: 'TGS 2026/01' } });
  assert.equal(fakeSsg.lastRequest().url, '/things/TGS%202026%2F01');
});

test('passes query parameters through', async () => {
  await callSsg(PLAIN_ENDPOINT, { pathParams: { id: '1' }, query: { uen: 'X', page: 0 } });
  assert.deepEqual(fakeSsg.lastRequest().query, { uen: 'X', page: 0 });
});

test('sends the default x-api-version from the endpoint', async () => {
  await callSsg(PLAIN_ENDPOINT, { pathParams: { id: '1' } });
  assert.equal(fakeSsg.lastRequest().headers['x-api-version'], 'v1.0');
});

test('an environment variable overrides the default x-api-version', async () => {
  process.env.TEST_PLAIN_VERSION = 'v9.9';
  await callSsg(PLAIN_ENDPOINT, { pathParams: { id: '1' } });
  assert.equal(fakeSsg.lastRequest().headers['x-api-version'], 'v9.9');
});

test('a missing path parameter fails with 400 and nothing is sent to SSG', async () => {
  await assert.rejects(callSsg(PLAIN_ENDPOINT, {}), (error) => {
    assert.ok(error instanceof SsgApiError);
    assert.equal(error.status, 400);
    assert.match(error.message, /"id"/);
    return true;
  });
  assert.equal(fakeSsg.requestCount(), 0);
});

// ------------------------------------------------------------------ Plain endpoints

test('plain endpoint: body is sent as JSON and the JSON response is parsed', async () => {
  const plainPost = { ...PLAIN_ENDPOINT, method: 'POST' };
  fakeSsg.replyWith({ status: 200, body: '{"status":200,"data":{"ok":true}}' });

  const result = await callSsg(plainPost, { pathParams: { id: '1' }, body: { a: 1 } });

  assert.deepEqual(JSON.parse(fakeSsg.lastRequest().rawBody), { a: 1 });
  assert.deepEqual(result, { status: 200, data: { ok: true } });
});

test('empty response body returns null', async () => {
  fakeSsg.replyWith({ status: 200, body: '' });
  assert.equal(await callSsg(PLAIN_ENDPOINT, { pathParams: { id: '1' } }), null);
});

// ------------------------------------------------------------------ Encrypted endpoints

test('encrypted endpoint: body is sent as an encrypted JSON string', async () => {
  const body = { enrolment: { trainee: { id: 'S1234567A' } } };
  await callSsg(ENCRYPTED_ENDPOINT, { pathParams: { ref: 'R1' }, body });

  const raw = fakeSsg.lastRequest().rawBody;
  assert.ok(!raw.includes('S1234567A'), 'personal data must not be sent in plain text');
  assert.deepEqual(JSON.parse(decrypt(JSON.parse(raw))), body);
});

test('encrypted endpoint: encrypted response is decrypted and parsed', async () => {
  fakeSsg.replyEncrypted({ status: 200, data: { referenceNumber: 'ENR-1' } });
  const result = await callSsg(ENCRYPTED_ENDPOINT, { pathParams: { ref: 'R1' }, body: {} });
  assert.deepEqual(result, { status: 200, data: { referenceNumber: 'ENR-1' } });
});

test('encrypted endpoint: a plain JSON response (gateway message) is still parsed', async () => {
  fakeSsg.replyWith({ status: 200, body: '{"status":200}' });
  assert.deepEqual(await callSsg(ENCRYPTED_ENDPOINT, { pathParams: { ref: 'R1' }, body: {} }), { status: 200 });
});

test('encrypted endpoint: a response that cannot be decrypted is returned as raw text', async () => {
  fakeSsg.replyWith({ status: 200, body: 'not-encrypted-text' });
  assert.equal(await callSsg(ENCRYPTED_ENDPOINT, { pathParams: { ref: 'R1' }, body: {} }), 'not-encrypted-text');
});

// ------------------------------------------------------------------ Errors

test('an SSG error status becomes SsgApiError with the same status and SSG response', async () => {
  fakeSsg.replyWith({ status: 403, body: '{"error":"Access to this API has been disallowed"}' });

  await assert.rejects(callSsg(PLAIN_ENDPOINT, { pathParams: { id: '1' } }), (error) => {
    assert.ok(error instanceof SsgApiError);
    assert.equal(error.status, 403);
    assert.equal(error.endpointName, 'plainTest');
    assert.deepEqual(error.ssgResponse, { error: 'Access to this API has been disallowed' });
    return true;
  });
});

test('an encrypted error inside { error: "..." } is decrypted', async () => {
  const encryptedError = encrypt(JSON.stringify({ code: 400, message: 'Invalid trainee ID' }));
  fakeSsg.replyWith({ status: 400, body: JSON.stringify({ error: encryptedError }) });

  await assert.rejects(callSsg(ENCRYPTED_ENDPOINT, { pathParams: { ref: 'R1' }, body: {} }), (error) => {
    assert.deepEqual(error.ssgResponse, { error: { code: 400, message: 'Invalid trainee ID' } });
    return true;
  });
});

test('a timeout becomes a 504 error', async () => {
  fakeSsg.replyWith({ networkError: 'ECONNABORTED' });
  await assert.rejects(callSsg(PLAIN_ENDPOINT, { pathParams: { id: '1' } }), (error) => {
    assert.equal(error.status, 504);
    assert.equal(error.ssgResponse, null);
    return true;
  });
});

test('any other network failure becomes a 502 error', async () => {
  fakeSsg.replyWith({ networkError: 'ECONNREFUSED' });
  await assert.rejects(callSsg(PLAIN_ENDPOINT, { pathParams: { id: '1' } }), (error) => {
    assert.equal(error.status, 502);
    assert.match(error.message, /ECONNREFUSED/);
    return true;
  });
});
