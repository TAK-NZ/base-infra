import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { createAlerting } from '../lib/constructs/alerting';

describe('Alerting', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let ecsCluster: ecs.Cluster;
  let kmsKey: kms.Key;
  let configBucket: s3.Bucket;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    
    vpc = new ec2.Vpc(stack, 'TestVpc');
    ecsCluster = new ecs.Cluster(stack, 'TestCluster', { vpc });
    kmsKey = new kms.Key(stack, 'TestKey');
    configBucket = new s3.Bucket(stack, 'TestBucket');
  });

  describe('SNS Topic Creation', () => {
    test('creates SNS topic with email subscription', () => {
      createAlerting(stack, 'Test', {
        notificationEmail: 'test@example.com',
        ecsThresholds: { cpuUtilization: 80, memoryUtilization: 80 }
      }, { ecsCluster, kmsKey, configBucket });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'Test-CriticalAlerts',
        DisplayName: 'Test Critical Infrastructure Alerts'
      });
      
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com'
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates ECS CPU utilization alarm', () => {
      createAlerting(stack, 'Test', {
        notificationEmail: 'test@example.com',
        ecsThresholds: { cpuUtilization: 85, memoryUtilization: 80 }
      }, { ecsCluster, kmsKey, configBucket });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Test-ECS-HighCPU',
        AlarmDescription: 'ECS CPU utilization above 85%',
        Threshold: 85,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2
      });
    });

    test('creates ECS memory utilization alarm', () => {
      createAlerting(stack, 'Test', {
        notificationEmail: 'test@example.com',
        ecsThresholds: { cpuUtilization: 80, memoryUtilization: 90 }
      }, { ecsCluster, kmsKey, configBucket });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Test-ECS-HighMemory',
        AlarmDescription: 'ECS Memory utilization above 90%',
        Threshold: 90
      });
    });

    test('creates KMS failures alarm', () => {
      createAlerting(stack, 'Test', {
        notificationEmail: 'test@example.com',
        ecsThresholds: { cpuUtilization: 80, memoryUtilization: 80 }
      }, { ecsCluster, kmsKey, configBucket });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Test-KMS-RequestFailures',
        AlarmDescription: 'KMS request failures detected',
        Threshold: 1
      });
    });

    test('creates S3 errors alarm', () => {
      createAlerting(stack, 'Test', {
        notificationEmail: 'test@example.com',
        ecsThresholds: { cpuUtilization: 80, memoryUtilization: 80 }
      }, { ecsCluster, kmsKey, configBucket });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'Test-S3-Errors',
        AlarmDescription: 'S3 bucket errors detected',
        Threshold: 5
      });
    });

    test('creates correct number of alarms', () => {
      createAlerting(stack, 'Test', {
        notificationEmail: 'test@example.com',
        ecsThresholds: { cpuUtilization: 80, memoryUtilization: 80 }
      }, { ecsCluster, kmsKey, configBucket });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4);
    });
  });

  describe('Return Values', () => {
    test('returns alerting resources', () => {
      const result = createAlerting(stack, 'Test', {
        notificationEmail: 'test@example.com',
        ecsThresholds: { cpuUtilization: 80, memoryUtilization: 80 }
      }, { ecsCluster, kmsKey, configBucket });

      expect(result).toHaveProperty('criticalAlertsTopic');
      expect(result).toHaveProperty('alarms');
      expect(result.alarms).toHaveProperty('ecsCpuAlarm');
      expect(result.alarms).toHaveProperty('ecsMemoryAlarm');
      expect(result.alarms).toHaveProperty('kmsFailuresAlarm');
      expect(result.alarms).toHaveProperty('s3ErrorsAlarm');
    });
  });
});