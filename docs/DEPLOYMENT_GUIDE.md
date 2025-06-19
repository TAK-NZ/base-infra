# 🚀 TAK Base Infrastructure - Deployment Guide

## **Quick Start (Recommended)**

### **Prerequisites**
- AWS Account with configured credentials
- Public Route 53 hosted zone for your domain in the same account
- Node.js 18+ and npm installed

### **One-Command Deployment**
```bash
# Install dependencies
npm install

# Deploy development environment
npm run deploy:dev

# Deploy production environment  
npm run deploy:prod
```

**That's it!** 🎉 The enhanced npm scripts handle building, context configuration, and deployment.

---

## **📋 Environment Configurations**

| Environment | Stack Name | Domain | Cost/Month* | Features |
|-------------|------------|--------|-------------|----------|
| **dev-test** | `TAK-Dev-BaseInfra` | `dev.tak.nz` | ~$35 | Cost-optimized, single NAT gateway |
| **prod** | `TAK-Prod-BaseInfra` | `tak.nz` | ~$91 | High availability, dual NAT gateways, VPC endpoints |

*Estimated AWS costs excluding data transfer and usage

---

## **🔧 Advanced Configuration**

### **Custom Domain Deployment**
```bash
# Deploy with custom domain
npm run deploy:dev -- --context r53ZoneName=custom.tak.nz
npm run deploy:prod -- --context r53ZoneName=enterprise.tak.nz
```

### **Network Configuration Overrides**
```bash
# Custom VPC CIDR
npm run deploy:dev -- --context vpcCidr=10.5.0.0/20

# Disable redundant NAT gateways for cost savings (use 1 instead of 2)
npm run deploy:prod -- --context enableRedundantNatGateways=false

# Enable VPC endpoints in development
npm run deploy:dev -- --context createVpcEndpoints=true
```

### **Infrastructure Preview**
```bash
# Preview changes before deployment
npm run synth:dev     # Development environment
npm run synth:prod    # Production environment

# Show what would change
npm run cdk:diff:dev  # Development diff
npm run cdk:diff:prod # Production diff
```
---

## **⚙️ Configuration System Deep Dive**

### **Environment Configuration Structure**
All settings are stored in [`cdk.json`](../cdk.json) under the `context` section:

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
      },
      "certificate": {
        "transparencyLoggingEnabled": true  
      },
      "general": {
        "removalPolicy": "DESTROY",
        "enableDetailedLogging": true,
        "enableContainerInsights": false
      }
    }
  }
}
```

### **Runtime Configuration Overrides**
Override any configuration value using CDK's built-in `--context` flag with flat parameter names:

### **Configuration Override Examples**

#### **Domain and Networking**
```bash
# Custom domain for any environment
npm run deploy:dev -- --context r53ZoneName=custom.tak.nz
npm run deploy:prod -- --context r53ZoneName=enterprise.example.com

# VPC configuration
npm run deploy:dev -- --context vpcCidr=10.2.0.0/20
npm run deploy:prod -- --context vpcCidr=10.5.0.0/16

# Networking features
npm run deploy:dev -- --context enableRedundantNatGateways=true
npm run deploy:prod -- --context createVpcEndpoints=false
```

#### **Resource Configuration**
```bash
# ECR settings
npm run deploy:dev -- \
  --context imageRetentionCount=10 \
  --context scanOnPush=true

# S3 and KMS
npm run deploy:prod -- \
  --context enableVersioning=false \
  --context enableKeyRotation=false

