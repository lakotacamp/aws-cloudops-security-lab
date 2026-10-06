"""Bounded, idempotent woodcut jobs. No browser-supplied prompts are accepted."""
import base64
import hashlib
import json
import os
import re
import time
from datetime import datetime, timezone

MODEL = "stability.stable-image-core-v1:1"
CHANGES = {"balanced": (-9, -7, -1, -2), "forage": (12, -11, -1, -1), "conserve": (-4, -3, 0, -5), "restore": (-12, -9, -2, 12)}
LIMITS = (200, 160, 50, 100)


def replay(choices):
    if not isinstance(choices, list) or not 1 <= len(choices) <= 18 or any(not isinstance(p, str) or p not in CHANGES for p in choices):
        raise ValueError("Invalid choices")
    state = [146, 92, 24, 72]
    for day, priority in enumerate(choices, 13):
        if any(state[i] == 0 for i in (0, 1, 3)):
            raise ValueError("Expedition already ended")
        weather = ("Rain", "Clear", "Overcast", "Frost")[day % 4]
        before = state[:]
        changes = list(CHANGES[priority])
        if weather == "Rain":
            changes[1] += 8
        if weather == "Frost":
            changes[0] -= 3
            changes[3] -= 2
        state = [min(max(value + delta, 0), maximum) for value, delta, maximum in zip(state, changes, LIMITS)]
    narrator = "Tovin Reed, the field engineer" if state[1] < 18 else "Sella Myr, the forager" if state[0] < 25 else "Mara Venn, the survey captain" if state[3] < 20 else "Elian Cor, the medic" if priority == "restore" else "Sella Myr, the forager" if priority == "forage" else "Tovin Reed, the field engineer" if weather == "Rain" else "Mara Venn, the survey captain"
    return {"day": day, "priority": priority, "weather": weather, "state": state, "changes": [a - b for a, b in zip(state, before)], "narrator": narrator}


def image_prompt(turn):
    scene = {
        "balanced": "Three settlers dominate the foreground: Mara hands a loaf of bread to a waiting settler while a watchkeeper stands beside their ration table.",
        "forage": "Three foragers dominate the foreground: Sella and two companions walk toward us carrying large woven baskets full of gathered provisions, returning from the pine woodland.",
        "conserve": "Three settlers dominate the foreground: Mara measures a small ration at a rough table, while two tired settlers hold out wooden bowls.",
        "restore": "Three settlers dominate the foreground: the medic Elian kneels beside an open medicine chest and tends a seated settler while their companion serves a steaming bowl beside a cookfire.",
    }[turn["priority"]]
    weather = {"Rain": "Rain falls on timber roofs and collection barrels.", "Frost": "Frost lies on roofs and provisions; settlers draw wool coats close.", "Overcast": "Clouds cover the northern ridge.", "Clear": "A clear sky above the northern ridge."}[turn["weather"]]
    return (f"{scene} The human figures and their action occupy most of the picture; their hands and tools are clearly visible. "
            "An authentic seventeenth-century narrative woodcut for the fictional history book Hearthfall. "
            "Dark umber ink on warm ivory paper, bold irregular hand-carved lines, dense cross-hatching, worn print edges, fine rectangular engraved border. "
            f"This is the event from day {turn['day']}'s diary, witnessed by {turn['narrator']}. {weather} "
            "Flat printed artwork, landscape composition. A few timber cottages and pine trees recede into a simple background. "
            "Plain historical wool and linen clothes, wooden tools. Quiet human storytelling. No lettering, labels, numbers, modern technology, photograph, book mockup or fantasy creatures.")


def clients():
    import boto3
    from botocore.config import Config
    # Never retry a possibly billed model invocation automatically.
    config = Config(connect_timeout=5, read_timeout=120, retries={"total_max_attempts": 1})
    return (boto3.client("dynamodb", config=config), boto3.client("lambda", config=config),
            boto3.client("bedrock-runtime", region_name="us-west-2", config=config), boto3.client("s3", config=config))


