import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { createCostTrackingLambda } from '../lib/constructs/cost-tracking';

describe('Cost Tracking Lambda', () => {
  let app: cdk.App;
  let stack: cdk.Stack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
  });

  describe('Lambda Function', () => {
    test('creates Lambda function with correct configuration', () => {
      createCostTrackingLambda(stack, 'Test');
      
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
        MemorySize: 256
      });
    });

    test('creates EventBridge rule for daily execution', () => {
      createCostTrackingLambda(stack, 'Test');
      
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 6 * * ? *)',
        State: 'ENABLED'
      });
    });

    test('creates IAM role with required permissions', () => {
      createCostTrackingLambda(stack, 'Test');
      
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ce:GetCostAndUsage',
                'ce:GetUsageReport',
                'cloudwatch:PutMetricData'
              ],
              Resource: '*'
            }
          ]
        }
      });
    });

    test('links EventBridge rule to Lambda function', () => {
      createCostTrackingLambda(stack, 'Test');
      
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: [
          {
            Arn: {
              'Fn::GetAtt': [
                'CostTrackingFunctionDAD9F32F',
                'Arn'
              ]
            },
            Id: 'Target0'
          }
        ]
      });
    });
  });

  describe('Lambda Code', () => {
    test('includes Cost Explorer and CloudWatch SDK imports', () => {
      createCostTrackingLambda(stack, 'Test');
      
      const template = Template.fromStack(stack);
      const lambdaFunction = template.findResources('AWS::Lambda::Function');
      const functionCode = lambdaFunction[Object.keys(lambdaFunction)[0]].Properties.Code.ZipFile;
      
      expect(functionCode).toContain('@aws-sdk/client-cost-explorer');
      expect(functionCode).toContain('@aws-sdk/client-cloudwatch');
      expect(functionCode).toContain('GetCostAndUsageCommand');
      expect(functionCode).toContain('PutMetricDataCommand');
    });

    test('configures correct grouping by Environment and Component tags', () => {
      createCostTrackingLambda(stack, 'Test');
      
      const template = Template.fromStack(stack);
      const lambdaFunction = template.findResources('AWS::Lambda::Function');
      const functionCode = lambdaFunction[Object.keys(lambdaFunction)[0]].Properties.Code.ZipFile;
      
      expect(functionCode).toContain('Environment');
      expect(functionCode).toContain('Component');
      expect(functionCode).toContain('TAK/Cost');
      expect(functionCode).toContain('ComponentCost');
    });

    test('handles error logging and metric batching', () => {
      createCostTrackingLambda(stack, 'Test');
      
      const template = Template.fromStack(stack);
      const lambdaFunction = template.findResources('AWS::Lambda::Function');
      const functionCode = lambdaFunction[Object.keys(lambdaFunction)[0]].Properties.Code.ZipFile;
      
      expect(functionCode).toContain('console.error');
      expect(functionCode).toContain('throw error');
      expect(functionCode).toContain('slice(i, i + 20)'); // Batch processing
    });
  });

  describe('Return Values', () => {
    test('returns cost tracking function reference', () => {
      const result = createCostTrackingLambda(stack, 'Test');
      
      expect(result).toHaveProperty('costTrackingFunction');
      expect(result.costTrackingFunction).toBeDefined();
    });
  });
});