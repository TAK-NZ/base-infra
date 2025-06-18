/**
 * Constants and configuration definitions
 * Centralizes magic values and reusable configurations
 */

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { BASE_EXPORT_NAMES } from '../cloudformation-exports';
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
 */
export function getOutputConfigs(params: OutputParams): OutputConfig[] {
  const configs: OutputConfig[] = [
    // VPC Outputs
    {
      id: 'VpcIdOutput',
      description: 'VPC ID',
      value: params.vpc.vpcId,
      exportKey: BASE_EXPORT_NAMES.VPC_ID,
    },
    {
      id: 'VpcCidrIpv4Output',
      description: 'VPC IPv4 CIDR Block',
      value: params.vpc.vpcCidrBlock,
      exportKey: BASE_EXPORT_NAMES.VPC_CIDR_IPV4,
    },
    
    // Subnet Outputs
    {
      id: 'SubnetPublicAOutput',
      description: 'Subnet Public A',
      value: params.vpc.publicSubnets[0].subnetId,
      exportKey: BASE_EXPORT_NAMES.SUBNET_PUBLIC_A,
    },
    {
      id: 'SubnetPublicBOutput',
      description: 'Subnet Public B',
      value: params.vpc.publicSubnets[1].subnetId,
      exportKey: BASE_EXPORT_NAMES.SUBNET_PUBLIC_B,
    },
    {
      id: 'SubnetPrivateAOutput',
      description: 'Subnet Private A',
      value: params.vpc.privateSubnets[0].subnetId,
      exportKey: BASE_EXPORT_NAMES.SUBNET_PRIVATE_A,
    },
    {
      id: 'SubnetPrivateBOutput',
      description: 'Subnet Private B',
      value: params.vpc.privateSubnets[1].subnetId,
      exportKey: BASE_EXPORT_NAMES.SUBNET_PRIVATE_B,
    },
    
    // Service Outputs
    {
      id: 'EcsArnOutput',
      description: 'ECS Cluster ARN',
      value: params.ecsCluster.clusterArn,
      exportKey: BASE_EXPORT_NAMES.ECS_CLUSTER,
    },
    {
      id: 'EcrArnOutput',
      description: 'ECR Repository ARN',
      value: params.ecrRepo.repositoryArn,
      exportKey: BASE_EXPORT_NAMES.ECR_REPO,
    },
    {
      id: 'KmsArnOutput',
      description: 'KMS Key ARN',
      value: params.kmsKey.keyArn,
      exportKey: BASE_EXPORT_NAMES.KMS_KEY,
    },
    {
      id: 'KmsAliasOutput',
      description: 'KMS Key Alias',
      value: params.kmsAlias.aliasName,
      exportKey: BASE_EXPORT_NAMES.KMS_ALIAS,
    },
    {
      id: 'ConfigBucketArnOutput',
      description: 'S3 Configuration Bucket ARN',
      value: params.configBucket.bucketArn,
      exportKey: BASE_EXPORT_NAMES.S3_BUCKET,
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
      exportKey: BASE_EXPORT_NAMES.VPC_CIDR_IPV6,
      condition: !!(params.ipv6CidrBlock && params.vpcLogicalId),
    },
    
    // Certificate Outputs (only if certificate exists)
    {
      id: 'CertificateArnOutput',
      description: 'ACM Certificate ARN for public hosted zone',
      value: params.certificate?.certificateArn,
      exportKey: BASE_EXPORT_NAMES.CERTIFICATE_ARN,
      condition: !!params.certificate,
    },
    
    // Hosted Zone Outputs (only if hosted zone exists)
    {
      id: 'HostedZoneIdOutput',
      description: 'Route53 Hosted Zone ID',
      value: params.hostedZone?.hostedZoneId,
      exportKey: BASE_EXPORT_NAMES.HOSTED_ZONE_ID,
      condition: !!params.hostedZone,
    },
    {
      id: 'HostedZoneNameOutput',
      description: 'Route53 Hosted Zone Name',
      value: params.hostedZone?.zoneName,
      exportKey: BASE_EXPORT_NAMES.HOSTED_ZONE_NAME,
      condition: !!params.hostedZone,
    },
  ];

  return configs;
}
