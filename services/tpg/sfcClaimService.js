/**
 * SkillsFuture Credit (SFC) claims.
 *
 * Claim flow:
 *   1. encryptClaimRequest  -> SSG returns an encrypted payload
 *   2. Your frontend posts that payload to the MySkillsFuture portal; the trainee logs in and submits the claim
 *   3. The portal redirects back to your site with an encrypted result
 *   4. decryptClaimResponse -> read the claim ID and status
 *   5. Optional: viewClaim, cancelClaim, uploadSupportingDocuments
 */
const { callSsg } = require('../ssgClient');
const TPG = require('../../config/tpgEndpoints');

/** Step 1. `body` is SSG's payload: { claimRequest: { course, individual, additionalInformation } }. */
function encryptClaimRequest(body) {
  return callSsg(TPG.encryptSfcClaimRequest, { body });
}

/** Step 4. `body` is SSG's payload: { claimRequestStatus: "<encrypted value from the portal redirect>" }. */
function decryptClaimResponse(body) {
  return callSsg(TPG.decryptSfcClaimResponse, { body });
}

/** Claim details. SSG needs the trainee's NRIC. */
function viewClaim(claimId, nric) {
  return callSsg(TPG.viewSfcClaim, { pathParams: { claimId }, query: { nric } });
}

/** Cancels a claim. `claimCancelCode` is from SSG's cancellation code list. */
function cancelClaim(claimId, { nric, claimCancelCode }) {
  return callSsg(TPG.cancelSfcClaim, {
    pathParams: { claimId },
    body: { nric, claimCancelCode },
  });
}

/**
 * Uploads supporting documents for a claim.
 * `attachments`: [{ fileName, fileSize, fileType, attachmentByte }], where attachmentByte is the file as Base64.
 */
function uploadSupportingDocuments(claimId, { nric, attachments }) {
  return callSsg(TPG.uploadSfcSupportingDocuments, {
    pathParams: { claimId },
    body: { nric, attachments },
  });
}

module.exports = {
  encryptClaimRequest,
  decryptClaimResponse,
  viewClaim,
  cancelClaim,
  uploadSupportingDocuments,
};
