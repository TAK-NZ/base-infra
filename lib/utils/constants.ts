/**
 * Constants and configuration definitions
 * Centralizes magic values and reusable configurations
 */

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { OutputConfig } from './output-helpers';
import { OutputParams } from '../outputs';

/**
 * Default AWS region
 */
export const DEFAULT_AWS_REGION = 'ap-southeast-2';

/**
 * Default VPC CIDR block
 */
export const DEFAULT_VPC_CIDR = '10.0.0.0/20';

/**
 * Output configuration definitions
 * Defines all the outputs that should be created for the base infrastructure
 * Export keys are now simple descriptive names that will be prefixed with stack name
 */
export function getOutputConfigs(params: OutputParams): OutputConfig[] {
  const configs: OutputConfig[] = [
    // VPC Outputs
    {
      id: 'VpcIdOutput',
      description: 'VPC ID',
      value: params.vpc.vpcId,
      exportKey: 'VpcId',
    },
    {
      id: 'VpcCidrIpv4Output',
      description: 'VPC IPv4 CIDR Block',
      value: params.vpc.vpcCidrBlock,
      exportKey: 'VpcCidrIpv4',
    },
    
    // Subnet Outputs
    {
      id: 'SubnetPublicAOutput',
      description: 'Subnet Public A',
      value: params.vpc.publicSubnets[0].subnetId,
      exportKey: 'SubnetPublicA',
    },
    {
      id: 'SubnetPublicBOutput',
      description: 'Subnet Public B',
      value: params.vpc.publicSubnets[1].subnetId,
      exportKey: 'SubnetPublicB',
    },
    {
      id: 'SubnetPrivateAOutput',
      description: 'Subnet Private A',
      value: params.vpc.privateSubnets[0].subnetId,
      exportKey: 'SubnetPrivateA',
    },
    {
      id: 'SubnetPrivateBOutput',
      description: 'Subnet Private B',
      value: params.vpc.privateSubnets[1].subnetId,
      exportKey: 'SubnetPrivateB',
    },
    
    // Service Outputs
    {
      id: 'EcsArnOutput',
      description: 'ECS Cluster ARN',
      value: params.ecsCluster.clusterArn,
      exportKey: 'EcsClusterArn',
    },
    {
      id: 'EcrArnOutput',
      description: 'ECR Repository ARN',
      value: params.ecrRepo.repositoryArn,
      exportKey: 'EcrRepoArn',
    },
    {
      id: 'KmsArnOutput',
      description: 'KMS Key ARN',
      value: params.kmsKey.keyArn,
      exportKey: 'KmsKeyArn',
    },
    {
      id: 'KmsAliasOutput',
      description: 'KMS Key Alias',
      value: params.kmsAlias.aliasName,
      exportKey: 'KmsAlias',
    },
    {
      id: 'ConfigBucketArnOutput',
      description: 'S3 Configuration Bucket ARN',
      value: params.configBucket.bucketArn,
      exportKey: 'S3BucketArn',
    },
  ];

  return configs;
}

/**
 * Conditional output configurations
 * These outputs are only created if the related resources exist
 */
export function getConditionalOutputConfigs(params: OutputParams): Array<OutputConfig & { condition?: boolean }> {
  const configs: Array<OutputConfig & { condition?: boolean }> = [
    // IPv6 CIDR Output (only if IPv6 is enabled)
    {
      id: 'VpcCidrIpv6Output',
      description: 'VPC IPv6 CIDR Block',
      value: params.ipv6CidrBlock && params.vpcLogicalId ? {
        "Fn::Select": [
          0,
          {
            "Fn::GetAtt": [
              params.vpcLogicalId,
              "Ipv6CidrBlocks"
            ]
          }
        ]
      } : undefined,
      exportKey: 'VpcCidrIpv6',
      condition: !!(params.ipv6CidrBlock && params.vpcLogicalId),
    },
    
    // Certificate Outputs (only if certificate exists)
    {
      id: 'CertificateArnOutput',
      description: 'ACM Certificate ARN',
      value: params.certificate?.certificateArn,
      exportKey: 'CertificateArn',
      condition: !!params.certificate,
    },
    
    // Hosted Zone Outputs (only if hosted zone exists)
    {
      id: 'HostedZoneIdOutput',
      description: 'Route53 Hosted Zone ID',
      value: params.hostedZone?.hostedZoneId,
      exportKey: 'HostedZoneId',
      condition: !!params.hostedZone,
    },
    {
      id: 'HostedZoneNameOutput',
      description: 'Route53 Hosted Zone Name',
      value: params.hostedZone?.zoneName,
      exportKey: 'HostedZoneName',
      condition: !!params.hostedZone,
    },
  ];

  return configs;
}
