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

  describe('Alerting Configuration', () => {
    test('creates alerting resources when enabled', () => {
      const envConfig = {
        ...app.node.tryGetContext('prod'),
        monitoring: {
          enableAlerting: true,
          enableBudgets: false,
        },
        alerting: {
          notificationEmail: 'test@example.com',
          ecsThresholds: {
            cpuUtilization: 80,
            memoryUtilization: 80,
          },
        },
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4);
    });

    test('does not create alerting when disabled', () => {
      const envConfig = {
        ...app.node.tryGetContext('dev-test'),
        monitoring: {
          enableAlerting: false,
        },
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'dev-test',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::SNS::Topic', 0);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 0);
    });
  });

  describe('Budgets Configuration', () => {
    test('creates budgets when enabled', () => {
      const envConfig = {
        ...app.node.tryGetContext('prod'),
        monitoring: {
          enableBudgets: true,
        },
        alerting: {
          notificationEmail: 'test@example.com',
        },
        budgets: {
          environmentBudget: 500,
          componentBudget: 150,
        },
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Budgets::Budget', 2);
    });

    test('does not create budgets when disabled', () => {
      const envConfig = {
        ...app.node.tryGetContext('dev-test'),
        monitoring: {
          enableBudgets: false,
        },
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'dev-test',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Budgets::Budget', 0);
    });
  });

  describe('Alerting Edge Cases', () => {
    test('does not create alerting when email is missing', () => {
      const envConfig = {
        ...app.node.tryGetContext('prod'),
        monitoring: {
          enableAlerting: true,
        },
        alerting: {
          // notificationEmail missing
          ecsThresholds: {
            cpuUtilization: 80,
            memoryUtilization: 80,
          },
        },
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::SNS::Topic', 0);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 0);
    });

    test('uses default thresholds when not specified', () => {
      const envConfig = {
        ...app.node.tryGetContext('prod'),
        monitoring: {
          enableAlerting: true,
        },
        alerting: {
          notificationEmail: 'test@example.com',
          // ecsThresholds missing - should use defaults
        },
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'TestStack-ECS-HighCPU',
        Threshold: 80 // Default value
      });
    });
  });

  describe('Budgets Edge Cases', () => {
    test('does not create budgets when email is missing', () => {
      const envConfig = {
        ...app.node.tryGetContext('prod'),
        monitoring: {
          enableBudgets: true,
        },
        budgets: {
          environmentBudget: 500,
          componentBudget: 150,
        },
        // alerting.notificationEmail missing
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Budgets::Budget', 0);
    });

    test('does not create budgets when budgets config is missing', () => {
      const envConfig = {
        ...app.node.tryGetContext('prod'),
        monitoring: {
          enableBudgets: true,
        },
        alerting: {
          notificationEmail: 'test@example.com',
        },
        // budgets config missing
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Budgets::Budget', 0);
    });

    test('uses default budget values when not specified', () => {
      const envConfig = {
        ...app.node.tryGetContext('prod'),
        monitoring: {
          enableBudgets: true,
        },
        alerting: {
          notificationEmail: 'test@example.com',
        },
        budgets: {
          // environmentBudget and componentBudget missing - should use defaults
        },
      };

      const stack = new BaseInfraStack(app, 'TestStack', {
        environment: 'prod',
        envConfig: envConfig,
        env: { account: '123456789012', region: 'us-east-1' }
      });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          BudgetName: 'TestStack-Environment-Budget',
          BudgetLimit: {
            Amount: 100, // Default value
            Unit: 'USD'
          }
        }
      });
      template.hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          BudgetName: 'TestStack-BaseInfra-Budget',
          BudgetLimit: {
            Amount: 50, // Default value
            Unit: 'USD'
          }
        }
      });
    });
  });
});