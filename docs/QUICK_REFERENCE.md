# TAK Base Infrastructure - Quick Reference

## Architecture Diagrams

This folder contains AWS ## Related Documentation

- [`README.md`](README.md) - Detailed architecture documentation with comprehensive cost analysis
- [`../README.md`](../README.md) - Main project documentationtecture diagrams for the TAK Base Infrastructure project showing both deployment configurations.

### Diagrams Available

| Diagram | File | Environment | Monthly Cost | Use Case |
|---------|------|-------------|--------------|----------|
| **Production** | `tak-base-infrastructure-prod.png` | `prod` | ~$91/month | Production workloads, high availability |
| **Dev-Test** | `tak-base-infrastructure-dev-test.png` | `dev-test` | ~$35/month | Development, testing, learning |

## Quick Comparison

### Production Configuration
```bash
# Deploy production
ENV_TYPE=prod npx cdk deploy
```
- ✅ High availability (dual NAT Gateways)
- ✅ Private VPC endpoints for AWS services
- ✅ Fault tolerant across AZs
- ❌ Higher cost (~$91/month)

### Dev-Test Configuration  
```bash
# Deploy dev-test (default)
npx cdk deploy
```
- ✅ Cost optimized (~$35/month)
- ✅ Same core functionality
- ✅ Perfect for development
- ❌ Single point of failure (shared NAT Gateway)

## Key Resources Deployed

| Resource | Dev-Test | Production | Notes |
|----------|----------|------------|-------|
| VPC | 1 | 1 | /20 CIDR (4,096 IPs) |
| Subnets | 4 | 4 | 2 public + 2 private |
| NAT Gateways | **1** | **2** | Major cost difference |
| VPC Endpoints | **1** | **6** | S3 only vs full suite |
| ECS Cluster | 1 | 1 | Fargate-enabled |
| ECR Repository | 1 | 1 | Container images |
| S3 Bucket | 1 | 1 | Config storage |
| KMS Key | 1 | 1 | Encryption |

## Cost Breakdown

### Dev-Test (~$35/month)
- NAT Gateway: $32.40
- Storage (ECR+S3): $1.52  
- Data Transfer: $0.90

### Production (~$91/month)
- NAT Gateways (2x): $64.80
- VPC Endpoints (5x): $22.50
- Storage (ECR+S3): $1.52
- Data Transfer: $1.95

## Decision Matrix

Choose **Dev-Test** if:
- 💰 Cost is primary concern
- 🧪 Development/testing workloads
- 📚 Learning AWS/CDK
- ⏰ Occasional downtime acceptable

Choose **Production** if:
- 🚀 Production workloads
- 🔒 Security compliance required
- ⚡ High availability needed
- 👥 Serving real users

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Deploy dev-test (default):**
   ```bash
   npx cdk deploy
   ```

3. **Deploy production:**
   ```bash
   ENV_TYPE=prod npx cdk deploy
   ```

4. **View architecture:**
   - Open `tak-base-infrastructure-dev-test.png`
   - Open `tak-base-infrastructure-prod.png`

## Related Documentation

- [`README.md`](README.md) - Detailed architecture documentation
- [`../COST_ESTIMATION.md`](../COST_ESTIMATION.md) - Complete cost analysis
- [`../README.md`](../README.md) - Main project documentation
