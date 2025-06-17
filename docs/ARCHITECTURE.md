# Architecture Documentation

## System Architecture

The TAK Base Infrastructure provides foundational AWS resources for containerized applications including networking, compute, storage, and security services. This CDK-based infrastructure creates a secure, scalable foundation that supports multiple deployment patterns.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Internet      │────│  Internet        │────│   Route 53      │
│   Traffic       │    │  Gateway         │    │   Public Zone   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                         │
                        ┌───────┴─────────┐               │
                        │                 │               │ DNS Validation
                ┌───────▼────────┐ ┌──────▼────────┐      │
                │  Public Subnet │ │ Public Subnet │      │
                │      AZ-A      │ │     AZ-B      │      │
                │                │ │               │      │
                │ ┌─────────────┐│ │┌─────────────┐│      ▼
                │ │NAT Gateway A││ ││NAT Gateway B││ ┌─────────────┐
                │ │ (Always)    ││ ││ (Optional)  ││ │     ACM     │
                │ └─────────────┘│ │└─────────────┘│ │ Certificate │
                └───────┬────────┘ └───────┬───────┘ │   (*.zone)  │
                        │                  │         └─────────────┘
                ┌───────▼────────┐ ┌──────▼────────┐
                │ Private Subnet │ │Private Subnet │
                │      AZ-A      │ │     AZ-B      │
                │                │ │               │
                │ ┌───────────────────────────────┐│
                │ │          ECS Cluster          ││
                │ │            Fargate            ││
                │ │                               ││
                │ └───────────────────────────────┘│
                └───────┬────────┘ └──────┬────────┘
                        │                 │
                        ▼                 ▼
        ┌──────────────────────────────────────────────────────┐
        │              VPC Endpoints (Optional)                │
        │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐ │
        │  │   ECR   │  │   KMS   │  │Secrets  │  │CloudWatch│ │
        │  │Interface│  │Interface│  │Manager  │  │   Logs   │ │
        │  └─────────┘  └─────────┘  └─────────┘  └──────────┘ │
        └──────────────────────────────────────────────────────┘
                        │                  │
                        ▼                  ▼
        ┌─────────────────────────────────────────────────────┐
        │                Core Services                        │
        │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
        │  │   ECR   │  │   KMS   │  │   S3    │  │   ECS   │ │
        │  │Registry │  │   Key   │  │ Config  │  │Cluster  │ │
        │  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │
        └─────────────────────────────────────────────────────┘
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
  - **dev-test**: Single NAT Gateway (cost-optimized)
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
- **Public Subnets**: 10.x.0.0/24, 10.x.1.0/24 (NAT Gateways, Internet Gateway)
- **Private Subnets**: 10.x.2.0/24, 10.x.3.0/24 (Application workloads)
- **CIDR Calculation**: `10.{vpcMajorId}.{vpcMinorId + subnet_offset}.0/24`
- **Flexibility**: Supports thousands of unique VPC configurations

#### 2. Internet Connectivity
- **Internet Gateway**: Bidirectional internet access for public subnets
- **NAT Gateway**: Outbound-only internet access for private subnets
- **Elastic IPs**: Static IP addresses for consistent outbound connectivity

#### 3. Security Groups
- **Default Security Group**: Automatically restricted (no ingress/egress rules)
- **VPC Endpoint Security**: Controlled access to AWS service endpoints
- **Principle of Least Privilege**: Minimal required access between components

## Environment Configuration System

### 1. Environment Types

#### **dev-test** (Default)
- **Focus**: Cost optimization and development efficiency
- **NAT Gateways**: Single NAT Gateway (AZ-A only)
- **VPC Endpoints**: S3 gateway endpoint only
- **Certificate Transparency**: Disabled
- **Container Insights**: Disabled
- **KMS Key Rotation**: Disabled
- **S3 Versioning**: Disabled
- **Resource Removal**: DESTROY policy (allows cleanup)

#### **prod**
- **Focus**: High availability, security, and production readiness
- **NAT Gateways**: Redundant NAT Gateways (both AZs)
- **VPC Endpoints**: Full interface endpoints (ECR, KMS, Secrets Manager, CloudWatch)
- **Certificate Transparency**: Enabled (compliance requirement)
- **Container Insights**: Enabled (monitoring and observability)
- **KMS Key Rotation**: Enabled (annual rotation)
- **S3 Versioning**: Enabled (data protection)
- **Resource Removal**: RETAIN policy (protects production resources)

#### **staging**
- **Focus**: Production-like testing with cost optimizations
- **NAT Gateways**: Redundant NAT Gateways (test HA setup)
- **VPC Endpoints**: S3 gateway only (cost optimization)
- **Certificate Transparency**: Enabled (test production certificate setup)
- **Container Insights**: Enabled (test monitoring setup)
- **KMS Key Rotation**: Disabled (cost optimization)
- **S3 Versioning**: Enabled (test data protection)
- **Resource Removal**: DESTROY policy (allows staging cleanup)

### 2. Configuration System
- **Context-Based Configuration**: Environment settings stored in `cdk.json` under `context` section
- **Environment Selection**: Simple `--context env=dev-test|prod` for environment selection
- **Runtime Overrides**: CDK's built-in `--context` flag with dot notation for specific overrides
- **Single Source of Truth**: All configuration centralized in version-controlled `cdk.json`

