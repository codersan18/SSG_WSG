const courseService = require('../services/tpg/courseService');
const { handle, requireFields } = require('../middleware/http');

// POST /api/ssg/course-runs
exports.publishCourseRun = handle((req) => {
  requireFields({ 'course.courseReferenceNumber': req.body?.course?.courseReferenceNumber });
  return courseService.publishCourseRun(req.body);
});

// PUT /api/ssg/course-runs/:runId
exports.updateCourseRun = handle((req) => {
  requireFields({ 'course.courseReferenceNumber': req.body?.course?.courseReferenceNumber });
  return courseService.updateCourseRun(req.params.runId, req.body);
});

// DELETE /api/ssg/course-runs/:runId?courseReferenceNumber=...
exports.deleteCourseRun = handle((req) => {
  const { courseReferenceNumber } = req.query;
  requireFields({ courseReferenceNumber });
  return courseService.deleteCourseRun(req.params.runId, courseReferenceNumber);
});

// GET /api/ssg/course-runs/:runId
exports.getCourseRun = handle((req) => {
  const includeExpired = req.query.includeExpiredCourses !== 'false';
  return courseService.getCourseRunById(req.params.runId, includeExpired);
});

// GET /api/ssg/course-runs/:runId/sessions?courseReferenceNumber=...&sessionMonth=MMYYYY
exports.getSessions = handle((req) => {
  const { courseReferenceNumber, ...otherQuery } = req.query;
  requireFields({ courseReferenceNumber });
  return courseService.getCourseSessions(req.params.runId, courseReferenceNumber, otherQuery);
});
