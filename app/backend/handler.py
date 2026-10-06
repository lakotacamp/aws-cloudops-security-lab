"""Stateless HTTP API probes. Colony state never enters this service."""
import json
import os
import time
import uuid
from datetime import datetime, timezone


def handler(event, context):
    started = time.perf_counter()
    request_context = event.get("requestContext") or {}
    http = request_context.get("http") or {}
    method = http.get("method", "")
    path = event.get("rawPath", "")
    request_id = request_context.get("requestId") or str(uuid.uuid4())
    source = "aws" if os.environ.get("AWS_LAMBDA_FUNCTION_NAME") else "local-api"
    route = "unknown"
    status = 404
    message = "Route not found."
    diagnostic = False
    if method == "GET" and path == "/api/status":
        route, status = "status", 200
        message = "Hearthfall API is responding. This probe verifies the API request path, not colony persistence or overall availability."
    elif method == "POST" and path == "/api/diagnostic":
        route = "diagnostic"
        if os.environ.get("ENABLE_DIAGNOSTICS", "false").lower() == "true":
            diagnostic, status = True, 503
            message = "Controlled diagnostic failure. Only this request was affected. Run a health probe to verify recovery."
        else:
            status = 403
            message = "Diagnostic requests are disabled in this deployment."
    if event.get("body"):
        status = 413 if len(event["body"]) > 1024 else 400
        diagnostic = False
        message = "These endpoints do not accept a request body."
    timestamp = datetime.now(timezone.utc).isoformat()
    duration_ms = round((time.perf_counter() - started) * 1000, 3)
    # Log only service-owned fields. Never log bodies, headers, query strings, or IPs.
    print(json.dumps({"event": "api_probe", "requestId": request_id,
                      "lambdaRequestId": getattr(context, "aws_request_id", None),
                      "route": route, "status": status, "diagnostic": diagnostic,
                      "durationMs": duration_ms, "timestamp": timestamp}))
    return {"statusCode": status,
            "headers": {"content-type": "application/json", "cache-control": "no-store",
                        "x-content-type-options": "nosniff"},
            "body": json.dumps({"service": "hearthfall-ops", "version": "0.2.0",
                                "source": source, "requestId": request_id,
                                "timestamp": timestamp, "diagnostic": diagnostic,
                                "message": message})}
