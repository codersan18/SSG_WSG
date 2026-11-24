/**
 * Courses, course runs and sessions.
 */
const { callSsg, SsgApiError } = require('../ssgClient');
const TPG = require('../../config/tpgEndpoints');
const { trainingPartner } = require('../../config/env');

/**
 * Searches all courses on MySkillsFuture by keyword (a word from the title, or the provider's name).
 * Use it to find a course's reference number (e.g. "TGS-2020505817").
 *
 * SSG ignores a UEN filter here, so search by your company name to find your own courses.
 * Optional query: page, pageSize.
 */
async function searchCourses(keyword, query = {}) {
  try {
    return await callSsg(TPG.searchCourses, { query: { ...query, keyword } });
  } catch (error) {
    // SSG answers "404 Not Found" when nothing matches. For a search, that is simply no results.
    if (error instanceof SsgApiError && error.status === 404 && error.endpointName === 'searchCourses') {
      return { status: 200, data: { courses: [] }, meta: { total: 0 }, error: {} };
    }
    throw error;
  }
}

/** Details of one course on MySkillsFuture. */
function getCourseDetails(courseReferenceNumber, query = {}) {
  return callSsg(TPG.getCourseDetails, {
    pathParams: { courseReferenceNumber },
    query,
  });
}

/**
 * Publishes one or more new runs for a course.
 * `body` is SSG's payload: { course: { courseReferenceNumber, runs: [...] } }.
 * Your UEN is filled in automatically.
 */
function publishCourseRun(body) {
  return callSsg(TPG.publishCourseRun, {
    body: withTrainingProvider(body),
    query: { includeExpiredCourses: true },
  });
}

/** Updates a course run. `body.course.run` holds the fields to change. */
function updateCourseRun(runId, body) {
  const payload = withTrainingProvider(body);
  payload.course.run = { ...payload.course.run, action: 'update' };
  return callSsg(TPG.editOrDeleteCourseRun, { pathParams: { runId }, body: payload, query: { includeExpiredCourses: true } });
}

/** Deletes a course run. Only `courseReferenceNumber` is needed. */
function deleteCourseRun(runId, courseReferenceNumber) {
  const payload = withTrainingProvider({
    course: { courseReferenceNumber, run: { action: 'delete' } },
  });
  return callSsg(TPG.editOrDeleteCourseRun, { pathParams: { runId }, body: payload, query: { includeExpiredCourses: true } });
}

/** One course run, by its SSG run ID. */
function getCourseRunById(runId, includeExpiredCourses = true) {
  return callSsg(TPG.getCourseRunById, {
    pathParams: { runId },
    query: { includeExpiredCourses },
  });
}

/** All runs of a course, for your UEN. Supports pageSize / page / includeExpiredCourses. */
function getCourseRunsByCourse(courseReferenceNumber, query = {}) {
  return callSsg(TPG.getCourseRunsByCourse, {
    query: { uen: trainingPartner.uen, courseReferenceNumber, ...query },
  });
}

/** Sessions of a course run. Optional: sessionMonth (MMYYYY), includeExpiredCourses. */
function getCourseSessions(runId, courseReferenceNumber, query = {}) {
  return callSsg(TPG.getCourseSessions, {
    pathParams: { runId },
    query: { uen: trainingPartner.uen, courseReferenceNumber, ...query },
  });
}

// Puts your UEN into course.trainingProvider. Never trusts a UEN from the caller.
function withTrainingProvider(body = {}) {
  return {
    ...body,
    course: {
      ...body.course,
      trainingProvider: { uen: trainingPartner.uen },
    },
  };
}

module.exports = {
  searchCourses,
  getCourseDetails,
  publishCourseRun,
  updateCourseRun,
  deleteCourseRun,
  getCourseRunById,
  getCourseRunsByCourse,
  getCourseSessions,
};
