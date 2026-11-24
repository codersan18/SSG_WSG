const trainerService = require('../services/tpg/trainerService');
const { handle } = require('../middleware/http');

// GET /api/ssg/trainers?pageSize=20&page=0&keyword=...
exports.getTrainers = handle((req) => trainerService.getTrainers(req.query));

// PUT /api/ssg/trainers/:trainerId   body: { trainer: { ...fields to change } }
exports.updateTrainer = handle((req) => trainerService.updateTrainer(req.params.trainerId, req.body?.trainer));

// DELETE /api/ssg/trainers/:trainerId
exports.deleteTrainer = handle((req) => trainerService.deleteTrainer(req.params.trainerId));
