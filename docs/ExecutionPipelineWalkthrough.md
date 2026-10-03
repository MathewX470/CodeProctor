# Execution Pipeline Walkthrough

I have successfully updated the worker's execution logic to match the advanced architecture commonly used in real online judges. Here is what I implemented based on your feedback:

## 1. Direct Database Access (Prisma in Worker)
The worker now connects directly to your Neon Postgres database using the `@prisma/client`.
- We installed Prisma in the `worker/` directory and generated the client pointing to your `apps/web/prisma/schema.prisma`.
- Created `worker/src/db.js` which seamlessly uses the `@neondatabase/serverless` connection pool.
- The `test-job.js` now only requires a `submissionId` because the worker fetches the problem, language, and testcases entirely on its own!

## 2. Advanced Docker Logic
The `worker/src/docker/index.js` file now splits the logic perfectly:
- **`compileContainer`**: Spins up a container purely for compilation with a hard 15-second timeout and 256MB limit. If it times out, it gracefully reports a compilation timeout.
- **`startExecutionContainer`**: Launches a single background container for the submission (`sleep infinity`). It includes the strict security flags: `--read-only`, `--tmpfs /tmp`, and `--security-opt=no-new-privileges`.
- **`runTestCase`**: Pipes the `testCase.input` directly into the container using `docker exec -i`. It uses a Node.js `setTimeout` block to forcibly kill the exec process if it exceeds the `timeLimit`.

## 3. The Execution Loop (Fail Fast & Tracking)
The new `executeSubmission` logic in `worker/src/executor/index.js` now mirrors a production flow:
1. Fetches the `Submission` and updates the status to `COMPILING`.
2. Runs the compilation step. If it fails, saves `COMPILATION_ERROR` and halts.
3. Updates the status to `RUNNING`.
4. Loops through the `TestCase`s fetched from the DB:
   - For each testcase, calls `runTestCase`.
   - Parses the exit code to determine `MEMORY_LIMIT_EXCEEDED` (137) or `RUNTIME_ERROR`.
   - Checks the timeout string for `TIME_LIMIT_EXCEEDED`.
   - Compares the `stdout` against `expectedOutput` for `WRONG_ANSWER` vs `ACCEPTED`.
   - Saves the metrics directly to the `SubmissionTestCase` table.
5. If a `WA`/`TLE`/`RE`/`MLE` verdict occurs, it instantly **fails fast** and halts to save CPU.
6. Saves the aggregate result and updates the status to `FINISHED`.

## How to Test This Now
Since the worker now relies on your database, make sure your `.env` in `worker/` has **both** `REDIS_URL` and `DATABASE_URL` set!
```bash
# worker/.env
REDIS_URL="rediss://..."
DATABASE_URL="postgres://..."
```

Then you can manually test an actual submission row in your database by running:
```bash
cd worker
npm run dev

# In another terminal:
node test-job.js clz_submission_id_here
```
