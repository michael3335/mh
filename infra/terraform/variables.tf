variable "project" {
  description = "Project/stack prefix"
  type        = string
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-southeast-2"
}

variable "s3_bucket" {
  description = "Artifacts bucket name"
  type        = string
}

variable "run_artifact_retention_days" {
  description = "How long to keep run artifacts in S3"
  type        = number
  default     = 30
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS/RDS"
  type        = list(string)
}

variable "worker_security_group_ids" {
  description = "Security groups for ECS tasks"
  type        = list(string)
}

variable "db_security_group_ids" {
  description = "Security groups allowed to connect to RDS"
  type        = list(string)
}

variable "db_name" {
  type        = string
  description = "Database name"
  default     = "mhdb"
}

variable "db_username" {
  type        = string
  description = "Database admin username"
}

variable "db_password" {
  type        = string
  description = "Database admin password"
  sensitive   = true
}

variable "database_url" {
  type        = string
  description = "Full DATABASE_URL passed to tasks"
}

variable "secret_arns" {
  description = "Additional Secrets Manager ARNs tasks may read"
  type        = list(string)
  default     = []
}

variable "ecs_execution_role_arn" {
  description = "Existing ECS execution role for pulling images"
  type        = string
}

variable "research_worker_image" {
  description = "ECR image for the research worker"
  type        = string
}

variable "promotion_worker_image" {
  description = "ECR image for the promotion worker"
  type        = string
}

variable "research_desired_count" {
  description = "Number of research tasks to run"
  type        = number
  default     = 1
}

variable "promotion_desired_count" {
  description = "Number of promotion tasks to run"
  type        = number
  default     = 1
}

variable "alarm_topic_arns" {
  description = "SNS topic ARNs to notify for alarms"
  type        = list(string)
  default     = []
}
