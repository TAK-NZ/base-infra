<h1 align=center>TAK VPC</h1>

<p align=center>TAK Base Layer (VPC, ECS, ECR, S3, KMS, ACM)

## Background

The [Team Awareness Kit (TAK)](https://tak.gov/solutions/emergency) provides Fire, Emergency Management, and First Responders an operationally agnostic tool for improved situational awareness and a common operational picture. 
This repo - which is part of a [larger collection](https://github.com/TAK-NZ/) -  deploys the base AWS infrastructure required to deploy a [TAK server](https://tak.gov/solutions/emergency) along with [Authentik](https://goauthentik.io/) as the authentication layer.

The following additional layers are required after deploying this `TAK-<name>-BaseInfra` layer:

| Name                  | Notes |
| --------------------- | ----- |
| `TAK-<name>-AuthLayer`     | Authentication layer using Authentik - [repo](https://github.com/TAK-NZ/auth-infra)      |
| `TAK-<name>-TAKServerLayer`      | TAK Server layer - [repo](https://github.com/TAK-NZ/tak-infra)      |

## Pre-Reqs

The following dependencies must be fulfilled:
- An [AWS Account](https://signin.aws.amazon.com/signup?request_type=register). 
  - Your AWS credentials must be configured for the CDK to access your account. You can configure credentials using the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) (`aws configure`) or [environment variables](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html). The deployment examples in this guide assume you have configured an AWS profile named `tak` - you can either create this profile or substitute it with your preferred profile name in the commands below.  
- A public hosted zone in Route 53 for your domain name (e.g., `tak.nz`).
  - An ACM certificate will be automatically created covering:
    - The main domain (e.g., `tak.nz`)
    - Wildcard subdomain (e.g., `*.tak.nz`)
    - Map subdomain wildcard (e.g., `*.map.tak.nz`)
  - Subsequent stacks will create the following hostnames in this zone:
    - account: Authentik SSO (e.g., `account.tak.nz`)
    - ldap: Internal LDAP endpoint (e.g., `ldap.tak.nz`)
    - ops: User facing TAK server endpoint (e.g., `ops.tak.nz`)
    - takserver: Admin facing TAK server endpoint (e.g., `takserver.tak.nz`)
    - map: CloudTAK user and admin interface (e.g., `map.tak.nz`)
    - tile.map: CloudTAK tile server (e.g., `tile.map.tak.nz`)
    - video: Video Server (e.g., `video.tak.nz`)
## Resources

This AWS CDK project provisions the following resources:
- **Networking**:
  - VPC with public and private subnets (IPv4/IPv6)
  - NAT Gateways (number conditional on environment)
  - Route tables and associations
  - VPC Endpoints for S3, ECR, KMS, Secrets Manager, and CloudWatch (only in production environment)
- **Compute Services**:
  - ECS Cluster
  - ECR Repository with lifecycle policy
- **Other Services**:  
  - KMS Key and Alias
  - S3 Bucket with encryption and ownership controls
  - ACM Certificate with DNS validation covering the above domain patterns

## AWS Deployment

### 1. Install Tooling Dependencies
   ```bash
   npm install
   ```

### 2. First use of Amazon Elastic Container Service (ECS)

> [!NOTE] 
> Amazon Elastic Container Service uses AWS Identity and Access Management (IAM) service-linked roles. This service linked role needs to be created first - either manually or by having ECS create it during the first deployment. 
> Stack deployment will fail if this service-link role does not exist. 

If you have never used ECS in this specific AWS account you need to manually create the service-linked role via `aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com --profile tak`. If you have already used ECS before in this particular AWS account, you can move on to the next step. 

### 3. Bootstrap your AWS environment (if not already done):
   ```bash
   npx cdk bootstrap --profile tak
   ```

### 4. Set required environment variables:

> [!NOTE]  
> Even when using AWS profiles, CDK requires explicit account/region specification for context providers (like Route 53 hosted zone lookups). The profile handles authentication, but CDK needs these values for CloudFormation template generation.

```bash
# Set AWS account and region for CDK deployment (using your profile)
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text --profile tak)
export CDK_DEFAULT_REGION=$(aws configure get region --profile tak || echo "ap-southeast-2")

# Verify the values
echo "Account: $CDK_DEFAULT_ACCOUNT"
echo "Region: $CDK_DEFAULT_REGION"
```

### 5. Deploy the stack:

The stack uses a modern context-based configuration system with predefined environments:

#### Method 1: Deploy with Default Environment Configuration
```bash
# Deploy development environment (cost-optimized)
npx cdk deploy --context env=dev-test --profile tak

# Deploy production environment (high availability)
npx cdk deploy --context env=prod --profile tak
```

#### Method 2: Override Specific Configuration Values
```bash
# Deploy dev-test with custom domain
npx cdk deploy --context env=dev-test \
  --context dev-test.r53ZoneName=custom.tak.nz \
  --profile tak

# Deploy production with custom VPC settings
npx cdk deploy --context env=prod \
  --context prod.vpcCidr=10.5.0.0/20 \
  --context prod.networking.createNatGateways=false \
  --profile tak
```

#### Available Environments

| Environment | Stack Name | Description | Default Domain |
|-------------|------------|-------------|----------------|
| `dev-test` | `TAK-Dev-BaseInfra` | Cost-optimized for development/testing | `dev.tak.nz` |
| `prod` | `TAK-Prod-BaseInfra` | High availability for production | `tak.nz` |

#### Configuration Override Examples

All configuration is stored in `cdk.json` under the `context` section. You can override any value using CDK's built-in `--context` flag with dot notation:

```bash
# Override domain name
npx cdk deploy --context env=dev-test --context dev-test.r53ZoneName=custom.tak.nz

# Override VPC settings  
npx cdk deploy --context env=prod --context prod.vpcCidr=10.2.0.0/20

# Disable high availability features for cost savings
npx cdk deploy --context env=prod --context prod.networking.createNatGateways=false

# Override multiple ECR settings
npx cdk deploy --context env=dev-test \
  --context dev-test.ecr.imageRetentionCount=10 \
  --context dev-test.ecr.scanOnPush=true
```

**Required AWS Environment Variables:**
```bash
# Set AWS account and region for CDK deployment
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text --profile tak)
export CDK_DEFAULT_REGION=$(aws configure get region --profile tak || echo "ap-southeast-2")

# Verify the values
echo "Account: $CDK_DEFAULT_ACCOUNT"
echo "Region: $CDK_DEFAULT_REGION"
```

For detailed configuration options and advanced deployment scenarios, see the [Deployment Guide](docs/DEPLOYMENT_GUIDE.md).