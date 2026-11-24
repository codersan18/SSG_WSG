/**
 * A fake SSG server for unit tests.
 *
 * It replaces the gateway's HTTP layer, so no request leaves the machine. It:
 *   - records every request the gateway sends (method, url, query, headers, body)
 *   - answers with whatever the test tells it to
 *
 * Usage:
 *   const fakeSsg = require('./helpers/fakeSsg');
 *   fakeSsg.replyWith({ status: 200, body: '{"status":200}' });
 *   ... call gateway code ...
 *   fakeSsg.lastRequest()  // what the gateway sent
 */
const { AxiosError } = require('axios');
const { httpClient } = require('../../services/ssgClient');
const { encrypt, decrypt } = require('../../services/ssgCrypto');

const DEFAULT_REPLY = { status: 200, body: JSON.stringify({ status: 200, data: {} }) };

let requests = [];
let nextReply = DEFAULT_REPLY;

httpClient.defaults.adapter = async (config) => {
  const headers = {};
  for (const [key, value] of Object.entries(config.headers.toJSON ? config.headers.toJSON() : config.headers)) {
    headers[key.toLowerCase()] = value;
  }

  requests.push({
    method: config.method.toUpperCase(),
    url: config.url,
    query: config.params || {},
    headers,
    rawBody: config.data,
  });

  const reply = typeof nextReply === 'function' ? nextReply() : nextReply;

  // Simulates a request that never got an answer (timeout, DNS, TLS ...)
  if (reply.networkError) {
    throw new AxiosError(`simulated ${reply.networkError}`, reply.networkError, config);
  }

  const response = { data: reply.body, status: reply.status, statusText: '', headers: {}, config, request: {} };
  if (reply.status >= 400) {
    throw new AxiosError(`Request failed with status code ${reply.status}`, AxiosError.ERR_BAD_RESPONSE, config, {}, response);
  }
  return response;
};

module.exports = {
  /** Sets the next answer: { status, body } or { networkError: 'ECONNABORTED' }. Stays until changed. */
  replyWith(reply) {
    nextReply = reply;
  },

  /** Answers 200 with this object, encrypted the way SSG encrypts responses. */
  replyEncrypted(object) {
    nextReply = { status: 200, body: encrypt(JSON.stringify(object)) };
  },

  /** The last request the gateway sent to the fake SSG. */
  lastRequest() {
    return requests[requests.length - 1];
  },

  /** How many requests reached the fake SSG. */
  requestCount() {
    return requests.length;
  },

  /** Body of the last request as an object. Decrypts it when `encrypted` is true. */
  lastBody({ encrypted = false } = {}) {
    const raw = this.lastRequest().rawBody;
    if (raw === undefined) return undefined;
    return encrypted ? JSON.parse(decrypt(JSON.parse(raw))) : JSON.parse(raw);
  },

  /** Clears recorded requests and restores the default 200 answer. Call in beforeEach. */
  reset() {
    requests = [];
    nextReply = DEFAULT_REPLY;
  },
};
