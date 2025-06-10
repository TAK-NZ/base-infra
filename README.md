<h1 align=center>TAK VPC</h1>

<p align=center>TAK Base Layer (VPC, ECS, ECR, S3, KMS)</p>

## Background

The [Team Awareness Kit (TAK)](https://tak.gov/solutions/emergency) provides Fire, Emergency Management, and First Responders an operationally agnostic tool for improved situational awareness and a common operational picture. 
This repo deploys the base infrastructure required to deploy a [TAK server](https://tak.gov/solutions/emergency) along with [Authentik](https://goauthentik.io/) as the authentication layer on AWS.

The following additional layers are required after deploying this `coe-base-<name>` layer:

| Name                  | Notes |
| --------------------- | ----- |
| `coe-auth-<name>`     | Authentication layer using Authentik - [repo](https://github.com/TAK-NZ/auth-infra)      |
| `coe-tak-<name>`      | TAK Server layer - [repo](https://github.com/TAK-NZ/tak-infra)      |

## Pre-Reqs

The following dependencies must be fulfilled:
- An [AWS Account](https://signin.aws.amazon.com/signup?request_type=register).
- A Domain Name under which the TAK server is made available, e.g. `tak.nz` in the example here.
- An [AWS ACM certificate](https://docs.aws.amazon.com/acm/latest/userguide/gs.html) certificate.
  - This certificate should cover the main domain - e.g. `tak.nz`, as well as `*.<domain name>` and `*.map.<domain name>`. E.g. `*.tak.nz` and `*.map.tak.nz`.


## Resources

This AWS CDK project provisions the following resources:
- VPC with public and private subnets (IPv4/IPv6)
- NAT Gateways (conditional on environment)
- Route tables and associations
- ECS Cluster
- ECR Repository with lifecycle policy
- KMS Key and Alias
- S3 Bucket with encryption and ownership controls
- VPC Endpoints for S3, ECR, KMS, Secrets Manager, and CloudWatch (only in production environment)

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

The stack supports flexible parameter configuration through multiple methods:

#### Option A: CLI Context (Recommended)
```bash
npx cdk deploy --context envType=prod --context vpcLocationId=10
```

#### Option B: Configuration File
Create or edit `cdk-config.json`:
```json
{
  "envType": "dev-test",
  "vpcLocationId": 0
}
```
Then deploy:
```bash
npx cdk deploy
```

#### Option C: Interactive Prompts
```bash
npx cdk deploy
# Will prompt for any missing required parameters
```

**Parameters:**
- `envType`: Environment type (`prod` or `dev-test`)
  - `prod`: Includes NAT Gateways and production-grade resources
  - `dev-test`: Cost-optimized for development/testing
- `vpcLocationId`: Unique VPC ID per AWS region (0-4095)
  - Creates /20 CIDR blocks: `10.{major}.{minor}.0/20`
  - Provides 4,096 IP addresses per VPC (vs 65,536 with /16)
  - Allows for 4,096 unique VPC configurations; For future use

See [PARAMETER_USAGE.md](./PARAMETER_USAGE.md) for detailed parameter configuration examples.

## Customization
- Edit `lib/cdk-stack.ts` to adjust resources or parameters.

## Notes
- Make sure your AWS credentials are configured.
- The stack name and environment type (prod/dev-test) can be set via CDK context or environment variables.
