const sfcClaimService = require('../services/tpg/sfcClaimService');
const { handle, requireFields } = require('../middleware/http');

// POST /api/ssg/sfc-claims/encrypt   body: { claimRequest: {...} }
exports.encryptClaimRequest = handle((req) => {
  requireFields({ claimRequest: req.body?.claimRequest });
  return sfcClaimService.encryptClaimRequest(req.body);
});

// POST /api/ssg/sfc-claims/decrypt   body: { claimRequestStatus: "<from portal redirect>" }
exports.decryptClaimResponse = handle((req) => {
  requireFields({ claimRequestStatus: req.body?.claimRequestStatus });
  return sfcClaimService.decryptClaimResponse(req.body);
});

// GET /api/ssg/sfc-claims/:claimId?nric=...
exports.viewClaim = handle((req) => {
  requireFields({ nric: req.query.nric });
  return sfcClaimService.viewClaim(req.params.claimId, req.query.nric);
});

// POST /api/ssg/sfc-claims/:claimId/cancel   body: { nric, claimCancelCode }
exports.cancelClaim = handle((req) => {
  const { nric, claimCancelCode } = req.body || {};
  requireFields({ nric, claimCancelCode });
  return sfcClaimService.cancelClaim(req.params.claimId, { nric, claimCancelCode });
});

// POST /api/ssg/sfc-claims/:claimId/documents   body: { nric, attachments: [...] }
exports.uploadSupportingDocuments = handle((req) => {
  const { nric, attachments } = req.body || {};
  requireFields({ nric, attachments });
  return sfcClaimService.uploadSupportingDocuments(req.params.claimId, { nric, attachments });
});
