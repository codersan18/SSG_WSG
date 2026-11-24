/**
 * Reads and checks every environment variable the TPG integration needs.
 *
 * The app stops at startup with a clear message if something is missing,
 * so a bad deployment fails immediately instead of on the first SSG call.
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const REQUIRED = ['SSG_BASE_URL', 'SSG_CERT_PATH', 'SSG_KEY_PATH', 'SSG_ENCRYPTION_KEY', 'SSG_UEN', 'SSG_TP_CODE'];

const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const certPath = path.resolve(process.env.SSG_CERT_PATH);
const keyPath = path.resolve(process.env.SSG_KEY_PATH);

if (!fs.existsSync(certPath)) throw new Error(`SSG certificate not found at ${certPath}`);
if (!fs.existsSync(keyPath)) throw new Error(`SSG private key not found at ${keyPath}`);

const encryptionKey = Buffer.from(process.env.SSG_ENCRYPTION_KEY, 'base64');
if (encryptionKey.length !== 32) {
  throw new Error('SSG_ENCRYPTION_KEY must be Base64 and decode to exactly 32 bytes (AES-256)');
}

const config = {
  port: Number(process.env.PORT) || 3000,

  ssg: {
    baseUrl: process.env.SSG_BASE_URL.replace(/\/+$/, ''),
    certPath,
    keyPath,
    keyPassphrase: process.env.SSG_PASSPHRASE || undefined,
    encryptionKey,
    timeoutMs: Number(process.env.SSG_TIMEOUT_MS) || 30000,
  },

  // Your organisation, sent to SSG on calls that need it.
  trainingPartner: {
    uen: process.env.SSG_UEN,
    code: process.env.SSG_TP_CODE,
  },

  // Optional: if set, callers of this gateway must send it in the "x-api-key" header.
  gatewayApiKey: process.env.GATEWAY_API_KEY || null,
};

const PRODUCTION_URL = 'https://api.ssg-wsg.sg';
config.ssg.isProduction = config.ssg.baseUrl === PRODUCTION_URL;

if (!config.ssg.isProduction) {
  console.warn(`⚠ SSG_BASE_URL is "${config.ssg.baseUrl}", not production (${PRODUCTION_URL}).`);
}

module.exports = config;
