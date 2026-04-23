# Deployment Handoff (Developer -> DevOps)

This document captures the deployment contract for AWS ECS (Fargate).

## 1) Application Type

- Service type: Node.js + Express web app
- Container port: `3000`
- Health endpoint: `GET /api/health`
- API base: same host (`/api/...`)

## 2) Runtime Environment Variables

Required at runtime:

- `PORT` (default `3000`)
- `NODE_ENV` (`production` in ECS)
- `APP_NAME` (service/app name for diagnostics)
- `TASKS_FILE` (task data file path, default `tasks.json`)

Reference files:

- `.env.example` for local dev
- `.env.production.example` for production defaults

## 3) Image Build Contract

- Dockerfile path: `Dockerfile`
- Build command:
  - `docker build -t todo-app:latest .`
- Run command:
  - `docker run --rm -p 3000:3000 --env-file .env.production.example todo-app:latest`

## 4) ECS Contract

- Launch type: Fargate
- Network mode: `awsvpc`
- Task definition template:
  - `aws/ecs-task-definition.template.json`
- CloudWatch logs:
  - Log group name: `/ecs/todo-app`
- Container health check:
  - `GET /api/health` on localhost

## 5) Current Data Persistence Note

- Task data currently persists to local file (`TASKS_FILE`).
- In ECS, container filesystem is ephemeral.
- For production-grade persistence, switch this to RDS/DynamoDB/EFS.

## 6) Smoke Tests (Post Deploy)

- Health:
  - `curl http://<service-url>/api/health`
- Create task:
  - `POST /api/tasks` with JSON body `{ "text": "sample", "dueDate": "2099-12-31", "priority": "Low" }`
- List tasks:
  - `GET /api/tasks`

## 7) GitHub Actions (optional CI/CD)

- Workflow (repository root): `.github/workflows/deploy-ecs.yml`
- Setup guide: `docs/GITHUB_ACTIONS_SETUP.md`

The workflow builds the Docker image, pushes to ECR with tag `${{ github.sha }}`, registers a new ECS task definition from `aws/ecs-task-definition.template.json`, and forces a new ECS deployment. It is **skipped** until GitHub variables and OIDC secrets are configured (see the setup doc).
