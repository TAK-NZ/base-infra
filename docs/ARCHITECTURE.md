# Architecture Documentation

## System Architecture

The TAK Base Infrastructure provides foundational AWS resources for containerized applications including networking, compute, storage, and security services. This CDK-based infrastructure creates a secure, scalable foundation that supports multiple deployment patterns.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Internet      │────│  Internet        │────│   Route 53      │
│   Traffic       │    │  Gateway         │    │ Public Zone     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                         │
                        ┌───────┴─────────┐               │
                        │                 │               │ DNS Validation
                ┌───────▼────────┐ ┌──────▼────────┐      │
                │  Public Subnet │ │ Public Subnet │      │
                │      AZ-A      │ │     AZ-B      │      │
                │                │ │               │      ▼
                │ ┌─────────────┐│ │┌─────────────┐│ ┌─────────────┐
                │ │NAT Gateway A││ ││NAT Gateway B││ │     ACM     │
                │ │  (Always)   ││ ││(prod only)  ││ │ Certificate │
                │ └─────────────┘│ │└─────────────┘│ │ Wildcard    │
                └───────┬────────┘ └───────┬───────┘ └─────────────┘
                        │                  │
                ┌───────▼────────┐ ┌──────▼────────┐
                │ Private Subnet │ │Private Subnet │
                │      AZ-A      │ │     AZ-B      │
                │                │ │               │
                │ ┌──────────────────────────────┐ │
                │ │      ECS Cluster (Fargate)   │ │
                │ │                              │ │
                │ │       Container Insights:    │ │ 
                │ │     dev-test=OFF | prod=ON   │ │
                │ └──────────────────────────────┘ │
                └───────┬────────┘ └──────┬────────┘
                        │                 │
                        ▼                 ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │                    VPC Endpoints                                 │
        │                                                                  │
        │  ┌─────────────┐     ┌─────────────────────────────────────────┐ │
        │  │ S3 Gateway  │     │        Interface Endpoints              │ │
        │  │ (Always)    │     │         (prod only)                     │ │
        │  └─────────────┘     │                                         │ │
        │                      │ ┌─────────┐ ┌─────────┐ ┌──────────────┐│ │
        │                      │ │   ECR   │ │   KMS   │ │ Secrets Mgr  ││ │
        │                      │ │Interface│ │Interface│ │  Interface   ││ │
        │                      │ └─────────┘ └─────────┘ └──────────────┘│ │
        │                      │                                         │ │
        │                      │ ┌──────────────┐                        │ │
        │                      │ │ CloudWatch   │                        │ │
        │                      │ │ Interface    │                        │ │
        │                      │ └──────────────┘                        │ │
        │                      └─────────────────────────────────────────┘ │
        └──────────────────────────────────────────────────────────────────┘
                        │                  │
                        ▼                  ▼
        ┌─────────────────────────────────────────────────────────────────┐
        │                      Core Services                              │
        │                                                                 │
        │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
        │  │     ECR     │  │     KMS     │  │     S3      │              │
        │  │ Repository  │  │Customer Key │  │Config Bucket│              │
        │  │             │  │             │  │             │              │
        │  │dev: 5 imgs  │  │dev: no rot  │  │dev: no ver  │              │
        │  │prod:20 imgs │  │prod: rotate │  │prod: version│              │
        │  │             │  │             │  │             │              │
        │  │dev: no scan │  │             │  │             │              │
        │  │prod: scan   │  │             │  │             │              │
        │  └─────────────┘  └─────────────┘  └─────────────┘              │
        └─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Core Infrastructure

#### 1. Virtual Private Cloud (VPC)
- **Technology**: AWS VPC with IPv4 and IPv6 CIDR blocks
- **Purpose**: Isolated network environment for all resources
- **Configuration**: Configurable IPv4 allocation using major/minor ID system
- **Subnets**: Public subnets for internet-facing resources, private subnets for application workloads
- **Availability Zones**: Multi-AZ deployment across 2 availability zones

