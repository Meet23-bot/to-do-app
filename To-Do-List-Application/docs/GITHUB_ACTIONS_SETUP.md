# GitHub Actions → Amazon ECR → Amazon ECS

GitHub only loads workflows from the **repository root** `.github/workflows/`. In this repo layout, the deploy workflow lives at **repo root**: `.github/workflows/deploy-ecs.yml` (not under `To-Do-List-Application/.github/`). It runs when you push to `main` (or when you run the workflow manually from the **Actions** tab).

## What you need in AWS first

1. **ECR repository** (example name: `to-do-app`) in the same region as ECS.
2. **ECS cluster** and **ECS service** (Fargate) already created and pointing at the same task family name as in `aws/ecs-task-definition.template.json` (`todo-app-task`), or change the template family name to match your service.
3. **Task execution IAM role** named `ecsTaskExecutionRole` (or edit the template `executionRoleArn` to match your role name).

## GitHub OIDC (recommended; no long-lived AWS keys in GitHub)

Create an IAM role that GitHub Actions can assume.

1. In **IAM** → **Identity providers** → add provider **OpenID Connect**.
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
2. Create an IAM **role** (custom trust). Trust policy (replace `OWNER/REPO`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GitHubActions",
      "Effect": "Allow",
      "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

3. Attach policies (or a single custom policy) that allow at least:
   - ECR: push/pull for your repository
   - ECS: `RegisterTaskDefinition`, `DescribeTaskDefinition`, `UpdateService`, `DescribeServices`
   - IAM: `PassRole` on `ecsTaskExecutionRole` (required when registering a task definition)

Copy the role **ARN**; you will store it as a GitHub secret.

## Configure GitHub repository

### Repository **Variables** (Settings → Secrets and variables → Actions → Variables)

| Name | Example | Purpose |
|------|---------|---------|
| `ECS_DEPLOY_ENABLED` | `true` | Must be exactly `true` to run the deploy job (opt-in gate) |
| `AWS_REGION` | `us-east-1` | Region for ECR + ECS |
| `ECR_REPOSITORY` | `to-do-app` | ECR repo name (must match image URI) |
| `ECS_CLUSTER` | `my-cluster` | ECS cluster name |
| `ECS_SERVICE` | `todo-app-service` | ECS service name |

### Repository **Secrets** (Settings → Secrets and variables → Actions → Secrets)

| Name | Example | Purpose |
|------|---------|---------|
| `AWS_ROLE_TO_ASSUME` | `arn:aws:iam::123456789012:role/github-actions-deploy` | OIDC role ARN from above |
| `AWS_ACCOUNT_ID` | `123456789012` | 12-digit account id (used to fill task definition) |

Until **`ECS_DEPLOY_ENABLED=true`** and the other variables are set, the deploy job is **skipped** (so pushes to `main` do not fail CI). You must still add the **secrets** below or the job will fail at the AWS credential step.

## First successful run

1. Push to `main`, or open **Actions** → **Deploy to Amazon ECS** → **Run workflow**.
2. Confirm the job **Deploy to Amazon ECS** → job **deploy** ran (not skipped).
3. In AWS **ECS** → your service → **Deployments**, wait for the new deployment to become **steady**.

## Troubleshooting

- **`PassRole` access denied** when registering the task definition: add `iam:PassRole` for `ecsTaskExecutionRole` to the GitHub OIDC role.
- **Wrong image URI**: `ECR_REPOSITORY` must match the ECR repository name exactly.
- **Cluster / service not found**: check `ECS_CLUSTER` and `ECS_SERVICE` spellings and region variable.
