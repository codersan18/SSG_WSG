/**
 * Grants: what SSG has worked out for your enrolments, and the grant calculator.
 */
const { callSsg } = require('../ssgClient');
const TPG = require('../../config/tpgEndpoints');
const { trainingPartner } = require('../../config/env');

/** Searches grants. `body` is SSG's payload: { meta, sortBy, grants: { course, trainee, ... }, parameters }. */
function searchGrants(body = {}) {
  return callSsg(TPG.searchGrants, {
    body: {
      parameters: { page: 0, pageSize: 20 },
      ...body,
      grants: { ...body.grants, trainingPartner: { ...trainingPartner } },
    },
  });
}

/** One grant, by its reference number. */
function viewGrant(grantReferenceNumber) {
  return callSsg(TPG.viewGrant, { pathParams: { grantReferenceNumber } });
}

/**
 * Baseline grant calculator: the nett course fee after the standard (baseline) funding,
 * before any trainee-specific schemes.
 * Example body: { course: { referenceNumber, startDate: "2026-12-20", fee: 1000 } }
 * (Check the field list on the SSG Developer Portal; it is passed to SSG unchanged.)
 */
function calculateBaselineGrant(body) {
  return callSsg(TPG.calculateBaselineGrant, { body });
}

/**
 * Personalised grant calculator: also applies every scheme this trainee is eligible for.
 * Example body: { course: { referenceNumber, startDate, fee }, trainee: { id, idType: "NRIC", dateOfBirth } }
 */
function calculatePersonalisedGrant(body) {
  return callSsg(TPG.calculatePersonalisedGrant, { body });
}

module.exports = { searchGrants, viewGrant, calculateBaselineGrant, calculatePersonalisedGrant };
