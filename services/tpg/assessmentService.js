/**
 * Trainee assessment results (encrypted APIs).
 */
const { callSsg } = require('../ssgClient');
const TPG = require('../../config/tpgEndpoints');
const { trainingPartner } = require('../../config/env');

/**
 * Records a trainee's assessment result.
 * `body` is SSG's payload: { assessment: { course, trainee, result, assessmentDate, skillCode, ... } }.
 */
function createAssessment(body = {}) {
  return callSsg(TPG.createAssessment, {
    body: { ...body, assessment: { ...body.assessment, trainingPartner: { ...trainingPartner } } },
  });
}

/** Updates an assessment. `body.assessment` holds the fields to change. */
function updateAssessment(assessmentReferenceNumber, body = {}) {
  return callSsg(TPG.updateOrVoidAssessment, {
    pathParams: { assessmentReferenceNumber },
    body: { ...body, assessment: { ...body.assessment, action: 'update' } },
  });
}

/** Voids (cancels) an assessment. */
function voidAssessment(assessmentReferenceNumber) {
  return callSsg(TPG.updateOrVoidAssessment, {
    pathParams: { assessmentReferenceNumber },
    body: { assessment: { action: 'void' } },
  });
}

/** Searches your assessments. Same shape as enrolment search, with an `assessment` filter. */
function searchAssessments(body = {}) {
  return callSsg(TPG.searchAssessments, {
    body: {
      parameters: { page: 0, pageSize: 20 },
      ...body,
      assessment: { ...body.assessment, trainingPartner: { ...trainingPartner } },
    },
  });
}

/** One assessment, by its reference number. */
function viewAssessment(assessmentReferenceNumber) {
  return callSsg(TPG.viewAssessment, { pathParams: { assessmentReferenceNumber } });
}

module.exports = {
  createAssessment,
  updateAssessment,
  voidAssessment,
  searchAssessments,
  viewAssessment,
};
