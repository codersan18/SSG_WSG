const express = require('express');
const router = express.Router();
const { ssgController } = require('../controllers/ssgController');

// Course Management Endpoints
router.post('/courses', ssgController.createCourse);
router.post('/courses/runs', ssgController.addCourseRun);
router.post('/courses/runs/:courseRunId/edit', ssgController.editCourseRun);
router.get('/courses/runs/:courseRunId', ssgController.getCourseRun);
router.get('/courses/runs/:courseRunId/sessions', ssgController.getSessions);
// Add this under Course APIs in routes/ssgRoutes.js
router.get('/courses', ssgController.getCourseList);
// Enrolment Endpoints
router.post('/enrolments', ssgController.createEnrolment);
router.post('/enrolments/search', ssgController.searchEnrolments);
router.post('/enrolments/:enrolmentRefNo/update', ssgController.updateEnrolment);
router.post('/enrolments/:enrolmentRefNo/cancel', ssgController.cancelEnrolment);

// Attendance Endpoints
router.post('/attendance', ssgController.uploadAttendance);

module.exports = router;