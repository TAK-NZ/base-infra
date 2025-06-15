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

The stack supports flexible parameter configuration through multiple methods with cascading priority:

#### Method 1: CDK Context (Primary Method)
```bash
# Deploy with all parameters via context
npx cdk deploy \
  --context envType=prod \
  --context r53ZoneName=tak.nz \
  --context vpcMajorId=5 \
  --context vpcMinorId=0 \
  --context createNatGateways=true \
  --context createVpcEndpoints=true \
  --context certificateTransparency=true \
  --profile tak
```

#### Method 2: Minimal Context (Uses Environment Defaults)
```bash
# Deploy with only required parameters (other parameters use environment-based defaults)
npx cdk deploy \
  --context envType=dev-test \
  --context r53ZoneName=tak.nz \
  --profile tak
```

#### Available Context Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `envType` | No | `dev-test` | Environment type: `prod` or `dev-test` |
| `r53ZoneName` | **Yes** | None | Route 53 hosted zone domain name |
| `vpcMajorId` | No | `0` | VPC CIDR major ID (10.{major}.0.0/16) |
| `vpcMinorId` | No | `0` | VPC CIDR minor ID (10.{major}.{minor}.0/16) |
| `createNatGateways` | No | env-based* | Create NAT Gateways: `true` or `false` |
| `createVpcEndpoints` | No | env-based* | Create VPC endpoints: `true` or `false` |
| `certificateTransparency` | No | env-based* | Enable ACM cert transparency: `true` or `false` |

*Environment-based defaults: `prod` = `true`, `dev-test` = `false`

**Parameters:**
- `envType`: Environment type (`prod` or `dev-test`). Default: `dev-test`
  - `prod`: Includes redundant NAT Gateways, VPC endpoints, and production-grade resources
  - `dev-test`: Cost-optimized for development/testing
- `vpcMajorId`: Major VPC network ID (0-255) - selects /16 block from 10.0.0.0/8. Default: 0
- `vpcMinorId`: Minor VPC network ID (0-15) - selects /20 subnet within the /16 block. Default: 0
  - Combined creates CIDR: `10.{vpcMajorId}.{vpcMinorId*16}.0/20`
  - Provides 4,096 IP addresses per VPC
  - Allows for thousands of unique VPC configurations
- `stackName`: Environment/deployment identifier used in stack naming. Default: `MyFirstStack`
  - Creates stack name: `TAK-<name>-BaseInfra` (e.g., "TAK-Primary-BaseInfra")
  - Also used in CloudFormation export names for cross-stack references
- `r53ZoneName`: **(Required)** Existing public hosted zone name for ACM certificate creation (e.g., `tak.nz`)
  - An ACM certificate is automatically created with DNS validation
  - Certificate covers: `example.com`, `*.example.com`, `*.map.example.com`
  - Certificate ARN is exported as: `{StackName}-CERTIFICATE-ARN`
- `createNatGateways`: Create redundant NAT Gateway for high availability. Default: `true` for prod, `false` for dev-test
  - `true`: Creates NAT Gateways in both availability zones for redundancy
  - `false`: Creates single NAT Gateway in AZ-A only (cost-optimized)
  - **Note**: At least one NAT Gateway is always created for private subnet internet access
- `createVpcEndpoints`: Create VPC interface endpoints for AWS services. Default: `true` for prod, `false` for dev-test
  - `true`: Creates interface endpoints for ECR, KMS, Secrets Manager, CloudWatch Logs
  - `false`: Creates S3 gateway endpoint only (always created)
  - Interface endpoints reduce data transfer costs and improve security by keeping traffic within the VPC
- `certificateTransparency`: Enable certificate transparency logging for ACM certificate. Default: `true` for prod, `false` for dev-test
  - `true`: Certificate is logged to public Certificate Transparency logs (recommended for production)
  - `false`: Certificate transparency logging is disabled (useful for development/testing)

**Hierarchical Parameter System:**
The stack uses a cascading configuration system:
1. **Environment Type** (`envType`) provides defaults for resource creation:
   - `prod`: `createNatGateways=true`, `createVpcEndpoints=true`, `certificateTransparency=true`
   - `dev-test`: `createNatGateways=false`, `createVpcEndpoints=false`, `certificateTransparency=false`
2. **Individual context parameters** override environment defaults when specified
3. **Example**: `--context envType=prod --context createNatGateways=false` creates production environment with cost-optimized NAT Gateway configuration

