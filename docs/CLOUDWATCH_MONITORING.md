# CloudWatch Monitoring & Cost Tracking Guide

This guide covers the CloudWatch dashboards, metrics, and cost tracking setup for the TAK infrastructure.

## Overview

The TAK infrastructure implements a multi-layered monitoring approach:
- **Master Dashboard**: Aggregated view across all infrastructure layers
- **Layer Dashboards**: Detailed metrics for each infrastructure layer (BaseInfra, AuthInfra, etc.)
- **Cost Tracking**: Environment and component-specific cost monitoring

## Dashboard Structure

### Master Dashboard (`{StackName}-Master-Overview`)
**Always deployed in all environments**

Provides high-level overview of:
- Infrastructure health across all layers
- Key resource utilization metrics
- Environment-specific cost breakdown by component
- Cost tracking setup status

### BaseInfra Dashboard (`{StackName}-BaseInfra`)
**Conditionally deployed based on `enableLayerDashboards` setting**
- **Dev**: Not deployed (saves $3/month)
- **Prod**: Deployed by default
- **Override**: Use `--context enableLayerDashboards=true/false`

Detailed monitoring for base infrastructure:
- **Infrastructure Status**: ECS services, S3 objects count
- **VPC Metrics**: Flow logs, security group drops
- **NAT Gateway**: Data transfer metrics
- **ECS Cluster**: CPU/Memory utilization, task counts
- **Storage & Security**: S3 bucket metrics, KMS key usage
- **Operational**: CloudTrail events log query

## Metrics Reference

### ECS Metrics
- `AWS/ECS/ActiveServicesCount`: Number of active services in cluster
- `AWS/ECS/CPUUtilization`: Average CPU usage across cluster
- `AWS/ECS/MemoryUtilization`: Average memory usage across cluster
- `AWS/ECS/RunningTasksCount`: Number of running tasks
- `AWS/ECS/PendingTasksCount`: Number of pending tasks

### VPC & Networking Metrics
- `AWS/VPC/PacketsDroppedBySecurityGroup`: Security group blocked packets
- `AWS/NATGateway/BytesOutToDestination`: Outbound data transfer
- `AWS/NATGateway/BytesInFromDestination`: Inbound data transfer

### Storage & Security Metrics
- `AWS/S3/BucketSizeBytes`: S3 bucket size in bytes
- `AWS/S3/NumberOfObjects`: Number of objects in bucket
- `AWS/S3/AllRequests`: Total S3 requests
- `AWS/KMS/NumberOfRequestsSucceeded`: Successful KMS requests
- `AWS/KMS/NumberOfRequestsFailed`: Failed KMS requests

### Cost Metrics
- `AWS/Billing/EstimatedCharges`: AWS service costs (account-level)
- `TAK/Cost/ComponentCost`: Custom component-specific costs (requires setup)

## Cost Tracking Setup

### Automated vs Manual Setup

**✅ Automated (via CDK):**
- Resource tagging across all infrastructure
- Cost tracking Lambda deployment (optional)
- CloudWatch custom metrics publishing
- EventBridge scheduling for daily cost collection

**⚠️ Manual Setup Required:**
- AWS Cost Allocation Tags activation (one-time setup)
- Cost Explorer enablement (if not already enabled)

### Prerequisites
1. **AWS Cost Allocation Tags** must be manually enabled in AWS Console
2. **Cost tracking Lambda** deployment (controlled by `enableCostTracking` flag)

### Step 1: Deploy Stack First

**Deploy your infrastructure stack:**
```bash
cdk deploy --context env=prod
```

This creates AWS resources with tags applied. **You must deploy first** because AWS only shows tag keys in the Cost Allocation Tags interface after resources with those tags exist.

### Step 2: Enable Cost Allocation Tags

1. **Navigate to AWS Billing Console** (after deployment):
   ```
   AWS Console → Billing → Cost Allocation Tags
   ```

