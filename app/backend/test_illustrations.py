import base64
import contextlib
import io
import json
import os
import unittest
from copy import deepcopy
from pathlib import Path
from unittest.mock import MagicMock, patch
import illustrations as app

EDITION = "12345678-1234-4123-8123-123456789abc"


class ConditionalFailure(Exception):
    def __init__(self, code):
        self.response = {"Error": {"Code": code}}


class Store:
    """Minimal atomic store used to exercise job and quota behavior together."""
    def __init__(self):
        self.items = {}
        self.counts = {}

    def get_item(self, **kw):
        item = self.items.get(kw["Key"]["id"]["S"])
        return {"Item": deepcopy(item)} if item else {}

    def transact_write_items(self, TransactItems):
        quotas = [t["Update"] for t in TransactItems[:2]]
        item = TransactItems[2]["Put"]["Item"]
        if item["id"]["S"] in self.items or any(self.counts.get(q["Key"]["id"]["S"], 0) >= int(q["ExpressionAttributeValues"][":limit"]["N"]) for q in quotas):
            raise ConditionalFailure("TransactionCanceledException")
        for quota in quotas:
            key = quota["Key"]["id"]["S"]
            self.counts[key] = self.counts.get(key, 0) + 1
        self.items[item["id"]["S"]] = deepcopy(item)

    def update_item(self, **kw):
        item = self.items[kw["Key"]["id"]["S"]]
        if kw.get("ConditionExpression") and item["status"]["S"] != "queued":
            raise ConditionalFailure("ConditionalCheckFailedException")
        values = kw["ExpressionAttributeValues"]
        item["status"] = values.get(":working", values.get(":state", values.get(":failed")))


