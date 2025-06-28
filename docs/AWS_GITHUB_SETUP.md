# AWS Multi-Account Setup with GitHub Actions

This guide covers setting up a secure multi-account AWS deployment pipeline using GitHub Actions with OIDC authentication.

## Architecture Overview

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Prod Account  │  │   Demo Account  │  │   Dev Account   │
│   111111111111  │  │   222222222222  │  │   333333333333  │
│                 │  │                 │  │                 │
│ tak.nz (R53)    │  │demo.tak.nz (R53)│  │dev.tak.nz (R53) │
│ [CI/CD]         │  │ [CI/CD]         │  │ [Manual only]   │
│ Production IAM  │  │ Demo IAM        │  │ Dev IAM         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────┬───────────┘                     │
                   │                                 │
         ┌─────────────────────┐                     │
         │   GitHub Actions    │                     │
         │   OIDC Provider     │                     │
         │                     │                     │
         │ Environment: prod   │                     │
         │ Environment: demo   │                     │
         └─────────────────────┘                     │
                                                     │
                               Manual deployment ────┘
```

## 1. Route 53 DNS Setup

### 1.1 Environment Overview

Three environments are configured with DNS:
- **`tak.nz`** - Production environment (CI/CD enabled)
- **`demo.tak.nz`** - Demo environment (CI/CD enabled) 
- **`dev.tak.nz`** - Development environment (manual deployment only)

> **Note:** Only production and demo environments are configured for GitHub Actions CI/CD. The dev environment is used for manual development work.

### 1.2 Primary Domain in Production Account

In your **Production AWS Account (111111111111)**, create the main hosted zone:

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

### 1.3 Demo Environment in Demo Account

In your **Demo AWS Account (222222222222)**, create the demo hosted zone:

```bash
# Create hosted zone for demo.tak.nz (CI/CD enabled)
aws route53 create-hosted-zone \
    --name demo.tak.nz \
    --caller-reference "demo-tak-nz-$(date +%s)"
```

### 1.4 Dev Environment in Dev Account

In your **Dev AWS Account (333333333333)**, create the dev hosted zone:

```bash
# Create hosted zone for dev.tak.nz (manual deployment)
aws route53 create-hosted-zone \
    --name dev.tak.nz \
    --caller-reference "dev-tak-nz-$(date +%s)"
```

### 1.5 Subdomain Delegation from Production

**In Production Account**, delegate both subdomains:

```bash
# Add NS record for demo.tak.nz (pointing to Demo account)
aws route53 change-resource-record-sets \
    --hosted-zone-id Z1D633PJN98FT9 \
    --change-batch '{
        "Changes": [{
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "demo.tak.nz",
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

# Add NS record for dev.tak.nz (pointing to Dev account)
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
                    {"Value": "ns-789.awsdns-78.com"},
                    {"Value": "ns-012.awsdns-90.net"},
                    {"Value": "ns-345.awsdns-12.org"},
                    {"Value": "ns-678.awsdns-34.co.uk"}
                ]
            }
        }]
    }'
```

> **Note:** Replace the NS values with actual nameservers from your respective Demo and Dev account hosted zones.

**Enable DNSSEC for the subdomains:**
- Configure DNSSEC signing for `demo.tak.nz` hosted zone in the Demo account
- Configure DNSSEC signing for `dev.tak.nz` hosted zone in the Dev account
- See [AWS Documentation: Configuring DNSSEC signing](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-configuring-dnssec.html)

**Reference:** [AWS Documentation: Routing traffic for subdomains](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-routing-traffic-for-subdomains.html)

## 2. GitHub OIDC Setup

### 2.1 Create OIDC Identity Provider (Both Accounts)

Run in **Production and Demo accounts** (not needed for Dev account since it's manual only):

```bash
aws iam create-open-id-connect-provider \
    --url https://token.actions.githubusercontent.com \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

> **Note:** The thumbprint is GitHub's root certificate fingerprint used to verify OIDC token authenticity. This value may change if GitHub updates their certificate infrastructure.

### 2.2 Create IAM Roles

**Production Account - Create trust policy file and role:**

```bash
# Create prod-github-trust-policy.json
cat > prod-github-trust-policy.json << 'EOF'
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
EOF

# Create the role
aws iam create-role \
    --role-name GitHubActions-TAK-Role \
    --assume-role-policy-document file://prod-github-trust-policy.json \
    --description "GitHub Actions role for TAK infrastructure deployment"
```

