import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export function createCloudWatchDashboards(scope: Construct, stackName: string, environment: string, enableLayerDashboards: boolean, vpc: ec2.IVpc, ecsCluster: ecs.Cluster, kmsKey: kms.Key, configBucket: s3.Bucket) {
  // Master dashboard that other stacks will add to
  const masterDashboard = new cloudwatch.Dashboard(scope, 'MasterDashboard', {
    dashboardName: `${stackName}-Master-Overview`,
    defaultInterval: cloudwatch.Duration.hours(1),
  });

  // BaseInfra specific dashboard (conditional)
  let baseInfraDashboard: cloudwatch.Dashboard | undefined;
  if (enableLayerDashboards) {
    baseInfraDashboard = new cloudwatch.Dashboard(scope, 'BaseInfraDashboard', {
      dashboardName: `${stackName}-BaseInfra`,
      defaultInterval: cloudwatch.Duration.hours(1),
    });
  }

  // Add BaseInfra widgets to both dashboards
  const baseInfraWidgets = createBaseInfraWidgets(vpc, ecsCluster, kmsKey, configBucket);
  const masterWidgets = createMasterDashboardWidgets(vpc, ecsCluster, kmsKey, configBucket);
  const costWidgets = createEnvironmentCostWidgets(environment);
  
  if (baseInfraDashboard) {
    baseInfraDashboard.addWidgets(...baseInfraWidgets);
  }
  masterDashboard.addWidgets(
    new cloudwatch.TextWidget({
      markdown: '# Base Infrastructure Layer',
      width: 24,
      height: 1,
    }),
    ...masterWidgets,
    ...costWidgets
  );

  return { masterDashboard, baseInfraDashboard };
}

function createBaseInfraWidgets(vpc: ec2.IVpc, ecsCluster: ecs.Cluster, kmsKey: kms.Key, configBucket: s3.Bucket): cloudwatch.IWidget[] {
  return [
    // Row 1: Infrastructure Health Overview
    new cloudwatch.SingleValueWidget({
      title: 'Infrastructure Status',
      metrics: [
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'ActiveServicesCount',
          dimensionsMap: { ClusterName: ecsCluster.clusterName },
          statistic: 'Maximum',
          label: 'Active Services',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/KMS',
          metricName: 'NumberOfRequestsSucceeded',
          dimensionsMap: { KeyId: kmsKey.keyId },
          statistic: 'Sum',
          label: 'KMS Requests',
        }),
      ],
      width: 8,
    }),
    new cloudwatch.GraphWidget({
      title: 'VPC Flow Logs',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/VPC',
          metricName: 'PacketsDroppedBySecurityGroup',
          dimensionsMap: { VpcId: vpc.vpcId },
          statistic: 'Sum',
        }),
      ],
      width: 8,
    }),
    new cloudwatch.GraphWidget({
      title: 'NAT Gateway Data',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/NATGateway',
          metricName: 'BytesOutToDestination',
          statistic: 'Sum',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/NATGateway',
          metricName: 'BytesInFromDestination',
          statistic: 'Sum',
        }),
      ],
      width: 8,
    }),

    // Row 2: ECS Cluster Details
    new cloudwatch.GraphWidget({
      title: 'ECS Cluster Resource Utilization',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'CPUUtilization',
          dimensionsMap: { ClusterName: ecsCluster.clusterName },
          statistic: 'Average',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'MemoryUtilization',
          dimensionsMap: { ClusterName: ecsCluster.clusterName },
          statistic: 'Average',
        }),
      ],
      width: 12,
    }),
    new cloudwatch.GraphWidget({
      title: 'ECS Task Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'RunningTasksCount',
          dimensionsMap: { ClusterName: ecsCluster.clusterName },
          statistic: 'Average',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'PendingTasksCount',
          dimensionsMap: { ClusterName: ecsCluster.clusterName },
          statistic: 'Average',
        }),
      ],
      width: 12,
    }),

    // Row 3: Storage & Security
    new cloudwatch.GraphWidget({
      title: 'S3 Configuration Bucket',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/S3',
          metricName: 'BucketSizeBytes',
          dimensionsMap: { BucketName: configBucket.bucketName, StorageType: 'StandardStorage' },
          statistic: 'Average',
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/S3',
          metricName: 'AllRequests',
          dimensionsMap: { BucketName: configBucket.bucketName },
          statistic: 'Sum',
        }),
      ],
      width: 12,
    }),
    new cloudwatch.GraphWidget({
      title: 'KMS Key Usage',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/KMS',
          metricName: 'NumberOfRequestsSucceeded',
          dimensionsMap: { KeyId: kmsKey.keyId },
          statistic: 'Sum',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/KMS',
          metricName: 'NumberOfRequestsFailed',
          dimensionsMap: { KeyId: kmsKey.keyId },
          statistic: 'Sum',
        }),
      ],
      width: 12,
    }),

    // Row 4: Cost & Operational Metrics
    new cloudwatch.LogQueryWidget({
      title: 'Recent CloudTrail Events',
      logGroups: ['/aws/cloudtrail/management-events'],
      queryLines: [
        'fields @timestamp, eventName, sourceIPAddress, userIdentity.type',
        'filter eventName like /Create|Delete|Update/',
        'sort @timestamp desc',
        'limit 10'
      ],
      width: 24,
      height: 6,
    }),
  ];
}

