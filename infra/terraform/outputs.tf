output "s3_bucket" {
  value = aws_s3_bucket.artifacts.id
}

output "research_queue_url" {
  value = aws_sqs_queue.research_jobs.id
}

output "promotion_queue_url" {
  value = aws_sqs_queue.promotion_jobs.id
}

output "ecs_cluster_id" {
  value = aws_ecs_cluster.mh.id
}

output "research_task_definition" {
  value = aws_ecs_task_definition.research.arn
}

output "promotion_task_definition" {
  value = aws_ecs_task_definition.promotion.arn
}