**Demo Account - Create trust policy file and role:**

```bash
# Create demo-github-trust-policy.json
cat > demo-github-trust-policy.json << 'EOF'
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
            "repo:TAK-NZ/base-infra:environment:demo",
            "repo:TAK-NZ/auth-infra:environment:demo",
            "repo:TAK-NZ/tak-infra:environment:demo"
          ]
        }
      }
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name GitHubActions-TAK-Role \
    --assume-role-policy-document file://demo-github-trust-policy.json \
    --description "GitHub Actions role for TAK infrastructure deployment"
```

> **Note:** Replace `111111111111` and `222222222222` with your actual AWS account IDs.

**Create and attach CDK deployment permissions to both roles:**

```bash
# First, create the custom policy document
cat > tak-github-actions-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "ec2:*",
        "ecs:*",
        "ecr:*",
        "route53:*",
        "acm:*",
        "kms:*",
        "rds:*",
        "elasticache:*",
        "elasticfilesystem:*",
        "elasticloadbalancing:*",
        "secretsmanager:*",
        "lambda:*",
        "logs:*",
        "events:*",
        "application-autoscaling:*",
        "servicediscovery:*",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
        "ssm:PutParameter",
        "ssm:DeleteParameter",
        "ssm:AddTagsToResource",
        "ssm:RemoveTagsFromResource",
        "ssmmessages:CreateControlChannel",
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:OpenDataChannel",
        "sts:GetCallerIdentity",
        "sts:AssumeRole"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:UpdateRole",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:CreatePolicy",
        "iam:DeletePolicy",
        "iam:GetPolicy",
        "iam:GetPolicyVersion",
        "iam:ListPolicyVersions",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListAttachedRolePolicies",
        "iam:CreateInstanceProfile",
        "iam:DeleteInstanceProfile",
        "iam:GetInstanceProfile",
        "iam:AddRoleToInstanceProfile",
        "iam:RemoveRoleFromInstanceProfile",
        "iam:CreateServiceLinkedRole",
        "iam:DeleteServiceLinkedRole"
      ],
      "Resource": [
        "arn:aws:iam::*:role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS",
        "arn:aws:iam::*:role/aws-service-role/rds.amazonaws.com/AWSServiceRoleForRDS",
        "arn:aws:iam::*:role/aws-service-role/elasticloadbalancing.amazonaws.com/AWSServiceRoleForElasticLoadBalancing",
        "arn:aws:iam::*:role/aws-service-role/application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": [
            "ecs-tasks.amazonaws.com",
            "rds.amazonaws.com",
            "lambda.amazonaws.com",
            "monitoring.rds.amazonaws.com",
            "elasticloadbalancing.amazonaws.com",
            "application-autoscaling.amazonaws.com"
          ]
        }
      }
    }
  ]
}
EOF

# Create the policy in both accounts
aws iam create-policy \
    --policy-name TAK-GitHub-Actions-Policy \
    --policy-document file://tak-github-actions-policy.json \
    --description "Comprehensive policy for TAK infrastructure deployment via GitHub Actions"

# Attach the policy to the role
aws iam attach-role-policy \
    --role-name GitHubActions-TAK-Role \
    --policy-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/TAK-GitHub-Actions-Policy
```

> **Note:** Run these commands in both Production and Demo accounts. The policy provides least-privilege access for all TAK infrastructure components.

## 3. GitHub Environment Setup

### 3.1 Create Environments

In your GitHub repository, go to **Settings → Environments** and create:

1. **`production`** environment
   - **Protection rules:**
     - Required reviewers: Add team leads
     - Wait timer: 5 minutes
     - Deployment branches and tags: Select "Selected branches and tags"
       - Add rule: "v*" (for version tags like v1.0.0)

2. **`demo`** environment
   - **Protection rules:**
     - Deployment branches and tags: Select "Selected branches and tags"
       - Add rule: "main"
   - **Environment variables:**
     - `DEMO_TEST_DURATION`: `300` (wait time in seconds, default 5 minutes)
     - `STACK_NAME`: `Demo`
       - BaseInfra: `R53_ZONE_NAME`: `demo.tak.nz`
       - AuthInfra: `AUTHENTIK_ADMIN_EMAIL`: `admin@tak.nz`

### 3.2 Configure Environment Secrets

**For `production` environment:**
- `AWS_ACCOUNT_ID`: `111111111111`
- `AWS_ROLE_ARN`: `arn:aws:iam::111111111111:role/GitHubActions-TAK-Role`
- `AWS_REGION`: `ap-southeast-6`