2. **Activate Required Tags** (now visible after deployment):
   - `Project` (TAK.NZ)
   - `Environment` (Dev/Prod)
   - `Component` (BaseInfra/AuthInfra/AppInfra)
   - `ManagedBy` (CDK)
   - `Environment Type` (Dev-Test/Prod)

3. **Wait for Activation**: Tags take 24-48 hours to appear in cost reports

### Step 2: Verify Resource Tagging

All resources are automatically tagged via CDK:
```typescript
// Applied to entire stack
const standardTags = {
  Project: 'TAK.NZ',
  Environment: 'Dev' | 'Prod',
  Component: 'BaseInfra',
  ManagedBy: 'CDK',
  'Environment Type': 'Dev-Test' | 'Prod'
};
```

### Step 3: Cost Explorer Setup

1. **Enable Cost Explorer**:
   ```
   AWS Console → Cost Management → Cost Explorer
   ```

2. **Create Custom Reports**:
   - Group by: `Environment` tag
   - Filter by: `Project = TAK.NZ`
   - Time range: Last 30 days

3. **Save Reports** for regular monitoring

### Step 4: Cost Tracking Lambda (Automated)

**Enable in Configuration:**
```json
// cdk.json - environment configuration
"monitoring": {
  "enableCostTracking": true,      // Deploy cost tracking Lambda
  "enableLayerDashboards": true    // Deploy layer-specific dashboards
}
```

**Default Settings:**
- **Dev**: Both disabled (cost optimization)
- **Prod**: Both enabled (full monitoring)

**What Gets Deployed Automatically:**
- Lambda function with Cost Explorer and CloudWatch permissions
- EventBridge rule for daily execution at 6 AM UTC
- Custom metrics publishing to `TAK/Cost` namespace
- Component and environment-specific cost breakdown

**Lambda Functionality:**
- Queries Cost Explorer API daily for tag-based costs
- Groups costs by Environment (Dev/Prod) and Component (BaseInfra/AuthInfra)
- Publishes custom CloudWatch metrics for dashboard consumption
- Handles error logging and metric batching

**Cost Impact:**
- **Lambda execution**: ~$0.000002/month (essentially free)
- **Custom metrics**: ~$90/month (300 metrics × $0.30)
- **Cost optimization**: Weekly execution reduces to ~$23/month

### Step 5: Budget Alerts (Recommended)

1. **Create Environment Budgets**:
   ```
   AWS Console → Cost Management → Budgets
   ```

2. **Budget Configuration**:
   - **Type**: Cost budget
   - **Filter**: Tag `Environment = Prod`
   - **Amount**: Set monthly limit
   - **Alerts**: 80%, 100%, 120% thresholds

3. **Component Budgets** (optional):
   - Filter by `Component = BaseInfra`
   - Set component-specific limits

## Dashboard Costs

### Monthly Costs by Environment

**Development Environment:**
- **Master Dashboard**: $3.00
- **Layer Dashboard**: $0 (disabled)
- **Cost Tracking**: $0 (disabled)
- **CloudWatch Alarms**: $0 (disabled)
- **AWS Budgets**: $0 (first 2 budgets free)
- **SNS Notifications**: $0 (disabled)
- **Log Insights**: ~$0.005
- **Total**: ~$3.01/month

**Production Environment:**
- **Master Dashboard**: $3.00
- **Layer Dashboard**: $3.00
- **Cost Tracking Lambda**: ~$90.00 (if enabled)
- **CloudWatch Alarms**: $0.60 (4 alarms)
- **AWS Budgets**: $1.20 (2 additional budgets)
- **SNS Notifications**: $0.00 (first 1,000 emails free)
- **Log Insights**: ~$0.005
- **Total**: ~$97.81/month

### Configuration Options

**Dashboard Deployment:**
```json
// cdk.json
"monitoring": {
  "enableLayerDashboards": false  // Dev: saves $3/month
}
```

