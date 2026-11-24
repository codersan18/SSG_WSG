/**
 * Test setup. Require this FIRST in every test file, before any gateway code.
 *
 * It sets fake environment variables, so tests never use your real .env values,
 * certificate or encryption key, and can never reach the real SSG.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

// Dummy certificate files: the gateway only checks they exist. They are never used, because the fake SSG replaces the network.
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssg-gateway-test-'));
fs.writeFileSync(path.join(tempDir, 'cert.pem'), 'dummy certificate');
fs.writeFileSync(path.join(tempDir, 'key.pem'), 'dummy key');

const TEST_ENV = {
  SSG_BASE_URL: 'https://ssg.test.invalid', // ".invalid" can never resolve, so a missed fake can't reach a real server
  SSG_CERT_PATH: path.join(tempDir, 'cert.pem'),
  SSG_KEY_PATH: path.join(tempDir, 'key.pem'),
  SSG_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString('base64'), // 32 bytes of 0x01
  SSG_UEN: 'TESTUEN01',
  SSG_TP_CODE: 'TESTUEN01-01',
  GATEWAY_API_KEY: 'test-api-key',
};

// API-version variables are set to empty, so the catalogue defaults apply and .env cannot change them.
const VERSION_VARS = [
  'SSG_COURSE_DETAILS_VERSION', 'SSG_ADD_COURSE_RUN_VERSION', 'SSG_EDIT_COURSE_RUN_VERSION', 'SSG_GET_COURSE_RUN_VERSION',
  'SSG_COURSE_SESSIONS_VERSION', 'SSG_ATTENDANCE_VERSION', 'SSG_TRAINER_VERSION', 'SSG_ENROLMENT_VERSION',
  'SSG_ASSESSMENT_VERSION', 'SSG_GRANTS_VERSION', 'SSG_GRANT_CALCULATOR_VERSION', 'SSG_SFC_VERSION',
];

// dotenv never overwrites a variable that is already set, so these win over .env.
Object.assign(process.env, TEST_ENV);
for (const name of VERSION_VARS) process.env[name] = '';

// Keep test output clean: hide the per-call "[SSG] ..." log lines and the "not production" warning.
console.log = () => {};
console.warn = () => {};

module.exports = { TEST_ENV };