def response(status, payload):
    return {"statusCode": status, "headers": {"content-type": "application/json", "cache-control": "no-store", "x-content-type-options": "nosniff"}, "body": json.dumps(payload)}


def error_code(exc):
    return getattr(exc, "response", {}).get("Error", {}).get("Code", type(exc).__name__)


def get_job(db, table, job_id):
    return db.get_item(TableName=table, Key={"id": {"S": job_id}}, ConsistentRead=True).get("Item")


def public_job(item):
    status = item["status"]["S"]
    if status in ("queued", "working") and time.time() - int(item["created"]["N"]) > 300:
        status = "failed"
    result = {"id": item["id"]["S"], "status": status}
    if status == "ready":
        result["imageUrl"] = f"/illustrations/{item['id']['S']}.png"
    return result


def quota_update(table, key, limit, expiry):
    return {"Update": {"TableName": table, "Key": {"id": {"S": key}},
                       "UpdateExpression": "SET #n = if_not_exists(#n, :zero) + :one, expires = :expires",
                       "ConditionExpression": "attribute_not_exists(#n) OR #n < :limit",
                       "ExpressionAttributeNames": {"#n": "count"},
                       "ExpressionAttributeValues": {":zero": {"N": "0"}, ":one": {"N": "1"}, ":limit": {"N": str(limit)}, ":expires": {"N": str(expiry)}}}}


def run_worker(job_id, db, bedrock, s3, table):
    item = get_job(db, table, job_id)
    if not item or item["status"]["S"] != "queued":
        return
    try:
        db.update_item(TableName=table, Key={"id": {"S": job_id}}, UpdateExpression="SET #s = :working", ConditionExpression="#s = :queued",
                       ExpressionAttributeNames={"#s": "status"}, ExpressionAttributeValues={":working": {"S": "working"}, ":queued": {"S": "queued"}})
    except Exception as exc:
        if error_code(exc) == "ConditionalCheckFailedException":
            return
        raise
    try:
        turn = replay(json.loads(item["choices"]["S"]))
        result = bedrock.invoke_model(modelId=MODEL, contentType="application/json", accept="application/json", body=json.dumps({"prompt": image_prompt(turn), "aspect_ratio": "3:2", "output_format": "png", "seed": int(job_id[:8], 16), "negative_prompt": "photograph, 3D render, text, typography, lettering, watermark, modern clothing, modern machinery, bright colors"}))
        generated = json.loads(result["body"].read())
        if generated.get("finish_reasons", [None])[0] is not None:
            raise ValueError("Image filtered")
        image = base64.b64decode(generated["images"][0], validate=True)
        if not image.startswith(b"\x89PNG\r\n\x1a\n") or len(image) > 12_000_000:
            raise ValueError("Invalid image")
        s3.put_object(Bucket=os.environ["IMAGE_BUCKET"], Key=f"illustrations/{job_id}.png", Body=image, ContentType="image/png", CacheControl="public,max-age=31536000,immutable", ServerSideEncryption="AES256")
        state = "ready"
    except Exception as exc:
        state = "failed"
        print(json.dumps({"event": "woodcut_failed", "jobId": job_id, "code": error_code(exc)}))
    db.update_item(TableName=table, Key={"id": {"S": job_id}}, UpdateExpression="SET #s = :state", ExpressionAttributeNames={"#s": "status"}, ExpressionAttributeValues={":state": {"S": state}})
    print(json.dumps({"event": "woodcut_finished", "jobId": job_id, "status": state}))