**Cost Tracking:**
```json
// cdk.json  
"monitoring": {
  "enableCostTracking": false     // Dev: saves $90/month
}
```

**CLI Overrides:**
```bash
# Enable layer dashboard in dev for debugging
cdk deploy --context enableLayerDashboards=true

# Disable cost tracking in prod to save costs
cdk deploy --context enableCostTracking=false
```

### Cost Optimization Strategies
- **Development**: Keep both monitoring features disabled (~$93/month savings)
- **Production**: Enable based on monitoring needs vs. cost
- **Hybrid**: Enable layer dashboards only, skip cost tracking (~$90/month savings)
- **Alternative**: Use AWS Budgets + Cost Explorer manually (~$2/month)

## Troubleshooting

### Common Issues

1. **No Cost Data by Tags**:
   - **Manual step required**: Activate cost allocation tags in AWS Billing Console
   - Wait 24-48 hours after manual activation
   - Resources are automatically tagged via CDK

2. **Missing Metrics**:
   - Ensure resources are deployed and active
   - Check CloudWatch agent is running (if applicable)
   - Verify metric namespace and dimensions

3. **Dashboard Not Loading**:
   - Check IAM permissions for CloudWatch
   - Verify dashboard name and region
   - Ensure metrics exist in the specified time range

### Useful AWS CLI Commands

```bash
# Check cost allocation tag status
aws ce get-cost-categories

# Get cost by tags (after manual setup)
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --group-by Type=TAG,Key=Environment

# List CloudWatch dashboards
aws cloudwatch list-dashboards

# Check custom cost metrics (if Lambda enabled)
aws cloudwatch list-metrics --namespace "TAK/Cost"

# Test cost tracking Lambda
aws lambda invoke --function-name "{StackName}-CostTrackingFunction" response.json
```

## Deployment Steps

### Automated (via CDK)
1. **Configure monitoring**: Set `enableCostTracking` and `enableLayerDashboards` in `cdk.json`
2. **Deploy stack**: `cdk deploy` - includes Lambda, dashboards, and tagging
3. **Verify deployment**: Check CloudWatch dashboards are created
   - Master dashboard: Always created
   - Layer dashboard: Only if `enableLayerDashboards: true`

### Manual (AWS Console) - After Deployment
1. **Enable Cost Allocation Tags** (after stack deployment): 
   - Go to Billing → Cost Allocation Tags
   - Activate: Project, Environment, Component, ManagedBy
   - Wait 24-48 hours for activation

2. **Enable Cost Explorer** (if not already enabled):
   - Go to Cost Management → Cost Explorer
   - Enable Cost Explorer (may take 24 hours)

3. **Verify Cost Data** (after 24-48 hours):
   - Check Cost Explorer shows tag-based grouping
   - Verify CloudWatch `TAK/Cost` metrics appear (if Lambda enabled)

### Monitoring
1. **Access dashboards**: CloudWatch → Dashboards
2. **Monitor costs**: Cost Explorer → Reports
3. **Set up budgets**: Cost Management → Budgets

## Troubleshooting

### Cost Tracking Issues
1. **No custom metrics appearing**:
   - Verify cost allocation tags are activated (24-48 hour delay)
   - Check Lambda execution logs in CloudWatch
   - Ensure resources have proper tags applied

2. **Lambda execution errors**:
   - Check IAM permissions for Cost Explorer and CloudWatch
   - Verify Cost Explorer is enabled in your account
   - Review Lambda function logs

3. **High costs**:
   - Disable cost tracking in dev: `enableCostTracking: false`
   - Reduce metric frequency: modify EventBridge schedule
   - Use AWS Budgets instead of custom metrics

### Manual Setup Verification
```bash
# Check if cost allocation tags are active
aws ce get-cost-categories

# Verify Cost Explorer access
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-02 --granularity DAILY --metrics BlendedCost
```

