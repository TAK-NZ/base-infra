import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseInfraStack } from '../lib/base-infra-stack';
import { createTestApp } from './utils';

describe('BaseInfra Stack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Cost Tracking Configuration', () => {
    test('creates cost tracking Lambda when enabled', () => {
      const envConfig = {
        ...app.node.tryGetContext('prod'),
        monitoring: {
          enableCostTracking: true,
          enableLayerDashboards: false,
        }
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.resourceCountIs('AWS::Events::Rule', 1);
    });

    test('does not create cost tracking Lambda when disabled', () => {
      const envConfig = {
        ...app.node.tryGetContext('dev-test'),
        monitoring: {
          enableCostTracking: false,
          enableLayerDashboards: false,
        }
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'dev-test',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Lambda::Function', 0);
      template.resourceCountIs('AWS::Events::Rule', 0);
    });

    test('handles missing monitoring configuration', () => {
      const envConfig = {
        ...app.node.tryGetContext('dev-test')
      };
      delete envConfig.monitoring;

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'dev-test',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Lambda::Function', 0); // Defaults to false
    });
  });

  describe('Layer Dashboard Configuration', () => {
    test('creates layer dashboard when enabled', () => {
      const envConfig = {
        ...app.node.tryGetContext('prod'),
        monitoring: {
          enableCostTracking: false,
          enableLayerDashboards: true,
        }
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 2); // Master + BaseInfra
    });

    test('creates only master dashboard when layer dashboards disabled', () => {
      const envConfig = {
        ...app.node.tryGetContext('dev-test'),
        monitoring: {
          enableCostTracking: false,
          enableLayerDashboards: false,
        }
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'dev-test',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1); // Master only
    });
  });
});