**For `demo` environment:**
- `AWS_ACCOUNT_ID`: `222222222222`
- `AWS_ROLE_ARN`: `arn:aws:iam::222222222222:role/GitHubActions-TAK-Role`
- `AWS_REGION`: `ap-southeast-2`

**To add secrets:**
1. Go to repository **Settings → Environments**
2. Click on environment name
3. Add environment secrets under **Environment secrets**

### 3.3 Configure Environment Variables

**For `demo` environment:**
1. Go to repository **Settings → Environments**
2. Click on **demo** environment
3. Add environment variables under **Environment variables**:
   - `DEMO_TEST_DURATION`: `300`
   - `STACK_NAME`: `Demo`
   - `R53_ZONE_NAME`: `demo.tak.nz`

> **Note:** Use variables (not secrets) for non-sensitive configuration like stack names and public domain names. Variables are visible in workflow logs, making debugging easier.

## 4. Branch Protection Setup

**Configure branch protection for `main`** to ensure only tested code is deployed:

1. Go to **Settings → Branches → Add rule**
2. **Branch name pattern**: `main`
3. **Enable these protections:**
   - ☑️ Require a pull request before merging
   - ☑️ Require status checks to pass before merging
     - ☑️ Require branches to be up to date before merging
     - ☑️ Status checks: Will appear after first workflow run

> **Note:** Status checks only appear in the "Add checks" list after they've run at least once. After your first PR or push triggers the "Test CDK code" workflow, you can return to branch protection settings and select it as a required status check.

This ensures all code is reviewed and tested before reaching `main`, preventing untested commits from deploying to Demo.

## 5. Breaking Change Detection

### 5.1 Overview

To prevent catastrophic failures when deploying infrastructure changes, a two-stage breaking change detection system is implemented:

1. **Stage 1 (PR Level)**: CDK diff analysis during pull requests - fast feedback
2. **Stage 2 (Deploy Level)**: CloudFormation change set validation before demo deployment - comprehensive validation

### 5.2 Stack-Specific Breaking Changes

**BaseInfra (Critical - Affects All Stacks):**
- VPC CIDR block modifications
- Subnet CIDR changes or deletions
- KMS key replacements
- Route53 hosted zone changes
- ECS cluster name changes
- S3 bucket replacements

**AuthInfra (Affects TakInfra):**
- PostgreSQL database cluster replacements
- Redis cluster replacements
- EFS file system replacements
- Application Load Balancer replacements
- Secrets Manager secret deletions

**TakInfra (Leaf Stack):**
- PostgreSQL database cluster replacements
- EFS file system replacements
- Network Load Balancer replacements
- Secrets Manager secret deletions

### 5.3 Implementation Requirements

**For Each Repository (base-infra, auth-infra, tak-infra):**

1. **Create breaking change detection script** `scripts/github/check-breaking-changes.sh`:

```bash
#!/bin/bash
# Breaking change detection for infrastructure deployments

STACK_TYPE=${1:-"base"}
CONTEXT_ENV=${2:-"prod"}
OVERRIDE_CHECK=${3:-"false"}

# Stack-specific breaking change patterns
case $STACK_TYPE in
  "base")
    PATTERNS=(
      "VPC.*will be destroyed"
      "Subnet.*will be destroyed"
      "KMSKey.*will be destroyed"
      "HostedZone.*will be destroyed"
      "ECSCluster.*will be destroyed"
      "S3.*Bucket.*will be destroyed"
    )
    ;;
  "auth")
    PATTERNS=(
      "DatabaseCluster.*will be destroyed"
      "ReplicationGroup.*will be destroyed"
      "FileSystem.*will be destroyed"
      "ApplicationLoadBalancer.*will be destroyed"
      "Secret.*will be destroyed"
    )
    ;;
  "tak")
    PATTERNS=(
      "DatabaseCluster.*will be destroyed"
      "FileSystem.*will be destroyed"
      "NetworkLoadBalancer.*will be destroyed"
      "Secret.*will be destroyed"
    )
    ;;
esac

echo "🔍 Checking for breaking changes in $STACK_TYPE stack..."

# Generate CDK diff
npm run cdk diff --context envType=$CONTEXT_ENV > stack-diff.txt 2>&1

# Check for breaking patterns
BREAKING_FOUND=false
for pattern in "${PATTERNS[@]}"; do
  if grep -q "$pattern" stack-diff.txt; then
    echo "❌ Breaking change detected: $pattern"
    BREAKING_FOUND=true
  fi
done

if [ "$BREAKING_FOUND" = true ]; then
  if [ "$OVERRIDE_CHECK" = "true" ]; then
    echo "🚨 Breaking changes detected but override enabled - proceeding"
    exit 0
  else
    echo ""
    echo "💡 To override this check, use commit message containing '[force-deploy]'"
    echo "📋 Review the full diff above to understand the impact"
    exit 1
  fi
else
  echo "✅ No breaking changes detected"
fi
```

