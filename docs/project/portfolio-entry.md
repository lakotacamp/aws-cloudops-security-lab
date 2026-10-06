# Hearthfall — portfolio entry

**Category:** Interactive application / AWS CloudOps

**Short description:** A playable colony simulator with deterministic rules, browser saves, and a failure/recovery console. Includes deployable AWS infrastructure with private S3 hosting, CloudFront, API Gateway, Lambda, and CloudWatch.

- [Live browser demo](https://lakotacamp.github.io/aws-cloudops-security-lab/)
- [Source and engineering record](https://github.com/lakotacamp/aws-cloudops-security-lab)
- [Architecture and security decisions](../architecture/hearthfall.md)
- [Incident runbook](../operations/runbooks/diagnostic-failure.md)
- [Desktop screenshot](../screenshots/hearthfall-desktop.jpg)

**Highlights:** deterministic TypeScript state transitions; validated local persistence; request-scoped diagnostic failures; least-privilege runtime IAM; infrastructure as code; structured logs and an API 5xx alarm; 15 automated tests plus build, lint, and CloudFormation checks.

**Stack:** React, TypeScript, Python, AWS CloudFormation, S3, CloudFront, API Gateway, Lambda, CloudWatch, GitHub Actions.

**Current deployment:** the live link runs the browser edition on GitHub Pages. AWS infrastructure is implemented and validated, but an AWS deployment and live CloudWatch alarm exercise have not yet been verified. Do not describe it as operating on AWS until that evidence exists.

**Contribution:** AI-assisted implementation directed by Lakota Camp. Describe personal design, review, testing, and operational work according to what was actually performed.
