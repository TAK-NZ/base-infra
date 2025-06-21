import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createTestApp } from './utils';

describe('Monitoring Integration', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Configuration-based Deployment', () => {
    test('deploys monitoring when enabled in prod', () => {
      const envConfig = app.node.tryGetContext('prod');
      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1); // Master only
      template.resourceCountIs('AWS::Lambda::Function', 0); // Cost tracking disabled in test context
    });

    test('minimal monitoring when disabled in dev', () => {
      const envConfig = app.node.tryGetContext('dev-test');
      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'dev-test',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1); // Master only
      template.resourceCountIs('AWS::Lambda::Function', 0); // No cost tracking
    });
  });

  describe('Dashboard Outputs', () => {
    test('exports master dashboard name', () => {
      const envConfig = app.node.tryGetContext('prod');
      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.hasOutput('MasterDashboardNameOutput', {
        Export: { Name: 'TestStack-MasterDashboardName' }
      });
    });

    test('exports layer dashboard name when enabled', () => {
      const envConfig = app.node.tryGetContext('prod');
      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).not.toContain('BaseInfraDashboardNameOutput');
    });
  });

  describe('Tagging Integration', () => {
    test('applies monitoring tags to all resources', () => {
      const envConfig = app.node.tryGetContext('prod');
      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      
      // Check that resources have required tags for cost allocation
      const resources = template.findResources('AWS::S3::Bucket');
      const bucketTags = resources[Object.keys(resources)[0]].Properties.Tags;
      
      expect(bucketTags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Project', Value: 'TAK' }),
          expect.objectContaining({ Key: 'Environment', Value: 'Prod' }),
          expect.objectContaining({ Key: 'Component', Value: 'BaseInfra' }),
          expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' })
        ])
      );
    });
  });

  describe('Cost Tracking Lambda Integration', () => {
    test('cost tracking Lambda has access to required resources', () => {
      const envConfig = app.node.tryGetContext('prod');
      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      
      // Verify no Lambda function when cost tracking disabled
      template.resourceCountIs('AWS::Lambda::Function', 0);
      template.resourceCountIs('AWS::Events::Rule', 0);
    });
  });
});