# Configuration Management Guide

The TAK Base Infrastructure uses **AWS CDK context-based configuration** with centralized settings in [`cdk.json`](../cdk.json). This provides a single source of truth for all environment configurations while supporting runtime overrides.

## Quick Configuration Reference

### **Environment-Specific Deployment**
```bash
# Deploy with default configuration
npm run deploy:dev     # Development environment
npm run deploy:prod    # Production environment

# Deploy with configuration overrides
npm run deploy:dev -- --context r53ZoneName=custom.tak.nz
npm run deploy:prod -- --context vpcCidr=10.5.0.0/20
```

## Configuration System Architecture

### **Context-Based Configuration**
All configurations are stored in [`cdk.json`](../cdk.json) under the `context` section:

```json
{
  "context": {
    "dev-test": {
      "stackName": "Dev",
      "r53ZoneName": "dev.tak.nz", 
      "vpcCidr": "10.0.0.0/20",
      "networking": {
        "enableRedundantNatGateways": false,
        "createVpcEndpoints": false
      }
    },
    "prod": {
      "stackName": "Prod",
      "r53ZoneName": "tak.nz",
      "vpcCidr": "10.1.0.0/20", 
      "networking": {
        "enableRedundantNatGateways": true,
        "createVpcEndpoints": true
      }
    }
  }
}
```
      },
      "certificate": {
        "transparencyLoggingEnabled": false
      },
### **Environment Comparison**

| Environment | Stack Name | Description | Monthly Cost* |
|-------------|------------|-------------|---------------|
| `dev-test` | `TAK-Dev-BaseInfra` | Cost-optimized development | ~$44 |
| `prod` | `TAK-Prod-BaseInfra` | High-availability production | ~$143 |

*Estimated AWS costs for ap-southeast-2, excluding data processing and storage usage

### **Key Configuration Differences**

| Setting | dev-test | prod | Impact |
|---------|----------|------|--------|
| **VPC CIDR** | `10.0.0.0/20` | `10.0.0.0/20` | Same network range |
| **NAT Gateways** | `false` (1 gateway, cost-effective) | `true` (2 gateways, redundant) | High availability |
| **VPC Endpoints** | `false` (cost savings) | `true` (security) | Private AWS access |
| **Certificate Transparency** | `true` | `true` | Security compliance |
| **Container Insights** | `false` | `true` | ECS monitoring |
| **KMS Key Rotation** | `false` | `true` | Enhanced security |
| **S3 Versioning** | `false` | `true` | Data protection |
| **Removal Policy** | `DESTROY` | `RETAIN` | Resource cleanup |

---

## **Runtime Configuration Overrides**

Use CDK's built-in `--context` flag with **flat parameter names** to override any configuration value:

### **Network Configuration**
| Parameter | Description | dev-test | prod |
|-----------|-------------|----------|------|
| `enableRedundantNatGateways` | Enable redundant NAT gateways | `false` (1 gateway) | `true` (2 gateways) |
| `createVpcEndpoints` | Enable VPC interface endpoints | `false` | `true` |
| `vpcCidr` | VPC CIDR block | `10.0.0.0/20` | `10.0.0.0/20` |

### **Core Configuration**
| Parameter | Description | dev-test | prod |
|-----------|-------------|----------|------|
| `stackName` | CloudFormation stack name | `Dev` | `Prod` |
| `r53ZoneName` | Route 53 hosted zone | `dev.tak.nz` | `tak.nz` |

### **Certificate Configuration**
| Parameter | Description | dev-test | prod |
|-----------|-------------|----------|------|
| `transparencyLoggingEnabled` | Certificate transparency logging | `true` | `true` |

### **General Configuration**
| Parameter | Description | dev-test | prod |
|-----------|-------------|----------|------|
| `removalPolicy` | Resource cleanup policy | `DESTROY` | `RETAIN` |
| `enableDetailedLogging` | CloudWatch detailed logging | `true` | `true` |
| `enableContainerInsights` | ECS container insights | `false` | `true` |

