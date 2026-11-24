// ssgClient.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

// Initialize mTLS HTTPS Agent using the certs defined in your .env
const certPath = path.resolve(process.env.SSG_CERT_PATH);
const keyPath = path.resolve(process.env.SSG_KEY_PATH);

const httpsAgent = new https.Agent({
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath),
  rejectUnauthorized: true
});

const apiClient = axios.create({
  baseURL: process.env.SSG_BASE_URL,
  httpsAgent,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Payload Encryption Utility (AES-256-CBC) used for SSG Encrypted Payload endpoints
 */
function encryptPayload(data) {
  const secretKey = Buffer.from(process.env.SSG_ENCRYPTION_KEY, 'base64');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // SSG format requires IV prepended or packaged as required by your onboarding spec
  return iv.toString('base64') + ':' + encrypted;
}

module.exports = { apiClient, encryptPayload };