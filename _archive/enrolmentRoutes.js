const express = require('express');
const router = express.Router();
const controller = require('../controllers/enrolmentController');

router.post('/', controller.createEnrolment);
router.put('/:enrolmentReferenceNumber', controller.updateEnrolment);
router.post('/:enrolmentReferenceNumber/cancel', controller.cancelEnrolment);
router.post('/search', controller.searchEnrolments);

module.exports = router;