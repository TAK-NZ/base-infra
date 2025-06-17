# TAK Base Infrastructure - Architecture Documentation

This folder contains the architecture documentation for the TAK Base Infrastructure project.

## Documentation Files

- **`QUICK_REFERENCE.md`** - Quick deployment commands and environment comparison
- **`PARAMETERS.md`** - Complete configuration management guide  
- **`ARCHITECTURE.md`** - Detailed technical architecture documentation

## Configuration System

The TAK Base Infrastructure uses **AWS CDK best practices** with a context-based configuration system:

### Quick Deployment
```bash
# Development environment (cost-optimized)
npx cdk deploy --context env=dev-test

# Production environment (high availability)
npx cdk deploy --context env=prod
```

### Environment Configurations
All settings are stored in [`cdk.json`](../cdk.json) under the `context` section, providing:
- **Single source of truth** for all configurations
- **Version controlled** settings with Git
- **Consistent deployments** across team members  
- **Easy runtime overrides** using CDK's built-in `--context` flag

## Production Architecture Overview

The production deployment includes:

### High Availability Components
- **Dual NAT Gateways**: One in each Availability Zone for redundancy
- **Cross-AZ Deployment**: Resources span two availability zones

### Security Features  
- **VPC Endpoints**: 6 endpoints providing private access to AWS services
- **KMS Encryption**: All data encrypted at rest using customer-managed keys
- **Private Subnets**: Application workloads isolated from direct internet access

### Network Architecture
- **IPv4/IPv6 Dual Stack**: Full support for both IP versions
- **Dynamic CIDR Allocation**: /20 VPC from 10.0.0.0/8 using Major/Minor ID system
- **Route Isolation**: Separate route tables for public and private subnets

### Cost Implications

**Production Monthly Cost Breakdown (US East-1):**

| Component | Monthly Cost (USD) | Notes |
|-----------|-------------------|-------|
| Dual NAT Gateways | $64.80 | $32.40 each |
| VPC Endpoints (5x Interface) | $22.50 | $4.50 each |
| KMS Key | $1.00 | Customer-managed |
| Storage (ECR + S3) | $1-2 | Variable based on usage |
| Data Transfer | $1-5 | Variable based on traffic |
| **Total Base Cost** | **~$90-95/month** | Plus usage fees |

### Resources Deployed

| Resource Type | Count | Notes |
|---------------|-------|-------|
| VPC | 1 | /20 CIDR (4,096 IPs) |
| Subnets | 4 | 2 public + 2 private |
| NAT Gateways | 2 | High availability |
| VPC Endpoints | 6 | 1 Gateway + 5 Interface |
| ECS Cluster | 1 | Fargate-enabled |
| ECR Repository | 1 | With lifecycle policy |
| S3 Bucket | 1 | KMS encrypted |
| KMS Key | 1 | Customer-managed |

## Dev-Test Architecture Overview

The dev-test deployment is optimized for cost-effectiveness during development and testing:

### Cost Optimization Features
- **Single NAT Gateway**: Only one NAT Gateway in AZ-A, shared by both private subnets
- **No Interface VPC Endpoints**: Only the free S3 Gateway endpoint is included
- **Simplified Security**: Basic setup sufficient for development workloads

### Architecture Differences vs Production

**Cost Comparison:**

| Component | Dev-Test | Production | Monthly Savings |
|-----------|----------|------------|-----------------|
| NAT Gateways | 1 @ $32.40 | 2 @ $64.80 | $32.40 |
| VPC Endpoints | S3 Gateway (free) | 5 Interface @ $22.50 | $22.50 |
| Data Transfer | Lower volume | Higher volume | $1-5 |
| **Total Cost** | **~$35/month** | **~$91/month** | **~$56/month** |

**Detailed Dev-Test Cost Breakdown (US East-1):**

