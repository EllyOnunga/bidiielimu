output "vpc_id" {
  value = aws_vpc.main.id
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "ecr_repository_backend_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "ecr_repository_frontend_url" {
  value = aws_ecr_repository.frontend.repository_url
}

output "s3_bucket_name" {
  value = aws_s3_bucket.media.id
}
