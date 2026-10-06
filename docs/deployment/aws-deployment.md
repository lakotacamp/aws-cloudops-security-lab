# AWS deployment, cost, and cleanup

Target: a dedicated `hearthfall-showcase` CloudFormation stack in `us-east-1`. The repository includes an implementation; confirm actual deployment separately. Do not reuse an unrelated stack or bucket.

## Cost review before creation

Planning estimate for a small portfolio workload: **roughly $0–$5/month**, assuming fewer than 10,000 API requests, 1 GB of delivered content, and 0.1 GB of logs per month. This is an estimate, **not a cap**. Taxes, other account usage, traffic geography, and exhausted free allowances can change the bill. Review the account's actual pricing and allowances first.

| Resource / purpose | Cost model and idle behavior | Main surprise / cheaper alternative |
| --- | --- | --- |
| S3 / store the built site | Storage and requests; the small retained site continues to use billable storage while idle. | Old releases or retained buckets accumulate. GitHub Pages removes this AWS storage charge. |
| CloudFront / HTTPS and private-origin delivery | Requests and data transfer; no instance to pay for at idle. Uses standard pay-as-you-go, not a purchased subscription. | Popularity or abuse can generate delivery charges after applicable allowances. Pages is a lower-cost browser-only option. |
| HTTP API / request routing | About $1/million requests at the initial US East tier; no idle compute. | Throttling is best effort, not a spending limit. Static-only mode removes API usage and live API evidence. |
| Lambda / health and diagnostics | Invocations and GB-seconds at 128 MB; no provisioned concurrency or idle instance. | Repeated requests and long-running code increase usage. There are no outbound service calls or paid model calls. |
| CloudWatch / logs, dashboard, alarm | Budget approximately $3/month for a dashboard plus $0.10/month for one standard alarm before free allowances; log ingestion/storage additional. Logs retained seven days. | Dashboard/alarm can bill while idle; queries and verbose logs add usage. Native metric screens without a custom dashboard are cheaper but less convenient. |
| IAM / runtime log permission | No separate IAM charge. | Excess permissions are an access risk; this role can only write its own logs. |

The fixed planning allowance is approximately $3.10/month plus tiny storage, before free allowances. AWS Budgets alerts are advisable but are not a hard stop and are not created by this template. No NAT gateway, EC2, database, domain purchase, WAF, or notification subscription is provisioned.

Pricing references, reviewed October 2026: [CloudWatch](https://aws.amazon.com/cloudwatch/pricing/), [HTTP API](https://aws.amazon.com/api-gateway/pricing/), [Lambda](https://aws.amazon.com/lambda/pricing/), [CloudFront](https://aws.amazon.com/cloudfront/pricing/), [S3](https://aws.amazon.com/s3/pricing/). Check current regional rates at deployment.

## Build and validate

From the repository root:

```sh
npm --prefix app/frontend ci
npm --prefix app/frontend test
npm --prefix app/frontend run lint
npm --prefix app/frontend run build
python -m unittest discover -s app/backend -p 'test_*.py' -v
node infrastructure/build-template.mjs --check
pip install -r infrastructure/requirements-validation.txt
cfn-lint infrastructure/template.json
node infrastructure/package-release.mjs
```

The packager prints an ignored `.artifacts/release-*` directory containing only `dist`, `template.json`, and `deploy.sh`. Its runtime configuration uses same-origin `/api`. Zip **the contents** of that directory for a CloudShell upload. It contains no credentials, `.git`, private configuration, or source dependencies.

## Deploy using AWS Console and CloudShell

1. Sign in with an authorized IAM/SSO identity. Select **US East (N. Virginia)**. Use the console's CloudShell; do not copy session credentials to the repository.
2. Review the cost table, generated template, and deployment script. It creates a public CloudFront site and stateless API, plus a restricted Lambda execution role. CloudFormation requires `CAPABILITY_IAM` acknowledgement.
3. Upload the release ZIP with **CloudShell → Actions → Upload file**. Unzip into a new empty directory and enter that directory.
4. Run `bash deploy.sh hearthfall-showcase us-east-1`. The script first creates an unexecuted change set and prints a review command. It does not create resources at this stage.
5. Review the change set in CloudFormation, including IAM, S3 access policies, and public API/distribution. Execute it only after accepting the resource scope and usage charges.
6. Wait for `CREATE_COMPLETE` or `UPDATE_COMPLETE`, then run `bash deploy.sh hearthfall-showcase us-east-1 upload`. The script verifies stack completion, uploads static files, applies cache metadata, and invalidates entry/config files. It does not delete old assets.
7. Open the printed SiteUrl. Complete the verification below before describing the project as operating on AWS.

The deploying identity needs permissions to create/update the listed CloudFormation resources, pass the Lambda role, upload to the project bucket, and invalidate the project distribution. Runtime permissions are much narrower. An account SCP, permission boundary, resource quota, or service restriction can still block deployment even when schema validation passes.

## Verification checklist

- CloudFormation reports completion with no failed resources.
- CloudFront site loads over HTTPS; config is `/api`; browser console has no unexpected errors.
- Direct anonymous S3 object requests are denied; inspect all four Block Public Access settings and the OAC-scoped bucket policy.
- Colony changes survive refresh; operations probes do not change colony resources.
- GET `/api/status` returns 200, `source: aws`, a fresh request ID, and `cache-control: no-store`.
- POST `/api/diagnostic` returns 503 when enabled; GET returns 200 afterward. Do not repeatedly hammer the endpoint.
- Both IDs correlate with structured Lambda and API access logs.
- CloudWatch API 5xx metric records the diagnostic; the alarm reaches ALARM and later OK. Allow several minutes and inspect timestamps. Missing data is treated as non-breaching.
- Inspect actual CSP/security headers and asset cache headers at the CloudFront URL.
- Record sanitized evidence. Do not publish account IDs, private console URLs, credentials, unrelated resources, or full log exports.

Follow the [diagnostic runbook](../operations/runbooks/diagnostic-failure.md). A UI 200 → 503 → 200 alone does not verify CloudWatch alarm delivery.

## Updates and rollback

Keep the previous release ZIP locally. Review an infrastructure change set before applying it. For frontend rollback, upload the previous `dist` with the same cache rules and invalidate `/index.html` and `/runtime-config.json`. Hashed assets remain immutable; keeping previous assets supports rollback and already-open clients.

Disable public diagnostics by updating `EnableDiagnostics=false` through CloudFormation. This changes POST to 403 while preserving health checks. It is not a general traffic or billing kill switch.

## Cleanup

Export only the evidence you need before deleting logs. Identify the exact stack, region, `SiteBucket`, and distribution from stack Outputs. Confirm the bucket contains only this project's release files.

Delete the dedicated stack in CloudFormation and wait for completion. This removes the API, Lambda, execution role, dashboard, alarm, log groups, distribution, and OAC. **The S3 bucket is retained intentionally**, protecting static assets from accidental stack removal. After confirming the contents are no longer needed, empty and delete that exact bucket through S3. This last action permanently removes those files. Check Billing after usage has settled; deleting a stack does not cancel already-incurred charges.

## Browser-only publication

The `Publish browser demo` GitHub Actions workflow builds at `/aws-cloudops-security-lab/` and uses GitHub Pages. Enable Pages with **GitHub Actions** as the source. It ships an empty API configuration, so the page clearly labels simulated probes. It does not create AWS resources or prove AWS operation.
