# Runbook: a controlled API failure

## Purpose and scope

Demonstrate baseline → one intentional HTTP 503 → successful follow-up request, then correlate evidence in AWS. The diagnostic cannot change colony data or a persistent server flag. This is a controlled exercise, not an outage affecting other visitors.

Prerequisites: deployed stack, frontend configured with `/api`, `EnableDiagnostics=true`, and operator access to the stack's CloudWatch logs, metrics, and alarm. Browser mode demonstrates the UI only and produces no AWS evidence.

## Execute and observe

1. Open **Operations** and choose **Check service**. Expect HTTP 200 and source `aws`. Record its timestamp and request ID.
2. Choose **Trigger diagnostic failure** once. Expect HTTP 503 and source `aws`. Record the request ID. The UI marks the latest probe degraded and increments failed probes.
3. Choose **Verify recovery**. Expect HTTP 200 with a different ID. Check that colony state is unchanged.
4. Open the stack's `LambdaLogGroup` in CloudWatch. Filter to the diagnostic request ID; expect `event=api_probe`, `route=diagnostic`, `status=503`, `diagnostic=true`. Correlate the same ID in `ApiLogGroup` and the successful follow-up.
5. Open `DashboardName` and `AlarmName` from stack Outputs. Inspect API `5xx` Sum for the diagnostic minute. The alarm threshold is at least one 5xx in a 60-second period, one breaching evaluation.
6. Wait for metric delivery and record ALARM → OK history. A healthy follow-up does not reset the breaching minute; missing data is non-breaching, and aggregation/evaluation can delay state changes.

The handler returns a 503 normally, so **Lambda Errors can remain zero**. This is why detection targets the API Gateway HTTP `5xx` metric. The browser shows the current session's own request results; it does not read the account's alarm state. No email/SNS notification or automatic remediation is configured.

## If the expected result is absent

| Symptom | Investigate | Recovery / next check |
| --- | --- | --- |
| Source is `browser` | `runtime-config.json` and deployment mode | Publish `/api` config to the AWS distribution and invalidate it. Do not present browser probes as AWS evidence. |
| Diagnostic returns 403 | CloudFormation `EnableDiagnostics` value | Enable through a reviewed stack update if the exercise is intended; no game change is needed. |
| Response is 429 | Route throttle; other traffic | Wait at least ten seconds before another diagnostic. This response is throttling, not the requested 503. |
| Network/invalid response | CloudFront origin, API route/integration, HTTPS, config, browser errors | Compare direct API status with CloudFront status to isolate edge versus backend; never make the S3 bucket public to fix routing. |
| API 500/502 | Lambda logs, handler deployment, invoke permission, execution role | Fix the specific cause with a reviewed change set, then GET health again. |
| No application logs | Execution role resource ARN, log group, invocation count | Verify the function was invoked and can create a stream/write to its own group. |
| No alarm transition | Correct API ID/region, diagnostic 503 timestamp, metric data, alarm history | Allow delivery/evaluation time. A 403 or 429 is not 5xx. A 200 in the same minute does not erase the 503. |

Do not repeatedly trigger failures to force an alarm. Use the evidence to find the missing step.

## End the exercise

Verify a final 200 and normal game behavior. If public diagnostics are no longer needed, set `EnableDiagnostics=false` with CloudFormation. Record date, release, request sequence, metric period, observed alarm transitions, diagnosis, and recovery. Only claim steps actually observed. Redact unnecessary AWS identifiers and unrelated logs before publishing screenshots.
