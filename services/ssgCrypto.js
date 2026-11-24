/**
 * SSG payload encryption.
 *
 * Matches SSG's official sample (Sample-Codes/Encryption and Decryption):
 *   - Algorithm : AES-256-CBC with PKCS7 padding
 *   - Key       : SSG_ENCRYPTION_KEY, Base64-decoded (32 bytes)
 *   - IV        : the fixed text "SSGAPIInitVector"
 *   - Output    : Base64 ciphertext, with no IV prefix
 */
const crypto = require('crypto');
const config = require('../config/env');

const ALGORITHM = 'aes-256-cbc';
const IV = Buffer.from('SSGAPIInitVector', 'utf8');

/** Encrypts a plain-text string and returns Base64. */
function encrypt(plainText) {
  const cipher = crypto.createCipheriv(ALGORITHM, config.ssg.encryptionKey, IV);
  return Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]).toString('base64');
}

/** Decrypts a Base64 string from SSG. Surrounding quotes and whitespace are ignored. */
function decrypt(base64Text) {
  const cleaned = String(base64Text).trim().replace(/^"|"$/g, '');
  const decipher = crypto.createDecipheriv(ALGORITHM, config.ssg.encryptionKey, IV);
  return Buffer.concat([decipher.update(Buffer.from(cleaned, 'base64')), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
