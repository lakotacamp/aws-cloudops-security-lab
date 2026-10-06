# Hearthfall — portfolio entry

**Category:** Interactive application / AWS CloudOps

**Short description:** A playable colony simulator deployed on AWS, with deterministic rules, browser saves, and a real API failure/recovery console. Private S3 and CloudFront deliver the app; API Gateway, Lambda, and CloudWatch provide an inspectable operations environment.

- [Live AWS application](https://d1ka8cpbx2rxkb.cloudfront.net/)
- [Browser-only fallback](https://lakotacamp.github.io/aws-cloudops-security-lab/)
- [Source and engineering record](https://github.com/lakotacamp/aws-cloudops-security-lab)
- [Architecture and security decisions](../architecture/hearthfall.md)
- [Incident runbook](../operations/runbooks/diagnostic-failure.md)
- [AWS verification evidence](../operations/aws-verification.md)
- [Deployment failure and fix](../operations/deployment-incident.md)
- [Desktop screenshot](../screenshots/hearthfall-desktop.jpg)

**Highlights:** deterministic TypeScript state transitions; validated local persistence; request-scoped diagnostic failures; restricted runtime IAM; infrastructure as code; correlated Lambda and API logs; an API 5xx alarm; 16 automated tests plus build, lint, and CloudFormation checks.

**Stack:** React, TypeScript, Python, AWS CloudFormation, S3, CloudFront, API Gateway, Lambda, CloudWatch, GitHub Actions.

**Current deployment:** AWS stack completed October 5, 2026 (America/New_York). Verified the public CloudFront site, browser save persistence, a real 200 → 503 → 200 sequence, correlated AWS logs, CloudWatch **OK → ALARM → OK**, and denial of anonymous S3 access. The verification record separates observed evidence from implemented controls and limitations.

**Contribution:** AI-assisted implementation directed by Lakota Camp. Describe personal design, review, testing, and operational work according to what was actually performed.
