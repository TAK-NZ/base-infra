# TAK Base Infrastructure - Quick Reference

## Quick Comparison

### Production Configuration
```bash
# Deploy production (requires Route 53 zone)
ROUTE53_ZONE_NAME=your-domain.com npx cdk deploy --app "prod" --profile tak
```
- ✅ High availability (dual NAT Gateways)
- ✅ Private VPC endpoints for AWS services
- ✅ Fault tolerant across AZs
- ❌ Higher cost (~$91/month)

### Dev-Test Configuration  
```bash
# Deploy dev-test (default, requires Route 53 zone)
ROUTE53_ZONE_NAME=your-domain.com npx cdk deploy --profile tak
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
- 📚 Learning about TAK on AWS
- ⏰ Occasional downtime acceptable

Choose **Production** if:
- 🚀 Production workloads
- 🔒 Security compliance required
- ⚡ High availability needed
- 👥 Serving real users
