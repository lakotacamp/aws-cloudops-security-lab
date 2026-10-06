import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const { Resources: resources } = JSON.parse(
  readFileSync(new URL("./template.json", import.meta.url), "utf8"),
);
test("route-specific stage settings wait for their API routes to exist", () => {
  for (const [stageId, stage] of Object.entries(resources)) {
    if (stage.Type !== "AWS::ApiGatewayV2::Stage") continue;
    for (const routeKey of Object.keys(stage.Properties.RouteSettings ?? {})) {
      const matchingRoute = Object.entries(resources).find(
        ([, item]) =>
          item.Type === "AWS::ApiGatewayV2::Route" &&
          item.Properties.RouteKey === routeKey &&
          JSON.stringify(item.Properties.ApiId) ===
            JSON.stringify(stage.Properties.ApiId),
      );
      assert.ok(
        matchingRoute,
        `${stageId} configures a nonexistent route: ${routeKey}`,
      );
      const dependencies = Array.isArray(stage.DependsOn)
        ? stage.DependsOn
        : [stage.DependsOn];
      assert.ok(
        dependencies.includes(matchingRoute[0]),
        `${stageId} must wait for ${matchingRoute[0]}`,
      );
    }
  }
});

test("the illustrator cannot widen diagnostic permissions or write the application assets", () => {
  assert.equal(resources.ExecutionRole.Properties.Policies.length, 1);
  assert.equal(
    resources.ExecutionRole.Properties.Policies[0].PolicyName,
    "WriteOwnLogs",
  );
  const statements =
    resources.IllustrationRole.Properties.Policies[0].PolicyDocument.Statement;
  const model = statements.find(
    (item) => item.Action === "bedrock:InvokeModel",
  );
  assert.match(
    model.Resource["Fn::Sub"],
    /us-west-2::foundation-model\/stability\.stable-image-core-v1:1$/,
  );
  const storage = statements.find((item) => item.Action === "s3:PutObject");
  assert.equal(
    storage.Resource["Fn::Sub"],
    "${SiteBucket.Arn}/illustrations/*",
  );
  assert.ok(!JSON.stringify(statements).includes("aws-marketplace:Subscribe"));
  assert.equal(
    resources.IllustrationAsyncConfig.Properties.MaximumRetryAttempts,
    0,
  );
});

test("a new deployment keeps paid illustration requests disabled until deliberately enabled", () => {
  const { Parameters } = JSON.parse(
    readFileSync(new URL("./template.json", import.meta.url), "utf8"),
  );
  assert.equal(Parameters.EnableIllustrations.Default, "false");
  assert.equal(Parameters.DailyImageLimit.Default, 20);
  assert.equal(Parameters.MonthlyImageLimit.Default, 200);
  assert.deepEqual(
    resources.IllustrationFunction.Properties.Environment.Variables
      .ENABLE_ILLUSTRATIONS,
    { Ref: "EnableIllustrations" },
  );
});
