const courseService = require('../services/tpg/courseService');
const { handle, requireFields } = require('../middleware/http');

// GET /api/ssg/courses?keyword=...&page=0&pageSize=20&summary=true
// summary=true returns only the fields needed to pick a course, instead of SSG's ~70 fields per course.
exports.searchCourses = handle(async (req) => {
  const { keyword, summary, ...otherQuery } = req.query;
  requireFields({ keyword });

  const result = await courseService.searchCourses(keyword, otherQuery);
  if (summary !== 'true') return result;

  return {
    total: result?.meta?.total ?? 0,
    courses: (result?.data?.courses || []).map((course) => ({
      referenceNumber: course.referenceNumber,
      title: course.title,
      trainingProvider: course.trainingProviderAlias,
      totalCostOfTrainingPerTrainee: course.totalCostOfTrainingPerTrainee,
      totalTrainingDurationHour: course.totalTrainingDurationHour,
    })),
  };
});

// GET /api/ssg/courses/:courseReferenceNumber
exports.getCourseDetails = handle((req) => courseService.getCourseDetails(req.params.courseReferenceNumber, req.query));

// GET /api/ssg/courses/:courseReferenceNumber/runs
exports.getCourseRunsByCourse = handle((req) =>
  courseService.getCourseRunsByCourse(req.params.courseReferenceNumber, req.query)
);
