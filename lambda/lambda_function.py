import json
import os
import boto3
import psycopg2
from psycopg2.extras import execute_values


bedrock = boto3.client("bedrock-runtime", region_name=os.environ["AWS_REGION"])

def get_db_conn():
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=os.environ.get("DB_PORT", 5432),
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
    )


def embed(text: str) -> list[float]:
    response = bedrock.invoke_model(
        modelId="amazon.titan-embed-text-v2:0",
        body=json.dumps({"inputText": text}),
        contentType="application/json",
        accept="application/json",
    )
    return json.loads(response["body"].read())["embedding"]


def upsert_embeddings(conn, rows: list[tuple]):
    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            UPDATE experiences
            SET experience_embeddings = data.embedding::vector
            FROM (VALUES %s) AS data(experience_id, embedding)
            WHERE experiences.id = data.experience_id::uuid
            """,
            rows,
            template="(%s, %s)",
        )
    conn.commit()


def lambda_handler(event, context):
    records = event.get("Records", [])
    if not records:
        return {"statusCode": 200, "body": "no records"}

    rows = []
    failed_ids = []

    for record in records:
        try:
            body = json.loads(record["body"])
            experience_id = body["experienceId"]
            star_text = body["starText"]

            vector = embed(star_text)
            print(f"[EMBED_OK] experienceId={experience_id} dim={len(vector)} sample={vector[:5]}")
            rows.append((experience_id, vector))

        except Exception as e:
            print(f"[EMBED_FAIL] messageId={record.get('messageId')} error={e}")
            failed_ids.append({"itemIdentifier": record["messageId"]})

    if rows:
        try:
            with get_db_conn() as conn:
                upsert_embeddings(conn, rows)
        except Exception as e:
            print(f"[DB_FAIL] error={e}")
            # DB 실패 시 전체 배치를 SQS로 재시도
            raise

    # SQS batch item failure 반환 — 개별 파싱/임베딩 실패만 DLQ로
    return {"batchItemFailures": failed_ids}
