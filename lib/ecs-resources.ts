import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export function createEcsResources(scope: Construct, stackName: string, vpc: ec2.IVpc) {
  // Use the L2 construct for ECS Cluster, passing the provided VPC
  const ecsCluster = new ecs.Cluster(scope, 'ECSCluster', {
    clusterName: stackName,
    vpc,
  });
  ecsCluster.enableFargateCapacityProviders();
  // Do not set addDefaultCapacityProviderStrategy for FARGATE-only clusters; FARGATE is default
  return { ecsCluster };
}
