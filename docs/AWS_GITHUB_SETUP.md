# AWS Multi-Account Setup with GitHub Actions

This guide covers setting up a secure multi-account AWS deployment pipeline using GitHub Actions with OIDC authentication.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Prod Account  │    │ DevTest Account │
│   111111111111  │    │   222222222222  │
│                 │    │                 │
│ tak.nz (R53)    │    │ dev.tak.nz (R53)│
│ Production IAM  │    │ DevTest IAM     │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌─────────────────────┐
         │   GitHub Actions    │
         │   OIDC Provider     │
         │                     │
         │ Environment: prod   │
         │ Environment: devtest│
         └─────────────────────┘
```

## 1. Route 53 DNS Setup

### 1.1 Primary Domain in Production Account

In your **Production AWS Account**, create the main hosted zone:

```bash
# Create hosted zone for tak.nz
aws route53 create-hosted-zone \
    --name tak.nz \
    --caller-reference "tak-nz-$(date +%s)"
```

**Configure at your domain registrar:**
- Point `tak.nz` nameservers to the NS records from the Production account hosted zone
- See [AWS Documentation: Making Route 53 the DNS service](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/MigratingDNS.html)

**Enable DNSSEC for enhanced security:**
- Configure DNSSEC signing for your hosted zone to prevent DNS spoofing attacks
- See [AWS Documentation: Configuring DNSSEC signing](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring-dnssec.html)

### 1.2 Subdomain Delegation to DevTest Account

In your **DevTest AWS Account**, create the development hosted zone:

```bash
# Create hosted zone for dev.tak.nz
aws route53 create-hosted-zone \
    --name dev.tak.nz \
    --caller-reference "dev-tak-nz-$(date +%s)"
```

**In Production Account**, delegate the subdomain:

```bash
# Add NS record in Production account pointing to DevTest nameservers
aws route53 change-resource-record-sets \
    --hosted-zone-id Z1D633PJN98FT9 \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "dev.tak.nz",
                "Type": "NS",
                "TTL": 300,
                "ResourceRecords": [
                    {"Value": "ns-123.awsdns-12.com"},
                    {"Value": "ns-456.awsdns-34.net"},
                    {"Value": "ns-789.awsdns-56.org"},
                    {"Value": "ns-012.awsdns-78.co.uk"}
                ]
            }
        }]
    }'
```

> **Note:** Replace the NS values with actual nameservers from your DevTest hosted zone.

**Enable DNSSEC for the subdomain:**
- Configure DNSSEC signing for the `dev.tak.nz` hosted zone in the DevTest account
- See [AWS Documentation: Configuring DNSSEC signing](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring-dnssec.html)

**Reference:** [AWS Documentation: Routing traffic for subdomains](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-routing-traffic-for-subdomains.html)

## 2. GitHub OIDC Setup

### 2.1 Create OIDC Identity Provider (Both Accounts)

Run in **both Production and DevTest accounts**:

```bash
aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

> **Note:** The thumbprint is GitHub's root certificate fingerprint used to verify OIDC token authenticity. This value may change if GitHub updates their certificate infrastructure.

### 2.2 Create IAM Roles

**Production Account - GitHub Actions Role:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::111111111111:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:TAK-NZ/base-infra:environment:production",
            "repo:TAK-NZ/auth-infra:environment:production",
            "repo:TAK-NZ/tak-infra:environment:production"
          ]
        }
      }
    }
  ]
}
```

**DevTest Account - GitHub Actions Role:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::222222222222:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:TAK-NZ/base-infra:environment:devtest",
            "repo:TAK-NZ/auth-infra:environment:devtest",
            "repo:TAK-NZ/tak-infra:environment:devtest"
          ]
        }
      }
    }
  ]
}
```

**Attach CDK deployment permissions to both roles:**

```bash
# Create and attach the custom policy (replace GitHubActions-TAK-Deployment-Role with your chosen role name)
aws iam attach-role-policy \
    --role-name GitHubActions-TAK-Deployment-Role \
    --policy-arn arn:aws:iam::ACCOUNT_ID:policy/TAK-GitHub-Actions-Policy
```

> **Note:** Replace `GitHubActions-TAK-Deployment-Role` with your chosen IAM role name and use the custom policy from section 6.1 instead of PowerUserAccess.

## 3. GitHub Environment Setup

### 3.1 Create Environments

In your GitHub repository, go to **Settings → Environments** and create:

1. **`production`** environment
   - **Protection rules:**
     - Required reviewers: Add team leads
     - Deployment branches: Restrict to tags only
     - Wait timer: 5 minutes

2. **`devtest`** environment
   - **Protection rules:**
     - Deployment branches: Allow `main` only

### 3.2 Configure Environment Secrets

**For `production` environment:**
- `AWS_ACCOUNT_ID`: `111111111111`
- `AWS_ROLE_ARN`: `arn:aws:iam::111111111111:role/GitHubActions-TAK-Role`
- `AWS_REGION`: `ap-southeast-6`

**For `devtest` environment:**
- `AWS_ACCOUNT_ID`: `222222222222`
- `AWS_ROLE_ARN`: `arn:aws:iam::222222222222:role/GitHubActions-TAK-Role`
- `AWS_REGION`: `ap-southeast-2`

