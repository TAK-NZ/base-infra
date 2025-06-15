# Parameters Management

The TAK Base Infrastructure project uses a **CDK context-driven configuration system** for all stack parameters. This approach provides clean separation between AWS credentials (via environment variables) and stack configuration (via CDK context).

## Parameter Resolution

Parameters are resolved through the **config-driven system** in the following order:

1. **CDK Context** - Explicit parameters passed via `--context` flag
2. **Environment Defaults** - Automatic defaults based on `envType` (prod vs dev-test)
3. **Built-in Defaults** - Hardcoded fallback values for optional parameters

## Available Parameters

### Core Infrastructure Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `envType` | No | `'dev-test'` | Environment type: `'prod'` or `'dev-test'` |
| `r53ZoneName` | **Yes** | N/A | Route 53 zone name ⚠️ **Required** |
| `vpcMajorId` | No | `0` | VPC CIDR major ID (10.{major}.0.0/16) |
| `vpcMinorId` | No | `0` | VPC CIDR minor ID (10.{major}.{minor}.0/16) |

### Networking Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `createNatGateways` | No | Environment-specific | Create redundant NAT Gateways (`true`/`false`) |
| `createVpcEndpoints` | No | Environment-specific | Create VPC interface endpoints (`true`/`false`) |

### Security Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `certificateTransparency` | No | Environment-specific | Enable certificate transparency logging (`true`/`false`) |

## Environment-Specific Default Values

### dev-test (Default)
- **Cost-optimized configuration**
- `createNatGateways`: `false` (single NAT Gateway)
- `createVpcEndpoints`: `false` (S3 gateway endpoint only)
- `certificateTransparency`: `false`
- **Estimated cost**: ~$35/month

### prod
- **High availability configuration**
- `createNatGateways`: `true` (redundant NAT Gateways)
- `createVpcEndpoints`: `true` (full VPC endpoints suite)
- `certificateTransparency`: `true`
- **Estimated cost**: ~$91/month

## Setting Parameters

### Required AWS Environment Variables

```bash
# Option 1: Set manually
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1

# Option 2: Auto-detect from AWS CLI configuration
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=$(aws configure get region)

# Option 3: One-liner deployment (auto-detects account/region)
CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text) \
CDK_DEFAULT_REGION=$(aws configure get region) \
npx cdk deploy --context r53ZoneName=example.com --context envType=dev-test

# Option 4: Use AWS Profile (CDK auto-detects account/region from profile)
npx cdk deploy --context r53ZoneName=example.com --context envType=dev-test --profile your-aws-profile
```

### CDK Context Method

```bash
# Deploy with custom parameters
npx cdk deploy --context envType=prod \
               --context r53ZoneName=example.com \
               --context vpcMajorId=5 \
               --context createNatGateways=true \
               --context createVpcEndpoints=false
```

# Example Deployment Commands

```bash
# Minimal deployment (dev-test with defaults)
npx cdk deploy --context r53ZoneName=example.com

# Production deployment with custom VPC
npx cdk deploy --context envType=prod \
               --context r53ZoneName=example.com \
               --context vpcMajorId=5 \
               --context createNatGateways=true \
               --context createVpcEndpoints=true \
               --context certificateTransparency=true

# Cost-optimized production
npx cdk deploy --context envType=prod \
               --context r53ZoneName=example.com \
               --context createNatGateways=false \
               --context createVpcEndpoints=false
```

## Environment-Specific Deployment

### Development Deployment
```bash
# Custom VPC CIDR: 10.5.2.0/16
npx cdk deploy --context envType=prod \
               --context r53ZoneName=example.com \
               --context vpcMajorId=5 \
               --context vpcMinorId=2
```

## Common Deployment Scenarios

### Development Deployment
```bash
# Cost-optimized (default)
npx cdk deploy --context r53ZoneName=dev.example.com
```

### Production Deployment
```bash
# High availability
npx cdk deploy --context envType=prod --context r53ZoneName=example.com
```

## Parameter Override Examples

### Override Specific Parameters

```bash
# Use prod environment but disable VPC endpoints for cost savings
npx cdk deploy --context envType=prod \
               --context createVpcEndpoints=false \
               --context r53ZoneName=example.com
```

### Custom VPC CIDR

The VPC CIDR block is calculated as `10.{vpcMajorId}.{vpcMinorId}.0/16`:

```bash
# Use custom VPC CIDR: 10.100.200.0/16
npx cdk deploy --context vpcMajorId=100 \
               --context vpcMinorId=200 \
               --context r53ZoneName=example.com
```