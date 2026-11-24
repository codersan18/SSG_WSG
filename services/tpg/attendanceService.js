/**
 * Course session attendance.
 */
const { callSsg } = require('../ssgClient');
const TPG = require('../../config/tpgEndpoints');
const { trainingPartner } = require('../../config/env');

/** Attendance already recorded for one session. */
function getSessionAttendance(runId, courseReferenceNumber, sessionId) {
  return callSsg(TPG.getSessionAttendance, {
    pathParams: { runId },
    query: { uen: trainingPartner.uen, courseReferenceNumber, sessionId },
  });
}

/**
 * Uploads one trainee's attendance for a session.
 * `body` is SSG's payload: { course: { sessionID, referenceNumber, attendance: {...} }, corppassId }.
 * Your UEN is filled in automatically.
 */
function uploadSessionAttendance(runId, body) {
  return callSsg(TPG.uploadSessionAttendance, {
    pathParams: { runId },
    body: { ...body, uen: trainingPartner.uen },
  });
}

module.exports = { getSessionAttendance, uploadSessionAttendance };
