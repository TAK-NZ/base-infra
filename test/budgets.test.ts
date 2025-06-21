import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { createBudgets } from '../lib/constructs/budgets';

describe('Budgets', () => {
  let app: cdk.App;
  let stack: cdk.Stack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
  });

  describe('Budget Creation', () => {
    test('creates environment budget with correct configuration', () => {
      createBudgets(stack, 'Test', 'prod', {
        environmentBudget: 500,
        componentBudget: 150,
        notificationEmail: 'test@example.com'
      });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          BudgetName: 'Test-Environment-Budget',
          BudgetLimit: {
            Amount: 500,
            Unit: 'USD'
          },
          TimeUnit: 'MONTHLY',
          BudgetType: 'COST',
          CostFilters: {
            TagKeyValue: ['Environment$Prod']
          }
        }
      });
    });

    test('creates component budget with correct configuration', () => {
      createBudgets(stack, 'Test', 'dev-test', {
        environmentBudget: 100,
        componentBudget: 50,
        notificationEmail: 'test@example.com'
      });

      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Budgets::Budget', {
        Budget: {
          BudgetName: 'Test-BaseInfra-Budget',
          BudgetLimit: {
            Amount: 50,
            Unit: 'USD'
          },
          CostFilters: {
            TagKeyValue: ['Component$BaseInfra']
          }
        }
      });
    });

    test('creates correct number of budgets', () => {
      createBudgets(stack, 'Test', 'prod', {
        environmentBudget: 500,
        componentBudget: 150,
        notificationEmail: 'test@example.com'
      });

      const template = Template.fromStack(stack);
      template.resourceCountIs('AWS::Budgets::Budget', 2);
    });
  });

  describe('Budget Notifications', () => {
    test('configures email notifications for environment budget', () => {
      createBudgets(stack, 'Test', 'prod', {
        environmentBudget: 500,
        componentBudget: 150,
        notificationEmail: 'alerts@example.com'
      });

      const template = Template.fromStack(stack);
      const budgets = template.findResources('AWS::Budgets::Budget');
      const environmentBudget = Object.values(budgets).find(
        (budget: any) => budget.Properties.Budget.BudgetName === 'Test-Environment-Budget'
      );

      expect(environmentBudget!.Properties.NotificationsWithSubscribers).toHaveLength(2);
      expect(environmentBudget!.Properties.NotificationsWithSubscribers[0].Subscribers[0]).toEqual({
        SubscriptionType: 'EMAIL',
        Address: 'alerts@example.com'
      });
    });

    test('configures threshold notifications correctly', () => {
      createBudgets(stack, 'Test', 'prod', {
        environmentBudget: 500,
        componentBudget: 150,
        notificationEmail: 'test@example.com'
      });

      const template = Template.fromStack(stack);
      const budgets = template.findResources('AWS::Budgets::Budget');
      const environmentBudget = Object.values(budgets).find(
        (budget: any) => budget.Properties.Budget.BudgetName === 'Test-Environment-Budget'
      );

      // Check 80% actual threshold
      expect(environmentBudget!.Properties.NotificationsWithSubscribers[0].Notification).toEqual({
        NotificationType: 'ACTUAL',
        ComparisonOperator: 'GREATER_THAN',
        Threshold: 80,
        ThresholdType: 'PERCENTAGE'
      });

      // Check 100% forecasted threshold
      expect(environmentBudget!.Properties.NotificationsWithSubscribers[1].Notification).toEqual({
        NotificationType: 'FORECASTED',
        ComparisonOperator: 'GREATER_THAN',
        Threshold: 100,
        ThresholdType: 'PERCENTAGE'
      });
    });
  });

  describe('Return Values', () => {
    test('returns budget resources', () => {
      const result = createBudgets(stack, 'Test', 'prod', {
        environmentBudget: 500,
        componentBudget: 150,
        notificationEmail: 'test@example.com'
      });

      expect(result).toHaveProperty('environmentBudget');
      expect(result).toHaveProperty('componentBudget');
    });
  });
});