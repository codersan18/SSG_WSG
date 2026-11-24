const express = require('express');
const router = express.Router();
const controller = require('../controllers/attendanceController');

router.post('/upload/:runId', controller.uploadAttendance);

module.exports = router;

