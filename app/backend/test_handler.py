import contextlib
import io
import json
import os
import unittest
from unittest.mock import patch
from handler import handler


class HandlerTests(unittest.TestCase):
    def request(self, path="/api/status", method="GET", body=None):
        event = {"rawPath": path, "requestContext": {"requestId": "test-request-123", "http": {"method": method}}, "body": body}
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            response = handler(event, None)
        return response, json.loads(response["body"]), json.loads(output.getvalue())

    def test_health_has_correlatable_evidence_and_no_cache(self):
        response, body, log = self.request()
        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(response["headers"]["cache-control"], "no-store")
        self.assertEqual(body["requestId"], log["requestId"])
        self.assertEqual(body["source"], "local-api")

    @patch.dict(os.environ, {"ENABLE_DIAGNOSTICS": "true"})
    def test_diagnostic_fails_one_request_then_health_recovers(self):
        response, body, log = self.request("/api/diagnostic", "POST")
        self.assertEqual(response["statusCode"], 503)
        self.assertTrue(body["diagnostic"])
        self.assertTrue(log["diagnostic"])
        self.assertEqual(self.request()[0]["statusCode"], 200)

    @patch.dict(os.environ, {"ENABLE_DIAGNOSTICS": "false"})
    def test_diagnostics_can_be_disabled(self):
        self.assertEqual(self.request("/api/diagnostic", "POST")[0]["statusCode"], 403)

    def test_method_and_route_allowlist(self):
        for path, method in [("/api/status", "POST"), ("/api/diagnostic", "GET"), ("/api/private", "GET")]:
            self.assertEqual(self.request(path, method)[0]["statusCode"], 404)

    def test_bodies_rejected_and_never_logged(self):
        response, _, log = self.request(body="private-sentinel")
        self.assertEqual(response["statusCode"], 400)
        self.assertNotIn("private-sentinel", json.dumps(log))
        self.assertEqual(self.request(body="x" * 1025)[0]["statusCode"], 413)

    @patch.dict(os.environ, {"AWS_LAMBDA_FUNCTION_NAME": "test-only"})
    def test_cloud_source_requires_lambda_environment(self):
        self.assertEqual(self.request()[1]["source"], "aws")


if __name__ == "__main__":
    unittest.main()
