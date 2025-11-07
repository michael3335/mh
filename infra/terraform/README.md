# Terraform stack

This module wires the entire pipeline described in the architecture notes:

- **S3** bucket (versioned) for strategies, runs, bots, and ccxt parquet cache with lifecycle policy for run artifacts.
- **SQS** queues for research jobs and promotion jobs.
- **RDS Postgres** (multi-AZ–ready) for Prisma metadata.
- **ECS Fargate** cluster + services for the research worker and promotion worker, including IAM task roles that grant least-privilege access to S3/SQS/Secrets.
- **CloudWatch** log groups, dashboards, and SQS depth alarms so queue backlogs and worker CPU are visible.

## Usage

```bash
cd infra/terraform
terraform init
terraform apply \
  -var="project=mh" \
  -var="s3_bucket=michaelharrison.au-files" \
  -var="private_subnet_ids=[\"subnet-123\", \"subnet-456\"]" \
  -var="worker_security_group_ids=[\"sg-123\"]" \
  -var="db_security_group_ids=[\"sg-456\"]" \
  -var="db_username=postgres" \
  -var="db_password=super-secret" \
  -var="database_url=postgresql://postgres:super-secret@mh-postgres:5432/mhdb?sslmode=require" \
  -var="ecs_execution_role_arn=arn:aws:iam::123:role/ecsTaskExecutionRole" \
  -var="research_worker_image=123.dkr.ecr.ap-southeast-2.amazonaws.com/mh/research-worker:latest" \
  -var="promotion_worker_image=123.dkr.ecr.ap-southeast-2.amazonaws.com/mh/promotion-worker:latest"
```

All network/security inputs are parameterized so you can plug this into an existing VPC and Secret Manager setup. Outputs expose queue URLs and task definitions for CI/CD to wire into Next.js environment variables.
