import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { createOutputs, createConditionalOutputs } from './utils/output-helpers';
import { getOutputConfigs, getConditionalOutputConfigs } from './utils/constants';

export interface OutputParams {
  stack: cdk.Stack;
  stackName: string;
  vpc: ec2.Vpc;
  ipv6CidrBlock?: ec2.CfnVPCCidrBlock;
  vpcLogicalId?: string;
  ecsCluster: ecs.Cluster;
  ecrRepo: ecr.Repository;
  kmsKey: kms.Key;
  kmsAlias: kms.Alias;
  configBucket: s3.Bucket;
  vpcEndpoints?: Record<string, ec2.GatewayVpcEndpoint | ec2.InterfaceVpcEndpoint>;
  certificate?: acm.Certificate;
  hostedZone?: route53.IHostedZone;
}

/**
 * Registers all CloudFormation outputs for the base infrastructure stack
 * Uses helper functions to create outputs with consistent naming and structure
 */
export function registerOutputs(params: OutputParams): void {
  const { stack, stackName } = params;
  
  // Create standard outputs
  const standardOutputs = getOutputConfigs(params);
  createOutputs(stack, stackName, standardOutputs);
  
  // Create conditional outputs (only if resources exist)
  const conditionalOutputs = getConditionalOutputConfigs(params);
  createConditionalOutputs(stack, stackName, conditionalOutputs);
}
