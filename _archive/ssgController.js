const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const axios = require('axios');

const {
  SSG_BASE_URL = 'https://api.ssg-wsg.sg',
  SSG_CERT_PATH,
  SSG_KEY_PATH,
  SSG_ENCRYPTION_KEY,
  SSG_UEN,
  SSG_TP_CODE,
} = process.env;

// mTLS Client Setup
const httpsAgent = new https.Agent({
  cert: fs.readFileSync(SSG_CERT_PATH),
  key: fs.readFileSync(SSG_KEY_PATH),
});

// AES-256-CBC Setup
const KEY = Buffer.from(SSG_ENCRYPTION_KEY || '', 'base64');
const IV = Buffer.from('SSGAPIInitVector');

const encrypt = (obj) => {
  const c = crypto.createCipheriv('aes-256-cbc', KEY, IV);
  return c.update(JSON.stringify(obj), 'utf8', 'base64') + c.final('base64');
};

const decrypt = (text) => {
  if (!text || typeof text !== 'string') return text;
  const d = crypto.createDecipheriv('aes-256-cbc', KEY, IV);
  return JSON.parse(d.update(text.trim(), 'base64', 'utf8') + d.final('utf8'));
};

const client = axios.create({
  baseURL: SSG_BASE_URL,
  httpsAgent,
  timeout: 30000
});

// Helper for encrypted endpoints
async function postEncrypted(url, data, apiVersion = 'v4.0') {
  const cipherText = encrypt(data);
  const res = await client.post(url, cipherText, {
    headers: {
      'x-api-version': apiVersion,
      'Content-Type': 'application/json'
    },
    responseType: 'text'
  });
  return decrypt(res.data);
}

// Controller Handlers
const ssgController = {
  // 1. Create Course
  async createCourse(req, res, next) {
    try {
      const response = await client.post('/courses/publish', req.body, {
        headers: {
          'x-api-version': 'v1.0',
          'Content-Type': 'application/json'
        }
      });
      return res.status(200).json(response.data);
    } catch (err) {
      next(err);
    }
  },
// GET /api/ssg/courses
async getCourseList(req, res, next) {
  try {
    const params = {
      uen: SSG_UEN,
      pageSize: req.query.pageSize || 20,
      page: req.query.page || 0,
      includeExpiredCourses: req.query.includeExpiredCourses || true,
      ...req.query
    };

    const response = await client.get('/courses/directory', {
      headers: {
        'x-api-version': 'v1.0',
        'Accept': 'application/json'
      },
      params
    });

    return res.status(200).json(response.data);
  } catch (err) {
    next(err);
  }
},
  // 2. Add Course Run
  // async addCourseRun(req, res, next) {
  //   try {
  //     const response = await client.post('/courses/courseRuns/publish', req.body, {
  //       headers: { 'x-api-version': 'v1.4', 'Content-Type': 'application/json' }
  //     });
  //     return res.status(200).json(response.data);
  //   } catch (err) {
  //     next(err);
  //   }
  // },
// POST /api/ssg/courses/runs
  async addCourseRun(req, res, next) {
    try {

      console.log(req.body,"req.body");
      
      const courseRefNo = req.body?.course?.courseReferenceNumber;
      console.log(courseRefNo,"course");
      
      if (!courseRefNo) {
        return res.status(400).json({
          error: "Missing required field: course.courseReferenceNumber in payload"
        });
      }

      // SSG Endpoint for publishing runs:
      // POST https://api.ssg-wsg.sg/courses/courseRuns/{courseReferenceNumber}

      console.log(client,"client");
      
      const response = await client.post(`/courses/courseRuns`, req.body, {
        headers: {
          'x-api-version': 'v1.0',
          'Content-Type': 'application/json'
        }
      });

      return res.status(200).json(response.data);
    } catch (err) {
      next(err);
    }
  },
  // 3. Edit Course Run
  async editCourseRun(req, res, next) {
    try {
      const { courseRunId } = req.params;
      const response = await client.post(`/courses/courseRuns/edit/${courseRunId}`, req.body, {
        headers: { 'x-api-version': 'v1.0', 'Content-Type': 'application/json' }
      });
      return res.status(200).json(response.data);
    } catch (err) {
      next(err);
    }
  },

  // 4. Get Course Run
  async getCourseRun(req, res, next) {
    try {
      const { courseRunId } = req.params;
      const response = await client.get(`/courses/courseRuns/id/${courseRunId}`, {
        headers: { 'x-api-version': 'v1.0' },
        params: { includeExpiredCourses: true }
      });
      return res.status(200).json(response.data);
    } catch (err) {
      next(err);
    }
  },

  // 5. Get Sessions
  async getSessions(req, res, next) {
    try {
      const { courseRunId } = req.params;
      const response = await client.get(`/courses/courseRuns/id/${courseRunId}/sessions`, {
        headers: { 'x-api-version': 'v1.0' }
      });
      return res.status(200).json(response.data);
    } catch (err) {
      next(err);
    }
  },

  // 6. Create Enrolment (Encrypted)
  async createEnrolment(req, res, next) {
    try {
      const decryptedRes = await postEncrypted('/tpg/enrolments', req.body, 'v4.0');
      return res.status(200).json(decryptedRes);
    } catch (err) {
      next(err);
    }
  },

  // 7. Update Enrolment (Encrypted)
  async updateEnrolment(req, res, next) {
    try {
      const { enrolmentRefNo } = req.params;
      const decryptedRes = await postEncrypted(`/tpg/enrolments/${enrolmentRefNo}`, req.body, 'v4.0');
      return res.status(200).json(decryptedRes);
    } catch (err) {
      next(err);
    }
  },

  // 8. Cancel Enrolment (Encrypted)
  async cancelEnrolment(req, res, next) {
    try {
      const { enrolmentRefNo } = req.params;
      const decryptedRes = await postEncrypted(`/tpg/enrolments/${enrolmentRefNo}`, req.body, 'v4.0');
      return res.status(200).json(decryptedRes);
    } catch (err) {
      next(err);
    }
  },

  // 9. Search Enrolments (Encrypted)
  async searchEnrolments(req, res, next) {
    try {
      const payload = req.body && Object.keys(req.body).length > 0 ? req.body : {
        meta: { lastUpdateDateFrom: '2026-01-01', lastUpdateDateTo: '2026-12-31' },
        sortBy: { field: 'updatedOn', order: 'asc' },
        enrolment: {
          trainingPartner: { uen: SSG_UEN, code: SSG_TP_CODE }
        },
        parameters: { page: 0, pageSize: 20 }
      };

      const decryptedRes = await postEncrypted('/tpg/enrolments/search', payload, 'v4.0');
      return res.status(200).json(decryptedRes);
    } catch (err) {
      next(err);
    }
  },

  // 10. Upload Attendance (Encrypted)
  async uploadAttendance(req, res, next) {
    try {
      const decryptedRes = await postEncrypted('/tpg/attendance/submissions', req.body, 'v4.0');
      return res.status(200).json(decryptedRes);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { ssgController, decrypt };