| Category | Resource | Monthly Cost |
|----------|----------|--------------|
| **Networking** | Single NAT Gateway | $32.40 |
| | S3 Gateway Endpoint | $0.00 |
| **Compute** | ECS Cluster | $0.00 |
| | ECR Repository | ~$0.50 |
| **Security** | KMS Key | $1.00 |
| **Storage** | S3 Bucket | ~$0.02 |
| **Data Transfer** | NAT + Internet | ~$0.90 |
| **Total** | | **~$34.82/month** |

### Trade-offs in Dev-Test

**Advantages:**
- Significant cost savings for development workloads
- Same core functionality (VPC, ECS, ECR, S3, KMS)
- Suitable for development, testing, and learning

**Limitations:**
- Single NAT Gateway creates potential single point of failure
- Private subnet B routes through NAT Gateway A (cross-AZ data charges)
- No private VPC endpoints (AWS service calls go through NAT Gateway)
- Less suitable for production workloads requiring high availability

## Architecture Benefits

### vs dev-test Configuration

The production configuration provides significant advantages over dev-test:

1. **High Availability**: Redundant NAT Gateways prevent single points of failure
2. **Enhanced Security**: VPC endpoints keep AWS service traffic within the VPC
3. **Better Performance**: Reduced latency for AWS service API calls
4. **Cost Optimization at Scale**: VPC endpoints reduce NAT Gateway data transfer costs for high-traffic applications

### Security Considerations

- All application workloads run in private subnets
- Internet access is controlled through NAT Gateways
- AWS service access is via private VPC endpoints (no internet routing)
- Data at rest is encrypted using customer-managed KMS keys
- Network-level access controls via Security Groups (implicit)

### Scalability

The infrastructure is designed to support:
- Multiple ECS services and tasks
- Horizontal scaling across availability zones  
- Additional VPC endpoints as needed
- Integration with application load balancers
- Database services in private subnets

## Related Documentation

- [`../README.md`](../README.md) - Main project documentation and deployment guide
- [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md) - Quick decision guide and summary

## Architecture Comparison: Dev-Test vs Production

### Visual Comparison

| Aspect | Dev-Test | Production |
|--------|----------|------------|
| **Fault Tolerance** | Single NAT Gateway (shared) | Dual NAT Gateways (per AZ) |
| **Network Security** | Internet routing for AWS services | Private VPC endpoints |
| **Cost** | ~$35/month | ~$91/month |
| **Suitable For** | Development, testing, learning | Production workloads |

### Key Architecture Differences

#### NAT Gateway Configuration
- **Dev-Test**: 1 NAT Gateway in AZ-A only
  - Private Subnet B routes through NAT Gateway A (cross-AZ)
  - Single point of failure for internet access
  - Cost: ~$32/month

- **Production**: 2 NAT Gateways (one per AZ)
  - Each private subnet has dedicated NAT Gateway
  - High availability and fault tolerance
  - Cost: ~$65/month

#### VPC Endpoints
- **Dev-Test**: S3 Gateway Endpoint only (free)
  - ECR, KMS, Secrets Manager, CloudWatch calls go through NAT Gateway
  - Higher data transfer costs for AWS service calls

- **Production**: 6 VPC Endpoints total
  - S3 Gateway Endpoint (free)
  - 5 Interface Endpoints: ECR (2x), KMS, Secrets Manager, CloudWatch
  - Private routing for AWS services
  - Cost: ~$23/month + reduced NAT Gateway data charges

#### Network Flow
- **Dev-Test**: AWS service calls → NAT Gateway → Internet → AWS Services
- **Production**: AWS service calls → VPC Endpoints (private) → AWS Services

### When to Use Each Configuration

#### Choose Dev-Test When:
- Building and testing applications
- Learning AWS and CDK
- Cost is a primary concern
- Occasional downtime is acceptable
- Working with development/staging environments

#### Choose Production When:
- Running production workloads
- High availability is required
- Security compliance requires private AWS service access
- Cost optimization through reduced data transfer
- Serving real users/customers

## Comprehensive Cost Analysis