# Certificate settings
npm run deploy:dev -- --context transparencyLoggingEnabled=false
```

### **🔧 Available Configuration Parameters**

| Parameter | Description | Default (dev-test) | Default (prod) |
|-----------|-------------|-------------------|----------------|
| `stackName` | CloudFormation stack name | `Dev` | `Prod` |
| `r53ZoneName` | Route 53 hosted zone | `dev.tak.nz` | `tak.nz` |
| `vpcCidr` | VPC CIDR block | `10.0.0.0/20` | `10.0.0.0/20` |
| `enableRedundantNatGateways` | Enable redundant NAT gateways | `false` (1 gateway) | `true` (2 gateways) |
| `createVpcEndpoints` | Enable VPC endpoints | `false` | `true` |
| `transparencyLoggingEnabled` | Certificate transparency | `true` | `true` |
| `removalPolicy` | Resource cleanup policy | `DESTROY` | `RETAIN` |
| `enableDetailedLogging` | CloudWatch detailed logging | `true` | `true` |
| `enableContainerInsights` | ECS container insights | `false` | `true` |
| `enableKeyRotation` | Automatic key rotation | `false` | `true` |
| `enableVersioning` | S3 bucket versioning | `false` | `true` |
| `lifecycleRules` | S3 lifecycle management | `true` | `true` |
| `imageRetentionCount` | ECR image retention | `5` | `20` |
| `scanOnPush` | ECR vulnerability scanning | `false` | `true` |

---

## **🚀 First-Time Setup**

### **Prerequisites**
1. **AWS Account** with appropriate permissions
2. **Route 53 Public Hosted Zone** for your domain
3. **Node.js 18+** and npm installed  
4. **AWS CLI** configured with credentials

### **Initial Setup Steps**
```bash
# 1. Clone and install
git clone <repository-url>
cd base-infra
npm install

# 2. Set environment variables (if using AWS profiles)
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text --profile your-profile)
export CDK_DEFAULT_REGION=$(aws configure get region --profile your-profile)

# 3. Bootstrap CDK (first time only)
npx cdk bootstrap --profile your-profile

# 4. Create ECS service-linked role (if first ECS deployment)
aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com --profile your-profile
```

### **Deployment Commands**
```bash
# Deploy using enhanced npm scripts
npm run deploy:dev    # Development environment
npm run deploy:prod   # Production environment

# Or use direct CDK commands
npx cdk deploy --context env=dev-test --profile your-profile
npx cdk deploy --context env=prod --profile your-profile
```

---

## **🔄 Environment Transformation**

### **Switching Between Environment Types**

One of the powerful features of this CDK stack is the ability to transform deployed environments between different configuration profiles (dev-test ↔ prod) without recreating resources from scratch.

### **Initial Deployment with Custom Configuration**
You can deploy a stack with custom naming and domain configuration that doesn't follow the standard dev-test or prod patterns:

```bash
# Deploy a demo environment with dev-test configuration
npx cdk deploy \
  --context env=dev-test \
  --context stackName=Demo \
  --context r53ZoneName=demo.tak.nz \
  --profile your-profile
```

This creates a stack named `TAK-Demo-BaseInfra` with:
- **1 NAT Gateway** (cost-optimized)
- **No VPC endpoints** (basic networking)
- **Development-grade settings** for ECR, S3, logging, etc.

### **Environment Upgrade (dev-test → prod)**
Later, you can upgrade the same stack to production-grade configuration:

```bash
# Transform to production configuration
npx cdk deploy \
  --context env=prod \
  --context stackName=Demo \
  --context r53ZoneName=demo.tak.nz \
  --profile your-profile
```

This **upgrades the existing** `TAK-Demo-BaseInfra` stack to:
- **2 NAT Gateways** (high availability)
- **VPC endpoints enabled** (enhanced security)
- **Production-grade settings** for all services
- **Resource retention policies** (data protection)

### **Environment Downgrade (prod → dev-test)**
You can also downgrade for cost optimization during development phases:

```bash
# Scale back to development configuration
npx cdk deploy \
  --context env=dev-test \
  --context stackName=Demo \
  --context r53ZoneName=demo.tak.nz \
  --profile your-profile