class IllustrationTests(unittest.TestCase):
    def setUp(self):
        self.db = Store()
        self.functions = MagicMock()
        self.functions.invoke.return_value = {"StatusCode": 202}
        self.model = MagicMock()
        self.s3 = MagicMock()
        self.env = patch.dict(os.environ, {"ENABLE_ILLUSTRATIONS": "true", "IMAGE_TABLE": "test", "IMAGE_BUCKET": "test-bucket", "AWS_LAMBDA_FUNCTION_NAME": "test-illustrator", "DAILY_IMAGE_LIMIT": "2", "MONTHLY_IMAGE_LIMIT": "3"})
        self.env.start()
        self.clients = patch.object(app, "clients", return_value=(self.db, self.functions, self.model, self.s3))
        self.clients.start()
        self.addCleanup(self.env.stop)
        self.addCleanup(self.clients.stop)

    def call(self, data=None, path="/api/illustrations", method="POST", **extra):
        event = {"requestContext": {"http": {"method": method}}, "rawPath": path, "body": json.dumps(data if data is not None else {"editionId": EDITION, "choices": ["forage"]}), **extra}
        with contextlib.redirect_stdout(io.StringIO()):
            result = app.handler(event, None)
        return result["statusCode"], json.loads(result["body"])

    def test_retry_and_refresh_reuse_a_single_paid_job(self):
        status, first = self.call()
        self.assertEqual(status, 202)
        self.assertEqual(self.call()[0], 200)
        self.assertEqual(self.call()[1]["id"], first["id"])
        self.functions.invoke.assert_called_once()
        self.assertEqual(list(self.db.counts.values()), [1, 1])

    def test_limits_reject_new_jobs_without_consuming_partial_allowances(self):
        self.call()
        self.call({"editionId": EDITION, "choices": ["forage", "conserve"]})
        status, _ = self.call({"editionId": EDITION, "choices": ["forage", "conserve", "restore"]})
        self.assertEqual(status, 429)
        self.assertEqual(list(self.db.counts.values()), [2, 2])
        self.assertEqual(self.functions.invoke.call_count, 2)

    def test_no_arbitrary_prompt_or_invalid_game_can_reach_the_model(self):
        for data in [{"editionId": EDITION, "choices": ["forage"], "prompt": "untrusted"}, {"editionId": EDITION, "choices": ["attack"]}, {"editionId": EDITION, "choices": []}, {"editionId": EDITION, "choices": ["balanced"] * 18}, {"editionId": "not-a-uuid", "choices": ["forage"]}]:
            self.assertEqual(self.call(data)[0], 400)
        self.assertEqual(self.call(body="x" * 2049)[0], 413)
        self.assertFalse(self.db.items)
        self.model.invoke_model.assert_not_called()

    def test_zero_allowance_blocks_the_first_job_without_writing_or_dispatching(self):
        for setting in ("DAILY_IMAGE_LIMIT", "MONTHLY_IMAGE_LIMIT"):
            with self.subTest(setting=setting), patch.dict(os.environ, {setting: "0"}), patch.object(self.db, "transact_write_items") as transaction:
                self.assertEqual(self.call()[0], 429)
                transaction.assert_not_called()
        self.functions.invoke.assert_not_called()

    def test_different_choices_cannot_replace_an_existing_page(self):
        self.call()
        self.assertEqual(self.call({"editionId": EDITION, "choices": ["restore"]})[0], 409)
        self.functions.invoke.assert_called_once()

    def test_worker_duplicates_do_not_generate_twice_and_public_status_omits_choices(self):
        _, job = self.call()
        png = b"\x89PNG\r\n\x1a\n" + b"test-image"
        self.model.invoke_model.return_value = {"body": io.BytesIO(json.dumps({"images": [base64.b64encode(png).decode()], "finish_reasons": [None]}).encode())}
        with contextlib.redirect_stdout(io.StringIO()):
            event = {"kind": "woodcut-worker", "id": job["id"]}
            app.handler(event, None)
            app.handler(event, None)
        self.model.invoke_model.assert_called_once()
        self.s3.put_object.assert_called_once()
        status, public = self.call(path=f"/api/illustrations/{job['id']}", method="GET")
        self.assertEqual(status, 200)
        self.assertEqual(public["status"], "ready")
        self.assertNotIn("choices", public)
        self.assertTrue(public["imageUrl"].endswith(".png"))

    def test_model_failure_stays_failed_and_does_not_retry_or_release_budget(self):
        _, job = self.call()
        self.model.invoke_model.side_effect = RuntimeError("model unavailable")
        with contextlib.redirect_stdout(io.StringIO()):
            app.handler({"kind": "woodcut-worker", "id": job["id"]}, None)
            app.handler({"kind": "woodcut-worker", "id": job["id"]}, None)
        self.assertEqual(self.call()[1]["status"], "failed")
        self.assertEqual(list(self.db.counts.values()), [1, 1])
        self.model.invoke_model.assert_called_once()
        self.s3.put_object.assert_not_called()

    def test_http_input_cannot_enter_worker_branch_and_disabled_service_does_no_work(self):
        self.assertEqual(self.call(path="/api/private", kind="woodcut-worker", id="a" * 64)[0], 404)
        with patch.dict(os.environ, {"ENABLE_ILLUSTRATIONS": "false"}):
            self.assertEqual(self.call()[0], 503)
        self.assertFalse(self.db.items)

    def test_replay_uses_the_same_resources_weather_and_consequential_narrator(self):
        first = app.replay(["balanced"])
        self.assertEqual(first["state"], [137, 85, 23, 70])
        self.assertEqual(first["changes"], [-9, -7, -1, -2])
        self.assertEqual(first["weather"], "Clear")
        self.assertIn("Mara", first["narrator"])
        self.assertIn("Elian", app.replay(["restore"])["narrator"])
        self.assertIn("Sella", app.replay(["forage"])["narrator"])
        rain = app.replay(["balanced"] * 4)
        self.assertEqual(rain["weather"], "Rain")
        self.assertEqual(rain["changes"][1], 1)
        self.assertIn("Tovin", rain["narrator"])

    def test_shared_game_contract_including_weather_shortages_and_final_day(self):
        fixtures = json.loads((Path(__file__).parent.parent / "shared" / "chronicle-cases.json").read_text())
        for fixture in fixtures:
            with self.subTest(choices=fixture["choices"]):
                turn = app.replay(fixture["choices"])
                for key in ("state", "changes", "weather"):
                    self.assertEqual(turn[key], fixture[key])
                self.assertTrue(turn["narrator"].startswith(fixture["narrator"]))


if __name__ == "__main__":
    unittest.main()