### **KMS Configuration**
| Parameter | Description | dev-test | prod |
|-----------|-------------|----------|------|
| `enableKeyRotation` | Automatic key rotation | `false` | `true` |

### **S3 Configuration**
| Parameter | Description | dev-test | prod |
|-----------|-------------|----------|------|
| `enableVersioning` | S3 bucket versioning | `false` | `true` |
| `lifecycleRules` | S3 lifecycle management | `true` | `true` |

---

## **Security Considerations**

### **Network Security**
- **Private Subnets**: All compute resources deployed in private subnets
- **NAT Gateways**: Controlled internet access from private subnets
  - **dev-test**: 1 NAT Gateway (cost-effective, single AZ)
  - **prod**: 2 NAT Gateways (high availability, multi-AZ)
- **VPC Endpoints**: Private connectivity to AWS services (production)
- **Security Groups**: Restrictive access controls throughout

### **Data Security**
- **KMS Encryption**: All data encrypted with customer-managed keys
- **S3 Bucket Security**: Block all public access, enforce SSL

### **Access Control**
- **IAM Policies**: Least-privilege access patterns
- **Service-Linked Roles**: Proper ECS service permissions
- **Resource Policies**: Restrictive resource-level access

---

## **Cost Optimization**

### **Development Environment Optimizations**
- **Single NAT Gateway**: Uses 1 NAT gateway vs 2 in production (~$42/month savings)
- **No VPC Endpoints**: Eliminates interface endpoint costs (~$22/month savings)
- **Container Insights Disabled**: Reduces CloudWatch costs

### **Production Environment Features**
- **High Availability**: Dual NAT gateways across AZs
- **Private AWS Access**: VPC endpoints for S3, ECR, KMS, Secrets Manager, CloudWatch
- **Enhanced Security**: Key rotation, vulnerability scanning, versioning
- **Monitoring**: Container insights and detailed logging

---

## **Troubleshooting Configuration**

### **Common Configuration Issues**

#### **Invalid VPC CIDR**
```
Error: Invalid CIDR block format
```
**Solution**: Ensure CIDR uses valid format (e.g., `10.0.0.0/20`)

#### **Missing Route 53 Zone**
```
Error: Cannot find hosted zone
```
**Solution**: Verify the `r53ZoneName` matches an existing public hosted zone

#### **Boolean Value Errors**
```
Error: Expected boolean value
```
**Solution**: Use lowercase `true`/`false` (not `True`/`False`)

### **Configuration Validation**
```bash
# Preview configuration before deployment
npm run synth:dev
npm run synth:prod

# Validate specific overrides
npm run synth:dev -- --context dev-test.vpcCidr=10.5.0.0/20
```
```bash
# Custom domain
npm run deploy:dev -- --context r53ZoneName=custom.tak.nz
npm run deploy:prod -- --context r53ZoneName=enterprise.example.com

# Custom VPC CIDR  
npm run deploy:dev -- --context vpcCidr=10.5.0.0/20
npm run deploy:prod -- --context vpcCidr=10.1.0.0/20

# Enable/disable redundant NAT gateways
npm run deploy:dev -- --context enableRedundantNatGateways=true
npm run deploy:prod -- --context enableRedundantNatGateways=false

# Enable/disable VPC endpoints
npm run deploy:dev -- --context createVpcEndpoints=true
npm run deploy:prod -- --context createVpcEndpoints=false
```

### **Resource Configuration**
```bash
# S3 and KMS settings
npm run deploy:prod -- \
  --context enableVersioning=false \
  --context enableKeyRotation=false

# Certificate settings
npm run deploy:dev -- --context transparencyLoggingEnabled=false
```

