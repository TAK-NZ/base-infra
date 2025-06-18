/**
 * Constants and configuration definitions
 * Centralizes magic values and reusable configurations for the TAK-NZ base infrastructure
 */

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { OutputConfig } from './output-helpers';
import { OutputParams } from '../outputs';

/**
 * AWS Region constants
 * Predefined regions commonly used in TAK-NZ deployments
 */
export const AWS_REGIONS = {
  /** Asia Pacific (Sydney) - Primary region for TAK-NZ */
  AP_SOUTHEAST_2: 'ap-southeast-2' as const,
  /** US East (N. Virginia) - Global services region */
  US_EAST_1: 'us-east-1' as const,
} as const;

/**
 * Infrastructure default configuration values
 * These can be overridden via CDK context
 */
export const INFRASTRUCTURE_DEFAULTS = {
  /** Default AWS region for all deployments */
  DEFAULT_AWS_REGION: AWS_REGIONS.AP_SOUTHEAST_2,
  /** Default VPC CIDR block - provides ~4000 IP addresses */
  DEFAULT_VPC_CIDR: '10.0.0.0/20' as const,
  /** Maximum number of Availability Zones to use */
  MAX_AZS: 2 as const,
} as const;

// Export individual constants for backward compatibility
export const DEFAULT_AWS_REGION = INFRASTRUCTURE_DEFAULTS.DEFAULT_AWS_REGION;
export const DEFAULT_VPC_CIDR = INFRASTRUCTURE_DEFAULTS.DEFAULT_VPC_CIDR;

/**
 * Standard CloudFormation output configuration definitions
 * Defines all the outputs that should be created for the base infrastructure stack
 * 
 * Export keys are simple descriptive names that will be prefixed with stack name
 * to create unique CloudFormation export names (e.g., "MyStack-VpcId")
 * 
 * @param params - Stack resources and configuration
 * @returns Array of output configurations
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
 * Conditional CloudFormation output configurations
 * These outputs are only created if the related resources exist
 * 
 * Used for optional infrastructure components like IPv6 support,
 * SSL certificates, and Route53 hosted zones
 * 
 * @param params - Stack resources and configuration  
 * @returns Array of conditional output configurations
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