## Dashboard Visual Mockups

### Master Dashboard (`Prod-Master-Overview`)

**Always deployed in all environments**

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ # Base Infrastructure Layer                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐ ┌─────────────────────────────────────────────────────────────────┐
│ Base Infrastructure Health      │ │ Core Resource Utilization                                       │
│                                 │ │                                                                 │
│ ECS Services: 3                 │ │ ┌─ ECS CPU % ──────────────┐ ┌─ ECS Memory % ───────────────┐   │
│ KMS Requests: 1,247             │ │ │     75%                  │ │     58%                      │   │
│                                 │ │ │ █████████████████░░░░░░░ │ │ ████████████████░░░░░░░░░░░░ │   │
│                                 │ │ │                          │ │                              │   │
│                                 │ │ └──────────────────────────┘ └──────────────────────────────┘   │
└─────────────────────────────────┘ └─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐ ┌─────────────────────────────────────────────────────────────────┐
│ Prod Environment Total          │ │ Prod Cost by Component                                          │
│                                 │ │                                                                 │
│ Total Cost (USD)*: $326.39      │ │ ┌─ BaseInfra ─────────────────────────────────────────────────┐ │
│                                 │ │ │ $89.45                                                      │ │
│                                 │ │ ├─ AuthInfra ─────────────────────────────────────────────────┤ │
│                                 │ │ │ $67.23                                                      │ │
│                                 │ │ ├─ TAKInfra ──────────────────────────────────────────────────┤ │
│                                 │ │ │ $91.15                                                      │ │
│                                 │ │ ├─ VideoInfra ────────────────────────────────────────────────┤ │
│                                 │ │ │ $45.67                                                      │ │
│                                 │ │ ├─ CloudTAK ──────────────────────────────────────────────────┤ │
│                                 │ │ │ $32.89                                                      │ │
│                                 │ │ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┘ └─────────────────────────────────────────────────────────────────┘
```

### BaseInfra Dashboard (`Prod-BaseInfra`)

**Only deployed when `enableLayerDashboards: true`**

```
┌─────────────────────────────────┐ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│ Infrastructure Status           │ │ VPC Flow Logs                   │ │ NAT Gateway Data                │
│                                 │ │                                 │ │                                 │
│ Active Services: 3              │ │ ┌─ Packets Dropped ─────────┐   │ │ ┌─ Bytes Out ─────────────────┐ │
│ KMS Requests: 1,247             │ │ │     24                    │   │ │ │ 2.3 GB                      │ │
│                                 │ │ │ ████░░░░░░░░░░░░░░░░░░░░░ │   │ │ ├─ Bytes In ──────────────────┤ │
│                                 │ │ └───────────────────────────┘   │ │ │ 1.8 GB                      │ │
│                                 │ │                                 │ │ └─────────────────────────────┘ │
└─────────────────────────────────┘ └─────────────────────────────────┘ └─────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐ ┌─────────────────────────────────────┐
│ ECS Cluster Resource Utilization                                │ │ ECS Task Metrics                    │
│                                                                 │ │                                     │
│ ┌─ CPU Utilization ───────────────────────────────────────────┐ │ │ ┌─ Running Tasks ─────────────────┐ │
│ │     68%                                                     │ │ │ │     8                           │ │
│ │ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │ │ ├─ Pending Tasks ─────────────────┤ │
│ ├─ Memory Utilization ────────────────────────────────────────┤ │ │ │     0                           │ │
│ │     45%                                                     │ │ │ └─────────────────────────────────┘ │
│ │ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │ │                                     │
│ └─────────────────────────────────────────────────────────────┘ │ │                                     │
└─────────────────────────────────────────────────────────────────┘ └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐ ┌─────────────────────────────────────┐
│ S3 Configuration Bucket                                         │ │ KMS Key Usage                       │
│                                                                 │ │                                     │
│ ┌─ Bucket Size ────────────────┐ ┌─ All Requests ─────────────┐ │ │ ┌─ Requests Succeeded ────────────┐ │
│ │ 45.7 MB                      │ │     1,247                  │ │ │ │     3,456                       │ │
│ │ ████████████████████████████ │ │ ██████████████████████████ │ │ │ ├─ Requests Failed ───────────────┤ │
│ └──────────────────────────────┘ └────────────────────────────┘ │ │ │     2                           │ │
│                                                                 │ │ └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘ └─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Recent CloudTrail Events                                                                                │
│                                                                                                         │
│ 2024-01-15 14:23:45 | CreateService        | 203.0.113.45  | IAMUser                                    │
│ 2024-01-15 14:22:31 | UpdateStack          | 203.0.113.45  | IAMUser                                    │
│ 2024-01-15 14:21:18 | CreateBucket         | 203.0.113.45  | IAMUser                                    │
│ 2024-01-15 14:20:05 | UpdateSecurityGroup  | 203.0.113.45  | IAMUser                                    │
│ 2024-01-15 14:18:52 | CreateVpcEndpoint    | 203.0.113.45  | IAMUser                                    │
│ 2024-01-15 14:17:39 | UpdateTaskDefinition | 203.0.113.45  | IAMUser                                    │
│ 2024-01-15 14:16:26 | CreateKey            | 203.0.113.45  | IAMUser                                    │
│ 2024-01-15 14:15:13 | UpdateCluster        | 203.0.113.45  | IAMUser                                    │
│ 2024-01-15 14:14:00 | CreateSubnet         | 203.0.113.45  | IAMUser                                    │
│ 2024-01-15 14:12:47 | UpdateVpc            | 203.0.113.45  | IAMUser                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Dashboard Comparison

