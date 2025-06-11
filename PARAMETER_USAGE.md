# CDK Parameter Resolution Examples

## Usage Examples

### 1. Deploy with environment variables (highest priority)
```bash
ENV_TYPE=prod VPC_MAJOR_ID=100 cdk deploy
```

### 2. Deploy with CLI context
```bash
cdk deploy --context envType=prod --context vpcMajorId=100
```

### 3. Deploy using config file values
Edit `cdk-config.json` and run:
```bash
cdk deploy
```

### 4. Mixed approach (environment variables override everything)
```bash
# Uses envType from environment, other values from config file
ENV_TYPE=prod cdk deploy
```

## Configuration File

Edit `cdk-config.json`:
```json
{
  "envType": "dev-test",
  "vpcMajorId": 0,
  "vpcMinorId": 0,
  "stackName": "devtest",
  "description": "Development environment configuration",
  "project": "TAK-NZ"
}
```

## Parameter Resolution Order

1. **Environment Variables** (`ENV_TYPE`, `VPC_MAJOR_ID`, `VPC_MINOR_ID`, `STACK_NAME_SUFFIX`) - Highest priority
2. **CLI Context** (`--context paramName=value`)
3. **JSON Config File** (`cdk-config.json`)
4. **Default Values** (defined in code) - Lowest priority

## Environment-specific Configs

You can create multiple config files:
```bash
# Development using config file
cdk deploy

# Production using environment variables
ENV_TYPE=prod VPC_MAJOR_ID=5 cdk deploy

# Using custom config file path
CDK_CONFIG_FILE=configs/prod-config.json cdk deploy
```

## Parameter Descriptions

- **envType**: Controls resource creation (prod enables VPC endpoints, dual NAT gateways)
- **vpcMajorId**: Selects /16 network block (0-255) from 10.0.0.0/8 address space
- **vpcMinorId**: Selects /20 subnet block (0-15) within the chosen /16 network
- **stackName**: Environment identifier used in stack naming and CloudFormation exports
- **project**: Project tag applied to all resources for cost allocation