#### 2. Network Address Translation (NAT)
- **Technology**: AWS NAT Gateway
- **Purpose**: Outbound internet access for private subnet resources
- **Configuration**: 
  - **dev-test**: Single NAT Gateway in AZ-A (cost-optimized, basic functionality)
  - **prod**: Redundant NAT Gateways in both AZs (high availability)
- **Scaling**: Environment-based configuration with override capability

#### 3. VPC Endpoints
- **Technology**: AWS VPC Interface and Gateway Endpoints
- **Purpose**: Private connectivity to AWS services without internet routing
- **Gateway Endpoints**: S3 (always created for cost efficiency)
- **Interface Endpoints**: ECR, KMS, Secrets Manager, CloudWatch Logs (environment-dependent)
- **Configuration**:
  - **dev-test**: S3 gateway endpoint only (cost-optimized)
  - **prod**: Full interface endpoints suite (security and performance)

### Compute Services

#### 1. Amazon ECS Cluster
- **Technology**: AWS ECS with Fargate capacity providers
- **Purpose**: Container orchestration platform for application workloads
- **Capacity Providers**: FARGATE and FARGATE_SPOT for cost optimization
- **Scaling**: Auto-scaling groups with CPU and memory-based policies
- **Container Insights**: Environment-dependent monitoring enablement

#### 2. Amazon ECR Repository
- **Technology**: AWS Elastic Container Registry
- **Purpose**: Private Docker container image storage
- **Lifecycle Policy**: Automated cleanup of untagged images (8-day retention)
- **Permissions**: Cross-account pull permissions for deployment flexibility
- **Scanning**: Environment-dependent vulnerability scanning

### Security Layer

#### 1. AWS Certificate Manager (ACM)
- **Technology**: SSL/TLS certificate management service
- **Purpose**: Automated certificate provisioning and renewal
- **Validation**: DNS validation using Route 53 hosted zone
- **Coverage**: Wildcard certificates for domain and subdomains (`*.zone`, `*.map.zone`)
- **Certificate Transparency**: Environment-dependent logging (disabled for dev-test, enabled for prod)

#### 2. AWS Key Management Service (KMS)
- **Technology**: AWS KMS for encryption key management
- **Purpose**: Encryption at rest for all storage services
- **Key Rotation**: Environment-dependent automatic rotation
- **Permissions**: Service-specific key policies with least privilege access
- **Alias**: Named alias for easy key reference across services

#### 3. Route 53 Integration
- **Technology**: AWS Route 53 public hosted zone lookup
- **Purpose**: DNS management and certificate validation
- **Requirement**: Existing public hosted zone must be available
- **Integration**: Automatic certificate DNS validation records

### Storage Services

#### 1. Amazon S3 Configuration Bucket
- **Technology**: AWS S3 with server-side encryption
- **Purpose**: Application configuration and static asset storage
- **Encryption**: KMS encryption using project-specific key
- **Versioning**: Environment-dependent versioning enablement
- **Lifecycle**: Environment-dependent intelligent tiering and cleanup rules
- **Security**: Block public access, enforce HTTPS, bucket owner enforced

### Network Architecture

#### 1. Subnet Design
- **VPC CIDR**: 10.0.0.0/20
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24 (NAT Gateways, Internet Gateway)
- **Private Subnets**: 10.0.2.0/24, 10.0.3.0/24 (Application workloads)

#### 2. Internet Connectivity
- **Internet Gateway**: Bidirectional internet access for public subnets
- **NAT Gateway**: Outbound-only internet access for private subnets
- **Elastic IPs**: Static IP addresses for consistent outbound connectivity

#### 3. Security Groups
- **Default Security Group**: Automatically restricted (no ingress/egress rules)
- **VPC Endpoint Security**: Controlled access to AWS service endpoints
- **Principle of Least Privilege**: Minimal required access between components

