const attendanceService = require('../services/tpg/attendanceService');
const { handle, requireFields } = require('../middleware/http');

// GET /api/ssg/attendance/:runId?courseReferenceNumber=...&sessionId=...
exports.getAttendance = handle((req) => {
  const { courseReferenceNumber, sessionId } = req.query;
  requireFields({ courseReferenceNumber, sessionId });
  return attendanceService.getSessionAttendance(req.params.runId, courseReferenceNumber, sessionId);
});

// POST /api/ssg/attendance/:runId
exports.uploadAttendance = handle((req) => {
  requireFields({ 'course.sessionID': req.body?.course?.sessionID });
  return attendanceService.uploadSessionAttendance(req.params.runId, req.body);
});
