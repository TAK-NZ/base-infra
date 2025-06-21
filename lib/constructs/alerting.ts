import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Duration } from 'aws-cdk-lib';

export interface AlertingConfig {
  notificationEmail: string;
  enableSmsAlerts?: boolean;
  ecsThresholds: {
    cpuUtilization: number;
    memoryUtilization: number;
  };
}

export function createAlerting(
  scope: Construct, 
  stackName: string,
  config: AlertingConfig,
  resources: {
    ecsCluster: ecs.Cluster;
    kmsKey: kms.Key;
    configBucket: s3.Bucket;
  }
) {
  // SNS Topic for critical alerts
  const criticalAlertsTopic = new sns.Topic(scope, 'CriticalAlerts', {
    topicName: `${stackName}-CriticalAlerts`,
    displayName: `${stackName} Critical Infrastructure Alerts`,
  });

  // Email subscription
  criticalAlertsTopic.addSubscription(
    new subscriptions.EmailSubscription(config.notificationEmail)
  );

  // ECS CPU Utilization Alarm
  const ecsCpuAlarm = new cloudwatch.Alarm(scope, 'EcsCpuAlarm', {
    alarmName: `${stackName}-ECS-HighCPU`,
    alarmDescription: `ECS CPU utilization above ${config.ecsThresholds.cpuUtilization}%`,
    metric: new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'CPUUtilization',
      dimensionsMap: { ClusterName: resources.ecsCluster.clusterName },
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: config.ecsThresholds.cpuUtilization,
    evaluationPeriods: 2,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  });

  // ECS Memory Utilization Alarm
  const ecsMemoryAlarm = new cloudwatch.Alarm(scope, 'EcsMemoryAlarm', {
    alarmName: `${stackName}-ECS-HighMemory`,
    alarmDescription: `ECS Memory utilization above ${config.ecsThresholds.memoryUtilization}%`,
    metric: new cloudwatch.Metric({
      namespace: 'AWS/ECS',
      metricName: 'MemoryUtilization',
      dimensionsMap: { ClusterName: resources.ecsCluster.clusterName },
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: config.ecsThresholds.memoryUtilization,
    evaluationPeriods: 2,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  });

  // KMS Request Failures Alarm
  const kmsFailuresAlarm = new cloudwatch.Alarm(scope, 'KmsFailuresAlarm', {
    alarmName: `${stackName}-KMS-RequestFailures`,
    alarmDescription: 'KMS request failures detected',
    metric: new cloudwatch.Metric({
      namespace: 'AWS/KMS',
      metricName: 'NumberOfRequestsFailed',
      dimensionsMap: { KeyId: resources.kmsKey.keyId },
      statistic: 'Sum',
      period: Duration.minutes(5),
    }),
    threshold: 1,
    evaluationPeriods: 1,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  });

  // S3 Bucket Errors Alarm
  const s3ErrorsAlarm = new cloudwatch.Alarm(scope, 'S3ErrorsAlarm', {
    alarmName: `${stackName}-S3-Errors`,
    alarmDescription: 'S3 bucket errors detected',
    metric: new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: '4xxErrors',
      dimensionsMap: { BucketName: resources.configBucket.bucketName },
      statistic: 'Sum',
      period: Duration.minutes(5),
    }),
    threshold: 5,
    evaluationPeriods: 2,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  });

  // Add SNS actions to all alarms
  const alarms = [ecsCpuAlarm, ecsMemoryAlarm, kmsFailuresAlarm, s3ErrorsAlarm];
  alarms.forEach(alarm => {
    alarm.addAlarmAction(new actions.SnsAction(criticalAlertsTopic));
  });

  return {
    criticalAlertsTopic,
    alarms: {
      ecsCpuAlarm,
      ecsMemoryAlarm,
      kmsFailuresAlarm,
      s3ErrorsAlarm,
    },
  };
}