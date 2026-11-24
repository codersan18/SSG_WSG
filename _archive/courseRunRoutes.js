const express = require('express');
const router = express.Router();
const controller = require('../controllers/courseRunController');

router.post('/create/:courseReferenceNumber', controller.addCourseRun);
router.put('/:runId', controller.editCourseRun);
router.get('/:runId', controller.getCourseRun);
router.get('/:runId/sessions', controller.getSessions);

module.exports = router;