def handler(event, context):
    table = os.environ.get("IMAGE_TABLE", "")
    if os.environ.get("ENABLE_ILLUSTRATIONS") != "true":
        return response(503, {"message": "The illustrator is disabled."})
    db, functions, bedrock, s3 = clients()
    # An HTTP payload cannot enter the worker branch: API Gateway always supplies requestContext.
    if "requestContext" not in event and event.get("kind") == "woodcut-worker":
        job_id = event.get("id", "")
        if isinstance(job_id, str) and re.fullmatch(r"[a-f0-9]{64}", job_id):
            run_worker(job_id, db, bedrock, s3, table)
        return {"processed": True}
    method = event.get("requestContext", {}).get("http", {}).get("method")
    path = event.get("rawPath", "")
    if method == "GET" and re.fullmatch(r"/api/illustrations/[a-f0-9]{64}", path):
        item = get_job(db, table, path.rsplit("/", 1)[1])
        return response(200, public_job(item)) if item else response(404, {"message": "Plate not found."})
    if method != "POST" or path != "/api/illustrations":
        return response(404, {"message": "Route not found."})
    raw = event.get("body") or ""
    if not isinstance(raw, str) or len(raw) > 2048:
        return response(413, {"message": "Request too large."})
    try:
        if event.get("isBase64Encoded"):
            raw = base64.b64decode(raw, validate=True).decode("utf-8")
        data = json.loads(raw)
        if not isinstance(data, dict) or set(data) != {"editionId", "choices"}:
            raise ValueError("Unknown fields")
        edition = data["editionId"]
        if not isinstance(edition, str) or not re.fullmatch(r"[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}", edition):
            raise ValueError("Invalid edition")
        turn = replay(data["choices"])
    except (ValueError, TypeError, KeyError, UnicodeError):
        return response(400, {"message": "A valid edition and recorded choices are required."})
    job_id = hashlib.sha256(f"woodcut-v1:{edition}:{turn['day']}".encode()).hexdigest()
    encoded_choices = json.dumps(data["choices"], separators=(",", ":"))
    item = get_job(db, table, job_id)
    if item:
        if item["choices"]["S"] != encoded_choices:
            return response(409, {"message": "This page already has a different account."})
        return response(200, public_job(item))
    daily_limit = int(os.environ.get("DAILY_IMAGE_LIMIT", "20"))
    monthly_limit = int(os.environ.get("MONTHLY_IMAGE_LIMIT", "200"))
    if daily_limit <= 0 or monthly_limit <= 0:
        return response(429, {"message": "The illustration allowance is exhausted. Try later."})
    now = datetime.now(timezone.utc)
    created = int(now.timestamp())
    item = {"id": {"S": job_id}, "status": {"S": "queued"}, "created": {"N": str(created)}, "choices": {"S": encoded_choices}}
    try:
        # All three writes succeed together. Failed claims never consume a partial allowance.
        db.transact_write_items(TransactItems=[
            quota_update(table, now.strftime("quota-day-%Y-%m-%d"), daily_limit, created + 93 * 86400),
            quota_update(table, now.strftime("quota-month-%Y-%m"), monthly_limit, created + 93 * 86400),
            {"Put": {"TableName": table, "Item": item, "ConditionExpression": "attribute_not_exists(id)"}},
        ])
    except Exception as exc:
        if error_code(exc) == "TransactionCanceledException":
            existing = get_job(db, table, job_id)
            if existing:
                return response(200 if existing["choices"]["S"] == encoded_choices else 409, public_job(existing))
            return response(429, {"message": "The illustration allowance is exhausted or busy. Try later."})
        raise
    try:
        dispatched = functions.invoke(FunctionName=os.environ["AWS_LAMBDA_FUNCTION_NAME"], InvocationType="Event", Payload=json.dumps({"kind": "woodcut-worker", "id": job_id}).encode())
        if dispatched.get("StatusCode") != 202:
            raise RuntimeError("Dispatch rejected")
    except Exception as exc:
        db.update_item(TableName=table, Key={"id": {"S": job_id}}, UpdateExpression="SET #s = :failed", ExpressionAttributeNames={"#s": "status"}, ExpressionAttributeValues={":failed": {"S": "failed"}})
        print(json.dumps({"event": "woodcut_dispatch_failed", "jobId": job_id, "code": error_code(exc)}))
        return response(503, {"message": "The illustrator could not start."})
    print(json.dumps({"event": "woodcut_queued", "jobId": job_id, "day": turn["day"]}))
    return response(202, public_job(item))
