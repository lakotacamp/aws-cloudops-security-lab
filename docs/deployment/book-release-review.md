# Illustrated book release review

Status on 2026-10-06: the book interface and the approved RC2 infrastructure are deployed. CloudFormation reached UPDATE_COMPLETE with eleven added illustration resources and an in-place API stage update; no existing resource was replaced. The live Operations health probe returned HTTP 200 and retained its green styling. Model activation and the first live model-generated turn remain pending, so the public runtime configuration keeps image requests disabled.

## Experience

Each day is an open-book spread: a first-person diary and illustration face an interactive settlement map, resource ledger, and council decisions. Turning a day animates a leaf. Previous leaves reconstruct their own resource values from actual recorded deltas. Reading history cannot advance or overwrite the current expedition. Existing version-1 saves are supported; an anonymous edition UUID is persisted before requesting an image.

The diary is assembled deterministically from character-specific prose, the chosen task, actual resource changes, weather, shortages, and the ending. Critical water, food, and morale select Tovin, Sella, and Mara respectively; otherwise recovery selects Elian, foraging Sella, rain Tovin, and routine leadership Mara. It is not LLM-generated. Woodcuts are freshly AI-generated per edition/day, not drawn from a reused event bank.

## AWS changes to review

- Separate Python 3.13 illustrator Lambda, 256 MB, 150-second timeout; the diagnostic Lambda and role retain their existing permissions.
- Separate restricted IAM role: invoke only `stability.stable-image-core-v1:1` in `us-west-2`; write only `illustrations/*` in the existing private bucket; read/update its one DynamoDB table; invoke itself; write its own logs.
- DynamoDB on-demand table for idempotent jobs and atomic allowances. Job records are retained. Quota rows expire after 93 days.
- `POST /api/illustrations` and `GET /api/illustrations/{id}` routes. The request contains an edition UUID and up to 18 allowlisted choices; the server replays those choices and constructs the prompt. No arbitrary prompts, credentials, or personal data are accepted.
- Asynchronous worker with no automatic retries. A conditional job claim permits at most one model attempt per edition/day. Failed attempts still consume allowance. An interrupted job is shown as failed after five minutes and is never automatically regenerated.
- Original PNGs stored behind the existing private S3/CloudFront origin. Public paths contain opaque job hashes. A generated image is public to anyone with its URL.
- Seven-day logs, a failure metric, and a failure alarm. No notification subscription is added. Logs omit request bodies and prompts.

The main stack stays in `us-east-1`; only the Bedrock model request goes to `us-west-2`. Stable Image Core was observed ACTIVE in the account's model catalog on 2026-10-06. Model agreement availability was NOT_AVAILABLE, so the account owner must activate access before the first invocation. Nova Canvas and Titan Image Generator v2 have reached end of life and were not selected.

## Cost controls and limits

Default limits: **20 new jobs per UTC day and 200 per UTC month**, shared across all visitors. Both counters and the unique job are written in one DynamoDB transaction. A duplicate page request does not spend another allowance. The model SDK has one total attempt; async Lambda retries are disabled. Public visitors can exhaust the shared allowance, after which play and diaries continue without new art.

These are model-attempt limits, not an AWS billing cap. API traffic, database operations, Lambda, storage, delivery, logs, and the extra alarm can still incur charges. Confirm the model's current offer before activation. Images and the retained table continue to incur storage charges until deliberately cleaned up.

The account's Bedrock agreement offer, read on 2026-10-06 without accepting it, lists Stable Image Core output at **$0.04 per image** (`USW2_Created_image`). At that rate, 20 images cost $0.80 and 200 images cost $8.00, before the separate infrastructure charges above. The owner must review and authorize acceptance of the model offer, or accept it themselves; no model agreement was created during preparation. Setting either allowance to zero blocks every new job while existing plates remain readable.

## Deployment

Build and package a root-path release. In the extracted release directory:

```sh
bash deploy.sh hearthfall-live us-east-1 prepare-book
```

This creates an **unexecuted** change set with illustration limits 20/day and 200/month. Review added resources and IAM scope. The owner must approve the new runtime access and authorize acceptance of the model agreement before activation. Execute the reviewed change set, wait for UPDATE_COMPLETE, then:

```sh
bash deploy.sh hearthfall-live us-east-1 upload
```

Upload reads the stack's `EnableIllustrations` parameter and writes the matching runtime flag. GitHub Pages remains a browser edition and never sends image requests.

Verify: take one new turn, observe queued → generated, inspect the fresh woodcut, refresh and reopen the page, confirm no additional job/model attempt, and run a normal Operations health check. Inspect model/worker errors if the plate fails. This verification is still pending.

To stop new and in-flight workers before model invocation, update `EnableIllustrations=false`; upload the matching runtime config. Already-generated images remain viewable. Monthly/day counters are keyed by UTC date and do not need manual resets. Do not delete a job to retry it casually: doing so breaks its once-only generation guarantee.

## Primary AWS references

- [Stable Image Core request/response](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-diffusion-stable-image-core-text-image-request-response.html)
- [Model access and agreements](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html)
- [Bedrock pricing](https://aws.amazon.com/bedrock/pricing/)
