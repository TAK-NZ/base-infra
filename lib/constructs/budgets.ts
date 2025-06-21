import { Construct } from 'constructs';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as sns from 'aws-cdk-lib/aws-sns';

export interface BudgetsConfig {
  environmentBudget: number;
  componentBudget: number;
  notificationEmail: string;
}

export function createBudgets(
  scope: Construct,
  stackName: string,
  environment: string,
  config: BudgetsConfig,
  alertsTopic?: sns.Topic
) {
  const environmentName = environment === 'prod' ? 'Prod' : 'Dev';
  
  // Environment-level budget
  const environmentBudget = new budgets.CfnBudget(scope, 'EnvironmentBudget', {
    budget: {
      budgetName: `${stackName}-Environment-Budget`,
      budgetLimit: {
        amount: config.environmentBudget,
        unit: 'USD',
      },
      timeUnit: 'MONTHLY',
      budgetType: 'COST',
      costFilters: {
        TagKey: ['Environment'],
        TagValue: [environmentName],
      },
    },
    notificationsWithSubscribers: [
      {
        notification: {
          notificationType: 'ACTUAL',
          comparisonOperator: 'GREATER_THAN',
          threshold: 80,
          thresholdType: 'PERCENTAGE',
        },
        subscribers: [
          {
            subscriptionType: 'EMAIL',
            address: config.notificationEmail,
          },
        ],
      },
      {
        notification: {
          notificationType: 'FORECASTED',
          comparisonOperator: 'GREATER_THAN',
          threshold: 100,
          thresholdType: 'PERCENTAGE',
        },
        subscribers: [
          {
            subscriptionType: 'EMAIL',
            address: config.notificationEmail,
          },
        ],
      },
    ],
  });

  // Component-level budget
  const componentBudget = new budgets.CfnBudget(scope, 'ComponentBudget', {
    budget: {
      budgetName: `${stackName}-BaseInfra-Budget`,
      budgetLimit: {
        amount: config.componentBudget,
        unit: 'USD',
      },
      timeUnit: 'MONTHLY',
      budgetType: 'COST',
      costFilters: {
        TagKey: ['Component'],
        TagValue: ['BaseInfra'],
      },
    },
    notificationsWithSubscribers: [
      {
        notification: {
          notificationType: 'ACTUAL',
          comparisonOperator: 'GREATER_THAN',
          threshold: 90,
          thresholdType: 'PERCENTAGE',
        },
        subscribers: [
          {
            subscriptionType: 'EMAIL',
            address: config.notificationEmail,
          },
        ],
      },
    ],
  });

  return {
    environmentBudget,
    componentBudget,
  };
}