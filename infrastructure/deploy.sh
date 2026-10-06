#!/usr/bin/env bash
set -euo pipefail
stack="${1:-hearthfall-showcase}"
region="${2:-us-east-1}"
mode="${3:-prepare}"
[[ "$stack" =~ ^hearthfall-[a-z0-9-]+$ ]] || { echo 'Use a dedicated hearthfall-* stack name.' >&2; exit 1; }
[[ "$region" == 'us-east-1' ]] || { echo 'This release is reviewed for us-east-1.' >&2; exit 1; }
[[ -f template.json && -f dist/index.html && -f dist/runtime-config.json ]] || { echo 'Run from the extracted release directory.' >&2; exit 1; }
export AWS_PAGER=''
if [[ "$mode" == 'prepare' || "$mode" == 'prepare-book' ]]; then
  parameters=(EnableDiagnostics=true)
  if [[ "$mode" == 'prepare-book' ]]; then
    parameters+=(EnableIllustrations=true DailyImageLimit=20 MonthlyImageLimit=200)
  fi
  aws cloudformation validate-template --region "$region" --template-body file://template.json >/dev/null
  aws cloudformation deploy --region "$region" --stack-name "$stack" \
    --template-file template.json --capabilities CAPABILITY_IAM \
    --parameter-overrides "${parameters[@]}" \
    --tags Project=Hearthfall --no-execute-changeset --no-fail-on-empty-changeset
  printf '\nReview the unexecuted change set in CloudFormation before executing.\n'
  printf 'After stack completion: bash deploy.sh %s %s upload\n' "$stack" "$region"
elif [[ "$mode" == 'upload' ]]; then
  status=$(aws cloudformation describe-stacks --region "$region" --stack-name "$stack" --query 'Stacks[0].StackStatus' --output text)
  [[ "$status" == 'CREATE_COMPLETE' || "$status" == 'UPDATE_COMPLETE' ]] || { printf 'Stack is not ready: %s\n' "$status" >&2; exit 1; }
  output() { aws cloudformation describe-stacks --region "$region" --stack-name "$stack" --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue | [0]" --output text; }
  bucket=$(output SiteBucket)
  distribution=$(output DistributionId)
  illustrations=$(aws cloudformation describe-stacks --region "$region" --stack-name "$stack" --query "Stacks[0].Parameters[?ParameterKey=='EnableIllustrations'].ParameterValue | [0]" --output text)
  [[ "$illustrations" == 'true' ]] || illustrations=false
  printf '{"apiBaseUrl":"/api","illustrationsEnabled":%s}\n' "$illustrations" >dist/runtime-config.json
  [[ -n "$bucket" && "$bucket" != 'None' && -n "$distribution" && "$distribution" != 'None' ]] || { echo 'Missing stack outputs.' >&2; exit 1; }
  aws s3 sync dist/ "s3://$bucket/" --region "$region" --exclude 'assets/*' --cache-control 'no-cache'
  aws s3 sync dist/assets/ "s3://$bucket/assets/" --region "$region" --cache-control 'public,max-age=31536000,immutable'
  aws cloudfront create-invalidation --distribution-id "$distribution" --paths '/index.html' '/runtime-config.json' '/' >/dev/null
  printf '\nSite URL: %s\n' "$(output SiteUrl)"
  printf 'Verify health, diagnostic failure, logs, and alarm transitions using the runbook.\n'
else
  echo 'Mode must be prepare, prepare-book, or upload.' >&2
  exit 1
fi
