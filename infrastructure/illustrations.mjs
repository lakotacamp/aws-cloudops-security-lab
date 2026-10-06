import { readFileSync } from "node:fs";

export function addIllustrations(template) {
  const ref = (name) => ({ Ref: name });
  const sub = (value) => ({ "Fn::Sub": value });
  const attr = (name, field) => ({ "Fn::GetAtt": [name, field] });
  const r = template.Resources;
  template.Description =
    "Hearthfall: private hosting, diagnostic API, and bounded asynchronous Bedrock woodcuts for a browser-owned colony.";
  Object.assign(template.Parameters, {
    EnableIllustrations: {
      Type: "String",
      Default: "false",
      AllowedValues: ["true", "false"],
      Description:
        "Enable public AI woodcut requests. Requires Stable Image Core model access in us-west-2 and incurs image charges.",
    },
    DailyImageLimit: {
      Type: "Number",
      Default: 20,
      MinValue: 0,
      MaxValue: 100,
      Description:
        "Maximum new image jobs per UTC day across the entire public site. Failed jobs consume allowance.",
    },
    MonthlyImageLimit: {
      Type: "Number",
      Default: 200,
      MinValue: 0,
      MaxValue: 1000,
      Description:
        "Maximum new image jobs per UTC month. This limits model attempts, not total AWS spend.",
    },
  });
  r.IllustrationTable = {
    Type: "AWS::DynamoDB::Table",
    DeletionPolicy: "Retain",
    UpdateReplacePolicy: "Retain",
    Properties: {
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      TimeToLiveSpecification: { AttributeName: "expires", Enabled: true },
      SSESpecification: { SSEEnabled: true },
      Tags: [{ Key: "Project", Value: "Hearthfall" }],
    },
  };
  r.IllustrationLogs = {
    Type: "AWS::Logs::LogGroup",
    Properties: {
      LogGroupName: sub("/aws/lambda/${AWS::StackName}-illustrator"),
      RetentionInDays: 7,
    },
  };
  r.IllustrationRole = {
    Type: "AWS::IAM::Role",
    Properties: {
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "lambda.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      },
      Policies: [
        {
          PolicyName: "BoundedWoodcutGeneration",
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: ["logs:CreateLogStream", "logs:PutLogEvents"],
                Resource: attr("IllustrationLogs", "Arn"),
              },
              {
                Effect: "Allow",
                Action: [
                  "dynamodb:GetItem",
                  "dynamodb:PutItem",
                  "dynamodb:UpdateItem",
                ],
                Resource: attr("IllustrationTable", "Arn"),
              },
              {
                Effect: "Allow",
                Action: "bedrock:InvokeModel",
                Resource: sub(
                  "arn:${AWS::Partition}:bedrock:us-west-2::foundation-model/stability.stable-image-core-v1:1",
                ),
              },
              {
                Effect: "Allow",
                Action: "s3:PutObject",
                Resource: sub("${SiteBucket.Arn}/illustrations/*"),
              },
              {
                Effect: "Allow",
                Action: "lambda:InvokeFunction",
                Resource: sub(
                  "arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:${AWS::StackName}-illustrator",
                ),
              },
            ],
          },
        },
      ],
    },
  };
  r.IllustrationFunction = {
    Type: "AWS::Lambda::Function",
    Properties: {
      FunctionName: sub("${AWS::StackName}-illustrator"),
      Runtime: "python3.13",
      Handler: "index.handler",
      MemorySize: 256,
      Timeout: 150,
      Role: attr("IllustrationRole", "Arn"),
      Environment: {
        Variables: {
          ENABLE_ILLUSTRATIONS: ref("EnableIllustrations"),
          DAILY_IMAGE_LIMIT: ref("DailyImageLimit"),
          MONTHLY_IMAGE_LIMIT: ref("MonthlyImageLimit"),
          IMAGE_TABLE: ref("IllustrationTable"),
          IMAGE_BUCKET: ref("SiteBucket"),
        },
      },
      Code: {
        ZipFile: readFileSync(
          new URL("../app/backend/illustrations.py", import.meta.url),
          "utf8",
        ),
      },
    },
  };
  r.IllustrationAsyncConfig = {
    Type: "AWS::Lambda::EventInvokeConfig",
    Properties: {
      FunctionName: ref("IllustrationFunction"),
      Qualifier: "$LATEST",
      MaximumRetryAttempts: 0,
      MaximumEventAgeInSeconds: 120,
    },
  };
  r.IllustrationIntegration = {
    Type: "AWS::ApiGatewayV2::Integration",
    Properties: {
      ApiId: ref("HttpApi"),
      IntegrationType: "AWS_PROXY",
      IntegrationUri: attr("IllustrationFunction", "Arn"),
      PayloadFormatVersion: "2.0",
      TimeoutInMillis: 10000,
    },
  };
  for (const [name, key] of [
    ["IllustrationCreateRoute", "POST /api/illustrations"],
    ["IllustrationStatusRoute", "GET /api/illustrations/{id}"],
  ]) {
    r[name] = {
      Type: "AWS::ApiGatewayV2::Route",
      Properties: {
        ApiId: ref("HttpApi"),
        RouteKey: key,
        Target: {
          "Fn::Join": ["/", ["integrations", ref("IllustrationIntegration")]],
        },
      },
    };
    r.ApiStage.DependsOn.push(name);
    r.ApiStage.Properties.RouteSettings[key] = {
      ThrottlingBurstLimit: key.startsWith("POST") ? 2 : 5,
      ThrottlingRateLimit: key.startsWith("POST") ? 0.2 : 2,
    };
  }
  r.IllustrationInvokePermission = {
    Type: "AWS::Lambda::Permission",
    Properties: {
      Action: "lambda:InvokeFunction",
      FunctionName: ref("IllustrationFunction"),
      Principal: "apigateway.amazonaws.com",
      SourceArn: sub(
        "arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${HttpApi}/*/*/api/illustrations*",
      ),
      SourceAccount: ref("AWS::AccountId"),
    },
  };
  r.IllustrationFailureMetric = {
    Type: "AWS::Logs::MetricFilter",
    Properties: {
      LogGroupName: ref("IllustrationLogs"),
      FilterPattern:
        '{ ($.event = "woodcut_failed") || ($.event = "woodcut_dispatch_failed") }',
      MetricTransformations: [
        {
          MetricNamespace: "Hearthfall/Illustrations",
          MetricName: sub("${AWS::StackName}-Failures"),
          MetricValue: "1",
          DefaultValue: 0,
        },
      ],
    },
  };
  r.IllustrationErrorAlarm = {
    Type: "AWS::CloudWatch::Alarm",
    Properties: {
      AlarmDescription:
        "A woodcut model or dispatch attempt failed. Inspect the illustrator logs. No notifications configured.",
      Namespace: "Hearthfall/Illustrations",
      MetricName: sub("${AWS::StackName}-Failures"),
      Statistic: "Sum",
      Period: 60,
      EvaluationPeriods: 1,
      Threshold: 1,
      ComparisonOperator: "GreaterThanOrEqualToThreshold",
      TreatMissingData: "notBreaching",
    },
  };
  template.Outputs.IllustrationTableName = { Value: ref("IllustrationTable") };
  template.Outputs.IllustrationLogGroup = { Value: ref("IllustrationLogs") };
}
