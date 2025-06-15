# Parameters Management

The `lib/parameters.ts` module provides centralized parameter management for the TAK Base Infrastructure project. It supports cascading parameter resolution with multiple sources and validation.

## Parameter Resolution Priority

Parameters are resolved in the following order (highest to lowest priority):

1. **Environment Variables** - System environment variables
2. **CDK Context** - Parameters passed via `--context` flag or defined in `cdk.json`
3. **Environment Config Defaults** - Environment-specific defaults from `lib/environment-config.ts`

## Available Parameters

### Core Infrastructure Parameters

| Parameter | Environment Variable | Default | Description |
|-----------|---------------------|---------|-------------|
| `project` | `PROJECT` | `'TAK'` | Project name used for resource tagging (stack naming always uses 'TAK') |
| `envType` | `ENV_TYPE` | `'dev-test'` | Environment type (prod, dev-test, staging) |
| `stackName` | `STACK_NAME` | `'MyFirstStack'` | Stack identifier used in final stack name (becomes `TAK-{stackName}-BaseInfra`) |
| `vpcMajorId` | `VPC_MAJOR_ID` | `0` | VPC CIDR major ID (10.{major}.0.0/16) |
| `vpcMinorId` | `VPC_MINOR_ID` | `0` | VPC CIDR minor ID (10.{major}.{minor}.0/16) |
| `r53ZoneName` | `R53_ZONE_NAME` | N/A | Route 53 zone name ⚠️ **Required** |

### Networking Parameters

| Parameter | Environment Variable | Default | Description |
|-----------|---------------------|---------|-------------|
| `createNatGateways` | `CREATE_NAT_GATEWAYS` | Environment-specific | Create redundant NAT Gateways (true/false) |
| `createVpcEndpoints` | `CREATE_VPC_ENDPOINTS` | Environment-specific | Create VPC interface endpoints (true/false) |

### Security Parameters

| Parameter | Environment Variable | Default | Description |
|-----------|---------------------|---------|-------------|
| `certificateTransparency` | `CERTIFICATE_TRANSPARENCY` | Environment-specific | Enable certificate transparency logging (true/false) |

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

### staging
- **Production-like with cost optimizations**
- `createNatGateways`: `true` (test HA setup)
- `createVpcEndpoints`: `false` (cost optimization)
- `certificateTransparency`: `true`
- **Estimated cost**: ~$67/month

## Setting Parameters

### Method 1: CDK Context (Recommended for CI/CD)

```bash
# Deploy with custom parameters
npx cdk deploy --context project=MyCompany \
               --context stackName=Primary \
               --context envType=prod \
               --context r53ZoneName=example.com \
               --context createNatGateways=true \
               --context createVpcEndpoints=false
```

### Method 2: Environment Variables

```bash
# Development environment
export PROJECT=MyCompany
export STACK_NAME=Development
export ENV_TYPE=dev-test
export R53_ZONE_NAME=dev.example.com
export CREATE_NAT_GATEWAYS=false
export CREATE_VPC_ENDPOINTS=false
export CERTIFICATE_TRANSPARENCY=false

npx cdk deploy
```

```bash
# Production environment
export PROJECT=MyCompany
export STACK_NAME=Production
export ENV_TYPE=prod
export R53_ZONE_NAME=example.com
export CREATE_NAT_GATEWAYS=true
export CREATE_VPC_ENDPOINTS=true
export CERTIFICATE_TRANSPARENCY=true

npx cdk deploy
```

### Method 3: .env File (Development)

Create a `.env` file in the project root:

```bash
# Base Infrastructure Configuration
PROJECT=MyCompany
STACK_NAME=Primary
ENV_TYPE=dev-test
R53_ZONE_NAME=dev.example.com
VPC_MAJOR_ID=0
VPC_MINOR_ID=0

# Networking Overrides
CREATE_NAT_GATEWAYS=false
CREATE_VPC_ENDPOINTS=false

# Security Overrides
CERTIFICATE_TRANSPARENCY=false
```

## VPC CIDR Configuration

The VPC CIDR block is calculated as `10.{vpcMajorId}.{vpcMinorId}.0/16`:

```typescript
// Default: 10.0.0.0/16
ENV_TYPE=dev-test
VPC_MAJOR_ID=0
VPC_MINOR_ID=0

// Custom: 10.1.5.0/16
ENV_TYPE=prod
VPC_MAJOR_ID=1
VPC_MINOR_ID=5
```

## Environment-Specific Deployment

### Development Deployment
```bash
# Cost-optimized (default)
ROUTE53_ZONE_NAME=dev.example.com npx cdk deploy
```

### Staging Deployment
```bash
# Production-like with cost optimization
ENV_TYPE=staging ROUTE53_ZONE_NAME=staging.example.com npx cdk deploy
```

### Production Deployment
```bash
# High availability
ENV_TYPE=prod ROUTE53_ZONE_NAME=example.com npx cdk deploy
```

## Parameter Override Examples

### Override Specific Parameters

```bash
# Use prod environment but disable VPC endpoints for cost savings
ENV_TYPE=prod \
CREATE_VPC_ENDPOINTS=false \
ROUTE53_ZONE_NAME=example.com \
npx cdk deploy
```

### Custom VPC CIDR

```bash
# Use custom VPC CIDR: 10.100.200.0/16
VPC_MAJOR_ID=100 \
VPC_MINOR_ID=200 \
ROUTE53_ZONE_NAME=example.com \
npx cdk deploy
```

## Best Practices

1. **Required Parameters**: Always provide `R53_ZONE_NAME` - it's mandatory for ACM certificate validation
2. **Environment-Specific Deployment**: Use appropriate `ENV_TYPE` for your deployment target
3. **Cost Optimization**: Use `dev-test` for development, `prod` for production workloads
4. **Parameter Validation**: Let the system validate parameters - don't bypass validation
5. **CDK Context for CI/CD**: Use `--context` flags in automated deployments for consistency
6. **Environment Variables for Development**: Use `.env` files for local development
7. **Override Sparingly**: Only override parameters when you need to deviate from environment defaults