function createMasterDashboardWidgets(vpc: ec2.IVpc, ecsCluster: ecs.Cluster, kmsKey: kms.Key, configBucket: s3.Bucket): cloudwatch.IWidget[] {
  return [
    // Key metrics for master dashboard
    new cloudwatch.SingleValueWidget({
      title: 'Base Infrastructure Health',
      metrics: [
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'ActiveServicesCount',
          dimensionsMap: { ClusterName: ecsCluster.clusterName },
          statistic: 'Maximum',
          label: 'ECS Services',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/KMS',
          metricName: 'NumberOfRequestsSucceeded',
          dimensionsMap: { KeyId: kmsKey.keyId },
          statistic: 'Sum',
          label: 'KMS Requests',
        }),
      ],
      width: 8,
    }),
    new cloudwatch.GraphWidget({
      title: 'Core Resource Utilization',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'CPUUtilization',
          dimensionsMap: { ClusterName: ecsCluster.clusterName },
          statistic: 'Average',
          label: 'ECS CPU %',
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'MemoryUtilization',
          dimensionsMap: { ClusterName: ecsCluster.clusterName },
          statistic: 'Average',
          label: 'ECS Memory %',
        }),
      ],
      width: 16,
    }),
  ];
}

function createEnvironmentCostWidgets(environment: string): cloudwatch.IWidget[] {
  const environmentName = environment === 'prod' ? 'Prod' : 'Dev';
  
  return [
    // Single row with environment total and component breakdown
    new cloudwatch.SingleValueWidget({
      title: `${environmentName} Environment Total`,
      metrics: [
        new cloudwatch.Metric({
          namespace: 'AWS/Billing',
          metricName: 'EstimatedCharges',
          dimensionsMap: { Currency: 'USD' },
          statistic: 'Maximum',
          label: 'Total Cost (USD)*',
        }),
      ],
      width: 8,
    }),
    new cloudwatch.GraphWidget({
      title: `${environmentName} Cost by Component`,
      left: [
        new cloudwatch.Metric({
          namespace: 'TAK/Cost',
          metricName: 'ComponentCost',
          dimensionsMap: { 
            Environment: environmentName,
            Component: 'BaseInfra'
          },
          statistic: 'Maximum',
          label: 'BaseInfra',
        }),
        new cloudwatch.Metric({
          namespace: 'TAK/Cost',
          metricName: 'ComponentCost',
          dimensionsMap: { 
            Environment: environmentName,
            Component: 'AuthInfra'
          },
          statistic: 'Maximum',
          label: 'AuthInfra',
        }),
        new cloudwatch.Metric({
          namespace: 'TAK/Cost',
          metricName: 'ComponentCost',
          dimensionsMap: { 
            Environment: environmentName,
            Component: 'TAKInfra'
          },
          statistic: 'Maximum',
          label: 'TAKInfra',
        }),
        new cloudwatch.Metric({
          namespace: 'TAK/Cost',
          metricName: 'ComponentCost',
          dimensionsMap: { 
            Environment: environmentName,
            Component: 'VideoInfra'
          },
          statistic: 'Maximum',
          label: 'VideoInfra',
        }),
        new cloudwatch.Metric({
          namespace: 'TAK/Cost',
          metricName: 'ComponentCost',
          dimensionsMap: { 
            Environment: environmentName,
            Component: 'CloudTAK'
          },
          statistic: 'Maximum',
          label: 'CloudTAK',
        }),
      ],
      width: 16,
    }),
  ];
}