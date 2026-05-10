variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project Name"
  type        = string
  default     = "elimuhub"
}

variable "environment" {
  description = "Environment (staging/production)"
  type        = string
  default     = "production"
}

variable "db_password" {
  description = "RDS root password"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Main domain name (e.g. elimuhub.com)"
  type        = string
}