**Required AWS Environment Variables (for AWS SDK only):**
- `CDK_DEFAULT_ACCOUNT` - Your AWS account ID (auto-set with: `aws sts get-caller-identity --query Account --output text --profile tak`)
- `CDK_DEFAULT_REGION` - Your AWS region (auto-set with: `aws configure get region --profile tak`)

## Environment Configuration System

The base infrastructure uses a structured environment configuration system defined in `lib/environment-config.ts`. This provides opinionated defaults for different environment types while maintaining the ability to override individual settings.

### Environment Types

#### **dev-test** (Default)
- **Focus**: Cost optimization and development efficiency
- **NAT Gateways**: Single NAT Gateway only
- **VPC Endpoints**: S3 gateway endpoint only (no interface endpoints)
- **Certificate Transparency**: Disabled (prevents public certificate logs)
- **Container Insights**: Disabled
- **KMS Key Rotation**: Disabled
- **S3 Versioning**: Disabled

#### **prod**
- **Focus**: High availability, security, and production readiness
- **NAT Gateways**: Redundant NAT Gateways in both AZs
- **VPC Endpoints**: Interface endpoints for ECR, KMS, Secrets Manager, CloudWatch
- **Certificate Transparency**: Enabled (compliance requirement)
- **Container Insights**: Enabled
- **KMS Key Rotation**: Enabled
- **S3 Versioning**: Enabled

#### **staging**
- **Focus**: Production-like testing with cost optimizations
- **NAT Gateways**: Redundant NAT Gateways (test HA setup)
- **VPC Endpoints**: S3 gateway only (cost optimization)
- **Certificate Transparency**: Enabled (test production setup)
- **Container Insights**: Enabled (test monitoring)
- **KMS Key Rotation**: Disabled (cost optimization)
- **S3 Versioning**: Enabled (test data protection)

### Configuration Override System

The environment configuration can be overridden at multiple levels:

1. **Environment Type** (`envType`) sets the base configuration
2. **Individual Parameters** override specific settings via CDK context
3. **Code-level Overrides** using `mergeEnvironmentConfig()` for advanced customization

## CloudFormation Exports

This stack exports the following values for use by other stacks:

| Export Name Pattern | Description | Example Value |
|---------------------|-------------|---------------|
| `TAK-{StackName}-BaseInfra-VPC-ID` | VPC ID | `vpc-abc123def456` |
| `TAK-{StackName}-BaseInfra-VPC-CIDR-IPV4` | VPC IPv4 CIDR Block | `10.0.0.0/16` |
| `TAK-{StackName}-BaseInfra-SUBNET-PUBLIC-A` | Public Subnet A ID | `subnet-abc123` |
| `TAK-{StackName}-BaseInfra-SUBNET-PUBLIC-B` | Public Subnet B ID | `subnet-def456` |
| `TAK-{StackName}-BaseInfra-SUBNET-PRIVATE-A` | Private Subnet A ID | `subnet-ghi789` |
| `TAK-{StackName}-BaseInfra-SUBNET-PRIVATE-B` | Private Subnet B ID | `subnet-jkl012` |
| `TAK-{StackName}-BaseInfra-ECS-CLUSTER` | ECS Cluster ARN | `arn:aws:ecs:region:account:cluster/name` |
| `TAK-{StackName}-BaseInfra-ECR-REPO` | ECR Repository ARN | `arn:aws:ecr:region:account:repository/name` |
| `TAK-{StackName}-BaseInfra-KMS-KEY` | KMS Key ARN | `arn:aws:kms:region:account:key/key-id` |
| `TAK-{StackName}-BaseInfra-S3-BUCKET` | S3 Config Bucket ARN | `arn:aws:s3:::bucket-name` |
| `TAK-{StackName}-BaseInfra-CERTIFICATE-ARN` | ACM Certificate ARN | `arn:aws:acm:region:account:certificate/cert-id` |
| `TAK-{StackName}-BaseInfra-HOSTED-ZONE-ID` | Route53 Hosted Zone ID | `Z1PA6795UKMFR9` |

**VPC Endpoints** (production environment only):
- `TAK-{StackName}-BaseInfra-S3-ID` - S3 Gateway Endpoint ID
- `TAK-{StackName}-BaseInfra-ECR-DKR-ID` - ECR Docker Interface Endpoint ID
- `TAK-{StackName}-BaseInfra-ECR-API-ID` - ECR API Interface Endpoint ID
- `TAK-{StackName}-BaseInfra-SECRETSMANAGER-ID` - Secrets Manager Interface Endpoint ID
- `TAK-{StackName}-BaseInfra-KMS-ID` - KMS Interface Endpoint ID
- `TAK-{StackName}-BaseInfra-LOGS-ID` - CloudWatch Logs Interface Endpoint ID

