const assessmentService = require('../services/tpg/assessmentService');
const { handle, requireFields } = require('../middleware/http');

// POST /api/ssg/assessments
exports.createAssessment = handle((req) => {
  requireFields({ assessment: req.body?.assessment });
  return assessmentService.createAssessment(req.body);
});

// POST /api/ssg/assessments/search
exports.searchAssessments = handle((req) => assessmentService.searchAssessments(req.body));

// GET /api/ssg/assessments/:assessmentReferenceNumber
exports.viewAssessment = handle((req) => assessmentService.viewAssessment(req.params.assessmentReferenceNumber));

// PUT /api/ssg/assessments/:assessmentReferenceNumber
exports.updateAssessment = handle((req) =>
  assessmentService.updateAssessment(req.params.assessmentReferenceNumber, req.body)
);

// POST /api/ssg/assessments/:assessmentReferenceNumber/void
exports.voidAssessment = handle((req) => assessmentService.voidAssessment(req.params.assessmentReferenceNumber));
