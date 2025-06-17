# Configuration Management

The TAK Base Infrastructure uses **AWS CDK best practices** with a context-based configuration system stored in `cdk.json`. This eliminates complex command-line parameters and provides a single source of truth for all environment configurations.

## Quick Start

```bash
# Deploy development environment
npx cdk deploy --context env=dev-test

# Deploy production environment  
npx cdk deploy --context env=prod
```

## Configuration System

### Environment-Based Configuration
All configurations are stored in [`cdk.json`](../cdk.json) under the `context` section:

```json
{
  "context": {
    "dev-test": {
      "stackName": "Dev",
      "r53ZoneName": "dev.tak.nz",
      "vpcMajorId": 0,
      "vpcMinorId": 1,
      "networking": {
        "createNatGateways": false,
        "createVpcEndpoints": false
      },
      "certificate": {
        "transparencyLoggingEnabled": false
      },
      "general": {
        "removalPolicy": "DESTROY"
      }
    },
    "prod": {
      "stackName": "Prod", 
      "r53ZoneName": "tak.nz",
      "vpcMajorId": 1,
      "vpcMinorId": 0,
      "networking": {
        "createNatGateways": true,
        "createVpcEndpoints": true
      },
      "certificate": {
        "transparencyLoggingEnabled": true
      },
      "general": {
        "removalPolicy": "RETAIN"
      }
    }
  }
}
```

### Available Environments

| Environment | Stack Name | Description | Cost/Month |
|-------------|------------|-------------|------------|
| `dev-test` | `TAK-Dev-BaseInfra` | Cost-optimized for development | ~$35 |
| `prod` | `TAK-Prod-BaseInfra` | High availability for production | ~$91 |

### Key Configuration Differences

| Setting | dev-test | prod | Impact |
|---------|----------|------|--------|
| **NAT Gateways** | Single | Redundant (2x) | Cost & availability |
| **VPC Endpoints** | S3 only | Full suite (5x) | Cost & security |
| **Certificate Transparency** | Disabled | Enabled | Compliance |
| **Container Insights** | Disabled | Enabled | Monitoring |
| **KMS Key Rotation** | Disabled | Enabled | Security |
| **S3 Versioning** | Disabled | Enabled | Data protection |
| **Removal Policy** | DESTROY | RETAIN | Data safety |

## Runtime Configuration Overrides

Use CDK's built-in `--context` flag to override any configuration value:

### Common Override Examples

#### **Custom Domain Name:**
```bash
npx cdk deploy --context env=dev-test --context dev-test.r53ZoneName=custom.tak.nz
```

#### **Disable High Availability for Cost Savings:**
```bash
npx cdk deploy --context env=prod --context prod.networking.createNatGateways=false
```

#### **Custom VPC Configuration:**
```bash
npx cdk deploy --context env=dev-test \
  --context dev-test.vpcMajorId=2 \
  --context dev-test.vpcMinorId=1
```

#### **Override Multiple Settings:**
```bash
npx cdk deploy --context env=dev-test \
  --context dev-test.ecr.imageRetentionCount=10 \
  --context dev-test.ecr.scanOnPush=true \
  --context dev-test.networking.createVpcEndpoints=true
```

### Override Syntax
- Use **dot notation** for nested properties: `environment.section.property=value`
- **Command-line context always takes precedence** over `cdk.json` values
- Can override **any configuration property** defined in the environment config

## Stack Naming and Tagging

### Stack Names
- **dev-test**: `TAK-Dev-BaseInfra`
- **prod**: `TAK-Prod-BaseInfra`

### Custom Stack Names
Override the `stackName` property for custom deployments:

```bash
# Results in "TAK-Staging-BaseInfra"
npx cdk deploy --context env=prod --context prod.stackName=Staging

# Results in "TAK-FeatureBranch-BaseInfra"
npx cdk deploy --context env=dev-test --context dev-test.stackName=FeatureBranch
```

### Resource Tagging
All AWS resources are automatically tagged with:
- **Project**: "TAK" (from `tak-defaults.project`)
- **Component**: "BaseInfra" (from `tak-defaults.component`)
- **Environment**: The environment name (from `stackName`)
- **ManagedBy**: "CDK"

## Configuration Structure

### Core Settings
- `stackName`: Used in stack name (`TAK-{stackName}-BaseInfra`)
- `r53ZoneName`: Route 53 hosted zone for ACM certificate
- `vpcMajorId`: VPC CIDR major ID (10.{major}.0.0/16)
- `vpcMinorId`: VPC CIDR minor ID (10.{major}.{minor}.0/16)

### Networking Configuration
- `networking.createNatGateways`: Redundant NAT Gateways for HA
- `networking.createVpcEndpoints`: VPC interface endpoints for AWS services

### Certificate Configuration
- `certificate.transparencyLoggingEnabled`: Certificate transparency logging

### General Configuration
- `general.removalPolicy`: CloudFormation removal policy (DESTROY/RETAIN)
- `general.enableContainerInsights`: ECS Container Insights
- `general.enableDetailedLogging`: Detailed CloudWatch logging

### Security Configuration
- `kms.enableKeyRotation`: Automatic KMS key rotation
- `s3.enableVersioning`: S3 bucket versioning
- `ecr.scanOnPush`: ECR vulnerability scanning

## Deployment Examples

### Basic Deployments
```bash
# Development environment
npx cdk deploy --context env=dev-test

# Production environment
npx cdk deploy --context env=prod
```

### Advanced Deployments
```bash
# Production with custom domain
npx cdk deploy --context env=prod --context prod.r53ZoneName=company.com

# Development with production-like networking
npx cdk deploy --context env=dev-test \
  --context dev-test.networking.createNatGateways=true \
  --context dev-test.networking.createVpcEndpoints=true

# Custom environment for feature testing
npx cdk deploy --context env=dev-test \
  --context dev-test.stackName=FeatureX \
  --context dev-test.r53ZoneName=feature.tak.nz
```

## Required Environment Variables

```bash
# Set AWS credentials and region
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=$(aws configure get region || echo "ap-southeast-2")

# Deploy with environment variables set
npx cdk deploy --context env=prod
```

## Benefits of Context-Based Configuration

- **90% fewer command-line parameters**
- **Single source of truth** in `cdk.json`
- **Version controlled** configuration
- **Consistent deployments** across team members
- **Easy environment management**
- **Built-in CDK override support**

## Migration from Legacy Parameter System

### Before (Legacy)
```bash
npx cdk deploy \
  --context envType=prod \
  --context stackName=Prod \
  --context r53ZoneName=tak.nz \
  --context vpcMajorId=1 \
  --context createNatGateways=true \
  --context createVpcEndpoints=true
```

### After (Current)
```bash
# Simple deployment with all settings from cdk.json
npx cdk deploy --context env=prod

# Override specific settings if needed
npx cdk deploy --context env=prod --context prod.r53ZoneName=custom.tak.nz
```