**Master Dashboard Features:**
- **Compact Overview**: Key metrics from all infrastructure layers
- **Cost Focus**: Environment-specific cost breakdown by component
- **Executive View**: High-level health and utilization metrics
- **Always Available**: Deployed in both dev and prod environments

**BaseInfra Dashboard Features:**
- **Detailed Monitoring**: Comprehensive metrics for base infrastructure
- **Operational Focus**: Detailed resource utilization and performance
- **Troubleshooting**: CloudTrail events and detailed service metrics
- **Conditional Deployment**: Only in prod (saves $3/month in dev)

**Widget Types Used:**
- **SingleValueWidget**: Current values and counts
- **GraphWidget**: Time-series charts with multiple metrics
- **LogQueryWidget**: CloudTrail event queries
- **TextWidget**: Headers and informational content

**Color Coding (in actual dashboards):**
- 🟢 **Green**: Healthy metrics, normal operation
- 🟡 **Yellow**: Warning thresholds, attention needed
- 🔴 **Red**: Critical thresholds, immediate action required
- 🔵 **Blue**: Informational metrics, neutral status

**Refresh Behavior:**
- **Auto-refresh**: Every 1 hour (configurable)
- **Manual refresh**: Available via dashboard controls
- **Time range**: Last 24 hours (adjustable)
- **Real-time**: Near real-time for most metrics (1-5 minute delay)

## Alerting & Notifications

### CloudWatch Alarms

**Automatically Created Alarms (when `enableAlerting: true`):**
- **ECS CPU Utilization** > threshold (default: 80%)
- **ECS Memory Utilization** > threshold (default: 80%)
- **KMS Request Failures** > 0 (immediate alert)
- **S3 Bucket Errors** > 5 (within 5 minutes)

**Alarm Configuration:**
- **Evaluation Period**: 2 periods of 5 minutes
- **Comparison**: Greater than threshold
- **Missing Data**: Not breaching (for KMS/S3)

**Environment Defaults:**
```json
// Dev: Higher thresholds, alerting disabled
"alerting": {
  "ecsThresholds": {
    "cpuUtilization": 85,
    "memoryUtilization": 85
  }
}

// Prod: Lower thresholds, alerting enabled
"alerting": {
  "ecsThresholds": {
    "cpuUtilization": 80,
    "memoryUtilization": 80
  }
}
```

