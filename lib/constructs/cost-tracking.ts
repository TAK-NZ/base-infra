import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';

export function createCostTrackingLambda(scope: Construct, stackName: string) {
  // Lambda function for cost tracking
  const costTrackingFunction = new lambda.Function(scope, 'CostTrackingFunction', {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'index.handler',
    timeout: Duration.minutes(5),
    memorySize: 256,
    code: lambda.Code.fromInline(`
const { CostExplorerClient, GetCostAndUsageCommand } = require('@aws-sdk/client-cost-explorer');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

exports.handler = async (event) => {
  const costExplorer = new CostExplorerClient({});
  const cloudWatch = new CloudWatchClient({});
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  try {
    // Get costs grouped by Environment and Component tags
    const costData = await costExplorer.send(new GetCostAndUsageCommand({
      TimePeriod: {
        Start: formatDate(yesterday),
        End: formatDate(today)
      },
      Granularity: 'DAILY',
      GroupBy: [
        { Type: 'TAG', Key: 'Environment' },
        { Type: 'TAG', Key: 'Component' }
      ],
      Metrics: ['BlendedCost']
    }));
    
    // Publish metrics to CloudWatch
    const metricData = [];
    
    for (const result of costData.ResultsByTime || []) {
      for (const group of result.Groups || []) {
        const [environment, component] = group.Keys || [];
        const cost = parseFloat(group.Metrics?.BlendedCost?.Amount || '0');
        
        if (environment && component && cost > 0) {
          metricData.push({
            MetricName: 'ComponentCost',
            Dimensions: [
              { Name: 'Environment', Value: environment },
              { Name: 'Component', Value: component }
            ],
            Value: cost,
            Unit: 'None',
            Timestamp: yesterday
          });
        }
      }
    }
    
    // Batch publish metrics (max 20 per call)
    for (let i = 0; i < metricData.length; i += 20) {
      const batch = metricData.slice(i, i + 20);
      await cloudWatch.send(new PutMetricDataCommand({
        Namespace: 'TAK/Cost',
        MetricData: batch
      }));
    }
    
    console.log(\`Published \${metricData.length} cost metrics\`);
    return { statusCode: 200, body: \`Processed \${metricData.length} metrics\` };
    
  } catch (error) {
    console.error('Cost tracking error:', error);
    throw error;
  }
};
    `),
  });

  // IAM permissions for Cost Explorer and CloudWatch
  costTrackingFunction.addToRolePolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      'ce:GetCostAndUsage',
      'ce:GetUsageReport',
      'cloudwatch:PutMetricData'
    ],
    resources: ['*']
  }));

  // Schedule to run daily at 6 AM UTC
  const rule = new events.Rule(scope, 'CostTrackingSchedule', {
    schedule: events.Schedule.cron({ hour: '6', minute: '0' }),
    description: 'Daily cost tracking for TAK infrastructure'
  });

  rule.addTarget(new targets.LambdaFunction(costTrackingFunction));

  return { costTrackingFunction };
}