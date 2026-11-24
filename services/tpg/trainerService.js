/**
 * Trainers registered under your training provider.
 * New trainers are added through the course-run publish payload, so there is no "add" call here.
 */
const { callSsg } = require('../ssgClient');
const TPG = require('../../config/tpgEndpoints');
const { trainingPartner } = require('../../config/env');

/** Lists your trainers. Optional query: pageSize, page, keyword. */
function getTrainers(query = {}) {
  return callSsg(TPG.getTrainers, {
    pathParams: { uen: trainingPartner.uen },
    query,
  });
}

/** Updates a trainer. `trainerDetails` holds the fields to change. */
function updateTrainer(trainerId, trainerDetails = {}) {
  return callSsg(TPG.updateOrDeleteTrainer, {
    pathParams: { uen: trainingPartner.uen, trainerId },
    body: { trainer: { ...trainerDetails, action: 'update' } },
  });
}

/** Removes a trainer. */
function deleteTrainer(trainerId) {
  return callSsg(TPG.updateOrDeleteTrainer, {
    pathParams: { uen: trainingPartner.uen, trainerId },
    body: { trainer: { action: 'delete' } },
  });
}

module.exports = { getTrainers, updateTrainer, deleteTrainer };
