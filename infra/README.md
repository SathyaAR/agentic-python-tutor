Terraform for the VPC, RDS, ECS cluster/service/task definition, ALB, ECR
repo, and IAM roles. See backend-spec.md §9 for the full layout and cost
notes.

Remember: run `terraform destroy` after each session — the NAT Gateway and
ALB are billed hourly, and this stack is meant to be spun up and torn down,
not left running.

## Frontend hosting (Vercel) — no Terraform needed

The SPA is deployed by Vercel's GitHub integration, not by this folder
(frontend-spec.md §10, architecture-blueprint.md §5). What's needed, and
where it lives:

| Concern | Where | Status |
|---|---|---|
| SPA routing fallback (`/(.*)` → `/index.html`) | `frontend/vercel.json` | done |
| Build command / output | Vercel project: root dir `frontend`, `npm run build`, output `dist` | set in Vercel UI at first deploy |
| `VITE_API_BASE_URL` | Vercel env vars, per Production / Preview | set once the ALB domain exists |
| `VITE_USE_MOCK_API` | Vercel env vars: **`false`** for Production and Preview | set at first deploy |
| CORS origins | backend `ALLOWED_ORIGINS` (ECS task env var, this folder) | add prod domain + `*.vercel.app` when the backend stack is written |

Until the backend stack exists, a Vercel deploy with `VITE_USE_MOCK_API=true`
is a usable clickable demo (it shows a "Demo mode" banner).

## Terraform layout (planned — not written yet)

```
infra/
  backend.tf        # S3 remote state + DynamoDB lock
  vpc.tf            # public subnets (ALB, NAT) + private subnets (ECS, RDS)
  rds.tf            # db.t4g.micro Postgres, not publicly accessible
  ecr.tf
  ecs.tf            # cluster, service, task definition (env + Secrets Manager)
  alb.tf            # HTTPS listener, ACM cert, target group
  iam.tf            # task execution role + GitHub OIDC deploy role
  variables.tf / outputs.tf
```
