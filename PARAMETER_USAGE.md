# CDK Parameter Resolution Examples

## Usage Examples

### 1. Deploy with environment variables (highest priority)
```bash
ENVTYPE=prod VPCLOCATIONID=10 cdk deploy
```

### 2. Deploy with CLI context
```bash
cdk deploy --context envType=prod --context vpcLocationId=10
```

### 3. Deploy with CLI parameters
```bash
cdk deploy --parameters EnvType=staging --parameters VPCLocationId=5
```

### 4. Deploy using config file values
Edit `cdk-config.json` and run:
```bash
cdk deploy
```

### 5. Deploy with interactive prompts
```bash
# Remove values from config file and run without other parameters
cdk deploy
# Will prompt for missing required parameters
```

### 6. Mixed approach (environment variables override everything)
```bash
# Uses envType from environment, vpcLocationId from config file
ENVTYPE=prod cdk deploy
```

## Configuration File

Edit `cdk-config.json`:
```json
{
  "envType": "dev-test",
  "vpcLocationId": 1,
  "description": "Development environment configuration"
}
```

## Parameter Resolution Order

1. **Environment Variables** (`ENVTYPE`, `VPCLOCATIONID`) - Highest priority
2. **CLI Context** (`--context paramName=value`)
3. **CLI Parameters** (`--parameters ParamName=value`)
4. **JSON Config File** (`cdk-config.json`)
5. **Interactive Prompts** (TTY mode only)
6. **Default Values** (defined in code)
7. **Error** (if required parameter not found)

## Environment-specific Configs

You can create multiple config files:
```bash
# Development
cdk deploy --context configFile=cdk-config-dev.json

# Production  
cdk deploy --context configFile=cdk-config-prod.json

# Or use environment variables
ENVTYPE=prod VPCLOCATIONID=5 cdk deploy
```
