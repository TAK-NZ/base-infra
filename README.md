<h1 align=center>TAK VPC</h1>

<p align=center>TAK Base Layer (VPC, ECS, ECR, S3, KMS)</p>

## Background

The [Team Awareness Kit (TAK)](https://tak.gov/solutions/emergency) provides Fire, Emergency Management, and First Responders an operationally agnostic tool for improved situational awareness and a common operational picture. 
This repo deploys the base infrastructure required to deploy a [TAK server](https://tak.gov/solutions/emergency) along with [Authentik](https://goauthentik.io/) as the authentication layer on AWS.

The following additional layers are required after deploying this `TAK-<name>-BaseInfra` layer:

| Name                  | Notes |
| --------------------- | ----- |
| `TAK-<name>-AuthLayer`     | Authentication layer using Authentik - [repo](https://github.com/TAK-NZ/auth-infra)      |
| `TAK-<name>-TAKServerLayer`      | TAK Server layer - [repo](https://github.com/TAK-NZ/tak-infra)      |

## Pre-Reqs

The following dependencies must be fulfilled:
- An [AWS Account](https://signin.aws.amazon.com/signup?request_type=register).
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

Amazon Elastic Container Service uses AWS Identity and Access Management (IAM) service-linked roles. This service linked role needs to be created first - either manually or by having ECS create it during the first deployment. If you have never used ECS in this specific AWS account you need to manually create the service-linked role via `aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com`. If you have already used ECS before in this particular AWS account, you can move on to the next step. 

### 3. Bootstrap your AWS environment (if not already done):
   ```bash
   npx cdk bootstrap
   ```

### 4. Deploy the stack:

The stack supports flexible parameter configuration through multiple methods with cascading priority:

#### Method 1: Environment Variables (Highest Priority)
```bash
ENV_TYPE=prod VPC_MAJOR_ID=5 VPC_MINOR_ID=0 STACK_NAME=Primary R53_ZONE_NAME=tak.nz npx cdk deploy
```

#### Method 2: CLI Context
```bash
npx cdk deploy --context envType=prod --context vpcMajorId=5 --context vpcMinorId=0 --context stackName=Primary --context r53ZoneName=tak.nz
```

#### Method 3: Default Values (Lowest Priority)
```bash
npx cdk deploy
# Uses hardcoded defaults when no other values are provided
```

**Parameters:**
- `envType`: Environment type (`prod` or `dev-test`). Default: `dev-test`
  - `prod`: Includes NAT Gateways, VPC endpoints, and production-grade resources
  - `dev-test`: Cost-optimized for development/testing
- `vpcMajorId`: Major VPC network ID (0-255) - selects /16 block from 10.0.0.0/8. Default: 0
- `vpcMinorId`: Minor VPC network ID (0-15) - selects /20 subnet within the /16 block. Default: 0
  - Combined creates CIDR: `10.{vpcMajorId}.{vpcMinorId*16}.0/20`
  - Provides 4,096 IP addresses per VPC
  - Allows for thousands of unique VPC configurations
- `stackName`: Environment/deployment identifier used in stack naming. Default: `devtest`
  - Creates stack name: `TAK-<name>-BaseInfra` (e.g., "TAK-Primary-BaseInfra")
  - Also used in CloudFormation export names for cross-stack references
- `r53ZoneName`: **(Required)** Existing public hosted zone name for ACM certificate creation (e.g., `tak.nz`)
  - An ACM certificate is automatically created with DNS validation
  - Certificate covers: `example.com`, `*.example.com`, `*.map.example.com`
  - Certificate ARN is exported as: `{StackName}-CERTIFICATE-ARN`


**Parameter Resolution Priority:**
1. Environment Variables (highest priority)
2. CLI Context (`--context`)
3. Default Values (lowest priority)

Higher priority methods override lower priority ones.

**Environment Variable to Context Mapping:**
- `ENV_TYPE` → `--context envType`
- `VPC_MAJOR_ID` → `--context vpcMajorId`
- `VPC_MINOR_ID` → `--context vpcMinorId`
- `STACK_NAME` → `--context stackName`
- `R53_ZONE_NAME` → `--context r53ZoneName`

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
aws cloudformation describe-stacks --stack-name TAK-Primary-BaseInfra --query 'Stacks[0].Outputs[?OutputKey==`VpcIdOutput`].OutputValue' --output text

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
npx cdk deploy --context r53ZoneName=tak.nz

# Reference the certificate in other stacks
aws cloudformation describe-stacks --stack-name TAK-DevTest-BaseInfra --query 'Stacks[0].Outputs[?OutputKey==`CertificateArnOutput`].OutputValue' --output text
```

**Requirements:**
- Public hosted zone must exist in Route 53 in the same AWS account
- Sufficient permissions to create ACM certificates and Route 53 records

## Notes
- Make sure your AWS credentials are configured.
- The stack type (prod/dev-test) can be changed later on.
- **The R53 zone name is now mandatory** - the stack will fail to deploy without it.

