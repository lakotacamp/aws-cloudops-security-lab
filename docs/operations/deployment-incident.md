# Deployment incident: API stage raced its routes

## Symptom

The first AWS deployment on October 5, 2026 failed while creating the API Gateway HTTP API stage. CloudFormation reported that it could not find `POST /api/diagnostic` within the supplied route settings and rolled the stack back. This occurred before the application was published to AWS.

## Cause

The stage and routes both referenced the API, but the stage's throttle settings identified a route with a string key. That string created no CloudFormation dependency on the route resource. CloudFormation could therefore create the stage before the diagnostic route existed.

The template passed schema validation: the fields and values were valid. Validation did not prove that resources would be created in the required order.

## Change

Release [v0.2.1](https://github.com/lakotacamp/aws-cloudops-security-lab/releases/tag/v0.2.1) adds explicit `DependsOn` entries from `ApiStage` to `StatusRoute` and `DiagnosticRoute`. The service set, IAM permissions, public endpoints, and throttles are unchanged.

A regression test now checks that every route-specific stage setting matches a route belonging to the same API and explicitly depends on that route. [CI passed for the fix](https://github.com/lakotacamp/aws-cloudops-security-lab/actions/runs/37410420538).

## Recovery procedure

1. Inspect the first failed resource and its error in stack events; distinguish it from later rollback/cancellation messages.
2. Fix the generator, regenerate the template, run the regression test and CloudFormation lint, and publish a checksummed replacement archive.
3. Prepare and review a new change set. The original stack was in `ROLLBACK_COMPLETE`, so the retry uses the dedicated `hearthfall-live` stack.
4. Wait for stack completion before uploading files; verify the public request path and operational evidence separately.

The original template intentionally retains its S3 bucket on rollback. A failed stack must therefore be audited for retained resources; a rollback status alone is not proof of complete cleanup. See the deployment evidence for the observed outcome.

## Lesson

Infrastructure schema checks and a successful build are necessary but do not prove successful provisioning. When one resource refers to another through a plain string, inspect whether the deployment engine can infer the dependency. Keep deployment evidence separate from static validation claims.
