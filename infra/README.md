Terraform for the VPC, RDS, ECS cluster/service/task definition, ALB, ECR
repo, and IAM roles. See backend-spec.md §9 for the full layout and cost
notes.

Remember: run `terraform destroy` after each session — the NAT Gateway and
ALB are billed hourly, and this stack is meant to be spun up and torn down,
not left running.
