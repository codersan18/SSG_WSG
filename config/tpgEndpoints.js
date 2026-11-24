/**
 * TPG ENDPOINT CATALOGUE
 * ======================
 * Every SSG Training Partners Gateway API this app calls is listed here, in one place.
 *
 *   method     HTTP method SSG expects
 *   path       Path on SSG_BASE_URL. ":name" parts are filled in at call time.
 *   version    Value of the "x-api-version" header.
 *              [ENV_VAR_NAME, default]: the .env value wins when set.
 *   encrypted  true  = request body is AES-encrypted and the response comes back encrypted.
 *              false = plain JSON both ways.
 *
 * IMPORTANT: version numbers and the encryption flags must match the API versions your
 * application subscribes to on the SSG Developer Portal. Defaults marked "VERIFY" could
 * not be confirmed from SSG's public sample code. Confirm them on the portal before go-live.
 */

const TPG_ENDPOINTS = {
  // ---------------------------------------------------------------- Courses
  searchCourses: {
    method: 'GET',
    path: '/courses/directory',
    version: ['SSG_COURSE_SEARCH_VERSION', 'v3.0'], // portal: "Retrieve Courses", Active (v2.2, v3.0). Checked on production 2026-11-24
    encrypted: false,
  },
  getCourseDetails: {
    method: 'GET',
    path: '/courses/directory/:courseReferenceNumber',
    version: ['SSG_COURSE_DETAILS_VERSION', 'v2.0'], // portal: Active (v2.0, v1.2)
    encrypted: false,
  },

  // ---------------------------------------------------------------- Course runs
  publishCourseRun: {
    method: 'POST',
    path: '/courses/courseRuns/publish',
    version: ['SSG_ADD_COURSE_RUN_VERSION', 'v2.0'], // portal: Active (v2.0, v1.2)
    encrypted: true, // confirmed by SSG sample code
  },
  editOrDeleteCourseRun: {
    method: 'POST',
    path: '/courses/courseRuns/edit/:runId',
    version: ['SSG_EDIT_COURSE_RUN_VERSION', 'v1.2'], // portal: Active (v1.2)
    encrypted: true, // confirmed by SSG sample code
  },
  getCourseRunById: {
    method: 'GET',
    path: '/courses/courseRuns/id/:runId',
    version: ['SSG_GET_COURSE_RUN_VERSION', 'v2.0'], // portal: Active (v1.0, v2.0)
    encrypted: false, // confirmed by SSG sample code
  },
  getCourseRunsByCourse: {
    method: 'GET',
    path: '/courses/courseRuns/reference',
    version: ['SSG_GET_COURSE_RUN_VERSION', 'v2.0'], // NOT SUBSCRIBED on portal: returns 403 until added
    encrypted: false,
  },

  // ---------------------------------------------------------------- Sessions & attendance
  getCourseSessions: {
    method: 'GET',
    path: '/courses/runs/:runId/sessions',
    version: ['SSG_COURSE_SESSIONS_VERSION', 'v1.5'], // portal: Active
    encrypted: false, // confirmed by SSG sample code
  },
  getSessionAttendance: {
    method: 'GET',
    path: '/courses/runs/:runId/sessions/attendance',
    version: ['SSG_ATTENDANCE_VERSION', 'v1.5'], // portal: Active
    encrypted: true, // the response is encrypted (SSG sample code)
  },
  uploadSessionAttendance: {
    method: 'POST',
    path: '/courses/runs/:runId/sessions/attendance',
    version: ['SSG_ATTENDANCE_VERSION', 'v1.5'], // portal: Active
    encrypted: true, // confirmed by SSG sample code
  },

  // ---------------------------------------------------------------- Trainers
  getTrainers: {
    method: 'GET',
    path: '/trainingProviders/:uen/trainers',
    version: ['SSG_TRAINER_VERSION', 'v3.0'], // NOT SUBSCRIBED on portal: returns 403 until added
    encrypted: false, // VERIFY
  },
  updateOrDeleteTrainer: {
    method: 'POST',
    path: '/trainingProviders/:uen/trainers/:trainerId',
    version: ['SSG_TRAINER_VERSION', 'v3.0'], // NOT SUBSCRIBED on portal: returns 403 until added
    encrypted: false, // VERIFY
  },

  // ---------------------------------------------------------------- Enrolments
  createEnrolment: {
    method: 'POST',
    path: '/tpg/enrolments',
    version: ['SSG_ENROLMENT_VERSION', 'v4.0'], // portal: Active
    encrypted: true, // confirmed by SSG sample code
  },
  updateOrCancelEnrolment: {
    method: 'POST',
    path: '/tpg/enrolments/details/:enrolmentReferenceNumber',
    version: ['SSG_ENROLMENT_VERSION', 'v4.0'], // portal: Active
    encrypted: true,
  },
  searchEnrolments: {
    method: 'POST',
    path: '/tpg/enrolments/search',
    version: ['SSG_ENROLMENT_VERSION', 'v4.0'], // portal: Active
    encrypted: true,
  },
  viewEnrolment: {
    method: 'GET',
    path: '/tpg/enrolments/details/:enrolmentReferenceNumber',
    version: ['SSG_ENROLMENT_VERSION', 'v4.0'], // portal: Active
    encrypted: true, // the response is encrypted
  },
  updateEnrolmentFeeCollection: {
    method: 'POST',
    path: '/tpg/enrolments/feeCollections/:enrolmentReferenceNumber',
    version: ['SSG_ENROLMENT_VERSION', 'v4.0'], // portal: Active
    encrypted: true,
  },

  // ---------------------------------------------------------------- Assessments
  createAssessment: {
    method: 'POST',
    path: '/tpg/assessments',
    version: ['SSG_ASSESSMENT_VERSION', 'v1'], // portal: Active. Must be "v1", not "v1.0"
    encrypted: true, // confirmed by SSG sample code
  },
  updateOrVoidAssessment: {
    method: 'POST',
    path: '/tpg/assessments/details/:assessmentReferenceNumber',
    version: ['SSG_ASSESSMENT_VERSION', 'v1'], // portal: Active. Must be "v1", not "v1.0"
    encrypted: true,
  },
  searchAssessments: {
    method: 'POST',
    path: '/tpg/assessments/search',
    version: ['SSG_ASSESSMENT_VERSION', 'v1'], // portal: Active. Must be "v1", not "v1.0"
    encrypted: true,
  },
  viewAssessment: {
    method: 'GET',
    path: '/tpg/assessments/details/:assessmentReferenceNumber',
    version: ['SSG_ASSESSMENT_VERSION', 'v1'], // portal: Active. Must be "v1", not "v1.0"
    encrypted: true, // the response is encrypted
  },

  // ---------------------------------------------------------------- Grants
  searchGrants: {
    method: 'POST',
    path: '/tpg/grants/search',
    version: ['SSG_GRANTS_VERSION', 'v2.0'], // NOT SUBSCRIBED on portal: returns 403 until added
    encrypted: true, // VERIFY
  },
  viewGrant: {
    method: 'GET',
    path: '/tpg/grants/details/:grantReferenceNumber',
    version: ['SSG_GRANTS_VERSION', 'v2.0'], // NOT SUBSCRIBED on portal: returns 403 until added
    encrypted: true, // VERIFY
  },

  // ---------------------------------------------------------------- Grant calculator
  // Path and version confirmed on production (2026-11-24). SSG currently answers
  // "Access to this API has been disallowed" although the portal shows it Active. Raise a ticket with SSG.
  calculateBaselineGrant: {
    method: 'POST', // VERIFY: SSG blocks access before checking the method
    path: '/grantCalculators/individual',
    version: ['SSG_GRANT_CALCULATOR_VERSION', 'v3.0'], // portal: "Grant Calculator - Individual", Active
    encrypted: false, // VERIFY
  },
  calculatePersonalisedGrant: {
    method: 'POST', // VERIFY
    path: '/grantCalculators/individual/personalised',
    version: ['SSG_GRANT_CALCULATOR_VERSION', 'v3.0'], // portal: "Grant Calculator - Personalised", Pending
    encrypted: false, // VERIFY
  },

  // ---------------------------------------------------------------- SkillsFuture Credit claims
  encryptSfcClaimRequest: {
    method: 'POST',
    path: '/skillsFutureCredits/claims/encryptRequests',
    version: ['SSG_SFC_VERSION', 'v2'], // portal: only View Claim Details (v2) listed, Pending. Others NOT SUBSCRIBED
    encrypted: false, // VERIFY
  },
  decryptSfcClaimResponse: {
    method: 'POST',
    path: '/skillsFutureCredits/claims/decryptRequests',
    version: ['SSG_SFC_VERSION', 'v2'], // portal: only View Claim Details (v2) listed, Pending. Others NOT SUBSCRIBED
    encrypted: false, // VERIFY
  },
  viewSfcClaim: {
    method: 'GET',
    path: '/skillsFutureCredits/claims/:claimId',
    version: ['SSG_SFC_VERSION', 'v2'], // portal: only View Claim Details (v2) listed, Pending. Others NOT SUBSCRIBED
    encrypted: false, // VERIFY
  },
  cancelSfcClaim: {
    method: 'POST',
    path: '/skillsFutureCredits/claims/:claimId',
    version: ['SSG_SFC_VERSION', 'v2'], // portal: only View Claim Details (v2) listed, Pending. Others NOT SUBSCRIBED
    encrypted: false, // VERIFY
  },
  uploadSfcSupportingDocuments: {
    method: 'POST',
    path: '/skillsFutureCredits/claims/:claimId/supportingdocuments',
    version: ['SSG_SFC_VERSION', 'v2'], // portal: only View Claim Details (v2) listed, Pending. Others NOT SUBSCRIBED
    encrypted: false, // VERIFY
  },
};

// Attach each endpoint's name so error messages can say which API failed.
for (const [name, endpoint] of Object.entries(TPG_ENDPOINTS)) {
  endpoint.name = name;
}

module.exports = TPG_ENDPOINTS;
