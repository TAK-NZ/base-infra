# Test Organization Summary

## Test Suite Structure

### 📁 **test/vpc.test.ts** - VPC and Networking
- **Purpose**: Tests VPC creation and subnet configuration
- **Coverage**: 
  - VPC resource creation (1 VPC, 4 subnets)
  - IPv6 dual-stack support
  - Subnet properties and CIDR assignment (default and custom CIDR)

### 📁 **test/resources.test.ts** - AWS Resources  
- **Purpose**: Tests core AWS service resources
- **Coverage**:
  - ECS Cluster creation and configuration
  - ECR Repository creation with lifecycle rules
  - KMS Key and Alias creation
  - S3 Bucket creation with security settings (resource counts and ownership/public-access properties)

### 📁 **test/acm.test.ts** - ACM Certificate Management
- **Purpose**: Tests SSL certificate creation and Route53 integration
- **Coverage**:
  - ACM certificate creation with multiple domain names
  - Route53 hosted zone lookup integration
  - Certificate transparency logging settings
  - Subject Alternative Names (SAN) configuration

### 📁 **test/endpoints.test.ts** - VPC Endpoints
- **Purpose**: Tests VPC endpoint configuration
- **Coverage**:
  - S3 Gateway endpoint creation
  - Interface endpoints (conditional based on environment)
  - Security group configuration for endpoints
  - Environment-specific endpoint creation

### 📁 **test/elb-partition.test.ts** - ELB Log Bucket Partition Filtering
- **Purpose**: Tests that the ELB access-log bucket policy grants only the
  correct-partition ELB service-account principals
- **Coverage**:
  - Commercial regions get `arn:aws:` principals only
  - GovCloud regions get `arn:aws-us-gov:` principals only
  - Commercial and GovCloud principals are never mixed

### 📁 **test/outputs.test.ts** - CloudFormation Outputs
- **Purpose**: Tests stack output generation and export naming
- **Coverage**:
  - Validates all expected outputs exist
  - Tests the dynamic export naming system
  - Conditional output creation (IPv6, certificates, hosted zones)

### 📁 **test/naming.test.ts** - Dynamic Stack Naming
- **Purpose**: Tests the configurable naming system (cross-stack export contract)
- **Coverage**:
  - Resource Name tags use dynamic references
  - Export names use the `TAK-<Env>-BaseInfra-*` stack-name-prefixed pattern
    that consumer stacks import by name

### 📁 **test/config-validation.test.ts** - Configuration Files
- **Purpose**: Guards the `cdk.json` context contract that the app reads at
  synth/deploy time
- **Coverage**:
  - `cdk.json` parses without error
  - Required context sections (`dev-test`, `prod`, `tak-defaults`) exist

### 📁 **test/utils.test.ts** - Utility Functions
- **Purpose**: Tests decision-logic helper functions
- **Coverage**:
  - Standard tag generation (defaults and custom overrides)
  - Context override application and merging

### 📁 **test/integration.test.ts** - Integration Tests
- **Purpose**: High-level synth-smoke testing
- **Coverage**:
  - Stack synthesizes without errors when an R53 zone is provided
  - Stack construction throws when the R53 zone is missing

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test suite
npm test -- vpc.test.ts
npm test -- resources.test.ts
npm test -- acm.test.ts
npm test -- endpoints.test.ts
npm test -- elb-partition.test.ts
npm test -- outputs.test.ts
npm test -- naming.test.ts
npm test -- config-validation.test.ts
npm test -- utils.test.ts
npm test -- integration.test.ts

# Run tests with specific pattern
npm test -- --testPathPattern="vpc|resources|acm"
```

## Test Coverage Summary

- **Total Test Suites**: 10
- **All Constructs Covered**: ✅ Yes
- **Integration/Synth-Smoke Tests**: ✅ Yes  
- **Utility (Decision-Logic) Functions**: ✅ Yes
- **Configuration Contract**: ✅ Yes

## Testing Philosophy

Following the shared CDK test-cleanup guidance, this suite keeps only tests
that can fail for a **real reason** — decision-logic unit tests, synth-smoke,
cross-stack export-name contracts, and behavioral/safety-property assertions.
Tautological "config equals the literal I just typed" tests and full-template
snapshots are intentionally excluded, since they break on purposeful changes
and library bumps without catching real defects.
