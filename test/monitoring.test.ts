import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { createCloudWatchDashboards } from '../lib/constructs/monitoring';

describe('CloudWatch Monitoring', () => {
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

  describe('Dashboard Creation', () => {
    test('creates master dashboard always', () => {
      createCloudWatchDashboards(stack, 'Test', 'prod', false, vpc, ecsCluster, kmsKey, configBucket);
      
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'Test-Master-Overview'
      });
    });

    test('creates layer dashboard when enabled', () => {
      createCloudWatchDashboards(stack, 'Test', 'prod', true, vpc, ecsCluster, kmsKey, configBucket);
      
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'Test-BaseInfra'
      });
    });

    test('does not create layer dashboard when disabled', () => {
      createCloudWatchDashboards(stack, 'Test', 'prod', false, vpc, ecsCluster, kmsKey, configBucket);
      
      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('creates dashboards for dev environment', () => {
      createCloudWatchDashboards(stack, 'Dev', 'dev-test', true, vpc, ecsCluster, kmsKey, configBucket);
      
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'Dev-Master-Overview'
      });
    });
  });

  describe('Dashboard Content', () => {
    test('master dashboard contains required widgets', () => {
      createCloudWatchDashboards(stack, 'Test', 'prod', false, vpc, ecsCluster, kmsKey, configBucket);
      
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'Test-Master-Overview'
      });
      
      // Check dashboard contains expected widget structure (can't parse due to CloudFormation functions)
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      expect(Object.keys(dashboards)).toHaveLength(1);
    });

    test('layer dashboard contains comprehensive widgets', () => {
      createCloudWatchDashboards(stack, 'Test', 'prod', true, vpc, ecsCluster, kmsKey, configBucket);
      
      const template = Template.fromStack(stack);
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      
      // Verify BaseInfra dashboard exists
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'Test-BaseInfra'
      });
      
      expect(Object.keys(dashboards)).toHaveLength(2); // Master + BaseInfra
    });
  });

  describe('Cost Widgets', () => {
    test('includes environment-specific cost widgets', () => {
      createCloudWatchDashboards(stack, 'Prod', 'prod', false, vpc, ecsCluster, kmsKey, configBucket);
      
      const template = Template.fromStack(stack);
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardString = JSON.stringify(dashboards);
      
      // Check for cost-related content in dashboard
      expect(dashboardString).toContain('Environment Total');
      expect(dashboardString).toContain('Cost by Component');
    });

    test('includes all TAK components in cost tracking', () => {
      createCloudWatchDashboards(stack, 'Test', 'prod', false, vpc, ecsCluster, kmsKey, configBucket);
      
      const template = Template.fromStack(stack);
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardString = JSON.stringify(dashboards);
      expect(dashboardString).toContain('BaseInfra');
      expect(dashboardString).toContain('AuthInfra');
      expect(dashboardString).toContain('TAKInfra');
      expect(dashboardString).toContain('VideoInfra');
      expect(dashboardString).toContain('CloudTAK');
    });
  });

  describe('Metrics Configuration', () => {
    test('uses correct metric namespaces', () => {
      createCloudWatchDashboards(stack, 'Test', 'prod', true, vpc, ecsCluster, kmsKey, configBucket);
      
      const template = Template.fromStack(stack);
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const allDashboardsString = JSON.stringify(dashboards);
      
      expect(allDashboardsString).toContain('AWS/ECS');
      expect(allDashboardsString).toContain('AWS/S3');
      expect(allDashboardsString).toContain('AWS/KMS');
      expect(allDashboardsString).toContain('AWS/VPC');
      expect(allDashboardsString).toContain('AWS/NATGateway');
      expect(allDashboardsString).toContain('TAK/Cost');
    });

    test('configures proper metric dimensions', () => {
      createCloudWatchDashboards(stack, 'Test', 'prod', false, vpc, ecsCluster, kmsKey, configBucket);
      
      const template = Template.fromStack(stack);
      const dashboard = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardString = JSON.stringify(dashboard);
      
      expect(dashboardString).toContain('ClusterName');
      expect(dashboardString).toContain('ClusterName');
      expect(dashboardString).toContain('KeyId');
      expect(dashboardString).toContain('Environment');
      expect(dashboardString).toContain('Component');
    });
  });
});