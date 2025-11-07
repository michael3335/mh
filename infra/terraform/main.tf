terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# -------------------------------------------------------------------
# Networking / Secrets / KMS left to platform defaults.
# -------------------------------------------------------------------

resource "aws_s3_bucket" "artifacts" {
  bucket = var.s3_bucket

  lifecycle_rule {
    id      = "artifact-retention"
    enabled = true

    prefix = "runs/"
    expiration {
      days = var.run_artifact_retention_days
    }
  }

  versioning {
    enabled = true
  }
}

resource "aws_sqs_queue" "research_jobs" {
  name                       = "${var.project}-research-jobs"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 900
  tags = {
    project = var.project
  }
}

resource "aws_sqs_queue" "promotion_jobs" {
  name                       = "${var.project}-promotion-jobs"
  message_retention_seconds  = 1209600
  visibility_timeout_seconds = 900
  tags = {
    project = var.project
  }
}

resource "aws_cloudwatch_log_group" "research" {
  name              = "/app/research"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "promotion" {
  name              = "/app/promotion"
  retention_in_days = 30
}

# -------------------------------------------------------------------
# RDS Postgres for metadata
# -------------------------------------------------------------------
resource "aws_db_subnet_group" "mh" {
  name       = "${var.project}-db"
  subnet_ids = var.private_subnet_ids
}

resource "aws_db_instance" "postgres" {
  identifier              = "${var.project}-postgres"
  instance_class          = "db.t4g.small"
  allocated_storage       = 50
  engine                  = "postgres"
  engine_version          = "16.3"
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  skip_final_snapshot     = true
  publicly_accessible     = false
  storage_encrypted       = true
  deletion_protection     = false
  vpc_security_group_ids  = var.db_security_group_ids
  db_subnet_group_name    = aws_db_subnet_group.mh.name
  backup_retention_period = 7
  performance_insights_enabled = true
  tags = {
    project = var.project
  }
}

# -------------------------------------------------------------------
# IAM + ECS roles
# -------------------------------------------------------------------
data "aws_iam_policy_document" "task_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "research_task" {
  name               = "${var.project}-research-task-role"
  assume_role_policy = data.aws_iam_policy_document.task_assume.json
}

resource "aws_iam_role_policy" "research_access" {
  name = "${var.project}-research-access"
  role = aws_iam_role.research_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:ChangeMessageVisibility",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.research_jobs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.secret_arns
      }
    ]
  })
}

resource "aws_iam_role" "promotion_task" {
  name               = "${var.project}-promotion-task-role"
  assume_role_policy = data.aws_iam_policy_document.task_assume.json
}

resource "aws_iam_role_policy" "promotion_access" {
  name = "${var.project}-promotion-access"
  role = aws_iam_role.promotion_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.promotion_jobs.arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.secret_arns
      }
    ]
  })
}

resource "aws_ecs_cluster" "mh" {
  name = "${var.project}-cluster"
}

resource "aws_ecs_task_definition" "research" {
  family                   = "${var.project}-research-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = aws_iam_role.research_task.arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = var.research_worker_image
      essential = true
      command   = ["python", "-u", "worker.py"]
      environment = [
        { name = "AWS_REGION", value = var.aws_region },
        { name = "S3_BUCKET", value = aws_s3_bucket.artifacts.bucket },
        { name = "SQS_RESEARCH_JOBS_URL", value = aws_sqs_queue.research_jobs.id },
        { name = "DATABASE_URL", value = var.database_url }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.research.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "research-worker"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "promotion" {
  family                   = "${var.project}-promotion-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = aws_iam_role.promotion_task.arn

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = var.promotion_worker_image
      essential = true
      command   = ["python", "-u", "worker.py"]
      environment = [
        { name = "AWS_REGION", value = var.aws_region },
        { name = "AWS_S3_BUCKET", value = aws_s3_bucket.artifacts.bucket },
        { name = "SQS_PROMOTION_JOBS_URL", value = aws_sqs_queue.promotion_jobs.id },
        { name = "DATABASE_URL", value = var.database_url }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.promotion.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "promotion-worker"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "research" {
  name            = "${var.project}-research"
  cluster         = aws_ecs_cluster.mh.id
  task_definition = aws_ecs_task_definition.research.arn
  desired_count   = var.research_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    assign_public_ip = false
    security_groups  = var.worker_security_group_ids
    subnets          = var.private_subnet_ids
  }
}

resource "aws_ecs_service" "promotion" {
  name            = "${var.project}-promotion"
  cluster         = aws_ecs_cluster.mh.id
  task_definition = aws_ecs_task_definition.promotion.arn
  desired_count   = var.promotion_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    assign_public_ip = false
    security_groups  = var.worker_security_group_ids
    subnets          = var.private_subnet_ids
  }
}

# -------------------------------------------------------------------
# Observability
# -------------------------------------------------------------------
resource "aws_cloudwatch_dashboard" "mh" {
  dashboard_name = "${var.project}-ops"
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        x    = 0
        y    = 0
        width  = 12
        height = 6
        properties = {
          title = "SQS Depth"
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.research_jobs.name],
            ["...", aws_sqs_queue.promotion_jobs.name]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
        }
      },
      {
        type = "metric"
        x    = 12
        y    = 0
        width  = 12
        height = 6
        properties = {
          title = "Worker CPU Utilization"
          metrics = [
            ["ECS/ContainerInsights", "CpuUtilized", "ClusterName", aws_ecs_cluster.mh.name, "ServiceName", aws_ecs_service.research.name],
            ["...", aws_ecs_service.promotion.name]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "research_queue_alarm" {
  alarm_name          = "${var.project}-research-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 50
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  statistic           = "Average"
  period              = 60
  dimensions = {
    QueueName = aws_sqs_queue.research_jobs.name
  }
  alarm_actions = var.alarm_topic_arns
  ok_actions    = var.alarm_topic_arns
}

resource "aws_cloudwatch_metric_alarm" "promotion_queue_alarm" {
  alarm_name          = "${var.project}-promotion-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 10
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  statistic           = "Average"
  period              = 60
  dimensions = {
    QueueName = aws_sqs_queue.promotion_jobs.name
  }
  alarm_actions = var.alarm_topic_arns
  ok_actions    = var.alarm_topic_arns
}
