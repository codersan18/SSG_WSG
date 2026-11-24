/**
 * Every route this gateway offers, mounted under /api/ssg.
 * Each line maps one of your routes to one SSG TPG API (see config/tpgEndpoints.js).
 */
const express = require('express');

const course = require('../controllers/courseController');
const courseRun = require('../controllers/courseRunController');
const attendance = require('../controllers/attendanceController');
const trainer = require('../controllers/trainerController');
const enrolment = require('../controllers/enrolmentController');
const assessment = require('../controllers/assessmentController');
const grant = require('../controllers/grantController');
const sfcClaim = require('../controllers/sfcClaimController');

const router = express.Router();

// ---- Courses
router.get('/courses', course.searchCourses);
router.get('/courses/:courseReferenceNumber', course.getCourseDetails);
router.get('/courses/:courseReferenceNumber/runs', course.getCourseRunsByCourse);

// ---- Course runs & sessions
router.post('/course-runs', courseRun.publishCourseRun);
router.get('/course-runs/:runId', courseRun.getCourseRun);
router.put('/course-runs/:runId', courseRun.updateCourseRun);
router.delete('/course-runs/:runId', courseRun.deleteCourseRun);
router.get('/course-runs/:runId/sessions', courseRun.getSessions);

// ---- Attendance
router.get('/attendance/:runId', attendance.getAttendance);
router.post('/attendance/:runId', attendance.uploadAttendance);

// ---- Trainers
router.get('/trainers', trainer.getTrainers);
router.put('/trainers/:trainerId', trainer.updateTrainer);
router.delete('/trainers/:trainerId', trainer.deleteTrainer);

// ---- Enrolments ("/search" is declared before "/:ref" so it is not read as a reference number)
router.post('/enrolments', enrolment.createEnrolment);
router.post('/enrolments/search', enrolment.searchEnrolments);
router.get('/enrolments/:enrolmentReferenceNumber', enrolment.viewEnrolment);
router.put('/enrolments/:enrolmentReferenceNumber', enrolment.updateEnrolment);
router.post('/enrolments/:enrolmentReferenceNumber/cancel', enrolment.cancelEnrolment);
router.post('/enrolments/:enrolmentReferenceNumber/fee-collection', enrolment.updateFeeCollection);

// ---- Assessments
router.post('/assessments', assessment.createAssessment);
router.post('/assessments/search', assessment.searchAssessments);
router.get('/assessments/:assessmentReferenceNumber', assessment.viewAssessment);
router.put('/assessments/:assessmentReferenceNumber', assessment.updateAssessment);
router.post('/assessments/:assessmentReferenceNumber/void', assessment.voidAssessment);

// ---- Grants ("/calculator" and "/search" are declared before "/:ref")
router.post('/grants/calculator', grant.calculateBaselineGrant);
router.post('/grants/calculator/personalised', grant.calculatePersonalisedGrant);
router.post('/grants/search', grant.searchGrants);
router.get('/grants/:grantReferenceNumber', grant.viewGrant);

// ---- SkillsFuture Credit claims
router.post('/sfc-claims/encrypt', sfcClaim.encryptClaimRequest);
router.post('/sfc-claims/decrypt', sfcClaim.decryptClaimResponse);
router.get('/sfc-claims/:claimId', sfcClaim.viewClaim);
router.post('/sfc-claims/:claimId/cancel', sfcClaim.cancelClaim);
router.post('/sfc-claims/:claimId/documents', sfcClaim.uploadSupportingDocuments);

module.exports = router;
