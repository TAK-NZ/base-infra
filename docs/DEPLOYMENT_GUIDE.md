# 🚀 **TAK Base Infrastructure - Deployment Guide**

## **CDK Context-Based Configuration System**

The TAK Base Infrastructure uses a context-based configuration system for streamlined environment management.

### **✅ Quick Start**

#### **Deploy Development Environment:**
```bash
npx cdk deploy --context env=dev-test
```

#### **Deploy Production Environment:**
```bash
npx cdk deploy --context env=prod
```

That's it! 🎉

---

## **📋 Available Environments**

| Environment | Stack Name | Domain | Description |
|-------------|------------|--------|-------------|
| `dev-test` | `TAK-Dev-BaseInfra` | `dev.tak.nz` | Development/testing environment with cost optimization |
| `prod` | `TAK-Prod-BaseInfra` | `tak.nz` | Production environment with high availability |

---

## **🔧 Configuration System**

### **Environment Configuration**
All environment-specific configurations are stored in `cdk.json` under the `context` section:

```json
{
  "context": {
    "dev-test": {
      "stackName": "Dev",
      "r53ZoneName": "dev.tak.nz",
      "vpcCidr": "10.0.0.0/20",
      "networking": {
        "createNatGateways": false,
        "createVpcEndpoints": false
      },
      "general": {
        "removalPolicy": "DESTROY"
      }
    },
    "prod": {
      "stackName": "Prod", 
      "r53ZoneName": "tak.nz",
      "vpcCidr": "10.1.0.0/20",
      "networking": {
        "createNatGateways": true,
        "createVpcEndpoints": true
      },
      "general": {
        "removalPolicy": "RETAIN"
      }
    }
  }
}
```
If deploying this stack outside of TAK.NZ, the values need to be adjusted. 

### **Development Environment (`dev-test`):**
- **Cost Optimized:** Single NAT Gateway, no VPC endpoints
- **Flexible:** `DESTROY` removal policy for easy cleanup
- **Simplified:** Reduced ECR image retention, no container insights

### **Production Environment (`prod`):**
- **High Availability:** Redundant NAT Gateways, full VPC endpoints
- **Secure:** `RETAIN` removal policy, certificate transparency logging
- **Monitored:** Container insights enabled, vulnerability scanning

---

## **⚙️ Runtime Configuration Overrides**

The stack supports **simplified context overrides** that work for **any environment** without needing environment prefixes.

### **🎯 Simple Override Examples:**

#### **Custom Domain Name (works for any environment):**
```bash
npx cdk deploy --context env=dev-test --context r53ZoneName=custom.tak.nz
npx cdk deploy --context env=prod --context r53ZoneName=production.example.com
```

#### **Override VPC CIDR:**
```bash
npx cdk deploy --context env=dev-test --context vpcCidr=10.2.0.0/20
npx cdk deploy --context env=prod --context vpcCidr=10.5.0.0/16
```

#### **Enable NAT Gateways for Development Testing:**
```bash
npx cdk deploy --context env=dev-test --context networking.createNatGateways=true
```

#### **Disable NAT Gateways for Production Cost Savings:**
```bash
npx cdk deploy --context env=prod --context networking.createNatGateways=false
```

#### **Custom Stack Name for Feature Branch:**
```bash
npx cdk deploy --context env=dev-test --context stackName=Dev-FeatureBranch
```

#### **Enable Certificate Transparency for Development:**
```bash
npx cdk deploy --context env=dev-test --context certificate.transparencyLoggingEnabled=true
```

#### **Override Multiple ECR Settings:**
```bash
npx cdk deploy --context env=dev-test \
  --context ecr.imageRetentionCount=10 \
  --context ecr.scanOnPush=true
```

#### **Disable Container Insights for Production Cost Control:**
```bash
npx cdk deploy --context env=prod --context general.enableContainerInsights=false
```

### **🔄 Available Override Parameters:**

#### **Top-Level Parameters:**
- `r53ZoneName` - Route53 hosted zone name
- `vpcCidr` - VPC IPv4 CIDR block (e.g., `10.0.0.0/20`)
- `stackName` - Stack name suffix

#### **Networking Configuration:**
- `networking.createNatGateways` - Enable/disable NAT gateways (`true`/`false`)
- `networking.createVpcEndpoints` - Enable/disable VPC endpoints (`true`/`false`)

#### **Certificate Configuration:**
- `certificate.transparencyLoggingEnabled` - Enable certificate transparency (`true`/`false`)

