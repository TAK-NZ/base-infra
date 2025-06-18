# TAK Base Infrastructure - Quick Reference

## Quick Deployment Commands

### Using Enhanced NPM Scripts (Recommended)
```bash
# Development environment (cost-optimized)
npm run deploy:dev

# Production environment (high availability)  
npm run deploy:prod
```

### Using Direct CDK Commands
```bash
# Development environment
npx cdk deploy --context env=dev-test --profile your-aws-profile

# Production environment
npx cdk deploy --context env=prod --profile your-aws-profile
```

## Environment Comparison

### Development Environment (`dev-test`)
- ✅ **Cost optimized** (~$45/month)
- ✅ **Same core functionality** as production
- ✅ **Perfect for development** and testing
- ✅ **Quick deployment** and teardown
- ❌ **Single NAT Gateway** (potential single point of failure)
- ❌ **No VPC endpoints** (internet-routed AWS API calls)

### Production Environment (`prod`) 
- ✅ **High availability** (dual NAT Gateways across AZs)
- ✅ **Private VPC endpoints** for AWS services
- ✅ **Enhanced security** features enabled
- ✅ **Monitoring and logging** enabled
- ❌ **Higher cost** (~$144/month)

## Configuration Override Examples

```bash
# Custom domain deployment
npm run deploy:dev -- --context dev-test.r53ZoneName=custom.tak.nz

# Cost-optimized production deployment
npm run deploy:prod -- --context prod.networking.createNatGateways=false

# Custom VPC CIDR
npm run deploy:dev -- --context dev-test.vpcCidr=10.5.0.0/20

# Enable features in development
npm run deploy:dev -- --context dev-test.networking.createVpcEndpoints=true
```

## Infrastructure Resources

| Resource | Dev-Test | Production | Notes |
|----------|----------|------------|-------|
| **VPC** | 1 | 1 | IPv4/IPv6 dual-stack, /20 CIDR |
| **Subnets** | 4 | 4 | 2 public + 2 private across 2 AZs |
| **NAT Gateways** | **1** | **2** | Major cost difference |
| **VPC Endpoints** | **1** | **6** | S3 Gateway vs full interface suite |
| **ECS Cluster** | 1 | 1 | Fargate-enabled |
| **ECR Repository** | 1 | 1 | Lifecycle policies configured |
| **S3 Bucket** | 1 | 1 | KMS encrypted, config storage |
| **KMS Key + Alias** | 1 | 1 | Customer-managed encryption |
| **ACM Certificate** | 1 | 1 | Wildcard + SAN domains |

## Cost Breakdown (Estimated for ap-southeast-2)

### Development Environment (~$45/month)
- **VPC**: Free
- **Subnets**: Free  
- **NAT Gateway**: $42.48/month (1 gateway × $0.059/hour)
- **VPC Endpoints**: $0 (S3 Gateway is free)
- **ECS**: $0 (Fargate pay-per-use)
- **ECR**: ~$1/month (minimal images)
- **S3**: ~$1/month (config storage)
- **KMS**: $1/month (customer-managed key)
- **ACM**: Free
- **Data Processing**: Variable (depends on usage)

### Production Environment (~$144/month)
- **NAT Gateways**: $84.96/month (2 × $42.48)
- **VPC Endpoints**: $50.40/month (5 × $10.08)
- **Storage**: ~$2/month (ECR + S3)
- **KMS**: $1/month
- **Data Processing**: Variable (reduced via endpoints)

## Development Workflow

### Available NPM Scripts
```bash
# Development and Testing
npm run dev                   # Build and test
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate coverage report

# Infrastructure Management
npm run synth:dev            # Preview dev infrastructure
npm run synth:prod           # Preview prod infrastructure
npm run cdk:diff:dev         # Show changes for dev
npm run cdk:diff:prod        # Show changes for prod
npm run cdk:bootstrap        # Bootstrap CDK
```

## Decision Matrix

### Choose Development Environment if:
- 💰 **Cost is primary concern**
- 🧪 **Development/testing workloads**
- 📚 **Learning TAK on AWS**
- ⏰ **Occasional downtime acceptable**
- 🚀 **Rapid iteration needed**

### Choose Production Environment if:
- 🏢 **Production workloads**
- 🔒 **Security compliance required**
- ⚡ **High availability needed**
- 👥 **Serving real users**
- 📊 **Monitoring/insights required**

## Quick Links

- **[Main README](../README.md)** - Complete project overview
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Detailed deployment instructions
- **[Configuration Guide](PARAMETERS.md)** - Complete configuration reference
- **[Architecture Guide](ARCHITECTURE.md)** - Technical architecture details