### Monthly Cost Estimates (US East-1 Region)

#### Production Environment Details

**VPC & Networking:**
| Resource | Quantity | Unit Cost | Monthly Cost |
|----------|----------|-----------|--------------|
| VPC | 1 | Free | $0.00 |
| Subnets | 4 | Free | $0.00 |
| Internet Gateway | 1 | Free | $0.00 |
| NAT Gateways | 2 | $32.40/month | $64.80 |
| Elastic IPs (attached) | 2 | Free | $0.00 |
| S3 Gateway Endpoint | 1 | Free | $0.00 |
| VPC Interface Endpoints | 5 | $4.50/month | $22.50 |

**Compute & Storage:**
| Resource | Quantity | Unit Cost | Monthly Cost |
|----------|----------|-----------|--------------|
| ECS Cluster | 1 | Free | $0.00 |
| ECR Repository | 1 | $0.10/GB/month | ~$0.50 |
| KMS Key | 1 | $1.00/month | $1.00 |
| S3 Bucket | 1 | $0.023/GB/month | ~$0.02 |

**Data Transfer (Estimated):**
| Type | Monthly Usage | Unit Cost | Monthly Cost |
|------|---------------|-----------|--------------|
| NAT Gateway Processing | 20 GB | $0.045/GB | $0.90 |
| Internet Transfer Out | 10 GB | $0.09/GB | $0.90 |
| VPC Endpoint Processing | 15 GB | $0.01/GB | $0.15 |

**Production Total: ~$90.77/month**

#### Dev-Test Environment Details

**VPC & Networking:**
| Resource | Quantity | Unit Cost | Monthly Cost |
|----------|----------|-----------|--------------|
| NAT Gateway | 1 | $32.40/month | $32.40 |
| S3 Gateway Endpoint | 1 | Free | $0.00 |
| (No Interface Endpoints) | - | - | $0.00 |

**Compute & Storage:**
| Resource | Quantity | Unit Cost | Monthly Cost |
|----------|----------|-----------|--------------|
| ECS Cluster | 1 | Free | $0.00 |
| ECR Repository | 1 | $0.10/GB/month | ~$0.50 |
| KMS Key | 1 | $1.00/month | $1.00 |
| S3 Bucket | 1 | $0.023/GB/month | ~$0.02 |

**Data Transfer (Estimated):**
| Type | Monthly Usage | Unit Cost | Monthly Cost |
|------|---------------|-----------|--------------|
| NAT Gateway Processing | 10 GB | $0.045/GB | $0.45 |
| Internet Transfer Out | 5 GB | $0.09/GB | $0.45 |

**Dev-Test Total: ~$34.82/month**

### Annual Cost Comparison

| Environment | Monthly Cost | Annual Cost | Annual Savings vs Prod |
|-------------|--------------|-------------|------------------------|
| **Dev-Test** | $34.82 | $417.84 | - |
| **Production** | $90.77 | $1,089.24 | $671.40 more |

### Variable Cost Factors

1. **Data Transfer Usage** varies significantly based on:
   - Application traffic through NAT Gateways
   - ECR image pulls and pushes
   - S3 data transfer volume
   - VPC endpoint usage (production only)

2. **Storage Growth**:
   - ECR repository size (container images)
   - S3 bucket usage (configuration files, logs)
   - CloudWatch logs retention

3. **Regional Pricing**: Costs shown are for US East-1. Other regions may vary ±10-20%

4. **Free Tier Benefits**: New AWS accounts receive free tier benefits that reduce initial costs

### Future Scaling Costs

As you deploy applications on this infrastructure:

- **ECS Fargate Tasks**: $0.04048/vCPU/hour + $0.004445/GB/hour
- **Application Load Balancers**: ~$16.20/month + data processing charges
- **RDS Databases**: Variable based on instance type and storage
- **CloudWatch Logs**: $0.50/GB ingested + $0.03/GB stored
- **Domain & SSL**: Route 53 hosted zones ($0.50/month) + domain registration

