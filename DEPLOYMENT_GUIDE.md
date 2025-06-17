# 🚀 **TAK Base Infrastructure - Deployment Guide**

## **CDK Context-Based Configuration System**

The TAK Base Infrastructure uses **AWS CDK best practices** with a context-based configuration system for streamlined environment management.

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

CDK provides built-in support for overriding any configuration value at deployment time using the `--context` flag:

### **Override Examples:**

#### **Custom Domain Name:**
```bash
npx cdk deploy --context env=dev-test --context dev-test.r53ZoneName=custom.tak.nz
```

#### **Disable NAT Gateways for Testing:**
```bash
npx cdk deploy --context env=prod --context prod.networking.createNatGateways=false
```

#### **Override VPC Configuration:**
```bash
npx cdk deploy --context env=dev-test \
  --context dev-test.vpcMajorId=2 \
  --context dev-test.vpcMinorId=1
```

#### **Custom Stack Name for Feature Branch:**
```bash
npx cdk deploy --context env=dev-test --context dev-test.stackName=Dev-FeatureBranch
```

#### **Override Multiple ECR Settings:**
```bash
npx cdk deploy --context env=dev-test \
  --context dev-test.ecr.imageRetentionCount=10 \
  --context dev-test.ecr.scanOnPush=true
```

### **Override Syntax:**
- Use **dot notation** to override nested properties: `environment.section.property=value`
- **Command-line context always takes precedence** over `cdk.json` values
- Can override **any configuration property** defined in the environment config

```bash
# Override domain name
npx cdk deploy --context env=dev-test --context r53ZoneName=custom.example.com

# Override stack name
npx cdk deploy --context env=prod --context stackName=CustomProd

# Override VPC settings
npx cdk deploy --context env=dev-test --context vpcMajorId=2
```

---

## **🏗️ What Changed**

### **Before: Complex Manual Configuration**
Required specifying each parameter individually:
```bash
npx cdk deploy \
  --context envType=prod \
  --context stackName=Prod \
  --context r53ZoneName=tak.nz \
  --context vpcMajorId=1 \
  --context certificateTransparency=false
```

### **After: Simple Environment-Based Deployment**
Environment configs are automatically loaded from `cdk.json`:
```bash
# Deploy with default environment config
npx cdk deploy --context env=prod

# Override specific values if needed
npx cdk deploy --context env=prod --context prod.r53ZoneName=custom.tak.nz
```

---

## **📁 Configuration System Details**

### **Environment Configuration Storage**
All environment settings are stored in [`cdk.json`](cdk.json) under the `context` section, following AWS CDK best practices:

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/cdk.ts",
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
      "networking": { "createNatGateways": false },
      // ... more settings
    },
    "prod": {
      "stackName": "Prod", 
      "r53ZoneName": "tak.nz",
      "networking": { "createNatGateways": true },
      // ... more settings
    }
  },
  "tak-defaults": {
    "project": "TAK",
    "component": "BaseInfra",
    "region": "ap-southeast-2"
  }
}
```

The system **automatically loads** this configuration file at deployment time, eliminating the need for complex command-line parameters.

---

## **🛠️ Development Workflow**

### **1. Validate Configuration:**
```bash
npx cdk synth --context env=dev-test
```

### **2. View Deployment Plan:**
```bash
npx cdk diff --context env=prod
```

### **3. Deploy:**
```bash
npx cdk deploy --context env=prod
```

### **4. Clean Up:**
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

- **90% fewer command-line parameters**
- **Single source of truth** for all configuration
- **Git-tracked settings** with version control
- **Consistent deployments** across team members
- **Easy environment management**

The new system transforms complex, error-prone deployments into simple, reliable commands that anyone on the team can use confidently! 🚀
