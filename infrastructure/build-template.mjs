import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const ref = (name) => ({ Ref: name });
const sub = (text) => ({ "Fn::Sub": text });
const attr = (name, field) => ({ "Fn::GetAtt": [name, field] });
const template = {
  AWSTemplateFormatVersion: "2010-09-09",
  Description:
    "Hearthfall: private static hosting, a stateless diagnostic API, and bounded operational evidence. No database or VPC.",
  Parameters: {
    EnableDiagnostics: {
      Type: "String",
      Default: "false",
      AllowedValues: ["true", "false"],
      Description:
        "Enable a public, request-scoped diagnostic 503. No persistent service changes.",
    },
    AllowedOrigin: {
      Type: "String",
      Default: "https://lakotacamp.github.io",
      Description:
        "Additional browser origin for direct API access; CloudFront uses same-origin /api requests.",
    },
  },
  Resources: {
    SiteBucket: {
      Type: "AWS::S3::Bucket",
      DeletionPolicy: "Retain",
      UpdateReplacePolicy: "Retain",
      Properties: {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        OwnershipControls: {
          Rules: [{ ObjectOwnership: "BucketOwnerEnforced" }],
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            { ServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } },
          ],
        },
        Tags: [{ Key: "Project", Value: "Hearthfall" }],
      },
    },
    OriginAccess: {
      Type: "AWS::CloudFront::OriginAccessControl",
      Properties: {
        OriginAccessControlConfig: {
          Name: sub("${AWS::StackName}-origin"),
          OriginAccessControlOriginType: "s3",
          SigningBehavior: "always",
          SigningProtocol: "sigv4",
        },
      },
    },
    LambdaLogs: {
      Type: "AWS::Logs::LogGroup",
      Properties: {
        LogGroupName: sub("/aws/lambda/${AWS::StackName}-api"),
        RetentionInDays: 7,
      },
    },
    ApiLogs: {
      Type: "AWS::Logs::LogGroup",
      Properties: { RetentionInDays: 7 },
    },
    ExecutionRole: {
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
            PolicyName: "WriteOwnLogs",
            PolicyDocument: {
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: ["logs:CreateLogStream", "logs:PutLogEvents"],
                  Resource: attr("LambdaLogs", "Arn"),
                },
              ],
            },
          },
        ],
      },
    },
    ApiFunction: {
      Type: "AWS::Lambda::Function",
      Properties: {
        FunctionName: sub("${AWS::StackName}-api"),
        Runtime: "python3.13",
        Handler: "index.handler",
        MemorySize: 128,
        Timeout: 3,
        Role: attr("ExecutionRole", "Arn"),
        Environment: {
          Variables: { ENABLE_DIAGNOSTICS: ref("EnableDiagnostics") },
        },
        Code: {
          ZipFile: readFileSync(
            new URL("../app/backend/handler.py", import.meta.url),
            "utf8",
          ),
        },
      },
    },
    HttpApi: {
      Type: "AWS::ApiGatewayV2::Api",
      Properties: {
        Name: sub("${AWS::StackName}-api"),
        ProtocolType: "HTTP",
        CorsConfiguration: {
          AllowOrigins: [ref("AllowedOrigin")],
          AllowMethods: ["GET", "POST"],
          AllowHeaders: ["content-type"],
          MaxAge: 300,
        },
      },
    },
    ApiIntegration: {
      Type: "AWS::ApiGatewayV2::Integration",
      Properties: {
        ApiId: ref("HttpApi"),
        IntegrationType: "AWS_PROXY",
        IntegrationUri: attr("ApiFunction", "Arn"),
        PayloadFormatVersion: "2.0",
        TimeoutInMillis: 5000,
      },
    },
    StatusRoute: {
      Type: "AWS::ApiGatewayV2::Route",
      Properties: {
        ApiId: ref("HttpApi"),
        RouteKey: "GET /api/status",
        Target: { "Fn::Join": ["/", ["integrations", ref("ApiIntegration")]] },
      },
    },
    DiagnosticRoute: {
      Type: "AWS::ApiGatewayV2::Route",
      Properties: {
        ApiId: ref("HttpApi"),
        RouteKey: "POST /api/diagnostic",
        Target: { "Fn::Join": ["/", ["integrations", ref("ApiIntegration")]] },
      },
    },
    ApiStage: {
      Type: "AWS::ApiGatewayV2::Stage",
      // RouteSettings keys are plain strings, so CloudFormation cannot infer these dependencies.
      DependsOn: ["StatusRoute", "DiagnosticRoute"],
      Properties: {
        ApiId: ref("HttpApi"),
        StageName: "$default",
        AutoDeploy: true,
        DefaultRouteSettings: {
          ThrottlingBurstLimit: 5,
          ThrottlingRateLimit: 2,
        },
        RouteSettings: {
          "POST /api/diagnostic": {
            ThrottlingBurstLimit: 1,
            ThrottlingRateLimit: 0.1,
          },
        },
        AccessLogSettings: {
          DestinationArn: attr("ApiLogs", "Arn"),
          Format:
            '{"requestId":"$context.requestId","route":"$context.routeKey","status":"$context.status","responseLatency":"$context.responseLatency"}',
        },
      },
    },
    InvokePermission: {
      Type: "AWS::Lambda::Permission",
      Properties: {
        Action: "lambda:InvokeFunction",
        FunctionName: ref("ApiFunction"),
        Principal: "apigateway.amazonaws.com",
        SourceArn: sub(
          "arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${HttpApi}/*/*/api/*",
        ),
        SourceAccount: ref("AWS::AccountId"),
      },
    },
    StaticCache: {
      Type: "AWS::CloudFront::CachePolicy",
      Properties: {
        CachePolicyConfig: {
          Name: sub("${AWS::StackName}-static"),
          DefaultTTL: 3600,
          MinTTL: 0,
          MaxTTL: 31536000,
          ParametersInCacheKeyAndForwardedToOrigin: {
            EnableAcceptEncodingGzip: true,
            EnableAcceptEncodingBrotli: true,
            CookiesConfig: { CookieBehavior: "none" },
            HeadersConfig: { HeaderBehavior: "none" },
            QueryStringsConfig: { QueryStringBehavior: "none" },
          },
        },
      },
    },
    ApiCache: {
      Type: "AWS::CloudFront::CachePolicy",
      Properties: {
        CachePolicyConfig: {
          Name: sub("${AWS::StackName}-api-no-cache"),
          DefaultTTL: 0,
          MinTTL: 0,
          MaxTTL: 0,
          ParametersInCacheKeyAndForwardedToOrigin: {
            EnableAcceptEncodingGzip: false,
            EnableAcceptEncodingBrotli: false,
            CookiesConfig: { CookieBehavior: "none" },
            HeadersConfig: { HeaderBehavior: "none" },
            QueryStringsConfig: { QueryStringBehavior: "none" },
          },
        },
      },
    },
    SecurityHeaders: {
      Type: "AWS::CloudFront::ResponseHeadersPolicy",
      Properties: {
        ResponseHeadersPolicyConfig: {
          Name: sub("${AWS::StackName}-headers"),
          SecurityHeadersConfig: {
            ContentTypeOptions: { Override: true },
            FrameOptions: { FrameOption: "DENY", Override: true },
            ReferrerPolicy: {
              ReferrerPolicy: "strict-origin-when-cross-origin",
              Override: true,
            },
            StrictTransportSecurity: {
              AccessControlMaxAgeSec: 31536000,
              IncludeSubdomains: true,
              Override: true,
            },
            ContentSecurityPolicy: {
              ContentSecurityPolicy:
                "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
              Override: true,
            },
          },
        },
      },
    },
    Distribution: {
      Type: "AWS::CloudFront::Distribution",
      Properties: {
        DistributionConfig: {
          Enabled: true,
          DefaultRootObject: "index.html",
          HttpVersion: "http2and3",
          IPV6Enabled: true,
          PriceClass: "PriceClass_100",
          Comment: "Hearthfall static app and diagnostic API",
          ViewerCertificate: { CloudFrontDefaultCertificate: true },
          Origins: [
            {
              Id: "static",
              DomainName: attr("SiteBucket", "RegionalDomainName"),
              OriginAccessControlId: ref("OriginAccess"),
              S3OriginConfig: { OriginAccessIdentity: "" },
            },
            {
              Id: "api",
              DomainName: sub(
                "${HttpApi}.execute-api.${AWS::Region}.amazonaws.com",
              ),
              CustomOriginConfig: {
                OriginProtocolPolicy: "https-only",
                OriginSSLProtocols: ["TLSv1.2"],
              },
            },
          ],
          DefaultCacheBehavior: {
            TargetOriginId: "static",
            ViewerProtocolPolicy: "redirect-to-https",
            AllowedMethods: ["GET", "HEAD"],
            Compress: true,
            CachePolicyId: ref("StaticCache"),
            ResponseHeadersPolicyId: ref("SecurityHeaders"),
          },
          CacheBehaviors: [
            {
              PathPattern: "/api/*",
              TargetOriginId: "api",
              ViewerProtocolPolicy: "https-only",
              AllowedMethods: [
                "GET",
                "HEAD",
                "OPTIONS",
                "PUT",
                "PATCH",
                "POST",
                "DELETE",
              ],
              CachedMethods: ["GET", "HEAD"],
              CachePolicyId: ref("ApiCache"),
              ResponseHeadersPolicyId: ref("SecurityHeaders"),
              Compress: true,
            },
          ],
        },
      },
    },
    BucketPolicy: {
      Type: "AWS::S3::BucketPolicy",
      Properties: {
        Bucket: ref("SiteBucket"),
        PolicyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "CloudFrontReadOnly",
              Effect: "Allow",
              Principal: { Service: "cloudfront.amazonaws.com" },
              Action: "s3:GetObject",
              Resource: sub("${SiteBucket.Arn}/*"),
              Condition: {
                StringEquals: {
                  "AWS:SourceArn": sub(
                    "arn:${AWS::Partition}:cloudfront::${AWS::AccountId}:distribution/${Distribution}",
                  ),
                },
              },
            },
            {
              Sid: "RequireTLS",
              Effect: "Deny",
              Principal: "*",
              Action: "s3:*",
              Resource: [attr("SiteBucket", "Arn"), sub("${SiteBucket.Arn}/*")],
              Condition: { Bool: { "aws:SecureTransport": "false" } },
            },
          ],
        },
      },
    },
    ApiFailureAlarm: {
      Type: "AWS::CloudWatch::Alarm",
      Properties: {
        AlarmDescription:
          "One or more API 5xx responses, including intentional diagnostics. Follow the diagnostic-failure runbook. No notification subscriptions are created.",
        Namespace: "AWS/ApiGateway",
        MetricName: "5xx",
        Dimensions: [{ Name: "ApiId", Value: ref("HttpApi") }],
        Statistic: "Sum",
        Period: 60,
        EvaluationPeriods: 1,
        DatapointsToAlarm: 1,
        Threshold: 1,
        ComparisonOperator: "GreaterThanOrEqualToThreshold",
        TreatMissingData: "notBreaching",
      },
    },
    Dashboard: {
      Type: "AWS::CloudWatch::Dashboard",
      Properties: {
        DashboardBody: sub(
          JSON.stringify({
            widgets: [
              {
                type: "metric",
                x: 0,
                y: 0,
                width: 12,
                height: 6,
                properties: {
                  title:
                    "API requests and failures (intentional diagnostics included)",
                  region: "${AWS::Region}",
                  period: 60,
                  stat: "Sum",
                  metrics: [
                    ["AWS/ApiGateway", "Count", "ApiId", "${HttpApi}"],
                    [".", "5xx", ".", "."],
                    [".", "4xx", ".", "."],
                  ],
                },
              },
              {
                type: "metric",
                x: 12,
                y: 0,
                width: 12,
                height: 6,
                properties: {
                  title: "Lambda duration (ms)",
                  region: "${AWS::Region}",
                  period: 60,
                  stat: "Average",
                  metrics: [
                    [
                      "AWS/Lambda",
                      "Duration",
                      "FunctionName",
                      "${ApiFunction}",
                    ],
                  ],
                },
              },
              {
                type: "alarm",
                x: 0,
                y: 6,
                width: 24,
                height: 3,
                properties: {
                  title: "API failure detection",
                  alarms: ["${ApiFailureAlarm.Arn}"],
                },
              },
            ],
          }),
        ),
      },
    },
  },
  Outputs: {
    SiteUrl: { Value: sub("https://${Distribution.DomainName}") },
    SiteBucket: { Value: ref("SiteBucket") },
    DistributionId: { Value: ref("Distribution") },
    ApiBaseUrl: {
      Value: sub(
        "https://${HttpApi}.execute-api.${AWS::Region}.amazonaws.com/api",
      ),
    },
    LambdaLogGroup: { Value: ref("LambdaLogs") },
    ApiLogGroup: { Value: ref("ApiLogs") },
    AlarmName: { Value: ref("ApiFailureAlarm") },
    DashboardName: { Value: ref("Dashboard") },
  },
};
const destination = new URL("./template.json", import.meta.url);
const output = JSON.stringify(template, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(destination, "utf8") !== output)
    throw new Error(
      "template.json is stale. Run node infrastructure/build-template.mjs",
    );
  console.log("CloudFormation template matches its sources.");
} else {
  writeFileSync(destination, output);
  console.log(
    `Generated ${fileURLToPath(destination)} (${Buffer.byteLength(output)} bytes)`,
  );
}