```

### **⚠️ Important Considerations**

1. **NAT Gateway Changes**: When switching from 2 NAT Gateways to 1, or vice versa, there may be brief network interruptions as the VPC subnets are reconfigured.

2. **Removal Policies**: When downgrading from prod to dev-test, resources with `RETAIN` policies will switch to `DESTROY` policies, but existing resources retain their original policy until replaced.

3. **Cost Impact**: Upgrading to prod configuration will increase costs due to additional NAT Gateways, VPC endpoints, and enhanced logging.

4. **Incremental Updates**: CDK intelligently updates only the resources that need to change, minimizing disruption to running applications.

### **Best Practices**
- **Test transformations** in a non-critical environment first
- **Plan for brief downtime** during NAT Gateway reconfigurations
- **Monitor costs** when upgrading to production configurations
- **Use consistent domain names** across transformations to avoid certificate recreation

---

## **🛠️ Troubleshooting**

### **Common Issues**

#### **Missing Route 53 Hosted Zone**
```
Error: Cannot find hosted zone
```
**Solution:** Ensure your domain's public hosted zone exists in Route 53 before deployment.

#### **Insufficient Permissions**
```
Error: User is not authorized to perform: cloudformation:*
```
**Solution:** Ensure your AWS credentials have sufficient permissions for CDK operations.

#### **ECS Service-Linked Role Missing**
```
Error: Unable to create service-linked role
```
**Solution:** Create the ECS service-linked role manually:
```bash
aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com
```

#### **Context Environment Not Found**
```
Error: Environment configuration for 'dev-test' not found
```
**Solution:** Ensure you're using the correct environment name (`dev-test` or `prod`).

### **Debug Commands**
```bash
# Check what would be deployed
npm run synth:dev
npm run synth:prod

# See differences from current state
npm run cdk:diff:dev
npm run cdk:diff:prod

# View CloudFormation events
aws cloudformation describe-stack-events --stack-name TAK-Dev-BaseInfra --profile your-profile
```

---

## **� Post-Deployment**

### **Verify Deployment**
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name TAK-Dev-BaseInfra --profile your-profile

# View outputs
aws cloudformation describe-stacks --stack-name TAK-Dev-BaseInfra \
  --query 'Stacks[0].Outputs' --profile your-profile
```

### **Next Steps**
After successful base infrastructure deployment:

1. **Deploy Authentication Layer** - [auth-infra repository](https://github.com/TAK-NZ/auth-infra)
2. **Deploy TAK Server Layer** - [tak-infra repository](https://github.com/TAK-NZ/tak-infra)

### **Cleanup**
```bash
# Destroy development environment
npx cdk destroy --context env=dev-test --profile your-profile

# Destroy production environment (use with caution!)
npx cdk destroy --context env=prod --profile your-profile
```

---

## **🔗 Related Documentation**

- **[Main README](../README.md)** - Project overview and quick start
- **[Architecture Guide](ARCHITECTURE.md)** - Technical architecture details
- **[Configuration Guide](PARAMETERS.md)** - Complete configuration reference
- **[Quick Reference](QUICK_REFERENCE.md)** - Fast deployment commands
npx cdk deploy --context env=dev-test \
  --context r53ZoneName=custom.tak.nz \
  --context enableRedundantNatGateways=true \
  --context vpcCidr=10.2.0.0/20
```

---

## **🛠️ Development Workflow**

### **1. Validate Configuration:**
```bash
npx cdk synth --context env=dev-test
```

### **2. Test with Overrides:**
```bash
npx cdk synth --context env=dev-test --context vpcCidr=10.99.0.0/16
```

### **3. View Deployment Plan:**
```bash
npx cdk diff --context env=prod
```

### **4. Deploy:**
```bash
npx cdk deploy --context env=prod
```

### **5. Deploy with Custom Settings:**
```bash
npx cdk deploy --context env=prod \
  --context enableRedundantNatGateways=false \
  --context enableContainerInsights=false
```

### **6. Clean Up:**
```bash
npx cdk destroy --context env=dev-test
```

---

## **🔐 Environment Variables**

For AWS credentials and region:

```bash
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=ap-southeast-2
npx cdk deploy --context env=prod
```