### **Override Syntax Rules**
- Use **flat parameter names** (no dot notation): `parameter=value`
- **Command-line context always takes precedence** over `cdk.json` values
- Can override **any configuration property** defined in the environment config
- Boolean values: `true`/`false` (not `True`/`False`)
- Numeric values: Raw numbers (not quoted)

---

## **Stack Naming and Tagging**

### **Stack Names**
- **dev-test**: `TAK-Dev-BaseInfra`  
- **prod**: `TAK-Prod-BaseInfra`

### **Custom Stack Names**
```bash
# Results in "TAK-Staging-BaseInfra"
npm run deploy:prod -- --context stackName=Staging

# Results in "TAK-FeatureBranch-BaseInfra"  
npm run deploy:dev -- --context stackName=FeatureBranch
```

### **Resource Tagging**
All AWS resources are automatically tagged with:
- **Project**: "TAK.NZ" (from `tak-defaults.project` or `tak-project` override)
- **Component**: "BaseInfra" (from `tak-defaults.component` or `tak-component` override)
- **Environment**: The environment name (from `stackName`)
- **ManagedBy**: "CDK"

### **Project Configuration Overrides**
The project metadata can be overridden using individual context parameters:

```bash
# Override project name for custom branding
npm run deploy:dev -- --context tak-project="Custom TAK Project"

# Override component name (useful for custom deployments)
npm run deploy:dev -- --context tak-component="CustomBaseInfra"

# Override region for tagging purposes
npm run deploy:dev -- --context tak-region="us-east-1"
```

#### **Project Context Parameters**
| Parameter | Description | Default | Example Override |
|-----------|-------------|---------|------------------|
| `tak-project` | Project name for resource tagging | `TAK.NZ` | `"Enterprise TAK"` |
| `tak-component` | Component name for resource tagging | `BaseInfra` | `"CustomBaseInfra"` |
| `tak-region` | Region identifier for tagging | `ap-southeast-2` | `"us-west-2"` |

---

## **Complete Configuration Reference**

### **Core Settings**
| Parameter | Description | dev-test | prod |
|-----------|-------------|----------|------|
| `stackName` | CloudFormation stack name | `Dev` | `Prod` |
| `r53ZoneName` | Route 53 hosted zone | `dev.tak.nz` | `tak.nz` |
| `vpcCidr` | VPC CIDR block | `10.0.0.0/20` | `10.0.0.0/20` |

### **Networking Configuration**
| Parameter | Description | dev-test | prod |
|-----------|-------------|----------|------|
| `networking.enableRedundantNatGateways` | Enable redundant NAT gateways | `false` (1 NAT Gateway) | `true` (2 NAT Gateways) |
| `networking.createVpcEndpoints` | Enable VPC interface endpoints | `false` | `true` |

### **Certificate Configuration**
| Parameter | Description | dev-test | prod |
|-----------|-------------|----------|------|
| `certificate.transparencyLoggingEnabled` | Certificate transparency logging | `true` | `true` |
- `general.removalPolicy`: CloudFormation removal policy (DESTROY/RETAIN)
- `general.enableContainerInsights`: ECS Container Insights
- `general.enableDetailedLogging`: Detailed CloudWatch logging

### Security Configuration
- `kms.enableKeyRotation`: Automatic KMS key rotation
- `s3.enableVersioning`: S3 bucket versioning

## 📋 Deployment Examples

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
npx cdk deploy --context env=prod --context r53ZoneName=company.com

# Development with production-like networking
npx cdk deploy --context env=dev-test \
  --context networking.enableRedundantNatGateways=true \
  --context networking.createVpcEndpoints=true

# Custom environment for feature testing
npx cdk deploy --context env=dev-test \
  --context stackName=FeatureX \
  --context r53ZoneName=feature.tak.nz
```

## Required Environment Variables

```bash
# Set AWS credentials and region
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=$(aws configure get region || echo "ap-southeast-2")

# Deploy with environment variables set
npx cdk deploy --context env=prod
```
