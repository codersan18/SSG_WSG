require('dotenv').config();
process.env.SSG_BASE_URL = 'https://api.ssg-wsg.sg';

const ssgClient = require('./services/ssgClient');

ssgClient
  .post(
    '/tpg/enrolments/search',
    {
      meta: { lastUpdateDateFrom: '2026-01-01', lastUpdateDateTo: '2026-12-31' },
      sortBy: { field: 'updatedOn', order: 'asc' },
      enrolment: {
        trainingPartner: {
          uen: process.env.SSG_UEN,
          code: process.env.SSG_TP_CODE,
        },
      },
      parameters: { page: 0, pageSize: 1 },
    },
    { headers: { 'x-api-version': 'v4.0' } }
  )
  .then((res) => console.log('Status:', res.status, '- request was decrypted'))
  .catch(() => console.log('Failed - see the SSG lines above'));