**To add secrets:**
1. Go to repository **Settings → Environments**
2. Click on environment name
3. Add environment secrets under **Environment secrets**

## 4. Branch Protection Setup

**Configure branch protection for `main`** to ensure only tested code is deployed:

1. Go to **Settings → Branches → Add rule**
2. **Branch name pattern**: `main`
3. **Enable these protections:**
   - ☑️ Require a pull request before merging
   - ☑️ Require status checks to pass before merging
   - ☑️ Require branches to be up to date before merging
   - ☑️ Status checks: Select "Test CDK code" (from your existing workflow)
   - ☑️ Restrict pushes that create files larger than 100MB

This ensures all code is reviewed and tested before reaching `main`, preventing untested commits from deploying to DevTest.

## 5. GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy TAK Infrastructure

on:
  push:
    branches: [main]
    paths-ignore:
      - 'docs/**'
      - '*.md'
      - '.gitignore'
  push:
    tags: ['v*']

permissions:
  id-token: write
  contents: read

jobs:
  deploy-devtest:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: devtest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ secrets.AWS_REGION }}
          role-session-name: GitHubActions-DevTest

      - name: Install dependencies
        run: npm ci

      - name: Bootstrap CDK (if needed)
        run: |
          if ! aws cloudformation describe-stacks --stack-name CDKToolkit 2>/dev/null; then
            npx cdk bootstrap aws://${{ secrets.AWS_ACCOUNT_ID }}/${{ secrets.AWS_REGION }} --context envType=dev-test
          fi

      - name: Deploy DevTest
        run: npm run deploy:dev

  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ secrets.AWS_REGION }}
          role-session-name: GitHubActions-Production

      - name: Install dependencies
        run: npm ci

      - name: Bootstrap CDK (if needed)
        run: |
          if ! aws cloudformation describe-stacks --stack-name CDKToolkit 2>/dev/null; then
            npx cdk bootstrap aws://${{ secrets.AWS_ACCOUNT_ID }}/${{ secrets.AWS_REGION }} --context envType=prod
          fi

      - name: Deploy Production
        run: npm run deploy:prod
```

## 6. Security Best Practices

### 6.1 Least Privilege IAM Policies

Instead of `PowerUserAccess`, create a comprehensive policy for all TAK infrastructure layers:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "iam:*",
        "ec2:*",
        "ecs:*",
        "ecr:*",
        "route53:*",
        "acm:*",
        "kms:*",
        "rds:*",
        "elasticache:*",
        "efs:*",
        "elasticloadbalancing:*",
        "secretsmanager:*",
        "lambda:*",
        "logs:*",
        "events:*",
        "application-autoscaling:*",
        "servicediscovery:*",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "*"
    }
  ]
}
```

**This policy covers all three repositories:**
- **base-infra**: VPC, ECS, S3, KMS, ACM, Route53
- **auth-infra**: RDS PostgreSQL, Redis, EFS, ALB/NLB, Secrets Manager, Lambda, ECR
- **tak-infra**: RDS PostgreSQL, EFS, NLB, Secrets Manager, ECR

**Key additions for auth-infra and tak-infra:**
- `ecr:*` - Docker image management for containerized applications
- `rds:*` - PostgreSQL Aurora clusters
- `elasticache:*` - Redis clusters (auth-infra)
- `efs:*` - Elastic File System for persistent storage
- `elasticloadbalancing:*` - Application and Network Load Balancers
- `secretsmanager:*` - Database credentials and application secrets
- `lambda:*` - LDAP token retriever functions (auth-infra)
- `logs:*` - CloudWatch logging
- `events:*` - EventBridge rules
- `application-autoscaling:*` - ECS service scaling
- `servicediscovery:*` - Service mesh capabilities

### 6.2 Environment Protection

- **Production:** Requires manual approval + 5-minute wait + version tags only
- **DevTest:** Automatic deployment from `main` branch after tests pass
- **Branch protection:** Requires PR reviews and passing tests before merge to `main`

### 6.3 Monitoring

Enable CloudTrail in both accounts to monitor GitHub Actions activity:

```bash
aws cloudtrail create-trail \
    --name github-actions-audit \
    --s3-bucket-name your-cloudtrail-bucket
```

## 7. Verification

Test the setup:

1. **DevTest:** Push to `main` branch → Should deploy automatically after tests pass
2. **Production:** Create and push version tag (e.g., `git tag v2025.1 && git push origin v2025.1`) → Should require approval → Deploy after approval

**Example production deployment:**
```bash
# Tag a release for production deployment
git tag v2025.1.0
git push origin v2025.1.0
```

Monitor deployments in:
- GitHub Actions logs
- AWS CloudFormation console
- CloudTrail logs for API calls

## 8. Troubleshooting

**Common Issues:**

- **OIDC Trust Policy:** Ensure exact repository name match
- **Environment Names:** Must match exactly between GitHub and IAM conditions
- **DNS Propagation:** Allow 24-48 hours for full DNS propagation
- **CDK Bootstrap:** Each account needs CDK bootstrap before first deployment
- **ECS Service-Linked Role:** First ECS deployment requires: `aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com`

**Useful Commands:**

```bash
# Test OIDC token locally (for debugging)
curl -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
     "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sts.amazonaws.com"

# Verify DNS delegation
dig NS dev.tak.nz
dig NS tak.nz
```