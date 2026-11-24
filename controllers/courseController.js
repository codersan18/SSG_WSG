const courseService = require('../services/tpg/courseService');
const { handle } = require('../middleware/http');

// GET /api/ssg/courses/:courseReferenceNumber
exports.getCourseDetails = handle((req) => courseService.getCourseDetails(req.params.courseReferenceNumber, req.query));

// GET /api/ssg/courses/:courseReferenceNumber/runs
exports.getCourseRunsByCourse = handle((req) =>
  courseService.getCourseRunsByCourse(req.params.courseReferenceNumber, req.query)
);
