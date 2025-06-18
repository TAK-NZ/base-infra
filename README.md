# TAK Base Infrastructure

<p align=center>Modern AWS CDK v2 infrastructure for Team Awareness Kit (TAK) deployments

## Overview

The [Team Awareness Kit (TAK)](https://tak.gov/solutions/emergency) provides Fire, Emergency Management, and First Responders an operationally agnostic tool for improved situational awareness and a common operational picture. 

This repository deploys the foundational AWS infrastructure required for a complete TAK server deployment, including networking, compute, storage, and security services.

It is specifically targeted at the deployment of [TAK.NZ](https://tak.nz) via a CI/CD pipeline. Nevertheless others interested in deploying a similar infrastructure can do so by adapting the configuration items.

### Architecture Layers

This base infrastructure supports additional application layers:

| Layer | Repository | Description |
|-------|------------|-------------|
| **Base Infrastructure** | `base-infra` (this repo) | VPC, ECS, ECR, S3, KMS, ACM |
| **Authentication Layer** | [`auth-infra`](https://github.com/TAK-NZ/auth-infra) | Authentik SSO and LDAP |
| **TAK Server Layer** | [`tak-infra`](https://github.com/TAK-NZ/tak-infra) | TAK Server deployment |

## Quick Start

### Prerequisites
- [AWS Account](https://signin.aws.amazon.com/signup) with configured credentials
- Public Route 53 hosted zone (e.g., `tak.nz`)
- [Node.js](https://nodejs.org/) and npm installed

### Installation & Deployment

```bash
# 1. Install dependencies
npm install

# 2. Bootstrap CDK (first time only)
npx cdk bootstrap --profile your-aws-profile

# 3. Deploy development environment
npm run deploy:dev

# 4. Deploy production environment  
npm run deploy:prod
```

## Infrastructure Resources

### Networking
- **VPC** with IPv4/IPv6 dual-stack support
- **Subnets** - Public and private across 2 Availability Zones
- **NAT Gateways** - Environment-specific (1 for dev, 2 for prod)
- **VPC Endpoints** - S3 Gateway + Interface endpoints (prod only)

### Compute & Storage  
- **ECS Cluster** - Fargate-enabled for containerized applications
- **ECR Repository** - Container registry with lifecycle policies
- **S3 Bucket** - Configuration storage with KMS encryption
- **KMS Key & Alias** - Application-specific encryption

### Security & DNS
- **ACM Certificate** - Wildcard SSL covering multiple subdomains:
  - Main domain (e.g., `tak.nz`)
  - Wildcard (e.g., `*.tak.nz`) 
  - Map services (e.g., `*.map.tak.nz`)
- **Security Groups** - Restrictive access controls
- **IAM Policies** - Least-privilege access patterns

## Available Environments

| Environment | Stack Name | Description | Domain | Monthly Cost* |
|-------------|------------|-------------|--------|---------------|
| `dev-test` | `TAK-Dev-BaseInfra` | Cost-optimized development | `dev.tak.nz` | ~$45 |
| `prod` | `TAK-Prod-BaseInfra` | High-availability production | `tak.nz` | ~$144 |

*Estimated AWS costs for ap-southeast-2, excluding data processing and storage usage

## Development Workflow

### New NPM Scripts (Enhanced Developer Experience)
```bash
# Development and Testing
npm run dev                    # Build and test
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Generate coverage report

# Environment-Specific Deployment
npm run deploy:dev            # Deploy to dev-test
npm run deploy:prod           # Deploy to production
npm run synth:dev             # Preview dev infrastructure
npm run synth:prod            # Preview prod infrastructure

# Infrastructure Management
npm run cdk:diff:dev          # Show what would change in dev
npm run cdk:diff:prod         # Show what would change in prod
npm run cdk:bootstrap         # Bootstrap CDK in account
```

### Configuration System

The project uses **AWS CDK context-based configuration** for consistent deployments:

- **All settings** stored in [`cdk.json`](cdk.json) under `context` section
- **Version controlled** - consistent deployments across team members
- **Runtime overrides** - use `--context` flag for one-off changes
- **Environment-specific** - separate configs for dev-test and production

#### Configuration Override Examples
```bash
# Override domain name for custom deployment
npm run deploy:dev -- --context dev-test.r53ZoneName=custom.tak.nz

# Deploy production with different VPC CIDR
npm run deploy:prod -- --context prod.vpcCidr=10.5.0.0/20

# Disable high availability features for cost savings
npm run deploy:prod -- --context prod.networking.createNatGateways=false
```

## 📚 Documentation

- **[🚀 Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Comprehensive deployment instructions and configuration options
- **[🏗️ Architecture Guide](docs/ARCHITECTURE.md)** - Technical architecture and design decisions  
- **[⚡ Quick Reference](docs/QUICK_REFERENCE.md)** - Fast deployment commands and environment comparison
- **[⚙️ Configuration Guide](docs/PARAMETERS.md)** - Complete configuration management reference
- **[🧪 Test Organization](test/TEST_ORGANIZATION.md)** - Test structure and coverage information

## Security Features

### Enterprise-Grade Security
- **🔐 ECR Repository** - Account-restricted access (no public pull permissions)
- **🔑 KMS Encryption** - All data encrypted with customer-managed keys
- **🛡️ Network Security** - Private subnets with controlled internet access
- **🔒 IAM Policies** - Least-privilege access patterns throughout
- **📋 VPC Endpoints** - Private connectivity to AWS services (production)

### Recent Security Enhancements
- ✅ **Fixed ECR vulnerability** - Replaced overly permissive `AnyPrincipal` with account-specific access
- ✅ **Enhanced network isolation** - VPC endpoints reduce internet traffic
- ✅ **Improved key management** - Centralized KMS key usage

## Getting Help

### Common Issues
- **Route53 Hosted Zone** - Ensure your domain's hosted zone exists before deployment
- **AWS Permissions** - CDK requires broad permissions for CloudFormation operations
- **First ECS Deployment** - May require service-linked role creation: `aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com`

### Support Resources
- **AWS CDK Documentation** - https://docs.aws.amazon.com/cdk/
- **TAK-NZ Project** - https://github.com/TAK-NZ/
- **Issue Tracking** - Use GitHub Issues for bug reports and feature requests