### Cost Optimization Recommendations

#### For Dev-Test:
- Use the default configuration - already optimized for cost
- Monitor ECR image cleanup via lifecycle policies
- Clean up unused stacks regularly
- Schedule resources to run only during development hours if possible

#### For Production:
- VPC endpoints actually **save money** at scale by reducing NAT Gateway data transfer costs
- Monitor VPC endpoint usage to ensure they provide value
- Consider Reserved Instances for predictable ECS workloads
- Implement CloudWatch cost anomaly detection

#### General:
- Set up **AWS Budgets** with alerts for both environments
- Use **AWS Cost Explorer** to track actual vs estimated costs
- Enable **AWS Cost Anomaly Detection** for unexpected spikes
- Tag all resources properly for cost allocation tracking

## CloudFormation Exports

This stack exports the following values for use by other stacks:

| Export Name Pattern | Description | Example Value |
|---------------------|-------------|---------------|
| `TAK-{StackName}-BaseInfra-VPC-ID` | VPC ID | `vpc-abc123def456` |
| `TAK-{StackName}-BaseInfra-VPC-CIDR-IPV4` | VPC IPv4 CIDR Block | `10.0.0.0/16` |
| `TAK-{StackName}-BaseInfra-SUBNET-PUBLIC-A` | Public Subnet A ID | `subnet-abc123` |
| `TAK-{StackName}-BaseInfra-SUBNET-PUBLIC-B` | Public Subnet B ID | `subnet-def456` |
| `TAK-{StackName}-BaseInfra-SUBNET-PRIVATE-A` | Private Subnet A ID | `subnet-ghi789` |
| `TAK-{StackName}-BaseInfra-SUBNET-PRIVATE-B` | Private Subnet B ID | `subnet-jkl012` |
| `TAK-{StackName}-BaseInfra-ECS-CLUSTER` | ECS Cluster ARN | `arn:aws:ecs:region:account:cluster/name` |
| `TAK-{StackName}-BaseInfra-ECR-REPO` | ECR Repository ARN | `arn:aws:ecr:region:account:repository/name` |
| `TAK-{StackName}-BaseInfra-KMS-KEY` | KMS Key ARN | `arn:aws:kms:region:account:key/key-id` |
| `TAK-{StackName}-BaseInfra-S3-BUCKET` | S3 Config Bucket ARN | `arn:aws:s3:::bucket-name` |
| `TAK-{StackName}-BaseInfra-CERTIFICATE-ARN` | ACM Certificate ARN | `arn:aws:acm:region:account:certificate/cert-id` |
| `TAK-{StackName}-BaseInfra-HOSTED-ZONE-ID` | Route53 Hosted Zone ID | `Z1PA6795UKMFR9` |

**VPC Endpoints** (production environment only):
- `TAK-{StackName}-BaseInfra-S3-ID` - S3 Gateway Endpoint ID
- `TAK-{StackName}-BaseInfra-ECR-DKR-ID` - ECR Docker Interface Endpoint ID
- `TAK-{StackName}-BaseInfra-ECR-API-ID` - ECR API Interface Endpoint ID
- `TAK-{StackName}-BaseInfra-SECRETSMANAGER-ID` - Secrets Manager Interface Endpoint ID
- `TAK-{StackName}-BaseInfra-KMS-ID` - KMS Interface Endpoint ID
- `TAK-{StackName}-BaseInfra-LOGS-ID` - CloudWatch Logs Interface Endpoint ID

**Usage Example:**
```bash
# Reference VPC ID in another stack
aws cloudformation describe-stacks --stack-name TAK-Primary-BaseInfra --query 'Stacks[0].Outputs[?OutputKey==`VpcIdOutput`].OutputValue' --output text --profile tak

# Import in another CDK stack
const vpcId = Fn.importValue('TAK-Primary-BaseInfra-VPC-ID');
```