### SNS Notifications

**Email Alerts:**
- Sent to configured `notificationEmail`
- Triggered by any alarm state change (OK → ALARM → OK)
- First 1,000 emails per month are FREE
- Additional emails: $2.00 per 100,000

**SMS Alerts (Optional):**
- Enable via `enableSmsAlerts: true`
- Cost: $0.75 per 100 SMS messages
- Recommended for critical production alerts only

**SNS Topic Export:**
- Topic ARN exported as `{StackName}-AlertsTopicArn`
- Can be imported by other stacks for additional subscriptions

## AWS Budgets

### Budget Types

**Environment Budget:**
- **Purpose**: Track total environment spending
- **Filter**: Environment tag (Dev/Prod)
- **Alerts**: 80% actual, 100% forecasted
- **Scope**: All AWS services in the environment

**Component Budget:**
- **Purpose**: Track BaseInfra component spending
- **Filter**: Component tag (BaseInfra)
- **Alerts**: 90% actual spending
- **Scope**: Resources tagged with Component=BaseInfra

**Budget Defaults:**
```json
// Dev: Lower limits for cost control
"budgets": {
  "environmentBudget": 100,    // $100/month
  "componentBudget": 50        // $50/month
}

// Prod: Higher limits for production workloads
"budgets": {
  "environmentBudget": 500,    // $500/month
  "componentBudget": 150       // $150/month
}
```

### Budget Notifications

**Email Alerts:**
- Sent to same email as CloudWatch alarms
- **Environment Budget**: 80% actual + 100% forecasted
- **Component Budget**: 90% actual only
- Notifications are FREE

**Budget Export:**
- Environment budget name exported as `{StackName}-EnvironmentBudgetName`
- Can be referenced by other stacks

### Cost Breakdown
- **First 2 budgets**: FREE (AWS free tier)
- **Additional budgets**: $0.02 per budget per day ($0.60/month)
- **Notifications**: FREE (email only)
- **Total cost**: $1.20/month for prod (2 additional budgets)

## Configuration Examples

### Enable All Monitoring Features
```json
// cdk.json - production configuration
"monitoring": {
  "enableCostTracking": true,
  "enableLayerDashboards": true,
  "enableAlerting": true,
  "enableBudgets": true
},
"alerting": {
  "notificationEmail": "alerts@tak.nz",
  "enableSmsAlerts": false,
  "ecsThresholds": {
    "cpuUtilization": 80,
    "memoryUtilization": 80
  }
},
"budgets": {
  "environmentBudget": 500,
  "componentBudget": 150
}
```

### Cost-Optimized Development
```json
// cdk.json - development configuration
"monitoring": {
  "enableCostTracking": false,     // Saves $90/month
  "enableLayerDashboards": false,  // Saves $3/month
  "enableAlerting": false,         // Saves $0.60/month
  "enableBudgets": true            // Keep for cost control
},
"budgets": {
  "environmentBudget": 100,
  "componentBudget": 50
}
```

### CLI Overrides
```bash
# Enable alerting in dev for testing
cdk deploy --context enableAlerting=true

# Override alert thresholds
cdk deploy --context "ecsThresholds.cpuUtilization=90"

# Override budget limits
cdk deploy --context environmentBudget=1000 --context componentBudget=200

# Disable cost tracking to save money
cdk deploy --context enableCostTracking=false
```

## Support

For issues:
1. **Automated components**: Check CloudFormation stack events and Lambda logs
2. **Manual setup**: AWS Billing Console documentation
3. **Cost allocation tags**: Contact AWS Support (24-48 hour activation delay is normal)
4. **Alerting issues**: Check SNS topic subscriptions and email delivery
5. **Budget alerts**: Verify budget configuration and notification settings