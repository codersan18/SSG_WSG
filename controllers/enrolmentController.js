const enrolmentService = require('../services/tpg/enrolmentService');
const { handle, requireFields } = require('../middleware/http');

// POST /api/ssg/enrolments
exports.createEnrolment = handle((req) => {
  requireFields({ enrolment: req.body?.enrolment });
  return enrolmentService.createEnrolment(req.body);
});

// POST /api/ssg/enrolments/search
exports.searchEnrolments = handle((req) => enrolmentService.searchEnrolments(req.body));

// GET /api/ssg/enrolments/:enrolmentReferenceNumber
exports.viewEnrolment = handle((req) => enrolmentService.viewEnrolment(req.params.enrolmentReferenceNumber));

// PUT /api/ssg/enrolments/:enrolmentReferenceNumber
exports.updateEnrolment = handle((req) =>
  enrolmentService.updateEnrolment(req.params.enrolmentReferenceNumber, req.body)
);

// POST /api/ssg/enrolments/:enrolmentReferenceNumber/cancel
exports.cancelEnrolment = handle((req) => enrolmentService.cancelEnrolment(req.params.enrolmentReferenceNumber));

// POST /api/ssg/enrolments/:enrolmentReferenceNumber/fee-collection   body: { collectionStatus: "Full Payment" }
exports.updateFeeCollection = handle((req) => {
  const collectionStatus = req.body?.collectionStatus;
  requireFields({ collectionStatus });
  return enrolmentService.updateFeeCollection(req.params.enrolmentReferenceNumber, collectionStatus);
});
