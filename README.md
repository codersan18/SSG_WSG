# SSG TPG Gateway

A Node.js (Express) server that connects your system to SSG's **Training Partners Gateway (TPG)**.
Your system calls these routes with plain JSON. The gateway handles the SSG certificate (mTLS),
the `x-api-version` headers and payload encryption/decryption.

```
npm install
npm test        # unit tests: no network, no .env, no certificates needed
npm run check   # read-only test that your certificate + encryption key work
npm start       # http://localhost:3000
```

## Going to production

1. In `.env`, set `SSG_BASE_URL=https://api.ssg-wsg.sg`. The sandbox is `https://mock-api.ssg-wsg.sg`.
2. Use the **production** certificate, private key and encryption key from the SSG Developer Portal.
3. Confirm every `x-api-version` against the API versions you subscribe to on the portal.
   Defaults are in [config/tpgEndpoints.js](config/tpgEndpoints.js), and lines marked `VERIFY` need checking.
   Override any default in `.env` (see [.env.example](.env.example)).
4. Set `GATEWAY_API_KEY` in `.env`. Otherwise anyone who can reach this server can act as your organisation on SSG.
5. Run `npm run check` and confirm it shows ✓.

## Project layout

| Path | What it does |
|---|---|
| `config/env.js` | Loads `.env` and stops at startup if something required is missing |
| `config/tpgEndpoints.js` | **Every TPG API**: method, path, version, encrypted or not |
| `services/ssgCrypto.js` | AES-256-CBC encrypt/decrypt (SSG's fixed IV `SSGAPIInitVector`) |
| `services/ssgClient.js` | The only file that calls SSG (mTLS, headers, encryption, errors) |
| `services/tpg/*.js` | One function per TPG API, grouped by area |
| `controllers/*.js` | Reads the HTTP request and calls the matching service |
| `routes/index.js` | Every route in one list |
| `middleware/http.js` | Response format, validation, API key, error handler |
| `test/` | Unit tests (`npm test`). `test/helpers/fakeSsg.js` stands in for SSG |
| `_archive/` | Old experimental files (not used) |

Your UEN and TP code are added automatically from `.env`. Callers never send them.

## API list

All routes are under `/api/ssg`. Success responses are `{ "success": true, "data": <SSG response> }`.
Errors are `{ "success": false, "message", "api", "ssgResponse" }`, using SSG's HTTP status.

### Courses
| Route | SSG API | Encrypted |
|---|---|---|
| `GET /courses/:courseReferenceNumber` | `GET /courses/directory/{ref}` | No |
| `GET /courses/:courseReferenceNumber/runs` | `GET /courses/courseRuns/reference` | No |

### Course runs & sessions
| Route | SSG API | Encrypted |
|---|---|---|
| `POST /course-runs` | `POST /courses/courseRuns/publish` | Yes |
| `GET /course-runs/:runId` | `GET /courses/courseRuns/id/{runId}` | No |
| `PUT /course-runs/:runId` | `POST /courses/courseRuns/edit/{runId}` (action `update`) | Yes |
| `DELETE /course-runs/:runId?courseReferenceNumber=` | `POST /courses/courseRuns/edit/{runId}` (action `delete`) | Yes |
| `GET /course-runs/:runId/sessions?courseReferenceNumber=&sessionMonth=MMYYYY` | `GET /courses/runs/{runId}/sessions` | No |

### Attendance
| Route | SSG API | Encrypted |
|---|---|---|
| `GET /attendance/:runId?courseReferenceNumber=&sessionId=` | `GET /courses/runs/{runId}/sessions/attendance` | Response |
| `POST /attendance/:runId` | `POST /courses/runs/{runId}/sessions/attendance` | Yes |

### Trainers
| Route | SSG API | Encrypted |
|---|---|---|
| `GET /trainers?pageSize=&page=&keyword=` | `GET /trainingProviders/{uen}/trainers` | No |
| `PUT /trainers/:trainerId` | `POST /trainingProviders/{uen}/trainers/{id}` (action `update`) | No |
| `DELETE /trainers/:trainerId` | same (action `delete`) | No |

### Enrolments
| Route | SSG API | Encrypted |
|---|---|---|
| `POST /enrolments` | `POST /tpg/enrolments` | Yes |
| `POST /enrolments/search` | `POST /tpg/enrolments/search` | Yes |
| `GET /enrolments/:ref` | `GET /tpg/enrolments/details/{ref}` | Response |
| `PUT /enrolments/:ref` | `POST /tpg/enrolments/details/{ref}` (action `Update`) | Yes |
| `POST /enrolments/:ref/cancel` | `POST /tpg/enrolments/details/{ref}` (action `Cancel`) | Yes |
| `POST /enrolments/:ref/fee-collection` body `{ collectionStatus }` | `POST /tpg/enrolments/feeCollections/{ref}` | Yes |

### Assessments
| Route | SSG API | Encrypted |
|---|---|---|
| `POST /assessments` | `POST /tpg/assessments` | Yes |
| `POST /assessments/search` | `POST /tpg/assessments/search` | Yes |
| `GET /assessments/:ref` | `GET /tpg/assessments/details/{ref}` | Response |
| `PUT /assessments/:ref` | `POST /tpg/assessments/details/{ref}` (action `update`) | Yes |
| `POST /assessments/:ref/void` | `POST /tpg/assessments/details/{ref}` (action `void`) | Yes |

### Grants
| Route | SSG API | Encrypted |
|---|---|---|
| `POST /grants/search` | `POST /tpg/grants/search` | Yes |
| `GET /grants/:grantReferenceNumber` | `GET /tpg/grants/details/{ref}` | Response |
| `POST /grants/calculator` body `{ course: { referenceNumber, startDate, fee } }` | `POST /grantCalculators/individual` (v3.0) | No |
| `POST /grants/calculator/personalised` body `{ course, trainee: { id, idType, dateOfBirth } }` | `POST /grantCalculators/individual/personalised` (v3.0) | No |

### SkillsFuture Credit claims
| Route | SSG API | Encrypted |
|---|---|---|
| `POST /sfc-claims/encrypt` body `{ claimRequest }` | `POST /skillsFutureCredits/claims/encryptRequests` | No |
| `POST /sfc-claims/decrypt` body `{ claimRequestStatus }` | `POST /skillsFutureCredits/claims/decryptRequests` | No |
| `GET /sfc-claims/:claimId?nric=` | `GET /skillsFutureCredits/claims/{claimId}` | No |
| `POST /sfc-claims/:claimId/cancel` body `{ nric, claimCancelCode }` | `POST /skillsFutureCredits/claims/{claimId}` | No |
| `POST /sfc-claims/:claimId/documents` body `{ nric, attachments }` | `POST /skillsFutureCredits/claims/{claimId}/supportingdocuments` | No |

## Example

```bash
curl -X POST http://localhost:3000/api/ssg/enrolments/search \
  -H "Content-Type: application/json" -H "x-api-key: <GATEWAY_API_KEY>" \
  -d '{"meta":{"lastUpdateDateFrom":"2026-01-01","lastUpdateDateTo":"2026-12-31"},
       "sortBy":{"field":"updatedOn","order":"asc"},
       "parameters":{"page":0,"pageSize":20}}'
```

## Postman collection & tests

[postman/SSG_TPG_Gateway.postman_collection.json](postman/SSG_TPG_Gateway.postman_collection.json) has every route, example responses and tests.

- Every request checks the HTTP status, the `success` flag, SSG's status and the key fields in the response.
- Create requests save new IDs (`runId`, `sessionId`, `trainerId`, `enrolmentReferenceNumber`, `assessmentReferenceNumber`) for the requests after them.
- **Requests marked ⚠ change data on SSG and are skipped unless `allowWrites` is `true`.** Turn it on only against the sandbox, or when you mean to change live data.

Run all tests from the command line (gateway running):

```bash
postman collection run postman/SSG_TPG_Gateway.postman_collection.json \
  --env-var apiKey=<GATEWAY_API_KEY> --env-var courseReferenceNumber=<ref> --env-var runId=<id>
# add --env-var allowWrites=true to include the ⚠ requests
```

## Adding another TPG API

1. Add an entry to `config/tpgEndpoints.js`.
2. Add a function in the matching `services/tpg/*.js` that calls `callSsg(TPG.yourEndpoint, {...})`.
3. Add a controller line and a route line.

Request and response bodies are never logged, because they contain trainee personal data (NRIC).
