/**
 * Tests the startup checks in config/env.js.
 * Each case loads the config in a fresh Node process, because the config is read once at startup.
 * The process runs from an empty folder, so your real .env is never loaded.
 */
const { TEST_ENV } = require('./helpers/setup');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ENV_MODULE = path.resolve(__dirname, '../config/env.js');
const emptyFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'ssg-env-test-'));

/** Loads config/env.js with these variables and returns { ok, output }. */
function loadConfig(overrides) {
  const env = { PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT, ...TEST_ENV, ...overrides };
  for (const [key, value] of Object.entries(env)) if (value === undefined) delete env[key];

  const result = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(ENV_MODULE)})`], {
    cwd: emptyFolder,
    env,
    encoding: 'utf8',
  });
  return { ok: result.status === 0, output: result.stdout + result.stderr };
}

test('loads when every required variable is valid', () => {
  const { ok, output } = loadConfig({});
  assert.ok(ok, output);
});

test('stops with a clear message when required variables are missing', () => {
  const { ok, output } = loadConfig({ SSG_UEN: undefined, SSG_TP_CODE: undefined });
  assert.equal(ok, false);
  assert.match(output, /Missing required environment variables: SSG_UEN, SSG_TP_CODE/);
});

test('stops when the certificate file does not exist', () => {
  const { ok, output } = loadConfig({ SSG_CERT_PATH: path.join(emptyFolder, 'missing.pem') });
  assert.equal(ok, false);
  assert.match(output, /SSG certificate not found/);
});

test('stops when the private key file does not exist', () => {
  const { ok, output } = loadConfig({ SSG_KEY_PATH: path.join(emptyFolder, 'missing.pem') });
  assert.equal(ok, false);
  assert.match(output, /SSG private key not found/);
});

test('stops when the encryption key is not 32 bytes', () => {
  const { ok, output } = loadConfig({ SSG_ENCRYPTION_KEY: Buffer.alloc(16).toString('base64') });
  assert.equal(ok, false);
  assert.match(output, /must be Base64 and decode to exactly 32 bytes/);
});

test('warns when SSG_BASE_URL is not production', () => {
  const { ok, output } = loadConfig({ SSG_BASE_URL: 'https://mock-api.ssg-wsg.sg' });
  assert.ok(ok);
  assert.match(output, /not production/);
});

test('no warning when SSG_BASE_URL is production', () => {
  const { ok, output } = loadConfig({ SSG_BASE_URL: 'https://api.ssg-wsg.sg/' });
  assert.ok(ok);
  assert.doesNotMatch(output, /not production/);
});