#### **General Configuration:**
- `general.removalPolicy` - Resource removal policy (`DESTROY`/`RETAIN`)
- `general.enableDetailedLogging` - Enable detailed CloudWatch logging (`true`/`false`)
- `general.enableContainerInsights` - Enable ECS container insights (`true`/`false`)

#### **KMS Configuration:**
- `kms.enableKeyRotation` - Enable automatic key rotation (`true`/`false`)

#### **S3 Configuration:**
- `s3.enableVersioning` - Enable S3 bucket versioning (`true`/`false`)
- `s3.lifecycleRules` - Enable S3 lifecycle management (`true`/`false`)

#### **ECR Configuration:**
- `ecr.imageRetentionCount` - Number of images to retain (numeric value)
- `ecr.scanOnPush` - Enable vulnerability scanning on push (`true`/`false`)

### **✨ Benefits of the New Override System:**

- **🎯 Environment Agnostic:** Same override syntax works for both `dev-test` and `prod`
- **🚀 Simplified:** No need for environment prefixes (e.g., `dev-test.` or `prod.`)
- **💡 Intuitive:** Direct property names match the configuration structure
- **🔧 Flexible:** Override any configuration property at deployment time
- **📝 Clean:** Command lines are shorter and more readable

---

## **🏗️ What Changed from Legacy System**

### **Before: Complex Environment-Prefixed Overrides**
Required environment-specific prefixes:
```bash
# Old complex approach (no longer needed)
npx cdk deploy --context env=dev-test \
  --context dev-test.r53ZoneName=custom.tak.nz \
  --context dev-test.networking.createNatGateways=true \
  --context dev-test.vpcCidr=10.2.0.0/20
```

### **After: Simple Universal Overrides**
Clean, environment-agnostic syntax:
```bash
# New simplified approach
npx cdk deploy --context env=dev-test \
  --context r53ZoneName=custom.tak.nz \
  --context networking.createNatGateways=true \
  --context vpcCidr=10.2.0.0/20
```

---

## **📁 Configuration System Details**

### **Environment Configuration Storage**
All environment settings are stored in [`cdk.json`](../cdk.json) under the `context` section, following AWS CDK best practices:

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/cdk.ts",
  "context": {
    "dev-test": {
      "stackName": "Dev",
      "r53ZoneName": "dev.tak.nz",
      "vpcCidr": "10.0.0.0/20",
      "networking": {
        "createNatGateways": false,
        "createVpcEndpoints": false
      },
      "certificate": {
        "transparencyLoggingEnabled": false
      },
      "general": {
        "removalPolicy": "DESTROY",
        "enableDetailedLogging": true,
        "enableContainerInsights": false
      },
      "kms": {
        "enableKeyRotation": false
      },
      "s3": {
        "enableVersioning": false,
        "lifecycleRules": true
      },
      "ecr": {
        "imageRetentionCount": 5,
        "scanOnPush": false
      }
    },
    "prod": {
      "stackName": "Prod",
      "r53ZoneName": "tak.nz",
      "vpcCidr": "10.1.0.0/20",
      "networking": {
        "createNatGateways": true,
        "createVpcEndpoints": true
      },
      "certificate": {
        "transparencyLoggingEnabled": true
      },
      "general": {
        "removalPolicy": "RETAIN",
        "enableDetailedLogging": true,
        "enableContainerInsights": true
      },
      "kms": {
        "enableKeyRotation": true
      },
      "s3": {
        "enableVersioning": true,
        "lifecycleRules": true
      },
      "ecr": {
        "imageRetentionCount": 20,
        "scanOnPush": true
      }
    },
    "tak-defaults": {
      "project": "TAK",
      "component": "BaseInfra",
      "region": "ap-southeast-2"
    }
  }
}
```

The system **automatically loads** this configuration at deployment time and applies any command-line overrides.

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
  --context networking.createNatGateways=false \
  --context general.enableContainerInsights=false
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

---

## **🎯 Benefits**

- **🚀 95% simpler command-line syntax**
- **🎯 Environment-agnostic overrides**
- **📝 Single source of truth** for all configuration
- **🔄 Git-tracked settings** with version control
- **🤝 Consistent deployments** across team members
- **⚡ Easy environment management**
- **🔧 Flexible runtime customization**

The new system transforms complex, error-prone deployments into simple, reliable commands that anyone on the team can use confidently! 🚀