**Usage Example:**
```bash
# Reference VPC ID in another stack
aws cloudformation describe-stacks --stack-name TAK-Primary-BaseInfra --query 'Stacks[0].Outputs[?OutputKey==`VpcIdOutput`].OutputValue' --output text --profile tak

# Import in another CDK stack
const vpcId = Fn.importValue('TAK-Primary-BaseInfra-VPC-ID');
```

## ACM Certificate Integration

When you provide a Route 53 hosted zone name (which is now required), the stack automatically:

1. **Looks up your existing public hosted zone** in Route 53
2. **Creates an ACM certificate** with DNS validation covering:
   - Primary domain: `your-domain.com`
   - Wildcard subdomain: `*.your-domain.com`
   - Map subdomain wildcard: `*.map.your-domain.com`
3. **Exports the certificate ARN** as `{StackName}-CERTIFICATE-ARN` for use in other stacks

**Example Usage:**
```bash
# Deploy with automatic certificate creation (R53 zone name is required)
npx cdk deploy --context r53ZoneName=tak.nz --profile tak

# Reference the certificate in other stacks
aws cloudformation describe-stacks --stack-name TAK-DevTest-BaseInfra --query 'Stacks[0].Outputs[?OutputKey==`CertificateArnOutput`].OutputValue' --output text --profile tak
```

**Requirements:**
- Public hosted zone must exist in Route 53 in the same AWS account
- Sufficient permissions to create ACM certificates and Route 53 records
- AWS account and region must be specified for hosted zone lookups

**Note:** If testing without a real hosted zone, you can mock the lookup by adding context to [`cdk.json`](cdk.json ):
```json
{
  "context": {
    "hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false": {
      "Id": "/hostedzone/Z1PA6795UKMFR9",
      "Name": "example.com."
    }
  }
}
```

## Notes
- Make sure your AWS credentials are configured.
- The stack type (prod/dev-test) can be changed later on.
- **The R53 zone name is now mandatory** - the stack will fail to deploy without it.
- **Important**: CDK does not have a `--dry-run` flag. Use `cdk synth` or `cdk diff` for testing without deployment.

## Testing and Validation

Always test your deployment before applying changes to production:

```bash
# Validate template syntax and show what resources will be created
npx cdk synth --context r53ZoneName=your-domain.com --profile tak

# Show exactly what changes will be made (compared to current stack)
npx cdk diff --context r53ZoneName=your-domain.com --profile tak

# For production deployments, create changeset first for review
npx cdk deploy --context r53ZoneName=your-domain.com --profile tak --method prepare-change-set --change-set-name "my-review-changeset"
```

#### Testing Before Deployment (Recommended)

Before deploying, you can test and validate your changes using these commands:

```bash
# 1. Synthesize CloudFormation template (no deployment)
npx cdk synth --context r53ZoneName=tak.nz --profile tak

# 2. Check what changes would be made (no deployment)
npx cdk diff --context r53ZoneName=tak.nz --profile tak

# 3. Create changeset without executing (for review)
npx cdk deploy --context r53ZoneName=tak.nz --profile tak --method prepare-change-set

# 4. View the prepared changeset in AWS Console before executing
# Then execute with:
npx cdk deploy --context r53ZoneName=tak.nz --profile tak --method change-set
```

#### Advanced Examples: Individual Parameter Control

```bash
# Production with cost optimization - disable redundant NAT Gateway
npx cdk deploy --context envType=prod --context vpcMajorId=5 --context r53ZoneName=tak.nz --context createNatGateways=false --profile tak

# Development with specific production features for testing
npx cdk deploy --context envType=dev-test --context createVpcEndpoints=true --context r53ZoneName=tak.nz --profile tak

# Custom configuration - prod environment with cost-optimized networking
npx cdk deploy --context envType=prod --context createNatGateways=false --context r53ZoneName=tak.nz --profile tak

# Override multiple parameters
npx cdk deploy --context envType=dev-test --context createNatGateways=true --context createVpcEndpoints=true --context certificateTransparency=true --context r53ZoneName=tak.nz --profile tak

# Development environment with certificate transparency enabled for testing
npx cdk deploy --context envType=dev-test --context certificateTransparency=true --context r53ZoneName=tak.nz --profile tak
```

