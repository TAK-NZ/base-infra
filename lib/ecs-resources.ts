import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';

export function createEcsResources(scope: Construct, stackName: string) {
  const ecsCluster = new ecs.CfnCluster(scope, 'ECSCluster', {
    clusterName: stackName,
    capacityProviders: ['FARGATE'],
    defaultCapacityProviderStrategy: [{ base: 0, capacityProvider: 'FARGATE', weight: 0 }],
  });
  return { ecsCluster };
}
