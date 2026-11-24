const grantService = require('../services/tpg/grantService');
const { handle, requireFields } = require('../middleware/http');

// POST /api/ssg/grants/search
exports.searchGrants = handle((req) => grantService.searchGrants(req.body));

// GET /api/ssg/grants/:grantReferenceNumber
exports.viewGrant = handle((req) => grantService.viewGrant(req.params.grantReferenceNumber));

// POST /api/ssg/grants/calculator   body: { course: { referenceNumber, startDate, fee } }
exports.calculateBaselineGrant = handle((req) => {
  requireFields({ 'course.referenceNumber': req.body?.course?.referenceNumber });
  return grantService.calculateBaselineGrant(req.body);
});

// POST /api/ssg/grants/calculator/personalised   body: { course: {...}, trainee: { id, idType, dateOfBirth } }
exports.calculatePersonalisedGrant = handle((req) => {
  requireFields({
    'course.referenceNumber': req.body?.course?.referenceNumber,
    'trainee.id': req.body?.trainee?.id,
  });
  return grantService.calculatePersonalisedGrant(req.body);
});
