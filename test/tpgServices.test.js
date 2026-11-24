/**
 * Checks that each TPG service sends the right request to SSG:
 * the right method, path, version, encryption, and the fields the gateway adds itself (UEN, TP code, actions).
 */
const { TEST_ENV } = require('./helpers/setup');
const { describe, test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const fakeSsg = require('./helpers/fakeSsg');
const course = require('../services/tpg/courseService');
const attendance = require('../services/tpg/attendanceService');
const trainer = require('../services/tpg/trainerService');
const enrolment = require('../services/tpg/enrolmentService');
const assessment = require('../services/tpg/assessmentService');
const grant = require('../services/tpg/grantService');
const sfc = require('../services/tpg/sfcClaimService');

const OUR_TRAINING_PARTNER = { uen: TEST_ENV.SSG_UEN, code: TEST_ENV.SSG_TP_CODE };
const sent = () => fakeSsg.lastRequest();
const sentBody = () => fakeSsg.lastBody();
const sentEncryptedBody = () => fakeSsg.lastBody({ encrypted: true });

beforeEach(() => fakeSsg.reset());

describe('Courses and course runs', () => {
  test('searchCourses sends the keyword and paging, version v3.0', async () => {
    await course.searchCourses('safety', { page: 0, pageSize: 20 });
    assert.equal(sent().method, 'GET');
    assert.equal(sent().url, '/courses/directory');
    assert.equal(sent().headers['x-api-version'], 'v3.0');
    assert.deepEqual(sent().query, { page: 0, pageSize: 20, keyword: 'safety' });
  });

  test('searchCourses turns SSG\'s "404 Not Found" (no match) into an empty list', async () => {
    fakeSsg.replyWith({ status: 404, body: '{"data":{},"error":{"code":404,"message":"Not Found"},"status":400}' });
    const result = await course.searchCourses('NoSuchCourse');
    assert.deepEqual(result, { status: 200, data: { courses: [] }, meta: { total: 0 }, error: {} });
  });

  test('searchCourses still fails on other SSG errors', async () => {
    fakeSsg.replyWith({ status: 400, body: '{"error":{"code":400,"message":"Bad Request"}}' });
    await assert.rejects(course.searchCourses('x'), (error) => error.status === 400);
  });

  test('getCourseDetails', async () => {
    await course.getCourseDetails('TGS-001');
    assert.equal(sent().method, 'GET');
    assert.equal(sent().url, '/courses/directory/TGS-001');
    assert.equal(sent().headers['x-api-version'], 'v2.0');
  });

  test('publishCourseRun is encrypted and always uses our UEN, even if the caller sends another', async () => {
    await course.publishCourseRun({ course: { courseReferenceNumber: 'TGS-001', trainingProvider: { uen: 'SOMEONE-ELSE' }, runs: [] } });
    assert.equal(sent().url, '/courses/courseRuns/publish');
    assert.equal(sent().headers['x-api-version'], 'v2.0');
    assert.deepEqual(sentEncryptedBody().course.trainingProvider, { uen: TEST_ENV.SSG_UEN });
    assert.equal(sentEncryptedBody().course.courseReferenceNumber, 'TGS-001');
  });

  test('updateCourseRun sends action "update"', async () => {
    await course.updateCourseRun('123', { course: { courseReferenceNumber: 'TGS-001', run: { intakeSize: 30 } } });
    assert.equal(sent().url, '/courses/courseRuns/edit/123');
    assert.equal(sent().headers['x-api-version'], 'v1.2');
    assert.deepEqual(sentEncryptedBody().course.run, { intakeSize: 30, action: 'update' });
  });

  test('deleteCourseRun sends action "delete"', async () => {
    await course.deleteCourseRun('123', 'TGS-001');
    assert.equal(sent().url, '/courses/courseRuns/edit/123');
    assert.deepEqual(sentEncryptedBody().course, {
      courseReferenceNumber: 'TGS-001',
      run: { action: 'delete' },
      trainingProvider: { uen: TEST_ENV.SSG_UEN },
    });
  });

  test('getCourseRunById is a plain GET', async () => {
    await course.getCourseRunById('123');
    assert.equal(sent().url, '/courses/courseRuns/id/123');
    assert.deepEqual(sent().query, { includeExpiredCourses: true });
  });

  test('getCourseSessions adds our UEN to the query', async () => {
    await course.getCourseSessions('123', 'TGS-001', { sessionMonth: '122026' });
    assert.equal(sent().url, '/courses/runs/123/sessions');
    assert.equal(sent().headers['x-api-version'], 'v1.5');
    assert.deepEqual(sent().query, { uen: TEST_ENV.SSG_UEN, courseReferenceNumber: 'TGS-001', sessionMonth: '122026' });
  });
});

describe('Attendance', () => {
  test('getSessionAttendance', async () => {
    await attendance.getSessionAttendance('123', 'TGS-001', 'S1');
    assert.equal(sent().url, '/courses/runs/123/sessions/attendance');
    assert.deepEqual(sent().query, { uen: TEST_ENV.SSG_UEN, courseReferenceNumber: 'TGS-001', sessionId: 'S1' });
  });

  test('uploadSessionAttendance is encrypted and includes our UEN', async () => {
    await attendance.uploadSessionAttendance('123', { course: { sessionID: 'S1' } });
    assert.equal(sent().method, 'POST');
    assert.equal(sentEncryptedBody().uen, TEST_ENV.SSG_UEN);
    assert.equal(sentEncryptedBody().course.sessionID, 'S1');
  });
});

describe('Trainers', () => {
  test('getTrainers uses our UEN in the path', async () => {
    await trainer.getTrainers({ page: 0 });
    assert.equal(sent().url, `/trainingProviders/${TEST_ENV.SSG_UEN}/trainers`);
  });

  test('updateTrainer and deleteTrainer send the right action', async () => {
    await trainer.updateTrainer('T1', { name: 'New Name' });
    assert.deepEqual(sentBody(), { trainer: { name: 'New Name', action: 'update' } });

    await trainer.deleteTrainer('T1');
    assert.equal(sent().url, `/trainingProviders/${TEST_ENV.SSG_UEN}/trainers/T1`);
    assert.deepEqual(sentBody(), { trainer: { action: 'delete' } });
  });
});

describe('Enrolments', () => {
  test('createEnrolment is encrypted, uses v4.0 and always uses our training partner', async () => {
    await enrolment.createEnrolment({ enrolment: { trainee: { id: 'S1234567A' }, trainingPartner: { uen: 'SOMEONE-ELSE' } } });
    assert.equal(sent().url, '/tpg/enrolments');
    assert.equal(sent().headers['x-api-version'], 'v4.0');
    assert.deepEqual(sentEncryptedBody().enrolment.trainingPartner, OUR_TRAINING_PARTNER);
    assert.equal(sentEncryptedBody().enrolment.trainee.id, 'S1234567A');
  });

  test('updateEnrolment sends action "Update"', async () => {
    await enrolment.updateEnrolment('ENR-1', { enrolment: { trainee: { emailAddress: 'a@b.c' } } });
    assert.equal(sent().url, '/tpg/enrolments/details/ENR-1');
    assert.equal(sentEncryptedBody().enrolment.action, 'Update');
  });

  test('cancelEnrolment sends action "Cancel"', async () => {
    await enrolment.cancelEnrolment('ENR-1');
    assert.deepEqual(sentEncryptedBody(), { enrolment: { action: 'Cancel' } });
  });

  test('searchEnrolments adds default paging and our training partner', async () => {
    await enrolment.searchEnrolments({ enrolment: { status: 'Confirmed' } });
    assert.equal(sent().url, '/tpg/enrolments/search');
    assert.deepEqual(sentEncryptedBody().parameters, { page: 0, pageSize: 20 });
    assert.deepEqual(sentEncryptedBody().enrolment, { status: 'Confirmed', trainingPartner: OUR_TRAINING_PARTNER });
  });

  test('searchEnrolments keeps the caller\'s paging', async () => {
    await enrolment.searchEnrolments({ parameters: { page: 2, pageSize: 50 } });
    assert.deepEqual(sentEncryptedBody().parameters, { page: 2, pageSize: 50 });
  });

  test('viewEnrolment is a GET with no body', async () => {
    await enrolment.viewEnrolment('ENR-1');
    assert.equal(sent().method, 'GET');
    assert.equal(sent().url, '/tpg/enrolments/details/ENR-1');
    assert.equal(sent().rawBody, undefined);
  });

  test('updateFeeCollection sends the collection status', async () => {
    await enrolment.updateFeeCollection('ENR-1', 'Full Payment');
    assert.equal(sent().url, '/tpg/enrolments/feeCollections/ENR-1');
    assert.deepEqual(sentEncryptedBody(), { enrolment: { fees: { collectionStatus: 'Full Payment' } } });
  });
});

describe('Assessments', () => {
  test('createAssessment uses version "v1" (not "v1.0") and our training partner', async () => {
    await assessment.createAssessment({ assessment: { result: 'Pass' } });
    assert.equal(sent().url, '/tpg/assessments');
    assert.equal(sent().headers['x-api-version'], 'v1');
    assert.deepEqual(sentEncryptedBody().assessment, { result: 'Pass', trainingPartner: OUR_TRAINING_PARTNER });
  });

  test('updateAssessment and voidAssessment send the right action', async () => {
    await assessment.updateAssessment('ASM-1', { assessment: { score: 80 } });
    assert.equal(sent().url, '/tpg/assessments/details/ASM-1');
    assert.deepEqual(sentEncryptedBody().assessment, { score: 80, action: 'update' });

    await assessment.voidAssessment('ASM-1');
    assert.deepEqual(sentEncryptedBody(), { assessment: { action: 'void' } });
  });

  test('searchAssessments adds our training partner', async () => {
    await assessment.searchAssessments({});
    assert.deepEqual(sentEncryptedBody().assessment.trainingPartner, OUR_TRAINING_PARTNER);
  });
});

describe('Grants', () => {
  test('searchGrants adds our training partner', async () => {
    await grant.searchGrants({});
    assert.equal(sent().url, '/tpg/grants/search');
    assert.deepEqual(sentEncryptedBody().grants.trainingPartner, OUR_TRAINING_PARTNER);
  });

  test('grant calculators use v3.0 and send the body unchanged', async () => {
    const body = { course: { referenceNumber: 'TGS-001', startDate: '2026-12-20', fee: 1000 } };

    await grant.calculateBaselineGrant(body);
    assert.equal(sent().url, '/grantCalculators/individual');
    assert.equal(sent().headers['x-api-version'], 'v3.0');
    assert.deepEqual(sentBody(), body);

    await grant.calculatePersonalisedGrant(body);
    assert.equal(sent().url, '/grantCalculators/individual/personalised');
  });
});

describe('SkillsFuture Credit claims', () => {
  test('viewClaim sends the NRIC as a query parameter', async () => {
    await sfc.viewClaim('C1', 'S1234567A');
    assert.equal(sent().url, '/skillsFutureCredits/claims/C1');
    assert.deepEqual(sent().query, { nric: 'S1234567A' });
  });

  test('cancelClaim sends only nric and claimCancelCode', async () => {
    await sfc.cancelClaim('C1', { nric: 'S1234567A', claimCancelCode: '51', extra: 'ignored' });
    assert.deepEqual(sentBody(), { nric: 'S1234567A', claimCancelCode: '51' });
  });

  test('uploadSupportingDocuments posts to the documents path', async () => {
    await sfc.uploadSupportingDocuments('C1', { nric: 'S1234567A', attachments: [{ fileName: 'a.pdf' }] });
    assert.equal(sent().url, '/skillsFutureCredits/claims/C1/supportingdocuments');
    assert.deepEqual(sentBody().attachments, [{ fileName: 'a.pdf' }]);
  });
});
