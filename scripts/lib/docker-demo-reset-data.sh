#!/usr/bin/env bash
# Reset app data inside an already-running Docker Compose stack (flush + fixtures + seed_demo + MinIO bucket prep).
# Run from repo root only. Expects COMPOSE_PROJECT_NAME (default ecm3432demo) and docker-compose.yml.
# Args: optional --no-seed (skip seed_demo and demo user creation)

set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [ ! -f docker-compose.yml ]; then
  echo "error: run from repository root (docker-compose.yml not found)" >&2
  exit 1
fi

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-ecm3432demo}"

echo "Waiting for backend to become ready..."
ready=0
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  if docker compose exec -T backend python -c "print('ready')" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done
if [ "$ready" -ne 1 ]; then
  echo "error: backend did not become ready in time" >&2
  docker compose logs backend --tail=120 >&2 || true
  exit 1
fi

echo "Ensuring MinIO bucket exists..."
docker compose exec -T backend python -c "
import os
import boto3
import json

endpoint = f\"http://{os.environ.get('MINIO_ENDPOINT', 'minio:9000')}\"
bucket = os.environ.get('MINIO_BUCKET_NAME', 'media')
client = boto3.client(
    's3',
    endpoint_url=endpoint,
    aws_access_key_id=os.environ.get('MINIO_ROOT_USER', 'minioadmin'),
    aws_secret_access_key=os.environ.get('MINIO_ROOT_PASSWORD', 'minioadmin'),
)
names = [b['Name'] for b in client.list_buckets().get('Buckets', [])]
if bucket not in names:
    client.create_bucket(Bucket=bucket)
    print(f'Created bucket: {bucket}')
else:
    print(f'Bucket exists: {bucket}')

policy = {
    'Version': '2012-10-17',
    'Statement': [{
        'Effect': 'Allow',
        'Principal': {'AWS': ['*']},
        'Action': ['s3:GetObject'],
        'Resource': [f'arn:aws:s3:::{bucket}/*']
    }]
}
client.put_bucket_policy(Bucket=bucket, Policy=json.dumps(policy))
print(f'Applied public-read policy on: {bucket}')

paginator = client.get_paginator('list_objects_v2')
to_delete = []
for page in paginator.paginate(Bucket=bucket):
    for obj in page.get('Contents', []):
        to_delete.append({'Key': obj['Key']})
if to_delete:
    client.delete_objects(Bucket=bucket, Delete={'Objects': to_delete, 'Quiet': True})
    print(f'Cleared {len(to_delete)} existing object(s) from bucket: {bucket}')
else:
    print(f'Bucket already empty: {bucket}')
"

echo "Resetting database to demo baseline..."
docker compose exec -T backend python manage.py flush --noinput
echo "Note: this reset deletes all non-seeded accounts/data created during demos."

echo "Loading fixtures (categories + example places)..."
docker compose exec -T backend python manage.py loaddata fixtures/categories.json fixtures/assets.json

if [ "${1:-}" != "--no-seed" ]; then
  echo "Creating demo users and adding placeholder images..."
  docker compose exec -T backend python manage.py seed_demo --with-images
  echo ""
  echo "Demo logins (use at http://localhost:3000/login):"
  echo "  Admin:       admin@example.com / DemoAdmin123!"
  echo "  Moderator:   moderator@example.com / DemoMod123!"
  echo "  Contributor: contributor@example.com / DemoContrib123!"
  echo "  User:        demo@example.com / DemoUser123!"
  echo ""
  echo "Full demo with admin, moderator, contributor, and user accounts."
fi

echo ""
echo "Done. Open http://localhost:3000 (frontend) and http://localhost:8000/api/docs/ (API)."
