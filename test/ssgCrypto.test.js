require('./helpers/setup');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { encrypt, decrypt } = require('../services/ssgCrypto');

// Reference value made with OpenSSL (not with our code), using the same key and SSG's fixed IV:
//   printf '{"hello":"world"}' | openssl enc -aes-256-cbc -K 0101...01 -iv 535347415049496e6974566563746f72 -base64 -A
const PLAIN = '{"hello":"world"}';
const OPENSSL_CIPHERTEXT = 'ZbymAgLN82Hg/tsx1fL3SD7VWwfGd2flbzPRMhqI9H4=';

test('encrypt matches OpenSSL AES-256-CBC with the SSG IV', () => {
  assert.equal(encrypt(PLAIN), OPENSSL_CIPHERTEXT);
});

test('decrypt reverses OpenSSL ciphertext', () => {
  assert.equal(decrypt(OPENSSL_CIPHERTEXT), PLAIN);
});

test('encrypt then decrypt returns the original text, including non-ASCII', () => {
  const text = JSON.stringify({ name: 'Tan Ah Kow 陈', amount: 1000.5 });
  assert.equal(decrypt(encrypt(text)), text);
});

test('decrypt ignores surrounding quotes and whitespace (SSG sometimes sends a JSON string)', () => {
  assert.equal(decrypt(`  "${OPENSSL_CIPHERTEXT}"\n`), PLAIN);
});

test('decrypt throws on text that was not encrypted with this key', () => {
  assert.throws(() => decrypt('bm90IGVuY3J5cHRlZA=='));
});
