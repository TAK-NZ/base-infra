import * as cdk from 'aws-cdk-lib';
import { Fn } from 'aws-cdk-lib';

export interface OutputParams {
  stack: cdk.Stack;
  stackName: string;
  vpcResources: any;
  ecsCluster: any;
  ecrRepo: any;
  kmsKey: any;
  configBucket: any;
}

export function registerOutputs({ stack, stackName, vpcResources, ecsCluster, ecrRepo, kmsKey, configBucket }: OutputParams) {
  const stackNameRef = Fn.ref('AWS::StackName');

  // Use stackName for all exportName values
  new cdk.CfnOutput(stack, 'VpcIdOutput', {
    description: 'VPC ID',
    value: vpcResources.vpc.ref,
    exportName: `${stackName}-vpc-id`,
  });
  new cdk.CfnOutput(stack, 'VpcCidrIpv4Output', {
    description: 'VPC IPv4 CIDR Block',
    value: cdk.Fn.getAtt(vpcResources.vpc.logicalId, 'CidrBlock') as any,
    exportName: `${stackName}-vpc-cidr-ipv4`,
  });
  new cdk.CfnOutput(stack, 'VpcCidrIpv6Output', {
    description: 'VPC IPv6 CIDR Block',
    value: { "Fn::Select": [0, { "Fn::GetAtt": [vpcResources.vpc.logicalId, "Ipv6CidrBlocks"] }] } as any,
    exportName: `${stackName}-vpc-cidr-ipv6`,
  });
  new cdk.CfnOutput(stack, 'SubnetPublicAOutput', {
    description: 'Subnet Public A',
    value: vpcResources.subnetPublicA.ref,
    exportName: Fn.join('', [stackNameRef, '-subnet-public-a']),
  });
  new cdk.CfnOutput(stack, 'SubnetPublicBOutput', {
    description: 'Subnet Public B',
    value: vpcResources.subnetPublicB.ref,
    exportName: Fn.join('', [stackNameRef, '-subnet-public-b']),
  });
  new cdk.CfnOutput(stack, 'SubnetPrivateAOutput', {
    description: 'Subnet Private A',
    value: vpcResources.subnetPrivateA.ref,
    exportName: Fn.join('', [stackNameRef, '-subnet-private-a']),
  });
  new cdk.CfnOutput(stack, 'SubnetPrivateBOutput', {
    description: 'Subnet Private B',
    value: vpcResources.subnetPrivateB.ref,
    exportName: Fn.join('', [stackNameRef, '-subnet-private-b']),
  });
  new cdk.CfnOutput(stack, 'EcsArnOutput', {
    description: 'ECS ARN',
    value: ecsCluster.attrArn,
    exportName: `${stackName}-ecs`,
  });
  new cdk.CfnOutput(stack, 'EcrArnOutput', {
    description: 'ECR ARN',
    value: ecrRepo.attrArn,
    exportName: `${stackName}-ecr`,
  });
  new cdk.CfnOutput(stack, 'KmsArnOutput', {
    description: 'KMS ARN',
    value: kmsKey.attrArn,
    exportName: `${stackName}-kms`,
  });
  new cdk.CfnOutput(stack, 'ConfigBucketArnOutput', {
    description: 'S3 Config Bucket ARN',
    value: configBucket.attrArn,
    exportName: `${stackName}-s3`,
  });
}
