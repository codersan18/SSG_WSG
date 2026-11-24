/**
 * Trainee enrolments (encrypted APIs).
 */
const { callSsg } = require('../ssgClient');
const TPG = require('../../config/tpgEndpoints');
const { trainingPartner } = require('../../config/env');

/**
 * Enrols a trainee into a course run.
 * `body` is SSG's payload: { enrolment: { course, trainee, ... } }.
 * Your UEN and TP code are filled in automatically.
 */
function createEnrolment(body = {}) {
  return callSsg(TPG.createEnrolment, {
    body: { ...body, enrolment: { ...body.enrolment, trainingPartner: { ...trainingPartner } } },
  });
}

/** Updates an enrolment. `body.enrolment` holds the fields to change. */
function updateEnrolment(enrolmentReferenceNumber, body = {}) {
  return callSsg(TPG.updateOrCancelEnrolment, {
    pathParams: { enrolmentReferenceNumber },
    body: { ...body, enrolment: { ...body.enrolment, action: 'Update' } },
  });
}

/** Cancels an enrolment. */
function cancelEnrolment(enrolmentReferenceNumber) {
  return callSsg(TPG.updateOrCancelEnrolment, {
    pathParams: { enrolmentReferenceNumber },
    body: { enrolment: { action: 'Cancel' } },
  });
}

/**
 * Searches your enrolments.
 * `body` is SSG's payload: { meta, sortBy, enrolment: { course, trainee, ... }, parameters: { page, pageSize } }.
 */
function searchEnrolments(body = {}) {
  return callSsg(TPG.searchEnrolments, {
    body: {
      parameters: { page: 0, pageSize: 20 },
      ...body,
      enrolment: { ...body.enrolment, trainingPartner: { ...trainingPartner } },
    },
  });
}

/** One enrolment, by its reference number. */
function viewEnrolment(enrolmentReferenceNumber) {
  return callSsg(TPG.viewEnrolment, { pathParams: { enrolmentReferenceNumber } });
}

/**
 * Updates the fee collection status of an enrolment.
 * SSG values: "Pending Payment", "Partial Payment", "Full Payment", "Cancelled".
 */
function updateFeeCollection(enrolmentReferenceNumber, collectionStatus) {
  return callSsg(TPG.updateEnrolmentFeeCollection, {
    pathParams: { enrolmentReferenceNumber },
    body: { enrolment: { fees: { collectionStatus } } },
  });
}

module.exports = {
  createEnrolment,
  updateEnrolment,
  cancelEnrolment,
  searchEnrolments,
  viewEnrolment,
  updateFeeCollection,
};
