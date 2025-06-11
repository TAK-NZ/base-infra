import * as cdk from 'aws-cdk-lib';
import { Fn, CfnParameter } from 'aws-cdk-lib';
import { createDynamicExportName, EXPORT_NAMES } from './stack-naming';

export interface OutputParams {
  stack: cdk.Stack;
  stackName: string;
  stackNameParam: CfnParameter;
  vpcResources: any;
  ecsCluster: any;
  ecrRepo: any;
  kmsKey: any;
  configBucket: any;
}

export function registerOutputs({ stack, stackName, stackNameParam, vpcResources, ecsCluster, ecrRepo, kmsKey, configBucket }: OutputParams) {
  const stackNameRef = Fn.ref('AWS::StackName');

  // Create dynamic export names that include the stackName parameter
  new cdk.CfnOutput(stack, 'VpcIdOutput', {
    description: 'VPC ID',
    value: vpcResources.vpc.ref,
    exportName: Fn.sub(createDynamicExportName(EXPORT_NAMES.VPC_ID), {
      StackName: stackNameParam.valueAsString
    }),
  });
  
  new cdk.CfnOutput(stack, 'VpcCidrIpv4Output', {
    description: 'VPC IPv4 CIDR Block',
    value: cdk.Fn.getAtt(vpcResources.vpc.logicalId, 'CidrBlock') as any,
    exportName: Fn.sub(createDynamicExportName(EXPORT_NAMES.VPC_CIDR_IPV4), {
      StackName: stackNameParam.valueAsString
    }),
  });
  
  new cdk.CfnOutput(stack, 'VpcCidrIpv6Output', {
    description: 'VPC IPv6 CIDR Block',
    value: { "Fn::Select": [0, { "Fn::GetAtt": [vpcResources.vpc.logicalId, "Ipv6CidrBlocks"] }] } as any,
    exportName: Fn.sub(createDynamicExportName(EXPORT_NAMES.VPC_CIDR_IPV6), {
      StackName: stackNameParam.valueAsString
    }),
  });
  
  new cdk.CfnOutput(stack, 'SubnetPublicAOutput', {
    description: 'Subnet Public A',
    value: vpcResources.subnetPublicA.ref,
    exportName: Fn.sub(createDynamicExportName(EXPORT_NAMES.SUBNET_PUBLIC_A), {
      StackName: stackNameParam.valueAsString
    }),
  });
  
  new cdk.CfnOutput(stack, 'SubnetPublicBOutput', {
    description: 'Subnet Public B',
    value: vpcResources.subnetPublicB.ref,
    exportName: Fn.sub(createDynamicExportName(EXPORT_NAMES.SUBNET_PUBLIC_B), {
      StackName: stackNameParam.valueAsString
    }),
  });
  
  new cdk.CfnOutput(stack, 'SubnetPrivateAOutput', {
    description: 'Subnet Private A',
    value: vpcResources.subnetPrivateA.ref,
    exportName: Fn.sub(createDynamicExportName(EXPORT_NAMES.SUBNET_PRIVATE_A), {
      StackName: stackNameParam.valueAsString
    }),
  });
  
  new cdk.CfnOutput(stack, 'SubnetPrivateBOutput', {
    description: 'Subnet Private B',
    value: vpcResources.subnetPrivateB.ref,
    exportName: Fn.sub(createDynamicExportName(EXPORT_NAMES.SUBNET_PRIVATE_B), {
      StackName: stackNameParam.valueAsString
    }),
  });
  
  new cdk.CfnOutput(stack, 'EcsArnOutput', {
    description: 'ECS ARN',
    value: ecsCluster.attrArn,
    exportName: Fn.sub(createDynamicExportName(EXPORT_NAMES.ECS_CLUSTER), {
      StackName: stackNameParam.valueAsString
    }),
  });
  
  new cdk.CfnOutput(stack, 'EcrArnOutput', {
    description: 'ECR ARN',
    value: ecrRepo.attrArn,
    exportName: Fn.sub(createDynamicExportName(EXPORT_NAMES.ECR_REPO), {
      StackName: stackNameParam.valueAsString
    }),
  });
  
  new cdk.CfnOutput(stack, 'KmsArnOutput', {
    description: 'KMS ARN',
    value: kmsKey.attrArn,
    exportName: Fn.sub(createDynamicExportName(EXPORT_NAMES.KMS_KEY), {
      StackName: stackNameParam.valueAsString
    }),
  });
  
  new cdk.CfnOutput(stack, 'ConfigBucketArnOutput', {
    description: 'S3 Config Bucket ARN',
    value: configBucket.attrArn,
    exportName: Fn.sub(createDynamicExportName(EXPORT_NAMES.S3_BUCKET), {
      StackName: stackNameParam.valueAsString
    }),
  });
}