## Security Architecture

### 1. Encryption Strategy
- **In Transit**: TLS 1.2+ for all communications
- **At Rest**: AWS KMS encryption for all storage services
- **Key Management**: Environment-specific KMS keys with automatic rotation (prod)
- **Certificate Management**: Automated SSL/TLS certificate lifecycle

### 2. Network Security
- **VPC Isolation**: Complete network isolation per deployment
- **Security Groups**: Stateful firewall rules with least privilege
- **NACLs**: Default subnet-level network access control
- **Private Subnets**: No direct internet access for application workloads

### 3. Access Control
- **IAM Integration**: Service-linked roles and policies
- **Resource-Based Policies**: S3 bucket policies, ECR repository policies
- **Cross-Account Access**: Configurable ECR repository permissions
- **Secrets Management**: Integration points for AWS Secrets Manager

## Deployment Architecture

### 1. Infrastructure as Code
- **AWS CDK**: TypeScript-based infrastructure definitions
- **Environment Configuration**: Structured configuration system in `lib/environment-config.ts`
- **Parameter Configuration**: Config-driven parameter system in `lib/stack-config.ts`
- **Testing**: Comprehensive unit tests with 31+ test cases

### 2. Stack Naming and Exports
- **Naming Convention**: `TAK-{stackName}-BaseInfra`
- **CloudFormation Exports**: Standardized naming for cross-stack references
- **Export Patterns**: `{StackName}-{RESOURCE}-{ATTRIBUTE}`
- **Resource Identification**: Consistent tagging with project and environment metadata

### 3. Deployment Patterns
- **Single Stack**: All base infrastructure in one CloudFormation stack
- **Cross-Stack Integration**: Exports for consumption by application stacks
- **Environment Separation**: Configurable environments with isolated resources

## Cost Optimization

### 1. Environment-Based Scaling
- **Development**: Minimal redundancy, single AZ where possible
- **Production**: Full redundancy and high availability
- **Staging**: Production-like with cost optimizations

### 2. Resource Optimization
- **NAT Gateway**: Single vs. redundant based on environment
- **VPC Endpoints**: Gateway endpoints preferred for cost efficiency
- **ECS Capacity**: FARGATE_SPOT integration for cost savings
- **Storage**: Lifecycle policies and intelligent tiering

### 3. Monitoring and Alerts
- **Cost Tracking**: Resource tagging for cost allocation
- **Usage Monitoring**: CloudWatch metrics for resource utilization
- **Budget Integration**: Compatible with AWS Budgets and Cost Explorer

## Disaster Recovery and High Availability

### 1. Multi-AZ Design
- **Availability Zones**: All services deployed across 2+ AZs
- **Load Distribution**: Even distribution of resources across AZs
- **Failure Isolation**: AZ-level failure tolerance

### 2. Backup and Recovery
- **Infrastructure**: Version-controlled CDK definitions
- **Configuration**: S3 bucket with optional versioning
- **Certificates**: Automatic renewal and validation

### 3. Scaling and Resilience
- **Auto Scaling**: ECS service auto-scaling capabilities
- **Health Checks**: Built-in health monitoring for all services
- **Self-Healing**: Automatic replacement of failed resources

## Performance Considerations

### 1. Network Performance
- **VPC Endpoints**: Reduced latency for AWS service communication
- **Multiple AZs**: Load distribution and reduced latency
- **Private Connectivity**: No internet routing for internal communications

### 2. Container Performance
- **Fargate**: On-demand container execution
- **ECR**: Local image registry for fast container starts
- **Resource Allocation**: Environment-appropriate CPU and memory sizing

### 3. Monitoring and Observability
- **Container Insights**: Environment-dependent detailed monitoring
- **CloudWatch Integration**: Metrics and logging infrastructure
- **Performance Baselines**: Environment-specific performance expectations

## Integration Points

### 1. Application Integration
- **ECS Cluster**: Ready for application service deployment
- **Service Discovery**: Built-in ECS service discovery capabilities
- **Load Balancer Integration**: Prepared for ALB/NLB attachment

### 2. Data Services Integration
- **Database Subnets**: Private subnets ready for RDS deployment
- **Cache Services**: Network configuration for ElastiCache
- **File Systems**: EFS integration capability

### 3. Security Services Integration
- **Secrets Manager**: VPC endpoint configuration
- **Parameter Store**: Systems Manager integration
- **Certificate Services**: ACM certificate ready for use

## Maintenance and Operations

### 1. Update Strategy
- **CDK Updates**: Version-controlled infrastructure updates
- **Rolling Updates**: Environment-specific update procedures
- **Testing**: Staging environment for update validation

### 2. Monitoring
- **Infrastructure Monitoring**: CloudWatch metrics and alarms
- **Cost Monitoring**: Resource utilization and cost tracking
- **Security Monitoring**: VPC Flow Logs and CloudTrail integration

### 3. Troubleshooting
- **Logging**: Centralized logging infrastructure
- **Debugging**: VPC endpoint and connectivity troubleshooting
- **Performance**: Resource utilization analysis and optimization