## ACM Certificate Integration

When you provide a Route 53 hosted zone name (which is now required), the stack automatically:

1. **Looks up your existing public hosted zone** in Route 53
2. **Creates an ACM certificate** with DNS validation covering:
   - Primary domain: `your-domain.com`
   - Wildcard subdomain: `*.your-domain.com`
   - Map subdomain wildcard: `*.map.your-domain.com`
3. **Exports the certificate ARN** as `{StackName}-CERTIFICATE-ARN` for use in other stacks

**Example Usage:**
```bash
# Deploy with automatic certificate creation (R53 zone name is required)
npx cdk deploy --context r53ZoneName=tak.nz --profile tak

# Reference the certificate in other stacks
aws cloudformation describe-stacks --stack-name TAK-DevTest-BaseInfra --query 'Stacks[0].Outputs[?OutputKey==`CertificateArnOutput`].OutputValue' --output text --profile tak
```

**Requirements:**
- Public hosted zone must exist in Route 53 in the same AWS account
- Sufficient permissions to create ACM certificates and Route 53 records
- AWS account and region must be specified for hosted zone lookups

**Note:** If testing without a real hosted zone, you can mock the lookup by adding context to [`cdk.json`](cdk.json ):
```json
{
  "context": {
    "hosted-zone:account=123456789012:domainName=example.com:region=us-east-1:privateZone=false": {
      "Id": "/hostedzone/Z1PA6795UKMFR9",
      "Name": "example.com."
    }
  }
}
```

## Notes
- Make sure your AWS credentials are configured.
- The stack type (prod/dev-test) can be changed later on.
- **The R53 zone name is now mandatory** - the stack will fail to deploy without it.
- **Important**: CDK does not have a `--dry-run` flag. Use `cdk synth` or `cdk diff` for testing without deployment.

## Testing and Validation

Always test your deployment before applying changes to production:

```bash
# Validate template syntax and show what resources will be created
npx cdk synth --context r53ZoneName=your-domain.com --profile tak

# Show exactly what changes will be made (compared to current stack)
npx cdk diff --context r53ZoneName=your-domain.com --profile tak

# For production deployments, create changeset first for review
npx cdk deploy --context r53ZoneName=your-domain.com --profile tak --method prepare-change-set --change-set-name "my-review-changeset"
```

#### Testing Before Deployment (Recommended)

Before deploying, you can test and validate your changes using these commands:

```bash
# 1. Synthesize CloudFormation template (no deployment)
npx cdk synth --context r53ZoneName=tak.nz --profile tak

# 2. Check what changes would be made (no deployment)
npx cdk diff --context r53ZoneName=tak.nz --profile tak

# 3. Create changeset without executing (for review)
npx cdk deploy --context r53ZoneName=tak.nz --profile tak --method prepare-change-set

# 4. View the prepared changeset in AWS Console before executing
# Then execute with:
npx cdk deploy --context r53ZoneName=tak.nz --profile tak --method change-set
```

#### Advanced Examples: Individual Parameter Control

```bash
# Production with cost optimization - disable redundant NAT Gateway
npx cdk deploy --context envType=prod --context vpcMajorId=5 --context r53ZoneName=tak.nz --context createNatGateways=false --profile tak

# Development with specific production features for testing
npx cdk deploy --context envType=dev-test --context createVpcEndpoints=true --context r53ZoneName=tak.nz --profile tak

# Custom configuration - prod environment with cost-optimized networking
npx cdk deploy --context envType=prod --context createNatGateways=false --context r53ZoneName=tak.nz --profile tak

# Override multiple parameters
npx cdk deploy --context envType=dev-test --context createNatGateways=true --context createVpcEndpoints=true --context certificateTransparency=true --context r53ZoneName=tak.nz --profile tak

# Development environment with certificate transparency enabled for testing
npx cdk deploy --context envType=dev-test --context certificateTransparency=true --context r53ZoneName=tak.nz --profile tak
```

