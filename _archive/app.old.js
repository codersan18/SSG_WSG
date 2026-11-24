
// require('dotenv').config();
// const https = require('https');
// const fs = require('fs');
// const crypto = require('crypto');
// const axios = require('axios');

// const {
//     SSG_BASE_URL = 'https://api.ssg-wsg.sg',
//     SSG_CERT_PATH,
//     SSG_KEY_PATH,
//     SSG_ENCRYPTION_KEY,
//     SSG_UEN,
//     TEST_RUN_ID,
//     TEST_COURSE_REF_NO,
// } = process.env;


// const httpsAgent = new https.Agent({
//     cert: fs.readFileSync(SSG_CERT_PATH),
//     key: fs.readFileSync(SSG_KEY_PATH),
// });

// const KEY = Buffer.from(SSG_ENCRYPTION_KEY || '', 'base64');
// const IV = Buffer.from('SSGAPIInitVector'); // verify against ssg-wsg/Sample-Codes

// const encrypt = (obj) => {
//     const c = crypto.createCipheriv('aes-256-cbc', KEY, IV);
//     return c.update(JSON.stringify(obj), 'utf8', 'base64') + c.final('base64');
// };
// const decrypt = (text) => {
//     const d = crypto.createDecipheriv('aes-256-cbc', KEY, IV);
//     return JSON.parse(d.update(text.trim(), 'base64', 'utf8') + d.final('utf8'));
// };

// const client = axios.create({ baseURL: SSG_BASE_URL, httpsAgent, timeout: 30000 });

// const logError = (label, err) => {
//     console.error(`✗ ${label}:`, err.response?.status, err.response?.data || err.message);
// };

// // Test 1 — certificate works (plain JSON API)
// async function testCourseRun() {
//     try {
//         const res = await client.get(`/courses/courseRuns/id/${TEST_RUN_ID}`, {
//             headers: { 'x-api-version': 'v1.0' },
//             params: { includeExpiredCourses: true },
//         });
//         console.log('✓ Course Run by Id:', JSON.stringify(res.data, null, 2));
//     } catch (err) {
//         logError('Course Run by Id', err);
//     }
// }

// // Test 2 — certificate + encryption work (encrypted API)
// async function testSearchEnrolment() {
//     const body = {
//         meta: { lastUpdateDateFrom: '2026-01-01', lastUpdateDateTo: '2026-12-31' },
//         sortBy: { field: 'updatedOn', order: 'asc' },
//         enrolment: {
//             // course: { referenceNumber: TEST_COURSE_REF_NO },
//             trainingPartner: { uen: SSG_UEN, code: process.env.SSG_TP_CODE },
//         },
//         parameters: { page: 0, pageSize: 20 },
//     };
//     try {
//         const res = await client.post('/tpg/enrolments/search', encrypt(body), {
//             headers: { 'x-api-version': 'v4.0', 'Content-Type': 'application/json' },
//             responseType: 'text',
//         });
//         console.log('✓ Search Enrolment:', JSON.stringify(decrypt(res.data), null, 2));
//     } catch (err) {
//         let data = err.response?.data;
//         try {
//             const parsed = typeof data === 'string' ? JSON.parse(data) : data;
//             if (parsed?.error) parsed.error = decrypt(parsed.error);
//             data = parsed;
//         } catch (_) {
//             try { data = decrypt(data); } catch (_) { }
//         }
//         console.error('✗ Search Enrolment:', err.response?.status, JSON.stringify(data, null, 2));
//     }
// }

// (async () => {
//     // await testCourseRun();
//     await testSearchEnrolment();
// })();

require('dotenv').config();
const express = require('express');
// const ssgRoutes = require('./routes/ssgRoutes');
const { decrypt } = require('./controllers/ssgController');
const apiRoutes = require('./routes');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});
// Mount SSG Routes
app.use('/api/ssg', apiRoutes);

// Centralized SSG Error Handling Middleware
app.use((err, req, res, next) => {
  let errorData = err.response?.data;

  // Attempt to decode error response if SSG returns it encrypted
  if (errorData) {
    try {
      const parsed = typeof errorData === 'string' ? JSON.parse(errorData) : errorData;
      if (parsed?.error) parsed.error = decrypt(parsed.error);
      errorData = parsed;
    } catch (_) {
      try {
        errorData = decrypt(errorData);
      } catch (__) {}
    }
  }

  const statusCode = err.response?.status || 500;
  console.error(`✗ Error [${statusCode}]:`, errorData || err.message);

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    error: errorData || err.message,
  });
});

app.listen(PORT, () => {
  console.log(`✓ SSG Gateway Server running at http://localhost:${PORT}`);
});
