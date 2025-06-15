import * as cdk from 'aws-cdk-lib';
import { Fn } from 'aws-cdk-lib';
import { createDynamicExportName, BASE_EXPORT_NAMES } from './cloudformation-exports.js';

export interface OutputParams {
  stack: cdk.Stack;
  stackName: string;
  vpc: import('aws-cdk-lib/aws-ec2').Vpc;
  ipv6CidrBlock?: import('aws-cdk-lib/aws-ec2').CfnVPCCidrBlock;
  vpcLogicalId?: string;
  ecsCluster: any;
  ecrRepo: any;
  kmsKey: any;
  kmsAlias: any;
  configBucket: any;
  vpcEndpoints?: Record<string, any>;
  certificate?: any;
  hostedZone?: any;
}

export function registerOutputs({ stack, stackName, vpc, ipv6CidrBlock, vpcLogicalId, ecsCluster, ecrRepo, kmsKey, kmsAlias, configBucket, vpcEndpoints, certificate, hostedZone }: OutputParams) {
  new cdk.CfnOutput(stack, 'VpcIdOutput', {
    description: 'VPC ID',
    value: vpc.vpcId,
    exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.VPC_ID), {
      StackName: stackName,
    }),
  });
  new cdk.CfnOutput(stack, 'VpcCidrIpv4Output', {
    description: 'VPC IPv4 CIDR Block',
    value: `10.${stack.node.tryGetContext('vpcMajorId') ?? 0}.0.0/16`,
    exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.VPC_CIDR_IPV4), {
      StackName: stackName,
    }),
  });
  
  // IPv6 CIDR output - using VPC's Ipv6CidrBlocks attribute
  if (ipv6CidrBlock && vpcLogicalId) {
    new cdk.CfnOutput(stack, 'VpcCidrIpv6Output', {
      description: 'VPC IPv6 CIDR Block',
      value: {
        "Fn::Select": [
          0,
          {
            "Fn::GetAtt": [
              vpcLogicalId,
              "Ipv6CidrBlocks"
            ]
          }
        ]
      } as any,
      exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.VPC_CIDR_IPV6), {
        StackName: stackName,
      }),
    });
  }
  // Subnet outputs (explicit for A/B only)
  // Subnet outputs (static, L2 VPC)
  new cdk.CfnOutput(stack, 'SubnetPublicAOutput', {
    description: 'Subnet Public A',
    value: vpc.publicSubnets[0].subnetId,
    exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.SUBNET_PUBLIC_A), {
      StackName: stackName,
    }),
  });
  new cdk.CfnOutput(stack, 'SubnetPublicBOutput', {
    description: 'Subnet Public B',
    value: vpc.publicSubnets[1].subnetId,
    exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.SUBNET_PUBLIC_B), {
      StackName: stackName,
    }),
  });
  new cdk.CfnOutput(stack, 'SubnetPrivateAOutput', {
    description: 'Subnet Private A',
    value: vpc.privateSubnets[0].subnetId,
    exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.SUBNET_PRIVATE_A), {
      StackName: stackName,
    }),
  });
  new cdk.CfnOutput(stack, 'SubnetPrivateBOutput', {
    description: 'Subnet Private B',
    value: vpc.privateSubnets[1].subnetId,
    exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.SUBNET_PRIVATE_B), {
      StackName: stackName,
    }),
  });
  new cdk.CfnOutput(stack, 'EcsArnOutput', {
    description: 'ECS ARN',
    value: ecsCluster.clusterArn,
    exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.ECS_CLUSTER), {
      StackName: stackName,
    }),
  });
  new cdk.CfnOutput(stack, 'EcrArnOutput', {
    description: 'ECR ARN',
    value: ecrRepo.repositoryArn,
    exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.ECR_REPO), {
      StackName: stackName,
    }),
  });
  new cdk.CfnOutput(stack, 'KmsArnOutput', {
    description: 'KMS ARN',
    value: kmsKey.keyArn,
    exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.KMS_KEY), {
      StackName: stackName,
    }),
  });
  new cdk.CfnOutput(stack, 'KmsAliasOutput', {
    description: 'KMS Alias Name',
    value: kmsAlias.aliasName,
    exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.KMS_ALIAS), {
      StackName: stackName,
    }),
  });
  new cdk.CfnOutput(stack, 'ConfigBucketArnOutput', {
    description: 'S3 Config Bucket ARN',
    value: configBucket.bucketArn,
    exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.S3_BUCKET), {
      StackName: stackName,
    }),
  });
  if (vpcEndpoints) {
    Object.entries(vpcEndpoints).forEach(([key, endpoint]) => {
      if (endpoint && endpoint.vpcEndpointId) {
        // Replace underscores with hyphens for export name
        const exportKey = `${key.toUpperCase()}-ID`;
        new cdk.CfnOutput(stack, `${key}IdOutput`, {
          description: `${key} VPC Endpoint ID`,
          value: endpoint.vpcEndpointId,
          exportName: Fn.sub(createDynamicExportName(exportKey), {
            StackName: stackName,
          }),
        });
      }
      if (endpoint && endpoint.vpcEndpointType) {
        const exportKey = `${key.toUpperCase()}-ENDPOINT-TYPE`;
        new cdk.CfnOutput(stack, `${key}TypeOutput`, {
          description: `${key} VPC Endpoint Type`,
          value: endpoint.vpcEndpointType,
          exportName: Fn.sub(createDynamicExportName(exportKey), {
            StackName: stackName,
          }),
        });
      }
    });
  }
  // ACM Certificate output (if certificate exists)
  if (certificate) {
    new cdk.CfnOutput(stack, 'CertificateArnOutput', {
      description: 'ACM Certificate ARN for public hosted zone',
      value: certificate.certificateArn,
      exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.CERTIFICATE_ARN), {
        StackName: stackName,
      }),
    });
  }

  // Hosted Zone output (if hosted zone exists)
  if (hostedZone) {
    new cdk.CfnOutput(stack, 'HostedZoneIdOutput', {
      description: 'Route53 Public Hosted Zone ID',
      value: hostedZone.hostedZoneId,
      exportName: Fn.sub(createDynamicExportName(BASE_EXPORT_NAMES.HOSTED_ZONE_ID), {
        StackName: stackName,
      }),
    });
  }
}
