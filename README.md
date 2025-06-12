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

The stack supports flexible parameter configuration through multiple methods with cascading priority:

#### Method 1: Environment Variables (Highest Priority)
```bash
ENV_TYPE=prod VPC_MAJOR_ID=5 VPC_MINOR_ID=0 STACK_NAME_SUFFIX=prodtest npx cdk deploy
```

#### Method 2: CLI Context
```bash
npx cdk deploy --context envType=prod --context vpcMajorId=5 --context vpcMinorId=0 --context stackName=prodtest
```

#### Method 3: Configuration File
Create or edit `cdk-config.json`:
```json
{
  "envType": "dev-test",
  "vpcMajorId": 0,
  "vpcMinorId": 0,
  "stackName": "devtest"
}
```
Then deploy:
```bash
npx cdk deploy
```

#### Method 4: Default Values (Lowest Priority)
```bash
npx cdk deploy
# Uses hardcoded defaults when no other values are provided
```

**Parameters:**
- `envType`: Environment type (`prod` or `dev-test`). Default: dev-test
  - `prod`: Includes NAT Gateways, VPC endpoints, and production-grade resources
  - `dev-test`: Cost-optimized for development/testing
- `vpcMajorId`: Major VPC network ID (0-255) - selects /16 block from 10.0.0.0/8. Default: 0.
- `vpcMinorId`: Minor VPC network ID (0-15) - selects /20 subnet within the /16 block. Default: 0.
  - Combined creates CIDR: `10.{vpcMajorId}.{vpcMinorId*16}.0/20`
  - Provides 4,096 IP addresses per VPC
  - Allows for thousands of unique VPC configurations
- `stackName`: Environment identifier used in stack naming and CloudFormation exports. Default: "devtest"

See [PARAMETER_USAGE.md](./PARAMETER_USAGE.md) for detailed parameter configuration examples.

**Parameter Resolution Priority:**
1. Environment Variables (highest priority)
2. CLI Context (`--context`)
3. JSON Config File (`cdk-config.json`)
4. Default Values (lowest priority)

Higher priority methods override lower priority ones.

## Customization
- Edit `lib/cdk-stack.ts` to adjust resources or parameters.

## Notes
- Make sure your AWS credentials are configured.
- The stack type (prod/dev-test) can be changed later on.

