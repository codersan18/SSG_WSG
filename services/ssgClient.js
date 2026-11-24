/**
 * SSG CLIENT
 * ==========
 * The only file that talks to SSG over the network. It:
 *   1. Signs every request with your SSG certificate (mutual TLS).
 *   2. Sets the "x-api-version" header from the endpoint catalogue.
 *   3. Encrypts request bodies and decrypts responses for encrypted endpoints.
 *   4. Turns every failure into one readable SsgApiError.
 *
 * Usage:
 *   const { callSsg } = require('./ssgClient');
 *   const data = await callSsg(TPG_ENDPOINTS.getCourseRunById, { pathParams: { runId: '12345' } });
 */
const fs = require('fs');
const https = require('https');
const axios = require('axios');

const config = require('../config/env');
const { encrypt, decrypt } = require('./ssgCrypto');

const httpClient = axios.create({
  baseURL: config.ssg.baseUrl,
  timeout: config.ssg.timeoutMs,
  httpsAgent: new https.Agent({
    cert: fs.readFileSync(config.ssg.certPath),
    key: fs.readFileSync(config.ssg.keyPath),
    passphrase: config.ssg.keyPassphrase,
    rejectUnauthorized: true,
    keepAlive: true,
  }),
  // Responses come back as raw text. We decide below whether to decrypt or parse them.
  responseType: 'text',
  transformResponse: [(data) => data],
  // A non-2xx status still throws; we turn it into a readable error.
});

/** The error thrown for any failed SSG call. */
class SsgApiError extends Error {
  constructor({ endpointName, status, ssgResponse, message }) {
    super(message);
    this.name = 'SsgApiError';
    this.endpointName = endpointName;
    this.status = status; // the HTTP status from SSG, or 502/504 when SSG could not be reached
    this.ssgResponse = ssgResponse; // SSG's error body, already decrypted when possible
  }
}

/** Fills ":name" parts in a path, e.g. "/runs/:runId" + { runId: 5 } becomes "/runs/5". */
function buildPath(pathTemplate, pathParams = {}) {
  return pathTemplate.replace(/:(\w+)/g, (_, name) => {
    const value = pathParams[name];
    if (value === undefined || value === null || value === '') {
      throw new SsgApiError({ status: 400, message: `Missing required path parameter "${name}"` });
    }
    return encodeURIComponent(value);
  });
}

/** Reads the x-api-version: the .env value wins, otherwise the catalogue default. */
function resolveVersion([envName, defaultVersion]) {
  return process.env[envName] || defaultVersion;
}

/** Turns SSG's raw response text into an object, decrypting first if needed. */
function readSsgBody(rawText, isEncrypted) {
  if (rawText === undefined || rawText === null || rawText === '') return null;

  const parseJson = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  // Plain JSON first. Gateway errors are plain JSON even on encrypted endpoints.
  const parsed = parseJson(rawText);
  if (typeof parsed === 'object' && parsed !== null) {
    // Some encrypted endpoints wrap an encrypted error, e.g. { error: "<base64>" }.
    if (isEncrypted && typeof parsed.error === 'string') {
      try {
        parsed.error = parseJson(decrypt(parsed.error));
      } catch {
        /* the error text was not encrypted, so keep it as it is */
      }
    }
    return parsed;
  }

  // Not JSON: on an encrypted endpoint, this is the encrypted payload.
  if (isEncrypted) {
    try {
      return parseJson(decrypt(rawText));
    } catch {
      return rawText; // could not decrypt, so return the raw text for troubleshooting
    }
  }
  return parsed;
}

/**
 * Calls one TPG endpoint.
 *
 * @param {object} endpoint     an entry from config/tpgEndpoints.js
 * @param {object} [options]
 * @param {object} [options.pathParams]  values for ":name" parts of the path
 * @param {object} [options.query]       query-string parameters
 * @param {object} [options.body]        request body (plain JS object; encrypted here if needed)
 * @returns {Promise<any>} SSG's response body, decrypted and parsed
 */
async function callSsg(endpoint, { pathParams, query, body } = {}) {
  const url = buildPath(endpoint.path, pathParams);
  const headers = {
    'x-api-version': resolveVersion(endpoint.version),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  let data;
  if (body !== undefined) {
    const json = JSON.stringify(body);
    // Encrypted endpoints receive the Base64 ciphertext as a JSON string.
    data = endpoint.encrypted ? JSON.stringify(encrypt(json)) : json;
  }

  const startedAt = Date.now();
  try {
    const response = await httpClient.request({
      method: endpoint.method,
      url,
      params: query,
      data,
      headers,
      transformRequest: [(d) => d], // already serialised above
    });

    logCall(endpoint, response.status, startedAt);
    return readSsgBody(response.data, endpoint.encrypted);
  } catch (error) {
    if (error instanceof SsgApiError) throw error;

    // SSG replied with an error status
    if (error.response) {
      logCall(endpoint, error.response.status, startedAt);
      throw new SsgApiError({
        endpointName: endpoint.name,
        status: error.response.status,
        ssgResponse: readSsgBody(error.response.data, endpoint.encrypted),
        message: `SSG ${endpoint.name} failed with HTTP ${error.response.status}`,
      });
    }

    // No reply: timeout, DNS, TLS or certificate problem
    const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    logCall(endpoint, error.code || 'NETWORK_ERROR', startedAt);
    throw new SsgApiError({
      endpointName: endpoint.name,
      status: timedOut ? 504 : 502,
      ssgResponse: null,
      message: `Could not reach SSG for ${endpoint.name}: ${error.code || error.message}`,
    });
  }
}

/** Logs one line per SSG call. Bodies are never logged: they hold trainee personal data (NRIC etc.). */
function logCall(endpoint, status, startedAt) {
  console.log(`[SSG] ${endpoint.method} ${endpoint.name} -> ${status} (${Date.now() - startedAt} ms)`);
}

// httpClient is exported only so unit tests can replace the network layer with a fake SSG.
module.exports = { callSsg, SsgApiError, httpClient };