2. **Create change set validation script** `scripts/github/validate-changeset.sh`:

```bash
#!/bin/bash
# CloudFormation change set validation

STACK_NAME=${1}
CHANGE_SET_NAME="breaking-change-check-$(date +%s)"

echo "🔍 Creating CloudFormation change set for $STACK_NAME..."

# Generate CDK template
npm run cdk synth --context envType=prod > template.json

# Create change set
aws cloudformation create-change-set \
  --stack-name "$STACK_NAME" \
  --change-set-name "$CHANGE_SET_NAME" \
  --template-body file://template.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

# Wait for change set creation
aws cloudformation wait change-set-create-complete \
  --stack-name "$STACK_NAME" \
  --change-set-name "$CHANGE_SET_NAME"

# Analyze change set for resource replacements
REPLACEMENTS=$(aws cloudformation describe-change-set \
  --stack-name "$STACK_NAME" \
  --change-set-name "$CHANGE_SET_NAME" \
  --query 'Changes[?ResourceChange.Replacement==`True`].ResourceChange.LogicalResourceId' \
  --output text)

# Clean up change set
aws cloudformation delete-change-set \
  --stack-name "$STACK_NAME" \
  --change-set-name "$CHANGE_SET_NAME"

if [ -n "$REPLACEMENTS" ]; then
  echo "❌ Resource replacements detected:"
  echo "$REPLACEMENTS"
  echo "💡 Use '[force-deploy]' in commit message to override"
  exit 1
else
  echo "✅ No resource replacements detected"
fi
```

3. **Create scripts directory structure**:
```bash
mkdir -p scripts/github
chmod +x scripts/github/check-breaking-changes.sh
chmod +x scripts/github/validate-changeset.sh
```

### 5.4 Cross-Stack Dependencies

**BaseInfra repositories require additional validation** since changes affect dependent stacks:

```bash
# In base-infra repository only
- name: Check Cross-Stack Impact
  run: |
    echo "🔍 Checking impact on dependent stacks..."
    
    # Check AuthInfra compatibility (if repository exists)
    if [ -d "../auth-infra" ]; then
      cd ../auth-infra
      npm ci
      npm run cdk diff --context envType=prod || echo "⚠️ AuthInfra may be affected"
      cd ../base-infra
    fi
    
    # Check TakInfra compatibility (if repository exists)
    if [ -d "../tak-infra" ]; then
      cd ../tak-infra
      npm ci  
      npm run cdk diff --context envType=prod || echo "⚠️ TakInfra may be affected"
      cd ../base-infra
    fi
```

### 5.5 Override Mechanism

To deploy breaking changes intentionally:

1. **Include `[force-deploy]` in commit message**:
```bash
git commit -m "feat: update VPC CIDR for network expansion [force-deploy]"
```

2. **The workflows will detect the override and proceed with deployment**

3. **Use with caution** - ensure dependent stacks are updated accordingly

## 6. GitHub Actions Workflows

### 6.1 Demo Testing Workflow

Create `.github/workflows/demo-deploy.yml`:

> **Note:** This workflow tests both prod and dev-test profiles in demo before production deployment. It runs on every push to main.

