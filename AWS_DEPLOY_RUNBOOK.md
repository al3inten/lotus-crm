# AWS Deployment Runbook — LotusCRM

Target architecture (10-30 users, load-balanced backend, DB on its own EC2 + EBS volume, single public subnet, frontend on S3+CloudFront):

```
Internet
  |
  |--> CloudFront --> S3 (frontend static build)
  |
  |--> ALB (80/443) --> [Backend EC2 #1, Backend EC2 #2]  (port 4000)
                                |
                                v
                         DB EC2 (Postgres) + EBS volume (data dir)
```

All backend/db instances sit in one public subnet, locked down by security groups only (no NAT gateway).

---

## 0. Prerequisites
- [ ] AWS account created, MFA enabled on root, billing alert set (e.g. $50 threshold)
- [ ] IAM user created for yourself with `AdministratorAccess` (don't use root day-to-day)
- [ ] AWS CLI installed locally, `aws configure` run with that IAM user's access keys
- [ ] Verify: `aws sts get-caller-identity` returns your account
- [ ] Pick a region (e.g. `ap-south-1` if you're in India, for lowest latency) and stick with it for everything below
- [ ] Domain name ready (optional but recommended for HTTPS/CORS)

---

## 1. Networking
1. Use the **default VPC** in your region (fastest path — has public subnets in every AZ already).
2. Note two subnet IDs in different AZs (ALB requires ≥2 AZs). `aws ec2 describe-subnets --filters Name=vpc-id,Values=<vpc-id>`

## 2. Security Groups
Create 3 security groups in the default VPC:

| SG name | Inbound rules |
|---|---|
| `lotus-alb-sg` | 80/tcp from 0.0.0.0/0, 443/tcp from 0.0.0.0/0 |
| `lotus-backend-sg` | 4000/tcp from `lotus-alb-sg`, 22/tcp from **your IP only** |
| `lotus-db-sg` | 5432/tcp from `lotus-backend-sg`, 22/tcp from **your IP only** |

```bash
aws ec2 create-security-group --group-name lotus-alb-sg --description "ALB" --vpc-id <vpc-id>
aws ec2 create-security-group --group-name lotus-backend-sg --description "Backend" --vpc-id <vpc-id>
aws ec2 create-security-group --group-name lotus-db-sg --description "DB" --vpc-id <vpc-id>
# then authorize-security-group-ingress for each rule above
```

## 3. Key Pair
```bash
aws ec2 create-key-pair --key-name lotus-key --query 'KeyMaterial' --output text > lotus-key.pem
chmod 400 lotus-key.pem   # (or icacls on Windows)
```

---

## 4. Database EC2 Instance
1. Launch 1x `t3.small`, Ubuntu 22.04 LTS, in `lotus-db-sg`, with a **second EBS volume** (gp3, 20-30GB) attached for data — keep the root volume for the OS only.
2. SSH in, format + mount the EBS volume at `/data/postgres`:
   ```bash
   sudo file -s /dev/xvdf                      # confirm it's unformatted
   sudo mkfs -t ext4 /dev/xvdf
   sudo mkdir -p /data/postgres
   sudo mount /dev/xvdf /data/postgres
   echo '/dev/xvdf /data/postgres ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
   ```
3. Install Docker, run Postgres pointing its data dir at the mounted volume:
   ```bash
   curl -fsSL https://get.docker.com | sudo sh
   sudo docker run -d --name lotus-db --restart always \
     -e POSTGRES_DB=lotus_crm -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=<strong-password> \
     -v /data/postgres:/var/lib/postgresql/data \
     -p 5432:5432 postgres:16-alpine
   ```
4. Note this instance's **private IP** — the backend will connect to it as
   `postgresql://postgres:<password>@<db-private-ip>:5432/lotus_crm?schema=public`

---

## 5. Backend EC2 Instances (x2)
Repeat for 2 instances (for load balancing), both `t3.small`, Ubuntu 22.04, in `lotus-backend-sg`:

1. Install Docker (same command as above).
2. Build and push your backend image to ECR (recommended) or `git clone` + build on-instance:
   ```bash
   # one-time: create ECR repo
   aws ecr create-repository --repository-name lotus-crm-backend
   # from your machine: build & push
   aws ecr get-login-password | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
   docker build -t lotus-crm-backend ./backend
   docker tag lotus-crm-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/lotus-crm-backend:latest
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/lotus-crm-backend:latest
   ```
3. Attach an IAM instance profile with `AmazonEC2ContainerRegistryReadOnly` to each backend instance
   (so it can `docker pull` from ECR without stored credentials).
4. **Use `deploy/deploy-backend.sh` from your local machine instead of doing this by hand** — it
   builds the image (tagged with a timestamp, not just `:latest`, so a bad deploy can be rolled
   back to the previous tag), pushes to ECR, and runs the container on each instance with the env
   file from `deploy/.env.production`:
   ```bash
   cd deploy
   cp .env.production.example .env.production   # fill in real values, never commit this file

   # First-time / no ALB yet — updates both instances directly, brief simultaneous downtime:
   ./deploy-backend.sh <backend-1-ip> <backend-2-ip>

   # Once the ALB + target group exist (step 6) — pass the target group ARN and each
   # instance's ID, and it deregisters/updates/re-registers one instance at a time so the
   # app never actually goes down:
   TARGET_GROUP_ARN=<tg-arn> ./deploy-backend.sh <ip-1>:<instance-id-1> <ip-2>:<instance-id-2>
   ```
   The container's entrypoint (`container-start.js`) runs `prisma migrate deploy` (not `db
   push`) and seeds an empty DB automatically on first boot. This means schema changes are no
   longer inferred automatically — every schema change needs a real migration file committed
   first: `npx prisma migrate dev --name <change>` locally, commit the generated
   `prisma/migrations/<...>` folder, then redeploy. (The original 26 migration files predating
   2026-08-01 drifted out of sync with `schema.prisma` and were archived to
   `backend/prisma/_archived_migrations_predating_baseline/` — active history now starts from a
   single `baseline` migration; see that folder's README for why.)
5. The script curls `/health` on each instance at the end to confirm it booted.

---

## 6. Application Load Balancer
```bash
aws elbv2 create-load-balancer --name lotus-alb --subnets <subnet-1> <subnet-2> \
  --security-groups <lotus-alb-sg-id> --scheme internet-facing --type application

aws elbv2 create-target-group --name lotus-backend-tg --protocol HTTP --port 4000 \
  --vpc-id <vpc-id> --target-type instance --health-check-path /health

aws elbv2 register-targets --target-group-arn <tg-arn> \
  --targets Id=<backend-instance-1-id> Id=<backend-instance-2-id>

aws elbv2 create-listener --load-balancer-arn <alb-arn> --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=<tg-arn>
```
For HTTPS: request an ACM cert (in the same region) for your API domain, then add a 443 listener using that cert, and redirect 80→443.

Note the ALB's DNS name (e.g. `lotus-alb-123456.<region>.elb.amazonaws.com`) — this is your API base URL.

---

## 7. Frontend (S3 + CloudFront)
Note: the frontend's `Dockerfile` (nginx, same-origin `/api` proxy) is for the Coolify/Docker-Compose
path and is **not used** here — S3+CloudFront serves the static build directly and talks to the ALB
across origins, so the build needs the real API URL baked in.

1. One-time setup:
   ```bash
   aws s3 mb s3://lotus-crm-frontend
   ```
   Create a CloudFront distribution with the S3 bucket as origin (use Origin Access Control, keep
   bucket private), default root object `index.html`, and a custom error response mapping 403/404 →
   `/index.html` (200) so React Router works on refresh. Request an ACM cert for your frontend
   domain in **us-east-1** (CloudFront requirement) and attach it. Note the distribution ID.
2. **Use `deploy/deploy-frontend.sh` for every build/deploy after that**:
   ```bash
   cd deploy
   ./deploy-frontend.sh https://<api-domain-or-alb-dns> <cloudfront-distribution-id>
   ```
   This builds with the correct `VITE_API_BASE_URL`, syncs `dist/` to S3, and invalidates the
   CloudFront cache.
3. Point your domain's DNS (Route 53 or elsewhere) at the CloudFront distribution (CNAME/ALIAS).

---

## 8. Wire CORS + final checks
- [ ] Update `CORS_ORIGIN` env var on both backend instances to the real frontend domain, restart containers
- [ ] Confirm login flow works end-to-end through the real domain
- [ ] Confirm `/health` passes on ALB target group (both targets "healthy")
- [ ] Set up basic EC2 instance monitoring (CloudWatch default metrics are free) and a billing alarm
- [ ] Take an EBS snapshot of the DB volume once data is loaded, and schedule periodic snapshots (Data Lifecycle Manager or a cron `aws ec2 create-snapshot`)

---

## 9. Rollback / safety notes
- The EBS data volume is independent of the DB instance — if the instance dies, you can attach the volume to a fresh instance without losing data.
- Keep the old Render/Vercel/Coolify deployment running until AWS is verified end-to-end; only cut DNS over once confirmed.
- Don't delete the EBS volume or snapshots when terminating any instance (uncheck "delete on termination" for the data volume).