```yaml
name: Demo Testing Pipeline

on:
  push:
    branches: [main]
    paths-ignore:
      - 'docs/**'
      - '*.md'
      - '.gitignore'
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

jobs:
  test:
    uses: ./.github/workflows/cdk-test.yml

  demo-prod-test:
    runs-on: ubuntu-latest
    environment: demo
    needs: test
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ secrets.AWS_REGION }}
          role-session-name: GitHubActions-Demo

      - name: Install dependencies
        run: npm ci

      - name: Validate CDK Synthesis (Prod Profile)
        run: npm run cdk synth -- --context envType=prod --context stackName=${{ vars.STACK_NAME }} --context r53ZoneName=${{ vars.R53_ZONE_NAME }}

      - name: Deploy Demo with Prod Profile
        run: npm run cdk deploy -- --context envType=prod --context stackName=${{ vars.STACK_NAME }} --context r53ZoneName=${{ vars.R53_ZONE_NAME }} --require-approval never

      - name: Wait for Testing Period
        run: sleep ${{ vars.DEMO_TEST_DURATION || '300' }}

      - name: Run Automated Tests
        run: |
          echo "Placeholder for automated tests"
          # TODO: Add health checks and integration tests
          # curl -f https://${{ vars.R53_ZONE_NAME }}/health || exit 1

      - name: Validate CDK Synthesis (Dev-Test Profile)
        run: npm run cdk synth -- --context envType=dev-test --context stackName=${{ vars.STACK_NAME }} --context r53ZoneName=${{ vars.R53_ZONE_NAME }}
        if: always()

      - name: Revert Demo to Dev-Test Profile
        run: npm run cdk deploy -- --context envType=dev-test --context stackName=${{ vars.STACK_NAME }} --context r53ZoneName=${{ vars.R53_ZONE_NAME }} --require-approval never
        if: always()
```

### 6.2 Production Deployment Workflow

Create `.github/workflows/production-deploy.yml`:

> **Note:** This workflow deploys to production only on version tags. It runs independently of the demo testing workflow.

```yaml
name: Production Deployment

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      force_deploy:
        description: 'Force deployment without tag'
        required: false
        type: boolean
        default: false

permissions:
  id-token: write
  contents: read

jobs:
  test:
    uses: ./.github/workflows/cdk-test.yml

  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    needs: test
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
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
        run: npm run deploy:prod -- --require-approval never
```

## 7. Security Best Practices

### 7.1 Least Privilege IAM Policies

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
        "ssm:GetParametersByPath",
        "ssm:PutParameter",
        "ssm:DeleteParameter",
        "ssm:AddTagsToResource",
        "ssm:RemoveTagsFromResource",
        "ssmmessages:CreateControlChannel",
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:OpenDataChannel",
        "sts:GetCallerIdentity",
        "sts:AssumeRole"
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

### 7.2 Environment Protection

- **Production:** Requires manual approval + 5-minute wait + version tags only
- **Demo:** Automatic deployment from `main` branch after tests pass, exercises both prod and dev-test profiles
- **Branch protection:** Requires PR reviews and passing tests before merge to `main`

### 7.3 Monitoring

Enable CloudTrail in Production and Demo accounts to monitor GitHub Actions activity:

```bash
aws cloudtrail create-trail \
    --name github-actions-audit \
    --s3-bucket-name your-cloudtrail-bucket
```

## 8. Verification

Test the setup:

1. **Demo Testing:** Push to `main` branch → Should deploy demo with prod profile → Wait → Run tests → Revert to dev-test profile
2. **Production:** Create and push version tag (e.g., `git tag v2025.1 && git push origin v2025.1`) → Should require approval → Deploy after approval

### 8.1 Deployment Flow

**Main Branch Push:**
```
Push to main → Tests → Demo (prod profile) → Wait → Tests → Demo (dev-test profile)
```

**Version Tag Push:**
```
Tag v* → Tests → Production (prod profile) [requires approval]
```

**Benefits:**
- Cost optimization: Demo runs dev-test profile between deployments
- Risk mitigation: Both profiles tested in demo before production
- Separation: Independent workflows for demo testing vs production deployment

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

## 9. Troubleshooting

**Common Issues:**

- **OIDC Trust Policy:** Ensure exact repository name match
- **Environment Names:** Must match exactly between GitHub and IAM conditions
- **DNS Propagation:** Allow 24-48 hours for full DNS propagation
- **CDK Bootstrap:** Each account needs CDK bootstrap before first deployment
- **ECS Service-Linked Role:** First ECS deployment requires: `aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com`
- **CDK Role Assumption Warnings:** Messages like "current credentials could not be used to assume 'arn:aws:iam::***:role/cdk-hnb659fds-*-role-***'" are normal. CDK tries to assume specialized roles but falls back to your main role permissions. The `sts:AssumeRole` permission in the policy eliminates these warnings.

**Useful Commands:**

```bash
# Test OIDC token locally (for debugging)
curl -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
     "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sts.amazonaws.com"

# Verify DNS delegation
dig NS demo.tak.nz
dig NS dev.tak.nz
dig NS tak.nz
```
